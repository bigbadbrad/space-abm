'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import dayjs from 'dayjs';

import { paths } from '@/paths';
import { formatLaneDisplayName } from '@/components/abm/layout/config';
import { abmApi } from '@/lib/abm/client';
import type { ABMAccountPeopleResponse, ABMAccountPeopleActivityResponse } from '@/lib/abm/client';
import { ScoringDetailsDrawer } from '@/components/abm/ScoringDetailsDrawer';

export default function ABMAccountDetailPage(): React.JSX.Element {
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<any>(null);
  const [tab, setTab] = React.useState(0);
  const [scoringDrawerOpen, setScoringDrawerOpen] = React.useState(false);
  const [scoringDetails, setScoringDetails] = React.useState<{ loading: boolean; data: any }>({ loading: false, data: null });
  const [peopleData, setPeopleData] = React.useState<ABMAccountPeopleResponse | null>(null);
  const [peopleActivityData, setPeopleActivityData] = React.useState<ABMAccountPeopleActivityResponse | null>(null);
  const [peopleLoading, setPeopleLoading] = React.useState(false);
  const [peopleActivityLoading, setPeopleActivityLoading] = React.useState(false);
  const [peopleRangeDays, setPeopleRangeDays] = React.useState(7);
  const [expandedPersonContactId, setExpandedPersonContactId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    abmApi.getAccount(id).then((res) => {
      if (cancelled) return;
      if (res.error) setError(res.error);
      else if (res.data) setData(res.data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id]);

  React.useEffect(() => {
    if (tab !== 2 || !id) return;
    let cancelled = false;
    setPeopleLoading(true);
    abmApi.getAccountPeople(id, { range_days: peopleRangeDays, include_unmatched: false }).then((res) => {
      if (cancelled) return;
      if (res.data) setPeopleData(res.data);
      else setPeopleData(null);
      setPeopleLoading(false);
    });
    return () => { cancelled = true; };
  }, [tab, id, peopleRangeDays]);

  React.useEffect(() => {
    if (tab !== 2 || !id) return;
    let cancelled = false;
    setPeopleActivityLoading(true);
    abmApi.getAccountPeopleActivity(id, { range_days: peopleRangeDays }).then((res) => {
      if (cancelled) return;
      if (res.data) setPeopleActivityData(res.data);
      else setPeopleActivityData(null);
      setPeopleActivityLoading(false);
    });
    return () => { cancelled = true; };
  }, [tab, id, peopleRangeDays]);

  if (loading || !data) {
    return (
      <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {loading ? <CircularProgress sx={{ color: '#9CA3AF' }} /> : null}
      </Box>
    );
  }

  const account = data.account;
  const latest = data.latest_snapshot;
  const laneBreakdown = data.lane_breakdown || {};
  const timeline = data.timeline_30d || [];
  const leadRequests = data.lead_requests || [];
  const contacts = data.contacts || [];

  return (
    <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3 }}>
      {error && <Typography sx={{ color: '#EF4444', mb: 2 }}>{error}</Typography>}
      <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
            <Typography sx={{ color: '#FFFFFF', fontSize: '1.5rem', fontWeight: 600 }}>{account.name || account.domain}</Typography>
            <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>{account.domain}</Typography>
            <Chip label={`Score: ${latest?.intent_score ?? account.intent_score ?? '—'}`} size="small" sx={{ bgcolor: '#3b82f6', color: '#fff', fontFamily: 'monospace' }} />
            <Chip label={latest?.intent_stage ?? account.intent_stage ?? '—'} size="small" sx={{ bgcolor: '#262626', color: '#fff' }} />
            <Chip label={latest?.surge_level ?? account.surge_level ?? 'Normal'} size="small" sx={{ bgcolor: '#262626', color: '#fff' }} />
            <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem' }}>Top lane: {formatLaneDisplayName(latest?.top_lane ?? account.top_lane)}</Typography>
            <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem' }}>Last seen: {account.last_seen_at ? dayjs(account.last_seen_at).format('MMM DD, YYYY') : '—'}</Typography>
            <Button component={Link} href={paths.abm.leadRequests} size="small" sx={{ color: '#3b82f6' }}>View Lead Requests</Button>
            <Typography component="span" sx={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
              {' • '}
              <Box component="span" onClick={() => { setScoringDrawerOpen(true); setScoringDetails({ loading: true, data: null }); abmApi.getAccountScoringDetails(id).then((r) => setScoringDetails({ loading: false, data: r.data ?? null })); }} sx={{ color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}>View scoring details</Box>
            </Typography>
          </Box>
          <ScoringDetailsDrawer open={scoringDrawerOpen} onClose={() => setScoringDrawerOpen(false)} loading={scoringDetails.loading} data={scoringDetails.data} />
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid #262626', minHeight: 40 }}>
            <Tab label="Overview" sx={{ color: '#9CA3AF', fontSize: '0.875rem', minHeight: 40 }} />
            <Tab label="Lane Breakdown" sx={{ color: '#9CA3AF', fontSize: '0.875rem', minHeight: 40 }} />
            <Tab label="People" sx={{ color: '#9CA3AF', fontSize: '0.875rem', minHeight: 40 }} />
            <Tab label="Lead Requests" sx={{ color: '#9CA3AF', fontSize: '0.875rem', minHeight: 40 }} />
          </Tabs>
          {tab === 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mb: 1 }}>Why this score (7d)</Typography>
              <Box component="ul" sx={{ pl: 3, m: 0, color: '#FFFFFF', fontSize: '0.875rem' }}>
                {(() => {
                  const raw = account?.intent_evidence_7d;
                  let evidenceList: string[] = [];
                  if (raw != null && raw !== '') {
                    try {
                      evidenceList = typeof raw === 'string' ? JSON.parse(raw) : raw;
                      if (!Array.isArray(evidenceList)) evidenceList = [];
                    } catch {
                      evidenceList = [];
                    }
                  }
                  if (evidenceList.length === 0 && latest?.key_events_7d_json && typeof latest.key_events_7d_json === 'object') {
                    evidenceList = Object.entries(latest.key_events_7d_json)
                      .sort((a: [string, any], b: [string, any]) => (b[1] || 0) - (a[1] || 0))
                      .slice(0, 5)
                      .map(([k, v]: [string, any]) => `${v}× ${String(k).replace(/_page_view|cta_click_/g, ' ').trim()}`);
                  }
                  return evidenceList.length ? evidenceList.map((s, i) => <li key={i}>{s}</li>) : <li>No evidence yet. Run recompute or wait for next daily run.</li>;
                })()}
              </Box>
            </Box>
          )}
          {tab === 1 && (
            <Box sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Lane</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Score</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(laneBreakdown).map(([k, v]: [string, any]) => (
                    <TableRow key={k}>
                      <TableCell sx={{ color: '#FFFFFF', borderColor: '#262626', fontSize: '0.875rem' }}>{k}</TableCell>
                      <TableCell sx={{ color: '#FFFFFF', borderColor: '#262626', fontSize: '0.875rem', fontFamily: 'monospace' }}>{String(v)}</TableCell>
                    </TableRow>
                  ))}
                  {Object.keys(laneBreakdown).length === 0 && (
                    <TableRow><TableCell colSpan={2} sx={{ color: '#9CA3AF', borderColor: '#262626', textAlign: 'center', py: 2 }}>No lane data</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          )}
          {tab === 2 && (
            <Box sx={{ mt: 2 }}>
              {peopleData?.banner && (
                <Typography sx={{ color: '#F59E0B', fontSize: '0.875rem', mb: 2 }}>{peopleData.banner}</Typography>
              )}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 2 }}>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase' }}>Range</Typography>
                <Button size="small" variant={peopleRangeDays === 7 ? 'contained' : 'outlined'} onClick={() => setPeopleRangeDays(7)} sx={{ minWidth: 32, color: peopleRangeDays === 7 ? '#fff' : '#9CA3AF', borderColor: '#262626' }}>7d</Button>
                <Button size="small" variant={peopleRangeDays === 30 ? 'contained' : 'outlined'} onClick={() => setPeopleRangeDays(30)} sx={{ minWidth: 32, color: peopleRangeDays === 30 ? '#fff' : '#9CA3AF', borderColor: '#262626' }}>30d</Button>
              </Box>
              {peopleActivityLoading ? (
                <Box sx={{ py: 3, display: 'flex', justifyContent: 'center' }}><CircularProgress size={24} sx={{ color: '#9CA3AF' }} /></Box>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Person</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Email</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Title</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Last seen</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Events</TableCell>
                      <TableCell sx={{ width: 120, minWidth: 120, borderColor: '#262626', whiteSpace: 'nowrap' }} align="right" />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(peopleActivityData?.people ?? [])
                      .sort((a, b) => {
                        const aAt = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0;
                        const bAt = b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0;
                        return bAt - aAt;
                      })
                      .map((p) => {
                        const personLabel = (p.first_name || p.last_name) ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : p.email || '—';
                        const isExpanded = expandedPersonContactId === p.contact_id;
                        return (
                          <React.Fragment key={p.contact_id}>
                            <TableRow
                              sx={{ cursor: p.events_count > 0 ? 'pointer' : 'default' }}
                              onClick={() => p.events_count > 0 && setExpandedPersonContactId((id) => (id === p.contact_id ? null : p.contact_id))}
                            >
                              <TableCell sx={{ color: '#FFFFFF', borderColor: '#262626', fontSize: '0.875rem' }}>{personLabel}</TableCell>
                              <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.875rem' }}>{p.email || '—'}</TableCell>
                              <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.875rem' }}>{p.title || '—'}</TableCell>
                              <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.875rem' }}>{p.last_seen_at ? dayjs(p.last_seen_at).format('MMM DD, YYYY') : '—'}</TableCell>
                              <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.875rem', fontFamily: 'monospace' }}>{p.events_count}</TableCell>
                              <TableCell sx={{ borderColor: '#262626', width: 120, minWidth: 120, whiteSpace: 'nowrap' }} align="right" onClick={(e) => e.stopPropagation()}>
                                {p.events_count > 0 && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => setExpandedPersonContactId((id) => (id === p.contact_id ? null : p.contact_id))}
                                    sx={{ color: '#3B82F6', borderColor: '#3B82F6', fontSize: '0.75rem', textTransform: 'none', whiteSpace: 'nowrap' }}
                                  >
                                    {isExpanded ? 'Hide activity' : 'View Activity'}
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                            {isExpanded && p.events.length > 0 && (
                              <TableRow>
                                <TableCell colSpan={6} sx={{ borderColor: '#262626', py: 0, backgroundColor: '#0d0d0d', verticalAlign: 'top' }}>
                                  <Box sx={{ py: 2, pl: 1 }}>
                                    <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 600, mb: 1 }}>Activity (anonymous → known)</Typography>
                                    <Table size="small">
                                      <TableHead>
                                        <TableRow>
                                          <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.7rem', fontWeight: 600 }}>Event</TableCell>
                                          <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.7rem', fontWeight: 600 }}>When</TableCell>
                                          <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.7rem', fontWeight: 600 }}>Path</TableCell>
                                          <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.7rem', fontWeight: 600 }}>Identity</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {[...p.events]
                                          .sort((a, b) => {
                                            const tA = new Date(a.timestamp).getTime();
                                            const tB = new Date(b.timestamp).getTime();
                                            if (tB !== tA) return tB - tA;
                                            return String(a.event + a.path).localeCompare(String(b.event + b.path));
                                          })
                                          .map((ev, idx) => (
                                          <TableRow key={idx}>
                                            <TableCell sx={{ color: '#E5E7EB', borderColor: '#262626', fontSize: '0.8rem' }}>{ev.event_display ?? ev.event}</TableCell>
                                            <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem' }}>{dayjs(ev.timestamp).format('MMM D, YYYY h:mm A')}</TableCell>
                                            <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem' }}>{ev.path ?? '—'}</TableCell>
                                            <TableCell sx={{ borderColor: '#262626' }}>
                                              <Chip
                                                label={ev.identity}
                                                size="small"
                                                sx={{
                                                  fontSize: '0.7rem',
                                                  bgcolor: ev.identity === 'known' ? '#065f46' : '#374151',
                                                  color: '#fff',
                                                }}
                                              />
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        );
                      })}
                    {(peopleActivityData?.people ?? []).length === 0 && (
                      <TableRow><TableCell colSpan={6} sx={{ color: '#9CA3AF', borderColor: '#262626', textAlign: 'center', py: 2 }}>No people (or PostHog not configured). Add contacts to see activity.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </Box>
          )}
          {tab === 3 && (
            <Box sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Score</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Service</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Submitted</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leadRequests.map((lr: any) => (
                    <TableRow key={lr.id}>
                      <TableCell sx={{ color: '#FFFFFF', borderColor: '#262626', fontSize: '0.875rem', fontFamily: 'monospace' }}>{lr.lead_score ?? '—'}</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.875rem' }}>{formatLaneDisplayName(lr.service_needed)}</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.875rem', fontFamily: 'monospace' }}>{dayjs(lr.created_at).format('MMM DD, YYYY')}</TableCell>
                      <TableCell sx={{ borderColor: '#262626' }}><Chip label={lr.routing_status || 'new'} size="small" sx={{ bgcolor: '#262626', color: '#fff', fontSize: '0.75rem' }} /></TableCell>
                      <TableCell sx={{ borderColor: '#262626' }}><Button component={Link} href={`${paths.abm.leadRequests}?id=${lr.id}`} size="small" sx={{ color: '#3b82f6' }}>View</Button></TableCell>
                    </TableRow>
                  ))}
                  {leadRequests.length === 0 && (
                    <TableRow><TableCell colSpan={5} sx={{ color: '#9CA3AF', borderColor: '#262626', textAlign: 'center', py: 2 }}>No lead requests</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
