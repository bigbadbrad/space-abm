'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import Drawer from '@mui/material/Drawer';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Tooltip from '@mui/material/Tooltip';
import Checkbox from '@mui/material/Checkbox';
import { RocketLaunch as RocketLaunchIcon } from '@phosphor-icons/react/dist/ssr/RocketLaunch';
import { CheckCircle as CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { CloudArrowUp as CloudArrowUpIcon } from '@phosphor-icons/react/dist/ssr/CloudArrowUp';
import dayjs from 'dayjs';
import type { ABMMissionTask } from '@/lib/abm/client';

import { paths } from '@/paths';
import { abmApi, type ABMMission, type ABMMissionDetailResponse } from '@/lib/abm/client';
import { formatLaneDisplayName, LANE_OPTIONS } from '@/components/abm/layout/config';

const ACTIVE_STAGES = ['new', 'qualified', 'solutioning', 'proposal', 'negotiation'];
const CLOSED_STAGES = ['won', 'lost', 'on_hold'];
/** Ordered pipeline: can only move forward (or to close). Reopening from closed goes to qualified. */
const STAGE_ORDER = [...ACTIVE_STAGES, ...CLOSED_STAGES];

function allowedNextStages(currentStage: string): string[] {
  const cur = currentStage || 'new';
  if (CLOSED_STAGES.includes(cur)) {
    return [cur, 'qualified'];
  }
  const idx = STAGE_ORDER.indexOf(cur);
  if (idx === -1) return [cur, ...ACTIVE_STAGES, ...CLOSED_STAGES];
  return STAGE_ORDER.slice(idx);
}

/** Stages that allow "Sync to Salesforce" (must match backend isEligibleForSalesforcePush) */
const SALESFORCE_ELIGIBLE_STAGES = ['qualified', 'solutioning', 'proposal', 'negotiation'];

function salesforceEligibleFromDetail(detail: ABMMissionDetailResponse | null): { eligible: boolean; reason: string } {
  if (!detail?.mission) return { eligible: false, reason: 'Mission required' };
  const m = detail.mission;
  const lr = m.leadRequest as { organization_name?: string; organization_website?: string; work_email?: string } | undefined;
  const contacts = m.contacts ?? [];
  if (!m.title) return { eligible: false, reason: 'Mission name/title required' };
  if (!SALESFORCE_ELIGIBLE_STAGES.includes(m.stage ?? '')) {
    return { eligible: false, reason: 'Stage must be qualified, solutioning, proposal, or negotiation' };
  }
  const hasAccount = !!m.prospect_company_id || !!(lr && (lr.organization_website || lr.organization_name));
  if (!hasAccount) return { eligible: false, reason: 'Linked account or lead request organization required' };
  const hasContact = !!m.primary_contact_id || contacts.length > 0 || !!(lr && lr.work_email);
  if (!hasContact) return { eligible: false, reason: 'Linked contact or lead request work email required' };
  return { eligible: true, reason: '' };
}

function salesforceEligibleFromListMission(m: ABMMission): { eligible: boolean; reason: string } {
  if (!m.stage || !SALESFORCE_ELIGIBLE_STAGES.includes(m.stage)) {
    return { eligible: false, reason: 'Stage must be qualified, solutioning, proposal, or negotiation' };
  }
  return { eligible: true, reason: '' };
}

export default function ABMMissionsPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('id');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [missions, setMissions] = React.useState<ABMMission[]>([]);
  const [total, setTotal] = React.useState(0);
  const [detail, setDetail] = React.useState<ABMMissionDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [summary, setSummary] = React.useState<{ active: number; due_soon: number; stale: number; hot: number } | null>(null);
  const [filters, setFilters] = React.useState({
    stage: '',
    lane: '',
    owner: '',
    search: '',
    due_soon: '',
    stale: '',
    hot: '',
    sort: 'next_step_due_at_asc',
  });
  const [editNextStep, setEditNextStep] = React.useState('');
  const [editNextStepDue, setEditNextStepDue] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [noteText, setNoteText] = React.useState('');
  const [addingNote, setAddingNote] = React.useState(false);
  const [aiBriefLoading, setAiBriefLoading] = React.useState(false);
  const [aiBriefDrawerOpen, setAiBriefDrawerOpen] = React.useState(false);
  const [aiBriefContent, setAiBriefContent] = React.useState<string | null>(null);
  const [detailTab, setDetailTab] = React.useState(0);
  const [missionTasks, setMissionTasks] = React.useState<ABMMissionTask[]>([]);
  const [missionActivity, setMissionActivity] = React.useState<{ items: { id: string; type: string; body: string | null; created_at: string; createdBy?: { preferred_name?: string; name?: string } }[] } | null>(null);
  const [pushSfLoading, setPushSfLoading] = React.useState(false);
  const [pushSfStatus, setPushSfStatus] = React.useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [pushSfError, setPushSfError] = React.useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = React.useState('');
  const [newTaskDue, setNewTaskDue] = React.useState('');
  const [addingTask, setAddingTask] = React.useState(false);

  const fetchMissions = React.useCallback(() => {
    const params: Record<string, string | number> = { limit: 50, page: 1, sort: filters.sort };
    if (filters.stage) params.stage = filters.stage;
    if (filters.lane && filters.lane !== 'All') params.lane = filters.lane;
    if (filters.owner) params.owner = filters.owner;
    if (filters.search) params.search = filters.search;
    if (filters.due_soon === 'true') params.due_soon = 'true';
    if (filters.stale === 'true') params.stale = 'true';
    if (filters.hot === 'true') params.hot = 'true';
    setLoading(true);
    abmApi.getMissions(params).then((res) => {
      if (res.error) setError(res.error);
      else if (res.data) {
        setMissions(res.data.missions || []);
        setTotal(res.data.total ?? 0);
      }
      setLoading(false);
    });
  }, [filters]);

  React.useEffect(() => {
    abmApi.getMissionsSummary({ range: '7d' }).then((res) => {
      if (res.data) setSummary(res.data);
    });
  }, []);

  React.useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  // Auto-open last created mission when none selected
  React.useEffect(() => {
    if (selectedId || missions.length === 0) return;
    const lastCreated = [...missions].sort((a, b) => {
      const aAt = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bAt = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bAt - aAt;
    })[0];
    if (lastCreated) router.replace(`${paths.abm.missions}?id=${lastCreated.id}`);
  }, [missions, selectedId, router]);

  React.useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    abmApi.getMission(selectedId).then((res) => {
      if (cancelled) return;
      if (res.data) {
        setDetail(res.data);
        setEditNextStep(res.data.mission?.next_step || '');
        setEditNextStepDue(res.data.mission?.next_step_due_at ? res.data.mission.next_step_due_at.slice(0, 16) : '');
      }
      setDetailLoading(false);
    });
    return () => { cancelled = true; };
  }, [selectedId]);

  React.useEffect(() => {
    if (detailTab !== 2 || !selectedId) return;
    abmApi.getMissionTasks(selectedId).then((res) => {
      if (res.data?.items) setMissionTasks(res.data.items);
    });
  }, [detailTab, selectedId, detail?.mission?.tasks]);

  React.useEffect(() => {
    if (detailTab !== 3 || !selectedId) return;
    abmApi.getMissionActivity(selectedId, { limit: 30 }).then((res) => {
      if (res.data?.items) setMissionActivity({ items: res.data.items });
    });
  }, [detailTab, selectedId]);

  const handleSaveNextStep = () => {
    if (!selectedId || saving) return;
    setSaving(true);
    abmApi
      .patchMission(selectedId, {
        next_step: editNextStep,
        next_step_due_at: editNextStepDue ? new Date(editNextStepDue).toISOString() : undefined,
      })
      .then((res) => {
        setSaving(false);
        if (res.data && detail) {
          setDetail({ ...detail, mission: { ...detail.mission, ...res.data } });
        }
      });
  };

  const handleGenerateAiBrief = () => {
    if (!selectedId || aiBriefLoading) return;
    setAiBriefLoading(true);
    setAiBriefContent(null);
    setAiBriefDrawerOpen(true);
    abmApi.postMissionAiBrief(selectedId).then((res) => {
      setAiBriefLoading(false);
      if (res.data?.summary_md) {
        setAiBriefContent(res.data.summary_md);
        abmApi.getMission(selectedId).then((r) => r.data && setDetail(r.data));
      }
    });
  };

  const handleStageChange = (newStage: string) => {
    if (!selectedId || !detail || newStage === (detail.mission?.stage ?? '')) return;
    abmApi.patchMission(selectedId, { stage: newStage }).then((res) => {
      if (res.data && detail) {
        setDetail({ ...detail, mission: { ...detail.mission, ...res.data } });
        fetchMissions();
        abmApi.getMissionsSummary({ range: '7d' }).then((s) => s.data && setSummary(s.data));
      }
    });
  };

  const handleReopenMission = () => {
    if (!selectedId || !detail) return;
    handleStageChange('qualified');
    setFilters((f) => ({ ...f, stage: '' }));
  };

  const handleAddNote = () => {
    if (!selectedId || !noteText.trim() || addingNote) return;
    setAddingNote(true);
    abmApi.postMissionActivity(selectedId, { body: noteText.trim() }).then((res) => {
      setAddingNote(false);
      setNoteText('');
      if (!res.error && detail) {
        abmApi.getMission(selectedId).then((r) => {
          if (r.data) setDetail(r.data);
        });
      }
    });
  };

  const handleCloseMission = (outcome: 'won' | 'lost' | 'on_hold') => {
    if (!selectedId) return;
    const reason = prompt(`Reason (optional):`);
    if (reason === null) return; // User clicked Cancel
    abmApi.closeMission(selectedId, { outcome, reason: reason || undefined }).then((res) => {
      if (res.data) {
        setFilters((f) => ({ ...f, stage: outcome }));
        abmApi.getMission(selectedId).then((r) => r.data && setDetail(r.data));
        abmApi.getMissionsSummary({ range: '7d' }).then((s) => s.data && setSummary(s.data));
      }
    });
  };

  const setSelectedId = (id: string | null) => {
    if (id) router.push(`${paths.abm.missions}?id=${id}`);
    else router.push(paths.abm.missions);
  };

  const handlePushToSalesforce = (missionId?: string | number | { id?: string } | null) => {
    const raw = missionId ?? selectedId;
    const id = raw == null ? null : typeof raw === 'string' ? raw : typeof raw === 'number' ? String(raw) : (raw && typeof (raw as { id?: string })?.id === 'string' ? (raw as { id: string }).id : null);
    if (!id || id === '[object Object]' || pushSfLoading) return;
    setPushSfLoading(true);
    setPushSfError(null);
    setPushSfStatus('syncing');
    abmApi.postPushToSalesforce(id)
      .then((r) => {
        setPushSfLoading(false);
        if (r.error) {
          setPushSfStatus('error');
          setPushSfError(r.error);
          setTimeout(() => { setPushSfStatus('idle'); setPushSfError(null); }, 5000);
        } else if (r.data?.success === false) {
          setPushSfStatus('error');
          setPushSfError(r.data?.error || r.data?.message || 'Sync failed');
          setTimeout(() => { setPushSfStatus('idle'); setPushSfError(null); }, 5000);
        } else {
          setPushSfStatus('success');
          abmApi.getMission(id).then((d) => d.data && setDetail(d.data));
          fetchMissions();
          setTimeout(() => setPushSfStatus('idle'), 2200);
        }
      })
      .catch((err) => {
        setPushSfLoading(false);
        setPushSfStatus('error');
        setPushSfError(err?.message || 'Request failed');
        setTimeout(() => { setPushSfStatus('idle'); setPushSfError(null); }, 5000);
      });
  };

  const handleAddTask = () => {
    if (!selectedId || !newTaskTitle.trim() || addingTask) return;
    setAddingTask(true);
    abmApi.postMissionTask(selectedId, { title: newTaskTitle.trim(), due_at: newTaskDue || undefined }).then((r) => {
      setAddingTask(false);
      setNewTaskTitle('');
      setNewTaskDue('');
      if (r.data) {
        setMissionTasks((prev) => [r.data!, ...prev]);
        abmApi.getMission(selectedId).then((d) => d.data && setDetail(d.data));
        fetchMissions();
      }
    });
  };

  const handleToggleTask = (task: ABMMissionTask) => {
    if (!selectedId) return;
    const next = task.status === 'done' ? 'open' : 'done';
    abmApi.patchMissionTask(selectedId, task.id, { status: next }).then((r) => {
      if (r.data) {
        setMissionTasks((prev) => prev.map((t) => (t.id === task.id ? r.data! : t)));
        abmApi.getMission(selectedId).then((d) => d.data && setDetail(d.data));
        fetchMissions();
      }
    });
  };

  return (
    <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {error && <Typography sx={{ color: '#EF4444', mb: 1 }}>{error}</Typography>}

      {/* Summary cards */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {summary && (
          <>
            <Card
              sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', cursor: 'pointer', minWidth: 140 }}
              onClick={() => setFilters((f) => ({ ...f, stage: '', due_soon: '', stale: '', hot: '' }))}
            >
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase' }}>Active</Typography>
                <Typography sx={{ color: '#FFFFFF', fontSize: '1.5rem', fontWeight: 600 }}>{summary.active}</Typography>
              </CardContent>
            </Card>
            <Card
              sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', cursor: 'pointer', minWidth: 140 }}
              onClick={() => setFilters((f) => ({ ...f, stage: '', due_soon: '', stale: '', hot: 'true' }))}
            >
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase' }}>Hot</Typography>
                <Typography sx={{ color: '#10B981', fontSize: '1.5rem', fontWeight: 600 }}>{summary.hot}</Typography>
              </CardContent>
            </Card>
            <Card
              sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', cursor: 'pointer', minWidth: 140 }}
              onClick={() => setFilters((f) => ({ ...f, due_soon: 'true', stale: '', hot: '' }))}
            >
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase' }}>Due Soon</Typography>
                <Typography sx={{ color: '#F59E0B', fontSize: '1.5rem', fontWeight: 600 }}>{summary.due_soon}</Typography>
              </CardContent>
            </Card>
            <Card
              sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', cursor: 'pointer', minWidth: 140 }}
              onClick={() => setFilters((f) => ({ ...f, stale: 'true', due_soon: '', hot: '' }))}
            >
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase' }}>Stale</Typography>
                <Typography sx={{ color: '#EF4444', fontSize: '1.5rem', fontWeight: 600 }}>{summary.stale}</Typography>
              </CardContent>
            </Card>
          </>
        )}
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search title, account..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && fetchMissions()}
          sx={{ minWidth: 180, '& .MuiInputBase-root': { backgroundColor: '#0A0A0A', color: '#fff' } }}
        />
        <Chip
          label="Active"
          size="small"
          onClick={() => setFilters((f) => ({ ...f, stage: '' }))}
          sx={{ cursor: 'pointer', bgcolor: filters.stage === '' ? '#3b82f633' : '#262626', color: filters.stage === '' ? '#3b82f6' : '#9CA3AF' }}
        />
        <Chip
          label="Closed"
          size="small"
          onClick={() => setFilters((f) => ({ ...f, stage: 'closed' }))}
          sx={{ cursor: 'pointer', bgcolor: filters.stage === 'closed' ? '#3b82f633' : '#262626', color: filters.stage === 'closed' ? '#3b82f6' : '#9CA3AF' }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel sx={{ color: '#9CA3AF' }}>Lane</InputLabel>
          <Select
            value={filters.lane}
            label="Lane"
            onChange={(e) => setFilters((f) => ({ ...f, lane: e.target.value }))}
            sx={{ backgroundColor: '#0A0A0A', color: '#fff' }}
          >
            {LANE_OPTIONS.map((l) => (
              <MenuItem key={l} value={l === 'All' ? '' : l}>{l}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel sx={{ color: '#9CA3AF' }}>Owner</InputLabel>
          <Select
            value={filters.owner}
            label="Owner"
            onChange={(e) => setFilters((f) => ({ ...f, owner: e.target.value }))}
            sx={{ backgroundColor: '#0A0A0A', color: '#fff' }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="me">Me</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel sx={{ color: '#9CA3AF' }}>Sort</InputLabel>
          <Select
            value={filters.sort}
            label="Sort"
            onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
            sx={{ backgroundColor: '#0A0A0A', color: '#fff' }}
          >
            <MenuItem value="next_step_due_at_asc">Due date</MenuItem>
            <MenuItem value="last_activity_at_desc">Last activity</MenuItem>
            <MenuItem value="priority_desc">Priority</MenuItem>
          </Select>
        </FormControl>
        <Chip
          label="Due soon"
          size="small"
          onClick={() => setFilters((f) => ({ ...f, due_soon: f.due_soon ? '' : 'true', stale: '', hot: '' }))}
          sx={{ cursor: 'pointer', bgcolor: filters.due_soon ? '#F59E0B33' : '#262626', color: filters.due_soon ? '#F59E0B' : '#9CA3AF' }}
        />
        <Chip
          label="Stale"
          size="small"
          onClick={() => setFilters((f) => ({ ...f, stale: f.stale ? '' : 'true', due_soon: '', hot: '' }))}
          sx={{ cursor: 'pointer', bgcolor: filters.stale ? '#EF444433' : '#262626', color: filters.stale ? '#EF4444' : '#9CA3AF' }}
        />
        <Chip
          label="Hot"
          size="small"
          onClick={() => setFilters((f) => ({ ...f, hot: f.hot ? '' : 'true', due_soon: '', stale: '' }))}
          sx={{ cursor: 'pointer', bgcolor: filters.hot ? '#10B98133' : '#262626', color: filters.hot ? '#10B981' : '#9CA3AF' }}
        />
        <Button variant="outlined" size="small" onClick={fetchMissions} sx={{ borderColor: '#262626', color: '#3b82f6' }}>
          Apply
        </Button>
      </Box>

      {/* Two-pane layout */}
      <Box sx={{ display: 'flex', gap: 2, flex: 1, minHeight: 0, flexDirection: { xs: 'column', lg: 'row' } }}>
        <Box sx={{ flex: '1 1 50%', minWidth: 0 }}>
          <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2 }}>
                <RocketLaunchIcon size={18} style={{ color: '#FFFFFF' }} />
                <Typography sx={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600 }}>Missions</Typography>
              </Box>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress sx={{ color: '#9CA3AF' }} />
                </Box>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Stage</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Priority</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Title</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Account</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Lane</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Next Task Due</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Open</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Source</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>SF</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {missions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} sx={{ color: '#9CA3AF', borderColor: '#262626', textAlign: 'center', py: 3 }}>No missions</TableCell>
                      </TableRow>
                    ) : (
                      missions.map((m) => {
                        const nextTaskDue = m.next_task_due_at;
                        const isOverdue = nextTaskDue && new Date(nextTaskDue) < new Date();
                        return (
                          <TableRow
                            key={m.id}
                            sx={{
                              bgcolor: selectedId === String(m.id) ? 'rgba(59,130,246,0.1)' : 'transparent',
                              cursor: 'pointer',
                              '&:hover': { bgcolor: selectedId === String(m.id) ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)' },
                            }}
                            onClick={() => setSelectedId(m.id)}
                          >
                            <TableCell sx={{ borderColor: '#262626' }}>
                              <Chip label={m.stage || 'new'} size="small" sx={{ fontFamily: 'monospace', bgcolor: '#262626', color: '#fff', fontSize: '0.7rem' }} />
                            </TableCell>
                            <TableCell sx={{ borderColor: '#262626' }}>
                              <Chip label={m.priority || 'medium'} size="small" sx={{ bgcolor: '#262626', color: '#fff', fontSize: '0.65rem' }} />
                            </TableCell>
                            <TableCell sx={{ color: '#FFFFFF', borderColor: '#262626', fontSize: '0.8rem', maxWidth: 160 }}>{formatLaneDisplayName(m.title)}</TableCell>
                            <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem' }}>{m.prospectCompany?.domain || '—'}</TableCell>
                            <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem' }}>{formatLaneDisplayName(m.service_lane)}</TableCell>
                            <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                              {nextTaskDue ? (isOverdue ? 'Overdue' : dayjs(nextTaskDue).format('MM/DD')) : '—'}
                            </TableCell>
                            <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem' }}>{m.open_tasks_count ?? 0}</TableCell>
                            <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem' }}>{m.lead_request_id ? 'Lead' : m.source || 'Manual'}</TableCell>
                            <TableCell sx={{ borderColor: '#262626' }}>
                              <Chip
                                label={m.salesforce_sync_status || 'Not synced'}
                                size="small"
                                sx={{
                                  bgcolor: m.salesforce_sync_status === 'synced' ? '#10B98122' : m.salesforce_sync_status === 'error' ? '#EF444422' : '#262626',
                                  color: m.salesforce_sync_status === 'synced' ? '#10B981' : m.salesforce_sync_status === 'error' ? '#EF4444' : '#9CA3AF',
                                  fontSize: '0.65rem',
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ borderColor: '#262626' }}>
                              <Button size="small" component={Link} href={`${paths.abm.missions}?id=${m.id}`} sx={{ color: '#3b82f6', minWidth: 0, mr: 0.5 }} onClick={(e) => e.stopPropagation()}>Open</Button>
                              {(() => {
                                const sf = salesforceEligibleFromListMission(m);
                                return (
                                  <Tooltip title={!sf.eligible ? sf.reason : ''}>
                                    <span>
                                      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                                        <Button
                                          size="small"
                                          sx={{ color: '#10B981', minWidth: 0 }}
                                          onClick={(e) => { e.stopPropagation(); handlePushToSalesforce(m.id); }}
                                          disabled={pushSfLoading || !sf.eligible}
                                        >
                                          Sync SF
                                        </Button>
                                        {sf.eligible && <img src="/salesforce-logo.png" alt="" style={{ height: 22, width: 'auto' }} />}
                                      </Box>
                                    </span>
                                  </Tooltip>
                                );
                              })()}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 50%', minWidth: 0 }}>
          <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', minHeight: 300 }}>
            <CardContent>
              <Typography sx={{ color: '#FFFFFF', fontSize: '1.125rem', fontWeight: 600, mb: 2 }}>Mission Detail</Typography>
              {!selectedId ? (
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Select a mission from the list</Typography>
              ) : detailLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={24} sx={{ color: '#9CA3AF' }} />
                </Box>
              ) : detail ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Header */}
                  <Box>
                    <Typography sx={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 600 }}>{formatLaneDisplayName(detail.mission.title)}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel id="mission-stage-label" sx={{ color: '#9CA3AF' }}>Stage</InputLabel>
                        <Select
                          labelId="mission-stage-label"
                          label="Stage"
                          value={detail.mission.stage || 'new'}
                          onChange={(e) => handleStageChange(e.target.value)}
                          sx={{ color: '#fff', borderColor: '#262626', '.MuiOutlinedInput-notchedOutline': { borderColor: '#262626' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#404040' } }}
                        >
                          {allowedNextStages(detail.mission.stage || 'new').map((s) => (
                            <MenuItem key={s} value={s}>{s}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Chip label={detail.mission.priority || 'medium'} size="small" sx={{ bgcolor: '#262626', color: '#fff' }} />
                      {detail.mission.confidence != null && (
                        <Chip label={`${Math.round((detail.mission.confidence ?? 0) * 100)}% conf`} size="small" sx={{ bgcolor: '#262626', color: '#fff' }} />
                      )}
                      {detail.mission.prospectCompany?.id && (
                        <Button component={Link} href={paths.abm.account(String(detail.mission.prospectCompany.id))} variant="outlined" size="small" sx={{ borderColor: '#262626', color: '#3b82f6', height: 24 }}>
                          Open Account
                        </Button>
                      )}
                    </Box>
                    <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem', mt: 0.5 }}>
                      {detail.mission.prospectCompany?.name || detail.mission.prospectCompany?.domain || '—'} · Owner: {detail.mission.owner?.preferred_name || detail.mission.owner?.name || '—'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                      <Button variant="outlined" size="small" onClick={() => setDetailTab(2)} sx={{ borderColor: '#262626', color: '#3b82f6' }}>Add Task</Button>
                      <Button variant="outlined" size="small" onClick={handleGenerateAiBrief} disabled={aiBriefLoading} sx={{ borderColor: '#8B5CF6', color: '#8B5CF6' }}>
                        {aiBriefLoading ? 'Generating...' : 'Generate Brief'}
                      </Button>
                      {(() => {
                      const sf = salesforceEligibleFromDetail(detail);
                      const missionId = detail?.mission?.id ?? selectedId;
                      return (
                        <Tooltip title={!sf.eligible ? sf.reason : ''}>
                          <span style={{ display: 'inline-flex' }}>
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                              <Button variant="outlined" size="small" onClick={() => handlePushToSalesforce(missionId)} disabled={pushSfLoading || !sf.eligible} sx={{ borderColor: '#10B981', color: '#10B981' }}>
                                {pushSfLoading ? 'Syncing...' : 'Sync to Salesforce'}
                              </Button>
                              {sf.eligible && <img src="/salesforce-logo.png" alt="" style={{ height: 28, width: 'auto' }} />}
                            </Box>
                          </span>
                        </Tooltip>
                      );
                    })()}
                    </Box>
                  </Box>

                  <Tabs value={detailTab} onChange={(_, v) => setDetailTab(v)} sx={{ borderBottom: '1px solid #262626', mb: 2, minHeight: 40 }}>
                    <Tab label="Overview" sx={{ color: '#9CA3AF', fontSize: '0.8rem', minHeight: 40 }} />
                    <Tab label="Procurement Brief" sx={{ color: '#9CA3AF', fontSize: '0.8rem', minHeight: 40 }} />
                    <Tab label="Tasks" sx={{ color: '#9CA3AF', fontSize: '0.8rem', minHeight: 40 }} />
                    <Tab label="Timeline" sx={{ color: '#9CA3AF', fontSize: '0.8rem', minHeight: 40 }} />
                    <Tab label="Salesforce" sx={{ color: '#9CA3AF', fontSize: '0.8rem', minHeight: 40 }} />
                  </Tabs>

                  {detailTab === 0 && (
                  <>
                  {/* Requirements */}
                  <Box>
                    <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mb: 0.5 }}>Requirements</Typography>
                    <Typography sx={{ color: '#FFFFFF', fontSize: '0.85rem' }}>
                      Lane: {formatLaneDisplayName(detail.mission.service_lane)} · Type: {detail.mission.mission_type || '—'} · Pattern: {detail.mission.mission_pattern || '—'}
                    </Typography>
                    <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                      Orbit: {detail.mission.target_orbit || '—'} · Mass: {detail.mission.payload_mass_kg ?? '—'} kg · Schedule: {detail.mission.earliest_date || '—'} – {detail.mission.latest_date || '—'}
                    </Typography>
                    <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                      Readiness: {detail.mission.readiness_confidence || '—'} · Budget: {detail.mission.budget_band || '—'}
                    </Typography>
                  </Box>

                  {/* Source: Lead Request (when mission created from lead) */}
                  {(detail.mission.lead_request_id || (detail.mission.leadRequest as { id?: string })?.id) && (
                    <Box>
                      <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mb: 0.5 }}>Source</Typography>
                      <Typography sx={{ color: '#E5E7EB', fontSize: '0.875rem', mb: 0.5 }}>
                        <Link href={`${paths.abm.leadRequests}?id=${detail.mission.lead_request_id || (detail.mission.leadRequest as { id?: string })?.id}`} style={{ color: '#3b82f6' }}>
                          Lead Request
                        </Link>
                        {' from '}
                        {(detail.mission.leadRequest as { organization_name?: string; organization_domain?: string })?.organization_name || (detail.mission.leadRequest as { organization_domain?: string })?.organization_domain || 'Unknown'}
                        {', '}
                        {dayjs((detail.mission.leadRequest as { created_at?: string })?.created_at).format('MMM DD, YYYY')}
                      </Typography>
                    </Box>
                  )}

                  {/* Related Programs (Procurement Radar) */}
                  <Box>
                    <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mb: 0.5 }}>Related Programs</Typography>
                    {(detail as { linked_programs?: { id: string; procurement_program_id: string; program?: { id: string; title: string; status: string; due_at?: string; url?: string } }[] }).linked_programs?.length ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
                        {(detail as any).linked_programs.map((lp: { id: string; procurement_program_id: string; program?: { id: string; title: string; status: string; due_at?: string; url?: string } }) => (
                          <Box key={lp.id}>
                            {lp.program?.url ? (
                              <Button component="a" href={lp.program.url} target="_blank" rel="noopener noreferrer" size="small" sx={{ color: '#3b82f6', minWidth: 0, p: 0, justifyContent: 'flex-start', textAlign: 'left' }}>
                                {lp.program?.title?.slice(0, 50) || lp.procurement_program_id} {lp.program?.due_at ? `· Due ${dayjs(lp.program.due_at).format('MM/DD')}` : ''} →
                              </Button>
                            ) : (
                              <Button component={Link} href={`${paths.abm.programs}?id=${lp.procurement_program_id}`} size="small" sx={{ color: '#3b82f6', minWidth: 0, p: 0, justifyContent: 'flex-start', textAlign: 'left' }}>
                                {lp.program?.title?.slice(0, 50) || lp.procurement_program_id} {lp.program?.due_at ? `· Due ${dayjs(lp.program.due_at).format('MM/DD')}` : ''} →
                              </Button>
                            )}
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography sx={{ color: '#9CA3AF', fontSize: '0.85rem', mb: 0.5 }}>No programs linked</Typography>
                    )}
                    <Button component={Link} href={`${paths.abm.programs}?attachMissionId=${selectedId}`} variant="outlined" size="small" sx={{ borderColor: '#262626', color: '#3b82f6' }}>
                      Attach Program
                    </Button>
                  </Box>

                  {/* People */}
                  <Box>
                    <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mb: 0.5 }}>People</Typography>
                    {detail.mission.primaryContact && (
                      <Typography sx={{ color: '#FFFFFF', fontSize: '0.85rem' }}>
                        Primary: {detail.mission.primaryContact.first_name} {detail.mission.primaryContact.last_name} ({detail.mission.primaryContact.email})
                      </Typography>
                    )}
                    {detail.mission.contacts && (detail.mission as any).contacts?.length > 0 && (
                      <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                        {(detail.mission as any).contacts.map((c: any) => `${c.first_name} ${c.last_name}${c.MissionContact?.role ? ` (${c.MissionContact.role})` : ''}`).join(', ')}
                      </Typography>
                    )}
                    {!detail.mission.primaryContact && (!detail.mission.contacts || (detail.mission as any).contacts?.length === 0) && (
                      <Typography sx={{ color: '#9CA3AF', fontSize: '0.85rem' }}>—</Typography>
                    )}
                  </Box>

                  {/* Next Step */}
                  <Box>
                    <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mb: 0.5 }}>Next Step</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                      <TextField
                        size="small"
                        placeholder="Next step..."
                        value={editNextStep}
                        onChange={(e) => setEditNextStep(e.target.value)}
                        sx={{ flex: 1, minWidth: 200, '& .MuiInputBase-root': { backgroundColor: '#0A0A0A', color: '#fff' } }}
                      />
                      <TextField
                        size="small"
                        type="datetime-local"
                        value={editNextStepDue}
                        onChange={(e) => setEditNextStepDue(e.target.value)}
                        sx={{ '& .MuiInputBase-root': { backgroundColor: '#0A0A0A', color: '#fff' } }}
                      />
                      <Button variant="contained" size="small" onClick={handleSaveNextStep} disabled={saving} sx={{ bgcolor: '#3b82f6' }}>
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                    </Box>
                  </Box>

                  {/* Add note */}
                  <Box>
                    <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mb: 0.5 }}>Add Note</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        size="small"
                        placeholder="Note..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                        sx={{ flex: 1, '& .MuiInputBase-root': { backgroundColor: '#0A0A0A', color: '#fff' } }}
                      />
                      <Button variant="outlined" size="small" onClick={handleAddNote} disabled={addingNote || !noteText.trim()} sx={{ borderColor: '#262626', color: '#3b82f6' }}>
                        Add
                      </Button>
                    </Box>
                  </Box>

                  {/* Artifacts */}
                  {detail.mission.artifacts && (detail.mission as any).artifacts?.length > 0 && (
                    <Box>
                      <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mb: 0.5 }}>Artifacts</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {(detail.mission as any).artifacts.map((a: any) => (
                          <Typography key={a.id} component="a" href={a.url} target="_blank" rel="noopener noreferrer" sx={{ color: '#3b82f6', fontSize: '0.85rem', textDecoration: 'underline' }}>
                            {a.title || a.type} {a.url && '→'}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Activity timeline */}
                  {detail.mission.activities && (detail.mission as any).activities?.length > 0 && (
                    <Box>
                      <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mb: 0.5 }}>Activity</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxHeight: 120, overflow: 'auto' }}>
                        {(detail.mission as any).activities.slice(0, 10).map((a: any) => (
                          <Typography key={a.id} sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                            {dayjs(a.created_at).format('MM/DD HH:mm')} — {a.body}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* AI Brief Drawer */}
                  <Drawer
                    anchor="right"
                    open={aiBriefDrawerOpen}
                    onClose={() => setAiBriefDrawerOpen(false)}
                    PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, backgroundColor: '#0A0A0A', borderLeft: '1px solid #262626' } }}
                  >
                    <Box sx={{ p: 2 }}>
                      <Typography sx={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 600, mb: 2 }}>Mission AI Brief</Typography>
                      {aiBriefLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                          <CircularProgress size={24} sx={{ color: '#9CA3AF' }} />
                        </Box>
                      ) : aiBriefContent ? (
                        <Box component="pre" sx={{ color: '#E5E7EB', fontSize: '0.875rem', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                          {aiBriefContent}
                        </Box>
                      ) : (
                        <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Click Generate to create a brief.</Typography>
                      )}
                    </Box>
                  </Drawer>

                  {/* Close / reopen mission */}
                  {ACTIVE_STAGES.includes(detail.mission.stage || '') && (
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Button variant="outlined" size="small" onClick={() => handleCloseMission('won')} sx={{ borderColor: '#10B981', color: '#10B981' }}>
                        Won
                      </Button>
                      <Button variant="outlined" size="small" onClick={() => handleCloseMission('lost')} sx={{ borderColor: '#EF4444', color: '#EF4444' }}>
                        Lost
                      </Button>
                      <Button variant="outlined" size="small" onClick={() => handleCloseMission('on_hold')} sx={{ borderColor: '#F59E0B', color: '#F59E0B' }}>
                        On Hold
                      </Button>
                    </Box>
                  )}
                  {CLOSED_STAGES.includes(detail.mission.stage || '') && (
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Button variant="outlined" size="small" onClick={handleReopenMission} sx={{ borderColor: '#3b82f6', color: '#3b82f6' }}>
                        Reopen (set to qualified)
                      </Button>
                    </Box>
                  )}
                  </>
                  )}

                  {detailTab === 1 && (
                    <Box>
                      {(detail.mission.lead_request_id || (detail.mission.leadRequest as { id?: string })?.id) && (
                        <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem', mb: 1 }}>
                          Source: Lead Request from {(detail.mission.leadRequest as { organization_name?: string })?.organization_name || (detail.mission.leadRequest as { organization_domain?: string })?.organization_domain || '—'}
                        </Typography>
                      )}
                      <Button variant="outlined" size="small" onClick={handleGenerateAiBrief} disabled={aiBriefLoading} sx={{ borderColor: '#8B5CF6', color: '#8B5CF6', mb: 2 }}>
                        {aiBriefLoading ? 'Generating...' : 'Generate Mission Brief'}
                      </Button>
                      {aiBriefContent && (
                        <Box component="pre" sx={{ color: '#E5E7EB', fontSize: '0.875rem', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{aiBriefContent}</Box>
                      )}
                      {!aiBriefContent && !aiBriefLoading && (
                        <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Generate a brief to see it here, or open the drawer from Overview.</Typography>
                      )}
                    </Box>
                  )}

                  {detailTab === 2 && (
                    <Box>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <TextField
                          size="small"
                          placeholder="Task title"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          sx={{ minWidth: 200, '& .MuiInputBase-root': { backgroundColor: '#0A0A0A', color: '#fff' } }}
                        />
                        <TextField size="small" type="datetime-local" value={newTaskDue} onChange={(e) => setNewTaskDue(e.target.value)} sx={{ '& .MuiInputBase-root': { backgroundColor: '#0A0A0A', color: '#fff' } }} />
                        <Button variant="outlined" size="small" onClick={handleAddTask} disabled={addingTask || !newTaskTitle.trim()} sx={{ borderColor: '#262626', color: '#3b82f6' }}>Add Task</Button>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {(detail.mission.tasks?.length ? detail.mission.tasks : missionTasks).map((t) => (
                          <Box key={t.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, borderBottom: '1px solid #262626' }}>
                            <Checkbox
                              size="small"
                              checked={t.status === 'done'}
                              onChange={() => handleToggleTask(t)}
                              sx={{ color: '#3b82f6', '&.Mui-checked': { color: '#10B981' } }}
                            />
                            <Typography sx={{ color: t.status === 'done' ? '#6b7280' : '#E5E7EB', fontSize: '0.875rem', textDecoration: t.status === 'done' ? 'line-through' : 'none', flex: 1 }}>{t.title}</Typography>
                            <Chip label={t.task_type || 'other'} size="small" sx={{ bgcolor: '#262626', color: '#9CA3AF', fontSize: '0.65rem' }} />
                            {t.due_at && <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', fontFamily: 'monospace' }}>{dayjs(t.due_at).format('MM/DD')}</Typography>}
                          </Box>
                        ))}
                        {!(detail.mission.tasks?.length || missionTasks.length) && (
                          <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>No tasks. Add one above.</Typography>
                        )}
                      </Box>
                    </Box>
                  )}

                  {detailTab === 3 && (
                    <Box>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <TextField
                          size="small"
                          placeholder="Add note..."
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                          sx={{ flex: 1, '& .MuiInputBase-root': { backgroundColor: '#0A0A0A', color: '#fff' } }}
                        />
                        <Button variant="outlined" size="small" onClick={handleAddNote} disabled={addingNote || !noteText.trim()} sx={{ borderColor: '#262626', color: '#3b82f6' }}>Add Note</Button>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxHeight: 280, overflow: 'auto' }}>
                        {(missionActivity?.items ?? (detail.mission.activities || [])).map((a: { id: string; type: string; body: string | null; created_at: string; createdBy?: { preferred_name?: string; name?: string } }) => (
                          <Typography key={a.id} sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                            {dayjs(a.created_at).format('MM/DD HH:mm')} [{a.type}] {(a.createdBy?.preferred_name || a.createdBy?.name) || '—'} — {a.body || '(no body)'}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {detailTab === 4 && (
                    <Box>
                      <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mb: 0.5 }}>Sync status</Typography>
                      <Chip
                        label={detail.mission.salesforce_sync_status || 'Not synced'}
                        size="small"
                        sx={{
                          bgcolor: detail.mission.salesforce_sync_status === 'synced' ? '#10B98122' : detail.mission.salesforce_sync_status === 'error' ? '#EF444422' : '#262626',
                          color: detail.mission.salesforce_sync_status === 'synced' ? '#10B981' : detail.mission.salesforce_sync_status === 'error' ? '#EF4444' : '#9CA3AF',
                          mb: 1,
                        }}
                      />
                      {detail.mission.salesforce_last_synced_at && (
                        <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem', display: 'block' }}>Last synced: {dayjs(detail.mission.salesforce_last_synced_at).format('MMM DD, HH:mm')}</Typography>
                      )}
                      {detail.mission.salesforce_last_error && (
                        <Typography sx={{ color: '#EF4444', fontSize: '0.8rem', display: 'block', mt: 0.5 }}>{detail.mission.salesforce_last_error}</Typography>
                      )}
                      {(() => {
                      const sf = salesforceEligibleFromDetail(detail);
                      const missionId = detail?.mission?.id ?? selectedId;
                      return (
                        <Tooltip title={!sf.eligible ? sf.reason : ''}>
                          <span style={{ display: 'inline-flex' }}>
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, mt: 1 }}>
                              <Button variant="outlined" size="small" onClick={() => handlePushToSalesforce(missionId)} disabled={pushSfLoading || !sf.eligible} sx={{ borderColor: '#10B981', color: '#10B981' }}>
                                {pushSfLoading ? 'Syncing...' : 'Sync to Salesforce now'}
                              </Button>
                              {sf.eligible && <img src="/salesforce-logo.png" alt="" style={{ height: 28, width: 'auto' }} />}
                            </Box>
                          </span>
                        </Tooltip>
                      );
                    })()}
                    </Box>
                  )}

                </Box>
              ) : (
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Failed to load</Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Salesforce sync overlay – dramatic wait + success cue */}
      {(pushSfStatus === 'syncing' || pushSfStatus === 'success' || pushSfStatus === 'error') && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: pushSfStatus === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(0,0,0,0.92)',
            transition: 'background-color 0.4s ease',
          }}
        >
          {pushSfStatus === 'syncing' && (
            <Box sx={{ textAlign: 'center' }}>
              <CloudArrowUpIcon size={64} weight="duotone" style={{ color: '#10B981', marginBottom: 24, animation: 'pulse 1.5s ease-in-out infinite' }} />
              <Typography sx={{ color: '#E5E7EB', fontSize: '1.25rem', fontWeight: 600, mb: 1 }}>Syncing to Salesforce</Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.9rem', mb: 3 }}>Creating opportunity…</Typography>
              <CircularProgress size={48} thickness={4} sx={{ color: '#10B981' }} />
              <style>{`
                @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } }
              `}</style>
            </Box>
          )}
          {pushSfStatus === 'success' && (
            <Box sx={{ textAlign: 'center', animation: 'successPop 0.5s ease-out' }}>
              <CheckCircleIcon size={80} weight="fill" style={{ color: '#10B981', marginBottom: 16 }} />
              <Typography sx={{ color: '#10B981', fontSize: '1.5rem', fontWeight: 700 }}>Synced to Salesforce</Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.95rem', mt: 0.5 }}>Opportunity updated</Typography>
              <style>{`
                @keyframes successPop { 0% { opacity: 0; transform: scale(0.8); } 70% { transform: scale(1.05); } 100% { opacity: 1; transform: scale(1); } }
              `}</style>
            </Box>
          )}
          {pushSfStatus === 'error' && (
            <Box sx={{ textAlign: 'center', maxWidth: 360 }}>
              <Typography sx={{ color: '#EF4444', fontSize: '1.25rem', fontWeight: 600, mb: 1 }}>Sync failed</Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.9rem', mb: 2 }}>{pushSfError || 'Something went wrong.'}</Typography>
              <Button variant="outlined" size="small" onClick={() => { setPushSfStatus('idle'); setPushSfError(null); }} sx={{ borderColor: '#262626', color: '#fff' }}>Dismiss</Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
