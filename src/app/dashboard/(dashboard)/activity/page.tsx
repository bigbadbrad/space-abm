'use client';

import * as React from 'react';
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
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import dayjs from 'dayjs';
import { ChartLine as ChartLineIcon } from '@phosphor-icons/react/dist/ssr/ChartLine';

import { paths } from '@/paths';
import { abmApi } from '@/lib/abm/client';
import { useABMFilters } from '@/contexts/abm-filter-context';

export default function ABMActivityPage(): React.JSX.Element {
  const { filters } = useABMFilters();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<{
    kpis: { events_today: number; accounts_active_7d: number; lead_requests_7d: number; exploding_accounts_7d: number };
    feed: any[];
    trending_lanes: { name: string; score: number }[];
    trending_types: { name: string; score: number }[];
  } | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    abmApi.getActivity({ range: filters.range, limit: 200 }).then((res) => {
      if (cancelled) return;
      if (res.error) setError(res.error);
      else if (res.data) setData(res.data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [filters.range]);

  if (loading) {
    return (
      <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#9CA3AF' }} />
      </Box>
    );
  }

  const kpis = data?.kpis || { events_today: 0, accounts_active_7d: 0, lead_requests_7d: 0, exploding_accounts_7d: 0 };
  const feed = data?.feed || [];
  const trendingLanes = data?.trending_lanes || [];
  const trendingTypes = data?.trending_types || [];

  return (
    <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {error && <Typography sx={{ color: '#EF4444', mb: 2 }}>{error}</Typography>}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <ChartLineIcon size={18} style={{ color: '#FFFFFF' }} />
        <Typography sx={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600 }}>Activity</Typography>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', minWidth: 140, flex: '1 1 140px' }}>
          <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
            <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', mb: 0.5 }}>Events today</Typography>
            <Typography sx={{ color: '#FFFFFF', fontSize: '1.5rem', fontWeight: 600, fontFamily: 'monospace' }}>{kpis.events_today}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', minWidth: 140, flex: '1 1 140px' }}>
          <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
            <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', mb: 0.5 }}>Accounts active (7d)</Typography>
            <Typography sx={{ color: '#FFFFFF', fontSize: '1.5rem', fontWeight: 600, fontFamily: 'monospace' }}>{kpis.accounts_active_7d}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', minWidth: 140, flex: '1 1 140px' }}>
          <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
            <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', mb: 0.5 }}>Lead requests (7d)</Typography>
            <Typography sx={{ color: '#FFFFFF', fontSize: '1.5rem', fontWeight: 600, fontFamily: 'monospace' }}>{kpis.lead_requests_7d}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', minWidth: 140, flex: '1 1 140px' }}>
          <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
            <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', mb: 0.5 }}>Exploding accounts (7d)</Typography>
            <Typography sx={{ color: '#FFFFFF', fontSize: '1.5rem', fontWeight: 600, fontFamily: 'monospace' }}>{kpis.exploding_accounts_7d}</Typography>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', flex: 1, minWidth: 0 }}>
          <CardContent>
            <Typography sx={{ color: '#FFFFFF', fontSize: '1.125rem', fontWeight: 600, mb: 2 }}>Activity Feed</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Time</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Account</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Person</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Activity type</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Lane</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Weight</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Link</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {feed.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ color: '#9CA3AF', borderColor: '#262626', textAlign: 'center', py: 4 }}>
                      No activity in the selected range
                    </TableCell>
                  </TableRow>
                ) : (
                  feed.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                        {dayjs(item.time).format('MMM DD, HH:mm')}
                      </TableCell>
                      <TableCell sx={{ borderColor: '#262626' }}>
                        {item.account_id ? (
                          <Button component={Link} href={paths.abm.account(item.account_id)} size="small" sx={{ color: '#3b82f6', textTransform: 'none', minWidth: 0, p: 0 }}>
                            {item.account_name || item.account_domain || '—'}
                          </Button>
                        ) : (
                          <Typography sx={{ color: '#FFFFFF', fontSize: '0.8rem' }}>—</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem' }}>{item.person || '—'}</TableCell>
                      <TableCell sx={{ color: '#FFFFFF', borderColor: '#262626', fontSize: '0.8rem' }}>{item.activity_type || '—'}</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem' }}>{item.lane || '—'}</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem', fontFamily: 'monospace' }}>{item.weight ?? '—'}</TableCell>
                      <TableCell sx={{ borderColor: '#262626' }}>
                        {item.link ? (
                          <Button component="a" href={item.link} target="_blank" rel="noreferrer" size="small" sx={{ color: '#3b82f6', fontSize: '0.75rem' }}>
                            View
                          </Button>
                        ) : (
                          <Typography sx={{ color: '#6b7280', fontSize: '0.75rem' }}>—</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', width: { xs: '100%', lg: 280 }, flexShrink: 0 }}>
          <CardContent>
            <Typography sx={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 600, mb: 2 }}>Trending Topics / Lanes</Typography>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.7rem', fontWeight: 500, textTransform: 'uppercase', mb: 1 }}>Top lanes (7d)</Typography>
              {trendingLanes.length === 0 ? (
                <Typography sx={{ color: '#6b7280', fontSize: '0.8rem' }}>No data</Typography>
              ) : (
                <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
                  {trendingLanes.map((l) => (
                    <Box key={l.name} component="li" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, fontSize: '0.8rem' }}>
                      <Typography sx={{ color: '#FFFFFF' }}>{l.name}</Typography>
                      <Typography sx={{ color: '#9CA3AF', fontFamily: 'monospace' }}>{l.score}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
            <Box>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.7rem', fontWeight: 500, textTransform: 'uppercase', mb: 1 }}>Top content types</Typography>
              {trendingTypes.length === 0 ? (
                <Typography sx={{ color: '#6b7280', fontSize: '0.8rem' }}>No data</Typography>
              ) : (
                <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
                  {trendingTypes.map((t) => (
                    <Box key={t.name} component="li" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, fontSize: '0.8rem' }}>
                      <Typography sx={{ color: '#FFFFFF' }}>{t.name}</Typography>
                      <Typography sx={{ color: '#9CA3AF', fontFamily: 'monospace' }}>{t.score}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
