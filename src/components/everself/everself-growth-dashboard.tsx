'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { ChartPie as ChartPieIcon } from '@phosphor-icons/react/dist/ssr/ChartPie';
import dayjs from 'dayjs';

import { EverselfAttributionPanel } from '@/components/everself/everself-attribution-panel';
import { EverselfCityAllocationTable } from '@/components/everself/everself-city-allocation-table';
import { EverselfCityDetailDrawer } from '@/components/everself/everself-city-detail-drawer';
import { EverselfCreativeGrid } from '@/components/everself/everself-creative-grid';
import { defaultEverselfFilters, EverselfFiltersBar, type EverselfFiltersState } from '@/components/everself/everself-filters-bar';
import { EverselfFunnelExplorer } from '@/components/everself/everself-funnel-explorer';
import { EverselfKpiTiles } from '@/components/everself/everself-kpi-tiles';
import { EverselfTrendsPanel } from '@/components/everself/everself-trends-panel';

/** Client-only: react-markdown / mdast break Next SSR chunk resolution if bundled for server. */
const EverselfHowItWorksModal = dynamic(
  () => import('@/components/everself/everself-how-it-works-modal').then((m) => m.EverselfHowItWorksModal),
  { ssr: false }
);
import { fetchMarketingRoi } from '@/lib/everself/api';
import type { MarketingRoiResponse } from '@/lib/everself/types';

function filtersFromSearch(sp: URLSearchParams): EverselfFiltersState {
  const base = defaultEverselfFilters();
  const s = sp.get('start');
  const e = sp.get('end');
  const citiesRaw = sp.get('cities')?.split(',').map((x) => x.trim()).filter(Boolean) ?? [];
  /** Single city only; legacy URLs with multiple cities use the first. */
  const city = citiesRaw.length === 0 ? null : citiesRaw[0]!;
  const channels = sp.get('channels')?.split(',').filter(Boolean) ?? [];
  const campaign = sp.get('campaign') ?? '';
  const bg = sp.get('bookingGroup') === 'lead' ? 'lead' : 'booked';
  return {
    start: s ? dayjs(s) : base.start,
    end: e ? dayjs(e) : base.end,
    city,
    channels,
    campaign,
    bookingGroup: bg,
  };
}

function pushFilters(router: ReturnType<typeof useRouter>, pathname: string, f: EverselfFiltersState): void {
  const sp = new URLSearchParams();
  sp.set('start', f.start.format('YYYY-MM-DD'));
  sp.set('end', f.end.format('YYYY-MM-DD'));
  if (f.city) sp.set('cities', f.city);
  if (f.channels.length) sp.set('channels', f.channels.join(','));
  if (f.campaign.trim()) sp.set('campaign', f.campaign.trim());
  if (f.bookingGroup !== 'booked') sp.set('bookingGroup', f.bookingGroup);
  router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
}

export function EverselfGrowthDashboard(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = React.useState<EverselfFiltersState>(defaultEverselfFilters);
  const [loadedAt, setLoadedAt] = React.useState<string | null>(null);
  const [data, setData] = React.useState<MarketingRoiResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [cityDrawer, setCityDrawer] = React.useState<string | null>(null);
  const [howItWorksOpen, setHowItWorksOpen] = React.useState(false);

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
          channels: f.channels,
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

  const onApply = () => {
    pushFilters(router, pathname, filters);
  };

  const availableCities = data?.available_cities ?? [];

  return (
    <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <ChartPieIcon size={20} style={{ color: '#FFFFFF' }} />
            <Typography sx={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600 }}>Everself Growth Command Center</Typography>
          </Box>
          <Typography sx={{ color: '#9CA3AF', fontSize: '0.8125rem', mt: 0.5 }}>Demo dataset · JSON-backed · server rollups</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            type="button"
            variant="text"
            size="small"
            onClick={() => setHowItWorksOpen(true)}
            sx={{ color: '#93C5FD', textTransform: 'none', fontWeight: 500, minWidth: 'auto', px: 0.5 }}
          >
            How to read this report
          </Button>
          <Chip
            label={loadedAt ? `Loaded ${loadedAt}` : 'Loading…'}
            size="small"
            sx={{ bgcolor: '#111827', color: '#D1D5DB', border: '1px solid #374151' }}
          />
        </Box>
      </Box>

      <EverselfHowItWorksModal open={howItWorksOpen} onClose={() => setHowItWorksOpen(false)} />

      <EverselfFiltersBar value={filters} onChange={setFilters} availableCities={availableCities} onApply={onApply} />

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: '#9CA3AF' }} />
        </Box>
      )}

      {error && !loading ? (
        <Typography sx={{ color: '#F87171', mt: 2 }}>{error}</Typography>
      ) : null}

      {data && !loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 3 }}>
          <EverselfKpiTiles kpis={data.kpis} />
          <EverselfCityAllocationTable rows={data.by_city} onRowClick={(c) => setCityDrawer(c)} />
          <EverselfTrendsPanel trend={data.trend} diagnostics={data.diagnostics} />
          <EverselfAttributionPanel d={data.diagnostics} />
          <EverselfFunnelExplorer kpis={data.kpis} byCity={data.by_city} byChannel={data.by_channel} />
          <EverselfCreativeGrid rows={data.creative} />
        </Box>
      ) : null}

      <EverselfCityDetailDrawer open={Boolean(cityDrawer)} city={cityDrawer} daily={data?.daily ?? []} onClose={() => setCityDrawer(null)} />
    </Box>
  );
}
