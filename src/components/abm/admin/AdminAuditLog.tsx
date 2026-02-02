'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import { abmApi } from '@/lib/abm/client';
import dayjs from 'dayjs';

export function AdminAuditLog(): React.JSX.Element {
  const [items, setItems] = React.useState<any[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [tableFilter, setTableFilter] = React.useState<string>('');

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await abmApi.getAuditLog({ limit: 50, offset: 0, table_name: tableFilter || undefined });
    if (err) setError(err);
    else if (data) {
      setItems(data.items || []);
      setTotal(data.total ?? 0);
    }
    setLoading(false);
  }, [tableFilter]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <Card sx={{ bgcolor: '#0A0A0A', border: '1px solid #262626' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#FFFFFF' }}>Audit Log</Typography>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel sx={{ color: '#9CA3AF' }}>Table</InputLabel>
            <Select
              value={tableFilter}
              label="Table"
              onChange={(e) => setTableFilter(e.target.value)}
              sx={{ color: '#FFFFFF', borderColor: '#262626' }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="abm_event_rules">Event Rules</MenuItem>
              <MenuItem value="abm_prompt_templates">Prompt Templates</MenuItem>
              <MenuItem value="abm_score_configs">Score Configs</MenuItem>
              <MenuItem value="abm_score_weights">Score Weights</MenuItem>
            </Select>
          </FormControl>
        </Box>
        {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
        {loading ? (
          <Typography color="text.secondary">Loading…</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem' }}>Time</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem' }}>Action</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem' }}>Table</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem' }}>Record ID</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem' }}>Changes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ color: '#9CA3AF', borderColor: '#262626', textAlign: 'center', py: 3 }}>No audit entries</TableCell>
                </TableRow>
              ) : (
                items.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{dayjs(r.created_at).format('MM/DD HH:mm')}</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', borderColor: '#262626', fontSize: '0.75rem' }}>{r.action}</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem' }}>{r.table_name}</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.record_id || '—'}</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.7rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.after_json ? 'updated' : r.before_json ? 'deleted' : 'created'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
