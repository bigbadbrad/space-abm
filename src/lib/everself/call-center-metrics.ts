import type { AppointmentRow } from '@/lib/everself/types';
import type {
  AgentRow,
  CallCenterConfig,
  CallCenterFilters,
  CityChannelCell,
  CityOutcomeRow,
  CallGap,
  DailyPoint,
  DniAssignment,
  EnrichedCall,
  ExecutiveKpis,
  CallRow,
  FunnelCounts,
  HeatmapCell,
  MissedBySourceRow,
  AgentPerfRow,
} from '@/lib/everself/call-center-types';
import { appointmentIndex } from '@/lib/everself/call-center-types';

export function findAssignmentForCall(call: CallRow, assignments: DniAssignment[]): DniAssignment | null {
  if (call.dni_assignment_id) {
    const direct = assignments.find((a) => a.dni_assignment_id === call.dni_assignment_id);
    if (direct) return direct;
  }
  const started = Date.parse(call.started_at);
  if (!Number.isFinite(started)) return null;
  return (
    assignments.find((a) => {
      const a0 = Date.parse(a.assigned_at);
      const a1 = Date.parse(a.expires_at);
      return a.tracking_number === call.to_tracking_number && a0 <= started && started <= a1;
    }) ?? null
  );
}

function pickStr(...vals: (string | null | undefined)[]): string | null {
  for (const v of vals) {
    if (v != null && String(v).trim() !== '') return v;
  }
  return null;
}

function hasClickId(call: CallRow, a: DniAssignment | null): boolean {
  const g =
    pickStr(call.gclid, a?.gclid, a?.wbraid, a?.gbraid, a?.fbclid) ||
    pickStr(call.fbp, a?.fbp) ||
    pickStr(call.fbc, a?.fbc);
  return Boolean(g);
}

export function enrichCall(
  call: CallRow,
  assignment: DniAssignment | null,
  apptsByLead: Map<string, AppointmentRow[]>,
  bookingWindowDays: number,
  includeVoicemailAsMissed: boolean
): EnrichedCall {
  const effectiveCity = pickStr(call.city, assignment?.city);
  const effectiveChannel = (pickStr(call.channel, assignment?.channel) ?? 'unknown').toLowerCase();
  const effectiveUtmCampaign = pickStr(call.utm_campaign, assignment?.utm_campaign);
  const attributionMatched = assignment != null;
  const clickIdPresent = hasClickId(call, assignment);

  const started = Date.parse(call.started_at);
  let asaSeconds: number | null = null;
  let ahtSeconds: number | null = null;
  if (call.status === 'answered') {
    if (call.answered_at) {
      const ans = Date.parse(call.answered_at);
      if (Number.isFinite(ans) && Number.isFinite(started)) asaSeconds = Math.max(0, (ans - started) / 1000);
    } else if (call.ring_seconds != null && Number.isFinite(call.ring_seconds)) {
      asaSeconds = Math.max(0, call.ring_seconds);
    }
    if (call.ended_at && call.answered_at) {
      const end = Date.parse(call.ended_at);
      const ans = Date.parse(call.answered_at);
      if (Number.isFinite(end) && Number.isFinite(ans)) ahtSeconds = Math.max(0, (end - ans) / 1000);
    } else if (call.talk_seconds != null) {
      ahtSeconds = Math.max(0, call.talk_seconds);
    }
  }

  const isMissedForKpi =
    call.status === 'missed' || (includeVoicemailAsMissed && call.status === 'voicemail');

  let bookedConsultWithinWindow = false;
  let completedConsultWithinWindow = false;
  let daysCallToBook: number | null = null;
  if (call.status === 'answered' && call.lead_id && Number.isFinite(started)) {
    const list = apptsByLead.get(call.lead_id) ?? [];
    const windowEnd = started + bookingWindowDays * 86400000;
    for (const ap of list) {
      const bt = Date.parse(ap.booked_at);
      if (!Number.isFinite(bt) || bt < started || bt > windowEnd) continue;
      bookedConsultWithinWindow = true;
      daysCallToBook = (bt - started) / 86400000;
      if (ap.status === 'completed' || ap.completed_at) {
        completedConsultWithinWindow = true;
      }
      break;
    }
  }

  return {
    ...call,
    assignment,
    effectiveCity,
    effectiveChannel,
    effectiveUtmCampaign,
    clickIdPresent,
    attributionMatched,
    asaSeconds,
    ahtSeconds,
    isMissedForKpi,
    bookedConsultWithinWindow,
    completedConsultWithinWindow,
    daysCallToBook,
  };
}

