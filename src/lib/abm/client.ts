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

export interface ABMMission {
  id: string;
  title: string;
  service_lane?: string;
  stage?: string;
  priority?: string;
  owner_user_id?: string;
  prospect_company_id?: string;
  primary_contact_id?: string;
  lead_request_id?: string;
  mission_type?: string;
  mission_pattern?: string;
  target_orbit?: string;
  inclination_deg?: number;
  payload_mass_kg?: number;
  payload_volume?: string;
  earliest_date?: string;
  latest_date?: string;
  schedule_urgency?: string;
  integration_status?: string;
  readiness_confidence?: string;
  funding_status?: string;
  budget_band?: string;
  confidence?: number;
  source?: string;
  next_step?: string;
  next_step_due_at?: string;
  last_activity_at?: string;
  created_at?: string;
  updated_at?: string;
  prospectCompany?: { id: string; name: string; domain: string };
  owner?: { id: string; name?: string; preferred_name?: string; email?: string };
  primaryContact?: { id: string; email?: string; first_name?: string; last_name?: string; title?: string };
  leadRequest?: unknown;
}

export interface ABMMissionsSummaryResponse {
  active: number;
  due_soon: number;
  stale: number;
  hot: number;
  by_stage: Record<string, number>;
  by_lane: Record<string, number>;
}

export interface ABMMissionsResponse {
  missions: ABMMission[];
  total: number;
  page: number;
  limit: number;
}

export interface ABMMissionLinkedProgram {
  id: string;
  mission_id: string;
  procurement_program_id: string;
  program?: { id: string; title: string; status: string; posted_at?: string; due_at?: string; service_lane?: string; url?: string };
}

export interface ABMMissionDetailResponse {
  mission: ABMMission & {
    artifacts?: { id: string; type: string; title?: string; url?: string; createdBy?: { id: string; name?: string; preferred_name?: string } }[];
    activities?: { id: string; type: string; body: string; created_at: string; createdBy?: { id: string; name?: string; preferred_name?: string } }[];
    contacts?: { id: string; email?: string; first_name?: string; last_name?: string; title?: string; MissionContact?: { role?: string } }[];
  };
  account_summary?: { intent_score?: number; intent_stage?: string; surge_level?: string; top_lane?: string };
  related_lead_requests?: unknown[];
  related_intent_signals?: unknown[];
  linked_programs?: ABMMissionLinkedProgram[];
}

export interface ABMProgram {
  id: string;
  title: string;
  source: string;
  status: string;
  posted_at?: string | null;
  due_at?: string | null;
  service_lane?: string | null;
  topic?: string | null;
  agency?: string | null;
  url?: string | null;
  external_id?: string;
  linked_accounts_count?: number;
  linked_missions_count?: number;
  relevance_score?: number;
  match_confidence?: number;
  suppressed?: boolean;
  suppressed_reason?: string | null;
  reasons_summary?: string | null;
}

export interface ABMProgramsSummaryResponse {
  counts_by_lane: Record<string, number>;
  open_count: number;
  due_soon_count: number;
  new_posted_count: number;
  awarded_count: number;
  top_agencies: { name: string; count: number }[];
}

export interface ABMProgramsResponse {
  programs: ABMProgram[];
  total: number;
}

export interface ABMProgramAccountLink {
  id: string;
  prospect_company_id: string;
  link_type: string;
  confidence: number;
  prospectCompany?: { id: string; name: string; domain: string };
}

export interface ABMProgramMissionLink {
  id: string;
  mission_id: string;
  notes?: string | null;
  mission?: { id: string; title: string; stage?: string; service_lane?: string };
}

export interface ABMProgramDetail {
  id: string;
  title: string;
  source: string;
  status: string;
  summary?: string | null;
  agency?: string | null;
  office?: string | null;
  naics?: string | null;
  psc?: string | null;
  set_aside?: string | null;
  notice_type?: string | null;
  posted_at?: string | null;
  due_at?: string | null;
  url?: string | null;
  service_lane?: string | null;
  topic?: string | null;
  weight_override?: number | null;
  accountLinks?: (ABMProgramAccountLink & { prospectCompany?: { id: string; name: string; domain: string } })[];
  missionLinks?: (ABMProgramMissionLink & { mission?: { id: string; title: string; stage?: string; service_lane?: string } })[];
  intent_signals?: { id: string; prospect_company_id: string; occurred_at: string; topic?: string; weight?: number; source?: string }[];
  relevance_score?: number;
  match_confidence?: number;
  match_reasons_json?: { type: string; rule_id?: string; label?: string; add_score?: number }[];
  suppressed?: boolean;
  suppressed_reason?: string | null;
  suppression_reason?: string | null;
}

