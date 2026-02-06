'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Drawer from '@mui/material/Drawer';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { abmApi } from '@/lib/abm/client';
import type { ABMScoreConfig, ABMScoreWeight } from '@/lib/abm/client';
import dayjs from 'dayjs';

export function AdminScoringModels(): React.JSX.Element {
  const [configs, setConfigs] = React.useState<ABMScoreConfig[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [selectedConfig, setSelectedConfig] = React.useState<ABMScoreConfig | null>(null);
  const [weights, setWeights] = React.useState<ABMScoreWeight[]>([]);
  const [weightsLoading, setWeightsLoading] = React.useState(false);
  const [activating, setActivating] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await abmApi.getScoreConfigs();
    if (err) setError(err);
    else if (data?.configs) setConfigs(data.configs);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const openConfig = async (c: ABMScoreConfig) => {
    setSelectedConfig(c);
    setDrawerOpen(true);
    setWeightsLoading(true);
    const { data } = await abmApi.getScoreWeights(c.id);
    setWeights(data?.weights || []);
    setWeightsLoading(false);
  };

  const handleCreateDraft = async () => {
    const { data, error: err } = await abmApi.postScoreConfig({ name: `draft_${Date.now()}` });
    if (err) setError(err);
    else if (data?.config) {
      load();
      openConfig(data.config);
    }
  };

  const handleActivate = async (id: string) => {
    setActivating(id);
    const { error: err } = await abmApi.activateScoreConfig(id);
    if (err) setError(err);
    else load();
    setActivating(null);
  };

  return (
    <Card sx={{ bgcolor: '#0A0A0A', border: '1px solid #262626' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#FFFFFF' }}>Scoring Models</Typography>
          <Button variant="contained" size="small" onClick={handleCreateDraft}>Create new draft from active</Button>
        </Box>
        {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
        {loading ? (
          <Typography color="text.secondary">Loading…</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Name</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Status</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>lambda_decay</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>normalize_k</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Updated</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {configs.map((c) => (
                <TableRow key={c.id} hover onClick={() => openConfig(c)} sx={{ cursor: 'pointer' }}>
                  <TableCell sx={{ color: '#FFFFFF', borderColor: '#262626' }}>{c.name}</TableCell>
                  <TableCell sx={{ borderColor: '#262626' }}><Chip label={c.status} size="small" color={c.status === 'active' ? 'success' : 'default'} sx={{ fontSize: '0.7rem' }} /></TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontFamily: 'monospace', fontSize: '0.8rem' }}>{c.lambda_decay}</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontFamily: 'monospace', fontSize: '0.8rem' }}>{c.normalize_k}</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem' }}>{c.updated_at ? dayjs(c.updated_at).format('MM/DD') : '—'}</TableCell>
                  <TableCell sx={{ borderColor: '#262626' }} onClick={(e) => e.stopPropagation()}>
                    {c.status !== 'active' && (
                      <Button size="small" variant="outlined" disabled={!!activating} onClick={() => handleActivate(c.id)} sx={{ borderColor: '#262626', color: '#3b82f6', fontSize: '0.75rem' }}>
                        Activate
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {configs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ color: '#9CA3AF', borderColor: '#262626', textAlign: 'center', py: 3 }}>No configs. Run seed:abm first.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{ sx: { bgcolor: '#050505', borderLeft: '1px solid #262626' } }}
        >
          <Box sx={{ width: 500, p: 3, overflow: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#FFFFFF' }}>{selectedConfig?.name ?? 'Config'}</Typography>
            {weightsLoading ? (
              <Typography color="text.secondary">Loading weights…</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem' }}>Event</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem' }}>Content Type</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem' }}>CTA ID</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem' }}>Weight</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {weights.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell sx={{ color: '#FFFFFF', borderColor: '#262626', fontSize: '0.8rem' }}>{w.event_name}</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem' }}>{w.content_type || '—'}</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem' }}>{w.cta_id || '—'}</TableCell>
                      <TableCell sx={{ color: '#FFFFFF', borderColor: '#262626', fontSize: '0.8rem', fontFamily: 'monospace' }}>{w.weight}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        </Drawer>
      </CardContent>
    </Card>
  );
}