export function joinAllCalls(
  calls: CallRow[],
  assignments: DniAssignment[],
  appointments: AppointmentRow[],
  config: CallCenterConfig
): EnrichedCall[] {
  const apIdx = appointmentIndex(appointments);
  return calls.map((c) =>
    enrichCall(c, findAssignmentForCall(c, assignments), apIdx, config.booking_window_days, config.include_voicemail_as_missed)
  );
}

function inDateRange(startedMs: number, startMs: number, endMs: number): boolean {
  return startedMs >= startMs && startedMs <= endMs;
}

function passesFilters(c: EnrichedCall, f: CallCenterFilters): boolean {
  const t = Date.parse(c.started_at);
  if (!Number.isFinite(t) || !inDateRange(t, f.startMs, f.endMs)) return false;
  if (f.cities.length > 0 && (!c.effectiveCity || !f.cities.includes(c.effectiveCity))) return false;
  if (f.channels.length > 0 && !f.channels.includes(c.effectiveChannel)) return false;
  if (f.campaignSearch.trim()) {
    const q = f.campaignSearch.trim().toLowerCase();
    const camp = (c.effectiveUtmCampaign ?? '').toLowerCase();
    if (!camp.includes(q)) return false;
  }
  if (f.agentId && c.agent_id !== f.agentId) return false;
  return true;
}

export function filterEnrichedCalls(rows: EnrichedCall[], f: CallCenterFilters): EnrichedCall[] {
  return rows.filter((c) => passesFilters(c, f));
}

export function computeExecutiveKpis(
  current: EnrichedCall[],
  previous: EnrichedCall[],
  config: CallCenterConfig
): ExecutiveKpis {
  const totalCalls = current.length;
  const answeredCalls = current.filter((c) => c.status === 'answered').length;
  const missedCalls = current.filter((c) => c.isMissedForKpi).length;
  const abandonedCalls = current.filter((c) => c.status === 'abandoned').length;

  const missedRate = totalCalls > 0 ? missedCalls / totalCalls : null;
  const abandonRate = totalCalls > 0 ? abandonedCalls / totalCalls : null;

  const answeredRows = current.filter((c) => c.status === 'answered');
  const asaList = answeredRows.map((c) => c.asaSeconds).filter((x): x is number => x != null && Number.isFinite(x));
  const asaSeconds = asaList.length > 0 ? asaList.reduce((a, b) => a + b, 0) / asaList.length : null;

  const slMet = answeredRows.filter((c) => c.asaSeconds != null && c.asaSeconds <= config.service_level_seconds).length;
  const serviceLevelPct = answeredCalls > 0 ? slMet / answeredCalls : null;

  const ahtList = answeredRows.map((c) => c.ahtSeconds).filter((x): x is number => x != null && Number.isFinite(x));
  const ahtSeconds = ahtList.length > 0 ? ahtList.reduce((a, b) => a + b, 0) / ahtList.length : null;

  const bookedConsultsFromCalls = answeredRows.filter((c) => c.bookedConsultWithinWindow).length;
  const callToBookRate = answeredCalls > 0 ? bookedConsultsFromCalls / answeredCalls : null;

  const matched = current.filter((c) => c.attributionMatched).length;
  const attributionMatchRate = totalCalls > 0 ? matched / totalCalls : null;

  const withClick = current.filter((c) => c.clickIdPresent).length;
  const clickIdCoveragePct = totalCalls > 0 ? withClick / totalCalls : null;

  const pt = previous.length;
  const pmissed = previous.filter((c) => c.isMissedForKpi).length;
  const pans = previous.filter((c) => c.status === 'answered');
  const pbook = pans.filter((c) => c.bookedConsultWithinWindow).length;
  const pasa = pans.map((c) => c.asaSeconds).filter((x): x is number => x != null);

  const prevMissedRate = pt > 0 ? pmissed / pt : null;
  const prevCtb = pans.length > 0 ? pbook / pans.length : null;
  const prevAsa = pasa.length > 0 ? pasa.reduce((a, b) => a + b, 0) / pasa.length : null;

  return {
    totalCalls,
    answeredCalls,
    missedCalls,
    abandonedCalls,
    missedRate,
    abandonRate,
    asaSeconds,
    serviceLevelPct,
    ahtSeconds,
    bookedConsultsFromCalls,
    callToBookRate,
    attributionMatchRate,
    clickIdCoveragePct,
    delta: {
      totalCalls: totalCalls - pt,
      missedRate: missedRate != null && prevMissedRate != null ? missedRate - prevMissedRate : null,
      callToBookRate: callToBookRate != null && prevCtb != null ? callToBookRate - prevCtb : null,
      asaSeconds: asaSeconds != null && prevAsa != null ? asaSeconds - prevAsa : null,
    },
  };
}

