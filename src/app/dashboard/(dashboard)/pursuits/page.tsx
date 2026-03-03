'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
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
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import dayjs from 'dayjs';
import { Target as TargetIcon } from '@phosphor-icons/react/dist/ssr/Target';

import { paths } from '@/paths';
import { abmApi, type ABMPursuit } from '@/lib/abm/client';

const STATUS_OPTIONS = ['open', 'converted', 'closed'];
const STAGE_OPTIONS = ['researching', 'shaping', 'engaging', 'proposal', 'on_hold'];

export default function ABMPursuitsPage(): React.JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pursuits, setPursuits] = React.useState<ABMPursuit[]>([]);
  const [total, setTotal] = React.useState(0);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createTitle, setCreateTitle] = React.useState('');
  const [createAccountId, setCreateAccountId] = React.useState('');
  const [accounts, setAccounts] = React.useState<{ id: string; name: string; domain: string }[]>([]);
  const [createSubmitting, setCreateSubmitting] = React.useState(false);
  const [filters, setFilters] = React.useState({
    status: '',
    stage: '',
    owner: '',
    search: '',
    hot: '',
    sort: 'updated_at_desc',
  });

  const fetchPursuits = React.useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = { limit: '50', page: '1' };
    if (filters.status) params.status = filters.status;
    if (filters.stage) params.stage = filters.stage;
    if (filters.owner) params.owner = filters.owner;
    if (filters.search) params.search = filters.search;
    if (filters.hot === 'true') params.hot = 'true';
    if (filters.sort) params.sort = filters.sort;
    abmApi.getPursuits(params).then((res) => {
      if (res.error) setError(res.error);
      else if (res.data) {
        setPursuits(res.data.pursuits || []);
        setTotal(res.data.total ?? 0);
      }
      setLoading(false);
    });
  }, [filters]);

  React.useEffect(() => {
    fetchPursuits();
  }, [fetchPursuits]);

  React.useEffect(() => {
    if (createOpen) {
      abmApi.getAccounts({ limit: 100 }).then((res) => {
        if (res.data?.accounts) setAccounts(res.data.accounts.map((a: { id: string | number; name: string; domain: string }) => ({ id: String(a.id), name: a.name, domain: a.domain })));
      });
    }
  }, [createOpen]);

  const handleCreate = () => {
    if (!createTitle.trim() || !createAccountId) return;
    setCreateSubmitting(true);
    abmApi.postPursuit({ title: createTitle.trim(), prospect_company_id: createAccountId }).then((res) => {
      setCreateSubmitting(false);
      if (res.data) {
        setCreateOpen(false);
        setCreateTitle('');
        setCreateAccountId('');
        router.push(paths.abm.pursuit(res.data.id));
      } else if (res.error) alert(res.error);
    });
  };

  return (
    <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3 }}>
      {error && <Typography sx={{ color: '#EF4444', mb: 2 }}>{error}</Typography>}
      <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <TargetIcon size={20} style={{ color: '#FFFFFF' }} />
              <Typography sx={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600 }}>Pursuits</Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              onClick={() => setCreateOpen(true)}
              sx={{ bgcolor: '#3b82f6', color: '#fff', '&:hover': { bgcolor: '#2563eb' } }}
            >
              New Pursuit
            </Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search title, account..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && fetchPursuits()}
              sx={{ minWidth: 200, '& .MuiInputBase-root': { backgroundColor: '#0A0A0A', color: '#fff' } }}
            />
            <FormControl size="small" sx={{ minWidth: 120, '& .MuiInputBase-root': { backgroundColor: '#0A0A0A', color: '#fff' } }}>
              <InputLabel sx={{ color: '#9CA3AF' }}>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                sx={{ color: '#fff' }}
              >
                <MenuItem value="">All</MenuItem>
                {STATUS_OPTIONS.map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140, '& .MuiInputBase-root': { backgroundColor: '#0A0A0A', color: '#fff' } }}>
              <InputLabel sx={{ color: '#9CA3AF' }}>Stage</InputLabel>
              <Select
                value={filters.stage}
                label="Stage"
                onChange={(e) => setFilters((prev) => ({ ...prev, stage: e.target.value }))}
                sx={{ color: '#fff' }}
              >
                <MenuItem value="">All</MenuItem>
                {STAGE_OPTIONS.map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="outlined" size="small" onClick={() => fetchPursuits()} sx={{ borderColor: '#262626', color: '#9CA3AF' }}>Apply</Button>
          </Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#9CA3AF' }} />
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Title</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Account</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Stage</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Intel</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Signals (90d)</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Next action</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Owner</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Linked</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pursuits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} sx={{ color: '#9CA3AF', borderColor: '#262626', textAlign: 'center', py: 4 }}>
                      No pursuits yet. Create one for a target account to run Mission Intel and shape the opportunity.
                    </TableCell>
                  </TableRow>
                ) : (
                  pursuits.map((p) => (
                    <TableRow
                      key={p.id}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}
                      onClick={() => router.push(paths.abm.pursuit(p.id))}
                    >
                      <TableCell sx={{ color: '#FFFFFF', borderColor: '#262626', fontSize: '0.8rem' }}>{p.title}</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem' }}>{p.account?.name || p.account?.domain || '—'}</TableCell>
                      <TableCell sx={{ borderColor: '#262626' }}>
                        <Chip label={p.status} size="small" sx={{ bgcolor: p.status === 'converted' ? '#10B981' : p.status === 'closed' ? '#6b7280' : '#262626', color: '#fff', fontSize: '0.7rem', textTransform: 'capitalize' }} />
                      </TableCell>
                      <TableCell sx={{ borderColor: '#262626' }}>
                        <Chip label={p.stage} size="small" sx={{ bgcolor: '#262626', color: '#9CA3AF', fontSize: '0.7rem', textTransform: 'capitalize' }} />
                      </TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem' }}>
                        {p.intel?.score != null ? <Chip label={p.intel.score} size="small" sx={{ fontFamily: 'monospace', bgcolor: '#262626', color: '#fff' }} /> : '—'}
                      </TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem' }}>{p.signals_90d_count ?? 0}</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem' }}>
                        {p.next_action_due ? dayjs(p.next_action_due).format('MM/DD') : '—'}
                      </TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem' }}>{p.owner?.preferred_name || p.owner?.name || '—'}</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem' }}>
                        {p.program_count ? `${p.program_count} programs` : ''}
                        {p.mission_id ? <Link href={`${paths.abm.missions}?id=${p.mission_id}`} onClick={(e) => e.stopPropagation()} style={{ color: '#3b82f6', marginLeft: 4 }}>Mission</Link> : null}
                      </TableCell>
                      <TableCell sx={{ borderColor: '#262626' }}>
                        <Button size="small" component={Link} href={paths.abm.pursuit(p.id)} sx={{ color: '#3b82f6', minWidth: 0 }} onClick={(e) => e.stopPropagation()}>Open</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          {!loading && total > 0 && (
            <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', mt: 1 }}>{total} pursuit{total !== 1 ? 's' : ''}</Typography>
          )}
        </CardContent>
      </Card>
      <Dialog open={createOpen} onClose={() => !createSubmitting && setCreateOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#0A0A0A', border: '1px solid #262626' } }}>
        <DialogTitle sx={{ color: '#fff' }}>New Pursuit</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Title"
            value={createTitle}
            onChange={(e) => setCreateTitle(e.target.value)}
            sx={{ mt: 1, '& .MuiInputBase-root': { bgcolor: '#0A0A0A', color: '#fff' } }}
          />
          <FormControl fullWidth sx={{ mt: 2, '& .MuiInputBase-root': { bgcolor: '#0A0A0A', color: '#fff' } }}>
            <InputLabel sx={{ color: '#9CA3AF' }}>Account</InputLabel>
            <Select value={createAccountId} label="Account" onChange={(e) => setCreateAccountId(e.target.value)} sx={{ color: '#fff' }}>
              <MenuItem value="">Select account</MenuItem>
              {accounts.map((a) => (
                <MenuItem key={a.id} value={a.id}>{a.name} ({a.domain})</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setCreateOpen(false)} disabled={createSubmitting} sx={{ color: '#9CA3AF' }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={createSubmitting || !createTitle.trim() || !createAccountId} sx={{ bgcolor: '#3b82f6' }}>{createSubmitting ? 'Creating...' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
