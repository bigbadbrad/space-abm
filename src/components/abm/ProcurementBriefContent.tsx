'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { formatLaneDisplayName } from '@/components/abm/layout/config';

const BRIEF_FIELD_GROUPS: Record<string, string[]> = {
  'Seriousness': [
    'earliest_date', 'latest_date', 'timeline', 'readiness', 'criticality', 'urgency',
    'launch_timeframe', 'insertion_timeframe', 'transfer_timeframe', 'schedule_urgency',
    'readiness_confidence', 'integration_status',
  ],
  'Who they are': [
    'company', 'work_email', 'organization_name', 'organization_website', 'website', 'role', 'country', 'name',
  ],
  'Can we follow up?': ['consent_share', 'consent_contact', 'phone'],
  'Mission & orbit': [
    'mission_type', 'target_orbit', 'current_orbit', 'desired_orbit', 'asset_state', 'delta_v_mvps', 'delta_v_mps',
    'payload_volume', 'payload_mass_kg', 'service_needed', 'upgrade_type',
    'starting_point', 'preferred_launch_region', 'inclination_deg',
    'propellant_type', 'refuel_interface_ready', 'docking_interface_ready', 'grapple_fixture_present',
    'servicing_interface', 'disposal_method',
  ],
  'Schedule': ['target_on_orbit_date', 'integration_deadline_vs_launch', 'slip_tolerance'],
  'Commercial': ['budget_band', 'funding_status', 'deal_structure_preference', 'success_criteria'],
  'Notes & goals': ['notes', 'unsure_notes', 'primary_goal', 'needs_clarification', 'attachments'],
  'Consent & compliance': ['export_posture', 'data_sensitivity', 'customer_type'],
  'Meta & tracking': ['utm', 'tracking', 'source_page'],
};

const SectionHeader = ({ title }: { title: string }) => (
  <Box sx={{ width: '33%', pb: 0.75, borderBottom: '2px solid #3B82F6', mb: 0.5 }}>
    <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase' }}>{title}</Typography>
  </Box>
);

