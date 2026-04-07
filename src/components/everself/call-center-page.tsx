'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Drawer from '@mui/material/Drawer';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Phone as PhoneIcon } from '@phosphor-icons/react/dist/ssr/Phone';

import { everselfFieldSx } from '@/components/everself/everself-field-sx';
import { fmtInt } from '@/lib/everself/format';
import {
  buildPreviousPeriodFilter,
  computeAgentStats,
  computeCityChannelCells,
  computeCityOutcomes,
  computeDailySeries,
  computeExecutiveKpis,
  computeFunnel,
  computeGaps,
  computeMissedBySource,
  computeMissedHeatmap,
  filterEnrichedCalls,
  joinAllCalls,
} from '@/lib/everself/call-center-metrics';
import type {
  AgentRow,
  CallCenterConfig,
  CallCenterFilters,
  CallRow,
  DniAssignment,
  EnrichedCall,
} from '@/lib/everself/call-center-types';
import type { AppointmentRow } from '@/lib/everself/types';

const axis = { stroke: '#4B5563', fontSize: 11, fill: '#9CA3AF' };
const grid = { stroke: '#27272F' };

function pct(n: number | null | undefined, digits = 1): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `${(n * 100).toFixed(digits)}%`;
}

function sec(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `${n.toFixed(0)}s`;
}

