'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
import dayjs from 'dayjs';

import { paths } from '@/paths';
import { formatLaneDisplayName } from '@/components/abm/layout/config';
import { abmApi } from '@/lib/abm/client';
import { ScoringDetailsDrawer } from '@/components/abm/ScoringDetailsDrawer';

function PromoteToMissionButton({ leadRequestId }: { leadRequestId: string }): React.JSX.Element {
  const router = useRouter();
  const [promoting, setPromoting] = React.useState(false);
  const handlePromote = () => {
    setPromoting(true);
    abmApi.promoteLeadRequest(leadRequestId).then((res) => {
      setPromoting(false);
      if (res.data?.mission) {
        router.push(`${paths.abm.missions}?id=${res.data.mission.id}`);
      } else if (res.error) {
        alert(res.error);
      }
    });
  };
  return (
    <Button
      variant="outlined"
      size="small"
      onClick={handlePromote}
      disabled={promoting}
      sx={{
        borderColor: '#FF791B',
        color: '#FF791B',
        mr: 1,
        '&:hover': {
          borderColor: '#FF791B',
          backgroundColor: '#FF791B',
          color: '#FFFFFF',
        },
      }}
    >
      {promoting ? 'Promoting...' : 'Promote to Mission'}
    </Button>
  );
}

