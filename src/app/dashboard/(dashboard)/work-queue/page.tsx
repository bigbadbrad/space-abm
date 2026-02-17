'use client';

import * as React from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import dayjs from 'dayjs';

import { paths } from '@/paths';
import { abmApi, type ABMMissionTask } from '@/lib/abm/client';
import { formatLaneDisplayName } from '@/components/abm/layout/config';

export default function WorkQueuePage(): React.JSX.Element {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [overdue, setOverdue] = React.useState<{ task: ABMMissionTask; mission: { id: string; title: string } | null }[]>([]);
  const [dueSoon, setDueSoon] = React.useState<{ task: ABMMissionTask; mission: { id: string; title: string } | null }[]>([]);
  const [missionsQual, setMissionsQual] = React.useState<any[]>([]);

  React.useEffect(() => {
    setLoading(true);
    abmApi.getWorkQueue().then((res) => {
      if (res.error) setError(res.error);
      else if (res.data) {
        setOverdue(res.data.overdue_tasks || []);
        setDueSoon(res.data.due_soon_tasks || []);
        setMissionsQual(res.data.missions_needing_qualification || []);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress sx={{ color: '#9CA3AF' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography sx={{ color: '#FFFFFF', fontSize: '1.5rem', fontWeight: 600 }}>Work Queue</Typography>
      {error && <Typography sx={{ color: '#EF4444' }}>{error}</Typography>}

      <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626' }}>
        <CardContent>
          <Typography sx={{ color: '#F59E0B', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', mb: 1 }}>Overdue Tasks</Typography>
          {overdue.length === 0 ? (
            <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>None</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {overdue.map(({ task, mission }) => (
                <Box key={task.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, borderBottom: '1px solid #262626' }}>
                  <Typography sx={{ color: '#E5E7EB', fontSize: '0.875rem', flex: 1 }}>{task.title}</Typography>
                  <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem' }}>Due {task.due_at ? dayjs(task.due_at).format('MM/DD') : '—'}</Typography>
                  {mission && (
                    <Button size="small" component={Link} href={`${paths.abm.missions}?id=${mission.id}`} sx={{ color: '#3b82f6', minWidth: 0 }}>
                      Open Mission →
                    </Button>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626' }}>
        <CardContent>
          <Typography sx={{ color: '#10B981', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', mb: 1 }}>Due Soon (next 7 days)</Typography>
          {dueSoon.length === 0 ? (
            <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>None</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {dueSoon.map(({ task, mission }) => (
                <Box key={task.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, borderBottom: '1px solid #262626' }}>
                  <Typography sx={{ color: '#E5E7EB', fontSize: '0.875rem', flex: 1 }}>{task.title}</Typography>
                  <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem' }}>Due {task.due_at ? dayjs(task.due_at).format('MM/DD') : '—'}</Typography>
                  {mission && (
                    <Button size="small" component={Link} href={`${paths.abm.missions}?id=${mission.id}`} sx={{ color: '#3b82f6', minWidth: 0 }}>
                      Open Mission →
                    </Button>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626' }}>
        <CardContent>
          <Typography sx={{ color: '#3b82f6', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', mb: 1 }}>Missions needing qualification</Typography>
          {missionsQual.length === 0 ? (
            <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>None</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {missionsQual.map((m) => (
                <Box key={m.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, borderBottom: '1px solid #262626' }}>
                  <Typography sx={{ color: '#E5E7EB', fontSize: '0.875rem', flex: 1 }}>{formatLaneDisplayName(m.title)}</Typography>
                  <Chip label={m.stage || 'new'} size="small" sx={{ bgcolor: '#262626', color: '#fff', fontSize: '0.65rem' }} />
                  {m.service_lane && <Chip label={formatLaneDisplayName(m.service_lane)} size="small" sx={{ bgcolor: '#262626', color: '#9CA3AF', fontSize: '0.65rem' }} />}
                  <Button size="small" component={Link} href={`${paths.abm.missions}?id=${m.id}`} sx={{ color: '#3b82f6', minWidth: 0 }}>
                    Open →
                  </Button>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
