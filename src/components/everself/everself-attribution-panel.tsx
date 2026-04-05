'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { fmtInt } from '@/lib/everself/format';
import type { DemoAttributionExtras } from '@/lib/everself/everself-demo-attribution';
import type { Diagnostics } from '@/lib/everself/types';

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function EverselfAttributionPanel({
  d,
  demo,
}: {
  d: Diagnostics;
  /** Client-only: appointment ↔ lead join quality after optional demo sync. */
  demo?: DemoAttributionExtras | null;
}): React.JSX.Element {
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
        <MiniCard
          title="Click-ID coverage (leads)"
          value={pct(d.leads_with_any_click_id_pct)}
          sub="Any platform click ID present"
          tooltip="Click-ID coverage: % of leads with platform click identifiers (Google: gclid/wbraid/gbraid; Meta: fbclid/fbp/fbc)."
        />
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

      {demo ? (
        <Box sx={{ mt: 3 }}>
          <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', mb: 1.5 }}>
            Ops join quality (Demo · full appointment dataset)
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, 1fr)' },
              gap: 1.5,
            }}
          >
            <MiniCard
              title="Match rate"
              value={pct(demo.match_rate)}
              sub="% of appointment rows joined to a lead via lead_id"
              tooltip="Match rate: share of appointment records where lead_id is present and exists in the leads dataset."
            />
            <MiniCard title="Unmatched appointments" value={fmtInt(demo.unmatched_count)} sub="Missing lead_id or ID not in leads" />
            <MiniCard title="Missing lead_id" value={fmtInt(demo.missing_lead_id_count)} sub="Ops row has no join key" />
            <MiniCard title="Lead ID not found" value={fmtInt(demo.lead_not_found_count)} sub="Stale or mistyped ID" />
            <MiniCard
              title="Google offline-ready (completed)"
              value={demo.google_offline_ready_pct != null ? pct(demo.google_offline_ready_pct) : '—'}
              sub="Matched completed with gclid / wbraid / gbraid"
            />
            <MiniCard
              title="Meta offline-ready (completed)"
              value={demo.meta_offline_ready_pct != null ? pct(demo.meta_offline_ready_pct) : '—'}
              sub="Matched completed with fbclid / fbp / fbc"
            />
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}

function MiniCard({
  title,
  value,
  sub,
  tooltip,
}: {
  title: string;
  value: string;
  sub: string;
  tooltip?: string;
}): React.JSX.Element {
  const titleEl = (
    <Typography sx={{ color: '#9CA3AF', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>{title}</Typography>
  );
  return (
    <Card variant="outlined" sx={{ bgcolor: '#0A0A0A', borderColor: '#27272F' }}>
      <CardContent sx={{ py: 1.5 }}>
        {tooltip ? (
          <Tooltip title={tooltip} arrow placement="top">
            <Box component="span" sx={{ display: 'block', cursor: 'help' }}>
              {titleEl}
            </Box>
          </Tooltip>
        ) : (
          titleEl
        )}
        <Typography sx={{ color: '#F9FAFB', fontSize: '1.15rem', fontWeight: 700, mt: 0.5 }}>{value}</Typography>
        <Typography sx={{ color: '#6B7280', fontSize: '0.65rem', mt: 0.5 }}>{sub}</Typography>
      </CardContent>
    </Card>
  );
}