const CHANNELS = ['google', 'meta', 'organic', 'unknown'] as const;

export function computeCityChannelCells(calls: EnrichedCall[]): CityChannelCell[] {
  const cities = Array.from(new Set(calls.map((c) => c.effectiveCity).filter((x): x is string => Boolean(x)))).sort();
  const out: CityChannelCell[] = [];
  for (const city of cities) {
    for (const ch of CHANNELS) {
      const slice = calls.filter((c) => c.effectiveCity === city && c.effectiveChannel === ch);
      if (slice.length === 0) continue;
      const tot = slice.length;
      const ans = slice.filter((c) => c.status === 'answered').length;
      const missed = slice.filter((c) => c.isMissedForKpi).length;
      const answeredOnly = slice.filter((c) => c.status === 'answered');
      const booked = answeredOnly.filter((c) => c.bookedConsultWithinWindow).length;
      out.push({
        city,
        channel: ch,
        calls: tot,
        answeredPct: tot > 0 ? ans / tot : null,
        missedPct: tot > 0 ? missed / tot : null,
        callToBookPct: answeredOnly.length > 0 ? booked / answeredOnly.length : null,
      });
    }
  }
  return out;
}

export function computeDailySeries(calls: EnrichedCall[]): DailyPoint[] {
  const byDay = new Map<string, EnrichedCall[]>();
  for (const c of calls) {
    const d = c.started_at.slice(0, 10);
    const list = byDay.get(d) ?? [];
    list.push(c);
    byDay.set(d, list);
  }
  const days = Array.from(byDay.keys()).sort();
  return days.map((date) => {
    const slice = byDay.get(date) ?? [];
    const tot = slice.length;
    const missed = slice.filter((x) => x.isMissedForKpi).length;
    const answered = slice.filter((x) => x.status === 'answered');
    const booked = answered.filter((x) => x.bookedConsultWithinWindow).length;
    return {
      date,
      total: tot,
      missedRate: tot > 0 ? missed / tot : null,
      callToBookRate: answered.length > 0 ? booked / answered.length : null,
    };
  });
}

/** Local browser heatmap: missed calls bucketed by getDay/getHours */
export function computeMissedHeatmap(calls: EnrichedCall[]): HeatmapCell[] {
  const missed = calls.filter((c) => c.isMissedForKpi || c.status === 'abandoned');
  const grid = new Map<string, number>();
  for (const c of missed) {
    const dt = new Date(c.started_at);
    const dow = dt.getDay();
    const hour = dt.getHours();
    const k = `${dow}:${hour}`;
    grid.set(k, (grid.get(k) ?? 0) + 1);
  }
  const out: HeatmapCell[] = [];
  grid.forEach((n, k) => {
    const [ds, hs] = k.split(':');
    out.push({ dow: Number(ds), hour: Number(hs), missed: n });
  });
  return out.sort((a, b) => a.dow - b.dow || a.hour - b.hour);
}

export function computeMissedBySource(calls: EnrichedCall[], baselineBookedRate: number): MissedBySourceRow[] {
  const keys = new Map<string, EnrichedCall[]>();
  for (const c of calls) {
    const campaign = c.effectiveUtmCampaign ?? '—';
    const k = `${c.effectiveChannel}|||${campaign}`;
    const list = keys.get(k) ?? [];
    list.push(c);
    keys.set(k, list);
  }
  const rows: MissedBySourceRow[] = [];
  keys.forEach((slice, k) => {
    const [channel, campaign] = k.split('|||');
    const tot = slice.length;
    const missed = slice.filter((c) => c.isMissedForKpi).length;
    rows.push({
      channel,
      campaign,
      totalCalls: tot,
      missedCalls: missed,
      missedPct: tot > 0 ? missed / tot : null,
      estLostBookings: missed * baselineBookedRate,
    });
  });
  return rows.sort((a, b) => b.missedCalls - a.missedCalls);
}

