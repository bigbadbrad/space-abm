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
import TableFooter from '@mui/material/TableFooter';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { fmtInt } from '@/lib/everself/format';
import { roundRate, safeDivide } from '@/lib/everself/metrics';
import type { CityPeriodAggregate, KpiHeadline } from '@/lib/everself/types';

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

export function exportCityCsv(rows: CityPeriodAggregate[], kpis: KpiHeadline): void {
  const headers = [
    'City',
    'Spend',
    'Leads',
    'Cost / lead',
    'Booked consults',
    'Cost / booked',
    'Completed consults',
    'Cost / completed',
    'Median days lead→book',
    'Lead→Book',
    'Book→Complete',
    'Scale signal',
  ];
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(
      [
        JSON.stringify(r.city),
        r.spend,
        r.leads,
        r.cost_per_lead ?? '',
        r.booked_consults,
        r.cost_per_booked ?? '',
        r.completed_consults,
        r.cost_per_completed ?? '',
        r.median_days_lead_to_book ?? '',
        r.lead_to_book_rate ?? '',
        r.book_to_complete_rate ?? '',
        r.scale_signal,
      ].join(',')
    );
  }
  const ptL2b = roundRate(safeDivide(kpis.booked_consults, kpis.leads));
  const ptB2c = roundRate(safeDivide(kpis.completed_consults, kpis.booked_consults));
  lines.push(
    [
      JSON.stringify('Total (portfolio)'),
      kpis.spend,
      kpis.leads,
      kpis.cost_per_lead ?? '',
      kpis.booked_consults,
      kpis.cost_per_booked ?? '',
      kpis.completed_consults,
      kpis.cost_per_completed ?? '',
      kpis.median_days_lead_to_book ?? '',
      ptL2b ?? '',
      ptB2c ?? '',
      '',
    ].join(',')
  );
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
  kpis,
  onRowClick,
}: {
  rows: CityPeriodAggregate[];
  /** Portfolio totals — same object as the KPI strip so spend, counts, and cost ratios match. */
  kpis: KpiHeadline;
  onRowClick: (city: string) => void;
}): React.JSX.Element {
  /** Show any market with spend or funnel activity. Hiding only spend>0 hid cities that had leads/bookings but $0 spend in-range (or attribution gaps). */
  const visible = rows.filter(
    (r) => r.spend > 0 || r.leads > 0 || r.booked_consults > 0 || r.completed_consults > 0
  );

  const totalL2b = roundRate(safeDivide(kpis.booked_consults, kpis.leads));
  const totalB2c = roundRate(safeDivide(kpis.completed_consults, kpis.booked_consults));

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography sx={{ color: '#F9FAFB', fontWeight: 600, fontSize: '1rem' }}>City allocation (trading desk)</Typography>
        <Button size="small" variant="outlined" onClick={() => exportCityCsv(rows, kpis)} disabled={rows.length === 0} sx={{ textTransform: 'none' }}>
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
                Cost / lead
              </TableCell>
              <TableCell align="right" sx={{ bgcolor: '#111827', color: '#9CA3AF', fontWeight: 600 }}>
                Booked consults
              </TableCell>
              <TableCell align="right" sx={{ bgcolor: '#111827', color: '#9CA3AF', fontWeight: 600 }}>
                Cost / booked
              </TableCell>
              <TableCell align="right" sx={{ bgcolor: '#111827', color: '#9CA3AF', fontWeight: 600 }}>
                Completed consults
              </TableCell>
              <TableCell align="right" sx={{ bgcolor: '#111827', color: '#9CA3AF', fontWeight: 600 }}>
                Cost / completed
              </TableCell>
              <TableCell align="right" sx={{ bgcolor: '#111827', color: '#9CA3AF', fontWeight: 600 }}>
                Median days lead→book
              </TableCell>
              <TableCell align="right" sx={{ bgcolor: '#111827', color: '#9CA3AF', fontWeight: 600 }}>
                L→B
              </TableCell>
              <TableCell align="right" sx={{ bgcolor: '#111827', color: '#9CA3AF', fontWeight: 600 }}>
                B→C
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
                  <TableCell align="right">{fmtInt(r.leads)}</TableCell>
                  <TableCell align="right">{fmtMoney(r.cost_per_lead)}</TableCell>
                  <TableCell align="right">{fmtInt(r.booked_consults)}</TableCell>
                  <TableCell align="right">{fmtMoney(r.cost_per_booked)}</TableCell>
                  <TableCell align="right">{fmtInt(r.completed_consults)}</TableCell>
                  <TableCell align="right">{fmtMoney(r.cost_per_completed)}</TableCell>
                  <TableCell align="right">{r.median_days_lead_to_book != null ? r.median_days_lead_to_book.toFixed(1) : '—'}</TableCell>
                  <TableCell align="right">{fmtRate(r.lead_to_book_rate)}</TableCell>
                  <TableCell align="right">{fmtRate(r.book_to_complete_rate)}</TableCell>
                  <TableCell>
                    <Chip size="small" label={r.scale_signal} color={signalColor(r.scale_signal)} variant="outlined" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter>
            <TableRow
              sx={{
                '& td': {
                  borderColor: '#374151',
                  borderTop: '2px solid #4B5563',
                  bgcolor: '#111827',
                  color: '#F9FAFB',
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                  py: 1.25,
                },
              }}
            >
              <TableCell>Total (portfolio)</TableCell>
              <TableCell align="right">{fmtMoney(kpis.spend)}</TableCell>
              <TableCell align="right">{fmtInt(kpis.leads)}</TableCell>
              <TableCell align="right">{fmtMoney(kpis.cost_per_lead)}</TableCell>
              <TableCell align="right">{fmtInt(kpis.booked_consults)}</TableCell>
              <TableCell align="right">{fmtMoney(kpis.cost_per_booked)}</TableCell>
              <TableCell align="right">{fmtInt(kpis.completed_consults)}</TableCell>
              <TableCell align="right">{fmtMoney(kpis.cost_per_completed)}</TableCell>
              <TableCell align="right">
                {kpis.median_days_lead_to_book != null ? kpis.median_days_lead_to_book.toFixed(1) : '—'}
              </TableCell>
              <TableCell align="right">{fmtRate(totalL2b)}</TableCell>
              <TableCell align="right">{fmtRate(totalB2c)}</TableCell>
              <TableCell>
                <Typography sx={{ color: '#6B7280', fontSize: '0.7rem', fontWeight: 500 }}>—</Typography>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
      <Typography sx={{ color: '#6B7280', fontSize: '0.7rem', mt: 1 }}>
        City rows are market slices (CPL is spend ÷ leads within that city). The total row matches the KPI strip above. Sorted by cost per booked (ascending). Click a city row for detail.
      </Typography>
    </Box>
  );
}
