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
import Tooltip from '@mui/material/Tooltip';
import { ShieldStar as ShieldStarIcon } from '@phosphor-icons/react/dist/ssr/ShieldStar';
import dayjs from 'dayjs';

import { paths } from '@/paths';
import { useUser } from '@/hooks/use-user';
import { abmApi, type ABMProgram, type ABMProgramDetailView, type ABMProgramsSummaryResponse } from '@/lib/abm/client';
import { formatLaneDisplayName, formatSourceLabel } from '@/components/abm/layout/config';
import { ProgramInspector } from '@/components/abm/ProgramInspector';

export default function ABMProgramsPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('id');
  const attachMissionId = searchParams.get('attachMissionId');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [programs, setPrograms] = React.useState<ABMProgram[]>([]);
  const [total, setTotal] = React.useState(0);
  const [detail, setDetail] = React.useState<ABMProgramDetailView | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [summary, setSummary] = React.useState<ABMProgramsSummaryResponse | null>(null);
  const [filters, setFilters] = React.useState({
    range: '30d',
    status: 'all',
    lane: '',
    source: '',
    search: '',
    due: '',
    sort: 'posted_desc',
    relevant: 'true' as 'true' | 'false' | 'suppressed',
  });
  const [linkAccountId, setLinkAccountId] = React.useState('');
  const [linkMissionId, setLinkMissionId] = React.useState(attachMissionId || '');
  const [linking, setLinking] = React.useState(false);
  const [reclassifying, setReclassifying] = React.useState(false);
  const { user } = useUser();
  const isAdmin = user?.role === 'internal_admin';

  const fetchPrograms = React.useCallback(() => {
    const params: Record<string, string | number> = { limit: 50, page: 1, sort: filters.sort };
    if (filters.range) params.range = filters.range;
    if (filters.status && filters.status !== 'all') params.status = filters.status;
    if (filters.lane) params.lane = filters.lane;
    if (filters.source) params.source = filters.source;
    if (filters.search) params.search = filters.search;
    if (filters.due) params.due = filters.due;
    params.relevant = filters.relevant;
    setLoading(true);
    abmApi.getPrograms(params).then((res) => {
      if (res.error) setError(res.error);
      else if (res.data) {
        setPrograms(res.data.programs || []);
        setTotal(res.data.total ?? 0);
      }
      setLoading(false);
    });
  }, [filters]);

  React.useEffect(() => {
    abmApi.getProgramsSummary({ range: '30d' }).then((res) => {
      if (res.data) setSummary(res.data);
    });
  }, []);

  React.useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  React.useEffect(() => {
    if (attachMissionId) setLinkMissionId(attachMissionId);
  }, [attachMissionId]);

  React.useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    abmApi.getProgram(selectedId).then((res) => {
      if (cancelled) return;
      if (res.data) setDetail(res.data);
      setDetailLoading(false);
    });
    return () => { cancelled = true; };
  }, [selectedId]);

  const setSelectedId = (id: string | null) => {
    if (id) router.push(`${paths.abm.programs}?id=${id}`);
    else router.push(paths.abm.programs);
  };

  const handleLinkAccount = () => {
    if (!selectedId || !linkAccountId || linking) return;
    setLinking(true);
    abmApi.postProgramLinkAccount(selectedId, { prospect_company_id: linkAccountId }).then((res) => {
      setLinking(false);
      setLinkAccountId('');
      if (!res.error && detail) {
        abmApi.getProgram(selectedId).then((r) => r.data && setDetail(r.data));
      }
    });
  };

  const handleUnlinkAccount = (linkId: string) => {
    if (!selectedId) return;
    abmApi.deleteProgramLinkAccount(selectedId, linkId).then((res) => {
      if (!res.error && detail) {
        abmApi.getProgram(selectedId).then((r) => r.data && setDetail(r.data));
      }
    });
  };

  const handleLinkMission = () => {
    if (!selectedId || !linkMissionId || linking) return;
    setLinking(true);
    abmApi.postProgramLinkMission(selectedId, { mission_id: linkMissionId }).then((res) => {
      setLinking(false);
      setLinkMissionId('');
      if (!res.error && detail) {
        abmApi.getProgram(selectedId).then((r) => r.data && setDetail(r.data));
      }
    });
  };

  const handleCreateMission = () => {
    if (!selectedId) return;
    abmApi.postProgramCreateMission(selectedId).then((res) => {
      if (res.data?.mission) {
        router.push(`${paths.abm.missions}?id=${res.data.mission.id}`);
      }
    });
  };

  const handleReclassify = async (range: string) => {
    if (!isAdmin || reclassifying) return;
    setReclassifying(true);
    setError(null);
    const res = await abmApi.reclassifyPrograms(range);
    setReclassifying(false);
    if (res.error) setError(res.error);
    else fetchPrograms();
  };

  const statusColor = (s: string) => (s === 'open' ? '#10B981' : s === 'awarded' ? '#3b82f6' : '#9CA3AF');

  return (
    <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {error && <Typography sx={{ color: '#EF4444', mb: 1 }}>{error}</Typography>}

      {attachMissionId && (
        <Card sx={{ backgroundColor: '#1e3a5f', border: '1px solid #3b82f6', mb: 1 }}>
          <CardContent sx={{ py: 1 }}>
            <Typography sx={{ color: '#93c5fd', fontSize: '0.875rem' }}>
              Linking to Mission {attachMissionId}. Select a program to the left, then click &quot;Attach&quot; below.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Summary cards */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {summary && (
          <>
            <Card
              sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', cursor: 'pointer', minWidth: 120 }}
              onClick={() => setFilters((f) => ({ ...f, status: 'all' }))}
            >
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase' }}>New (30d)</Typography>
                <Typography sx={{ color: '#FFFFFF', fontSize: '1.5rem', fontWeight: 600 }}>{summary.new_posted_count}</Typography>
              </CardContent>
            </Card>
            <Card
              sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', cursor: 'pointer', minWidth: 120 }}
              onClick={() => setFilters((f) => ({ ...f, due: 'soon' }))}
            >
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase' }}>Due Soon</Typography>
                <Typography sx={{ color: '#F59E0B', fontSize: '1.5rem', fontWeight: 600 }}>{summary.due_soon_count}</Typography>
              </CardContent>
            </Card>
            <Card
              sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', cursor: 'pointer', minWidth: 120 }}
              onClick={() => setFilters((f) => ({ ...f, status: 'awarded' }))}
            >
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase' }}>Awarded</Typography>
                <Typography sx={{ color: '#3b82f6', fontSize: '1.5rem', fontWeight: 600 }}>{summary.awarded_count}</Typography>
              </CardContent>
            </Card>
            <Card
              sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', cursor: 'pointer', minWidth: 120 }}
              onClick={() => setFilters((f) => ({ ...f, status: 'open' }))}
            >
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase' }}>Open</Typography>
                <Typography sx={{ color: '#10B981', fontSize: '1.5rem', fontWeight: 600 }}>{summary.open_count}</Typography>
              </CardContent>
            </Card>
          </>
        )}
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search title, agency..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && fetchPrograms()}
          sx={{ minWidth: 180, '& .MuiInputBase-root': { backgroundColor: '#0A0A0A', color: '#fff' } }}
        />
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel sx={{ color: '#9CA3AF' }}>Range</InputLabel>
          <Select
            value={filters.range}
            label="Range"
            onChange={(e) => setFilters((f) => ({ ...f, range: e.target.value }))}
            sx={{ backgroundColor: '#0A0A0A', color: '#fff' }}
          >
            <MenuItem value="7d">7 days</MenuItem>
            <MenuItem value="30d">30 days</MenuItem>
            <MenuItem value="90d">90 days</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel sx={{ color: '#9CA3AF' }}>Status</InputLabel>
          <Select
            value={filters.status}
            label="Status"
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            sx={{ backgroundColor: '#0A0A0A', color: '#fff' }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="open">Open</MenuItem>
            <MenuItem value="closed">Closed</MenuItem>
            <MenuItem value="awarded">Awarded</MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', mr: 0.5 }}>View:</Typography>
          {(['true', 'false', 'suppressed'] as const).map((v) => (
            <Chip
              key={v}
              label={v === 'true' ? 'Relevant' : v === 'suppressed' ? 'Suppressed' : 'All'}
              size="small"
              onClick={() => setFilters((f) => ({ ...f, relevant: v }))}
              sx={{ cursor: 'pointer', bgcolor: filters.relevant === v ? '#3b82f633' : '#262626', color: filters.relevant === v ? '#3b82f6' : '#9CA3AF' }}
            />
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', mr: 0.5 }}>Source:</Typography>
          {(['', 'sam_opportunity', 'usaspending_award', 'spacewerx_award'] as const).map((src) => (
            <Chip
              key={src || 'all'}
              label={src ? formatSourceLabel(src) : 'All'}
              size="small"
              onClick={() => setFilters((f) => ({ ...f, source: f.source === src ? '' : src }))}
              sx={{ cursor: 'pointer', bgcolor: filters.source === src ? '#8B5CF633' : '#262626', color: filters.source === src ? '#8B5CF6' : '#9CA3AF' }}
            />
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {['launch', 'hosted_payload', 'ground_station', 'relocation', 'fueling', 'isam', 'reentry_return'].map((lane) => (
            <Chip
              key={lane}
              label={formatLaneDisplayName(lane)}
              size="small"
              onClick={() => setFilters((f) => ({ ...f, lane: f.lane === lane ? '' : lane }))}
              sx={{ cursor: 'pointer', bgcolor: filters.lane === lane ? '#10B98133' : '#262626', color: filters.lane === lane ? '#10B981' : '#9CA3AF' }}
            />
          ))}
        </Box>
        <Chip
          label="Due soon"
          size="small"
          onClick={() => setFilters((f) => ({ ...f, due: f.due ? '' : 'soon' }))}
          sx={{ cursor: 'pointer', bgcolor: filters.due ? '#F59E0B33' : '#262626', color: filters.due ? '#F59E0B' : '#9CA3AF' }}
        />
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel sx={{ color: '#9CA3AF' }}>Sort</InputLabel>
          <Select
            value={filters.sort}
            label="Sort"
            onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
            sx={{ backgroundColor: '#0A0A0A', color: '#fff' }}
          >
            <MenuItem value="posted_desc">Posted (newest)</MenuItem>
            <MenuItem value="due_asc">Due (soonest)</MenuItem>
          </Select>
        </FormControl>
        <Button variant="outlined" size="small" onClick={fetchPrograms} sx={{ borderColor: '#262626', color: '#3b82f6' }}>
          Apply
        </Button>
        {isAdmin && (
          <Tooltip title="Re-score programs using classification rules. Run after import or when rules change.">
            <span>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleReclassify('30d')}
                disabled={reclassifying}
                sx={{ borderColor: '#10B981', color: '#10B981' }}
              >
                {reclassifying ? 'Reclassifying…' : 'Reclassify 30d'}
              </Button>
            </span>
          </Tooltip>
        )}
      </Box>

      {/* Two-pane layout */}
      <Box sx={{ display: 'flex', gap: 2, flex: 1, minHeight: 0, flexDirection: { xs: 'column', lg: 'row' } }}>
        <Box sx={{ flex: '1 1 50%', minWidth: 0 }}>
          <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2 }}>
                <ShieldStarIcon size={18} style={{ color: '#FFFFFF' }} />
                <Typography sx={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600 }}>Programs</Typography>
              </Box>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress sx={{ color: '#9CA3AF' }} />
                </Box>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Source</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Title</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Agency</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Lane</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Posted</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Links</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {programs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ color: '#9CA3AF', borderColor: '#262626', textAlign: 'center', py: 3 }}>
                          No programs found. Run the SAM import to fetch opportunities.
                        </TableCell>
                      </TableRow>
                    ) : (
                      programs.map((p) => (
                        <TableRow
                          key={p.id}
                          sx={{
                            bgcolor: selectedId === String(p.id) ? 'rgba(59,130,246,0.1)' : 'transparent',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: selectedId === String(p.id) ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)' },
                          }}
                          onClick={() => setSelectedId(p.id)}
                        >
                          <TableCell sx={{ borderColor: '#262626' }}>
                            <Chip label={p.status || 'open'} size="small" sx={{ bgcolor: '#262626', color: statusColor(p.status || ''), fontSize: '0.7rem' }} />
                          </TableCell>
                          <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.7rem' }}>
                            <Chip label={formatSourceLabel(p.source)} size="small" sx={{ bgcolor: '#262626', color: '#fff', fontSize: '0.65rem' }} />
                          </TableCell>
                          <TableCell sx={{ color: '#FFFFFF', borderColor: '#262626', fontSize: '0.8rem', maxWidth: 220 }}>{p.title?.slice(0, 80)}{p.title && p.title.length > 80 ? '…' : ''}</TableCell>
                          <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem' }}>{p.agency?.slice(0, 30) || '—'}</TableCell>
                          <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem' }}>{formatLaneDisplayName(p.service_lane)}</TableCell>
                          <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem' }}>
                            <Tooltip title={p.reasons_summary || 'No match reasons'} arrow>
                              <Box component="span" sx={{ cursor: 'help' }}>
                                <Chip label={p.relevance_score ?? 0} size="small" sx={{ bgcolor: (p.relevance_score ?? 0) >= 60 ? '#10B98133' : (p.relevance_score ?? 0) >= 35 ? '#3b82f633' : '#262626', color: (p.relevance_score ?? 0) >= 60 ? '#10B981' : (p.relevance_score ?? 0) >= 35 ? '#3b82f6' : '#9CA3AF', fontSize: '0.7rem' }} />
                              </Box>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem', fontFamily: 'monospace' }}>{p.posted_at ? dayjs(p.posted_at).format('MM/DD') : '—'}</TableCell>
                          <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem' }}>
                            {(p.linked_accounts_count ?? 0) > 0 && (
                              <Chip label={`${p.linked_accounts_count}A`} size="small" sx={{ mr: 0.5, bgcolor: '#262626', color: '#fff', fontSize: '0.65rem' }} />
                            )}
                            {(p.linked_missions_count ?? 0) > 0 && (
                              <Chip label={`${p.linked_missions_count}M`} size="small" sx={{ bgcolor: '#262626', color: '#fff', fontSize: '0.65rem' }} />
                            )}
                            {(p.linked_accounts_count ?? 0) === 0 && (p.linked_missions_count ?? 0) === 0 && '—'}
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

        <Box sx={{ flex: '1 1 50%', minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <ProgramInspector
            detail={detail}
            loading={detailLoading}
            programId={selectedId}
            linkAccountId={linkAccountId}
            linkMissionId={linkMissionId}
            linking={linking}
            onLinkAccountIdChange={setLinkAccountId}
            onLinkMissionIdChange={setLinkMissionId}
            onLinkAccount={handleLinkAccount}
            onUnlinkAccount={handleUnlinkAccount}
            onLinkMission={handleLinkMission}
            onCreateMission={handleCreateMission}
            onRefresh={() => selectedId && abmApi.getProgram(selectedId).then((r) => r.data && setDetail(r.data))}
          />
        </Box>
      </Box>
    </Box>
  );
}
