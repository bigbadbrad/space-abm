import dayjs, { type Dayjs } from 'dayjs';

import type { AppointmentRow, LeadRow } from '@/lib/everself/types';
import type {
  ChangeHistoryRow,
  ControlAlertItem,
  DemoCampaignRow,
  DemoChangeEvent,
  SpendDailyRow,
} from '@/lib/everself/everself-control-types';
import { safeDivide } from '@/lib/everself/metrics';

export type ControlFilterRange = {
  start: Dayjs;
  end: Dayjs;
  cities: string[];
  channels: ('google' | 'meta')[];
  campaignSearch: string;
  bookingGroup: 'booked' | 'lead';
};

function inDateRange(d: string, start: Dayjs, end: Dayjs): boolean {
  const x = d.slice(0, 10);
  return x >= start.format('YYYY-MM-DD') && x <= end.format('YYYY-MM-DD');
}

function leadMatchesFilter(l: LeadRow, f: ControlFilterRange): boolean {
  const d = l.date ?? l.created_at.slice(0, 10);
  if (!inDateRange(d, f.start, f.end)) return false;
  if (f.cities.length > 0 && !f.cities.includes(l.city)) return false;
  if (f.channels.length > 0 && !f.channels.includes(l.channel)) return false;
  return true;
}

function apptMatchesBookedDate(a: AppointmentRow, f: ControlFilterRange): boolean {
  const d = a.booked_at.slice(0, 10);
  if (!inDateRange(d, f.start, f.end)) return false;
  if (f.cities.length > 0 && !f.cities.includes(a.city)) return false;
  return true;
}

function leadForApptBookingCohort(a: AppointmentRow, leads: LeadRow[]): LeadRow | undefined {
  const lid = (a.lead_id ?? '').trim();
  if (!lid) return undefined;
  return leads.find((x) => x.lead_id === lid);
}

export type CampaignPerformance = {
  spend: number;
  leads: number;
  booked: number;
  completed: number;
  cp_booked: number | null;
  cp_completed: number | null;
};

