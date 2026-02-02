// ABM API client - fetches from space-api with auth
import { authClient } from '@/lib/auth/client';

const getBaseUrl = () => process.env.NEXT_PUBLIC_SPACE_API_BASE_URL || '';
const getToken = () => authClient.getToken();

async function abmFetch<T>(path: string, options?: RequestInit): Promise<{ data?: T; error?: string; status?: number }> {
  const base = getBaseUrl();
  if (!base) return { error: 'API URL not configured' };

  const token = getToken();
  if (!token) return { error: 'Not authenticated', status: 401 };

  const url = `${base}/api/abm${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...(options?.headers as Record<string, string>),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return {
        error: errBody.message || res.statusText || `Request failed (${res.status})`,
        status: res.status,
      };
    }
    const data = await res.json();
    return { data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error';
    return { error: msg };
  }
}

export interface ABMAccount {
  id: number;
  name: string;
  domain: string;
  intent_score: number;
  intent_stage?: string;
  surge_level?: string;
  top_lane?: string;
  lane_score_7d?: number;
  last_seen_at?: string;
  unique_people_7d?: number;
  why_hot: string[];
  latest_lead_request_id?: number;
}

export interface ABMAccountsResponse {
  accounts: ABMAccount[];
  total: number;
  page: number;
  limit: number;
}

export interface ABMLeadRequest {
  id: number;
  lead_score?: number;
  service_needed?: string;
  routing_status?: string;
  work_email?: string;
  organization_name?: string;
  organization_domain?: string;
  created_at: string;
  prospectCompany?: { id: number; name: string; domain: string; intent_score: number; stage: string };
  contact?: { id: number; email?: string; title?: string; status?: string };
}

export interface ABMLeadRequestsResponse {
  items: ABMLeadRequest[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ABMLane {
  lane: string;
  hot_count: number;
  surging_count: number;
  exploding_count: number;
  avg_intent_score: number;
  accounts: { id: number; name: string; domain: string; intent_score: number; surge_level?: string }[];
}

export interface ABMLanesResponse {
  lanes: ABMLane[];
}

export interface ABMLaneExplainerResponse {
  lane: string;
  why_trending: string;
  hot_count: number;
  surging_count: number;
  account_count: number;
  top_content: { name: string; score: number }[];
  top_lead_requests: {
    id: number;
    lead_score?: number;
    service_needed?: string;
    organization_name?: string;
    organization_domain?: string;
    created_at: string;
    prospect_company_id?: string;
  }[];
}

export interface ABMPerson {
  id: number;
  display: string;
  email?: string;
  account_name?: string;
  account_domain?: string;
  role?: string;
  last_seen_at?: string;
  top_categories_7d?: string[];
}

export interface ABMPeopleResponse {
  people: ABMPerson[];
}

export const abmApi = {
  getAccounts: (params?: { range?: string; stage?: string; lane?: string; surge?: string; search?: string; page?: number; limit?: number }) => {
    const sp = new URLSearchParams();
    if (params?.range) sp.set('range', params.range);
    if (params?.stage) sp.set('stage', params.stage);
    if (params?.lane) sp.set('lane', params.lane);
    if (params?.surge) sp.set('surge', params.surge);
    if (params?.search) sp.set('search', params.search);
    if (params?.page) sp.set('page', String(params.page));
    if (params?.limit) sp.set('limit', String(params.limit));
    const q = sp.toString();
    return abmFetch<ABMAccountsResponse>(`/accounts${q ? `?${q}` : ''}`);
  },
  getAccount: (id: string) => abmFetch<{ account: any; latest_snapshot: any; lane_breakdown: Record<string, number>; timeline_30d: any[]; lead_requests: any[]; contacts: any[]; cached_ai_summary?: any }>(`/accounts/${id}`),
  postAiSummary: (accountId: string) => abmFetch<{ summary: string; cached: boolean }>(`/accounts/${accountId}/ai-summary`, { method: 'POST' }),
  getLanes: (params?: { range?: string; lane?: string }) => {
    const sp = new URLSearchParams();
    if (params?.range) sp.set('range', params.range);
    if (params?.lane) sp.set('lane', params.lane);
    const q = sp.toString();
    return abmFetch<ABMLanesResponse>(`/lanes${q ? `?${q}` : ''}`);
  },
  getLaneExplainer: (params: { lane: string; range?: string }) => {
    const sp = new URLSearchParams();
    sp.set('lane', params.lane);
    if (params?.range) sp.set('range', params.range);
    return abmFetch<ABMLaneExplainerResponse>(`/lanes/explainer?${sp.toString()}`);
  },
  getPeople: (params?: { range?: string; account_id?: string }) => {
    const sp = new URLSearchParams();
    if (params?.range) sp.set('range', params.range);
    if (params?.account_id) sp.set('account_id', params.account_id);
    const q = sp.toString();
    return abmFetch<ABMPeopleResponse>(`/people${q ? `?${q}` : ''}`);
  },
  getLeadRequests: (params?: { status?: string; min_score?: number; service_needed?: string; prospect_company_id?: string; limit?: number; page?: number }) => {
    const sp = new URLSearchParams();
    if (params?.status) sp.set('status', params.status);
    if (params?.min_score != null) sp.set('min_score', String(params.min_score));
    if (params?.service_needed) sp.set('service_needed', params.service_needed);
    if (params?.prospect_company_id) sp.set('prospect_company_id', params.prospect_company_id);
    if (params?.limit) sp.set('limit', String(params.limit));
    if (params?.page) sp.set('page', String(params.page));
    const q = sp.toString();
    return abmFetch<ABMLeadRequestsResponse>(`/lead-requests${q ? `?${q}` : ''}`);
  },
  getLeadRequest: (id: string) => abmFetch<ABMLeadRequest>(`/lead-requests/${id}`),
  getActivity: (params?: { range?: string; limit?: number }) => {
    const sp = new URLSearchParams();
    if (params?.range) sp.set('range', params.range);
    if (params?.limit) sp.set('limit', String(params.limit));
    const q = sp.toString();
    return abmFetch<ABMActivityResponse>(`/activity${q ? `?${q}` : ''}`);
  },
  getOverview: (params?: { chart_range?: string }) => {
    const sp = new URLSearchParams();
    if (params?.chart_range) sp.set('chart_range', params.chart_range);
    const q = sp.toString();
    return abmFetch<ABMOverviewResponse>(`/overview${q ? `?${q}` : ''}`);
  },
  getQueue: (params?: { range?: string }) => {
    const sp = new URLSearchParams();
    if (params?.range) sp.set('range', params.range || '7d');
    return abmFetch<ABMQueueResponse>(`/queue?${sp.toString()}`);
  },
  postOperatorAction: (body: { action_type: string; prospect_company_id?: string; lead_request_id?: string; note?: string; snooze_until?: string }) =>
    abmFetch<unknown>('/operator-actions', { method: 'POST', body: JSON.stringify(body) }),
  // Admin (internal_admin only)
  getEventRules: () => abmFetch<{ rules: ABMEventRule[] }>('/admin/event-rules'),
  postEventRules: (body: Partial<ABMEventRule>) => abmFetch<{ rule: ABMEventRule }>('/admin/event-rules', { method: 'POST', body: JSON.stringify(body) }),
  patchEventRule: (id: string, body: Partial<ABMEventRule>) => abmFetch<{ rule: ABMEventRule }>(`/admin/event-rules/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteEventRule: (id: string) => abmFetch<{ message: string }>(`/admin/event-rules/${id}`, { method: 'DELETE' }),
  reorderEventRules: (ids: string[]) => abmFetch<{ message: string }>('/admin/event-rules/reorder', { method: 'POST', body: JSON.stringify({ ids }) }),
  testEventRule: (path: string, event_name: string) => abmFetch<{ matched: boolean; rule?: ABMEventRule; content_type?: string; lane?: string }>('/admin/event-rules/test', { method: 'POST', body: JSON.stringify({ path, event_name }) }),
  getPromptTemplates: () => abmFetch<{ templates: ABMPromptTemplate[] }>('/admin/prompt-templates'),
  postPromptTemplate: (body: Partial<ABMPromptTemplate>) => abmFetch<{ template: ABMPromptTemplate }>('/admin/prompt-templates', { method: 'POST', body: JSON.stringify(body) }),
  patchPromptTemplate: (id: string, body: Partial<ABMPromptTemplate>) => abmFetch<{ template: ABMPromptTemplate }>(`/admin/prompt-templates/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  getJobsStatus: () => abmFetch<{ last_recompute_date: string; accounts_scored_today: number; message: string }>('/admin/jobs/status'),
  runRecompute: () => abmFetch<{ message: string; jobId: string }>('/admin/jobs/recompute', { method: 'POST' }),
  getAuditLog: (params?: { limit?: number; offset?: number; table_name?: string }) => {
    const sp = new URLSearchParams();
    if (params?.limit) sp.set('limit', String(params.limit));
    if (params?.offset) sp.set('offset', String(params.offset));
    if (params?.table_name) sp.set('table_name', params.table_name);
    const q = sp.toString();
    return abmFetch<{ items: ABMAuditLogItem[]; total: number }>(`/admin/audit-log${q ? `?${q}` : ''}`);
  },
  getScoreConfigs: () => abmFetch<{ configs: ABMScoreConfig[] }>('/admin/score-configs'),
  postScoreConfig: (body: Partial<ABMScoreConfig>) => abmFetch<{ config: ABMScoreConfig }>('/admin/score-configs', { method: 'POST', body: JSON.stringify(body) }),
  patchScoreConfig: (id: string, body: Partial<ABMScoreConfig>) => abmFetch<{ config: ABMScoreConfig }>(`/admin/score-configs/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  activateScoreConfig: (id: string) => abmFetch<{ config: ABMScoreConfig }>(`/admin/score-configs/${id}/activate`, { method: 'POST' }),
  getScoreWeights: (scoreConfigId: string) => abmFetch<{ weights: ABMScoreWeight[] }>(`/admin/score-weights?score_config_id=${scoreConfigId}`),
  postScoreWeights: (scoreConfigId: string, weights: { event_name: string; content_type?: string | null; cta_id?: string | null; weight: number }[]) =>
    abmFetch<{ weights: ABMScoreWeight[] }>('/admin/score-weights', { method: 'POST', body: JSON.stringify({ score_config_id: scoreConfigId, weights }) }),
  getAccountScoringDetails: (accountId: string) => abmFetch<ABMScoringDetails>(`/accounts/${accountId}/scoring-details`),
  getLeadRequestScoringDetails: (leadRequestId: string) => abmFetch<ABMScoringDetails>(`/lead-requests/${leadRequestId}/scoring-details`),
};

export interface ABMScoringDetails {
  config_name: string | null;
  config_updated_at: string | null;
  top_contributors: { event_key: string; count: number; weight: number; contribution: number }[];
}

export interface ABMAuditLogItem {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  before_json: object | null;
  after_json: object | null;
  created_at: string;
}

export interface ABMScoreConfig {
  id: string;
  name: string;
  status: string;
  lambda_decay: number;
  normalize_k: number;
  cold_max: number;
  warm_max: number;
  surge_surging_min: number;
  surge_exploding_min: number;
  created_at?: string;
  updated_at?: string;
}

export interface ABMScoreWeight {
  id: string;
  score_config_id: string;
  event_name: string;
  content_type: string | null;
  cta_id: string | null;
  weight: number;
  created_at?: string;
  updated_at?: string;
}

export interface ABMEventRule {
  id: string;
  enabled: boolean;
  priority: number;
  event_name: string;
  match_type: string;
  match_value: string;
  content_type: string | null;
  lane: string | null;
  weight_override: number | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ABMPromptTemplate {
  id: string;
  enabled: boolean;
  lane: string;
  persona: string;
  intent_stage: string;
  version: string | null;
  system_prompt: string;
  user_prompt_template: string;
  max_words: number;
  created_at?: string;
  updated_at?: string;
}

export interface ABMActivityItem {
  id: string;
  time: string;
  account_id?: string;
  account_name?: string;
  account_domain?: string;
  person: string | null;
  activity_type?: string;
  lane?: string;
  weight?: number;
  link?: string | null;
}

export interface ABMActivityResponse {
  kpis: { events_today: number; accounts_active_7d: number; lead_requests_7d: number; exploding_accounts_7d: number };
  feed: ABMActivityItem[];
  trending_lanes: { name: string; score: number }[];
  trending_types: { name: string; score: number }[];
}

export interface ABMOverviewResponse {
  kpis: { hot_accounts: number; surging_accounts: number; new_lead_requests: number; top_lane: string | null; top_lane_hot_count: number | null };
  hot_accounts_preview: { id: string; name: string; domain: string; intent_score?: number; surge_level?: string; top_lane?: string }[];
  recent_lead_requests: { id: number; lead_score?: number; service_needed?: string; routing_status?: string; organization_name?: string; organization_domain?: string; created_at: string; prospectCompany?: { id: string; name: string; domain: string } }[];
  hot_over_time: { date: string; hot_count: number }[];
}

export type ABMQueueItemType = 'new_lead_request' | 'newly_hot' | 'spiking' | 'outbound' | 'stale_followup';

export interface ABMQueueItem {
  type: ABMQueueItemType;
  lead_request_id?: string;
  prospect_company_id?: string;
  org_name?: string;
  name?: string;
  domain?: string;
  lane?: string;
  lead_score?: number;
  intent_score?: number;
  surge_level?: string;
  top_lane?: string;
  why_hot?: string[];
  submitted_at?: string;
  changed_at?: string;
  last_contacted_at?: string | null;
}

export interface ABMQueueResponse {
  generated_at: string;
  items: ABMQueueItem[];
}
