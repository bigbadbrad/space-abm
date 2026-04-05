import { isGoogleClickId, isMetaClickId } from '@/lib/everself/metrics';
import type { AppointmentRow, LeadRow } from '@/lib/everself/types';

export type DemoAttributionExtras = {
  match_rate: number;
  unmatched_count: number;
  missing_lead_id_count: number;
  lead_not_found_count: number;
  google_offline_ready_pct: number | null;
  meta_offline_ready_pct: number | null;
};

export function computeDemoAttributionExtras(leads: LeadRow[], appointments: AppointmentRow[]): DemoAttributionExtras {
  const leadIdSet = new Set(leads.map((l) => l.lead_id));
  const leadById = new Map(leads.map((l) => [l.lead_id, l]));

  let missing_lead_id_count = 0;
  let lead_not_found_count = 0;
  let matched = 0;

  for (const a of appointments) {
    const lid = (a.lead_id ?? '').trim();
    if (!lid) {
      missing_lead_id_count += 1;
      continue;
    }
    if (!leadIdSet.has(lid)) {
      lead_not_found_count += 1;
      continue;
    }
    matched += 1;
  }

  const n = appointments.length;
  const match_rate = n === 0 ? 0 : matched / n;
  const unmatched_count = n - matched;

  const matchedCompleted = appointments.filter((a) => {
    if (a.status !== 'completed') return false;
    const lid = (a.lead_id ?? '').trim();
    return Boolean(lid && leadIdSet.has(lid));
  });

  let googleReady = 0;
  let metaReady = 0;
  for (const a of matchedCompleted) {
    const lid = (a.lead_id ?? '').trim();
    const lead = leadById.get(lid);
    if (!lead) continue;
    if (isGoogleClickId(lead)) googleReady += 1;
    if (isMetaClickId(lead)) metaReady += 1;
  }

  const mc = matchedCompleted.length;
  return {
    match_rate,
    unmatched_count,
    missing_lead_id_count,
    lead_not_found_count,
    google_offline_ready_pct: mc === 0 ? null : googleReady / mc,
    meta_offline_ready_pct: mc === 0 ? null : metaReady / mc,
  };
}
