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
import dayjs from 'dayjs';
import { Users as UsersIcon } from '@phosphor-icons/react/dist/ssr/Users';

import { paths } from '@/paths';
import { abmApi } from '@/lib/abm/client';
import { useABMFilters } from '@/contexts/abm-filter-context';

export default function ABMPeoplePage(): React.JSX.Element {
  const { filters } = useABMFilters();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [people, setPeople] = React.useState<any[]>([]);

  React.useEffect(() => {
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
  }, [filters.range]);

  if (loading) {
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2 }}>
            <UsersIcon size={18} style={{ color: '#FFFFFF' }} />
            <Typography sx={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600 }}>People Inside Accounts</Typography>
          </Box>
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
        </CardContent>
      </Card>
    </Box>
  );
}