function KpiTile({
  label,
  value,
  sub,
  tooltip,
  delta,
}: {
  label: string;
  value: string;
  sub?: string;
  tooltip?: string;
  delta?: string | null;
}): React.JSX.Element {
  const inner = (
    <Card variant="outlined" sx={{ bgcolor: '#0A0A0A', borderColor: '#27272F', height: '100%' }}>
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography sx={{ color: '#9CA3AF', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </Typography>
        <Typography sx={{ color: '#F9FAFB', fontSize: '1.35rem', fontWeight: 700, mt: 0.5 }}>{value}</Typography>
        {delta ? (
          <Typography sx={{ color: delta.startsWith('−') || delta.startsWith('-') ? '#F87171' : '#34D399', fontSize: '0.75rem', mt: 0.25 }}>
            {delta}
          </Typography>
        ) : null}
        {sub ? (
          <Typography sx={{ color: '#6B7280', fontSize: '0.65rem', mt: 0.5 }}>{sub}</Typography>
        ) : null}
      </CardContent>
    </Card>
  );
  return tooltip ? (
    <Tooltip title={tooltip} placement="top" arrow>
      <Box sx={{ height: '100%' }}>{inner}</Box>
    </Tooltip>
  ) : (
    inner
  );
}

function heatmapColor(n: number, max: number): string {
  if (max <= 0 || n === 0) return 'rgba(39,39,47,0.6)';
  const t = Math.min(1, n / max);
  const r = Math.round(127 + t * 128);
  const g = Math.round(29 + (1 - t) * 100);
  const b = Math.round(29 + (1 - t) * 80);
  return `rgba(${r},${g},${b},0.95)`;
}

export function CallCenterPage(): React.JSX.Element {
  const [tab, setTab] = React.useState(0);
  const [start, setStart] = React.useState<Dayjs>(() => dayjs().subtract(29, 'day').startOf('day'));
  const [end, setEnd] = React.useState<Dayjs>(() => dayjs().startOf('day'));
  const [cities, setCities] = React.useState<string[]>([]);
  const [channels, setChannels] = React.useState<string[]>([]);
  const [campaignSearch, setCampaignSearch] = React.useState('');
  const [agentId, setAgentId] = React.useState<string>('');
  const [includeVm, setIncludeVm] = React.useState(true);
  const [bookingWindowDays, setBookingWindowDays] = React.useState(7);
  const [snack, setSnack] = React.useState<string | null>(null);

  const [rawCalls, setRawCalls] = React.useState<CallRow[] | null>(null);
  const [assignments, setAssignments] = React.useState<DniAssignment[] | null>(null);
  const [agents, setAgents] = React.useState<AgentRow[] | null>(null);
  const [appointments, setAppointments] = React.useState<AppointmentRow[] | null>(null);
  const [baseConfig, setBaseConfig] = React.useState<CallCenterConfig | null>(null);
  const [loadErr, setLoadErr] = React.useState<string | null>(null);

  const [logPage, setLogPage] = React.useState(0);
  const [logRows, setLogRows] = React.useState(25);
  const [drill, setDrill] = React.useState<{ city: string | null; channel: string | null }>({ city: null, channel: null });
  const [panelCall, setPanelCall] = React.useState<EnrichedCall | null>(null);

  React.useEffect(() => {
    let c = false;
    (async () => {
      try {
        const [ca, as, ag, ap, cfg] = await Promise.all([
          fetch('/demo/everself/calls.json').then((r) => r.json()),
          fetch('/demo/everself/dni_assignments.json').then((r) => r.json()),
          fetch('/demo/everself/agents.json').then((r) => r.json()),
          fetch('/demo/everself/appointments.json').then((r) => r.json()),
          fetch('/demo/everself/call_center_config.json').then((r) => r.json()),
        ]);
        if (!c) {
          setRawCalls(ca as CallRow[]);
          setAssignments(as as DniAssignment[]);
          setAgents(ag as AgentRow[]);
          setAppointments(ap as AppointmentRow[]);
          setBaseConfig(cfg as CallCenterConfig);
        }
      } catch (e) {
        if (!c) setLoadErr(e instanceof Error ? e.message : 'Failed to load');
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const mergedConfig = React.useMemo((): CallCenterConfig | null => {
    if (!baseConfig) return null;
    return {
      ...baseConfig,
      booking_window_days: bookingWindowDays,
      include_voicemail_as_missed: includeVm,
    };
  }, [baseConfig, bookingWindowDays, includeVm]);

  const enrichedAll = React.useMemo(() => {
    if (!rawCalls || !assignments || !appointments || !mergedConfig) return [];
    return joinAllCalls(rawCalls, assignments, appointments, mergedConfig);
  }, [rawCalls, assignments, appointments, mergedConfig]);

  const cityOptions = React.useMemo(() => {
    const s = new Set<string>();
    for (const c of enrichedAll) {
      if (c.effectiveCity) s.add(c.effectiveCity);
    }
    return Array.from(s).sort();
  }, [enrichedAll]);

  const filters: CallCenterFilters = React.useMemo(
    () => ({
      startMs: start.valueOf(),
      endMs: end.endOf('day').valueOf(),
      cities,
      channels,
      campaignSearch,
      agentId: agentId || null,
      includeVoicemailAsMissed: includeVm,
      bookingWindowDays,
    }),
    [start, end, cities, channels, campaignSearch, agentId, includeVm, bookingWindowDays]
  );

  const filtered = React.useMemo(() => filterEnrichedCalls(enrichedAll, filters), [enrichedAll, filters]);

  const prevFiltered = React.useMemo(() => {
    const pf = buildPreviousPeriodFilter(filters);
    return filterEnrichedCalls(enrichedAll, pf);
  }, [enrichedAll, filters]);

  const kpis = React.useMemo(
    () => (mergedConfig ? computeExecutiveKpis(filtered, prevFiltered, mergedConfig) : null),
    [filtered, prevFiltered, mergedConfig]
  );

  const baselineBooked = kpis?.callToBookRate ?? 0.15;

  const daily = React.useMemo(() => computeDailySeries(filtered), [filtered]);
  const cityChannel = React.useMemo(() => computeCityChannelCells(filtered), [filtered]);
  const heatmap = React.useMemo(() => computeMissedHeatmap(filtered), [filtered]);
  const missedBySource = React.useMemo(() => computeMissedBySource(filtered, baselineBooked), [filtered, baselineBooked]);
  const agentStats = React.useMemo(() => computeAgentStats(filtered, agents ?? []), [filtered, agents]);
  const gaps = React.useMemo(() => (kpis && mergedConfig ? computeGaps(filtered, kpis, mergedConfig) : []), [filtered, kpis, mergedConfig]);
  const funnel = React.useMemo(() => computeFunnel(filtered), [filtered]);
  const cityOutcomes = React.useMemo(() => computeCityOutcomes(filtered), [filtered]);

  const heatMax = React.useMemo(() => heatmap.reduce((m, h) => Math.max(m, h.missed), 0), [heatmap]);

  const logFiltered = React.useMemo(() => {
    let rows = filtered;
    if (drill.city) rows = rows.filter((r) => (r.effectiveCity ?? '') === drill.city);
    if (drill.channel) rows = rows.filter((r) => r.effectiveChannel === drill.channel);
    return rows.sort((a, b) => b.started_at.localeCompare(a.started_at));
  }, [filtered, drill]);

  const deltaTotal = kpis ? (kpis.delta.totalCalls >= 0 ? `+${kpis.delta.totalCalls}` : `${kpis.delta.totalCalls}`) : null;
  const deltaMissed = kpis?.delta.missedRate != null ? `${kpis.delta.missedRate >= 0 ? '+' : ''}${(kpis.delta.missedRate * 100).toFixed(1)} pts` : null;
  const deltaCtb = kpis?.delta.callToBookRate != null ? `${kpis.delta.callToBookRate >= 0 ? '+' : ''}${(kpis.delta.callToBookRate * 100).toFixed(1)} pts` : null;
  const deltaAsa = kpis?.delta.asaSeconds != null ? `${kpis.delta.asaSeconds >= 0 ? '+' : ''}${kpis.delta.asaSeconds.toFixed(0)}s` : null;

  const exportCsv = (rows: Record<string, string | number>[], name: string) => {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]!);
    const lines = [headers.join(','), ...rows.map((r) => headers.map((h) => String(r[h] ?? '')).join(','))];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const syncDemo = () => {
    setSnack('Imported 42 calls · 6 missed · 3 bookings created (Demo).');
  };

  if (loadErr) {
    return (
      <Box sx={{ p: 3, bgcolor: '#050505', minHeight: '100vh' }}>
        <Typography sx={{ color: '#F87171' }}>{loadErr}</Typography>
      </Box>
    );
  }

  if (!rawCalls || !assignments || !appointments || !mergedConfig || !kpis) {
    return (
      <Box sx={{ p: 3, bgcolor: '#050505', minHeight: '100vh' }}>
        <Typography sx={{ color: '#9CA3AF' }}>Loading…</Typography>
      </Box>
    );
  }

  const chOpts = ['google', 'meta', 'organic', 'unknown'];

  return (
    <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3 }}>
      <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
          <PhoneIcon size={22} style={{ color: '#FFFFFF' }} />
          <Typography sx={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600 }}>Call Center</Typography>
          <Chip label="Demo" size="small" sx={{ bgcolor: '#1D4ED8', color: '#F9FAFB', fontWeight: 600 }} />
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Button size="small" variant="outlined" onClick={syncDemo} sx={{ textTransform: 'none', borderColor: '#374151', color: '#93C5FD' }}>
            Sync calls (Demo)
          </Button>
        </Box>
      </Box>

      <Box sx={{ p: 2, mb: 2, borderRadius: 1, border: '1px solid #27272F', bgcolor: '#0A0A0A' }}>
        <Typography sx={{ color: '#E5E7EB', fontSize: '0.8rem', fontWeight: 600, mb: 1.5 }}>Filters</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <DatePicker
            label="Start"
            value={start}
            onChange={(v) => v && setStart(v.startOf('day'))}
            slotProps={{ textField: { size: 'small', sx: { ...everselfFieldSx, minWidth: 150 } } }}
          />
          <DatePicker
            label="End"
            value={end}
            onChange={(v) => v && setEnd(v.startOf('day'))}
            slotProps={{ textField: { size: 'small', sx: { ...everselfFieldSx, minWidth: 150 } } }}
          />
          <FormControl size="small" sx={{ minWidth: 200, ...everselfFieldSx }}>
            <InputLabel id="cc-cities">Cities</InputLabel>
            <Select<string[]>
              labelId="cc-cities"
              multiple
              value={cities}
              onChange={(e) => setCities(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
              input={<OutlinedInput label="Cities" />}
              renderValue={(sel) => (sel.length === 0 ? 'All' : sel.join(', '))}
            >
              {cityOptions.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160, ...everselfFieldSx }}>
            <InputLabel id="cc-ch">Channels</InputLabel>
            <Select<string[]>
              labelId="cc-ch"
              multiple
              value={channels}
              onChange={(e) => setChannels(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
              input={<OutlinedInput label="Channels" />}
              renderValue={(sel) => (sel.length === 0 ? 'All' : sel.join(', '))}
            >
              {chOpts.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            label="Campaign search"
            value={campaignSearch}
            onChange={(e) => setCampaignSearch(e.target.value)}
            sx={{ minWidth: 180, ...everselfFieldSx }}
          />
          <FormControl size="small" sx={{ minWidth: 160, ...everselfFieldSx }}>
            <InputLabel id="cc-agent">Agent</InputLabel>
            <Select value={agentId} labelId="cc-agent" label="Agent" onChange={(e) => setAgentId(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {(agents ?? []).map((a) => (
                <MenuItem key={a.agent_id} value={a.agent_id}>
                  {a.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            type="number"
            label="Booking window (days)"
            value={bookingWindowDays}
            onChange={(e) => setBookingWindowDays(Math.max(1, Number(e.target.value) || 7))}
            sx={{ width: 160, ...everselfFieldSx }}
          />
          <FormControlLabel
            control={<Checkbox checked={includeVm} onChange={(_, v) => setIncludeVm(v)} sx={{ color: '#9CA3AF' }} />}
            label={<Typography sx={{ color: '#9CA3AF', fontSize: '0.85rem' }}>Voicemail as missed</Typography>}
          />
        </Box>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: '#27272F', '& .MuiTab-root': { color: '#9CA3AF', textTransform: 'none' }, '& .Mui-selected': { color: '#93C5FD !important' } }}>
        <Tab label="Overview" />
        <Tab label="Call log" />
        <Tab label="Live ops" />
        <Tab label="Attribution" />
      </Tabs>

      {tab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography sx={{ color: '#E5E7EB', fontWeight: 600, mb: 1 }}>Executive KPIs</Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(4, 1fr)' },
                gap: 1.5,
              }}
            >
              <KpiTile label="Total calls" value={fmtInt(kpis.totalCalls)} delta={deltaTotal ? `vs prior: ${deltaTotal}` : null} />
              <KpiTile label="Answered" value={fmtInt(kpis.answeredCalls)} />
              <KpiTile label="Missed" value={fmtInt(kpis.missedCalls)} />
              <KpiTile label="Missed rate" value={pct(kpis.missedRate)} delta={deltaMissed} tooltip="Missed ÷ total (voicemail optional)" />
              <KpiTile label="ASA" value={sec(kpis.asaSeconds)} delta={deltaAsa} tooltip="Average speed of answer (answered calls)" />
              <KpiTile
                label={`Service level (≤${mergedConfig.service_level_seconds}s)`}
                value={pct(kpis.serviceLevelPct)}
                tooltip="Share of answered calls where ring-to-answer meets threshold"
              />
              <KpiTile label="Booked consults" value={fmtInt(kpis.bookedConsultsFromCalls)} />
              <KpiTile label="Call → booked" value={pct(kpis.callToBookRate)} delta={deltaCtb} tooltip="Answered calls with consult booked inside booking window" />
            </Box>
            <Typography sx={{ color: '#6B7280', fontSize: '0.75rem', mt: 1 }}>
              Attribution match {pct(kpis.attributionMatchRate)} · Click-ID coverage {pct(kpis.clickIdCoveragePct)}
            </Typography>
          </Box>

          <Box>
            <Typography sx={{ color: '#E5E7EB', fontWeight: 600, mb: 1 }}>Calls by channel × city</Typography>
            <Typography sx={{ color: '#6B7280', fontSize: '0.75rem', mb: 1 }}>
              Click a cell to open Call log filtered (clears with “Clear drill” in Call log).
            </Typography>
            <TableContainer sx={{ border: '1px solid #27272F', borderRadius: 1, bgcolor: '#0A0A0A', maxHeight: 360 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#9CA3AF', bgcolor: '#0A0A0A' }}>City</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', bgcolor: '#0A0A0A' }}>Channel</TableCell>
                    <TableCell align="right" sx={{ color: '#9CA3AF', bgcolor: '#0A0A0A' }}>
                      Calls
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#9CA3AF', bgcolor: '#0A0A0A' }}>
                      Answered %
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#9CA3AF', bgcolor: '#0A0A0A' }}>
                      Missed %
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#9CA3AF', bgcolor: '#0A0A0A' }}>
                      Call→book %
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cityChannel.map((row) => (
                    <TableRow
                      key={`${row.city}-${row.channel}`}
                      hover
                      sx={{ cursor: 'pointer', '& td': { borderColor: '#27272F', color: '#E5E7EB' } }}
                      onClick={() => {
                        setDrill({ city: row.city, channel: row.channel });
                        setTab(1);
                      }}
                    >
                      <TableCell>{row.city}</TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{row.channel}</TableCell>
                      <TableCell align="right">{fmtInt(row.calls)}</TableCell>
                      <TableCell align="right">{pct(row.answeredPct)}</TableCell>
                      <TableCell align="right">{pct(row.missedPct)}</TableCell>
                      <TableCell align="right">{pct(row.callToBookPct)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box>
            <Typography sx={{ color: '#E5E7EB', fontWeight: 600, mb: 1 }}>Trends</Typography>
            <Box sx={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={daily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid.stroke} />
                  <XAxis dataKey="date" tick={axis} />
                  <YAxis yAxisId="l" tick={axis} />
                  <YAxis yAxisId="r" orientation="right" tick={axis} tickFormatter={(v) => `${(Number(v) * 100).toFixed(0)}%`} />
                  <RTooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }} />
                  <Legend />
                  <Line yAxisId="l" type="monotone" dataKey="total" name="Total calls" stroke="#60A5FA" dot={false} strokeWidth={2} />
                  <Line yAxisId="r" type="monotone" dataKey="missedRate" name="Missed rate" stroke="#F87171" dot={false} strokeWidth={1.5} />
                  <Line yAxisId="r" type="monotone" dataKey="callToBookRate" name="Call→book" stroke="#34D399" dot={false} strokeWidth={1.5} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Box>

          <Box>
            <Typography sx={{ color: '#E5E7EB', fontWeight: 600, mb: 1 }}>Missed calls heatmap (local time)</Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '56px repeat(24, minmax(22px, 1fr))', gap: 0.5, alignItems: 'center' }}>
                <Box />
                {Array.from({ length: 24 }, (_, h) => (
                  <Typography key={h} sx={{ color: '#6B7280', fontSize: '0.6rem', textAlign: 'center' }}>
                    {h}
                  </Typography>
                ))}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label, dow) => (
                  <React.Fragment key={label}>
                    <Typography sx={{ color: '#9CA3AF', fontSize: '0.7rem' }}>{label}</Typography>
                    {Array.from({ length: 24 }, (_, hour) => {
                      const cell = heatmap.find((x) => x.dow === dow && x.hour === hour);
                      const n = cell?.missed ?? 0;
                      return (
                        <Box
                          key={`${dow}-${hour}`}
                          sx={{
                            height: 22,
                            borderRadius: 0.5,
                            bgcolor: heatmapColor(n, heatMax),
                            border: '1px solid #1f1f27',
                          }}
                          title={`${label} ${hour}:00 — ${n} missed`}
                        />
                      );
                    })}
                  </React.Fragment>
                ))}
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Typography sx={{ color: '#E5E7EB', fontWeight: 600 }}>Missed by source</Typography>
            <Button
              size="small"
              onClick={() =>
                exportCsv(
                  missedBySource.map((r) => ({
                    channel: r.channel,
                    campaign: r.campaign,
                    total_calls: r.totalCalls,
                    missed_calls: r.missedCalls,
                    missed_pct: r.missedPct != null ? (r.missedPct * 100).toFixed(1) : '',
                    est_lost: r.estLostBookings.toFixed(2),
                  })),
                  'call-center-missed-by-source.csv'
                )
              }
              sx={{ color: '#93C5FD', textTransform: 'none' }}
            >
              Export CSV
            </Button>
          </Box>
          <TableContainer sx={{ border: '1px solid #27272F', borderRadius: 1, bgcolor: '#0A0A0A' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#9CA3AF' }}>Channel</TableCell>
                  <TableCell sx={{ color: '#9CA3AF' }}>Campaign</TableCell>
                  <TableCell align="right" sx={{ color: '#9CA3AF' }}>
                    Total
                  </TableCell>
                  <TableCell align="right" sx={{ color: '#9CA3AF' }}>
                    Missed
                  </TableCell>
                  <TableCell align="right" sx={{ color: '#9CA3AF' }}>
                    Missed %
                  </TableCell>
                  <TableCell align="right" sx={{ color: '#9CA3AF' }}>
                    Est. lost bookings
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {missedBySource.slice(0, 12).map((r, idx) => (
                  <TableRow key={`${r.channel}-${r.campaign}-${idx}`} sx={{ '& td': { borderColor: '#27272F', color: '#E5E7EB' } }}>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{r.channel}</TableCell>
                    <TableCell>{r.campaign}</TableCell>
                    <TableCell align="right">{fmtInt(r.totalCalls)}</TableCell>
                    <TableCell align="right">{fmtInt(r.missedCalls)}</TableCell>
                    <TableCell align="right">{pct(r.missedPct)}</TableCell>
                    <TableCell align="right">{r.estLostBookings.toFixed(1)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box>
            <Typography sx={{ color: '#E5E7EB', fontWeight: 600, mb: 1 }}>Call handling gaps</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {gaps.length === 0 ? (
                <Typography sx={{ color: '#6B7280', fontSize: '0.875rem' }}>No threshold breaches in this range.</Typography>
              ) : (
                gaps.map((g, i) => (
                  <Card key={i} variant="outlined" sx={{ bgcolor: '#0A0A0A', borderColor: '#7F1D1D' }}>
                    <CardContent sx={{ py: 1 }}>
                      <Typography sx={{ color: '#FCA5A5', fontWeight: 600, fontSize: '0.85rem' }}>{g.label}</Typography>
                      <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>{g.detail}</Typography>
                    </CardContent>
                  </Card>
                ))
              )}
            </Box>
          </Box>

          <Box>
            <Typography sx={{ color: '#E5E7EB', fontWeight: 600, mb: 1 }}>Booking outcomes</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '280px 1fr' }, gap: 2 }}>
              <Card variant="outlined" sx={{ bgcolor: '#0A0A0A', borderColor: '#27272F' }}>
                <CardContent>
                  <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', mb: 1 }}>Funnel</Typography>
                  <Typography sx={{ color: '#E5E7EB', fontSize: '0.85rem' }}>Answered: {fmtInt(funnel.answered)}</Typography>
                  <Typography sx={{ color: '#E5E7EB', fontSize: '0.85rem' }}>Leads matched: {fmtInt(funnel.leadsMatched)}</Typography>
                  <Typography sx={{ color: '#E5E7EB', fontSize: '0.85rem' }}>Booked consults: {fmtInt(funnel.bookedConsults)}</Typography>
                  <Typography sx={{ color: '#E5E7EB', fontSize: '0.85rem' }}>Completed: {fmtInt(funnel.completedConsults)}</Typography>
                </CardContent>
              </Card>
              <TableContainer sx={{ border: '1px solid #27272F', borderRadius: 1, bgcolor: '#0A0A0A' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#9CA3AF' }}>City</TableCell>
                      <TableCell align="right" sx={{ color: '#9CA3AF' }}>
                        Answered
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#9CA3AF' }}>
                        Call→book
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#9CA3AF' }}>
                        Booked
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#9CA3AF' }}>
                        Median lag (d)
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cityOutcomes.map((r) => (
                      <TableRow key={r.city} sx={{ '& td': { borderColor: '#27272F', color: '#E5E7EB' } }}>
                        <TableCell>{r.city}</TableCell>
                        <TableCell align="right">{fmtInt(r.answered)}</TableCell>
                        <TableCell align="right">{pct(r.callToBookPct)}</TableCell>
                        <TableCell align="right">{fmtInt(r.bookedConsults)}</TableCell>
                        <TableCell align="right">{r.medianLagDays != null ? r.medianLagDays.toFixed(1) : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>

          <Box>
            <Typography sx={{ color: '#E5E7EB', fontWeight: 600, mb: 1 }}>Agent performance</Typography>
            <TableContainer sx={{ border: '1px solid #27272F', borderRadius: 1, bgcolor: '#0A0A0A' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#9CA3AF' }}>Agent</TableCell>
                    <TableCell align="right" sx={{ color: '#9CA3AF' }}>
                      Answered
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#9CA3AF' }}>
                      AHT
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#9CA3AF' }}>
                      Call→book
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {agentStats.map((r) => (
                    <TableRow key={r.agent_id} sx={{ '& td': { borderColor: '#27272F', color: '#E5E7EB' } }}>
                      <TableCell>{r.name}</TableCell>
                      <TableCell align="right">{fmtInt(r.answered)}</TableCell>
                      <TableCell align="right">{sec(r.avgHandleSeconds)}</TableCell>
                      <TableCell align="right">{pct(r.callToBookPct)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      )}

      {tab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1, alignItems: 'center' }}>
            {drill.city || drill.channel ? (
              <>
                <Chip
                  size="small"
                  label={`Drill: ${drill.city ?? 'any city'} · ${drill.channel ?? 'any channel'}`}
                  sx={{ bgcolor: '#1e3a5f', color: '#93C5FD' }}
                />
                <Button size="small" onClick={() => setDrill({ city: null, channel: null })} sx={{ color: '#93C5FD', textTransform: 'none' }}>
                  Clear drill
                </Button>
              </>
            ) : null}
          </Box>
          <TableContainer sx={{ border: '1px solid #27272F', borderRadius: 1, bgcolor: '#0A0A0A' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#9CA3AF' }}>Start (UTC)</TableCell>
                  <TableCell sx={{ color: '#9CA3AF' }}>City</TableCell>
                  <TableCell sx={{ color: '#9CA3AF' }}>Channel / campaign</TableCell>
                  <TableCell sx={{ color: '#9CA3AF' }}>To #</TableCell>
                  <TableCell sx={{ color: '#9CA3AF' }}>Status</TableCell>
                  <TableCell align="right" sx={{ color: '#9CA3AF' }}>
                    Ring
                  </TableCell>
                  <TableCell align="right" sx={{ color: '#9CA3AF' }}>
                    Talk
                  </TableCell>
                  <TableCell sx={{ color: '#9CA3AF' }}>Agent</TableCell>
                  <TableCell sx={{ color: '#9CA3AF' }}>Lead</TableCell>
                  <TableCell sx={{ color: '#9CA3AF' }}>Booked</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logFiltered.slice(logPage * logRows, logPage * logRows + logRows).map((r) => (
                  <TableRow
                    key={r.call_id}
                    hover
                    sx={{ cursor: 'pointer', '& td': { borderColor: '#27272F', color: '#E5E7EB', fontSize: '0.75rem' } }}
                    onClick={() => setPanelCall(r)}
                  >
                    <TableCell>{r.started_at.slice(0, 19).replace('T', ' ')}</TableCell>
                    <TableCell>{r.effectiveCity ?? '—'}</TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      {r.effectiveChannel} · {r.effectiveUtmCampaign ?? '—'}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.65rem' }}>{r.to_tracking_number}</TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{r.status}</TableCell>
                    <TableCell align="right">{r.ring_seconds ?? '—'}</TableCell>
                    <TableCell align="right">{r.talk_seconds ?? '—'}</TableCell>
                    <TableCell>{r.agent_id ?? '—'}</TableCell>
                    <TableCell>{r.lead_id ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{r.bookedConsultWithinWindow ? 'Yes' : 'No'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={logFiltered.length}
            page={logPage}
            onPageChange={(_, p) => setLogPage(p)}
            rowsPerPage={logRows}
            onRowsPerPageChange={(e) => {
              setLogRows(Number(e.target.value));
              setLogPage(0);
            }}
            sx={{ color: '#9CA3AF', borderTop: '1px solid #27272F' }}
          />
        </Box>
      )}

      {tab === 2 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          <Card variant="outlined" sx={{ bgcolor: '#0A0A0A', borderColor: '#27272F' }}>
            <CardContent>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem' }}>Queue depth (Demo)</Typography>
              <Typography sx={{ color: '#F9FAFB', fontSize: '1.5rem', fontWeight: 700 }}>2</Typography>
              <Typography sx={{ color: '#6B7280', fontSize: '0.8rem' }}>Calls waiting</Typography>
            </CardContent>
          </Card>
          <Card variant="outlined" sx={{ bgcolor: '#0A0A0A', borderColor: '#27272F' }}>
            <CardContent>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem' }}>Online agents (Demo)</Typography>
              <Typography sx={{ color: '#F9FAFB', fontSize: '1.5rem', fontWeight: 700 }}>{agents?.length ?? 0}</Typography>
              <Typography sx={{ color: '#6B7280', fontSize: '0.8rem' }}>Across cities</Typography>
            </CardContent>
          </Card>
          <Card variant="outlined" sx={{ bgcolor: '#0A0A0A', borderColor: '#27272F' }}>
            <CardContent>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem' }}>Longest wait (Demo)</Typography>
              <Typography sx={{ color: '#F9FAFB', fontSize: '1.5rem', fontWeight: 700 }}>0:42</Typography>
              <Typography sx={{ color: '#6B7280', fontSize: '0.8rem' }}>Not connected to live telephony</Typography>
            </CardContent>
          </Card>
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Typography sx={{ color: '#6B7280', fontSize: '0.85rem' }}>
              Live queue and agent presence are simulated for the interview demo. Production would subscribe to Telnyx or CCaaS events.
            </Typography>
          </Box>
        </Box>
      )}

      {tab === 3 && (
        <Box>
          <Typography sx={{ color: '#9CA3AF', fontSize: '0.85rem', mb: 2 }}>
            Dynamic Number Insertion assignments — match rate {pct(kpis.attributionMatchRate)} · Click-ID coverage {pct(kpis.clickIdCoveragePct)}
          </Typography>
          <TableContainer sx={{ border: '1px solid #27272F', borderRadius: 1, bgcolor: '#0A0A0A', maxHeight: 480 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#9CA3AF', bgcolor: '#0A0A0A' }}>Assignment</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', bgcolor: '#0A0A0A' }}>Tracking #</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', bgcolor: '#0A0A0A' }}>City</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', bgcolor: '#0A0A0A' }}>Channel</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', bgcolor: '#0A0A0A' }}>Campaign</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', bgcolor: '#0A0A0A' }}>Click IDs</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(assignments ?? []).slice(0, 40).map((a) => (
                  <TableRow key={a.dni_assignment_id} sx={{ '& td': { borderColor: '#27272F', color: '#E5E7EB', fontSize: '0.75rem' } }}>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{a.dni_assignment_id}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{a.tracking_number}</TableCell>
                    <TableCell>{a.city ?? '—'}</TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{a.channel ?? '—'}</TableCell>
                    <TableCell>{a.utm_campaign ?? '—'}</TableCell>
                    <TableCell>{[a.gclid, a.wbraid, a.gbraid, a.fbclid, a.fbp, a.fbc].filter(Boolean).length ? 'Present' : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      <Drawer anchor="right" open={Boolean(panelCall)} onClose={() => setPanelCall(null)} PaperProps={{ sx: { width: 380, bgcolor: '#0A0A0A', borderLeft: '1px solid #27272F', p: 2 } }}>
        {panelCall ? (
          <Box>
            <Typography sx={{ color: '#F9FAFB', fontWeight: 600, mb: 1 }}>{panelCall.call_id}</Typography>
            <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem', mb: 2 }}>
              {panelCall.started_at} · {panelCall.status}
            </Typography>
            <Typography sx={{ color: '#E5E7EB', fontSize: '0.85rem', mb: 1 }}>Attribution</Typography>
            <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', fontFamily: 'monospace' }}>
              utm: {panelCall.effectiveUtmCampaign ?? panelCall.assignment?.utm_campaign ?? '—'}
              <br />
              gclid: {panelCall.gclid ?? panelCall.assignment?.gclid ?? '—'}
              <br />
              session: {panelCall.assignment?.session_id ?? '—'}
            </Typography>
            <Typography sx={{ color: '#E5E7EB', fontSize: '0.85rem', mt: 2, mb: 0.5 }}>DNI</Typography>
            <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
              {panelCall.assignment ? panelCall.assignment.dni_assignment_id : 'Unmatched (used time-window or raw call fields)'}
            </Typography>
            <Button size="small" onClick={() => setPanelCall(null)} sx={{ color: '#93C5FD', textTransform: 'none', mt: 2 }}>
              Close
            </Button>
          </Box>
        ) : null}
      </Drawer>

      <Snackbar open={Boolean(snack)} message={snack ?? ''} onClose={() => setSnack(null)} autoHideDuration={4000} />
    </Box>
  );
}
