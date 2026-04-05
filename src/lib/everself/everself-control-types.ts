import type { Channel } from '@/lib/everself/types';

export type DemoCampaignRow = {
  campaign_id: string;
  platform: string;
  channel: Channel;
  campaign_name: string;
  city: string;
  objective: string;
  status: 'active' | 'paused';
  daily_budget: number;
  target_cpa_booked: number;
  target_cpa_completed: number;
  start_date: string;
  end_date: string | null;
};

export type ChangeActor = {
  type: string;
  name?: string;
  email?: string;
};

export type ChangeHistoryRow = {
  change_id: string;
  platform: string;
  channel: Channel;
  city?: string;
  campaign_id?: string;
  campaign_name?: string;
  change_type: 'BUDGET_CHANGE' | 'BID_STRATEGY_CHANGE' | 'CREATIVE_UPDATE' | 'STRUCTURE_CHANGE';
  object_type: string;
  object_id: string;
  field: string;
  before: string | number | boolean | null;
  after: string | number | boolean | null;
  actor?: ChangeActor;
  detected_at: string;
  source?: string;
  notes?: string | null;
};

export type ControlAnnotation = {
  annotation_id: string;
  ts: string;
  scope: 'global' | 'city' | 'campaign';
  entity_id: string;
  label: string;
  details: string;
  author: string;
};

export type CampaignOverride = {
  status?: 'active' | 'paused';
  daily_budget?: number;
  target_cpa_booked?: number;
  target_cpa_completed?: number;
  notes?: string;
  updated_at: string;
};

export type CityBudgetOverride = {
  weekly_budget?: number;
  channel_split?: { google: number; meta: number };
  notes?: string;
  updated_at: string;
};

export type ControlChangeLogEntry = {
  id: string;
  ts: string;
  actor: 'user' | 'auto';
  scope: 'campaign' | 'city_budget' | 'annotation';
  entity_id: string;
  action: string;
  reason: string;
  before: unknown;
  after: unknown;
};

export type DemoChangeEvent = {
  change_id: string;
  platform: string;
  channel: Channel;
  city?: string;
  campaign_id?: string;
  campaign_name?: string;
  change_type: ChangeHistoryRow['change_type'];
  object_type: string;
  object_id: string;
  field: string;
  before: string | number | boolean | null;
  after: string | number | boolean | null;
  actor?: ChangeActor;
  detected_at: string;
  source: 'demo';
};

export type ControlStateV2 = {
  last_updated_at: string;
  overrides: {
    campaigns: Record<string, CampaignOverride>;
    city_budgets: Record<string, CityBudgetOverride>;
  };
  annotations: ControlAnnotation[];
  alert_rules: Record<string, { enabled: boolean; cooldown_days: number }>;
  last_rule_run_at?: string;
  change_log: ControlChangeLogEntry[];
  /** User / rule actions that appear on Pulse timeline as demo-sourced changes. */
  demo_changes: DemoChangeEvent[];
  acknowledged_alerts: Record<string, string>;
};

export type SpendDailyRow = {
  date: string;
  city: string;
  channel: Channel;
  platform: string;
  campaign_id: string;
  campaign_name: string;
  spend: number;
  impressions: number;
  clicks: number;
};

export type ControlAlertItem = {
  id: string;
  severity: 'high' | 'med' | 'low';
  ts: string;
  summary: string;
  rule: string;
  change_id?: string;
};
