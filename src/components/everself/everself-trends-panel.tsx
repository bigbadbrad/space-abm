'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { Diagnostics, MarketingRoiResponse } from '@/lib/everself/types';

const axis = { stroke: '#4B5563', fontSize: 11, fill: '#9CA3AF' };
const grid = { stroke: '#27272F' };

export function EverselfTrendsPanel({
  trend,
  diagnostics,
}: {
  trend: MarketingRoiResponse['trend'];
  diagnostics: Diagnostics;
}): React.JSX.Element {
  const [cpMode, setCpMode] = React.useState<'split' | 'total'>('split');

  const cpData = trend.map((t) => ({
    date: t.date.slice(5),
    google: t.cp_booked_google,
    meta: t.cp_booked_meta,
    total: t.cp_booked_total,
  }));

  const volData = trend.map((t) => ({
    date: t.date.slice(5),
    total: t.booked_total,
    google: t.booked_google,
    meta: t.booked_meta,
  }));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography sx={{ color: '#F9FAFB', fontWeight: 600, fontSize: '1rem' }}>Trends & diagnostics</Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
          gap: 1.5,
        }}
      >
        <DiagCard label="CPC" value={diagnostics.cpc != null ? `$${diagnostics.cpc.toFixed(2)}` : '—'} sub="Spend ÷ clicks" hide={diagnostics.cpc == null} />
        <DiagCard label="CTR" value={diagnostics.ctr != null ? `${(diagnostics.ctr * 100).toFixed(2)}%` : '—'} sub="Clicks ÷ impressions" hide={diagnostics.ctr == null} />
        <DiagCard label="Lead rate" value={diagnostics.lead_rate != null ? `${(diagnostics.lead_rate * 100).toFixed(2)}%` : '—'} sub="Leads ÷ clicks" hide={diagnostics.lead_rate == null} />
        <DiagCard label="Book rate" value={diagnostics.book_rate != null ? `${(diagnostics.book_rate * 100).toFixed(2)}%` : '—'} sub="Booked ÷ leads" hide={diagnostics.book_rate == null} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
        <Card variant="outlined" sx={{ bgcolor: '#0A0A0A', borderColor: '#27272F' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography sx={{ color: '#E5E7EB', fontWeight: 600, fontSize: '0.9rem' }}>Cost per booked consult</Typography>
              <ToggleButtonGroup size="small" value={cpMode} exclusive onChange={(_, v) => v && setCpMode(v)}>
                <ToggleButton value="split" sx={{ textTransform: 'none', color: '#9CA3AF' }}>
                  Google / Meta
                </ToggleButton>
                <ToggleButton value="total" sx={{ textTransform: 'none', color: '#9CA3AF' }}>
                  Total
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Box sx={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={cpData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid.stroke} />
                  <XAxis dataKey="date" tick={axis} />
                  <YAxis tick={axis} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }}
                    labelStyle={{ color: '#E5E7EB' }}
                  />
                  <Legend />
                  {cpMode === 'split' ? (
                    <>
                      <Line type="monotone" dataKey="google" name="Google" stroke="#60A5FA" dot={false} strokeWidth={2} connectNulls />
                      <Line type="monotone" dataKey="meta" name="Meta" stroke="#F472B6" dot={false} strokeWidth={2} connectNulls />
                    </>
                  ) : (
                    <Line type="monotone" dataKey="total" name="CP booked" stroke="#A78BFA" dot={false} strokeWidth={2} connectNulls />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ bgcolor: '#0A0A0A', borderColor: '#27272F' }}>
          <CardContent>
            <Typography sx={{ color: '#E5E7EB', fontWeight: 600, fontSize: '0.9rem', mb: 1 }}>Booked consult volume</Typography>
            <Box sx={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={volData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid.stroke} />
                  <XAxis dataKey="date" tick={axis} />
                  <YAxis tick={axis} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }}
                    labelStyle={{ color: '#E5E7EB' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="total" name="Total" stroke="#E5E7EB" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="google" name="Google" stroke="#60A5FA" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="meta" name="Meta" stroke="#F472B6" dot={false} strokeWidth={1.5} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

function DiagCard({ label, value, sub, hide }: { label: string; value: string; sub: string; hide?: boolean }): React.JSX.Element | null {
  if (hide) return null;
  return (
    <Card variant="outlined" sx={{ bgcolor: '#0A0A0A', borderColor: '#27272F' }}>
      <CardContent sx={{ py: 1.5 }}>
        <Typography sx={{ color: '#9CA3AF', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>{label}</Typography>
        <Typography sx={{ color: '#F9FAFB', fontSize: '1.1rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
        <Typography sx={{ color: '#6B7280', fontSize: '0.65rem', mt: 0.5 }}>{sub}</Typography>
      </CardContent>
    </Card>
  );
}