export function computeCampaignPerformance(
  campaigns: DemoCampaignRow[],
  spend: SpendDailyRow[],
  leads: LeadRow[],
  appointments: AppointmentRow[],
  f: ControlFilterRange
): Map<string, CampaignPerformance> {
  const out = new Map<string, CampaignPerformance>();

  const spendByCamp = new Map<string, number>();
  for (const r of spend) {
    if (!inDateRange(r.date, f.start, f.end)) continue;
    if (f.cities.length > 0 && !f.cities.includes(r.city)) continue;
    if (f.channels.length > 0 && !f.channels.includes(r.channel)) continue;
    spendByCamp.set(r.campaign_id, (spendByCamp.get(r.campaign_id) ?? 0) + r.spend);
  }

  const leadsByCityCh = new Map<string, number>();
  for (const l of leads) {
    if (!leadMatchesFilter(l, f)) continue;
    const k = `${l.city}|${l.channel}`;
    leadsByCityCh.set(k, (leadsByCityCh.get(k) ?? 0) + 1);
  }

  const cityBookedTotal = new Map<string, number>();
  const cityCompletedTotal = new Map<string, number>();
  for (const a of appointments) {
    if (!apptMatchesBookedDate(a, f)) continue;
    if (f.bookingGroup === 'lead') {
      const lead = leadForApptBookingCohort(a, leads);
      if (!lead || !leadMatchesFilter(lead, f)) continue;
    } else if (f.channels.length > 0) {
      const lead = leadForApptBookingCohort(a, leads);
      const ch = lead?.channel;
      if (!ch || !f.channels.includes(ch)) continue;
    }
    if (a.status === 'booked' || a.status === 'completed') {
      cityBookedTotal.set(a.city, (cityBookedTotal.get(a.city) ?? 0) + 1);
    }
    if (a.status === 'completed') {
      cityCompletedTotal.set(a.city, (cityCompletedTotal.get(a.city) ?? 0) + 1);
    }
  }

  const spendByCityCh = new Map<string, number>();
  const spendByCity = new Map<string, number>();
  for (const r of spend) {
    if (!inDateRange(r.date, f.start, f.end)) continue;
    if (f.cities.length > 0 && !f.cities.includes(r.city)) continue;
    if (f.channels.length > 0 && !f.channels.includes(r.channel)) continue;
    const k = `${r.city}|${r.channel}`;
    spendByCityCh.set(k, (spendByCityCh.get(k) ?? 0) + r.spend);
    spendByCity.set(r.city, (spendByCity.get(r.city) ?? 0) + r.spend);
  }

  for (const c of campaigns) {
    const cs = f.campaignSearch.trim().toLowerCase();
    if (cs && !c.campaign_name.toLowerCase().includes(cs) && !c.campaign_id.toLowerCase().includes(cs)) continue;
    if (f.cities.length > 0 && !f.cities.includes(c.city)) continue;
    if (f.channels.length > 0 && !f.channels.includes(c.channel)) continue;

    const sp = spendByCamp.get(c.campaign_id) ?? 0;
    const lk = `${c.city}|${c.channel}`;
    const leadsN = leadsByCityCh.get(lk) ?? 0;
    const cityTot = spendByCity.get(c.city) ?? 0;
    const bCity = cityBookedTotal.get(c.city) ?? 0;
    const compCity = cityCompletedTotal.get(c.city) ?? 0;
    const booked = cityTot > 0 ? Math.max(0, Math.round((bCity * sp) / cityTot)) : 0;
    const completed = cityTot > 0 ? Math.max(0, Math.round((compCity * sp) / cityTot)) : 0;

    out.set(c.campaign_id, {
      spend: sp,
      leads: leadsN,
      booked,
      completed,
      cp_booked: safeDivide(sp, booked),
      cp_completed: completed > 0 ? safeDivide(sp, completed) : null,
    });
  }

  return out;
}

export type CityPacingRow = {
  city: string;
  weekly_budget: number;
  google_share: number;
  meta_share: number;
  spend_period: number;
  booked: number;
  cp_booked: number | null;
  forecast_booked: number | null;
  pace_pct: number | null;
};

export function computeCityPacing(
  cities: string[],
  spend: SpendDailyRow[],
  appointments: AppointmentRow[],
  leads: LeadRow[],
  f: ControlFilterRange,
  cityOverrides: Record<string, { weekly_budget?: number; channel_split?: { google: number; meta: number } }>
): CityPacingRow[] {
  const rows: CityPacingRow[] = [];
  const days = Math.max(1, f.end.diff(f.start, 'day') + 1);

  for (const city of cities) {
    if (f.cities.length > 0 && !f.cities.includes(city)) continue;
    let sp = 0;
    let gSpend = 0;
    let mSpend = 0;
    for (const r of spend) {
      if (r.city !== city) continue;
      if (!inDateRange(r.date, f.start, f.end)) continue;
      sp += r.spend;
      if (r.channel === 'google') gSpend += r.spend;
      if (r.channel === 'meta') mSpend += r.spend;
    }
    const tot = gSpend + mSpend;
    const gShare = tot > 0 ? gSpend / tot : 0.5;
    const ov = cityOverrides[city];
    const weeklyBudget = ov?.weekly_budget ?? Math.round((sp / Math.max(1, days)) * 7 * 1.05);
    const google_share = ov?.channel_split?.google ?? gShare;
    const meta_share = ov?.channel_split?.meta ?? 1 - google_share;

    let booked = 0;
    for (const a of appointments) {
      if (a.city !== city) continue;
      if (!apptMatchesBookedDate(a, f)) continue;
      if (a.status === 'booked' || a.status === 'completed') booked += 1;
    }

    const cpBooked = safeDivide(sp, booked);
    const blended = cpBooked ?? 250;
    const forecast = weeklyBudget / blended;

    const idealToDate = (weeklyBudget / 7) * days;
    const pacePct = idealToDate > 0 ? sp / idealToDate : null;

    rows.push({
      city,
      weekly_budget: weeklyBudget,
      google_share,
      meta_share,
      spend_period: sp,
      booked,
      cp_booked: cpBooked,
      forecast_booked: forecast,
      pace_pct: pacePct,
    });
  }
  return rows;
}

