'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import dayjs from 'dayjs';

import {
  defaultEverselfFilters,
  type EverselfChannelFilter,
  type EverselfFiltersState,
} from '@/components/everself/everself-filters-bar';
import { fetchMarketingRoi } from '@/lib/everself/api';
import type { MarketingRoiResponse } from '@/lib/everself/types';

export function filtersFromSearch(sp: URLSearchParams): EverselfFiltersState {
  const base = defaultEverselfFilters();
  const s = sp.get('start');
  const e = sp.get('end');
  const citiesRaw = sp.get('cities')?.split(',').map((x) => x.trim()).filter(Boolean) ?? [];
  const city = citiesRaw.length === 0 ? null : citiesRaw[0]!;
  const chRaw = sp.get('channels')?.split(',').map((x) => x.trim()).filter(Boolean) ?? [];
  const firstCh = chRaw[0];
  const channel: EverselfChannelFilter =
    firstCh === 'google' || firstCh === 'meta' ? firstCh : 'all';
  const campaign = sp.get('campaign') ?? '';
  const bg = sp.get('bookingGroup') === 'lead' ? 'lead' : 'booked';
  return {
    start: s ? dayjs(s) : base.start,
    end: e ? dayjs(e) : base.end,
    city,
    channel,
    campaign,
    bookingGroup: bg,
  };
}

export function pushEverselfFilters(
  router: ReturnType<typeof useRouter>,
  pathname: string,
  f: EverselfFiltersState
): void {
  const sp = new URLSearchParams();
  sp.set('start', f.start.format('YYYY-MM-DD'));
  sp.set('end', f.end.format('YYYY-MM-DD'));
  if (f.city) sp.set('cities', f.city);
  if (f.channel !== 'all') sp.set('channels', f.channel);
  if (f.campaign.trim()) sp.set('campaign', f.campaign.trim());
  if (f.bookingGroup !== 'booked') sp.set('bookingGroup', f.bookingGroup);
  router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
}

export function useEverselfMarketingRoi(): {
  filters: EverselfFiltersState;
  setFilters: React.Dispatch<React.SetStateAction<EverselfFiltersState>>;
  data: MarketingRoiResponse | null;
  loading: boolean;
  error: string | null;
  loadedAt: string | null;
  onApply: () => void;
  availableCities: string[];
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = React.useState<EverselfFiltersState>(defaultEverselfFilters);
  const [loadedAt, setLoadedAt] = React.useState<string | null>(null);
  const [data, setData] = React.useState<MarketingRoiResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setFilters(filtersFromSearch(searchParams));
  }, [searchParams]);

  React.useEffect(() => {
    const f = filtersFromSearch(searchParams);
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetchMarketingRoi({
          start: f.start.format('YYYY-MM-DD'),
          end: f.end.format('YYYY-MM-DD'),
          cities: f.city ? [f.city] : [],
          channels: f.channel === 'all' ? [] : [f.channel],
          bookingGroup: f.bookingGroup,
          campaign: f.campaign,
        });
        if (!cancelled) {
          setData(res);
          setLoadedAt(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load');
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const onApply = React.useCallback(() => {
    pushEverselfFilters(router, pathname, filters);
  }, [router, pathname, filters]);

  return {
    filters,
    setFilters,
    data,
    loading,
    error,
    loadedAt,
    onApply,
    availableCities: data?.available_cities ?? [],
  };
}
