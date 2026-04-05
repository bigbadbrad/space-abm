'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';

import { fmtInt } from '@/lib/everself/format';
import type { ChannelPeriodAggregate, CityPeriodAggregate, KpiHeadline } from '@/lib/everself/types';

function Stage({
  label,
  count,
  rate,
}: {
  label: string;
  count: number;
  rate?: string;
}): React.JSX.Element {
  return (
    <Box
      sx={{
        py: 2,
        px: 2,
        borderRadius: 1,
        border: '1px solid #27272F',
        bgcolor: '#0A0A0A',
        textAlign: 'center',
      }}
    >
      <Typography sx={{ color: '#9CA3AF', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>{label}</Typography>
      <Typography sx={{ color: '#F9FAFB', fontSize: '1.5rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{fmtInt(count)}</Typography>
      {rate ? (
        <Typography sx={{ color: '#6B7280', fontSize: '0.7rem', mt: 0.5 }}>{rate}</Typography>
      ) : null}
    </Box>
  );
}

function sumClicks(rows: { clicks?: number }[]): number {
  return rows.reduce((s, r) => s + (r.clicks ?? 0), 0);
}

export function EverselfFunnelExplorer({
  kpis,
  byCity,
  byChannel,
}: {
  kpis: KpiHeadline;
  byCity: CityPeriodAggregate[];
  byChannel: ChannelPeriodAggregate[];
}): React.JSX.Element {
  const [mode, setMode] = React.useState<'channel' | 'city'>('channel');

  const top = kpis;
  const headlineClicks =
    typeof top.clicks === 'number' && !Number.isNaN(top.clicks)
      ? top.clicks
      : sumClicks(byCity.length ? byCity : byChannel);
  const c2l = headlineClicks > 0 ? (top.leads / headlineClicks) * 100 : 0;
  const l2b = top.leads > 0 ? (top.booked_consults / top.leads) * 100 : 0;
  const b2c = top.booked_consults > 0 ? (top.completed_consults / top.booked_consults) * 100 : 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
        <Typography sx={{ color: '#F9FAFB', fontWeight: 600, fontSize: '1rem' }}>Funnel explorer</Typography>
        <ToggleButtonGroup size="small" value={mode} exclusive onChange={(_, v) => v && setMode(v)}>
          <ToggleButton value="channel" sx={{ textTransform: 'none', color: '#9CA3AF' }}>
            By channel
          </ToggleButton>
          <ToggleButton value="city" sx={{ textTransform: 'none', color: '#9CA3AF' }}>
            By city
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 1.5,
          mb: 2,
        }}
      >
        <Stage
          label="Clicks"
          count={headlineClicks}
          rate={headlineClicks > 0 ? `${c2l.toFixed(1)}% to leads` : undefined}
        />
        <Stage label="Leads" count={top.leads} />
        <Stage label="Booked consults" count={top.booked_consults} rate={top.leads > 0 ? `${l2b.toFixed(1)}% of leads` : undefined} />
        <Stage
          label="Completed consults"
          count={top.completed_consults}
          rate={top.booked_consults > 0 ? `${b2c.toFixed(1)}% of booked` : undefined}
        />
      </Box>

      {mode === 'channel' ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
          {byChannel.map((c) => (
            <FunnelSlice
              key={c.channel}
              title={c.channel}
              clicks={c.clicks}
              leads={c.leads}
              booked={c.booked_consults}
              completed={c.completed_consults}
            />
          ))}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {byCity.slice(0, 8).map((c) => (
            <FunnelSlice
              key={c.city}
              title={c.city}
              clicks={c.clicks}
              leads={c.leads}
              booked={c.booked_consults}
              completed={c.completed_consults}
              compact
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

function FunnelSlice({
  title,
  clicks,
  leads,
  booked,
  completed,
  compact,
}: {
  title: string;
  clicks: number;
  leads: number;
  booked: number;
  completed: number;
  compact?: boolean;
}): React.JSX.Element {
  const c2l = clicks > 0 ? (leads / clicks) * 100 : 0;
  const l2b = leads > 0 ? (booked / leads) * 100 : 0;
  const b2c = booked > 0 ? (completed / booked) * 100 : 0;
  return (
    <Box
      sx={{
        p: compact ? 1.5 : 2,
        borderRadius: 1,
        border: '1px solid #27272F',
        bgcolor: '#050505',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: 1,
        alignItems: 'center',
      }}
    >
      <Typography sx={{ color: '#E5E7EB', fontWeight: 600, fontSize: compact ? '0.8rem' : '0.9rem', gridColumn: { xs: '1 / -1', md: 'auto' } }}>
        {title}
      </Typography>
      <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
        Clk {fmtInt(clicks)}
        {clicks > 0 ? ` (${c2l < 1 ? c2l.toFixed(1) : c2l.toFixed(0)}%→L)` : ''}
      </Typography>
      <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
        L {fmtInt(leads)} → B {fmtInt(booked)} ({l2b.toFixed(0)}%)
      </Typography>
      <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
        C {fmtInt(completed)} ({b2c.toFixed(0)}% of booked)
      </Typography>
    </Box>
  );
}