export type DailyPacingPoint = { date: string; cumulative_spend: number; ideal: number };

export function dailyPacingSeries(
  spend: SpendDailyRow[],
  city: string | null,
  f: ControlFilterRange,
  weeklyBudgetCity: number
): DailyPacingPoint[] {
  const byDay = new Map<string, number>();
  for (const r of spend) {
    if (city && r.city !== city) continue;
    if (!inDateRange(r.date, f.start, f.end)) continue;
    const d = r.date.slice(0, 10);
    byDay.set(d, (byDay.get(d) ?? 0) + r.spend);
  }
  const days: string[] = [];
  let cur = f.start.startOf('day');
  const end = f.end.startOf('day');
  while (cur.isBefore(end) || cur.isSame(end, 'day')) {
    days.push(cur.format('YYYY-MM-DD'));
    cur = cur.add(1, 'day');
  }
  const perDayIdeal = weeklyBudgetCity / 7;
  let cum = 0;
  let idealCum = 0;
  return days.map((d) => {
    cum += byDay.get(d) ?? 0;
    idealCum += perDayIdeal;
    return { date: d.slice(5), cumulative_spend: cum, ideal: idealCum };
  });
}

export type CacRiskCity = {
  city: string;
  cp_booked_delta_pct: number | null;
  lead_to_book_delta_pct: number | null;
  score: number;
};

export function topCacRiskCities(
  spend: SpendDailyRow[],
  leads: LeadRow[],
  appointments: AppointmentRow[],
  current: ControlFilterRange,
  prevDays: number
): CacRiskCity[] {
  const prevEnd = current.start.subtract(1, 'day');
  const prevStart = prevEnd.subtract(prevDays - 1, 'day');
  const prev: ControlFilterRange = {
    ...current,
    start: prevStart,
    end: prevEnd,
  };

  const cities = new Set<string>();
  spend.forEach((s) => cities.add(s.city));

  const out: CacRiskCity[] = [];
  for (const city of Array.from(cities)) {
    const curF = { ...current, cities: [city] };
    const prevF = { ...prev, cities: [city] };

    const curSpend = sumSpend(spend, curF, city);
    const prevSpend = sumSpend(spend, prevF, city);
    const curBooked = countBooked(appointments, leads, curF, city);
    const prevBooked = countBooked(appointments, leads, prevF, city);
    const curLeads = countLeads(leads, curF, city);
    const prevLeads = countLeads(leads, prevF, city);

    const cpCur = safeDivide(curSpend, curBooked);
    const cpPrev = safeDivide(prevSpend, prevBooked);
    const cpDelta =
      cpPrev != null && cpPrev > 0 && cpCur != null ? (cpCur - cpPrev) / cpPrev : null;

    const l2bCur = safeDivide(curBooked, curLeads);
    const l2bPrev = safeDivide(prevBooked, prevLeads);
    const l2bDelta =
      l2bPrev != null && l2bPrev > 0 && l2bCur != null ? (l2bCur - l2bPrev) / l2bPrev : null;

    let score = 0;
    if (cpDelta != null && cpDelta > 0.25) score += 2;
    if (l2bDelta != null && l2bDelta < -0.2) score += 2;
    if (cpDelta != null && cpDelta > 0) score += cpDelta;
    if (l2bDelta != null && l2bDelta < 0) score += -l2bDelta;

    out.push({
      city,
      cp_booked_delta_pct: cpDelta,
      lead_to_book_delta_pct: l2bDelta,
      score,
    });
  }

  return out.sort((a, b) => b.score - a.score).slice(0, 3);
}

