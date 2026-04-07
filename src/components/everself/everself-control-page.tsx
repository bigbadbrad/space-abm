'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import { Sliders as SlidersIcon } from '@phosphor-icons/react/dist/ssr/Sliders';

import {
  EverselfControlCampaignsTab,
  EverselfControlPacingTab,
  EverselfControlPulseTab,
} from '@/components/everself/everself-control-tabs';
import { useEverselfControlState } from '@/components/everself/use-everself-control-state';
import { everselfFieldSx } from '@/components/everself/everself-field-sx';
import {
  buildControlAlerts,
  computeCampaignPerformance,
  type ControlFilterRange,
} from '@/lib/everself/everself-control-metrics';
import { resetControlStateV2 } from '@/lib/everself/everself-demo-control-state';
import type {
  CampaignOverride,
  ChangeHistoryRow,
  ControlAnnotation,
  DemoCampaignRow,
  DemoChangeEvent,
  SpendDailyRow,
} from '@/lib/everself/everself-control-types';
import type { AppointmentRow, LeadRow } from '@/lib/everself/types';

export function EverselfControlPage(): React.JSX.Element {
  const [tab, setTab] = React.useState(0);
  const [control, refresh, setControl] = useEverselfControlState();
  const [resetOpen, setResetOpen] = React.useState(false);
  const [auditOpen, setAuditOpen] = React.useState(false);
  const [snack, setSnack] = React.useState<string | null>(null);

  const [start, setStart] = React.useState<Dayjs>(() => dayjs().subtract(29, 'day').startOf('day'));
  const [end, setEnd] = React.useState<Dayjs>(() => dayjs().startOf('day'));
  const [cities, setCities] = React.useState<string[]>([]);
  const [channels, setChannels] = React.useState<('google' | 'meta')[]>([]);
  const [campaignSearch, setCampaignSearch] = React.useState('');
  const [bookingGroup, setBookingGroup] = React.useState<'booked' | 'lead'>('booked');

  const [rawCampaigns, setRawCampaigns] = React.useState<DemoCampaignRow[] | null>(null);
  const [rawHistory, setRawHistory] = React.useState<ChangeHistoryRow[] | null>(null);
  const [rawSpend, setRawSpend] = React.useState<SpendDailyRow[] | null>(null);
  const [rawLeads, setRawLeads] = React.useState<LeadRow[] | null>(null);
  const [rawAppts, setRawAppts] = React.useState<AppointmentRow[] | null>(null);
  const [loadErr, setLoadErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let c = false;
    (async () => {
      try {
        const [cm, ch, sp, ld, ap] = await Promise.all([
          fetch('/demo/everself/campaigns.json').then((r) => r.json()),
          fetch('/demo/everself/change_history.json').then((r) => r.json()),
          fetch('/demo/everself/spend_daily.json').then((r) => r.json()),
          fetch('/demo/everself/leads.json').then((r) => r.json()),
          fetch('/demo/everself/appointments.json').then((r) => r.json()),
        ]);
        if (!c) {
          setRawCampaigns(cm as DemoCampaignRow[]);
          setRawHistory(ch as ChangeHistoryRow[]);
          setRawSpend(sp as SpendDailyRow[]);
          setRawLeads(ld as LeadRow[]);
          setRawAppts(ap as AppointmentRow[]);
        }
      } catch (e) {
        if (!c) setLoadErr(e instanceof Error ? e.message : 'Failed to load');
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const cityOptions = React.useMemo(() => {
    const s = new Set((rawSpend ?? []).map((r) => r.city));
    return Array.from(s).sort();
  }, [rawSpend]);

  const channelSelectValue = React.useMemo(() => {
    if (channels.length === 0) return 'all';
    if (channels.length === 2) return 'google,meta';
    return channels[0] ?? 'all';
  }, [channels]);

  const filters: ControlFilterRange = React.useMemo(
    () => ({
      start,
      end,
      cities,
      channels,
      campaignSearch,
      bookingGroup,
    }),
    [start, end, cities, channels, campaignSearch, bookingGroup]
  );

  const perf = React.useMemo(() => {
    if (!rawCampaigns || !rawSpend || !rawLeads || !rawAppts) return new Map();
    return computeCampaignPerformance(rawCampaigns, rawSpend, rawLeads, rawAppts, filters);
  }, [rawCampaigns, rawSpend, rawLeads, rawAppts, filters]);

  const spendByCampaign = React.useMemo(() => {
    const m = new Map<string, number>();
    if (!rawSpend) return m;
    for (const r of rawSpend) {
      if (r.date < filters.start.format('YYYY-MM-DD') || r.date > filters.end.format('YYYY-MM-DD')) continue;
      m.set(r.campaign_id, (m.get(r.campaign_id) ?? 0) + r.spend);
    }
    return m;
  }, [rawSpend, filters.start, filters.end]);

  const alerts = React.useMemo(() => {
    if (!rawHistory) return [];
    return buildControlAlerts(rawHistory, control.demo_changes, spendByCampaign);
  }, [rawHistory, control.demo_changes, spendByCampaign]);

  const patchCity = React.useCallback(
    (city: string, patch: { weekly_budget?: number; channel_split?: { google: number; meta: number }; notes?: string }) => {
      const now = new Date().toISOString();
      setControl({
        ...control,
        last_updated_at: now,
        overrides: {
          ...control.overrides,
          city_budgets: {
            ...control.overrides.city_budgets,
            [city]: {
              ...control.overrides.city_budgets[city],
              ...patch,
              updated_at: now,
            },
          },
        },
        change_log: [
          ...control.change_log,
          {
            id: `log_${Date.now()}`,
            ts: now,
            actor: 'user',
            scope: 'city_budget',
            entity_id: city,
            action: 'city_budget_edit',
            reason: 'Demo pacing control',
            before: control.overrides.city_budgets[city] ?? null,
            after: { ...control.overrides.city_budgets[city], ...patch },
          },
        ],
      });
    },
    [control, setControl]
  );

  const patchCampaign = React.useCallback(
    (
      id: string,
      patch: Partial<CampaignOverride> & { action: string; beforeVal: unknown; afterVal: unknown }
    ) => {
      const { action, beforeVal, afterVal, ...rest } = patch;
      const now = new Date().toISOString();
      const camp = rawCampaigns?.find((c) => c.campaign_id === id);
      const nextOverrides: CampaignOverride = {
        ...control.overrides.campaigns[id],
        ...rest,
        updated_at: now,
      };

      let demoChanges = control.demo_changes;
      if (
        camp &&
        (rest.daily_budget != null || rest.status != null) &&
        (rest.daily_budget !== (control.overrides.campaigns[id]?.daily_budget ?? camp.daily_budget) ||
          rest.status !== (control.overrides.campaigns[id]?.status ?? camp.status))
      ) {
        const ev: DemoChangeEvent = {
          change_id: `chg_demo_${Date.now()}`,
          platform: camp.platform,
          channel: camp.channel,
          city: camp.city,
          campaign_id: id,
          campaign_name: camp.campaign_name,
          change_type: rest.daily_budget != null ? 'BUDGET_CHANGE' : 'STRUCTURE_CHANGE',
          object_type: 'CAMPAIGN',
          object_id: id,
          field: rest.daily_budget != null ? 'daily_budget' : 'status',
          before: beforeVal as number | string,
          after: afterVal as number | string,
          actor: { type: 'user', name: 'Demo user', email: 'you@demo.local' },
          detected_at: now,
          source: 'demo',
        };
        demoChanges = [...control.demo_changes, ev];
      }

      setControl({
        ...control,
        last_updated_at: now,
        demo_changes: demoChanges,
        overrides: {
          ...control.overrides,
          campaigns: {
            ...control.overrides.campaigns,
            [id]: nextOverrides,
          },
        },
        change_log: [
          ...control.change_log,
          {
            id: `log_${Date.now()}`,
            ts: now,
            actor: 'user',
            scope: 'campaign',
            entity_id: id,
            action,
            reason: 'Demo campaign control',
            before: beforeVal,
            after: afterVal,
          },
        ],
      });
    },
    [control, rawCampaigns, setControl]
  );

  const addAnnotation = React.useCallback(
    (a: Omit<ControlAnnotation, 'annotation_id'>) => {
      const now = new Date().toISOString();
      const ann: ControlAnnotation = { ...a, annotation_id: `ann_${Date.now()}` };
      setControl({
        ...control,
        last_updated_at: now,
        annotations: [...control.annotations, ann],
        change_log: [
          ...control.change_log,
          {
            id: `log_${Date.now()}`,
            ts: now,
            actor: 'user',
            scope: 'annotation',
            entity_id: ann.entity_id,
            action: 'add_annotation',
            reason: ann.label,
            before: null,
            after: ann,
          },
        ],
      });
    },
    [control, setControl]
  );

  const ackAlert = React.useCallback(
    (id: string) => {
      const now = new Date().toISOString();
      setControl({
        ...control,
        last_updated_at: now,
        acknowledged_alerts: { ...control.acknowledged_alerts, [id]: now },
      });
    },
    [control, setControl]
  );

  const runRulesRecommend = React.useCallback(() => {
    setSnack('Rules (Recommend): pause Meta in Denver if CP booked > $400; shift 5% budget LA→SF (Demo).');
  }, []);

  const runRulesApply = React.useCallback(() => {
    const now = new Date().toISOString();
    setControl({
      ...control,
      last_updated_at: now,
      last_rule_run_at: now,
      change_log: [
        ...control.change_log,
        {
          id: `log_rule_${Date.now()}`,
          ts: now,
          actor: 'auto',
          scope: 'campaign',
          entity_id: 'rules_engine',
          action: 'apply_demo',
          reason: 'Simulated rule application',
          before: null,
          after: { rules_fired: 2 },
        },
      ],
    });
    setSnack('Rules (Apply Demo): logged a simulated apply — no live API calls.');
  }, [control, setControl]);

  const onReset = React.useCallback(() => {
    resetControlStateV2();
    refresh();
    setResetOpen(false);
  }, [refresh]);

  if (loadErr) {
    return (
      <Box sx={{ p: 3, bgcolor: '#050505', minHeight: '100vh' }}>
        <Typography sx={{ color: '#F87171' }}>{loadErr}</Typography>
      </Box>
    );
  }

  if (!rawCampaigns || !rawHistory || !rawSpend || !rawLeads || !rawAppts) {
    return (
      <Box sx={{ p: 3, bgcolor: '#050505', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ color: '#9CA3AF' }}>Loading…</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3 }}>
      <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
            <SlidersIcon size={22} style={{ color: '#FFFFFF' }} />
            <Typography sx={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600 }}>Ad Campaigns</Typography>
            <Chip label="Demo" size="small" sx={{ bgcolor: '#1D4ED8', color: '#F9FAFB', fontWeight: 600 }} />
          </Box>
          <Typography sx={{ color: '#9CA3AF', fontSize: '0.8125rem', mt: 0.5 }}>
            Last updated: {control.last_updated_at.slice(0, 19).replace('T', ' ')} UTC
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          <Button size="small" variant="outlined" onClick={runRulesRecommend} sx={{ textTransform: 'none', borderColor: '#374151', color: '#93C5FD' }}>
            Run rules (Recommend)
          </Button>
          <Button size="small" variant="outlined" onClick={runRulesApply} sx={{ textTransform: 'none', borderColor: '#374151', color: '#93C5FD' }}>
            Run rules (Apply Demo)
          </Button>
          <Button size="small" variant="outlined" onClick={() => setResetOpen(true)} sx={{ textTransform: 'none', borderColor: '#7F1D1D', color: '#FCA5A5' }}>
            Reset demo state
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 1,
          border: '1px solid #27272F',
          bgcolor: '#0A0A0A',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Typography sx={{ color: '#E5E7EB', fontSize: '0.8rem', fontWeight: 600 }}>Filters</Typography>
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
          <FormControl size="small" sx={{ minWidth: 220, ...everselfFieldSx }}>
            <InputLabel id="ctrl-cities">Cities</InputLabel>
            <Select<string[]>
              labelId="ctrl-cities"
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
            <InputLabel id="ctrl-ch">Channels</InputLabel>
            <Select
              labelId="ctrl-ch"
              value={channelSelectValue}
              label="Channels"
              onChange={(e) => {
                const v = e.target.value as string;
                if (v === 'all') setChannels([]);
                else if (v === 'google') setChannels(['google']);
                else if (v === 'meta') setChannels(['meta']);
                else setChannels(['google', 'meta']);
              }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="google">Google</MenuItem>
              <MenuItem value="meta">Meta</MenuItem>
              <MenuItem value="google,meta">Both</MenuItem>
            </Select>
          </FormControl>
          <TextField
            size="small"
            label="Campaign search"
            value={campaignSearch}
            onChange={(e) => setCampaignSearch(e.target.value)}
            sx={{ minWidth: 180, ...everselfFieldSx }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem' }}>Cohort</Typography>
            <ToggleButtonGroup
              size="small"
              value={bookingGroup}
              exclusive
              onChange={(_, v) => v && setBookingGroup(v)}
              sx={{
                '& .MuiToggleButton-root': { color: '#9CA3AF', borderColor: '#374151', textTransform: 'none' },
                '& .Mui-selected': { bgcolor: '#1D4ED8 !important', color: '#F9FAFB !important' },
              }}
            >
              <ToggleButton value="booked">Booked date</ToggleButton>
              <ToggleButton value="lead">Lead date</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: '#27272F' }}>
        <Tab label="Pacing" sx={{ textTransform: 'none', color: '#9CA3AF' }} />
        <Tab label="Campaigns" sx={{ textTransform: 'none', color: '#9CA3AF' }} />
        <Tab label="Pulse" sx={{ textTransform: 'none', color: '#9CA3AF' }} />
      </Tabs>

      <Box sx={{ display: tab === 0 ? 'block' : 'none' }}>
        <EverselfControlPacingTab
          cities={cityOptions}
          spend={rawSpend}
          leads={rawLeads}
          appointments={rawAppts}
          filters={filters}
          control={control}
          onPatchCity={patchCity}
        />
      </Box>
      <Box sx={{ display: tab === 1 ? 'block' : 'none' }}>
        <EverselfControlCampaignsTab
          campaigns={rawCampaigns}
          perf={perf}
          control={control}
          onPatchCampaign={patchCampaign}
          onOpenAudit={() => setAuditOpen(true)}
        />
      </Box>
      <Box sx={{ display: tab === 2 ? 'block' : 'none' }}>
        <EverselfControlPulseTab
          history={rawHistory}
          control={control}
          spend={rawSpend}
          appointments={rawAppts}
          filters={filters}
          alerts={alerts}
          onAddAnnotation={addAnnotation}
          onAckAlert={ackAlert}
        />
      </Box>

      <Dialog open={resetOpen} onClose={() => setResetOpen(false)}>
        <DialogTitle>Reset demo state?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#9CA3AF' }}>This clears Everself control local storage for this browser only.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetOpen(false)}>Cancel</Button>
          <Button onClick={onReset} color="warning" variant="contained">
            Reset
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={auditOpen} onClose={() => setAuditOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { bgcolor: '#111827' } }}>
        <DialogTitle sx={{ color: '#F9FAFB' }}>Audit log (Demo)</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 400, overflow: 'auto' }}>
            {[...control.change_log].reverse().map((e) => (
              <Typography key={e.id} sx={{ color: '#E5E7EB', fontSize: '0.8rem', fontFamily: 'ui-monospace, monospace' }}>
                {e.ts.slice(0, 19)} · {e.actor} · {e.scope} · {e.action} · {e.entity_id}
              </Typography>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAuditOpen(false)} sx={{ color: '#93C5FD' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {snack ? (
        <Typography sx={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', bgcolor: '#111827', border: '1px solid #374151', color: '#F9FAFB', px: 2, py: 1, borderRadius: 1, zIndex: 1400 }} onClick={() => setSnack(null)}>
          {snack}
        </Typography>
      ) : null}
    </Box>
  );
}
