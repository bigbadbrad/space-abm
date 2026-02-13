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
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import dayjs from 'dayjs';
import { Users as UsersIcon } from '@phosphor-icons/react/dist/ssr/Users';

import { useRouter, useSearchParams } from 'next/navigation';
import { paths } from '@/paths';
import { abmApi } from '@/lib/abm/client';
import type { ABMPeopleDebugRow } from '@/lib/abm/client';
import { useABMFilters } from '@/contexts/abm-filter-context';

const RANGE_OPTIONS = ['15m', '1h', '24h', '7d', '30d'] as const;

export default function ABMPeoplePage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { filters } = useABMFilters();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [people, setPeople] = React.useState<any[]>([]);

  const [debugEnabled, setDebugEnabled] = React.useState(searchParams.get('debug') === '1');

  React.useEffect(() => {
    setDebugEnabled(searchParams.get('debug') === '1');
  }, [searchParams]);
  const [debugRange, setDebugRange] = React.useState<string>('24h');
  const [minEvents, setMinEvents] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [searchDebounced, setSearchDebounced] = React.useState('');
  const [debugRows, setDebugRows] = React.useState<ABMPeopleDebugRow[]>([]);
  const [debugLoading, setDebugLoading] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  React.useEffect(() => {
    if (debugEnabled) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    abmApi.getPeople({ range: filters.range }).then((res) => {
      if (cancelled) return;
      if (res.error) setError(res.error);
      else if (res.data) setPeople(res.data.people || []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [debugEnabled, filters.range]);

  React.useEffect(() => {
    if (!debugEnabled) return;
    let cancelled = false;
    setDebugLoading(true);
    setError(null);
    abmApi.getPeopleDebug({
      range: debugRange,
      min_events: minEvents,
      include_unmatched: true,
      search: searchDebounced || undefined,
    }).then((res) => {
      if (cancelled) return;
      if (res.error) setError(res.error);
      else if (res.data) setDebugRows(res.data.rows || []);
      setDebugLoading(false);
    });
    return () => { cancelled = true; };
  }, [debugEnabled, debugRange, minEvents, searchDebounced]);

  const filteredDebugRows = React.useMemo(() => {
    if (!searchDebounced.trim()) return debugRows;
    const q = searchDebounced.trim().toLowerCase();
    return debugRows.filter((r) => {
      const matchAccount = (r.account_name || '').toLowerCase().includes(q) || (r.account_domain || '').toLowerCase().includes(q);
      const matchPerson = (r.person_label || '').toLowerCase().includes(q);
      return matchAccount || matchPerson;
    });
  }, [debugRows, searchDebounced]);

  if (!debugEnabled && loading) {
    return (
      <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#9CA3AF' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3 }}>
      {error && <Typography sx={{ color: '#EF4444', mb: 2 }}>{error}</Typography>}
      <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flex: 1, minWidth: 0 }}>
              <UsersIcon size={18} style={{ color: '#FFFFFF' }} />
              <Typography sx={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600 }}>People Inside Accounts</Typography>
            </Box>
            <TextField
              size="small"
              placeholder="Search account name/domain"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{
                minWidth: 220,
                '& .MuiOutlinedInput-root': { backgroundColor: '#0A0A0A', color: '#fff', borderColor: '#262626' },
                '& .MuiInputBase-input::placeholder': { color: '#6b7280' },
              }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={debugEnabled}
                    onChange={(_, v) => {
                      setDebugEnabled(v);
                      router.replace(v ? `${paths.abm.people}?debug=1` : paths.abm.people);
                    }}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#F59E0B' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#F59E0B' } }}
                  />
                }
                label={<Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Debug</Typography>}
              />
            </Box>
          </Box>

          {debugEnabled && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 2, pl: 0.5 }}>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Range</Typography>
              {RANGE_OPTIONS.map((r) => (
                <Button key={r} size="small" variant={debugRange === r ? 'contained' : 'outlined'} onClick={() => setDebugRange(r)} sx={{ minWidth: 40, color: debugRange === r ? '#fff' : '#9CA3AF', borderColor: '#262626', textTransform: 'none' }}>{r}</Button>
              ))}
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Min events</Typography>
              <TextField
                type="number"
                size="small"
                value={minEvents}
                onChange={(e) => setMinEvents(Math.max(1, parseInt(e.target.value, 10) || 1))}
                inputProps={{ min: 1 }}
                sx={{ width: 64, '& .MuiOutlinedInput-root': { backgroundColor: '#0A0A0A', color: '#fff' } }}
              />
            </Box>
          )}

          {debugEnabled ? (
            debugLoading ? (
              <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress size={32} sx={{ color: '#9CA3AF' }} /></Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Person</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Account</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Role/title</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Activity ({debugRange})</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Last seen</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDebugRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ color: '#9CA3AF', borderColor: '#262626', textAlign: 'center', py: 4 }}>No people found</TableCell>
                    </TableRow>
                  ) : (
                    filteredDebugRows.map((r, idx) => (
                      <TableRow key={`${r.type}-${r.person_id}-${idx}`}>
                        <TableCell sx={{ color: r.type === 'known' ? '#22c55e' : r.type === 'anonymous' ? '#3b82f6' : '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem', textTransform: 'capitalize' }}>{r.type}</TableCell>
                        <TableCell sx={{ color: '#FFFFFF', borderColor: '#262626', fontSize: '0.875rem' }}>{r.person_label}</TableCell>
                        <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.875rem' }}>{r.account_name || r.account_domain || '—'}</TableCell>
                        <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.875rem' }}>{r.role_title || '—'}</TableCell>
                        <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.875rem', fontFamily: 'monospace' }}>{r.events_count != null ? r.events_count : '—'}</TableCell>
                        <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.875rem', fontFamily: 'monospace' }}>{r.last_seen_at ? dayjs(r.last_seen_at).format('MMM DD, HH:mm') : '—'}</TableCell>
                        <TableCell sx={{ borderColor: '#262626' }}>
                          {r.account_id ? (
                            <Button component={Link} href={paths.abm.account(r.account_id)} size="small" sx={{ color: '#3b82f6' }}>View Account</Button>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Person</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Account</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Role/title</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Activity (7d)</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Last seen</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {people.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ color: '#9CA3AF', borderColor: '#262626', textAlign: 'center', py: 4 }}>No people found</TableCell>
                  </TableRow>
                ) : (
                  people.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell sx={{ color: '#FFFFFF', borderColor: '#262626', fontSize: '0.875rem' }}>{p.display || p.email || `Anonymous #${p.id}`}</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.875rem' }}>{p.account_name || p.account_domain || '—'}</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.875rem' }}>{p.role || '—'}</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem' }}>{(p.top_categories_7d || []).slice(0, 2).join(', ') || '—'}</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.875rem', fontFamily: 'monospace' }}>{p.last_seen_at ? dayjs(p.last_seen_at).format('MMM DD, HH:mm') : '—'}</TableCell>
                      <TableCell sx={{ borderColor: '#262626' }}>
                        <Button component={Link} href={paths.abm.accounts} size="small" sx={{ color: '#3b82f6' }}>View Account</Button>
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
  );
}