function HostedPayloadBrief({ lead }: { lead: any }): React.JSX.Element | null {
  const payload = lead?.payload_json || {};
  const brief = payload.hosted_payload_brief || null;
  if (!brief) return null;

  const fmt = (v: unknown) => {
    if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) return '—';
    if (Array.isArray(v)) return v.join(', ');
    return String(v);
  };

  const modules = brief.mission?.modules || {};
  const moduleList = [modules.sensor ? 'Sensor' : null, modules.compute ? 'Compute' : null, modules.delivery ? 'Delivery' : null].filter(Boolean);
  const routingTags = brief.routing_tags || payload.routing_tags || [];

  return (
    <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #1f2937' }}>
      <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mb: 1 }}>Procurement Brief (Hosted Payload)</Typography>
      <Typography sx={{ color: '#FFFFFF', fontSize: '0.9rem', mb: 2 }}>Quote-grade hosted payload brief captured from the widget. Vendors see this as the structured mini‑SOW.</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mt: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box><SectionHeader title="Mission pattern" /><Typography sx={{ color: '#FFFFFF', fontSize: '0.875rem' }}>{fmt(brief.mission?.pattern)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem', mt: 0.5 }}>Modules: {moduleList.length ? moduleList.join(' · ') : '—'}</Typography></Box>
          <Box><SectionHeader title="Schedule + readiness" /><Typography sx={{ color: '#FFFFFF', fontSize: '0.85rem' }}>Timeline: {fmt(brief.schedule?.timeline)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Readiness: {fmt(brief.schedule?.readiness)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Criticality: {fmt(brief.schedule?.criticality)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Target on‑orbit date: {fmt(brief.schedule?.target_on_orbit_date)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Integration deadline vs launch: {fmt(brief.schedule?.integration_deadline_vs_launch)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Slip tolerance: {fmt(brief.schedule?.slip_tolerance)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Backup host plan: {fmt(brief.schedule?.backup_plan)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Commercial posture: {fmt(brief.schedule?.commercial_posture)}</Typography></Box>
          <Box><SectionHeader title="Ops model, governance & priority" /><Typography sx={{ color: '#FFFFFF', fontSize: '0.85rem' }}>Ops model: {fmt(brief.ops?.model)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Support level: {fmt(brief.ops?.support_level)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Default authority: {fmt(brief.ops?.authority_model)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Anomaly approvals: {fmt(brief.ops?.safety_clauses)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Conflict priority: {fmt(brief.ops?.conflict_priority)}</Typography>{brief.ops?.conflict_priority_drivers?.length > 0 && <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>If conflicts occur, prioritize: {fmt(brief.ops.conflict_priority_drivers)}</Typography>}</Box>
          <Box><SectionHeader title="Compliance / licensing" /><Typography sx={{ color: '#FFFFFF', fontSize: '0.85rem' }}>Customer type: {fmt(brief.compliance?.customer_type)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Export posture: {fmt(brief.compliance?.export_posture)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Data sensitivity: {fmt(brief.compliance?.data_sensitivity)}</Typography></Box>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box><SectionHeader title="Interfaces & resources" /><Typography sx={{ color: '#FFFFFF', fontSize: '0.85rem' }}>Payload mass (kg): {fmt(brief.payload?.mass_kg)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Envelope: {fmt((brief.payload?.envelope as any)?.u_form_factor || (brief.payload?.envelope as any)?.dims_cm)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Power avg / peak (W): {fmt(brief.payload?.power_avg_w)} / {fmt(brief.payload?.power_peak_w)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Thermal class: {fmt(brief.payload?.thermal_class)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem', mt: 0.75 }}>Sensor: {fmt(brief.sensor?.type)} · Pointing: {fmt(brief.sensor?.pointing_need)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Sensor data produced: {fmt(brief.sensor?.data_produced)} · Duty cycle: {fmt(brief.sensor?.duty_cycle)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem', mt: 0.75 }}>Compute type: {fmt(brief.compute?.type)} · Budget: {fmt(brief.compute?.budget_class)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Memory (GB): {fmt(brief.compute?.memory_gb)} · Deployment: {fmt(brief.compute?.deployment_pattern)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Model update cadence: {fmt(brief.compute?.model_update_cadence)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Inbound data source: {fmt(brief.compute?.inbound_data_source)}</Typography></Box>
          <Box><SectionHeader title="Outputs, delivery & storage" /><Typography sx={{ color: '#FFFFFF', fontSize: '0.85rem' }}>Results outputs: {fmt(brief.results?.outputs)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Results frequency: {fmt(brief.results?.frequency)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Size per delivery: {fmt(brief.results?.size_per_delivery)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Latency target: {fmt(brief.results?.latency_target)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>QA expectation: {fmt(brief.results?.qa_expectation)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem', mt: 0.75 }}>Delivery mode: {fmt(brief.delivery?.mode)} · Destination: {fmt(brief.delivery?.destination)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Delivery latency: {fmt(brief.delivery?.latency)} · Regions: {fmt(brief.delivery?.regions)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Delivery security: {fmt(brief.delivery?.security)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem', mt: 0.75 }}>Storage requirement: {fmt(brief.storage?.requirement)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Storage data class: {fmt(brief.storage?.data_class)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Storage security model: {fmt(brief.storage?.security_model)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Storage access model: {fmt(brief.storage?.access_model)}</Typography></Box>
          <Box><SectionHeader title="Insurance & commercial" /><Typography sx={{ color: '#FFFFFF', fontSize: '0.85rem' }}>Insurance preference: {fmt(brief.insurance?.preference)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Budget band: {fmt(brief.commercial?.budget_band)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Deal structure: {fmt(brief.commercial?.deal_structure_preference)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Success criteria: {fmt(brief.commercial?.success_criteria)}</Typography></Box>
          <Box><SectionHeader title="Contact & meta" /><Typography sx={{ color: '#FFFFFF', fontSize: '0.85rem' }}>Company: {fmt(brief.contact?.company)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Website: {fmt(brief.contact?.website)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Work email: {fmt(brief.contact?.email_work)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Role: {fmt(brief.contact?.role)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Name: {fmt(brief.contact?.name)}</Typography><Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem', mt: 0.75 }}>Completeness: {fmt(brief.completeness_score)}% {brief.is_quote_grade ? '— Quote‑grade' : ''}</Typography>{routingTags?.length > 0 && <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem', mt: 0.5 }}>Routing tags: {routingTags.join(', ')}</Typography>}{brief.source_page && <Typography sx={{ color: '#6B7280', fontSize: '0.75rem', mt: 0.5 }}>Source page: {brief.source_page}</Typography>}</Box>
        </Box>
      </Box>
    </Box>
  );
}

function GenericProcurementBrief({ lead }: { lead: any }): React.JSX.Element {
  const payload = lead?.payload_json || {};
  const lane = lead?.service_needed || 'unknown';
  const laneKey = typeof lane === 'string' ? lane.replace(/-/g, '_') : 'brief';
  const brief = payload[`${laneKey}_brief`] ?? payload.brief ?? payload;
  const skipKeys = new Set(['hosted_payload_brief', 'routing_tags']);
  const briefObj = brief && typeof brief === 'object' && !Array.isArray(brief) ? Object.fromEntries(Object.entries(brief).filter(([k]) => !skipKeys.has(k))) : null;
  const hasData = briefObj && Object.keys(briefObj).length > 0;

  const fmt = (v: unknown): string => {
    if (v == null || v === '') return '—';
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    if (Array.isArray(v)) return v.length ? v.map((x) => (x != null && typeof x === 'object' ? JSON.stringify(x) : String(x))).join(', ') : '—';
    if (typeof v === 'object') return '';
    return String(v);
  };

  const renderValue = (val: unknown, depth: number): React.ReactNode => {
    if (val == null || val === '') return '—';
    if (Array.isArray(val)) return fmt(val);
    if (typeof val === 'object') {
      const entries = Object.entries(val as Record<string, unknown>).filter(([, v]) => v != null && v !== '');
      if (entries.length === 0) return '—';
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5, pl: 1, borderLeft: '1px solid #262626' }}>
          {entries.map(([k, v]) => (
            <Box key={k}>
              <Typography component="span" sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>{k.replace(/_/g, ' ')}: </Typography>
              <Typography component="span" sx={{ color: '#FFFFFF', fontSize: '0.8rem' }}>{typeof v === 'object' && v !== null && !Array.isArray(v) ? renderValue(v, depth + 1) : fmt(v)}</Typography>
            </Box>
          ))}
        </Box>
      );
    }
    return fmt(val);
  };

  const grouped = ((): Record<string, Record<string, unknown>> => {
    if (!briefObj) return {};
    const assigned = new Set<string>();
    const result: Record<string, Record<string, unknown>> = {};
    for (const [sectionName, keys] of Object.entries(BRIEF_FIELD_GROUPS)) {
      const section: Record<string, unknown> = {};
      for (const key of keys) {
        if (key in briefObj) {
          section[key] = (briefObj as Record<string, unknown>)[key];
          assigned.add(key);
        }
      }
      if (Object.keys(section).length > 0) result[sectionName] = section;
    }
    const other: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(briefObj)) {
      if (!assigned.has(key)) other[key] = value;
    }
    if (Object.keys(other).length > 0) result['Other'] = other;
    return result;
  })();

  return (
    <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #1f2937' }}>
      <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mb: 1 }}>Procurement Brief ({formatLaneDisplayName(lane)})</Typography>
      <Typography sx={{ color: '#FFFFFF', fontSize: '0.9rem', mb: 2 }}>
        {hasData ? 'Structured brief captured from the widget. Vendors see this as the quote-grade spec for this service.' : 'No structured brief data for this lane yet. Widget submissions will populate this when available.'}
      </Typography>
      {hasData && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mt: 1 }}>
          {Object.entries(grouped).map(([sectionName, sectionFields]) => (
            <Box key={sectionName}>
              <Box sx={{ width: '33%', pb: 0.75, borderBottom: '2px solid #3B82F6', mb: 1 }}>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>{sectionName}</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {Object.entries(sectionFields).map(([key, value]) => (
                  <Box key={key}>
                    <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mb: 0.25 }}>{key.replace(/_/g, ' ')}</Typography>
                    <Typography sx={{ color: '#FFFFFF', fontSize: '0.875rem' }} component="div">{renderValue(value, 0)}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

export function ProcurementBriefContent({ lead, noTopBorder }: { lead: any; noTopBorder?: boolean }): React.JSX.Element | null {
  if (!lead) return null;
  const content = lead.service_needed === 'hosted_payload' ? <HostedPayloadBrief lead={lead} /> : <GenericProcurementBrief lead={lead} />;
  if (!content) return null;
  if (noTopBorder) return <Box sx={{ '& > div': { borderTop: 'none', pt: 0, mt: 0 } }}>{content}</Box>;
  return content;
}
