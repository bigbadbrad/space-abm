import type {
  AppointmentRow,
  BookingGroupMode,
  Channel,
  CityPeriodAggregate,
  CreativeAssetRow,
  CreativePerformanceRow,
  Diagnostics,
  EverselfConfig,
  LeadRow,
  MarketingRoiDailyByCity,
  MarketingRoiResponse,
  SpendRow,
} from './types';
import {
  daysBetweenUtc,
  isGoogleClickId,
  isLeadAttributed,
  isMetaClickId,
  leadHasAnyClickId,
  median,
  pctChange,
  percentile75,
  roundMoney,
  roundRate,
  safeDivide,
} from './metrics';

function leadDate(l: LeadRow): string {
  return l.date ?? l.created_at.slice(0, 10);
}

function parseChannel(ch: string): Channel | null {
  if (ch === 'google' || ch === 'meta') return ch;
  return null;
}

function key3(date: string, city: string, channel: Channel): string {
  return `${date}\u0001${city}\u0001${channel}`;
}

function parseKey3(k: string): { date: string; city: string; channel: Channel } {
  const [date, city, channel] = k.split('\u0001');
  return { date, city, channel: channel as Channel };
}

/** Sum spend rows; dedupe by composite key, sum metrics */
function rollupSpend(rows: SpendRow[]): Map<string, { spend: number; impressions: number; clicks: number }> {
  const m = new Map<string, { spend: number; impressions: number; clicks: number }>();
  for (const r of rows) {
    const ch = parseChannel(r.channel);
    if (!ch) continue;
    const dedupe = `${r.date}|${r.city}|${ch}|${r.campaign_id ?? ''}|${r.adset_id ?? ''}`;
    const cur = m.get(dedupe) ?? { spend: 0, impressions: 0, clicks: 0 };
    cur.spend += r.spend;
    cur.impressions += r.impressions ?? 0;
    cur.clicks += r.clicks ?? 0;
    m.set(dedupe, cur);
  }
  const byDcc = new Map<string, { spend: number; impressions: number; clicks: number }>();
  for (const [dedupe, v] of Array.from(m.entries())) {
    const parts = dedupe.split('|');
    const date = parts[0]!;
    const city = parts[1]!;
    const channel = parts[2]! as Channel;
    const k = key3(date, city, channel);
    const cur = byDcc.get(k) ?? { spend: 0, impressions: 0, clicks: 0 };
    cur.spend += v.spend;
    cur.impressions += v.impressions;
    cur.clicks += v.clicks;
    byDcc.set(k, cur);
  }
  return byDcc;
}

function rollupLeads(leads: LeadRow[]): Map<string, Set<string>> {
  const m = new Map<string, Set<string>>();
  for (const l of leads) {
    const ch = parseChannel(l.channel);
    if (!ch) continue;
    const d = leadDate(l);
    const k = key3(d, l.city, ch);
    if (!m.has(k)) m.set(k, new Set());
    m.get(k)!.add(l.lead_id);
  }
  return m;
}

function completedAtDate(ap: AppointmentRow): string | null {
  if (ap.status !== 'completed') return null;
  if (ap.completed_at) return ap.completed_at.slice(0, 10);
  return ap.booked_at.slice(0, 10);
}

type ApptMaps = {
  booked: Map<string, Set<string>>;
  completed: Map<string, Set<string>>;
};

