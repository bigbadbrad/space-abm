'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { fmtInt } from '@/lib/everself/format';
import type { KpiHeadline } from '@/lib/everself/types';

/** Matches Space GTM accent (e.g. Generate Mission Brief outlined button). */
const RATIO_TILE_ACCENT = '#8B5CF6';

const tileSx = {
  bgcolor: '#0A0A0A',
  border: '1px solid #27272F',
  borderRadius: 1,
  height: '100%',
};

function fmtMoney(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function fmtPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${(n * 100).toFixed(1)}%`;
}

function Delta({ v }: { v: number | null | undefined }): React.JSX.Element {
  if (v == null || !Number.isFinite(v)) {
    return (
      <Typography component="span" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>
        vs prior: —
      </Typography>
    );
  }
  return (
    <Typography component="span" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>
      vs prior: {fmtPct(v)}
    </Typography>
  );
}

function Tile({
  title,
  hint,
  primary,
  deltaKey,
  kpis,
  ratioAccent,
}: {
  title: string;
  hint: string;
  primary: string;
  deltaKey: keyof KpiHeadline['deltas'];
  kpis: KpiHeadline;
  /** Cost-per / ratio tiles — purple bottom edge (Space GTM accent). */
  ratioAccent?: boolean;
}): React.JSX.Element {
  return (
    <Tooltip title={hint} placement="top" arrow>
      <Card
        variant="outlined"
        sx={{
          ...tileSx,
          ...(ratioAccent ? { borderBottom: `2px solid ${RATIO_TILE_ACCENT}` } : {}),
        }}
      >
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Typography sx={{ color: '#9CA3AF', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            {title}
          </Typography>
          <Typography sx={{ color: '#F9FAFB', fontSize: '1.35rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', mt: 0.5 }}>
            {primary}
          </Typography>
          <Box sx={{ mt: 0.75 }}>
            <Delta v={kpis.deltas[deltaKey]} />
          </Box>
        </CardContent>
      </Card>
    </Tooltip>
  );
}

export function EverselfKpiTiles({ kpis }: { kpis: KpiHeadline }): React.JSX.Element {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)', lg: 'repeat(8, 1fr)' },
        gap: 1.5,
      }}
    >
      <Tile title="Spend" hint="Sum of ad spend in the selected period." primary={fmtMoney(kpis.spend)} deltaKey="spend_pct" kpis={kpis} />
      <Tile title="Leads" hint="Count of unique lead_ids with created_at in the period." primary={fmtInt(kpis.leads)} deltaKey="leads_pct" kpis={kpis} />
      <Tile title="Cost / lead" hint="Spend ÷ leads." primary={fmtMoney(kpis.cost_per_lead)} deltaKey="cpl_pct" kpis={kpis} ratioAccent />
      <Tile
        title="Booked consults"
        hint="Appointments with status booked or completed, attributed by booking grouping mode."
        primary={fmtInt(kpis.booked_consults)}
        deltaKey="booked_pct"
        kpis={kpis}
      />
      <Tile title="Cost / booked" hint="Spend ÷ booked consults." primary={fmtMoney(kpis.cost_per_booked)} deltaKey="cp_booked_pct" kpis={kpis} ratioAccent />
      <Tile title="Completed consults" hint="Appointments completed in the period (completed_at date)." primary={fmtInt(kpis.completed_consults)} deltaKey="completed_pct" kpis={kpis} />
      <Tile title="Cost / completed" hint="Spend ÷ completed consults." primary={fmtMoney(kpis.cost_per_completed)} deltaKey="cp_completed_pct" kpis={kpis} ratioAccent />
      <Tile
        title="Median days lead→book"
        hint="Median days from lead created_at to appointment booked_at (booked-date cohorts)."
        primary={kpis.median_days_lead_to_book != null ? `${kpis.median_days_lead_to_book.toFixed(1)}d` : '—'}
        deltaKey="median_lag_pct"
        kpis={kpis}
      />
    </Box>
  );
}
