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
import type { ABMAccountPeopleResponse } from '@/lib/abm/client';
import { ScoringDetailsDrawer } from '@/components/abm/ScoringDetailsDrawer';

type PeopleTier = 'known' | 'anonymous' | 'unmatched';

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
  const [peopleLoading, setPeopleLoading] = React.useState(false);
  const [peopleTier, setPeopleTier] = React.useState<PeopleTier>('known');
  const [peopleRangeDays, setPeopleRangeDays] = React.useState(7);
  const [peopleIncludeUnmatched, setPeopleIncludeUnmatched] = React.useState(false);
  const [peopleMinEvents, setPeopleMinEvents] = React.useState(2);

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
    abmApi.getAccountPeople(id, { range_days: peopleRangeDays, include_unmatched: peopleIncludeUnmatched }).then((res) => {
      if (cancelled) return;
      if (res.data) setPeopleData(res.data);
      else setPeopleData(null);
      setPeopleLoading(false);
    });
    return () => { cancelled = true; };
  }, [tab, id, peopleRangeDays, peopleIncludeUnmatched]);

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
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mb: 1 }}>Why hot (7d)</Typography>
              <Box component="ul" sx={{ pl: 3, m: 0, color: '#FFFFFF', fontSize: '0.875rem' }}>
                {(() => {
                  const whyHot = latest?.key_events_7d_json && typeof latest.key_events_7d_json === 'object'
                    ? Object.entries(latest.key_events_7d_json)
                        .sort((a: [string, any], b: [string, any]) => (b[1] || 0) - (a[1] || 0))
                        .slice(0, 5)
                        .map(([k, v]: [string, any]) => `${v}× ${String(k).replace(/_page_view|cta_click_/g, ' ').trim()}`)
                    : [];
                  return whyHot.length ? whyHot.map((s, i) => <li key={i}>{s}</li>) : <li>No data</li>;
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
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase' }}>Tier</Typography>
                <Button size="small" variant={peopleTier === 'known' ? 'contained' : 'outlined'} onClick={() => setPeopleTier('known')} sx={{ color: peopleTier === 'known' ? '#fff' : '#9CA3AF', borderColor: '#262626', textTransform: 'none' }}>Known</Button>
                <Button size="small" variant={peopleTier === 'anonymous' ? 'contained' : 'outlined'} onClick={() => setPeopleTier('anonymous')} sx={{ color: peopleTier === 'anonymous' ? '#fff' : '#9CA3AF', borderColor: '#262626', textTransform: 'none' }}>Anonymous Visitors</Button>
                {peopleIncludeUnmatched && (
                  <Button size="small" variant={peopleTier === 'unmatched' ? 'contained' : 'outlined'} onClick={() => setPeopleTier('unmatched')} sx={{ color: peopleTier === 'unmatched' ? '#fff' : '#9CA3AF', borderColor: '#262626', textTransform: 'none' }}>Unmatched</Button>
                )}
                <Typography component="span" sx={{ color: '#9CA3AF', fontSize: '0.75rem', ml: 1 }}>Range</Typography>
                <Button size="small" variant={peopleRangeDays === 7 ? 'contained' : 'outlined'} onClick={() => setPeopleRangeDays(7)} sx={{ minWidth: 32, color: peopleRangeDays === 7 ? '#fff' : '#9CA3AF', borderColor: '#262626' }}>7d</Button>
                <Button size="small" variant={peopleRangeDays === 30 ? 'contained' : 'outlined'} onClick={() => setPeopleRangeDays(30)} sx={{ minWidth: 32, color: peopleRangeDays === 30 ? '#fff' : '#9CA3AF', borderColor: '#262626' }}>30d</Button>
                <Button size="small" variant="text" onClick={() => setPeopleIncludeUnmatched((v) => !v)} sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'none' }}>{peopleIncludeUnmatched ? 'Hide Unmatched' : 'Show Unmatched'}</Button>
              </Box>
              {peopleLoading ? (
                <Box sx={{ py: 3, display: 'flex', justifyContent: 'center' }}><CircularProgress size={24} sx={{ color: '#9CA3AF' }} /></Box>
              ) : peopleTier === 'known' && (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Person</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Email</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Title</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Last seen</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(peopleData?.known_contacts ?? contacts).map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell sx={{ color: '#FFFFFF', borderColor: '#262626', fontSize: '0.875rem' }}>{(c.first_name || c.last_name) ? `${c.first_name || ''} ${c.last_name || ''}`.trim() : c.email || '—'}</TableCell>
                        <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.875rem' }}>{c.email || '—'}</TableCell>
                        <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.875rem' }}>{c.title || '—'}</TableCell>
                        <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.875rem' }}>{c.last_seen_at ? dayjs(c.last_seen_at).format('MMM DD, YYYY') : '—'}</TableCell>
                      </TableRow>
                    ))}
                    {((peopleData?.known_contacts ?? contacts).length === 0) && (
                      <TableRow><TableCell colSpan={4} sx={{ color: '#9CA3AF', borderColor: '#262626', textAlign: 'center', py: 2 }}>No known contacts</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
              {!peopleLoading && peopleTier === 'anonymous' && (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Label</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Last seen</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Events</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Evidence</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Lane hint</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(peopleData?.anonymous_visitors ?? [])
                      .filter((v: any) => v.events_7d >= peopleMinEvents)
                      .map((v: any) => (
                        <TableRow key={v.visitor_id}>
                          <TableCell sx={{ color: '#FFFFFF', borderColor: '#262626', fontSize: '0.875rem' }}>{v.label}</TableCell>
                          <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.875rem' }}>{dayjs(v.last_seen_at).format('MMM DD, YYYY')}</TableCell>
                          <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.875rem', fontFamily: 'monospace' }}>{v.events_7d ?? 0}</TableCell>
                          <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.875rem' }}>{(v.top_pages_7d?.length || v.top_events_7d?.length) ? [...(v.top_pages_7d || []).slice(0, 2), ...(v.top_events_7d || []).slice(0, 2)].join(', ') || '—' : '—'}</TableCell>
                          <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.875rem' }}>{v.lane_hint || '—'}</TableCell>
                        </TableRow>
                      ))}
                    {(peopleData?.anonymous_visitors ?? []).filter((v: any) => v.events_7d >= peopleMinEvents).length === 0 && (
                      <TableRow><TableCell colSpan={5} sx={{ color: '#9CA3AF', borderColor: '#262626', textAlign: 'center', py: 2 }}>No anonymous visitors (or PostHog not configured)</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
              {!peopleLoading && peopleTier === 'unmatched' && (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Label</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Last seen</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Events</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Evidence</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Lane hint</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(peopleData?.unmatched ?? []).filter((v: any) => v.events_7d >= peopleMinEvents).map((v: any) => (
                      <TableRow key={v.visitor_id}>
                        <TableCell sx={{ color: '#FFFFFF', borderColor: '#262626', fontSize: '0.875rem' }}>{v.label}</TableCell>
                        <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.875rem' }}>{dayjs(v.last_seen_at).format('MMM DD, YYYY')}</TableCell>
                        <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.875rem', fontFamily: 'monospace' }}>{v.events_7d ?? 0}</TableCell>
                        <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.875rem' }}>{(v.top_pages_7d?.length || v.top_events_7d?.length) ? [...(v.top_pages_7d || []).slice(0, 2), ...(v.top_events_7d || []).slice(0, 2)].join(', ') || '—' : '—'}</TableCell>
                        <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.875rem' }}>{v.lane_hint || '—'}</TableCell>
                      </TableRow>
                    ))}
                    {(peopleData?.unmatched ?? []).length === 0 && (
                      <TableRow><TableCell colSpan={5} sx={{ color: '#9CA3AF', borderColor: '#262626', textAlign: 'center', py: 2 }}>No unmatched visitors</TableCell></TableRow>
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
