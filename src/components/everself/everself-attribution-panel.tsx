'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

import { fmtInt } from '@/lib/everself/format';
import type { Diagnostics } from '@/lib/everself/types';

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function EverselfAttributionPanel({ d }: { d: Diagnostics }): React.JSX.Element {
  return (
    <Box>
      <Typography sx={{ color: '#F9FAFB', fontWeight: 600, fontSize: '1rem', mb: 1.5 }}>Attribution confidence</Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, 1fr)' },
          gap: 1.5,
        }}
      >
        <MiniCard title="Leads w/ click ID" value={pct(d.leads_with_any_click_id_pct)} sub="Any platform click ID present" />
        <MiniCard
          title="Google click IDs"
          value={d.google_click_id_coverage_pct != null ? pct(d.google_click_id_coverage_pct) : '—'}
          sub="gclid / wbraid / gbraid (Google leads)"
        />
        <MiniCard
          title="Meta click IDs"
          value={d.meta_click_id_coverage_pct != null ? pct(d.meta_click_id_coverage_pct) : '—'}
          sub="fbclid / fbp / fbc (Meta leads)"
        />
        <MiniCard title="Unattributed leads" value={fmtInt(d.unattributed_leads)} sub="No click IDs and no utm_source+utm_campaign" />
        <MiniCard title="Missing city" value={pct(d.pct_leads_missing_city)} sub="Field-level QA" />
        <MiniCard title="Missing channel" value={pct(d.pct_leads_missing_channel)} sub="Field-level QA" />
        <MiniCard title="Missing campaign_id" value={pct(d.pct_leads_missing_campaign_id)} sub="Field-level QA" />
      </Box>
    </Box>
  );
}

function MiniCard({ title, value, sub }: { title: string; value: string; sub: string }): React.JSX.Element {
  return (
    <Card variant="outlined" sx={{ bgcolor: '#0A0A0A', borderColor: '#27272F' }}>
      <CardContent sx={{ py: 1.5 }}>
        <Typography sx={{ color: '#9CA3AF', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>{title}</Typography>
        <Typography sx={{ color: '#F9FAFB', fontSize: '1.15rem', fontWeight: 700, mt: 0.5 }}>{value}</Typography>
        <Typography sx={{ color: '#6B7280', fontSize: '0.65rem', mt: 0.5 }}>{sub}</Typography>
      </CardContent>
    </Card>
  );
}
