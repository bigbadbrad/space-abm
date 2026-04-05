import type { EverselfFiltersState } from '@/components/everself/everself-filters-bar';
import type { AppointmentRow, LeadRow } from '@/lib/everself/types';

export function leadDateKey(l: LeadRow): string {
  return l.date ?? l.created_at.slice(0, 10);
}

export function leadInFilters(
  l: LeadRow,
  f: EverselfFiltersState,
  opts?: { campaign?: string; search?: string }
): boolean {
  const d = leadDateKey(l);
  const start = f.start.format('YYYY-MM-DD');
  const end = f.end.format('YYYY-MM-DD');
  if (d < start || d > end) return false;
  if (f.city && l.city !== f.city) return false;
  if (f.channel !== 'all' && l.channel !== f.channel) return false;
  const camp = f.campaign.trim().toLowerCase();
  if (camp && !(l.utm_campaign ?? '').toLowerCase().includes(camp)) return false;
  const q = (opts?.search ?? '').trim().toLowerCase();
  if (q && !l.lead_id.toLowerCase().includes(q)) return false;
  return true;
}

export function appointmentBookedDateKey(a: AppointmentRow): string {
  return a.booked_at.slice(0, 10);
}

export type ApptStatusFilter = 'all' | 'booked' | 'completed' | 'canceled' | 'no_show';

export function appointmentInFilters(
  a: AppointmentRow,
  leads: LeadRow[],
  f: EverselfFiltersState,
  status: ApptStatusFilter,
  leadById: Map<string, LeadRow>
): boolean {
  const bd = appointmentBookedDateKey(a);
  const start = f.start.format('YYYY-MM-DD');
  const end = f.end.format('YYYY-MM-DD');
  if (bd < start || bd > end) return false;
  if (status !== 'all' && a.status !== status) return false;

  const lid = (a.lead_id ?? '').trim();
  const lead = lid ? leadById.get(lid) : undefined;
  if (f.city) {
    const city = lead?.city ?? a.city;
    if (city !== f.city) return false;
  }
  if (f.channel !== 'all') {
    if (!lead || lead.channel !== (f.channel as LeadRow['channel'])) return false;
  }
  const camp = f.campaign.trim().toLowerCase();
  if (camp && (!lead || !(lead.utm_campaign ?? '').toLowerCase().includes(camp))) return false;
  return true;
}