function buildAppointmentMaps(
  appointments: AppointmentRow[],
  leadById: Map<string, LeadRow>,
  mode: BookingGroupMode
): ApptMaps {
  const booked = new Map<string, Set<string>>();
  const completed = new Map<string, Set<string>>();

  for (const ap of appointments) {
    const lead = leadById.get(ap.lead_id);
    if (!lead) continue;
    const ch = parseChannel(lead.channel);
    if (!ch) continue;
    const city = lead.city;
    const lDate = leadDate(lead);
    const bookedDay = ap.booked_at.slice(0, 10);

    if (ap.status === 'booked' || ap.status === 'completed') {
      const groupDate = mode === 'booked' ? bookedDay : lDate;
      const k = key3(groupDate, city, ch);
      if (!booked.has(k)) booked.set(k, new Set());
      booked.get(k)!.add(ap.appointment_id);
    }

    if (ap.status === 'completed') {
      const cDate = completedAtDate(ap);
      if (!cDate) continue;
      const groupDate = mode === 'booked' ? cDate : lDate;
      const k = key3(groupDate, city, ch);
      if (!completed.has(k)) completed.set(k, new Set());
      completed.get(k)!.add(ap.appointment_id);
    }
  }

  return { booked, completed };
}

/** Lag grouped by booked date + lead city/channel (spec) */
function buildLagByBookedDate(
  appointments: AppointmentRow[],
  leadById: Map<string, LeadRow>
): Map<string, number[]> {
  const lag = new Map<string, number[]>();
  for (const ap of appointments) {
    if (ap.status !== 'booked' && ap.status !== 'completed') continue;
    const lead = leadById.get(ap.lead_id);
    if (!lead) continue;
    const ch = parseChannel(lead.channel);
    if (!ch) continue;
    const bookedDay = ap.booked_at.slice(0, 10);
    const k = key3(bookedDay, lead.city, ch);
    const days = daysBetweenUtc(lead.created_at, ap.booked_at);
    if (!lag.has(k)) lag.set(k, []);
    lag.get(k)!.push(days);
  }
  return lag;
}

function attributionForLeads(leadsInBucket: LeadRow[]): MarketingRoiDailyByCity['attribution'] {
  if (leadsInBucket.length === 0) {
    return {
      lead_click_id_coverage: null,
      google_click_id_coverage: null,
      meta_click_id_coverage: null,
      unattributed_leads: 0,
    };
  }
  let withClick = 0;
  let googleLeads = 0;
  let googleWith = 0;
  let metaLeads = 0;
  let metaWith = 0;
  let unattributed = 0;
  for (const l of leadsInBucket) {
    if (leadHasAnyClickId(l)) withClick++;
    if (l.channel === 'google') {
      googleLeads++;
      if (isGoogleClickId(l)) googleWith++;
    }
    if (l.channel === 'meta') {
      metaLeads++;
      if (isMetaClickId(l)) metaWith++;
    }
    if (!isLeadAttributed(l)) unattributed++;
  }
  return {
    lead_click_id_coverage: roundRate(safeDivide(withClick, leadsInBucket.length)),
    google_click_id_coverage: googleLeads > 0 ? roundRate(safeDivide(googleWith, googleLeads)) : null,
    meta_click_id_coverage: metaLeads > 0 ? roundRate(safeDivide(metaWith, metaLeads)) : null,
    unattributed_leads: unattributed,
  };
}

function filterLeadsByKeys(
  leads: LeadRow[],
  cities: Set<string> | null,
  channels: Set<Channel> | null
): LeadRow[] {
  return leads.filter((l) => {
    const ch = parseChannel(l.channel);
    if (!ch) return false;
    if (cities && cities.size > 0 && !cities.has(l.city)) return false;
    if (channels && channels.size > 0 && !channels.has(ch)) return false;
    return true;
  });
}

function filterKeys(
  keys: Set<string>,
  start: string,
  end: string,
  cities: Set<string> | null,
  channels: Set<Channel> | null
): Set<string> {
  const out = new Set<string>();
  for (const k of Array.from(keys)) {
    const { date, city, channel } = parseKey3(k);
    if (date < start || date > end) continue;
    if (cities && cities.size > 0 && !cities.has(city)) continue;
    if (channels && channels.size > 0 && !channels.has(channel)) continue;
    out.add(k);
  }
  return out;
}

