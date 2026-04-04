// Consumer API client - fetches from space-api /api/consumer with auth
import { authClient } from '@/lib/auth/client';

const getBaseUrl = () => process.env.NEXT_PUBLIC_SPACE_API_BASE_URL || '';
const getToken = () => authClient.getToken();

async function consumerFetch<T>(
  path: string,
  options?: RequestInit
): Promise<{ data?: T; error?: string; status?: number }> {
  const base = getBaseUrl();
  if (!base) return { error: 'API URL not configured' };

  const token = getToken();
  if (!token) return { error: 'Not authenticated', status: 401 };

  const url = `${base}/api/consumer${path}`;
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

// --- X OAuth helpers ---

export async function startXAuth(propertyId: string): Promise<{ url?: string; error?: string; status?: number }> {
  const base = getBaseUrl();
  if (!base) return { error: 'API URL not configured' };

  const token = getToken();
  if (!token) return { error: 'Not authenticated', status: 401 };

  const url = `${base}/api/auth/x/start?property_id=${encodeURIComponent(propertyId)}`;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.message || res.statusText || `Request failed (${res.status})`, status: res.status };
    }
    const data = await res.json();
    return { url: data.url as string };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error';
    return { error: msg };
  }
}

// --- Properties ---
export interface ConsumerProperty {
  id: string;
  name: string;
  domain: string;
  product_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConsumerPropertiesResponse {
  properties: ConsumerProperty[];
}

export async function getConsumerProperties(): Promise<{
  data?: ConsumerProperty[];
  error?: string;
  status?: number;
}> {
  const out = await consumerFetch<ConsumerPropertiesResponse>('/properties');
  if (out.error) return { error: out.error, status: out.status };
  return { data: out.data?.properties ?? [] };
}

export async function createConsumerProperty(body: {
  name: string;
  domain: string;
  product_type: string;
}): Promise<{ data?: ConsumerProperty; error?: string; status?: number }> {
  const out = await consumerFetch<{ property: ConsumerProperty }>('/properties', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (out.error) return { error: out.error, status: out.status };
  return { data: out.data?.property };
}

// --- Publisher posts ---
export interface PublisherPost {
  id: string;
  property_id: string;
  platform: string;
  text: string;
  media_urls: string[] | null;
  status: string;
  scheduled_for: string | null;
  published_at: string | null;
  platform_post_id: string | null;
  error_message: string | null;
  source: string;
  source_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublisherPostsResponse {
  posts: PublisherPost[];
}

export async function getPublisherPosts(params: {
  property_id: string;
  status?: string;
  platform?: string;
  from?: string;
  to?: string;
}): Promise<{ data?: PublisherPost[]; error?: string; status?: number }> {
  const q = new URLSearchParams();
  q.set('property_id', params.property_id);
  if (params.status) q.set('status', params.status);
  if (params.platform) q.set('platform', params.platform);
  if (params.from) q.set('from', params.from);
  if (params.to) q.set('to', params.to);
  const out = await consumerFetch<PublisherPostsResponse>(`/publisher/posts?${q}`);
  if (out.error) return { error: out.error, status: out.status };
  return { data: out.data?.posts ?? [] };
}

export async function createPublisherPost(body: {
  property_id: string;
  platform: string;
  text: string;
  media_urls?: string[];
}): Promise<{ data?: PublisherPost; error?: string; status?: number }> {
  const out = await consumerFetch<{ post: PublisherPost }>('/publisher/posts', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (out.error) return { error: out.error, status: out.status };
  return { data: out.data?.post };
}

export async function updatePublisherPost(
  id: string,
  body: { text?: string; media_urls?: string[]; scheduled_for?: string }
): Promise<{ data?: PublisherPost; error?: string; status?: number }> {
  const out = await consumerFetch<{ post: PublisherPost }>(`/publisher/posts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (out.error) return { error: out.error, status: out.status };
  return { data: out.data?.post };
}

export async function schedulePublisherPost(
  id: string,
  body: { scheduled_for: string }
): Promise<{ data?: PublisherPost; error?: string; status?: number }> {
  const out = await consumerFetch<{ post: PublisherPost }>(`/publisher/posts/${id}/schedule`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (out.error) return { error: out.error, status: out.status };
  return { data: out.data?.post };
}

export async function publishNowPublisherPost(
  id: string
): Promise<{ data?: PublisherPost; error?: string; status?: number }> {
  const out = await consumerFetch<{ post: PublisherPost }>(`/publisher/posts/${id}/publish-now`, {
    method: 'POST',
  });
  if (out.error) return { error: out.error, status: out.status };
  return { data: out.data?.post };
}

export async function cancelPublisherPost(
  id: string
): Promise<{ data?: PublisherPost; error?: string; status?: number }> {
  const out = await consumerFetch<{ post: PublisherPost }>(`/publisher/posts/${id}/cancel`, {
    method: 'POST',
  });
  if (out.error) return { error: out.error, status: out.status };
  return { data: out.data?.post };
}

export async function deletePublisherPost(
  id: string
): Promise<{ error?: string; status?: number }> {
  const out = await consumerFetch<{}>(`/publisher/posts/${id}`, {
    method: 'DELETE',
  });
  if (out.error) return { error: out.error, status: out.status };
  return {};
}

export interface ImportJsonItem {
  key: string;
  platform: string;
  scheduled_for: string;
  text: string;
  media_urls?: string[];
}

export interface ImportJsonResponse {
  created: number;
  updated: number;
  skipped_published: number;
  skipped_publishing: number;
  errors: Array<{ key: string; message: string }>;
}

export async function importPublisherJson(body: {
  property_id: string;
  items: ImportJsonItem[];
}): Promise<{ data?: ImportJsonResponse; error?: string; status?: number }> {
  const out = await consumerFetch<ImportJsonResponse>('/publisher/import-json', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (out.error) return { error: out.error, status: out.status };
  return { data: out.data ?? undefined };
}

// --- Social accounts ---
export interface PublisherSocialAccount {
  id: string;
  property_id: string;
  platform: string;
  display_name: string | null;
  credentials_json: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublisherAccountsResponse {
  accounts: PublisherSocialAccount[];
}

export async function getPublisherAccounts(property_id: string): Promise<{
  data?: PublisherSocialAccount[];
  error?: string;
  status?: number;
}> {
  const out = await consumerFetch<PublisherAccountsResponse>(
    `/publisher/accounts?property_id=${encodeURIComponent(property_id)}`
  );
  if (out.error) return { error: out.error, status: out.status };
  return { data: out.data?.accounts ?? [] };
}

export async function putPublisherAccount(
  platform: string,
  body: {
    property_id: string;
    display_name?: string;
    credentials_json: Record<string, unknown>;
    is_active?: boolean;
  }
): Promise<{ data?: { account: PublisherSocialAccount }; error?: string; status?: number }> {
  const out = await consumerFetch<{ account: PublisherSocialAccount }>(
    `/publisher/accounts/${encodeURIComponent(platform)}`,
    {
      method: 'PUT',
      body: JSON.stringify(body),
    }
  );
  if (out.error) return { error: out.error, status: out.status };
  return { data: out.data ?? undefined };
}
