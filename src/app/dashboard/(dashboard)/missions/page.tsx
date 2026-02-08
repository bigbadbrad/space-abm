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
import { RocketLaunch as RocketLaunchIcon } from '@phosphor-icons/react/dist/ssr/RocketLaunch';
import dayjs from 'dayjs';

import { paths } from '@/paths';
import { abmApi, type ABMMission, type ABMMissionDetailResponse } from '@/lib/abm/client';
import { formatLaneDisplayName, LANE_OPTIONS } from '@/components/abm/layout/config';

const ACTIVE_STAGES = ['new', 'qualified', 'solutioning', 'proposal', 'negotiation'];

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
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Title</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Account</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Lane</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Due</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {missions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} sx={{ color: '#9CA3AF', borderColor: '#262626', textAlign: 'center', py: 3 }}>No missions</TableCell>
                      </TableRow>
                    ) : (
                      missions.map((m) => (
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
                          <TableCell sx={{ color: '#FFFFFF', borderColor: '#262626', fontSize: '0.8rem', maxWidth: 180 }}>{formatLaneDisplayName(m.title)}</TableCell>
                          <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem' }}>{m.prospectCompany?.domain || '—'}</TableCell>
                          <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem' }}>{formatLaneDisplayName(m.service_lane)}</TableCell>
                          <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                            {m.next_step_due_at ? dayjs(m.next_step_due_at).format('MM/DD') : '—'}
                          </TableCell>
                          <TableCell sx={{ borderColor: '#262626' }}>
                            <Button size="small" component={Link} href={`${paths.abm.missions}?id=${m.id}`} sx={{ color: '#3b82f6', minWidth: 0 }} onClick={(e) => e.stopPropagation()}>View →</Button>
                          </TableCell>
                        </TableRow>
                      ))
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
                    <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                      <Chip label={detail.mission.stage || 'new'} size="small" sx={{ bgcolor: '#262626', color: '#fff' }} />
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
                  </Box>

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

                  {/* Procurement brief / Lead Request */}
                  {(detail.mission.lead_request_id || (detail.mission.leadRequest as { id?: string })?.id) && (
                    <Box>
                      <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mb: 0.5 }}>Procurement Brief</Typography>
                      <Button component={Link} href={`${paths.abm.leadRequests}?id=${detail.mission.lead_request_id || (detail.mission.leadRequest as { id?: string })?.id}`} variant="outlined" size="small" sx={{ borderColor: '#262626', color: '#3b82f6' }}>
                        Open Lead Request
                      </Button>
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

                  {/* Generate AI Brief */}
                  <Box>
                    <Button variant="outlined" size="small" onClick={handleGenerateAiBrief} disabled={aiBriefLoading} sx={{ borderColor: '#8B5CF6', color: '#8B5CF6', mr: 1 }}>
                      {aiBriefLoading ? 'Generating...' : 'Generate Mission Brief'}
                    </Button>
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

                  {/* Close mission */}
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
                </Box>
              ) : (
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Failed to load</Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
