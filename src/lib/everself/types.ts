export type Channel = 'google' | 'meta';

export type SpendRow = {
  date: string;
  city: string;
  channel: Channel;
  platform?: string;
  campaign_id?: string | null;
  campaign_name?: string | null;
  adset_id?: string | null;
  adset_name?: string | null;
  spend: number;
  impressions?: number;
  clicks?: number;
};

export type LeadRow = {
  lead_id: string;
  created_at: string;
  date?: string;
  city: string;
  channel: Channel;
  campaign_id?: string | null;
  adset_id?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  gclid?: string | null;
  wbraid?: string | null;
  gbraid?: string | null;
  fbclid?: string | null;
  fbp?: string | null;
  fbc?: string | null;
};

export type AppointmentRow = {
  appointment_id: string;
  lead_id: string;
  city: string;
  booked_at: string;
  completed_at?: string | null;
  status: 'booked' | 'completed' | 'canceled' | 'no_show';
  type?: string;
};

export type CreativeAssetRow = {
  creative_id: string;
  hook_tag?: string;
  format?: string;
  headline?: string;
  notes?: string;
  utm_content?: string;
};

export type EverselfTargets = {
  cost_per_booked: number;
  lead_to_book_rate_min: number;
  min_booked_consults_for_confidence: number;
};

export type EverselfConfig = {
  targets: EverselfTargets;
};

export type BookingGroupMode = 'booked' | 'lead';

export type MarketingRoiDailyByCity = {
  date: string;
  city: string;
  channel: Channel;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  booked_consults: number;
  completed_consults: number;
  cost_per_lead: number | null;
  cost_per_booked: number | null;
  cost_per_completed: number | null;
  lead_to_book_rate: number | null;
  book_to_complete_rate: number | null;
  median_days_lead_to_book: number | null;
  p75_days_lead_to_book: number | null;
  attribution: {
    lead_click_id_coverage: number | null;
    google_click_id_coverage: number | null;
    meta_click_id_coverage: number | null;
    unattributed_leads: number;
  };
};

export type CityPeriodAggregate = {
  city: string;
  spend: number;
  leads: number;
  booked_consults: number;
  completed_consults: number;
  impressions: number;
  clicks: number;
  cost_per_lead: number | null;
  cost_per_booked: number | null;
  cost_per_completed: number | null;
  lead_to_book_rate: number | null;
  book_to_complete_rate: number | null;
  median_days_lead_to_book: number | null;
  scale_signal: 'green' | 'yellow' | 'red';
};

export type ChannelPeriodAggregate = {
  channel: Channel;
  spend: number;
  leads: number;
  booked_consults: number;
  completed_consults: number;
  impressions: number;
  clicks: number;
};

export type KpiHeadline = {
  spend: number;
  /** Ad clicks (from spend rows) in the selected period. */
  clicks: number;
  leads: number;
  booked_consults: number;
  completed_consults: number;
  cost_per_lead: number | null;
  cost_per_booked: number | null;
  cost_per_completed: number | null;
  median_days_lead_to_book: number | null;
  deltas: {
    spend_pct: number | null;
    clicks_pct: number | null;
    leads_pct: number | null;
    booked_pct: number | null;
    completed_pct: number | null;
    cpl_pct: number | null;
    cp_booked_pct: number | null;
    cp_completed_pct: number | null;
    median_lag_pct: number | null;
  };
};

export type Diagnostics = {
  cpc: number | null;
  ctr: number | null;
  lead_rate: number | null;
  book_rate: number | null;
  pct_leads_missing_city: number;
  pct_leads_missing_channel: number;
  pct_leads_missing_campaign_id: number;
  leads_with_any_click_id_pct: number;
  google_click_id_coverage_pct: number | null;
  meta_click_id_coverage_pct: number | null;
  unattributed_leads: number;
  attributed_leads: number;
};

export type CreativePerformanceRow = {
  utm_content: string;
  hook_tag?: string;
  format?: string;
  headline?: string;
  spend: number | null;
  leads: number;
  booked_consults: number;
  completed_consults: number;
  cost_per_lead: number | null;
  cost_per_booked: number | null;
  ctr: number | null;
};

export type MarketingRoiResponse = {
  meta: { generated_at: string; source: string };
  config: EverselfConfig;
  booking_group: BookingGroupMode;
  /** Distinct cities present in leads for the selected date range (before city filter). */
  available_cities: string[];
  kpis: KpiHeadline;
  daily: MarketingRoiDailyByCity[];
  by_city: CityPeriodAggregate[];
  by_channel: ChannelPeriodAggregate[];
  creative: CreativePerformanceRow[];
  diagnostics: Diagnostics;
  /** Series for charts: one row per date in range */
  trend: {
    date: string;
    spend_google: number;
    spend_meta: number;
    booked_google: number;
    booked_meta: number;
    booked_total: number;
    cp_booked_google: number | null;
    cp_booked_meta: number | null;
    cp_booked_total: number | null;
  }[];
};
