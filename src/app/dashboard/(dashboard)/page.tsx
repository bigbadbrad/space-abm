'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { JetBrains_Mono } from 'next/font/google';
import Grid from '@mui/material/Unstable_Grid2';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Gauge as GaugeIcon } from '@phosphor-icons/react/dist/ssr/Gauge';

import { paths } from '@/paths';
import { formatLaneDisplayName } from '@/components/abm/layout/config';
import { abmApi } from '@/lib/abm/client';
import type { ABMQueueItem, ABMQueueItemType } from '@/lib/abm/client';

dayjs.extend(relativeTime);

const jetbrainsMono = JetBrains_Mono({ weight: ['400', '500', '600', '700'], subsets: ['latin'] });

const BADGE_LABELS: Record<ABMQueueItemType, string> = {
  new_lead_request: 'New Lead',
  newly_hot: 'Newly Hot',
  spiking: 'Spiking',
  outbound: 'Outbound',
  stale_followup: 'Stale',
  mission_due: 'Mission Due',
  mission_stale: 'Mission Stale',
  mission_new: 'New Mission',
};

// Accept null/undefined timestamps safely
function formatTimeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = dayjs(dateStr);
  if (d.isAfter(dayjs().subtract(1, 'day'))) return d.fromNow();
  if (d.isAfter(dayjs().subtract(2, 'day'))) return 'Yesterday';
  return d.format('MMM DD');
}

