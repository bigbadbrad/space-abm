'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { X as XIcon } from '@phosphor-icons/react/dist/ssr/X';
import type { ABMScoringDetails } from '@/lib/abm/client';
import dayjs from 'dayjs';

export interface ScoringDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  data: ABMScoringDetails | null;
}

export function ScoringDetailsDrawer({ open, onClose, loading, data }: ScoringDetailsDrawerProps): React.JSX.Element {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { backgroundColor: '#0A0A0A', borderLeft: '1px solid #262626' },
      }}
    >
      <Box sx={{ width: 420, p: 3, color: '#F5F5F7' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 600 }}>How this was scored</Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: '#9CA3AF', '&:hover': { color: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.08)' } }} aria-label="Close">
            <XIcon size={20} weight="bold" />
          </IconButton>
        </Stack>
        {loading && <CircularProgress size={24} sx={{ color: '#9CA3AF' }} />}
        {!loading && data && (
          <>
            <Typography variant="body2" sx={{ color: '#D1D5DB', mb: 2 }}>
              Scored by: {data.config_name ?? '—'} • {data.config_updated_at ? dayjs(data.config_updated_at).format('MMM D, YYYY') : '—'}
            </Typography>
            <Typography variant="subtitle2" sx={{ mb: 1, color: '#E5E7EB', fontWeight: 600 }}>Top contributors</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#D1D5DB', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Event</TableCell>
                  <TableCell sx={{ color: '#D1D5DB', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Count</TableCell>
                  <TableCell sx={{ color: '#D1D5DB', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Weight</TableCell>
                  <TableCell sx={{ color: '#D1D5DB', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Contribution</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.top_contributors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ color: '#9CA3AF', borderColor: '#262626', textAlign: 'center', py: 2 }}>No contributors</TableCell>
                  </TableRow>
                ) : (
                  data.top_contributors.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell sx={{ color: '#FFFFFF', borderColor: '#262626', fontSize: '0.8rem' }}>{c.event_key}</TableCell>
                      <TableCell sx={{ color: '#E5E7EB', borderColor: '#262626', fontSize: '0.8rem' }}>{c.count}</TableCell>
                      <TableCell sx={{ color: '#E5E7EB', borderColor: '#262626', fontSize: '0.8rem' }}>{c.weight}</TableCell>
                      <TableCell sx={{ color: '#FFFFFF', borderColor: '#262626', fontSize: '0.8rem', fontFamily: 'monospace' }}>{c.contribution}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </>
        )}
      </Box>
    </Drawer>
  );
}