function sumSpend(spend: SpendDailyRow[], f: ControlFilterRange, city: string): number {
  let t = 0;
  for (const r of spend) {
    if (r.city !== city) continue;
    if (!inDateRange(r.date, f.start, f.end)) continue;
    t += r.spend;
  }
  return t;
}

function countLeads(leads: LeadRow[], f: ControlFilterRange, city: string): number {
  let n = 0;
  for (const l of leads) {
    if (l.city !== city) continue;
    if (!leadMatchesFilter(l, f)) continue;
    n += 1;
  }
  return n;
}

function countBooked(appointments: AppointmentRow[], leads: LeadRow[], f: ControlFilterRange, city: string): number {
  let n = 0;
  for (const a of appointments) {
    if (a.city !== city) continue;
    if (!apptMatchesBookedDate(a, f)) continue;
    if (a.status === 'booked' || a.status === 'completed') n += 1;
  }
  return n;
}

export type ImpactSeriesPoint = { date: string; spend: number; booked: number; cp_booked: number | null };

export function impactWindowSeries(
  changeAt: string,
  spend: SpendDailyRow[],
  appointments: AppointmentRow[],
  campaignId: string | undefined,
  city: string | undefined
): { before: ImpactSeriesPoint[]; after: ImpactSeriesPoint[]; correlation: 'shift' | 'none' } {
  const t = dayjs(changeAt);
  const beforeStart = t.subtract(7, 'day');
  const afterEnd = t.add(7, 'day');

  const spendRows = spend.filter((r) => {
    if (city && r.city !== city) return false;
    if (campaignId && r.campaign_id !== campaignId) return false;
    const d = dayjs(r.date.slice(0, 10));
    return (d.isAfter(beforeStart, 'day') || d.isSame(beforeStart, 'day')) && d.isBefore(t, 'day');
  });
  const spendRowsAfter = spend.filter((r) => {
    if (city && r.city !== city) return false;
    if (campaignId && r.campaign_id !== campaignId) return false;
    const d = dayjs(r.date.slice(0, 10));
    return (d.isAfter(t, 'day') || d.isSame(t, 'day')) && (d.isBefore(afterEnd, 'day') || d.isSame(afterEnd, 'day'));
  });

  const agg = (rows: SpendDailyRow[]) => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const d = r.date.slice(0, 10);
      m.set(d, (m.get(d) ?? 0) + r.spend);
    }
    return m;
  };

  const beforeMap = agg(spendRows);
  const afterMap = agg(spendRowsAfter);

  const toPoints = (dayMap: Map<string, number>, appts: AppointmentRow[]) => {
    const bookedByDay = new Map<string, number>();
    for (const a of appts) {
      if (city && a.city !== city) continue;
      if (a.status !== 'booked' && a.status !== 'completed') continue;
      const d = a.booked_at.slice(0, 10);
      bookedByDay.set(d, (bookedByDay.get(d) ?? 0) + 1);
    }
    const keys = Array.from(new Set([...Array.from(dayMap.keys()), ...Array.from(bookedByDay.keys())])).sort();
    return keys.map((d) => {
      const sp = dayMap.get(d) ?? 0;
      const b = bookedByDay.get(d) ?? 0;
      const bb = b > 0 ? b : Math.max(1, Math.round(sp / 300));
      return {
        date: d.slice(5),
        spend: sp,
        booked: bb,
        cp_booked: safeDivide(sp, bb),
      };
    });
  };

  const beforePts = toPoints(beforeMap, appointments);
  const afterPts = toPoints(afterMap, appointments);

  const avg = (xs: ImpactSeriesPoint[]) =>
    xs.length === 0 ? null : xs.reduce((s, x) => s + (x.cp_booked ?? 0), 0) / xs.length;
  const ab = avg(beforePts);
  const aa = avg(afterPts);
  let correlation: 'shift' | 'none' = 'none';
  if (ab != null && aa != null && Math.abs(aa - ab) / Math.max(ab, 1) > 0.08) correlation = 'shift';

  return { before: beforePts, after: afterPts, correlation };
}