export default function ABMOverviewPage(): React.JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<{
    kpis: { hot_accounts: number; surging_accounts: number; new_lead_requests: number; top_lane: string | null; top_lane_hot_count: number | null };
    hot_accounts_preview: any[];
    recent_lead_requests: any[];
    hot_over_time: { date: string; hot_count: number }[];
  } | null>(null);
  const [chartRange, setChartRange] = React.useState<'7d' | '30d'>('7d');
  const [queueData, setQueueData] = React.useState<{ generated_at: string; items: ABMQueueItem[] } | null>(null);
  const [missionsSummary, setMissionsSummary] = React.useState<{ active: number; due_soon: number; stale: number; hot: number } | null>(null);
  const [queueTab, setQueueTab] = React.useState<'today' | 'new' | 'spiking' | 'outbound' | 'missions'>('today');
  const [menuAnchor, setMenuAnchor] = React.useState<{ el: HTMLElement; item: ABMQueueItem } | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      abmApi.getOverview({ chart_range: chartRange }),
      abmApi.getQueue({ range: '7d' }),
      abmApi.getMissionsSummary({ range: '7d' }),
    ]).then(([overviewRes, queueRes, missionsRes]) => {
      if (cancelled) return;
      if (overviewRes.error) setError(overviewRes.error);
      else if (overviewRes.data) setData(overviewRes.data);
      if (queueRes.data) setQueueData(queueRes.data);
      if (missionsRes.data) setMissionsSummary(missionsRes.data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [chartRange]);

  const hasMeaningfulChart =
    data?.hot_over_time &&
    data.hot_over_time.length >= 2 &&
    data.hot_over_time.some((d) => d.hot_count > 0);

  if (loading) {
    return (
      <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#9CA3AF' }} />
      </Box>
    );
  }

  const kpis = data?.kpis || { hot_accounts: 0, surging_accounts: 0, new_lead_requests: 0, top_lane: null, top_lane_hot_count: null };
  const hotPreview = data?.hot_accounts_preview || [];
  const leadPreview = data?.recent_lead_requests || [];
  const hotOverTime = data?.hot_over_time || [];

  const chartData = hotOverTime.map((d) => ({
    date: dayjs(d.date).format('MMM DD'),
    hot_count: d.hot_count,
  }));

  const queueItems = queueData?.items ?? [];
  const filteredQueue =
    queueTab === 'today'
      ? queueItems
      : queueTab === 'new'
        ? queueItems.filter((i) => i.type === 'new_lead_request' || i.type === 'newly_hot')
        : queueTab === 'spiking'
          ? queueItems.filter((i) => i.type === 'spiking')
          : queueTab === 'outbound'
            ? queueItems.filter((i) => i.type === 'outbound')
            : queueItems.filter((i) => i.type === 'mission_due' || i.type === 'mission_stale' || i.type === 'mission_new');

  const handleSnooze = (item: ABMQueueItem, hours: number) => {
    const snoozeUntil = dayjs().add(hours, 'hour').toISOString();
    abmApi.postOperatorAction({
      action_type: 'snoozed',
      prospect_company_id: item.prospect_company_id,
      lead_request_id: item.lead_request_id,
      snooze_until: snoozeUntil,
    }).then(() => {
      setQueueData((prev) =>
        prev ? { ...prev, items: prev.items.filter((i) => i !== item) } : null
      );
    });
    setMenuAnchor(null);
  };

  const handleMarkContacted = (item: ABMQueueItem) => {
    abmApi.postOperatorAction({
      action_type: 'marked_contacted',
      prospect_company_id: item.prospect_company_id,
      lead_request_id: item.lead_request_id,
    }).then(() => {
      setQueueData((prev) =>
        prev ? { ...prev, items: prev.items.filter((i) => i !== item) } : null
      );
    });
    setMenuAnchor(null);
  };

  return (
    <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3 }}>
      {error && <Typography sx={{ color: '#EF4444', mb: 2 }}>{error}</Typography>}

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <GaugeIcon size={18} style={{ color: '#FFFFFF' }} />
          <Typography sx={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600 }}>Command Center</Typography>
        </Box>
        <Typography sx={{ color: '#9CA3AF', fontSize: '0.8125rem', mt: 0.5 }}>What changed + what to do next</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid xs={12}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Card
              component={Link}
              href={paths.abm.accounts}
              sx={{
                flex: '0.92 1 0',
                minWidth: 140,
                backgroundColor: '#0A0A0A',
                border: '1px solid #1a1a1a',
                cursor: 'pointer',
                textDecoration: 'none',
                '&:hover': { borderColor: '#3b82f6' },
              }}
            >
              <CardContent>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', mb: 1, whiteSpace: 'nowrap' }}>Hot Accounts</Typography>
                <Typography sx={{ background: 'linear-gradient(180deg, #004C94 45%, #297BC4 90%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent', fontSize: '4rem', fontWeight: 700, fontFamily: jetbrainsMono.style.fontFamily, lineHeight: 1 }}>{kpis.hot_accounts}</Typography>
              </CardContent>
            </Card>
            <Card
              component={Link}
              href={paths.abm.accounts}
              sx={{
                flex: '0.92 1 0',
                minWidth: 140,
                backgroundColor: '#0A0A0A',
                border: '1px solid #1a1a1a',
                cursor: 'pointer',
                textDecoration: 'none',
                '&:hover': { borderColor: '#3b82f6' },
              }}
            >
              <CardContent>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', mb: 1, whiteSpace: 'nowrap' }}>Surging Accounts</Typography>
                <Typography sx={{ background: 'linear-gradient(180deg, #004C94 45%, #297BC4 90%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent', fontSize: '4rem', fontWeight: 700, fontFamily: jetbrainsMono.style.fontFamily, lineHeight: 1 }}>{kpis.surging_accounts}</Typography>
              </CardContent>
            </Card>
            <Card
              component={Link}
              href={paths.abm.leadRequests}
              sx={{
                flex: '0.92 1 0',
                minWidth: 140,
                backgroundColor: '#0A0A0A',
                border: '1px solid #1a1a1a',
                cursor: 'pointer',
                textDecoration: 'none',
                '&:hover': { borderColor: '#3b82f6' },
              }}
            >
              <CardContent>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', mb: 1, whiteSpace: 'nowrap' }}>New Lead Requests</Typography>
                <Typography sx={{ background: 'linear-gradient(180deg, #004C94 45%, #297BC4 90%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent', fontSize: '4rem', fontWeight: 700, fontFamily: jetbrainsMono.style.fontFamily, lineHeight: 1 }}>{kpis.new_lead_requests}</Typography>
              </CardContent>
            </Card>
            <Card
              component={Link}
              href={paths.abm.missions}
              sx={{
                flex: '0.92 1 0',
                minWidth: 140,
                backgroundColor: '#0A0A0A',
                border: '1px solid #1a1a1a',
                cursor: 'pointer',
                textDecoration: 'none',
                '&:hover': { borderColor: '#3b82f6' },
              }}
            >
              <CardContent>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', mb: 1, whiteSpace: 'nowrap' }}>Missions</Typography>
                <Typography sx={{ background: 'linear-gradient(180deg, #004C94 45%, #297BC4 90%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent', fontSize: '4rem', fontWeight: 700, fontFamily: jetbrainsMono.style.fontFamily, lineHeight: 1 }}>{missionsSummary?.active ?? 0}</Typography>
              </CardContent>
            </Card>
            <Card
              component={Link}
              href={paths.abm.lanes}
              sx={{
                flex: '1.12 1 0',
                minWidth: 140,
                backgroundColor: '#0A0A0A',
                border: '1px solid #1a1a1a',
                cursor: 'pointer',
                textDecoration: 'none',
                '&:hover': { borderColor: '#3b82f6' },
              }}
            >
              <CardContent>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', mb: 1, whiteSpace: 'nowrap' }}>Top Lane</Typography>
                <Typography sx={{ background: 'linear-gradient(180deg, #004C94 45%, #297BC4 90%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent', fontSize: '4rem', fontWeight: 700, fontFamily: jetbrainsMono.style.fontFamily, lineHeight: 1 }}>{formatLaneDisplayName(kpis.top_lane)}</Typography>
                {kpis.top_lane_hot_count != null && (
                  <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', mt: 0.5 }}>{kpis.top_lane_hot_count} hot</Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        </Grid>

        <Grid xs={12} md={6}>
          <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography sx={{ color: '#FFFFFF', fontSize: '1.125rem', fontWeight: 600 }}>Today&apos;s Priorities</Typography>
                <Tabs
                  value={queueTab}
                  onChange={(_, v) => setQueueTab(v)}
                  sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0.5, fontSize: '0.75rem' }, '& .MuiTabs-indicator': { display: 'none' }, '& .Mui-selected': { color: '#3b82f6' } }}
                >
                  <Tab value="today" label="Today" />
                  <Tab value="new" label="New" />
                  <Tab value="spiking" label="Spiking" />
                  <Tab value="outbound" label="Outbound" />
                  <Tab value="missions" label="Missions" />
                </Tabs>
              </Box>
              {filteredQueue.length === 0 ? (
                <Typography sx={{ color: '#9CA3AF', textAlign: 'center', py: 4, fontSize: '0.875rem' }}>
                  All clear — nothing new since last score run.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {filteredQueue.map((item, idx) => {
                    const primary = item.title ?? item.org_name ?? item.name ?? item.domain ?? '—';
                    const score = item.lead_score ?? item.intent_score;
                    const timeStr = item.next_step_due_at ?? item.last_activity_at ?? item.created_at ?? item.submitted_at ?? item.changed_at ?? item.last_contacted_at;
                    const isLead = item.type === 'new_lead_request';
                    const isMission = item.type === 'mission_due' || item.type === 'mission_stale' || item.type === 'mission_new';
                    const itemHref = isMission && item.mission_id
                      ? `${paths.abm.missions}?id=${item.mission_id}`
                      : isLead
                        ? `${paths.abm.leadRequests}?id=${item.lead_request_id}`
                        : paths.abm.account(String(item.prospect_company_id ?? ''));
                    return (
                      <Box
                        key={`${item.type}-${item.mission_id ?? item.lead_request_id ?? item.prospect_company_id}-${idx}`}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          py: 1,
                          px: 1.5,
                          borderRadius: 1,
                          border: '1px solid #262626',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                        }}
                      >
                        <Chip
                          label={BADGE_LABELS[item.type]}
                          size="small"
                          sx={{ fontSize: '0.65rem', height: 20, bgcolor: '#262626', color: '#9CA3AF' }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Link
                            href={itemHref}
                            style={{ color: '#FFFFFF', fontWeight: 500, fontSize: '0.875rem', textDecoration: 'none' }}
                          >
                            {primary}
                          </Link>
                          <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', mt: 0.25 }}>
                            {formatLaneDisplayName(item.lane ?? item.top_lane)} {score != null && `· ${score}`} {item.surge_level && `· ${item.surge_level}`}
                          </Typography>
                          {item.why_hot && item.why_hot.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                              {item.why_hot.slice(0, 2).map((c, i) => (
                                <Chip key={i} label={c} size="small" sx={{ fontSize: '0.65rem', height: 18, bgcolor: 'transparent', color: '#6B7280', border: '1px solid #374151' }} />
                              ))}
                            </Box>
                          )}
                        </Box>
                        <Typography sx={{ color: '#6B7280', fontSize: '0.7rem', flexShrink: 0 }}>{formatTimeAgo(timeStr)}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Button
                            component={Link}
                            href={itemHref}
                            size="small"
                            sx={{ fontSize: '0.7rem', color: '#3b82f6', minWidth: 'auto', px: 1 }}
                          >
                            View
                          </Button>
                          {!isLead && item.prospect_company_id && (
                            <Button
                              size="small"
                              sx={{ fontSize: '0.7rem', color: '#3b82f6', minWidth: 'auto', px: 1 }}
                              onClick={async () => {
                                await abmApi.postOperatorAction({ action_type: 'ai_brief', prospect_company_id: item.prospect_company_id });
                                await abmApi.postAiSummary(String(item.prospect_company_id));
                                router.push(paths.abm.account(String(item.prospect_company_id)));
                              }}
                            >
                              AI Brief
                            </Button>
                          )}
                          <IconButton
                            size="small"
                            sx={{ color: '#9CA3AF', p: 0.25 }}
                            onClick={(e) => setMenuAnchor({ el: e.currentTarget, item })}
                          >
                            <span style={{ fontSize: '1rem' }}>⋯</span>
                          </IconButton>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
              <Menu
                open={!!menuAnchor}
                anchorEl={menuAnchor?.el}
                onClose={() => setMenuAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ sx: { bgcolor: '#1F2937', border: '1px solid #374151' } }}
              >
                <MenuItem onClick={() => menuAnchor && handleSnooze(menuAnchor.item, 1)} sx={{ color: '#E5E7EB', fontSize: '0.875rem' }}>Snooze 1h</MenuItem>
                <MenuItem onClick={() => menuAnchor && handleSnooze(menuAnchor.item, 24)} sx={{ color: '#E5E7EB', fontSize: '0.875rem' }}>Snooze 24h</MenuItem>
                <MenuItem onClick={() => menuAnchor && handleMarkContacted(menuAnchor.item)} sx={{ color: '#E5E7EB', fontSize: '0.875rem' }}>Mark as contacted</MenuItem>
              </Menu>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} md={6}>
          <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography sx={{ color: '#FFFFFF', fontSize: '1.125rem', fontWeight: 600 }}>Recent Lead Requests</Typography>
                <Button component={Link} href={paths.abm.leadRequests} size="small" sx={{ color: '#3b82f6' }}>View all</Button>
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Score</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Organization</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Submitted</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leadPreview.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ color: '#9CA3AF', borderColor: '#262626', textAlign: 'center', py: 4 }}>
                        No recent lead requests
                      </TableCell>
                    </TableRow>
                  ) : (
                    leadPreview.map((lr) => (
                      <TableRow key={lr.id}>
                        <TableCell sx={{ borderColor: '#262626' }}>
                          <Chip label={lr.lead_score ?? '—'} size="small" sx={{ fontFamily: jetbrainsMono.style.fontFamily, bgcolor: '#262626', color: '#fff' }} />
                        </TableCell>
                        <TableCell sx={{ color: '#FFFFFF', borderColor: '#262626', fontSize: '0.875rem' }}>{lr.organization_domain || lr.organization_name || lr.prospectCompany?.domain || '—'}</TableCell>
                        <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem', fontFamily: jetbrainsMono.style.fontFamily }}>{dayjs(lr.created_at).format('MMM DD')}</TableCell>
                        <TableCell sx={{ borderColor: '#262626' }}>
                          <Button component={Link} href={`${paths.abm.leadRequests}?id=${lr.id}`} size="small" sx={{ color: '#3b82f6' }}>View</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        {hasMeaningfulChart && (
          <Grid xs={12}>
            <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography sx={{ color: '#FFFFFF', fontSize: '1.125rem', fontWeight: 600 }}>Hot Accounts Over Time</Typography>
                  <ToggleButtonGroup
                    value={chartRange}
                    exclusive
                    onChange={(_, v) => v && setChartRange(v)}
                    size="small"
                    sx={{ '& .MuiToggleButton-root': { color: '#9CA3AF', borderColor: '#262626', '&.Mui-selected': { color: '#3b82f6', borderColor: '#3b82f6' } } }}
                  >
                    <ToggleButton value="7d">7d</ToggleButton>
                    <ToggleButton value="30d">30d</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                <Box sx={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="hotGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} />
                      <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} width={32} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', borderRadius: 8 }}
                        labelStyle={{ color: '#9CA3AF' }}
                        formatter={(value: number | undefined) => [value ?? 0, 'Hot accounts']}
                        labelFormatter={(label) => label}
                      />
                      <Area type="monotone" dataKey="hot_count" stroke="#3b82f6" fill="url(#hotGradient)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