export function computeAgentStats(calls: EnrichedCall[], agents: AgentRow[]): AgentPerfRow[] {
  const byAgent = new Map<string, EnrichedCall[]>();
  for (const c of calls) {
    if (c.status !== 'answered' || !c.agent_id) continue;
    const list = byAgent.get(c.agent_id) ?? [];
    list.push(c);
    byAgent.set(c.agent_id, list);
  }
  const nameMap = new Map(agents.map((a) => [a.agent_id, a.name]));
  const out: AgentPerfRow[] = [];
  byAgent.forEach((slice, agent_id) => {
    const answered = slice.length;
    const ahts = slice.map((c) => c.ahtSeconds).filter((x): x is number => x != null);
    const avgHandleSeconds = ahts.length > 0 ? ahts.reduce((a, b) => a + b, 0) / ahts.length : null;
    const booked = slice.filter((c) => c.bookedConsultWithinWindow).length;
    out.push({
      agent_id,
      name: nameMap.get(agent_id) ?? agent_id,
      answered,
      avgHandleSeconds,
      callToBookPct: answered > 0 ? booked / answered : null,
    });
  });
  return out.sort((a, b) => b.answered - a.answered);
}

export function computeGaps(calls: EnrichedCall[], kpis: ExecutiveKpis, config: CallCenterConfig): CallGap[] {
  const gaps: CallGap[] = [];
  if (kpis.asaSeconds != null && kpis.asaSeconds > config.asa_warning_seconds) {
    gaps.push({
      kind: 'asa',
      label: 'Slow answer speed',
      detail: `ASA ${kpis.asaSeconds.toFixed(0)}s exceeds ${config.asa_warning_seconds}s threshold`,
    });
  }
  if (kpis.serviceLevelPct != null && kpis.serviceLevelPct < 0.7) {
    gaps.push({
      kind: 'service_level',
      label: 'Service level below target',
      detail: `${(kpis.serviceLevelPct * 100).toFixed(0)}% answered within ${config.service_level_seconds}s (target 70%)`,
    });
  }
  const byCity = new Map<string, EnrichedCall[]>();
  for (const c of calls) {
    const city = c.effectiveCity ?? 'Unknown';
    const list = byCity.get(city) ?? [];
    list.push(c);
    byCity.set(city, list);
  }
  byCity.forEach((slice, city) => {
    const missed = slice.filter((c) => c.isMissedForKpi).length;
    const rate = slice.length > 0 ? missed / slice.length : 0;
    if (rate > config.missed_rate_warning) {
      gaps.push({
        kind: 'city_missed',
        label: `${city}: high missed rate`,
        detail: `${(rate * 100).toFixed(0)}% missed (threshold ${(config.missed_rate_warning * 100).toFixed(0)}%)`,
      });
    }
  });
  return gaps;
}

export function computeFunnel(calls: EnrichedCall[]): FunnelCounts {
  const answered = calls.filter((c) => c.status === 'answered');
  return {
    answered: answered.length,
    leadsMatched: answered.filter((c) => Boolean(c.lead_id)).length,
    bookedConsults: answered.filter((c) => c.bookedConsultWithinWindow).length,
    completedConsults: answered.filter((c) => c.completedConsultWithinWindow).length,
  };
}

export function computeCityOutcomes(calls: EnrichedCall[]): CityOutcomeRow[] {
  const byCity = new Map<string, EnrichedCall[]>();
  for (const c of calls) {
    const city = c.effectiveCity ?? 'Unknown';
    const list = byCity.get(city) ?? [];
    list.push(c);
    byCity.set(city, list);
  }
  const rows: CityOutcomeRow[] = [];
  byCity.forEach((slice, city) => {
    const answered = slice.filter((c) => c.status === 'answered');
    const booked = answered.filter((c) => c.bookedConsultWithinWindow);
    const lags = booked.map((c) => c.daysCallToBook).filter((x): x is number => x != null);
    let medianLagDays: number | null = null;
    if (lags.length > 0) {
      const s = [...lags].sort((a, b) => a - b);
      medianLagDays = s[Math.floor(s.length / 2)] ?? null;
    }
    rows.push({
      city,
      answered: answered.length,
      callToBookPct: answered.length > 0 ? booked.length / answered.length : null,
      bookedConsults: booked.length,
      medianLagDays,
    });
  });
  return rows.sort((a, b) => b.answered - a.answered);
}

export function buildPreviousPeriodFilter(f: CallCenterFilters): CallCenterFilters {
  const duration = f.endMs - f.startMs;
  return {
    ...f,
    startMs: f.startMs - duration,
    endMs: f.endMs - duration,
  };
}