/** Program detail view model (API returns this shape) */
export interface ABMProgramDetailView {
  program: ABMProgramDetail;
  overview: {
    agency?: string | null;
    office?: string | null;
    agency_path?: string | null;
    notice_type?: string | null;
    posted_at?: string | null;
    updated_at_source?: string | null;
    due_at?: string | null;
    set_aside?: string | null;
    naics?: string | null;
    psc?: string | null;
    place_of_performance?: { country?: string; state?: string; city?: string } | null;
    contract_type?: string | null;
    estimated_value?: unknown;
    solicitation_number?: string | null;
    primary_urls?: string[];
  };
  requirements: {
    description?: string | null;
    extracted?: {
      objective?: string | null;
      scope?: string[];
      deliverables?: string[];
      submission?: string[];
      evaluation?: string[];
    };
  };
  attachments: { url: string; title?: string }[];
  contacts: { role?: string; name?: string | null; email?: string | null; phone?: string | null }[];
  triage: {
    owner_user_id?: string | null;
    owner?: { id: string; name?: string; email?: string } | null;
    triage_status?: string | null;
    priority?: string | null;
    internal_notes?: string | null;
    last_triaged_at?: string | null;
  };
  matching: {
    relevance_score?: number;
    match_confidence?: number;
    match_reasons_json?: { label?: string; add_score?: number }[];
    classification_version?: string;
    suppressed?: boolean;
    suppressed_reason?: string | null;
  };
  why_matched?: string;
  notes: { id: string; note: string; created_at: string; user?: { id: string; name?: string; preferred_name?: string; email?: string } }[];
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
  mission_id?: string | null;
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
  promoteLeadRequest: (id: string, body?: { title?: string; owner_user_id?: string; priority?: string }) =>
    abmFetch<{ mission: ABMMission; message: string }>(`/lead-requests/${id}/promote`, { method: 'POST', body: JSON.stringify(body || {}) }),
  // Programs (Procurement Radar)
  getProgramsSummary: (params?: { range?: string }) => {
    const sp = new URLSearchParams();
    if (params?.range) sp.set('range', params.range);
    return abmFetch<ABMProgramsSummaryResponse>(`/programs/summary${sp.toString() ? `?${sp}` : ''}`);
  },
  getPrograms: (params?: { range?: string; status?: string; lane?: string; source?: string; topic?: string; agency?: string; due?: string; search?: string; page?: number; limit?: number; sort?: string; relevant?: 'true' | 'false' | 'suppressed'; min_score?: number; suppressed?: string }) => {
    const sp = new URLSearchParams();
    if (params?.range) sp.set('range', params.range);
    if (params?.status) sp.set('status', params.status);
    if (params?.lane) sp.set('lane', params.lane);
    if (params?.source) sp.set('source', params.source);
    if (params?.topic) sp.set('topic', params.topic);
    if (params?.agency) sp.set('agency', params.agency);
    if (params?.due) sp.set('due', params.due);
    if (params?.search) sp.set('search', params.search);
    if (params?.page) sp.set('page', String(params.page));
    if (params?.limit) sp.set('limit', String(params.limit));
    if (params?.sort) sp.set('sort', params.sort);
    if (params?.relevant) sp.set('relevant', params.relevant);
    if (params?.min_score != null) sp.set('min_score', String(params.min_score));
    if (params?.suppressed) sp.set('suppressed', params.suppressed);
    const q = sp.toString();
    return abmFetch<ABMProgramsResponse>(`/programs${q ? `?${q}` : ''}`);
  },
  getProgram: (id: string) => abmFetch<ABMProgramDetailView>(`/programs/${id}`),
  patchProgram: (id: string, body: { owner_user_id?: string; triage_status?: string; priority?: string; internal_notes?: string; suppressed?: boolean; suppressed_reason?: string }) =>
    abmFetch<ABMProgramDetail>(`/programs/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  postProgramNote: (id: string, note: string) => abmFetch<{ note: { id: string; note: string; created_at: string; user?: { id: string; name?: string; preferred_name?: string } } }>(`/programs/${id}/notes`, { method: 'POST', body: JSON.stringify({ note }) }),
  postProgramLinkAccount: (id: string, body: { prospect_company_id: string; link_type?: string; confidence?: number; evidence_json?: object }) =>
    abmFetch<{ link: ABMProgramAccountLink }>(`/programs/${id}/link-account`, { method: 'POST', body: JSON.stringify(body) }),
  deleteProgramLinkAccount: (id: string, linkId: string) =>
    abmFetch<{ message: string }>(`/programs/${id}/link-account/${linkId}`, { method: 'DELETE' }),
  postProgramLinkMission: (id: string, body: { mission_id: string; notes?: string }) =>
    abmFetch<{ link: ABMProgramMissionLink }>(`/programs/${id}/link-mission`, { method: 'POST', body: JSON.stringify(body) }),
  postProgramCreateMission: (id: string, body?: { owner_user_id?: string; title?: string; priority?: string }) =>
    abmFetch<{ mission: ABMMission; message: string }>(`/programs/${id}/create-mission`, { method: 'POST', body: JSON.stringify(body || {}) }),
  getMissionsSummary: (params?: { range?: string }) => {
    const sp = new URLSearchParams();
    if (params?.range) sp.set('range', params.range);
    return abmFetch<ABMMissionsSummaryResponse>(`/missions/summary${sp.toString() ? `?${sp}` : ''}`);
  },
  getMissions: (params?: { range?: string; stage?: string; lane?: string; owner?: string; search?: string; sort?: string; page?: number; limit?: number; due_soon?: string; stale?: string; hot?: string }) => {
    const sp = new URLSearchParams();
    if (params?.range) sp.set('range', params.range);
    if (params?.stage) sp.set('stage', params.stage);
    if (params?.lane) sp.set('lane', params.lane);
    if (params?.owner) sp.set('owner', params.owner);
    if (params?.search) sp.set('search', params.search);
    if (params?.sort) sp.set('sort', params.sort);
    if (params?.page) sp.set('page', String(params.page));
    if (params?.limit) sp.set('limit', String(params.limit));
    if (params?.due_soon) sp.set('due_soon', params.due_soon);
    if (params?.stale) sp.set('stale', params.stale);
    if (params?.hot) sp.set('hot', params.hot);
    const q = sp.toString();
    return abmFetch<ABMMissionsResponse>(`/missions${q ? `?${q}` : ''}`);
  },
  getMission: (id: string) => abmFetch<ABMMissionDetailResponse>(`/missions/${id}`),
  postMission: (body: Partial<ABMMission>) => abmFetch<ABMMission>(`/missions`, { method: 'POST', body: JSON.stringify(body) }),
  patchMission: (id: string, body: Partial<ABMMission>) => abmFetch<ABMMission>(`/missions/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  closeMission: (id: string, body: { outcome: 'won' | 'lost' | 'on_hold'; reason?: string }) =>
    abmFetch<ABMMission>(`/missions/${id}/close`, { method: 'POST', body: JSON.stringify(body) }),
  patchMissionNextStep: (id: string, next_step: string, next_step_due_at?: string) =>
    abmFetch<ABMMission>(`/missions/${id}`, { method: 'PATCH', body: JSON.stringify({ next_step, next_step_due_at }) }),
  postMissionContact: (id: string, body: { contact_id: string; role?: string }) =>
    abmFetch<unknown>(`/missions/${id}/contacts`, { method: 'POST', body: JSON.stringify(body) }),
  deleteMissionContact: (id: string, contactId: string) =>
    abmFetch<{ message: string }>(`/missions/${id}/contacts/${contactId}`, { method: 'DELETE' }),
  postMissionArtifact: (id: string, body: { type: string; title?: string; url?: string }) =>
    abmFetch<unknown>(`/missions/${id}/artifacts`, { method: 'POST', body: JSON.stringify(body) }),
  deleteMissionArtifact: (id: string, artifactId: string) =>
    abmFetch<{ message: string }>(`/missions/${id}/artifacts/${artifactId}`, { method: 'DELETE' }),
  postMissionActivity: (id: string, body: { type?: string; body: string }) =>
    abmFetch<unknown>(`/missions/${id}/activities`, { method: 'POST', body: JSON.stringify(body) }),
  postMissionAiBrief: (id: string) =>
    abmFetch<{ summary_md: string; cached?: boolean }>(`/missions/${id}/ai-brief`, { method: 'POST' }),
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
  getMissionTemplates: () => abmFetch<{ templates: ABMMissionTemplate[] }>('/admin/mission-templates'),
  postMissionTemplate: (body: Partial<ABMMissionTemplate>) => abmFetch<{ template: ABMMissionTemplate }>('/admin/mission-templates', { method: 'POST', body: JSON.stringify(body) }),
  patchMissionTemplate: (id: string, body: Partial<ABMMissionTemplate>) => abmFetch<{ template: ABMMissionTemplate }>(`/admin/mission-templates/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteMissionTemplate: (id: string) => abmFetch<{ message: string }>(`/admin/mission-templates/${id}`, { method: 'DELETE' }),
  postScoreWeights: (scoreConfigId: string, weights: { event_name: string; content_type?: string | null; cta_id?: string | null; weight: number }[]) =>
    abmFetch<{ weights: ABMScoreWeight[] }>('/admin/score-weights', { method: 'POST', body: JSON.stringify({ score_config_id: scoreConfigId, weights }) }),
  getAccountScoringDetails: (accountId: string) => abmFetch<ABMScoringDetails>(`/accounts/${accountId}/scoring-details`),
  getLeadRequestScoringDetails: (leadRequestId: string) => abmFetch<ABMScoringDetails>(`/lead-requests/${leadRequestId}/scoring-details`),
  // Procurement admin
  getTopicRules: () => abmFetch<{ rules: ABMTopicRule[] }>('/admin/topic-rules'),
  postTopicRule: (body: Partial<ABMTopicRule>) => abmFetch<{ rule: ABMTopicRule }>('/admin/topic-rules', { method: 'POST', body: JSON.stringify(body) }),
  patchTopicRule: (id: string, body: Partial<ABMTopicRule>) => abmFetch<{ rule: ABMTopicRule }>(`/admin/topic-rules/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  reorderTopicRules: (ids: string[]) => abmFetch<{ message: string }>('/admin/topic-rules/reorder', { method: 'POST', body: JSON.stringify({ ids }) }),
  getSourceWeights: () => abmFetch<{ weights: ABMSourceWeight[] }>('/admin/source-weights'),
  postSourceWeight: (body: { source: string; multiplier?: number; enabled?: boolean }) => abmFetch<{ weight: ABMSourceWeight }>('/admin/source-weights', { method: 'POST', body: JSON.stringify(body) }),
  getImportRuns: () => abmFetch<{ runs: ABMImportRun[] }>('/admin/import-runs'),
  runSamImport: () => abmFetch<{ message: string }>('/jobs/import-sam', { method: 'POST' }),
  runUsaspendingIngest: (days?: number) =>
    abmFetch<{ message: string }>('/jobs/ingest-usaspending', { method: 'POST', body: JSON.stringify({ days: days ?? 30 }) }),
  runSpacewerxIngest: () => abmFetch<{ message: string }>('/jobs/ingest-spacewerx', { method: 'POST' }),
  flushCache: () => abmFetch<{ message: string }>('/admin/cache/flush', { method: 'POST' }),
  getProgramRules: () => abmFetch<{ rules: ABMProgramRule[] }>('/admin/program-rules'),
  postProgramRule: (body: Partial<ABMProgramRule>) => abmFetch<{ rule: ABMProgramRule }>('/admin/program-rules', { method: 'POST', body: JSON.stringify(body) }),
  patchProgramRule: (id: string, body: Partial<ABMProgramRule>) => abmFetch<{ rule: ABMProgramRule }>(`/admin/program-rules/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  getProgramSuppressionRules: () => abmFetch<{ rules: ABMProgramSuppressionRule[] }>('/admin/program-suppression-rules'),
  postProgramSuppressionRule: (body: Partial<ABMProgramSuppressionRule>) => abmFetch<{ rule: ABMProgramSuppressionRule }>('/admin/program-suppression-rules', { method: 'POST', body: JSON.stringify(body) }),
  patchProgramSuppressionRule: (id: string, body: Partial<ABMProgramSuppressionRule>) => abmFetch<{ rule: ABMProgramSuppressionRule }>(`/admin/program-suppression-rules/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  getLaneDefinitions: () => abmFetch<{ lanes: ABMLaneDefinition[] }>('/admin/lane-definitions'),
  getAgencyBlacklist: () => abmFetch<{ entries: ABMAgencyBlacklistEntry[] }>('/admin/agency-blacklist'),
  postAgencyBlacklist: (body: { agency_pattern: string; notes?: string; enabled?: boolean }) =>
    abmFetch<{ entry: ABMAgencyBlacklistEntry }>('/admin/agency-blacklist', { method: 'POST', body: JSON.stringify(body) }),
  deleteAgencyBlacklist: (id: string) => abmFetch<{ message: string }>(`/admin/agency-blacklist/${id}`, { method: 'DELETE' }),
  patchAgencyBlacklist: (id: string, body: { agency_pattern?: string; notes?: string; enabled?: boolean }) =>
    abmFetch<{ entry: ABMAgencyBlacklistEntry }>(`/admin/agency-blacklist/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  reclassifyPrograms: (range?: string) => abmFetch<{ message: string }>(`/admin/programs/reclassify?range=${range || '7d'}`, { method: 'POST' }),
  overrideProgramClassification: (id: string, body: { service_lane?: string; topic?: string; relevance_score?: number; suppressed?: boolean; notes?: string }) =>
    abmFetch<{ program: ABMProgramDetail }>(`/admin/programs/${id}/override`, { method: 'POST', body: JSON.stringify(body) }),
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

export interface ABMMissionTemplate {
  id: string;
  lane: string;
  template_name: string;
  default_title_pattern?: string | null;
  default_fields_json?: Record<string, unknown> | null;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ABMTopicRule {
  id: string;
  enabled: boolean;
  priority: number;
  source?: string | null;
  match_field?: string | null;
  match_type?: string | null;
  match_value?: string | null;
  service_lane?: string | null;
  topic?: string | null;
  weight?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface ABMSourceWeight {
  source: string;
  multiplier: number;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ABMImportRun {
  id: string;
  source: string;
  started_at: string;
  finished_at?: string | null;
  status: string;
  records_fetched?: number | null;
  records_upserted?: number | null;
  error_count?: number | null;
  error_sample_json?: unknown | null;
  created_at?: string;
  updated_at?: string;
}

export interface ABMProgramRule {
  id: string;
  enabled: boolean;
  priority: number;
  match_field?: string | null;
  match_type?: string | null;
  match_value?: string | null;
  service_lane?: string | null;
  topic?: string | null;
  add_score: number;
  set_confidence?: number | null;
  notes?: string | null;
}

export interface ABMProgramSuppressionRule {
  id: string;
  enabled: boolean;
  priority: number;
  match_field?: string | null;
  match_type?: string | null;
  match_value?: string | null;
  suppress_reason?: string | null;
  suppress_score_threshold?: number | null;
}

export interface ABMLaneDefinition {
  lane_key: string;
  display_name: string;
  description?: string | null;
  keywords_json?: string[] | null;
}

export interface ABMAgencyBlacklistEntry {
  id: string;
  agency_pattern: string;
  enabled: boolean;
  notes?: string | null;
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

export type ABMQueueItemType = 'new_lead_request' | 'newly_hot' | 'spiking' | 'outbound' | 'stale_followup' | 'mission_due' | 'mission_stale' | 'mission_new';

export interface ABMQueueItem {
  type: ABMQueueItemType;
  lead_request_id?: string;
  prospect_company_id?: string;
  mission_id?: string;
  org_name?: string;
  name?: string;
  domain?: string;
  title?: string;
  lane?: string;
  lead_score?: number;
  intent_score?: number;
  surge_level?: string;
  top_lane?: string;
  why_hot?: string[];
  submitted_at?: string;
  changed_at?: string;
  created_at?: string;
  last_contacted_at?: string | null;
  next_step_due_at?: string;
  last_activity_at?: string;
}

export interface ABMQueueResponse {
  generated_at: string;
  items: ABMQueueItem[];
}
