'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { FileText as FileTextIcon } from '@phosphor-icons/react/dist/ssr/FileText';

import { EverselfCreativeGrid } from '@/components/everself/everself-creative-grid';
import { EverselfFiltersBar } from '@/components/everself/everself-filters-bar';
import { useEverselfMarketingRoi } from '@/components/everself/use-everself-marketing-roi';

export function EverselfCreativeTab(): React.JSX.Element {
  const { filters, setFilters, data, loading, error, loadedAt, onApply, availableCities } =
    useEverselfMarketingRoi();

  return (
    <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <FileTextIcon size={20} style={{ color: '#FFFFFF' }} />
            <Typography sx={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600 }}>Creative</Typography>
          </Box>
          <Typography sx={{ color: '#9CA3AF', fontSize: '0.8125rem', mt: 0.5 }}>
            Performance by utm_content · same filters as the command center
          </Typography>
        </Box>
        <Chip
          label={loadedAt ? `Loaded ${loadedAt}` : 'Loading…'}
          size="small"
          sx={{ bgcolor: '#111827', color: '#D1D5DB', border: '1px solid #374151' }}
        />
      </Box>

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
        <Box sx={{ mt: 3 }}>
          <EverselfCreativeGrid rows={data.creative} />
        </Box>
      ) : null}
    </Box>
  );
}
