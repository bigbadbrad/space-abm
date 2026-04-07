'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Drawer from '@mui/material/Drawer';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
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
import { Copy as CopyIcon } from '@phosphor-icons/react/dist/ssr/Copy';

import { everselfFieldSx } from '@/components/everself/everself-field-sx';
import { fmtInt, fmtUsd0 } from '@/lib/everself/format';
import {
  buildControlAlerts,
  type CampaignPerformance,
  type CityPacingRow,
  type ControlFilterRange,
  type DailyPacingPoint,
  computeCampaignPerformance,
  computeCityPacing,
  dailyPacingSeries,
  impactWindowSeries,
  topCacRiskCities,
} from '@/lib/everself/everself-control-metrics';
import type {
  CampaignOverride,
  ChangeHistoryRow,
  ControlAlertItem,
  ControlAnnotation,
  ControlStateV2,
  DemoCampaignRow,
  DemoChangeEvent,
  SpendDailyRow,
} from '@/lib/everself/everself-control-types';
import type { AppointmentRow, LeadRow } from '@/lib/everself/types';

const axis = { stroke: '#4B5563', fontSize: 11, fill: '#9CA3AF' };
const grid = { stroke: '#27272F' };

/** MUI Chip default fill is illegible on `#0A0A0A` cards; force contrast per severity. */
function alertSeverityChipSx(severity: ControlAlertItem['severity']) {
  const base = {
    height: 22,
    fontSize: '0.65rem',
    textTransform: 'uppercase' as const,
    fontWeight: 700,
    mr: 1,
    '& .MuiChip-label': { px: 1 },
  };
  switch (severity) {
    case 'high':
      return { ...base, bgcolor: '#991B1B', color: '#FEE2E2', border: '1px solid #F87171' };
    case 'med':
      return { ...base, bgcolor: '#1E40AF', color: '#DBEAFE', border: '1px solid #60A5FA' };
    case 'low':
      return { ...base, bgcolor: '#52525B', color: '#FAFAFA', border: '1px solid #A1A1AA' };
    default:
      return { ...base, bgcolor: '#52525B', color: '#FAFAFA', border: '1px solid #A1A1AA' };
  }
}

