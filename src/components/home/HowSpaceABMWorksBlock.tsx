'use client';

import React from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { Box, Container, Typography } from '@mui/material';
import { PrimaryColor } from '@/config';

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'] });

interface StepData {
  index: number;
  title: string;
  body: string;
  subBullets?: string[];
}

const STEPS: StepData[] = [
  {
    index: 1,
    title: 'Capture mission intent',
    body: 'Prospects explore service lanes and submit a Request a Reservation (progressive questions that adapt by lane).',
  },
  {
    index: 2,
    title: 'Create the Lead Request (canonical artifact)',
    body: 'Every submission is stored as a Lead Request — the auditable record that anchors the opportunity.',
  },
  {
    index: 3,
    title: 'Resolve Account + Person',
    body: 'We link the request to a Prospect Company + Contact so sales and ops work from the same account context.',
  },
  {
    index: 4,
    title: 'Build Intent Signals (explainable evidence)',
    body: 'We write time-series Intent Signals that show why this is hot (not just a black-box score).',
  },
  {
    index: 5,
    title: 'Score continuously',
    body: 'Lead score per request + rolling 30-day account intent with decay/normalization.',
  },
  {
    index: 6,
    title: 'Generate a procurement-ready brief (AI + rules)',
    body: 'We convert the Lead Request + signals into a procurement brief with:',
    subBullets: [
      'Mission intent (what outcome they\'re buying)',
      'Constraints (orbit bands, interfaces, comms, power/thermal assumptions, timeline)',
      'Assumptions (explicit defaults when info is incomplete)',
      'Missing fields (what\'s required to quote / schedule)',
    ],
  },
  {
    index: 7,
    title: 'Run a lane-specific qualification workflow (internal)',
    body: 'Each lane has required fields and gates (quote-ready standard):',
    subBullets: [
      'Required fields by lane (orbit, interfaces, bands, timeline, compliance)',
      '"What\'s missing" checklist + confidence level',
      'Compliance gates (export/control constraints, end user, licensing)',
    ],
  },
  {
    index: 8,
    title: 'Route using a rules engine',
    body: 'Deterministic routing based on constraints and capacity:',
    subBullets: [
      'Lane → provider pool → assignment (human + automated)',
      'Includes fallback routing if the preferred path can\'t accept the job.',
    ],
  },
  {
    index: 9,
    title: 'Execute through a Sales/Ops work queue',
    body: 'Every qualified request becomes a managed work item:',
    subBullets: [
      'Owners, status, next-best-action',
      'SLA timers + escalation',
      'Full audit trail across handoffs',
    ],
  },
  {
    index: 10,
    title: 'Create / update a Salesforce Opportunity (system of record sync)',
    body: 'When a Lead Request becomes Qualified (quote-ready), Space GTM syncs it to Salesforce:',
    subBullets: [
      'Upsert Account + Contact (if needed)',
      'Create Opportunity (or attach to an open one)',
      'Attach the Procurement Brief + key constraints as fields',
      'Set stage + owner + SLA + next action',
    ],
  },
];

export function HowSpaceABMWorksBlock() {
  return (
    <Box
      component="section"
      id="how-space-abm-works"
      sx={{
        py: { xs: 8, md: 10 },
        backgroundColor: '#000000',
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ mb: 6 }}>
          <Typography
            component="h2"
            sx={{
              fontFamily: jetbrainsMono.style.fontFamily,
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '64px' },
              lineHeight: 1.2,
              fontWeight: 700,
              color: '#F5F5F7',
              mb: 4,
            }}
          >
            How it works.
          </Typography>
          <Typography
            component="span"
            sx={{
              fontSize: { xs: '1.125rem', md: '1.25rem' },
              lineHeight: 1.6,
              mb: 5,
              display: 'block',
              whiteSpace: 'pre-wrap',
            }}
          >
            <Box component="span" sx={{ color: '#F5F5F7' }}>From  </Box>
            <Box component="span" sx={{ color: PrimaryColor, fontWeight: 500 }}>first-party intent → procurement brief → qualification → routing → sales/ops execution</Box>
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 3 }}>
            {STEPS.map((step) => (
              <StepCard
                key={step.index}
                index={step.index}
                title={step.title}
                body={step.body}
                subBullets={step.subBullets}
              />
            ))}
          </Box>
          <Typography
            sx={{
              fontFamily: 'monospace',
              fontSize: { xs: '1.125rem', md: '1.25rem' },
              lineHeight: 1.6,
              color: 'rgba(148,163,184,0.9)',
              mt: 8,
            }}
          >
            End-to-end, Space GTM takes you from first-party intent to a procurement-ready, qualified, routed work item—and syncs it into Salesforce as a ready-to-run Opportunity.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

const stepCardSx = {
  flex: 1,
  borderRadius: 4,
  px: 3,
  py: 2.5,
  bgcolor: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.08)',
  transition: 'all 0.3s ease',
  boxShadow: '0 0 50px -12px rgba(255, 121, 27, 0.2)',
  '&:hover': {
    borderColor: PrimaryColor,
    transform: 'translateY(-2px)',
    boxShadow: '0 0 60px -8px rgba(255, 121, 27, 0.4)',
  },
};

const numberCircleSx = {
  width: 48,
  height: 48,
  borderRadius: '50%',
  border: `2px solid ${PrimaryColor}`,
  bgcolor: 'rgba(255,255,255,0.02)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  boxShadow: '0 0 0 4px rgba(255, 121, 27, 0.2)',
};

interface StepCardProps {
  index: number;
  title: string;
  body: string;
  subBullets?: string[];
}

function StepCard({ index, title, body, subBullets }: StepCardProps) {
  return (
    <Box sx={{ display: 'flex', gap: 3 }}>
      <Box sx={{ position: 'relative', mt: 0.5 }}>
        <Box sx={numberCircleSx}>
          <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: PrimaryColor }}>
            {index}
          </Typography>
        </Box>
      </Box>
      <Box sx={stepCardSx}>
        <Typography sx={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 600, color: '#FFFFFF', mb: 0.5 }}>
          {title}
        </Typography>
        <Typography sx={{ fontFamily: 'monospace', fontSize: '1rem', lineHeight: 1.6, color: '#FFFFFF' }}>
          {body}
        </Typography>
        {subBullets && subBullets.length > 0 && (
          <Box
            component="ul"
            sx={{
              m: 0,
              mt: 1,
              pl: 3,
              fontFamily: 'monospace',
              fontSize: '1rem',
              lineHeight: 1.6,
              color: '#FFFFFF',
              '& li': { mb: 0.25 },
            }}
          >
            {subBullets.map((bullet, i) => (
              <li key={i}>{bullet}</li>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
