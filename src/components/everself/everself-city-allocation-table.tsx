'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import type { CityPeriodAggregate } from '@/lib/everself/types';

function fmtMoney(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function fmtRate(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `${(n * 100).toFixed(1)}%`;
}

function signalColor(s: CityPeriodAggregate['scale_signal']): 'success' | 'warning' | 'error' {
  if (s === 'green') return 'success';
  if (s === 'red') return 'error';
  return 'warning';
}

export function exportCityCsv(rows: CityPeriodAggregate[]): void {
  const headers = [
    'City',
    'Spend',
    'Leads',
    'Booked',
    'Completed',
    'CPL',
    'CP Booked',
    'CP Completed',
    'Lead→Book',
    'Book→Complete',
    'Median lag (d)',
    'Scale signal',
  ];
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(
      [
        JSON.stringify(r.city),
        r.spend,
        r.leads,
        r.booked_consults,
        r.completed_consults,
        r.cost_per_lead ?? '',
        r.cost_per_booked ?? '',
        r.cost_per_completed ?? '',
        r.lead_to_book_rate ?? '',
        r.book_to_complete_rate ?? '',
        r.median_days_lead_to_book ?? '',
        r.scale_signal,
      ].join(',')
    );
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `everself-city-allocation-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function EverselfCityAllocationTable({
  rows,
  onRowClick,
}: {
  rows: CityPeriodAggregate[];
  onRowClick: (city: string) => void;
}): React.JSX.Element {
  /** Show any market with spend or funnel activity. Hiding only spend>0 hid cities that had leads/bookings but $0 spend in-range (or attribution gaps). */
  const visible = rows.filter(
    (r) => r.spend > 0 || r.leads > 0 || r.booked_consults > 0 || r.completed_consults > 0
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography sx={{ color: '#F9FAFB', fontWeight: 600, fontSize: '1rem' }}>City allocation (trading desk)</Typography>
        <Button size="small" variant="outlined" onClick={() => exportCityCsv(rows)} disabled={rows.length === 0} sx={{ textTransform: 'none' }}>
          Export CSV
        </Button>
      </Box>
      <TableContainer component={Paper} sx={{ bgcolor: '#0A0A0A', border: '1px solid #27272F', maxHeight: 420 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ bgcolor: '#111827', color: '#9CA3AF', fontWeight: 600 }}>City</TableCell>
              <TableCell align="right" sx={{ bgcolor: '#111827', color: '#9CA3AF', fontWeight: 600 }}>
                Spend
              </TableCell>
              <TableCell align="right" sx={{ bgcolor: '#111827', color: '#9CA3AF', fontWeight: 600 }}>
                Leads
              </TableCell>
              <TableCell align="right" sx={{ bgcolor: '#111827', color: '#9CA3AF', fontWeight: 600 }}>
                Booked
              </TableCell>
              <TableCell align="right" sx={{ bgcolor: '#111827', color: '#9CA3AF', fontWeight: 600 }}>
                Completed
              </TableCell>
              <TableCell align="right" sx={{ bgcolor: '#111827', color: '#9CA3AF', fontWeight: 600 }}>
                CPL
              </TableCell>
              <TableCell align="right" sx={{ bgcolor: '#111827', color: '#9CA3AF', fontWeight: 600 }}>
                CP Booked
              </TableCell>
              <TableCell align="right" sx={{ bgcolor: '#111827', color: '#9CA3AF', fontWeight: 600 }}>
                CP Done
              </TableCell>
              <TableCell align="right" sx={{ bgcolor: '#111827', color: '#9CA3AF', fontWeight: 600 }}>
                L→B
              </TableCell>
              <TableCell align="right" sx={{ bgcolor: '#111827', color: '#9CA3AF', fontWeight: 600 }}>
                B→C
              </TableCell>
              <TableCell align="right" sx={{ bgcolor: '#111827', color: '#9CA3AF', fontWeight: 600 }}>
                Med lag
              </TableCell>
              <TableCell sx={{ bgcolor: '#111827', color: '#9CA3AF', fontWeight: 600 }}>Signal</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} sx={{ color: '#9CA3AF', borderColor: '#27272F' }}>
                  No city rows for this selection.
                </TableCell>
              </TableRow>
            ) : (
              visible.map((r) => (
                <TableRow
                  key={r.city}
                  hover
                  onClick={() => onRowClick(r.city)}
                  sx={{ cursor: 'pointer', '&:nth-of-type(even)': { bgcolor: '#050505' }, '& td': { borderColor: '#27272F', color: '#E5E7EB' } }}
                >
                  <TableCell>{r.city}</TableCell>
                  <TableCell align="right">{fmtMoney(r.spend)}</TableCell>
                  <TableCell align="right">{r.leads}</TableCell>
                  <TableCell align="right">{r.booked_consults}</TableCell>
                  <TableCell align="right">{r.completed_consults}</TableCell>
                  <TableCell align="right">{fmtMoney(r.cost_per_lead)}</TableCell>
                  <TableCell align="right">{fmtMoney(r.cost_per_booked)}</TableCell>
                  <TableCell align="right">{fmtMoney(r.cost_per_completed)}</TableCell>
                  <TableCell align="right">{fmtRate(r.lead_to_book_rate)}</TableCell>
                  <TableCell align="right">{fmtRate(r.book_to_complete_rate)}</TableCell>
                  <TableCell align="right">{r.median_days_lead_to_book != null ? r.median_days_lead_to_book.toFixed(1) : '—'}</TableCell>
                  <TableCell>
                    <Chip size="small" label={r.scale_signal} color={signalColor(r.scale_signal)} variant="outlined" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography sx={{ color: '#6B7280', fontSize: '0.7rem', mt: 1 }}>
        Sorted by cost per booked (ascending). Click a row for city detail.
      </Typography>
    </Box>
  );
}
