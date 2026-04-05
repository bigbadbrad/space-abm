'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { ChartPie as ChartPieIcon } from '@phosphor-icons/react/dist/ssr/ChartPie';

import { EverselfAttributionPanel } from '@/components/everself/everself-attribution-panel';
import { EverselfCityAllocationTable } from '@/components/everself/everself-city-allocation-table';
import { EverselfCityDetailDrawer } from '@/components/everself/everself-city-detail-drawer';
import { EverselfFiltersBar } from '@/components/everself/everself-filters-bar';
import { EverselfFunnelExplorer } from '@/components/everself/everself-funnel-explorer';
import { EverselfKpiTiles } from '@/components/everself/everself-kpi-tiles';
import { EverselfTrendsPanel } from '@/components/everself/everself-trends-panel';
import { useEverselfMarketingRoi } from '@/components/everself/use-everself-marketing-roi';

/** Client-only: react-markdown / mdast break Next SSR chunk resolution if bundled for server. */
const EverselfHowItWorksModal = dynamic(
  () => import('@/components/everself/everself-how-it-works-modal').then((m) => m.EverselfHowItWorksModal),
  { ssr: false }
);
export function EverselfGrowthDashboard(): React.JSX.Element {
  const { filters, setFilters, data, loading, error, loadedAt, onApply, availableCities } =
    useEverselfMarketingRoi();
  const [cityDrawer, setCityDrawer] = React.useState<string | null>(null);
  const [howItWorksOpen, setHowItWorksOpen] = React.useState(false);

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
          <EverselfCityAllocationTable rows={data.by_city} kpis={data.kpis} onRowClick={(c) => setCityDrawer(c)} />
          <EverselfTrendsPanel trend={data.trend} diagnostics={data.diagnostics} />
          <EverselfAttributionPanel d={data.diagnostics} />
          <EverselfFunnelExplorer kpis={data.kpis} byCity={data.by_city} byChannel={data.by_channel} />
        </Box>
      ) : null}

      <EverselfCityDetailDrawer open={Boolean(cityDrawer)} city={cityDrawer} daily={data?.daily ?? []} onClose={() => setCityDrawer(null)} />
    </Box>
  );
}