export default function ABMLeadRequestsPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('id');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [leadRequests, setLeadRequests] = React.useState<any[]>([]);
  const [detail, setDetail] = React.useState<any | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [scoringDrawerOpen, setScoringDrawerOpen] = React.useState(false);
  const [scoringDetails, setScoringDetails] = React.useState<{ loading: boolean; data: any }>({ loading: false, data: null });

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    abmApi.getLeadRequests({ limit: 50, page: 1 }).then((res) => {
      if (cancelled) return;
      if (res.error) setError(res.error);
      else if (res.data) setLeadRequests(res.data.items || []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    abmApi.getLeadRequest(selectedId).then((res) => {
      if (cancelled) return;
      if (res.data) setDetail(res.data);
      setDetailLoading(false);
    });
    return () => { cancelled = true; };
  }, [selectedId]);

  if (loading) {
    return (
      <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#9CA3AF' }} />
      </Box>
    );
  }

  const renderHostedPayloadBrief = (lead: any) => {
    const payload = lead?.payload_json || {};
    const brief = payload.hosted_payload_brief || null;
    if (!brief) return null;

    const fmt = (v: unknown) => {
      if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) return '—';
      if (Array.isArray(v)) return v.join(', ');
      return String(v);
    };

    const modules = brief.mission?.modules || {};
    const moduleList = [
      modules.sensor ? 'Sensor' : null,
      modules.compute ? 'Compute' : null,
      modules.delivery ? 'Delivery' : null,
    ].filter(Boolean);

    const routingTags = brief.routing_tags || payload.routing_tags || [];

    return (
      <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #1f2937' }}>
        <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mb: 1 }}>
          Procurement Brief (Hosted Payload)
        </Typography>
        <Typography sx={{ color: '#FFFFFF', fontSize: '0.9rem', mb: 2 }}>
          Quote-grade hosted payload brief captured from the widget. Vendors see this as the structured mini‑SOW.
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 3,
            mt: 1,
          }}
        >
          {/* Left column: mission, schedule, ops, compliance */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mb: 0.5 }}>
                Mission pattern
              </Typography>
              <Typography sx={{ color: '#FFFFFF', fontSize: '0.875rem' }}>
                {fmt(brief.mission?.pattern)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem', mt: 0.5 }}>
                Modules: {moduleList.length ? moduleList.join(' · ') : '—'}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mb: 0.5 }}>
                Schedule + readiness
              </Typography>
              <Typography sx={{ color: '#FFFFFF', fontSize: '0.85rem' }}>
                Timeline: {fmt(brief.schedule?.timeline)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Readiness: {fmt(brief.schedule?.readiness)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Criticality: {fmt(brief.schedule?.criticality)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Target on‑orbit date: {fmt(brief.schedule?.target_on_orbit_date)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Integration deadline vs launch: {fmt(brief.schedule?.integration_deadline_vs_launch)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Slip tolerance: {fmt(brief.schedule?.slip_tolerance)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Backup host plan: {fmt(brief.schedule?.backup_plan)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Commercial posture: {fmt(brief.schedule?.commercial_posture)}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mb: 0.5 }}>
                Ops model, governance & priority
              </Typography>
              <Typography sx={{ color: '#FFFFFF', fontSize: '0.85rem' }}>
                Ops model: {fmt(brief.ops?.model)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Support level: {fmt(brief.ops?.support_level)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Default authority: {fmt(brief.ops?.authority_model)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Anomaly approvals: {fmt(brief.ops?.safety_clauses)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Conflict priority: {fmt(brief.ops?.conflict_priority)}
              </Typography>
              {brief.ops?.conflict_priority_drivers && brief.ops.conflict_priority_drivers.length > 0 && (
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                  If conflicts occur, prioritize: {fmt(brief.ops.conflict_priority_drivers)}
                </Typography>
              )}
            </Box>

            <Box>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mb: 0.5 }}>
                Compliance / licensing
              </Typography>
              <Typography sx={{ color: '#FFFFFF', fontSize: '0.85rem' }}>
                Customer type: {fmt(brief.compliance?.customer_type)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Export posture: {fmt(brief.compliance?.export_posture)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Data sensitivity: {fmt(brief.compliance?.data_sensitivity)}
              </Typography>
            </Box>
          </Box>

          {/* Right column: interfaces/resources, delivery, commercials, meta */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mb: 0.5 }}>
                Interfaces & resources
              </Typography>
              <Typography sx={{ color: '#FFFFFF', fontSize: '0.85rem' }}>
                Payload mass (kg): {fmt(brief.payload?.mass_kg)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Envelope: {fmt((brief.payload?.envelope as any)?.u_form_factor || (brief.payload?.envelope as any)?.dims_cm)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Power avg / peak (W): {fmt(brief.payload?.power_avg_w)} / {fmt(brief.payload?.power_peak_w)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Thermal class: {fmt(brief.payload?.thermal_class)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem', mt: 0.75 }}>
                Sensor: {fmt(brief.sensor?.type)} · Pointing: {fmt(brief.sensor?.pointing_need)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Sensor data produced: {fmt(brief.sensor?.data_produced)} · Duty cycle: {fmt(brief.sensor?.duty_cycle)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem', mt: 0.75 }}>
                Compute type: {fmt(brief.compute?.type)} · Budget: {fmt(brief.compute?.budget_class)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Memory (GB): {fmt(brief.compute?.memory_gb)} · Deployment: {fmt(brief.compute?.deployment_pattern)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Model update cadence: {fmt(brief.compute?.model_update_cadence)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Inbound data source: {fmt(brief.compute?.inbound_data_source)}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mb: 0.5 }}>
                Outputs, delivery & storage
              </Typography>
              <Typography sx={{ color: '#FFFFFF', fontSize: '0.85rem' }}>
                Results outputs: {fmt(brief.results?.outputs)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Results frequency: {fmt(brief.results?.frequency)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Size per delivery: {fmt(brief.results?.size_per_delivery)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Latency target: {fmt(brief.results?.latency_target)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                QA expectation: {fmt(brief.results?.qa_expectation)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem', mt: 0.75 }}>
                Delivery mode: {fmt(brief.delivery?.mode)} · Destination: {fmt(brief.delivery?.destination)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Delivery latency: {fmt(brief.delivery?.latency)} · Regions: {fmt(brief.delivery?.regions)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Delivery security: {fmt(brief.delivery?.security)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem', mt: 0.75 }}>
                Storage requirement: {fmt(brief.storage?.requirement)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Storage data class: {fmt(brief.storage?.data_class)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Storage security model: {fmt(brief.storage?.security_model)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Storage access model: {fmt(brief.storage?.access_model)}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mb: 0.5 }}>
                Insurance & commercial
              </Typography>
              <Typography sx={{ color: '#FFFFFF', fontSize: '0.85rem' }}>
                Insurance preference: {fmt(brief.insurance?.preference)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Budget band: {fmt(brief.commercial?.budget_band)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Deal structure: {fmt(brief.commercial?.deal_structure_preference)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Success criteria: {fmt(brief.commercial?.success_criteria)}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mb: 0.5 }}>
                Contact & meta
              </Typography>
              <Typography sx={{ color: '#FFFFFF', fontSize: '0.85rem' }}>
                Company: {fmt(brief.contact?.company)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Website: {fmt(brief.contact?.website)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Work email: {fmt(brief.contact?.email_work)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Role: {fmt(brief.contact?.role)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                Name: {fmt(brief.contact?.name)}
              </Typography>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem', mt: 0.75 }}>
                Completeness: {fmt(brief.completeness_score)}% {brief.is_quote_grade ? '— Quote‑grade' : ''}
              </Typography>
              {routingTags && routingTags.length > 0 && (
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem', mt: 0.5 }}>
                  Routing tags: {routingTags.join(', ')}
                </Typography>
              )}
              {brief.source_page && (
                <Typography sx={{ color: '#6B7280', fontSize: '0.75rem', mt: 0.5 }}>
                  Source page: {brief.source_page}
                </Typography>
              )}
          </Box>
        </Box>
      </Box>
    </Box>
    );
  };

  return (
    <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3, display: 'flex', gap: 2, flexDirection: { xs: 'column', lg: 'row' } }}>
      {error && <Typography sx={{ color: '#EF4444', mb: 2 }}>{error}</Typography>}
      <Box sx={{ flex: '1 1 40%', minWidth: 0 }}>
        <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626' }}>
          <CardContent>
            <Typography sx={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600, mb: 2 }}>Lead Requests</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Score</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Lane</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Org</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.75rem', fontWeight: 600 }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leadRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ color: '#9CA3AF', borderColor: '#262626', textAlign: 'center', py: 3 }}>No lead requests</TableCell>
                  </TableRow>
                ) : (
                  leadRequests.map((lr) => (
                    <TableRow
                      key={lr.id}
                      sx={{ bgcolor: selectedId === String(lr.id) ? 'rgba(59,130,246,0.1)' : 'transparent', cursor: 'pointer', '&:hover': { bgcolor: selectedId === String(lr.id) ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)' } }}
                      onClick={() => router.push(`${paths.abm.leadRequests}?id=${lr.id}`)}
                    >
                      <TableCell sx={{ color: '#FFFFFF', borderColor: '#262626', fontSize: '0.8rem' }}><Chip label={lr.lead_score ?? '—'} size="small" sx={{ fontFamily: 'monospace', bgcolor: '#262626', color: '#fff' }} /></TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem' }}>{formatLaneDisplayName(lr.service_needed)}</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem' }}>{lr.organization_domain || lr.prospectCompany?.domain || '—'}</TableCell>
                      <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem', fontFamily: 'monospace' }}>{dayjs(lr.created_at).format('MM/DD')}</TableCell>
                      <TableCell sx={{ borderColor: '#262626' }}>
                        <Button size="small" component={Link} href={`${paths.abm.leadRequests}?id=${lr.id}`} sx={{ color: '#3b82f6', minWidth: 0 }} onClick={(e) => e.stopPropagation()}>View →</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Box>
      <Box sx={{ flex: '1 1 60%', minWidth: 0 }}>
        <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', minHeight: 300 }}>
          <CardContent>
            <Typography sx={{ color: '#FFFFFF', fontSize: '1.125rem', fontWeight: 600, mb: 2 }}>Lead Request Detail</Typography>
            {!selectedId ? (
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Select a lead request from the list</Typography>
            ) : detailLoading ? (
              <CircularProgress size={24} sx={{ color: '#9CA3AF' }} />
            ) : detail ? (
              <Box sx={{ '& > *': { mb: 1.5 } }}>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase' }}>Service + Mission</Typography>
                <Typography sx={{ color: '#FFFFFF', fontSize: '0.875rem' }}>{formatLaneDisplayName(detail.service_needed)}</Typography>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mt: 2 }}>Organization + Contact</Typography>
                <Typography sx={{ color: '#FFFFFF', fontSize: '0.875rem' }}>{detail.organization_name || detail.organization_domain || '—'}</Typography>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>{detail.work_email || detail.contact?.email || '—'}</Typography>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mt: 2 }}>Submitted at</Typography>
                <Typography sx={{ color: '#FFFFFF', fontSize: '0.875rem', fontFamily: 'monospace' }}>{dayjs(detail.created_at).format('MMM DD, YYYY HH:mm')}</Typography>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mt: 2 }}>Status</Typography>
                <Chip label={detail.routing_status || 'new'} size="small" sx={{ bgcolor: '#262626', color: '#fff' }} />
                <Box sx={{ mt: 2 }}>
                  {detail.prospectCompany?.id && (
                    <Button component={Link} href={paths.abm.account(String(detail.prospectCompany.id))} variant="outlined" size="small" sx={{ borderColor: '#262626', color: '#3b82f6', mr: 1 }}>
                      Open Account
                    </Button>
                  )}
                  {!detail.mission_id && (
                    <PromoteToMissionButton leadRequestId={String(detail.id)} />
                  )}
                  <Box
                    component="span"
                    onClick={() => { setScoringDrawerOpen(true); setScoringDetails({ loading: true, data: null }); abmApi.getLeadRequestScoringDetails(selectedId!).then((r) => setScoringDetails({ loading: false, data: r.data ?? null })); }}
                    sx={{ color: '#3b82f6', cursor: 'pointer', fontSize: '0.875rem', textDecoration: 'underline' }}
                  >
                    View scoring details
                  </Box>
                </Box>
                <ScoringDetailsDrawer open={scoringDrawerOpen} onClose={() => setScoringDrawerOpen(false)} loading={scoringDetails.loading} data={scoringDetails.data} />
                {detail.service_needed === 'hosted_payload' && renderHostedPayloadBrief(detail)}
              </Box>
            ) : (
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Failed to load</Typography>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
