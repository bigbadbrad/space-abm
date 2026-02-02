'use client';

import * as React from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import dayjs from 'dayjs';

import { paths } from '@/paths';
import { abmApi } from '@/lib/abm/client';
import { useABMFilters } from '@/contexts/abm-filter-context';
import { LANE_OPTIONS } from '@/components/abm/layout/config';

export default function ABMLanesPage(): React.JSX.Element {
  const { filters } = useABMFilters();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [lanes, setLanes] = React.useState<{ lane: string; hot_count: number; surging_count: number }[]>([]);
  const [selectedLane, setSelectedLane] = React.useState<string | null>(null);
  const [accounts, setAccounts] = React.useState<any[]>([]);
  const [explainer, setExplainer] = React.useState<{
    why_trending: string;
    top_content: { name: string; score: number }[];
    top_lead_requests: any[];
  } | null>(null);
  const [accountsLoading, setAccountsLoading] = React.useState(false);
  const [explainerLoading, setExplainerLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    abmApi.getLanes({ range: filters.range }).then((res) => {
      if (cancelled) return;
      if (res.error) setError(res.error);
      else if (res.data) setLanes(res.data.lanes || []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [filters.range]);

  const laneNames = React.useMemo(() => {
    const fromApi = lanes.map((l) => l.lane);
    const extra = LANE_OPTIONS.filter((o) => o !== 'All' && o !== 'Other' && !fromApi.includes(o));
    return [...fromApi, ...extra].filter(Boolean);
  }, [lanes]);

  React.useEffect(() => {
    if (!selectedLane && laneNames.length) setSelectedLane(laneNames[0]);
  }, [laneNames, selectedLane]);

  React.useEffect(() => {
    if (!selectedLane) {
      setAccounts([]);
      setExplainer(null);
      return;
    }
    let cancelled = false;
    setAccountsLoading(true);
    setExplainerLoading(true);
    Promise.all([
      abmApi.getAccounts({ lane: selectedLane, range: filters.range, limit: 100 }),
      abmApi.getLaneExplainer({ lane: selectedLane, range: filters.range }),
    ]).then(([accountsRes, explainerRes]) => {
      if (cancelled) return;
      if (accountsRes.data) setAccounts(accountsRes.data.accounts || []);
      if (explainerRes.data) setExplainer(explainerRes.data);
      setAccountsLoading(false);
      setExplainerLoading(false);
    });
    return () => { cancelled = true; };
  }, [selectedLane, filters.range]);

  if (loading) {
    return (
      <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#9CA3AF' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3 }}>
      {error && <Typography sx={{ color: '#EF4444', mb: 2 }}>{error}</Typography>}
      <Typography sx={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600, mb: 3 }}>Service Lanes</Typography>

      <Box sx={{ mb: 3 }}>
        <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', mb: 1.5 }}>Select lane</Typography>
        <ToggleButtonGroup
          value={selectedLane || ''}
          exclusive
          onChange={(_, v) => v && setSelectedLane(v)}
          sx={{
            flexWrap: 'wrap',
            gap: 1,
            '& .MuiToggleButtonGroup-grouped': { border: 0 },
            '& .MuiToggleButton-root': {
              color: '#9CA3AF',
              border: '1px solid #262626',
              borderRadius: '8px !important',
              px: 2,
              py: 1,
              '&.Mui-selected': { color: '#3b82f6', borderColor: '#3b82f6', bgcolor: 'rgba(59,130,246,0.08)' },
              '&:hover': { borderColor: '#525252', bgcolor: 'rgba(255,255,255,0.04)' },
            },
          }}
        >
          {laneNames.map((name) => (
            <ToggleButton key={name} value={name}>
              {name}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {selectedLane && (
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
          <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', flex: 1, minWidth: 0 }}>
            <CardContent>
              <Typography sx={{ color: '#FFFFFF', fontSize: '1.125rem', fontWeight: 600, mb: 2 }}>
                Accounts in {selectedLane}
                {explainer?.why_trending && (
                  <Typography component="span" sx={{ color: '#9CA3AF', fontSize: '0.875rem', fontWeight: 400, ml: 1 }}>
                    ({explainer.why_trending})
                  </Typography>
                )}
              </Typography>
              {accountsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress size={32} sx={{ color: '#9CA3AF' }} />
                </Box>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Account</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Lane score (7d)</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Surge</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {accounts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} sx={{ color: '#9CA3AF', borderColor: '#262626', textAlign: 'center', py: 4 }}>
                          No accounts with activity in this lane
                        </TableCell>
                      </TableRow>
                    ) : (
                      accounts.map((a: any) => (
                        <TableRow key={a.id}>
                          <TableCell sx={{ color: '#FFFFFF', borderColor: '#262626', fontSize: '0.875rem' }}>{a.name || a.domain}</TableCell>
                          <TableCell sx={{ borderColor: '#262626' }}>
                            <Chip label={a.lane_score_7d ?? a.intent_score ?? '—'} size="small" sx={{ fontFamily: 'monospace', bgcolor: '#262626', color: '#fff' }} />
                          </TableCell>
                          <TableCell sx={{ borderColor: '#262626' }}>
                            <Chip label={a.surge_level || 'Normal'} size="small" sx={{ bgcolor: '#262626', color: '#fff', fontSize: '0.75rem' }} />
                          </TableCell>
                          <TableCell sx={{ borderColor: '#262626' }}>
                            <Button component={Link} href={paths.abm.account(String(a.id))} size="small" sx={{ color: '#3b82f6' }}>View</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', width: { xs: '100%', lg: 320 }, flexShrink: 0 }}>
            <CardContent>
              <Typography sx={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 600, mb: 2 }}>Lane Explainer</Typography>
              {explainerLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={24} sx={{ color: '#9CA3AF' }} />
                </Box>
              ) : explainer ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography sx={{ color: '#9CA3AF', fontSize: '0.7rem', fontWeight: 500, textTransform: 'uppercase', mb: 0.5 }}>Why trending</Typography>
                    <Typography sx={{ color: '#FFFFFF', fontSize: '0.875rem' }}>{explainer.why_trending}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ color: '#9CA3AF', fontSize: '0.7rem', fontWeight: 500, textTransform: 'uppercase', mb: 0.5 }}>Top content driving score</Typography>
                    {explainer.top_content?.length ? (
                      <Box component="ul" sx={{ m: 0, p: 0, pl: 2, listStyle: 'none' }}>
                        {explainer.top_content.slice(0, 5).map((c, i) => (
                          <Box key={i} component="li" sx={{ display: 'flex', justifyContent: 'space-between', py: 0.25, fontSize: '0.8rem' }}>
                            <Typography sx={{ color: '#FFFFFF' }}>{c.name}</Typography>
                            <Typography sx={{ color: '#9CA3AF', fontFamily: 'monospace' }}>{c.score}</Typography>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography sx={{ color: '#6b7280', fontSize: '0.8rem' }}>No data</Typography>
                    )}
                  </Box>
                  <Box>
                    <Typography sx={{ color: '#9CA3AF', fontSize: '0.7rem', fontWeight: 500, textTransform: 'uppercase', mb: 0.5 }}>Top lead requests</Typography>
                    {explainer.top_lead_requests?.length ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {explainer.top_lead_requests.slice(0, 5).map((lr: any) => (
                          <Button
                            key={lr.id}
                            component={Link}
                            href={`${paths.abm.leadRequests}?id=${lr.id}`}
                            size="small"
                            sx={{ justifyContent: 'flex-start', color: '#3b82f6', textTransform: 'none', fontSize: '0.8rem' }}
                          >
                            {lr.organization_name || lr.organization_domain || `Lead #${lr.id}`}
                          </Button>
                        ))}
                        <Button component={Link} href={paths.abm.leadRequests} size="small" sx={{ color: '#9CA3AF', fontSize: '0.75rem', mt: 0.5 }}>View all</Button>
                      </Box>
                    ) : (
                      <Typography sx={{ color: '#6b7280', fontSize: '0.8rem' }}>No lead requests in this lane</Typography>
                    )}
                  </Box>
                </Box>
              ) : (
                <Typography sx={{ color: '#6b7280', fontSize: '0.875rem' }}>Select a lane to see explainer</Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {!selectedLane && laneNames.length === 0 && (
        <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>No lanes available. Ensure data exists for the selected range.</Typography>
      )}
    </Box>
  );
}
