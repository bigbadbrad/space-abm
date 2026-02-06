'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

import { paths } from '@/paths';
import { formatLaneDisplayName } from '@/components/abm/layout/config';
import { abmApi } from '@/lib/abm/client';
import { useABMFilters } from '@/contexts/abm-filter-context';

export default function ABMAccountsPage(): React.JSX.Element {
  const router = useRouter();
  const { filters } = useABMFilters();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [accounts, setAccounts] = React.useState<any[]>([]);
  const [total, setTotal] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    abmApi.getAccounts({ range: filters.range, stage: filters.stage !== 'All' ? filters.stage : undefined, surge: filters.surge !== 'All' ? filters.surge : undefined, lane: filters.lane !== 'All' ? filters.lane : undefined, search: filters.search || undefined, limit: 50, page: 1 }).then((res) => {
      if (cancelled) return;
      if (res.error) setError(res.error);
      else if (res.data) {
        setAccounts(res.data.accounts);
        setTotal(res.data.total);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [filters.range, filters.stage, filters.surge, filters.lane, filters.search]);

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
          <Typography sx={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600, mb: 2 }}>Hot Accounts</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Account</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Stage</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Intent Score</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Surge</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Top Lane</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Why hot</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>People (7d)</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ color: '#9CA3AF', borderColor: '#262626', textAlign: 'center', py: 4 }}>No accounts found</TableCell>
                </TableRow>
              ) : (
                accounts.map((a) => (
                  <TableRow
                    key={a.id}
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}
                    onClick={() => router.push(paths.abm.account(String(a.id)))}
                  >
                    <TableCell sx={{ color: '#FFFFFF', borderColor: '#262626', fontSize: '0.875rem' }}>{a.name || a.domain}</TableCell>
                    <TableCell sx={{ borderColor: '#262626' }}><Chip label={a.intent_stage || '—'} size="small" sx={{ bgcolor: '#262626', color: '#fff', fontSize: '0.75rem' }} /></TableCell>
                    <TableCell sx={{ color: '#FFFFFF', borderColor: '#262626', fontSize: '0.875rem', fontFamily: 'monospace' }}>{a.intent_score ?? '—'}</TableCell>
                    <TableCell sx={{ borderColor: '#262626' }}><Chip label={a.surge_level || 'Normal'} size="small" sx={{ bgcolor: '#262626', color: '#fff', fontSize: '0.75rem' }} /></TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.875rem' }}>{formatLaneDisplayName(a.top_lane)}</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem', maxWidth: 200 }}>{(a.why_hot || []).slice(0, 2).join('; ') || '—'}</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.875rem' }}>{a.unique_people_7d ?? '—'}</TableCell>
                    <TableCell sx={{ borderColor: '#262626' }}>
                      <Button size="small" sx={{ color: '#3b82f6' }} component={Link} href={paths.abm.account(String(a.id))} onClick={(e) => e.stopPropagation()}>View</Button>
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