type ChangeLike = ChangeHistoryRow | DemoChangeEvent;

export function buildControlAlerts(
  history: ChangeHistoryRow[],
  demoChanges: DemoChangeEvent[],
  spendByCampaignId: Map<string, number>
): ControlAlertItem[] {
  const totalSpend = Array.from(spendByCampaignId.values()).reduce((a, b) => a + b, 0);
  const byVal = Array.from(spendByCampaignId.entries()).sort((a, b) => b[1] - a[1]);
  const topIdx = Math.max(0, Math.floor(byVal.length * 0.2) - 1);
  const threshold = byVal.length > 0 ? byVal[topIdx]![1] : 0;

  const all: ChangeLike[] = [...history, ...demoChanges];

  const alerts: ControlAlertItem[] = [];
  for (const ch of all) {
    if (ch.change_type === 'BUDGET_CHANGE' && typeof ch.before === 'number' && typeof ch.after === 'number') {
      const cut = ch.before > 0 && (ch.before - ch.after) / ch.before >= 0.2;
      if (cut) {
        alerts.push({
          id: `alrt_budget_${ch.change_id}`,
          severity: 'high',
          ts: ch.detected_at,
          summary: `Budget cut ≥20% on ${ch.campaign_name ?? ch.campaign_id ?? 'campaign'}`,
          rule: 'high_impact_budget_cut',
          change_id: ch.change_id,
        });
      }
    }
    if (ch.change_type === 'BID_STRATEGY_CHANGE') {
      alerts.push({
        id: `alrt_bid_${ch.change_id}`,
        severity: 'med',
        ts: ch.detected_at,
        summary: `Bid strategy change — ${ch.campaign_name ?? ch.campaign_id}`,
        rule: 'bid_strategy',
        change_id: ch.change_id,
      });
    }
    if (ch.change_type === 'CREATIVE_UPDATE') {
      const sp = spendByCampaignId.get(ch.campaign_id ?? '') ?? 0;
      const top = totalSpend > 0 && sp >= threshold && threshold > 0;
      alerts.push({
        id: `alrt_cre_${ch.change_id}`,
        severity: top ? 'med' : 'low',
        ts: ch.detected_at,
        summary: `Creative update${top ? ' (top-spend market)' : ''} — ${ch.campaign_name ?? ''}`,
        rule: 'creative_top',
        change_id: ch.change_id,
      });
    }
    if (ch.change_type === 'STRUCTURE_CHANGE') {
      alerts.push({
        id: `alrt_str_${ch.change_id}`,
        severity: 'med',
        ts: ch.detected_at,
        summary: `Structural change (${ch.field}) — ${ch.campaign_name ?? ''}`,
        rule: 'structure',
        change_id: ch.change_id,
      });
    }
  }

  const byCityDay = new Map<string, number>();
  for (const ch of all) {
    const day = ch.detected_at.slice(0, 10);
    const k = `${ch.city ?? 'unknown'}|${day}`;
    byCityDay.set(k, (byCityDay.get(k) ?? 0) + 1);
  }
  for (const [k, n] of Array.from(byCityDay.entries())) {
    if (n > 3) {
      const [city, day] = k.split('|');
      alerts.push({
        id: `alrt_vel_${k}`,
        severity: 'low',
        ts: `${day}T12:00:00Z`,
        summary: `High change velocity in ${city} (${n} changes this day — demo proxy for 24h)`,
        rule: 'velocity',
      });
    }
  }

  return alerts.sort((a, b) => b.ts.localeCompare(a.ts));
}
