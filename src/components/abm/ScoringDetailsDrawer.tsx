'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
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
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 420, p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>How this was scored</Typography>
        {loading && <CircularProgress size={24} sx={{ color: '#9CA3AF' }} />}
        {!loading && data && (
          <>
            <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 2 }}>
              Scored by: {data.config_name ?? '—'} • {data.config_updated_at ? dayjs(data.config_updated_at).format('MMM D, YYYY') : '—'}
            </Typography>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Top contributors</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem' }}>Event</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem' }}>Count</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem' }}>Weight</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem' }}>Contribution</TableCell>
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
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem' }}>{c.count}</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem' }}>{c.weight}</TableCell>
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