function aggregateKpisFromDaily(rows: MarketingRoiDailyByCity[]): {
  spend: number;
  leads: number;
  booked: number;
  completed: number;
  impressions: number;
  clicks: number;
} {
  let spend = 0;
  let leads = 0;
  let booked = 0;
  let completed = 0;
  let impressions = 0;
  let clicks = 0;
  for (const r of rows) {
    spend += r.spend;
    leads += r.leads;
    booked += r.booked_consults;
    completed += r.completed_consults;
    impressions += r.impressions;
    clicks += r.clicks;
  }
  return { spend, leads, booked, completed, impressions, clicks };
}

function overallMedianLag(
  appointments: AppointmentRow[],
  leadById: Map<string, LeadRow>,
  start: string,
  end: string,
  cities: Set<string> | null,
  channels: Set<Channel> | null
): number | null {
  const days: number[] = [];
  for (const ap of appointments) {
    if (ap.status !== 'booked' && ap.status !== 'completed') continue;
    const lead = leadById.get(ap.lead_id);
    if (!lead) continue;
    const ch = parseChannel(lead.channel);
    if (!ch) continue;
    if (cities && cities.size > 0 && !cities.has(lead.city)) continue;
    if (channels && channels.size > 0 && !channels.has(ch)) continue;
    const bd = ap.booked_at.slice(0, 10);
    if (bd < start || bd > end) continue;
    days.push(daysBetweenUtc(lead.created_at, ap.booked_at));
  }
  if (days.length === 0) return null;
  days.sort((a, b) => a - b);
  return median(days);
}

function headlineFromTotals(
  spend: number,
  leads: number,
  booked: number,
  completed: number,
  lagMedianApprox: number | null
): MarketingRoiResponse['kpis'] {
  const cpl = roundMoney(safeDivide(spend, leads));
  const cpb = roundMoney(safeDivide(spend, booked));
  const cpc = roundMoney(safeDivide(spend, completed));
  return {
    spend,
    leads,
    booked_consults: booked,
    completed_consults: completed,
    cost_per_lead: cpl,
    cost_per_booked: cpb,
    cost_per_completed: cpc,
    median_days_lead_to_book: lagMedianApprox != null ? roundMoney(lagMedianApprox) : null,
    deltas: {
      spend_pct: null,
      leads_pct: null,
      booked_pct: null,
      completed_pct: null,
      cpl_pct: null,
      cp_booked_pct: null,
      cp_completed_pct: null,
      median_lag_pct: null,
    },
  };
}

function buildDailyRows(params: {
  allKeys: Set<string>;
  spendMap: Map<string, { spend: number; impressions: number; clicks: number }>;
  leadsMap: Map<string, Set<string>>;
  bookedMap: Map<string, Set<string>>;
  completedMap: Map<string, Set<string>>;
  lagByBooked: Map<string, number[]>;
  leadsByKey: Map<string, LeadRow[]>;
}): MarketingRoiDailyByCity[] {
  const { allKeys, spendMap, leadsMap, bookedMap, completedMap, lagByBooked, leadsByKey } = params;
  const rows: MarketingRoiDailyByCity[] = [];
  const sortedKeys = Array.from(allKeys).sort();

  for (const k of sortedKeys) {
    const { date, city, channel } = parseKey3(k);
    const s = spendMap.get(k) ?? { spend: 0, impressions: 0, clicks: 0 };
    const leadIds = leadsMap.get(k);
    const nLeads = leadIds?.size ?? 0;
    const nBooked = bookedMap.get(k)?.size ?? 0;
    const nCompleted = completedMap.get(k)?.size ?? 0;

    const lagArr = (lagByBooked.get(k) ?? []).slice().sort((a, b) => a - b);
    const medLag = median(lagArr);
    const p75 = percentile75(lagArr);

    const leadsList = leadsByKey.get(k) ?? [];
    const attr = attributionForLeads(leadsList);

    const cost_per_lead = roundMoney(safeDivide(s.spend, nLeads));
    const cost_per_booked = roundMoney(safeDivide(s.spend, nBooked));
    const cost_per_completed = roundMoney(safeDivide(s.spend, nCompleted));
    const lead_to_book_rate = roundRate(safeDivide(nBooked, nLeads));
    const book_to_complete = roundRate(safeDivide(nCompleted, nBooked));

    rows.push({
      date,
      city,
      channel,
      spend: roundMoney(s.spend) ?? 0,
      impressions: s.impressions,
      clicks: s.clicks,
      leads: nLeads,
      booked_consults: nBooked,
      completed_consults: nCompleted,
      cost_per_lead,
      cost_per_booked,
      cost_per_completed,
      lead_to_book_rate,
      book_to_complete_rate: book_to_complete,
      median_days_lead_to_book: medLag != null ? roundMoney(medLag) : null,
      p75_days_lead_to_book: p75 != null ? roundMoney(p75) : null,
      attribution: attr,
    });
  }
  return rows;
}

