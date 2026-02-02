'use client';

import * as React from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

export interface ABMFilters {
  range: string;
  stage: string;
  surge: string;
  lane: string;
  search: string;
}

const DEFAULT_FILTERS: ABMFilters = {
  range: '7d',
  stage: 'All',
  surge: 'All',
  lane: 'All',
  search: '',
};

function filtersFromSearchParams(params: URLSearchParams): ABMFilters {
  return {
    range: params.get('range') || DEFAULT_FILTERS.range,
    stage: params.get('stage') || DEFAULT_FILTERS.stage,
    surge: params.get('surge') || DEFAULT_FILTERS.surge,
    lane: params.get('lane') || DEFAULT_FILTERS.lane,
    search: params.get('search') || DEFAULT_FILTERS.search,
  };
}

function filtersToParams(filters: ABMFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.range && filters.range !== DEFAULT_FILTERS.range) params.set('range', filters.range);
  if (filters.stage && filters.stage !== DEFAULT_FILTERS.stage) params.set('stage', filters.stage);
  if (filters.surge && filters.surge !== DEFAULT_FILTERS.surge) params.set('surge', filters.surge);
  if (filters.lane && filters.lane !== DEFAULT_FILTERS.lane) params.set('lane', filters.lane);
  if (filters.search) params.set('search', filters.search);
  return params;
}

export interface ABMFilterContextValue {
  filters: ABMFilters;
  applyFilters: (filters: Partial<ABMFilters>) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

const ABMFilterContext = React.createContext<ABMFilterContextValue | undefined>(undefined);

export function ABMFilterProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const filters = React.useMemo(
    () => filtersFromSearchParams(searchParams),
    [searchParams]
  );

  const hasActiveFilters = React.useMemo(
    () =>
      filters.range !== DEFAULT_FILTERS.range ||
      filters.stage !== DEFAULT_FILTERS.stage ||
      filters.surge !== DEFAULT_FILTERS.surge ||
      filters.lane !== DEFAULT_FILTERS.lane ||
      !!filters.search,
    [filters]
  );

  const applyFilters = React.useCallback(
    (updates: Partial<ABMFilters>) => {
      const next = { ...filters, ...updates };
      const params = filtersToParams(next);
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [filters, pathname, router]
  );

  const resetFilters = React.useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const value: ABMFilterContextValue = React.useMemo(
    () => ({ filters, applyFilters, resetFilters, hasActiveFilters }),
    [filters, applyFilters, resetFilters, hasActiveFilters]
  );

  return <ABMFilterContext.Provider value={value}>{children}</ABMFilterContext.Provider>;
}

export function useABMFilters(): ABMFilterContextValue {
  const ctx = React.useContext(ABMFilterContext);
  if (!ctx) throw new Error('useABMFilters must be used within ABMFilterProvider');
  return ctx;
}
