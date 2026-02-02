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
import dayjs from 'dayjs';

import { paths } from '@/paths';
import { abmApi } from '@/lib/abm/client';
import { ScoringDetailsDrawer } from '@/components/abm/ScoringDetailsDrawer';

export default function ABMLeadRequestsPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('id');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [leadRequests, setLeadRequests] = React.useState<any[]>([]);
  const [detail, setDetail] = React.useState<any | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [scoringDrawerOpen, setScoringDrawerOpen] = React.useState(false);
  const [scoringDetails, setScoringDetails] = React.useState<{ loading: boolean; data: any }>({ loading: false, data: null });

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    abmApi.getLeadRequests({ limit: 50, page: 1 }).then((res) => {
      if (cancelled) return;
      if (res.error) setError(res.error);
      else if (res.data) setLeadRequests(res.data.items || []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    abmApi.getLeadRequest(selectedId).then((res) => {
      if (cancelled) return;
      if (res.data) setDetail(res.data);
      setDetailLoading(false);
    });
    return () => { cancelled = true; };
  }, [selectedId]);

  if (loading) {
    return (
      <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#9CA3AF' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3, display: 'flex', gap: 2, flexDirection: { xs: 'column', lg: 'row' } }}>
      {error && <Typography sx={{ color: '#EF4444', mb: 2 }}>{error}</Typography>}
      <Box sx={{ flex: '1 1 40%', minWidth: 0 }}>
        <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626' }}>
          <CardContent>
            <Typography sx={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600, mb: 2 }}>Lead Requests</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Score</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Lane</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Org</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leadRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ color: '#9CA3AF', borderColor: '#262626', textAlign: 'center', py: 3 }}>No lead requests</TableCell>
                  </TableRow>
                ) : (
                  leadRequests.map((lr) => (
                    <TableRow
                      key={lr.id}
                      sx={{ bgcolor: selectedId === String(lr.id) ? 'rgba(59,130,246,0.1)' : 'transparent', cursor: 'pointer', '&:hover': { bgcolor: selectedId === String(lr.id) ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)' } }}
                      onClick={() => router.push(`${paths.abm.leadRequests}?id=${lr.id}`)}
                    >
                      <TableCell sx={{ color: '#FFFFFF', borderColor: '#262626', fontSize: '0.8rem' }}><Chip label={lr.lead_score ?? '—'} size="small" sx={{ fontFamily: 'monospace', bgcolor: '#262626', color: '#fff' }} /></TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem' }}>{lr.service_needed || '—'}</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem' }}>{lr.organization_domain || lr.prospectCompany?.domain || '—'}</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem', fontFamily: 'monospace' }}>{dayjs(lr.created_at).format('MM/DD')}</TableCell>
                      <TableCell sx={{ borderColor: '#262626' }}>
                        <Button size="small" component={Link} href={`${paths.abm.leadRequests}?id=${lr.id}`} sx={{ color: '#3b82f6', minWidth: 0 }} onClick={(e) => e.stopPropagation()}>View →</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Box>
      <Box sx={{ flex: '1 1 60%', minWidth: 0 }}>
        <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', minHeight: 300 }}>
          <CardContent>
            <Typography sx={{ color: '#FFFFFF', fontSize: '1.125rem', fontWeight: 600, mb: 2 }}>Lead Request Detail</Typography>
            {!selectedId ? (
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Select a lead request from the list</Typography>
            ) : detailLoading ? (
              <CircularProgress size={24} sx={{ color: '#9CA3AF' }} />
            ) : detail ? (
              <Box sx={{ '& > *': { mb: 1.5 } }}>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase' }}>Service + Mission</Typography>
                <Typography sx={{ color: '#FFFFFF', fontSize: '0.875rem' }}>{detail.service_needed || '—'}</Typography>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mt: 2 }}>Organization + Contact</Typography>
                <Typography sx={{ color: '#FFFFFF', fontSize: '0.875rem' }}>{detail.organization_name || detail.organization_domain || '—'}</Typography>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>{detail.work_email || detail.contact?.email || '—'}</Typography>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mt: 2 }}>Submitted at</Typography>
                <Typography sx={{ color: '#FFFFFF', fontSize: '0.875rem', fontFamily: 'monospace' }}>{dayjs(detail.created_at).format('MMM DD, YYYY HH:mm')}</Typography>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mt: 2 }}>Status</Typography>
                <Chip label={detail.routing_status || 'new'} size="small" sx={{ bgcolor: '#262626', color: '#fff' }} />
                <Box sx={{ mt: 2 }}>
                  {detail.prospectCompany?.id && (
                    <Button component={Link} href={paths.abm.account(String(detail.prospectCompany.id))} variant="outlined" size="small" sx={{ borderColor: '#262626', color: '#3b82f6', mr: 1 }}>
                      Open Account
                    </Button>
                  )}
                  <Box
                    component="span"
                    onClick={() => { setScoringDrawerOpen(true); setScoringDetails({ loading: true, data: null }); abmApi.getLeadRequestScoringDetails(selectedId!).then((r) => setScoringDetails({ loading: false, data: r.data ?? null })); }}
                    sx={{ color: '#3b82f6', cursor: 'pointer', fontSize: '0.875rem', textDecoration: 'underline' }}
                  >
                    View scoring details
                  </Box>
                </Box>
                <ScoringDetailsDrawer open={scoringDrawerOpen} onClose={() => setScoringDrawerOpen(false)} loading={scoringDetails.loading} data={scoringDetails.data} />
              </Box>
            ) : (
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Failed to load</Typography>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