function indexLeadsByKey(leads: LeadRow[]): Map<string, LeadRow[]> {
  const m = new Map<string, LeadRow[]>();
  for (const l of leads) {
    const ch = parseChannel(l.channel);
    if (!ch) continue;
    const k = key3(leadDate(l), l.city, ch);
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(l);
  }
  return m;
}

function buildPeriodCore(params: {
  spend: SpendRow[];
  rawLeads: LeadRow[];
  appointments: AppointmentRow[];
  creativeAssets: CreativeAssetRow[];
  config: EverselfConfig;
  start: string;
  end: string;
  cities: Set<string> | null;
  channels: Set<Channel> | null;
  campaignSearch: string;
  bookingGroup: BookingGroupMode;
}): Omit<MarketingRoiResponse, 'meta' | 'booking_group'> {
  const {
    spend,
    rawLeads,
    appointments,
    creativeAssets,
    config,
    start,
    end,
    cities,
    channels,
    campaignSearch,
    bookingGroup,
  } = params;

  const leadById = new Map<string, LeadRow>();
  for (const l of rawLeads) {
    leadById.set(l.lead_id, l);
  }

  let leadsForOptions = filterLeadsByKeys(rawLeads, null, channels);
  if (campaignSearch.trim()) {
    const q = campaignSearch.trim().toLowerCase();
    leadsForOptions = leadsForOptions.filter(
      (l) =>
        (l.campaign_id && l.campaign_id.toLowerCase().includes(q)) ||
        (l.utm_campaign && l.utm_campaign.toLowerCase().includes(q))
    );
  }
  const cityOpts = new Set<string>();
  for (const l of leadsForOptions) {
    const d = leadDate(l);
    if (d >= start && d <= end && l.city?.trim()) cityOpts.add(l.city);
  }
  // Markets that appear in spend but not leads (or mismatched rows) still need to be selectable.
  for (const row of spend) {
    if (row.date < start || row.date > end) continue;
    const ch = parseChannel(row.channel);
    if (!ch) continue;
    if (channels && channels.size > 0 && !channels.has(ch)) continue;
    if (campaignSearch.trim()) {
      const q = campaignSearch.trim().toLowerCase();
      if (!row.campaign_id?.toLowerCase().includes(q) && !row.campaign_name?.toLowerCase().includes(q)) continue;
    }
    if (row.city?.trim()) cityOpts.add(row.city);
  }
  const available_cities = Array.from(cityOpts).sort();

  let leads = filterLeadsByKeys(rawLeads, cities, channels);
  if (campaignSearch.trim()) {
    const q = campaignSearch.trim().toLowerCase();
    leads = leads.filter(
      (l) =>
        (l.campaign_id && l.campaign_id.toLowerCase().includes(q)) ||
        (l.utm_campaign && l.utm_campaign.toLowerCase().includes(q))
    );
  }

  const spendFiltered = spend.filter((r) => {
    const ch = parseChannel(r.channel);
    if (!ch) return false;
    if (r.date < start || r.date > end) return false;
    if (cities && cities.size > 0 && !cities.has(r.city)) return false;
    if (channels && channels.size > 0 && !channels.has(ch)) return false;
    if (campaignSearch.trim()) {
      const q = campaignSearch.trim().toLowerCase();
      if (!r.campaign_id?.toLowerCase().includes(q) && !r.campaign_name?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const spendMap = rollupSpend(spendFiltered);
  const leadsInRange = leads.filter((l) => {
    const d = leadDate(l);
    return d >= start && d <= end;
  });
  const leadsMap = rollupLeads(leadsInRange);

  const { booked: bookedMap, completed: completedMap } = buildAppointmentMaps(appointments, leadById, bookingGroup);

  const lagByBooked = buildLagByBookedDate(appointments, leadById);
  const leadsByKey = indexLeadsByKey(leadsInRange);

  const allKeys = new Set<string>([
    ...Array.from(spendMap.keys()),
    ...Array.from(leadsMap.keys()),
    ...Array.from(bookedMap.keys()),
    ...Array.from(completedMap.keys()),
  ]);
  const filteredKeys = filterKeys(allKeys, start, end, cities, channels);

  const periodRows = buildDailyRows({
    allKeys: filteredKeys,
    spendMap,
    leadsMap,
    bookedMap,
    completedMap,
    lagByBooked,
    leadsByKey,
  });

  const t = aggregateKpisFromDaily(periodRows);
  const lagMedianOverall = overallMedianLag(appointments, leadById, start, end, cities, channels);

  const kpis = headlineFromTotals(t.spend, t.leads, t.booked, t.completed, lagMedianOverall);

  const byCityMap = new Map<
    string,
    { spend: number; leads: number; booked: number; completed: number; impressions: number; clicks: number; lagMedians: number[] }
  >();
  for (const r of periodRows) {
    if (!byCityMap.has(r.city)) {
      byCityMap.set(r.city, { spend: 0, leads: 0, booked: 0, completed: 0, impressions: 0, clicks: 0, lagMedians: [] });
    }
    const c = byCityMap.get(r.city)!;
    c.spend += r.spend;
    c.leads += r.leads;
    c.booked += r.booked_consults;
    c.completed += r.completed_consults;
    c.impressions += r.impressions;
    c.clicks += r.clicks;
    if (r.median_days_lead_to_book != null) c.lagMedians.push(r.median_days_lead_to_book);
  }

  const targets = config.targets;
  const by_city: CityPeriodAggregate[] = Array.from(byCityMap.entries()).map(([city, v]) => {
    const cpl = roundMoney(safeDivide(v.spend, v.leads));
    const cpb = roundMoney(safeDivide(v.spend, v.booked));
    const cpc = roundMoney(safeDivide(v.spend, v.completed));
    const l2b = roundRate(safeDivide(v.booked, v.leads));
    const b2c = roundRate(safeDivide(v.completed, v.booked));
    const medLag =
      v.lagMedians.length > 0 ? median(v.lagMedians.slice().sort((a: number, b: number) => a - b)) : null;

    let scale_signal: CityPeriodAggregate['scale_signal'] = 'yellow';
    const cpbVal = cpb ?? Infinity;
    const l2bVal = l2b ?? 0;
    if (
      v.booked >= targets.min_booked_consults_for_confidence &&
      cpbVal <= targets.cost_per_booked &&
      l2bVal >= targets.lead_to_book_rate_min
    ) {
      scale_signal = 'green';
    } else if (cpbVal > targets.cost_per_booked * 1.2 || l2bVal < targets.lead_to_book_rate_min) {
      scale_signal = 'red';
    } else {
      scale_signal = 'yellow';
    }

    return {
      city,
      spend: v.spend,
      leads: v.leads,
      booked_consults: v.booked,
      completed_consults: v.completed,
      impressions: v.impressions,
      clicks: v.clicks,
      cost_per_lead: cpl,
      cost_per_booked: cpb,
      cost_per_completed: cpc,
      lead_to_book_rate: l2b,
      book_to_complete_rate: b2c,
      median_days_lead_to_book: medLag != null ? roundMoney(medLag) : null,
      scale_signal,
    };
  });

  by_city.sort((a, b) => {
    const ac = a.cost_per_booked ?? Infinity;
    const bc = b.cost_per_booked ?? Infinity;
    if (a.spend <= 0 && b.spend > 0) return 1;
    if (b.spend <= 0 && a.spend > 0) return -1;
    return ac - bc;
  });

  const by_channel: MarketingRoiResponse['by_channel'] = [];
  for (const ch of ['google', 'meta'] as Channel[]) {
    const sub = periodRows.filter((r) => r.channel === ch);
    let spendC = 0;
    let leadsC = 0;
    let bookedC = 0;
    let completedC = 0;
    let impC = 0;
    let clkC = 0;
    for (const r of sub) {
      spendC += r.spend;
      leadsC += r.leads;
      bookedC += r.booked_consults;
      completedC += r.completed_consults;
      impC += r.impressions;
      clkC += r.clicks;
    }
    by_channel.push({ channel: ch, spend: spendC, leads: leadsC, booked_consults: bookedC, completed_consults: completedC, impressions: impC, clicks: clkC });
  }

  const diagnostics = buildDiagnostics(leadsInRange, t);

  const creative = buildCreativeGrid(leads, appointments, leadById, creativeAssets);

  const trend = buildTrend(periodRows, start, end);

  return {
    config,
    kpis,
    daily: periodRows,
    by_city,
    by_channel,
    creative,
    diagnostics,
    trend,
    available_cities,
  };
}

export function computeMarketingRoi(params: {
  spend: SpendRow[];
  leads: LeadRow[];
  appointments: AppointmentRow[];
  creativeAssets: CreativeAssetRow[];
  config: EverselfConfig;
  start: string;
  end: string;
  cities: string[];
  channels: Channel[];
  bookingGroup: BookingGroupMode;
  campaignSearch: string;
}): MarketingRoiResponse {
  const {
    spend,
    leads: rawLeads,
    appointments,
    creativeAssets,
    config,
    start,
    end,
    cities: cityFilter,
    channels: channelFilter,
    campaignSearch,
    bookingGroup,
  } = params;

  const cities = cityFilter.length > 0 ? new Set(cityFilter) : null;
  const channels = channelFilter.length > 0 ? new Set<Channel>(channelFilter) : null;

  const baseArgs = {
    spend,
    rawLeads,
    appointments,
    creativeAssets,
    config,
    cities,
    channels,
    campaignSearch,
    bookingGroup,
  };

  const cur = buildPeriodCore({ ...baseArgs, start, end });

  const prevEnd = new Date(`${start}T00:00:00Z`);
  prevEnd.setUTCDate(prevEnd.getUTCDate() - 1);
  const prevStart = new Date(prevEnd);
  const days =
    Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / (24 * 60 * 60 * 1000)) + 1;
  prevStart.setUTCDate(prevStart.getUTCDate() - (days - 1));
  const pStart = prevStart.toISOString().slice(0, 10);
  const pEnd = prevEnd.toISOString().slice(0, 10);

  const prev = buildPeriodCore({ ...baseArgs, start: pStart, end: pEnd });

  const k = cur.kpis;
  const p = prev.kpis;

  k.deltas = {
    spend_pct: roundRate(pctChange(k.spend, p.spend)),
    leads_pct: roundRate(pctChange(k.leads, p.leads)),
    booked_pct: roundRate(pctChange(k.booked_consults, p.booked_consults)),
    completed_pct: roundRate(pctChange(k.completed_consults, p.completed_consults)),
    cpl_pct:
      k.cost_per_lead != null && p.cost_per_lead != null ? roundRate(pctChange(k.cost_per_lead, p.cost_per_lead)) : null,
    cp_booked_pct:
      k.cost_per_booked != null && p.cost_per_booked != null
        ? roundRate(pctChange(k.cost_per_booked, p.cost_per_booked))
        : null,
    cp_completed_pct:
      k.cost_per_completed != null && p.cost_per_completed != null
        ? roundRate(pctChange(k.cost_per_completed, p.cost_per_completed))
        : null,
    median_lag_pct:
      k.median_days_lead_to_book != null && p.median_days_lead_to_book != null
        ? roundRate(pctChange(k.median_days_lead_to_book, p.median_days_lead_to_book))
        : null,
  };

  return {
    meta: { generated_at: new Date().toISOString(), source: 'json-demo' },
    config,
    booking_group: bookingGroup,
    available_cities: cur.available_cities,
    kpis: k,
    daily: cur.daily,
    by_city: cur.by_city,
    by_channel: cur.by_channel,
    creative: cur.creative,
    diagnostics: cur.diagnostics,
    trend: cur.trend,
  };
}

function buildDiagnostics(
  leadsInPeriod: LeadRow[],
  totals: { spend: number; impressions: number; clicks: number; leads: number; booked: number }
): Diagnostics {
  const n = leadsInPeriod.length;
  let missingCity = 0;
  let missingChannel = 0;
  let missingCamp = 0;
  let unattributed = 0;
  let attributed = 0;
  let withClick = 0;
  let googleLeads = 0;
  let googleWith = 0;
  let metaLeads = 0;
  let metaWith = 0;

  for (const l of leadsInPeriod) {
    if (!l.city?.trim()) missingCity++;
    if (!parseChannel(l.channel)) missingChannel++;
    if (!l.campaign_id?.trim()) missingCamp++;
    if (!isLeadAttributed(l)) unattributed++;
    else attributed++;
    if (leadHasAnyClickId(l)) withClick++;
    if (l.channel === 'google') {
      googleLeads++;
      if (isGoogleClickId(l)) googleWith++;
    }
    if (l.channel === 'meta') {
      metaLeads++;
      if (isMetaClickId(l)) metaWith++;
    }
  }

  return {
    cpc: totals.clicks > 0 ? roundMoney(safeDivide(totals.spend, totals.clicks)) : null,
    ctr: totals.impressions > 0 ? roundRate(safeDivide(totals.clicks, totals.impressions)) : null,
    lead_rate: totals.clicks > 0 ? roundRate(safeDivide(totals.leads, totals.clicks)) : null,
    book_rate: totals.leads > 0 ? roundRate(safeDivide(totals.booked, totals.leads)) : null,
    pct_leads_missing_city: n ? roundRate(safeDivide(missingCity, n)) ?? 0 : 0,
    pct_leads_missing_channel: n ? roundRate(safeDivide(missingChannel, n)) ?? 0 : 0,
    pct_leads_missing_campaign_id: n ? roundRate(safeDivide(missingCamp, n)) ?? 0 : 0,
    leads_with_any_click_id_pct: n ? roundRate(safeDivide(withClick, n)) ?? 0 : 0,
    google_click_id_coverage_pct: googleLeads > 0 ? roundRate(safeDivide(googleWith, googleLeads)) : null,
    meta_click_id_coverage_pct: metaLeads > 0 ? roundRate(safeDivide(metaWith, metaLeads)) : null,
    unattributed_leads: unattributed,
    attributed_leads: attributed,
  };
}

function buildCreativeGrid(
  leads: LeadRow[],
  appointments: AppointmentRow[],
  leadById: Map<string, LeadRow>,
  creativeAssets: CreativeAssetRow[]
): CreativePerformanceRow[] {
  const assetByUtm = new Map<string, CreativeAssetRow>();
  for (const a of creativeAssets) {
    if (a.utm_content) assetByUtm.set(a.utm_content, a);
  }

  const byContent = new Map<string, { leads: Set<string>; booked: Set<string>; completed: Set<string> }>();
  for (const l of leads) {
    const u = l.utm_content?.trim() || '_unknown';
    if (!byContent.has(u)) byContent.set(u, { leads: new Set(), booked: new Set(), completed: new Set() });
    byContent.get(u)!.leads.add(l.lead_id);
  }

  for (const ap of appointments) {
    const lead = leadById.get(ap.lead_id);
    if (!lead) continue;
    const u = lead.utm_content?.trim() || '_unknown';
    if (!byContent.has(u)) byContent.set(u, { leads: new Set(), booked: new Set(), completed: new Set() });
    const g = byContent.get(u)!;
    if (ap.status === 'booked' || ap.status === 'completed') g.booked.add(ap.appointment_id);
    if (ap.status === 'completed') g.completed.add(ap.appointment_id);
  }

  const rows: CreativePerformanceRow[] = [];
  for (const [utm, v] of Array.from(byContent.entries())) {
    const asset = assetByUtm.get(utm);
    const nLeads = v.leads.size;
    const nBooked = v.booked.size;
    const nDone = v.completed.size;
    let spend: number | null = null;
    if (asset?.creative_id) {
      // demo: no reliable tie — leave null
      spend = null;
    }
    rows.push({
      utm_content: utm === '_unknown' ? '(no utm_content)' : utm,
      hook_tag: asset?.hook_tag,
      format: asset?.format,
      headline: asset?.headline,
      spend,
      leads: nLeads,
      booked_consults: nBooked,
      completed_consults: nDone,
      cost_per_lead: spend != null && spend > 0 ? roundMoney(safeDivide(spend, nLeads)) : null,
      cost_per_booked: spend != null && spend > 0 ? roundMoney(safeDivide(spend, nBooked)) : null,
      ctr: null,
    });
  }

  rows.sort((a, b) => b.leads - a.leads);
  return rows.slice(0, 50);
}

function buildTrend(
  periodRows: MarketingRoiDailyByCity[],
  start: string,
  end: string
): MarketingRoiResponse['trend'] {
  const dates: string[] = [];
  const d0 = new Date(`${start}T00:00:00Z`);
  const d1 = new Date(`${end}T00:00:00Z`);
  for (let d = new Date(d0); d <= d1; d.setUTCDate(d.getUTCDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10));
  }

  const byDate = new Map<
    string,
    {
      sg: number;
      sm: number;
      bg: number;
      bm: number;
      spend: number;
      booked: number;
    }
  >();
  for (const dt of dates) {
    byDate.set(dt, { sg: 0, sm: 0, bg: 0, bm: 0, spend: 0, booked: 0 });
  }

  for (const r of periodRows) {
    const cur = byDate.get(r.date);
    if (!cur) continue;
    cur.spend += r.spend;
    cur.booked += r.booked_consults;
    if (r.channel === 'google') {
      cur.sg += r.spend;
      cur.bg += r.booked_consults;
    } else {
      cur.sm += r.spend;
      cur.bm += r.booked_consults;
    }
  }

  return dates.map((date) => {
    const x = byDate.get(date)!;
    return {
      date,
      spend_google: roundMoney(x.sg) ?? 0,
      spend_meta: roundMoney(x.sm) ?? 0,
      booked_google: x.bg,
      booked_meta: x.bm,
      booked_total: x.booked,
      cp_booked_google: roundMoney(safeDivide(x.sg, x.bg)),
      cp_booked_meta: roundMoney(safeDivide(x.sm, x.bm)),
      cp_booked_total: roundMoney(safeDivide(x.spend, x.booked)),
    };
  });
}
