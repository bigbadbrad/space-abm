import type { AppointmentRow } from '@/lib/everself/types';

export type CallStatus = 'answered' | 'missed' | 'abandoned' | 'voicemail' | 'failed';

export type CallRow = {
  call_id: string;
  started_at: string;
  answered_at?: string | null;
  ended_at?: string | null;
  from_number: string;
  to_tracking_number: string;
  forwarded_to?: string | null;
  city: string | null;
  status: CallStatus;
  end_reason?: string | null;
  agent_id?: string | null;
  recording_url?: string | null;
  dni_assignment_id?: string | null;
  lead_id?: string | null;
  appointment_id?: string | null;
  utm_source?: string | null;
  utm_campaign?: string | null;
  channel?: string | null;
  gclid?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  talk_seconds?: number | null;
  ring_seconds?: number | null;
};

export type DniAssignment = {
  dni_assignment_id: string;
  tracking_number: string;
  session_id?: string | null;
  assigned_at: string;
  expires_at: string;
  city: string | null;
  landing_path?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  channel: string | null;
  gclid?: string | null;
  wbraid?: string | null;
  gbraid?: string | null;
  fbclid?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  posthog_distinct_id?: string | null;
};

export type AgentRow = {
  agent_id: string;
  name: string;
  city: string;
  team?: string;
  active: boolean;
};

export type CallCenterConfig = {
  service_level_seconds: number;
  asa_warning_seconds: number;
  missed_rate_warning: number;
  booking_window_days: number;
  include_voicemail_as_missed: boolean;
};

export type CallCenterFilters = {
  startMs: number;
  endMs: number;
  cities: string[];
  channels: string[];
  campaignSearch: string;
  agentId: string | null;
  includeVoicemailAsMissed: boolean;
  bookingWindowDays: number;
};

export type EnrichedCall = CallRow & {
  assignment: DniAssignment | null;
  effectiveCity: string | null;
  effectiveChannel: string;
  effectiveUtmCampaign: string | null;
  clickIdPresent: boolean;
  attributionMatched: boolean;
  asaSeconds: number | null;
  ahtSeconds: number | null;
  isMissedForKpi: boolean;
  bookedConsultWithinWindow: boolean;
  completedConsultWithinWindow: boolean;
  daysCallToBook: number | null;
};

export type ExecutiveKpis = {
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  abandonedCalls: number;
  missedRate: number | null;
  abandonRate: number | null;
  asaSeconds: number | null;
  serviceLevelPct: number | null;
  ahtSeconds: number | null;
  bookedConsultsFromCalls: number;
  callToBookRate: number | null;
  attributionMatchRate: number | null;
  clickIdCoveragePct: number | null;
  /** vs previous period of equal length */
  delta: {
    totalCalls: number;
    missedRate: number | null;
    callToBookRate: number | null;
    asaSeconds: number | null;
  };
};

export type CityChannelCell = {
  city: string;
  channel: string;
  calls: number;
  answeredPct: number | null;
  missedPct: number | null;
  callToBookPct: number | null;
};

export type DailyPoint = { date: string; total: number; missedRate: number | null; callToBookRate: number | null };

export type HeatmapCell = { dow: number; hour: number; missed: number };

export type MissedBySourceRow = {
  channel: string;
  campaign: string;
  totalCalls: number;
  missedCalls: number;
  missedPct: number | null;
  estLostBookings: number;
};

export type AgentPerfRow = {
  agent_id: string;
  name: string;
  answered: number;
  avgHandleSeconds: number | null;
  callToBookPct: number | null;
};

export type CallGap = { kind: 'city_missed' | 'asa' | 'service_level'; label: string; detail: string };

export type FunnelCounts = {
  answered: number;
  leadsMatched: number;
  bookedConsults: number;
  completedConsults: number;
};

export type CityOutcomeRow = {
  city: string;
  answered: number;
  callToBookPct: number | null;
  bookedConsults: number;
  medianLagDays: number | null;
};

export function appointmentIndex(appointments: AppointmentRow[]): Map<string, AppointmentRow[]> {
  const m = new Map<string, AppointmentRow[]>();
  for (const a of appointments) {
    const list = m.get(a.lead_id) ?? [];
    list.push(a);
    m.set(a.lead_id, list);
  }
  return m;
}
