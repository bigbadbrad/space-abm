'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { ChartLine as ChartLineIcon } from '@phosphor-icons/react/dist/ssr/ChartLine';

import { EverselfFiltersBar, defaultEverselfFilters, type EverselfFiltersState } from '@/components/everself/everself-filters-bar';
import { everselfFieldSx } from '@/components/everself/everself-field-sx';
import { fmtInt } from '@/lib/everself/format';
import { leadHasAnyClickId } from '@/lib/everself/metrics';
import { leadInFilters } from '@/lib/everself/everself-demo-filtering';
import type { LeadRow } from '@/lib/everself/types';

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function EverselfLeadsPage(): React.JSX.Element {
  const [filters, setFilters] = React.useState<EverselfFiltersState>(defaultEverselfFilters);
  const [search, setSearch] = React.useState('');
  const [raw, setRaw] = React.useState<LeadRow[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let c = false;
    (async () => {
      try {
        const res = await fetch('/demo/everself/leads.json');
        if (!res.ok) throw new Error('Failed to load leads');
        const data = (await res.json()) as LeadRow[];
        if (!c) setRaw(data);
      } catch (e) {
        if (!c) setError(e instanceof Error ? e.message : 'Failed to load');
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const availableCities = React.useMemo(() => {
    const s = new Set((raw ?? []).map((l) => l.city).filter(Boolean));
    return Array.from(s).sort();
  }, [raw]);

  const filtered = React.useMemo(() => {
    if (!raw) return [];
    return raw.filter((l) => leadInFilters(l, filters, { search }));
  }, [raw, filters, search]);

  const qa = React.useMemo(() => {
    const n = filtered.length;
    if (n === 0) {
      return {
        n: 0,
        missingCity: 0,
        missingChannel: 0,
        missingCampaign: 0,
        missingAllClick: 0,
      };
    }
    let missingCity = 0;
    let missingChannel = 0;
    let missingCampaign = 0;
    let missingAllClick = 0;
    for (const l of filtered) {
      if (!l.city?.trim()) missingCity += 1;
      if (!l.channel) missingChannel += 1;
      if (!(l.utm_campaign ?? '').trim()) missingCampaign += 1;
      if (!leadHasAnyClickId(l)) missingAllClick += 1;
    }
    return { n, missingCity, missingChannel, missingCampaign, missingAllClick };
  }, [filtered]);

  if (error) {
    return (
      <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3 }}>
        <Typography sx={{ color: '#F87171' }}>{error}</Typography>
      </Box>
    );
  }

  if (!raw) {
    return (
      <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#9CA3AF' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <ChartLineIcon size={20} style={{ color: '#FFFFFF' }} />
            <Typography sx={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600 }}>Leads</Typography>
          </Box>
          <Typography sx={{ color: '#9CA3AF', fontSize: '0.8125rem', mt: 0.5 }}>
            Marketing receipt at lead time (Demo) — UTMs, click IDs, and <code style={{ color: '#E5E7EB' }}>lead_id</code>
          </Typography>
        </Box>
      </Box>

      <EverselfFiltersBar value={filters} onChange={setFilters} availableCities={availableCities} onApply={() => {}} />

      <Box sx={{ mt: 2, mb: 2, maxWidth: 360 }}>
        <TextField
          size="small"
          fullWidth
          label="Search lead_id"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={everselfFieldSx}
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 1.5,
          mb: 3,
        }}
      >
        <QACard title="% missing city" value={qa.n ? pct(qa.missingCity / qa.n) : '—'} />
        <QACard title="% missing channel" value={qa.n ? pct(qa.missingChannel / qa.n) : '—'} />
        <QACard title="% missing utm_campaign" value={qa.n ? pct(qa.missingCampaign / qa.n) : '—'} />
        <QACard title="% missing all click IDs" value={qa.n ? pct(qa.missingAllClick / qa.n) : '—'} />
      </Box>

      <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', mb: 1 }}>
        Showing {fmtInt(filtered.length)} leads in range
      </Typography>

      <TableContainer sx={{ border: '1px solid #27272F', borderRadius: 1, bgcolor: '#0A0A0A' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#9CA3AF', fontWeight: 600 }}>Date</TableCell>
              <TableCell sx={{ color: '#9CA3AF', fontWeight: 600 }}>City</TableCell>
              <TableCell sx={{ color: '#9CA3AF', fontWeight: 600 }}>Channel</TableCell>
              <TableCell sx={{ color: '#9CA3AF', fontWeight: 600 }}>Campaign</TableCell>
              <TableCell sx={{ color: '#9CA3AF', fontWeight: 600 }}>Click IDs</TableCell>
              <TableCell sx={{ color: '#9CA3AF', fontWeight: 600 }}>lead_id</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.slice(0, 500).map((l) => (
              <TableRow key={l.lead_id} hover sx={{ '& td': { color: '#E5E7EB', borderColor: '#27272F' } }}>
                <TableCell>{l.date ?? l.created_at.slice(0, 10)}</TableCell>
                <TableCell>{l.city || '—'}</TableCell>
                <TableCell sx={{ textTransform: 'capitalize' }}>{l.channel}</TableCell>
                <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {(l.utm_source ?? '—') + ' / ' + (l.utm_medium ?? '—')}
                  <Typography component="span" sx={{ display: 'block', fontSize: '0.7rem', color: '#9CA3AF' }}>
                    {l.utm_campaign ?? '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  {leadHasAnyClickId(l) ? (
                    <Chip size="small" label={l.channel === 'google' ? 'Google' : 'Meta'} sx={{ height: 22, fontSize: '0.7rem' }} />
                  ) : (
                    <Typography sx={{ color: '#6B7280', fontSize: '0.8rem' }}>None</Typography>
                  )}
                </TableCell>
                <TableCell sx={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }}>{l.lead_id}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {filtered.length > 500 ? (
        <Typography sx={{ color: '#6B7280', fontSize: '0.75rem', mt: 1 }}>Demo table capped at 500 rows.</Typography>
      ) : null}
    </Box>
  );
}

function QACard({ title, value }: { title: string; value: string }): React.JSX.Element {
  return (
    <Card variant="outlined" sx={{ bgcolor: '#0A0A0A', borderColor: '#27272F' }}>
      <CardContent sx={{ py: 1.5 }}>
        <Typography sx={{ color: '#9CA3AF', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>{title}</Typography>
        <Typography sx={{ color: '#F9FAFB', fontSize: '1.1rem', fontWeight: 700, mt: 0.5 }}>{value}</Typography>
      </CardContent>
    </Card>
  );
}
