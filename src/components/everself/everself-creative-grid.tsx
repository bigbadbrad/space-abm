'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import type { CreativePerformanceRow } from '@/lib/everself/types';

export function EverselfCreativeGrid({ rows }: { rows: CreativePerformanceRow[] }): React.JSX.Element {
  if (rows.length === 0) {
    return (
      <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>No creative / utm_content rows for this selection.</Typography>
    );
  }

  return (
    <Box>
      <Typography sx={{ color: '#F9FAFB', fontWeight: 600, fontSize: '1rem', mb: 1.5 }}>Creative performance (utm_content)</Typography>
      <TableContainer component={Paper} sx={{ bgcolor: '#0A0A0A', border: '1px solid #27272F' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#9CA3AF', fontWeight: 600, borderColor: '#27272F' }}>utm_content</TableCell>
              <TableCell sx={{ color: '#9CA3AF', fontWeight: 600, borderColor: '#27272F' }}>Hook</TableCell>
              <TableCell sx={{ color: '#9CA3AF', fontWeight: 600, borderColor: '#27272F' }}>Format</TableCell>
              <TableCell align="right" sx={{ color: '#9CA3AF', fontWeight: 600, borderColor: '#27272F' }}>
                Leads
              </TableCell>
              <TableCell align="right" sx={{ color: '#9CA3AF', fontWeight: 600, borderColor: '#27272F' }}>
                Booked
              </TableCell>
              <TableCell align="right" sx={{ color: '#9CA3AF', fontWeight: 600, borderColor: '#27272F' }}>
                CPL
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.slice(0, 12).map((r) => (
              <TableRow key={r.utm_content} sx={{ '& td': { borderColor: '#27272F', color: '#E5E7EB' } }}>
                <TableCell>{r.utm_content}</TableCell>
                <TableCell>{r.hook_tag ?? '—'}</TableCell>
                <TableCell>{r.format ?? '—'}</TableCell>
                <TableCell align="right">{r.leads}</TableCell>
                <TableCell align="right">{r.booked_consults}</TableCell>
                <TableCell align="right">{r.cost_per_lead != null ? `$${r.cost_per_lead.toFixed(0)}` : '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
