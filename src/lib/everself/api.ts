import type { MarketingRoiResponse } from './types';

export type MarketingRoiQuery = {
  start: string;
  end: string;
  cities: string[];
  channels: string[];
  bookingGroup: 'booked' | 'lead';
  campaign: string;
};

export function buildMarketingRoiUrl(params: MarketingRoiQuery): string {
  const sp = new URLSearchParams();
  sp.set('start', params.start);
  sp.set('end', params.end);
  if (params.cities.length) sp.set('cities', params.cities.join(','));
  if (params.channels.length) sp.set('channels', params.channels.join(','));
  sp.set('bookingGroup', params.bookingGroup);
  if (params.campaign.trim()) sp.set('campaign', params.campaign.trim());
  return `/api/demo/everself/marketing-roi?${sp.toString()}`;
}

export async function fetchMarketingRoi(params: MarketingRoiQuery): Promise<MarketingRoiResponse> {
  const res = await fetch(buildMarketingRoiUrl(params));
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err?.message === 'string' ? err.message : 'Failed to load report');
  }
  return res.json() as Promise<MarketingRoiResponse>;
}
