'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Drawer from '@mui/material/Drawer';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { Calendar as CalendarIcon } from '@phosphor-icons/react/dist/ssr/Calendar';
import { Warning as WarningIcon } from '@phosphor-icons/react/dist/ssr/Warning';

import { EverselfFiltersBar, defaultEverselfFilters, type EverselfFiltersState } from '@/components/everself/everself-filters-bar';
import { useEverselfDemoSyncState } from '@/components/everself/use-everself-demo-sync-state';
import { computeDemoAttributionExtras } from '@/lib/everself/everself-demo-attribution';
import {
  type ApptStatusFilter,
  appointmentInFilters,
} from '@/lib/everself/everself-demo-filtering';
import { mergeEverselfDemoAppointments, runEverselfDemoSync } from '@/lib/everself/everself-demo-sync';
import { fmtInt } from '@/lib/everself/format';
import { daysBetweenUtc, median } from '@/lib/everself/metrics';
import type { AppointmentRow, LeadRow } from '@/lib/everself/types';

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function EverselfAppointmentsPage(): React.JSX.Element {
  const [filters, setFilters] = React.useState<EverselfFiltersState>(defaultEverselfFilters);
  const [status, setStatus] = React.useState<ApptStatusFilter>('all');
  const [rawLeads, setRawLeads] = React.useState<LeadRow[] | null>(null);
  const [rawAppts, setRawAppts] = React.useState<AppointmentRow[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [syncing, setSyncing] = React.useState(false);
  const [snack, setSnack] = React.useState<string | null>(null);
  const [drawer, setDrawer] = React.useState<AppointmentRow | null>(null);
  const [syncState, refreshSync] = useEverselfDemoSyncState();

  React.useEffect(() => {
    let c = false;
    (async () => {
      try {
        const [lr, ar] = await Promise.all([
          fetch('/demo/everself/leads.json').then((r) => r.json()),
          fetch('/demo/everself/appointments.json').then((r) => r.json()),
        ]);
        if (!c) {
          setRawLeads(lr as LeadRow[]);
          setRawAppts(ar as AppointmentRow[]);
        }
      } catch (e) {
        if (!c) setError(e instanceof Error ? e.message : 'Failed to load');
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const leadById = React.useMemo(() => new Map((rawLeads ?? []).map((l) => [l.lead_id, l])), [rawLeads]);

  const mergedAppts = React.useMemo(
    () => mergeEverselfDemoAppointments(rawAppts ?? [], syncState),
    [rawAppts, syncState]
  );

  const availableCities = React.useMemo(() => {
    const s = new Set((rawLeads ?? []).map((l) => l.city).filter(Boolean));
    return Array.from(s).sort();
  }, [rawLeads]);

  const filtered = React.useMemo(() => {
    if (!mergedAppts.length) return [];
    return mergedAppts.filter((a) => appointmentInFilters(a, rawLeads ?? [], filters, status, leadById));
  }, [mergedAppts, rawLeads, filters, status, leadById]);

  const kpis = React.useMemo(() => {
    const extras = computeDemoAttributionExtras(rawLeads ?? [], filtered);
    let booked = 0;
    let completed = 0;
    let canceled = 0;
    let noShow = 0;
    const lagDays: number[] = [];
    for (const a of filtered) {
      if (a.status === 'booked') booked += 1;
      if (a.status === 'completed') completed += 1;
      if (a.status === 'canceled') canceled += 1;
      if (a.status === 'no_show') noShow += 1;
      const lid = (a.lead_id ?? '').trim();
      const lead = lid ? leadById.get(lid) : undefined;
      if (lead) lagDays.push(daysBetweenUtc(lead.created_at, a.booked_at));
    }
    lagDays.sort((x, y) => x - y);
    return {
      booked,
      completed,
      canceled,
      noShow,
      medianLag: median(lagDays),
      matchRate: extras.match_rate,
    };
  }, [filtered, rawLeads, leadById]);

  const onSync = async () => {
    setSyncing(true);
    await new Promise((r) => setTimeout(r, 1300));
    const res = runEverselfDemoSync();
    setSnack(res.toast);
    refreshSync();
    setSyncing(false);
  };

  const rowUnmatched = (a: AppointmentRow): boolean => {
    const lid = (a.lead_id ?? '').trim();
    if (!lid) return true;
    return !leadById.has(lid);
  };

  if (error) {
    return (
      <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3 }}>
        <Typography sx={{ color: '#F87171' }}>{error}</Typography>
      </Box>
    );
  }

  if (!rawLeads || !rawAppts) {
    return (
      <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#9CA3AF' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 280px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <CalendarIcon size={20} style={{ color: '#FFFFFF' }} />
            <Typography sx={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600 }}>Consultations</Typography>
          </Box>
          <Typography sx={{ color: '#9CA3AF', fontSize: '0.8125rem', mt: 0.5 }}>
            Ops outcomes synced from scheduling systems (Demo).
          </Typography>
        </Box>
        <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
          <Button
            variant="contained"
            size="small"
            disabled={syncing}
            onClick={() => void onSync()}
            sx={{ textTransform: 'none', mb: 0.5 }}
          >
            {syncing ? 'Syncing…' : 'Sync Consultations (Demo)'}
          </Button>
          <Typography sx={{ color: '#6B7280', fontSize: '0.7rem', maxWidth: 280, ml: { xs: 0, sm: 'auto' } }}>
            In production: webhook/API import from scheduling/CRM.
          </Typography>
        </Box>
      </Box>

      <EverselfFiltersBar value={filters} onChange={setFilters} availableCities={availableCities} onApply={() => {}} />

      <Box sx={{ mt: 2, mb: 2, maxWidth: 280 }}>
        <FormControl size="small" fullWidth sx={{ minWidth: 200 }}>
          <InputLabel id="ev-appt-status">Consultation status</InputLabel>
          <Select<ApptStatusFilter>
            labelId="ev-appt-status"
            label="Consultation status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ApptStatusFilter)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="booked">Booked</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="canceled">Canceled</MenuItem>
            <MenuItem value="no_show">No-show</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, 1fr)' },
          gap: 1.5,
          mb: 3,
        }}
      >
        <KpiTile title="Booked consults" value={fmtInt(kpis.booked)} />
        <KpiTile title="Completed consults" value={fmtInt(kpis.completed)} />
        <KpiTile title="Canceled" value={fmtInt(kpis.canceled)} />
        <KpiTile title="No-shows" value={fmtInt(kpis.noShow)} />
        <KpiTile title="Median lead → book (days)" value={kpis.medianLag != null ? fmtInt(kpis.medianLag) : '—'} />
        <KpiTile title="Match rate" value={pct(kpis.matchRate)} sub="Matched to leads (filtered)" />
      </Box>

      <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', mb: 1 }}>
        Showing {fmtInt(filtered.length)} consultations in range · Sync generation {syncState.generation}
      </Typography>

      <TableContainer sx={{ border: '1px solid #27272F', borderRadius: 1, bgcolor: '#0A0A0A' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#9CA3AF', fontWeight: 600 }}>appointment_id</TableCell>
              <TableCell sx={{ color: '#9CA3AF', fontWeight: 600 }}>lead_id</TableCell>
              <TableCell sx={{ color: '#9CA3AF', fontWeight: 600 }}>City</TableCell>
              <TableCell sx={{ color: '#9CA3AF', fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ color: '#9CA3AF', fontWeight: 600 }}>booked_at</TableCell>
              <TableCell sx={{ color: '#9CA3AF', fontWeight: 600 }}>completed_at</TableCell>
              <TableCell sx={{ color: '#9CA3AF', fontWeight: 600 }}>Days lead→book</TableCell>
              <TableCell sx={{ color: '#9CA3AF', fontWeight: 600 }}>Channel</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.slice(0, 500).map((a) => {
              const bad = rowUnmatched(a);
              const lid = (a.lead_id ?? '').trim();
              const lead = lid ? leadById.get(lid) : undefined;
              const days =
                lead != null ? daysBetweenUtc(lead.created_at, a.booked_at) : null;
              return (
                <TableRow
                  key={a.appointment_id}
                  hover
                  onClick={() => setDrawer(a)}
                  sx={{
                    cursor: 'pointer',
                    '& td': { color: '#E5E7EB', borderColor: '#27272F' },
                    ...(bad ? { bgcolor: 'rgba(248, 113, 113, 0.06)' } : {}),
                  }}
                >
                  <TableCell sx={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem' }}>{a.appointment_id}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {bad ? <WarningIcon size={16} color="#F87171" /> : null}
                      <Typography sx={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem' }}>
                        {lid || '—'}
                      </Typography>
                      {bad ? (
                        <Chip label="Unmatched" size="small" sx={{ height: 20, fontSize: '0.65rem', color: '#FCA5A5' }} />
                      ) : null}
                    </Box>
                  </TableCell>
                  <TableCell>{a.city}</TableCell>
                  <TableCell>
                    <Chip label={a.status} size="small" sx={{ height: 22, fontSize: '0.7rem', textTransform: 'capitalize' }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{a.booked_at.slice(0, 16).replace('T', ' ')}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{a.completed_at ? a.completed_at.slice(0, 16).replace('T', ' ') : '—'}</TableCell>
                  <TableCell>{days != null ? fmtInt(days) : '—'}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{lead?.channel ?? '—'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Drawer anchor="right" open={Boolean(drawer)} onClose={() => setDrawer(null)} PaperProps={{ sx: { width: 380, bgcolor: '#0A0A0A', borderLeft: '1px solid #27272F', p: 2 } }}>
        {drawer ? (
          <Box>
            <Typography sx={{ color: '#F9FAFB', fontWeight: 600, mb: 1 }}>{drawer.appointment_id}</Typography>
            {rowUnmatched(drawer) ? (
              <Typography sx={{ color: '#FCA5A5', fontSize: '0.875rem', mb: 2 }}>
                {!((drawer.lead_id ?? '').trim())
                  ? 'Missing lead_id — ops record could not be joined to a marketing lead.'
                  : 'lead_id not found in leads dataset — stale ID or data entry mismatch.'}
              </Typography>
            ) : (
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', mb: 1 }}>Marketing receipt (matched lead)</Typography>
                {(() => {
                  const lead = leadById.get((drawer.lead_id ?? '').trim());
                  if (!lead) return null;
                  return (
                    <Box sx={{ fontSize: '0.8rem', color: '#E5E7EB', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <span>utm_source: {lead.utm_source ?? '—'}</span>
                      <span>utm_medium: {lead.utm_medium ?? '—'}</span>
                      <span>utm_campaign: {lead.utm_campaign ?? '—'}</span>
                      <span>gclid: {lead.gclid ?? '—'}</span>
                      <span>fbclid: {lead.fbclid ?? '—'}</span>
                      <span>fbp: {lead.fbp ?? '—'}</span>
                    </Box>
                  );
                })()}
              </Box>
            )}
            <Button size="small" onClick={() => setDrawer(null)} sx={{ color: '#93C5FD', textTransform: 'none' }}>
              Close
            </Button>
          </Box>
        ) : null}
      </Drawer>

      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={6000}
        onClose={(_, reason) => {
          if (reason === 'clickaway') return;
          setSnack(null);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Paper
          elevation={8}
          variant="outlined"
          sx={{
            bgcolor: '#111827',
            color: '#F9FAFB',
            px: 2,
            py: 1.25,
            borderColor: '#374151',
            maxWidth: 420,
          }}
        >
          <Typography variant="body2" component="div" sx={{ color: 'inherit' }}>
            {snack}
          </Typography>
        </Paper>
      </Snackbar>
    </Box>
  );
}

function KpiTile({ title, value, sub }: { title: string; value: string; sub?: string }): React.JSX.Element {
  return (
    <Card variant="outlined" sx={{ bgcolor: '#0A0A0A', borderColor: '#27272F' }}>
      <CardContent sx={{ py: 1.5 }}>
        <Typography sx={{ color: '#9CA3AF', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>{title}</Typography>
        <Typography sx={{ color: '#F9FAFB', fontSize: '1.1rem', fontWeight: 700, mt: 0.5 }}>{value}</Typography>
        {sub ? (
          <Typography sx={{ color: '#6B7280', fontSize: '0.65rem', mt: 0.5 }}>{sub}</Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}