export function EverselfControlPacingTab({
  cities,
  spend,
  leads,
  appointments,
  filters,
  control,
  onPatchCity,
}: {
  cities: string[];
  spend: SpendDailyRow[];
  leads: LeadRow[];
  appointments: AppointmentRow[];
  filters: ControlFilterRange;
  control: ControlStateV2;
  onPatchCity: (city: string, patch: { weekly_budget?: number; channel_split?: { google: number; meta: number }; notes?: string }) => void;
}): React.JSX.Element {
  const [chartCity, setChartCity] = React.useState<string | null>(null);

  const rows = React.useMemo(
    () =>
      computeCityPacing(cities, spend, appointments, leads, filters, control.overrides.city_budgets),
    [cities, spend, appointments, leads, filters, control.overrides.city_budgets]
  );

  React.useEffect(() => {
    if (!chartCity && rows.length > 0) setChartCity(rows[0]!.city);
  }, [chartCity, rows]);

  const weeklyForChart = rows.find((r) => r.city === chartCity)?.weekly_budget ?? 0;
  const pacingLine = React.useMemo(
    () => dailyPacingSeries(spend, chartCity, filters, weeklyForChart),
    [spend, chartCity, filters, weeklyForChart]
  );

  const risks = React.useMemo(
    () => topCacRiskCities(spend, leads, appointments, filters, 14),
    [spend, leads, appointments, filters]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography sx={{ color: '#E5E7EB', fontWeight: 600 }}>Weekly plan (city)</Typography>
      <TableContainer sx={{ border: '1px solid #27272F', borderRadius: 1, bgcolor: '#0A0A0A' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#9CA3AF' }}>City</TableCell>
              <TableCell sx={{ color: '#9CA3AF' }}>Weekly budget (Demo)</TableCell>
              <TableCell sx={{ color: '#9CA3AF' }}>Google %</TableCell>
              <TableCell sx={{ color: '#9CA3AF' }}>Spend (period)</TableCell>
              <TableCell sx={{ color: '#9CA3AF' }}>Booked</TableCell>
              <TableCell sx={{ color: '#9CA3AF' }}>CP booked</TableCell>
              <TableCell sx={{ color: '#9CA3AF' }}>Forecast booked</TableCell>
              <TableCell sx={{ color: '#9CA3AF' }}>Pace vs ideal</TableCell>
              <TableCell sx={{ color: '#9CA3AF' }}>Flag</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <CityPacingRowEditor key={r.city} row={r} onPatch={onPatchCity} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box>
        <Typography sx={{ color: '#E5E7EB', fontWeight: 600, mb: 1 }}>Daily pacing (cumulative spend vs ideal)</Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>City for chart</Typography>
          {rows.map((r) => (
            <Button
              key={r.city}
              size="small"
              variant={chartCity === r.city ? 'contained' : 'outlined'}
              onClick={() => setChartCity(r.city)}
              sx={{ textTransform: 'none' }}
            >
              {r.city}
            </Button>
          ))}
        </Box>
        <Box sx={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <LineChart data={pacingLine} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={grid.stroke} />
              <XAxis dataKey="date" tick={axis} />
              <YAxis tick={axis} tickFormatter={(v) => fmtUsd0(Number(v))} />
              <RTooltip
                contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }}
                labelStyle={{ color: '#E5E7EB' }}
                formatter={(value: string | number | undefined) => fmtUsd0(value == null ? NaN : Number(value))}
              />
              <Legend />
              <Line type="monotone" dataKey="cumulative_spend" name="Spend" stroke="#60A5FA" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="ideal" name="Ideal pace" stroke="#9CA3AF" dot={false} strokeWidth={1.5} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>

      <Box>
        <Typography sx={{ color: '#E5E7EB', fontWeight: 600, mb: 1 }}>CAC risk (top 3 cities)</Typography>
        <Typography sx={{ color: '#6B7280', fontSize: '0.75rem', mb: 1 }}>
          High risk if CP booked worsened &gt;25% vs prior window or lead→book dropped &gt;20%.
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {risks.map((x) => (
            <Card key={x.city} variant="outlined" sx={{ bgcolor: '#0A0A0A', borderColor: '#27272F' }}>
              <CardContent sx={{ py: 1 }}>
                <Typography sx={{ color: '#F9FAFB', fontWeight: 600 }}>{x.city}</Typography>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                  Δ CP booked: {x.cp_booked_delta_pct != null ? `${(x.cp_booked_delta_pct * 100).toFixed(1)}%` : '—'} · Δ lead→book:{' '}
                  {x.lead_to_book_delta_pct != null ? `${(x.lead_to_book_delta_pct * 100).toFixed(1)}%` : '—'}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function CityPacingRowEditor({
  row,
  onPatch,
}: {
  row: CityPacingRow;
  onPatch: (city: string, patch: { weekly_budget?: number; channel_split?: { google: number; meta: number }; notes?: string }) => void;
}): React.JSX.Element {
  const [wb, setWb] = React.useState(String(Math.round(row.weekly_budget)));
  const [gp, setGp] = React.useState(String(Math.round(row.google_share * 100)));
  React.useEffect(() => {
    setWb(String(Math.round(row.weekly_budget)));
    setGp(String(Math.round(row.google_share * 100)));
  }, [row.weekly_budget, row.google_share]);

  const flag =
    row.pace_pct != null ? (row.pace_pct < 0.9 ? 'Under' : row.pace_pct > 1.1 ? 'Over' : 'OK') : '—';

  return (
    <TableRow sx={{ '& td': { borderColor: '#27272F', color: '#E5E7EB' } }}>
      <TableCell>{row.city}</TableCell>
      <TableCell>
        <TextField
          size="small"
          value={wb}
          onChange={(e) => setWb(e.target.value)}
          onBlur={() => {
            const n = Number(wb);
            if (Number.isFinite(n) && n >= 0) onPatch(row.city, { weekly_budget: n });
          }}
          sx={{ width: 120, ...everselfFieldSx }}
        />
      </TableCell>
      <TableCell>
        <TextField
          size="small"
          value={gp}
          onChange={(e) => setGp(e.target.value)}
          onBlur={() => {
            const g = Math.min(100, Math.max(0, Number(gp) || 0)) / 100;
            onPatch(row.city, { channel_split: { google: g, meta: 1 - g } });
          }}
          sx={{ width: 72, ...everselfFieldSx }}
        />
      </TableCell>
      <TableCell>{fmtUsd0(row.spend_period)}</TableCell>
      <TableCell>{fmtInt(row.booked)}</TableCell>
      <TableCell>{fmtUsd0(row.cp_booked)}</TableCell>
      <TableCell>{row.forecast_booked != null ? fmtInt(Math.round(row.forecast_booked)) : '—'}</TableCell>
      <TableCell>{row.pace_pct != null ? `${(row.pace_pct * 100).toFixed(0)}%` : '—'}</TableCell>
      <TableCell>
        <Chip
          size="small"
          label={flag}
          sx={{
            height: 22,
            fontSize: '0.7rem',
            bgcolor: flag === 'Under' ? 'rgba(251,191,36,0.15)' : flag === 'Over' ? 'rgba(248,113,113,0.12)' : '#111827',
            color: '#E5E7EB',
          }}
        />
      </TableCell>
    </TableRow>
  );
}

function CampaignTableRow({
  c,
  perf,
  control,
  onPatchCampaign,
}: {
  c: DemoCampaignRow;
  perf: Map<string, CampaignPerformance>;
  control: ControlStateV2;
  onPatchCampaign: (
    id: string,
    patch: Partial<CampaignOverride> & { action: string; beforeVal: unknown; afterVal: unknown }
  ) => void;
}): React.JSX.Element {
  const o = control.overrides.campaigns[c.campaign_id];
  const p = perf.get(c.campaign_id);
  const active = (o?.status ?? c.status) === 'active';
  const db = o?.daily_budget ?? c.daily_budget;
  const [budgetStr, setBudgetStr] = React.useState(String(db));
  React.useEffect(() => {
    setBudgetStr(String(o?.daily_budget ?? c.daily_budget));
  }, [c.campaign_id, c.daily_budget, o?.daily_budget]);

  return (
    <TableRow sx={{ '& td': { borderColor: '#27272F', color: '#E5E7EB' } }}>
      <TableCell>
        <Switch
          size="small"
          checked={active}
          onChange={(_, v) =>
            onPatchCampaign(c.campaign_id, {
              status: v ? 'active' : 'paused',
              action: v ? 'activate' : 'pause',
              beforeVal: o?.status ?? c.status,
              afterVal: v ? 'active' : 'paused',
            })
          }
        />
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem' }}>{c.platform === 'google_ads' ? 'Google' : 'Meta'}</TableCell>
      <TableCell sx={{ maxWidth: 200, fontSize: '0.75rem' }}>{c.campaign_name}</TableCell>
      <TableCell sx={{ fontSize: '0.75rem' }}>{c.city}</TableCell>
      <TableCell>
        <TextField
          size="small"
          type="number"
          value={budgetStr}
          onChange={(e) => setBudgetStr(e.target.value)}
          onBlur={() => {
            const n = Number(budgetStr);
            if (!Number.isFinite(n) || n < 0) {
              setBudgetStr(String(db));
              return;
            }
            if (n !== db)
              onPatchCampaign(c.campaign_id, {
                daily_budget: n,
                action: 'budget_edit',
                beforeVal: db,
                afterVal: n,
              });
          }}
          sx={{ width: 88, ...everselfFieldSx }}
        />
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem' }}>{fmtUsd0(p?.spend)}</TableCell>
      <TableCell>{fmtInt(p?.leads ?? 0)}</TableCell>
      <TableCell>{fmtInt(p?.booked ?? 0)}</TableCell>
      <TableCell sx={{ fontSize: '0.75rem' }}>{fmtUsd0(p?.cp_booked ?? null)}</TableCell>
      <TableCell>{fmtInt(p?.completed ?? 0)}</TableCell>
      <TableCell>
        <Button
          size="small"
          sx={{ textTransform: 'none', minWidth: 'auto', mr: 0.5, fontSize: '0.7rem' }}
          onClick={() => {
            const next = Math.round(db * 1.1);
            onPatchCampaign(c.campaign_id, {
              daily_budget: next,
              action: 'budget:+10%',
              beforeVal: db,
              afterVal: next,
            });
            setBudgetStr(String(next));
          }}
        >
          +10%
        </Button>
        <Button
          size="small"
          sx={{ textTransform: 'none', minWidth: 'auto', fontSize: '0.7rem' }}
          onClick={() => {
            const next = Math.round(db * 0.9);
            onPatchCampaign(c.campaign_id, {
              daily_budget: next,
              action: 'budget:-10%',
              beforeVal: db,
              afterVal: next,
            });
            setBudgetStr(String(next));
          }}
        >
          −10%
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function EverselfControlCampaignsTab({
  campaigns,
  perf,
  control,
  onPatchCampaign,
  onOpenAudit,
}: {
  campaigns: DemoCampaignRow[];
  perf: Map<string, CampaignPerformance>;
  control: ControlStateV2;
  onPatchCampaign: (
    id: string,
    patch: Partial<CampaignOverride> & { action: string; beforeVal: unknown; afterVal: unknown }
  ) => void;
  onOpenAudit: () => void;
}): React.JSX.Element {
  const exportCsv = () => {
    const headers = [
      'campaign_id',
      'status',
      'platform',
      'name',
      'city',
      'daily_budget',
      'spend',
      'leads',
      'booked',
      'cp_booked',
      'completed',
      'cp_completed',
    ];
    const lines = [headers.join(',')];
    for (const c of campaigns) {
      const o = control.overrides.campaigns[c.campaign_id];
      const p = perf.get(c.campaign_id);
      const status = o?.status ?? c.status;
      const db = o?.daily_budget ?? c.daily_budget;
      lines.push(
        [
          c.campaign_id,
          status,
          c.platform,
          `"${c.campaign_name.replace(/"/g, '""')}"`,
          c.city,
          db,
          p?.spend ?? 0,
          p?.leads ?? 0,
          p?.booked ?? 0,
          p?.cp_booked ?? '',
          p?.completed ?? 0,
          p?.cp_completed ?? '',
        ].join(',')
      );
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'everself-campaigns-demo.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button size="small" variant="outlined" onClick={exportCsv} sx={{ textTransform: 'none', color: '#93C5FD', borderColor: '#374151' }}>
          Export CSV
        </Button>
        <Button size="small" variant="outlined" onClick={onOpenAudit} sx={{ textTransform: 'none', color: '#93C5FD', borderColor: '#374151' }}>
          Audit log
        </Button>
      </Box>
      <TableContainer sx={{ border: '1px solid #27272F', borderRadius: 1, bgcolor: '#0A0A0A', maxHeight: 520 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#9CA3AF', bgcolor: '#0A0A0A' }}>Active</TableCell>
              <TableCell sx={{ color: '#9CA3AF', bgcolor: '#0A0A0A' }}>Platform</TableCell>
              <TableCell sx={{ color: '#9CA3AF', bgcolor: '#0A0A0A' }}>Campaign</TableCell>
              <TableCell sx={{ color: '#9CA3AF', bgcolor: '#0A0A0A' }}>City</TableCell>
              <TableCell sx={{ color: '#9CA3AF', bgcolor: '#0A0A0A' }}>Daily $</TableCell>
              <TableCell sx={{ color: '#9CA3AF', bgcolor: '#0A0A0A' }}>Spend</TableCell>
              <TableCell sx={{ color: '#9CA3AF', bgcolor: '#0A0A0A' }}>Leads</TableCell>
              <TableCell sx={{ color: '#9CA3AF', bgcolor: '#0A0A0A' }}>Booked</TableCell>
              <TableCell sx={{ color: '#9CA3AF', bgcolor: '#0A0A0A' }}>CP booked</TableCell>
              <TableCell sx={{ color: '#9CA3AF', bgcolor: '#0A0A0A' }}>Completed</TableCell>
              <TableCell sx={{ color: '#9CA3AF', bgcolor: '#0A0A0A' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {campaigns.map((c) => (
              <CampaignTableRow key={c.campaign_id} c={c} perf={perf} control={control} onPatchCampaign={onPatchCampaign} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

type TimelineItem =
  | { kind: 'change'; row: ChangeHistoryRow | DemoChangeEvent }
  | { kind: 'annotation'; row: ControlAnnotation };

export function EverselfControlPulseTab({
  history,
  control,
  spend,
  appointments,
  filters,
  alerts,
  onAddAnnotation,
  onAckAlert,
}: {
  history: ChangeHistoryRow[];
  control: ControlStateV2;
  spend: SpendDailyRow[];
  appointments: AppointmentRow[];
  filters: ControlFilterRange;
  alerts: ControlAlertItem[];
  onAddAnnotation: (a: Omit<ControlAnnotation, 'annotation_id'>) => void;
  onAckAlert: (id: string) => void;
}): React.JSX.Element {
  const [typeFilter, setTypeFilter] = React.useState<string>('all');
  const [platformFilter, setPlatformFilter] = React.useState<string>('all');
  const [highOnly, setHighOnly] = React.useState(false);
  const [impact, setImpact] = React.useState<ChangeHistoryRow | DemoChangeEvent | null>(null);
  const [annOpen, setAnnOpen] = React.useState(false);
  const [annScope, setAnnScope] = React.useState<'global' | 'city' | 'campaign'>('city');
  const [annEntity, setAnnEntity] = React.useState('');
  const [annLabel, setAnnLabel] = React.useState('');
  const [annDetails, setAnnDetails] = React.useState('');

  const merged: TimelineItem[] = React.useMemo(() => {
    const items: TimelineItem[] = history.map((row) => ({ kind: 'change', row }));
    for (const row of control.demo_changes) items.push({ kind: 'change', row });
    for (const row of control.annotations) items.push({ kind: 'annotation', row });
    items.sort((a, b) => {
      const ta = a.kind === 'annotation' ? a.row.ts : a.row.detected_at;
      const tb = b.kind === 'annotation' ? b.row.ts : b.row.detected_at;
      return tb.localeCompare(ta);
    });
    return items;
  }, [history, control.demo_changes, control.annotations]);

  const filtered = merged.filter((it) => {
    if (it.kind === 'annotation') {
      if (typeFilter !== 'all' && typeFilter !== 'ANNOTATION') return false;
      return true;
    }
    const ch = it.row;
    if (highOnly && ch.change_type !== 'BUDGET_CHANGE' && ch.change_type !== 'BID_STRATEGY_CHANGE') return false;
    if (typeFilter !== 'all' && ch.change_type !== typeFilter) return false;
    if (platformFilter !== 'all' && ch.platform !== platformFilter) return false;
    if (filters.cities.length > 0 && ch.city && !filters.cities.includes(ch.city)) return false;
    if (filters.campaignSearch.trim() && !(ch.campaign_name ?? '').toLowerCase().includes(filters.campaignSearch.trim().toLowerCase()))
      return false;
    return true;
  });

  const impactData = React.useMemo(() => {
    if (!impact) return null;
    return impactWindowSeries(
      impact.detected_at,
      spend,
      appointments,
      impact.campaign_id,
      impact.city
    );
  }, [impact, spend, appointments]);

  const sql = `SELECT
  DATE(detected_at) AS day,
  platform,
  change_type,
  COUNT(*) AS changes
FROM change_history
WHERE detected_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
GROUP BY 1,2,3
ORDER BY day DESC;`;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Button variant="outlined" size="small" onClick={() => setAnnOpen(true)} sx={{ textTransform: 'none', alignSelf: 'flex-start', borderColor: '#374151', color: '#93C5FD' }}>
        Add annotation (Demo)
      </Button>
      <Dialog open={annOpen} onClose={() => setAnnOpen(false)} PaperProps={{ sx: { bgcolor: '#111827', border: '1px solid #374151' } }}>
        <DialogTitle sx={{ color: '#F9FAFB' }}>Add annotation (Demo)</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 320 }}>
          <TextField
            select
            label="Scope"
            size="small"
            value={annScope}
            onChange={(e) => setAnnScope(e.target.value as 'global' | 'city' | 'campaign')}
            sx={everselfFieldSx}
            SelectProps={{ native: true }}
          >
            <option value="global">Global</option>
            <option value="city">City</option>
            <option value="campaign">Campaign</option>
          </TextField>
          <TextField
            label="Entity id (city name or campaign_id)"
            size="small"
            value={annEntity}
            onChange={(e) => setAnnEntity(e.target.value)}
            sx={everselfFieldSx}
            disabled={annScope === 'global'}
          />
          <TextField label="Label" size="small" value={annLabel} onChange={(e) => setAnnLabel(e.target.value)} sx={everselfFieldSx} />
          <TextField label="Details" size="small" multiline minRows={2} value={annDetails} onChange={(e) => setAnnDetails(e.target.value)} sx={everselfFieldSx} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnnOpen(false)} sx={{ color: '#9CA3AF', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onAddAnnotation({
                ts: new Date().toISOString(),
                scope: annScope,
                entity_id: annScope === 'global' ? 'all' : annEntity.trim() || '—',
                label: annLabel.trim() || 'Note',
                details: annDetails.trim(),
                author: 'user',
              });
              setAnnOpen(false);
              setAnnLabel('');
              setAnnDetails('');
              setAnnEntity('');
            }}
            sx={{ color: '#93C5FD', textTransform: 'none' }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
        <TextField
          select
          size="small"
          label="Change type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          sx={{ minWidth: 160, ...everselfFieldSx }}
          SelectProps={{ native: true }}
        >
          <option value="all">All</option>
          <option value="BUDGET_CHANGE">Budget</option>
          <option value="BID_STRATEGY_CHANGE">Bid</option>
          <option value="CREATIVE_UPDATE">Creative</option>
          <option value="STRUCTURE_CHANGE">Structure</option>
          <option value="ANNOTATION">Annotation</option>
        </TextField>
        <TextField
          select
          size="small"
          label="Platform"
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          sx={{ minWidth: 140, ...everselfFieldSx }}
          SelectProps={{ native: true }}
        >
          <option value="all">All</option>
          <option value="google_ads">Google</option>
          <option value="meta_ads">Meta</option>
        </TextField>
        <FormControlLabel
          control={<Checkbox checked={highOnly} onChange={(_, v) => setHighOnly(v)} sx={{ color: '#9CA3AF' }} />}
          label={<Typography sx={{ color: '#9CA3AF', fontSize: '0.85rem' }}>High impact only</Typography>}
        />
      </Box>

      <Typography sx={{ color: '#E5E7EB', fontWeight: 600 }}>Alerts (Demo)</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {alerts.map((a) => (
          <Card key={a.id} variant="outlined" sx={{ bgcolor: '#0A0A0A', borderColor: '#27272F' }}>
            <CardContent sx={{ py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Box>
                <Chip size="small" label={a.severity} sx={alertSeverityChipSx(a.severity)} />
                <Typography component="span" sx={{ color: '#E5E7EB', fontSize: '0.85rem' }}>
                  {a.summary}
                </Typography>
                <Typography sx={{ color: '#6B7280', fontSize: '0.7rem' }}>{a.ts.slice(0, 16).replace('T', ' ')}</Typography>
              </Box>
              <Button size="small" sx={{ textTransform: 'none' }} onClick={() => onAckAlert(a.id)} disabled={Boolean(control.acknowledged_alerts[a.id])}>
                {control.acknowledged_alerts[a.id] ? 'Acknowledged' : 'Acknowledge'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Typography sx={{ color: '#E5E7EB', fontWeight: 600 }}>Unified timeline</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {filtered.map((it, i) => {
          if (it.kind === 'annotation') {
            const r = it.row;
            return (
              <Card key={r.annotation_id} variant="outlined" sx={{ bgcolor: '#0A0A0A', borderColor: '#374151' }}>
                <CardContent sx={{ py: 1.25 }}>
                  <Typography sx={{ color: '#A78BFA', fontSize: '0.7rem', fontWeight: 700 }}>ANNOTATION</Typography>
                  <Typography sx={{ color: '#F9FAFB', fontWeight: 600 }}>{r.label}</Typography>
                  <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>{r.details}</Typography>
                  <Typography sx={{ color: '#6B7280', fontSize: '0.7rem' }}>{r.ts.slice(0, 16)} · {r.scope} · {r.entity_id}</Typography>
                </CardContent>
              </Card>
            );
          }
          const ch = it.row;
          return (
            <Card key={`${ch.change_id}-${i}`} variant="outlined" sx={{ bgcolor: '#0A0A0A', borderColor: '#27272F' }}>
              <CardContent sx={{ py: 1.25, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                <Box>
                  <Typography sx={{ color: '#9CA3AF', fontSize: '0.7rem' }}>{ch.detected_at.slice(0, 16).replace('T', ' ')}</Typography>
                  <Chip size="small" label={ch.change_type} sx={{ mr: 1, height: 22, fontSize: '0.65rem' }} />
                  <Typography component="span" sx={{ color: '#E5E7EB', fontSize: '0.85rem' }}>
                    {ch.campaign_name ?? ch.campaign_id} · {ch.field}: {String(ch.before)} → {String(ch.after)}
                  </Typography>
                  {ch.actor?.name ? (
                    <Typography sx={{ color: '#6B7280', fontSize: '0.75rem' }}>{ch.actor.name}</Typography>
                  ) : null}
                </Box>
                <Button size="small" sx={{ textTransform: 'none', color: '#93C5FD' }} onClick={() => setImpact(ch)}>
                  View impact
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      <Card variant="outlined" sx={{ bgcolor: '#0A0A0A', borderColor: '#27272F', p: 2 }}>
        <Typography sx={{ color: '#E5E7EB', fontWeight: 600, mb: 1 }}>Data (production)</Typography>
        <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem', mb: 1 }}>
          In production, change events and annotations land in BigQuery <code style={{ color: '#E5E7EB' }}>change_history</code>.
        </Typography>
        <Button
          size="small"
          startIcon={<CopyIcon size={16} />}
          onClick={() => void navigator.clipboard.writeText(sql)}
          sx={{ textTransform: 'none', color: '#93C5FD' }}
        >
          Copy sample SQL
        </Button>
      </Card>

      <Drawer anchor="right" open={Boolean(impact)} onClose={() => setImpact(null)} PaperProps={{ sx: { width: 400, bgcolor: '#0A0A0A', borderLeft: '1px solid #27272F', p: 2 } }}>
        {impact && impactData ? (
          <Box>
            <Typography sx={{ color: '#F9FAFB', fontWeight: 600, mb: 1 }}>Impact (Demo)</Typography>
            <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem', mb: 2 }}>
              {impactData.correlation === 'shift'
                ? 'Performance shifted after this change (correlation only — not causal proof).'
                : 'No immediate shift detected in CP booked (demo heuristic).'}
            </Typography>
            <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', mb: 0.5 }}>7d before change</Typography>
            <Box sx={{ height: 180, mb: 2 }}>
              <ResponsiveContainer>
                <LineChart data={[...impactData.before]} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid.stroke} />
                  <XAxis dataKey="date" tick={axis} />
                  <YAxis tick={axis} tickFormatter={(v) => fmtUsd0(Number(v))} />
                  <RTooltip
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }}
                    formatter={(value: string | number | undefined) => fmtUsd0(value == null ? NaN : Number(value))}
                  />
                  <Line type="monotone" dataKey="cp_booked" name="CP booked" stroke="#34D399" dot={false} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </Box>
            <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', mb: 0.5 }}>7d after change</Typography>
            <Box sx={{ height: 180 }}>
              <ResponsiveContainer>
                <LineChart data={[...impactData.after]} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid.stroke} />
                  <XAxis dataKey="date" tick={axis} />
                  <YAxis tick={axis} tickFormatter={(v) => fmtUsd0(Number(v))} />
                  <RTooltip
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }}
                    formatter={(value: string | number | undefined) => fmtUsd0(value == null ? NaN : Number(value))}
                  />
                  <Line type="monotone" dataKey="cp_booked" name="CP booked" stroke="#60A5FA" dot={false} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </Box>
            <Button size="small" onClick={() => setImpact(null)} sx={{ color: '#93C5FD', textTransform: 'none', mt: 2 }}>
              Close
            </Button>
          </Box>
        ) : null}
      </Drawer>
    </Box>
  );
}
