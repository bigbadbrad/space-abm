'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import dayjs from 'dayjs';

import { paths } from '@/paths';
import { abmApi, type ABMPursuitDetailResponse } from '@/lib/abm/client';

export default function ABMPursuitDetailPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [detail, setDetail] = React.useState<ABMPursuitDetailResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [intelRunning, setIntelRunning] = React.useState(false);

  const fetchDetail = React.useCallback(() => {
    if (!id) return;
    setLoading(true);
    abmApi.getPursuit(id).then((res) => {
      if (res.data) setDetail(res.data);
      setLoading(false);
    });
  }, [id]);

  React.useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleRunIntel = () => {
    if (!id) return;
    setIntelRunning(true);
    abmApi.postPursuitIntelRun(id).then((res) => {
      setIntelRunning(false);
      if (res.data?.snapshot) {
        const snapshot = res.data.snapshot;
        const intel_latest = {
          ...snapshot,
          score_components: snapshot.score_components_json || {},
          bullets: snapshot.bullets_json || [],
          partners: snapshot.partners_json || [],
          outreach: snapshot.outreach_json || {},
          provenance: snapshot.provenance_json || [],
        };
        setDetail((prev) => prev ? { ...prev, intel_latest } : null);
      } else if (res.error) {
        alert(res.error);
      }
    });
  };

  const handleConvertToMission = () => {
    if (!id) return;
    abmApi.postPursuitConvertToMission(id).then((res) => {
      if (res.data?.mission) router.push(`${paths.abm.missions}?id=${res.data.mission.id}`);
      else if (res.error) alert(res.error);
    });
  };

  if (!id || loading) {
    return (
      <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#9CA3AF' }} />
      </Box>
    );
  }

  if (!detail) {
    return (
      <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3 }}>
        <Typography sx={{ color: '#EF4444' }}>Pursuit not found</Typography>
        <Button component={Link} href={paths.abm.pursuits} sx={{ color: '#3b82f6', mt: 2 }}>Back to Pursuits</Button>
      </Box>
    );
  }

  const { pursuit, intel_latest, signals, stakeholders, tasks, linked_programs, linked_lead_requests, activities } = detail;
  const isConverted = pursuit.status === 'converted';

  return (
    <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3 }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Button component={Link} href={paths.abm.pursuits} size="small" sx={{ color: '#9CA3AF' }}>← Pursuits</Button>
        {pursuit.account && (
          <Button component={Link} href={paths.abm.account(pursuit.account.id)} variant="outlined" size="small" sx={{ borderColor: '#262626', color: '#3b82f6' }}>
            {pursuit.account.name}
          </Button>
        )}
        <Chip label={pursuit.status} size="small" sx={{ bgcolor: pursuit.status === 'converted' ? '#10B981' : '#262626', color: '#fff', textTransform: 'capitalize' }} />
        <Chip label={pursuit.stage} size="small" sx={{ bgcolor: '#262626', color: '#9CA3AF', textTransform: 'capitalize' }} />
      </Box>

      <Typography variant="h5" sx={{ color: '#FFFFFF', fontWeight: 600, mb: 3 }}>{pursuit.title}</Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
        {/* A) Intel Summary */}
        <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626' }}>
          <CardContent>
            <Typography sx={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 600, mb: 1 }}>Intel Summary</Typography>
            {intel_latest ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Chip label={intel_latest.score} sx={{ fontFamily: 'monospace', fontSize: '1.25rem', bgcolor: '#262626', color: '#fff' }} />
                  <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem' }}>Last run: {dayjs(intel_latest.created_at).format('MMM DD, HH:mm')}</Typography>
                </Box>
                <List dense sx={{ '& .MuiListItemText-primary': { fontSize: '0.875rem', color: '#E5E7EB' } }}>
                  {(intel_latest.bullets || []).slice(0, 5).map((b, i) => (
                    <ListItem key={i} sx={{ py: 0.25 }}>
                      <ListItemText primary={b} />
                    </ListItem>
                  ))}
                </List>
              </>
            ) : (
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem', mb: 2 }}>No intel yet. Run Mission Intel to get a feasibility score and recommendations.</Typography>
            )}
            <Button
              variant="outlined"
              size="small"
              onClick={handleRunIntel}
              disabled={intelRunning || isConverted}
              sx={{ borderColor: '#8B5CF6', color: '#8B5CF6', mt: 1 }}
            >
              {intelRunning ? 'Running...' : 'Mission Intel'}
            </Button>
          </CardContent>
        </Card>

        {/* B) Signals + conversion rail */}
        <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626' }}>
          <CardContent>
            <Typography sx={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 600, mb: 1 }}>Signals (90d)</Typography>
            {signals.length === 0 ? (
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>No signals in the last 90 days.</Typography>
            ) : (
              <List dense>
                {signals.slice(0, 8).map((s) => (
                  <ListItem key={s.id} sx={{ py: 0.25 }}>
                    <ListItemText
                      primary={s.type || 'signal'}
                      secondary={dayjs(s.created_at).format('MMM DD')}
                      primaryTypographyProps={{ sx: { fontSize: '0.8rem', color: '#E5E7EB' } }}
                      secondaryTypographyProps={{ sx: { fontSize: '0.75rem', color: '#6b7280' } }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
            {isConverted && pursuit.mission_link && (
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #262626' }}>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', mb: 1 }}>Converted to Mission</Typography>
                <Button component={Link} href={`${paths.abm.missions}?id=${pursuit.mission_link.id}`} size="small" sx={{ color: '#3b82f6' }}>Open Mission →</Button>
              </Box>
            )}
            {!isConverted && (
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #262626' }}>
                <Button variant="contained" size="small" onClick={handleConvertToMission} sx={{ bgcolor: '#10B981', color: '#fff', '&:hover': { bgcolor: '#059669' } }}>
                  Convert to Mission
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* C) Stakeholders */}
      <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', mt: 2 }}>
        <CardContent>
          <Typography sx={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 600, mb: 1 }}>Stakeholders</Typography>
          {stakeholders.length === 0 ? (
            <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>No stakeholders added yet.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {stakeholders.map((s) => (
                <Chip key={s.id} label={`${s.name} · ${s.role}${s.grade ? ` (${s.grade})` : ''}`} size="small" sx={{ bgcolor: '#262626', color: '#9CA3AF' }} />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* D) Actions */}
      <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', mt: 2 }}>
        <CardContent>
          <Typography sx={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 600, mb: 1 }}>Actions</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button variant="outlined" size="small" disabled={isConverted} onClick={() => abmApi.postPursuitActionBookMeeting(id).then(() => fetchDetail())} sx={{ borderColor: '#262626', color: '#3b82f6' }}>Book meeting</Button>
            <Button variant="outlined" size="small" disabled={isConverted} onClick={() => abmApi.postPursuitActionPartnerIntro(id).then(() => fetchDetail())} sx={{ borderColor: '#262626', color: '#3b82f6' }}>Partner intro</Button>
            <Button variant="outlined" size="small" disabled={isConverted} onClick={() => abmApi.postPursuitActionDraftSequence(id).then(() => fetchDetail())} sx={{ borderColor: '#262626', color: '#3b82f6' }}>Draft sequence</Button>
            <Button variant="outlined" size="small" disabled={isConverted} onClick={() => abmApi.postPursuitActionAddToCampaign(id).then(() => fetchDetail())} sx={{ borderColor: '#262626', color: '#3b82f6' }}>Add to campaign</Button>
          </Box>
        </CardContent>
      </Card>

      {/* Tasks + Linked */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mt: 2 }}>
        <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626' }}>
          <CardContent>
            <Typography sx={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 600, mb: 1 }}>Tasks</Typography>
            {tasks.length === 0 ? <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>No tasks.</Typography> : (
              <List dense>
                {tasks.map((t) => (
                  <ListItem key={t.id} sx={{ py: 0.25 }}>
                    <ListItemText primary={t.title} secondary={t.due_at ? dayjs(t.due_at).format('MMM DD') : t.status} primaryTypographyProps={{ sx: { fontSize: '0.875rem', color: '#E5E7EB' } }} />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
        <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626' }}>
          <CardContent>
            <Typography sx={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 600, mb: 1 }}>Linked</Typography>
            {linked_programs.length === 0 && linked_lead_requests.length === 0 ? (
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>No programs or lead requests linked.</Typography>
            ) : (
              <>
                {linked_programs.map(({ programItem }) => programItem && <Typography key={programItem.id} sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Program: {programItem.title}</Typography>)}
                {linked_lead_requests.map(({ leadRequest }) => leadRequest && <Typography key={leadRequest.id} sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Lead: {leadRequest.organization_name || leadRequest.id}</Typography>)}
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
