'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { abmApi } from '@/lib/abm/client';

export function AdminJobs(): React.JSX.Element {
  const [status, setStatus] = React.useState<{ last_recompute_date?: string; accounts_scored_today?: number; message?: string } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [running, setRunning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await abmApi.getJobsStatus();
    if (err) setError(err);
    else setStatus(data ?? null);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleRunRecompute = async () => {
    setRunning(true);
    setError(null);
    const { data, error: err } = await abmApi.runRecompute();
    if (err) setError(err);
    else {
      setStatus((prev) => ({ ...prev, message: `Job enqueued: ${data?.jobId ?? 'OK'}` }));
      load();
    }
    setRunning(false);
  };

  return (
    <Card sx={{ bgcolor: '#0A0A0A', border: '1px solid #262626' }}>
      <CardContent>
        <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 2 }}>Jobs & Health</Typography>
        {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
        {loading ? (
          <CircularProgress size={24} sx={{ color: '#9CA3AF' }} />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography sx={{ color: '#9CA3AF' }}>Last recompute: {status?.last_recompute_date ?? '—'}</Typography>
            <Typography sx={{ color: '#9CA3AF' }}>Accounts scored: {status?.accounts_scored_today ?? 0}</Typography>
            {status?.message && <Typography sx={{ color: '#FFFFFF' }}>{status.message}</Typography>}
            <Button
              variant="contained"
              onClick={handleRunRecompute}
              disabled={running}
              sx={{ alignSelf: 'flex-start' }}
            >
              {running ? 'Running…' : 'Run recompute now'}
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
