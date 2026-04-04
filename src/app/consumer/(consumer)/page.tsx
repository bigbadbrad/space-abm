'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { Gauge as GaugeIcon } from '@phosphor-icons/react/dist/ssr/Gauge';

import { useConsumerProperty } from '@/contexts/consumer-property-context';
import { EverselfGrowthDashboard } from '@/components/everself/everself-growth-dashboard';

function isEverselfPropertyName(name: string | null | undefined): boolean {
  return (name ?? '').trim().toLowerCase() === 'everself';
}

function DashboardPlaceholder(): React.JSX.Element {
  return (
    <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <GaugeIcon size={18} style={{ color: '#FFFFFF' }} />
          <Typography sx={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600 }}>Dashboard</Typography>
        </Box>
        <Typography sx={{ color: '#9CA3AF', fontSize: '0.8125rem', mt: 0.5 }}>Consumer surface — placeholder</Typography>
      </Box>
      <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>
        This is the Dashboard. Content coming soon.
      </Typography>
    </Box>
  );
}

export default function ConsumerDashboardPage(): React.JSX.Element {
  const { activeProperty, loading } = useConsumerProperty();

  if (loading) {
    return (
      <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#9CA3AF' }} />
      </Box>
    );
  }

  if (isEverselfPropertyName(activeProperty?.name)) {
    return (
      <React.Suspense
        fallback={
          <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress sx={{ color: '#9CA3AF' }} />
          </Box>
        }
      >
        <EverselfGrowthDashboard />
      </React.Suspense>
    );
  }

  return <DashboardPlaceholder />;
}
