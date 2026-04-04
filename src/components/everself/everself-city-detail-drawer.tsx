'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { X as XIcon } from '@phosphor-icons/react/dist/ssr/X';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { MarketingRoiDailyByCity } from '@/lib/everself/types';

const axis = { stroke: '#4B5563', fontSize: 11, fill: '#9CA3AF' };

export function EverselfCityDetailDrawer({
  open,
  city,
  daily,
  onClose,
}: {
  open: boolean;
  city: string | null;
  daily: MarketingRoiDailyByCity[];
  onClose: () => void;
}): React.JSX.Element {
  const rows = React.useMemo(() => (city ? daily.filter((d) => d.city === city) : []), [city, daily]);

  const byDate = React.useMemo(() => {
    const m = new Map<string, { spend: number; booked: number; google: number; meta: number }>();
    for (const r of rows) {
      if (!m.has(r.date)) m.set(r.date, { spend: 0, booked: 0, google: 0, meta: 0 });
      const x = m.get(r.date)!;
      x.spend += r.spend;
      x.booked += r.booked_consults;
      if (r.channel === 'google') x.google += r.spend;
      else x.meta += r.spend;
    }
    return Array.from(m.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({
        date: date.slice(5),
        spend: v.spend,
        booked: v.booked,
        google_share: v.spend > 0 ? v.google / v.spend : 0,
      }));
  }, [rows]);

  const channelTotals = React.useMemo(() => {
    let g = 0;
    let m = 0;
    for (const r of rows) {
      if (r.channel === 'google') g += r.spend;
      else m += r.spend;
    }
    return [
      { name: 'google', spend: g },
      { name: 'meta', spend: m },
    ];
  }, [rows]);

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, bgcolor: '#050505', borderLeft: '1px solid #27272F' } }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ color: '#F9FAFB', fontWeight: 700, fontSize: '1.05rem' }}>{city ?? 'City'}</Typography>
        <IconButton onClick={onClose} sx={{ color: '#9CA3AF' }} aria-label="Close">
          <XIcon size={22} />
        </IconButton>
      </Box>
      <Box sx={{ px: 2, pb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Spend & booked (daily)</Typography>
        <Box sx={{ width: '100%', height: 220 }}>
          <ResponsiveContainer>
            <LineChart data={byDate}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272F" />
              <XAxis dataKey="date" tick={axis} />
              <YAxis yAxisId="left" tick={axis} />
              <YAxis yAxisId="right" orientation="right" tick={axis} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="spend" name="Spend" stroke="#60A5FA" dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="booked" name="Booked" stroke="#A78BFA" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Channel spend split</Typography>
        <Box sx={{ width: '100%', height: 200 }}>
          <ResponsiveContainer>
            <BarChart data={channelTotals}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272F" />
              <XAxis dataKey="name" tick={axis} />
              <YAxis tick={axis} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }} />
              <Bar dataKey="spend" fill="#34D399" name="Spend" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Drawer>
  );
}
