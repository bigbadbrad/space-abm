'use client';

import React from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { Box, Container, Typography } from '@mui/material';
import { PrimaryColor } from '@/config';

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'] });

export function WidgetProcurementBriefBlock() {
  return (
    <Box
      component="section"
      id="widget-procurement-brief"
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
              mb: 3,
            }}
          >
            The widget that produces a Procurement Brief.
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: '1.125rem', md: '1.25rem' },
              lineHeight: 1.6,
              color: 'rgba(148,163,184,0.9)',
              mb: 3,
            }}
          >
            Not a &quot;contact us&quot; form — a progressive Request a Reservation flow that captures mission constraints and outputs a quote-grade brief your team can route immediately.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', mt: 3 }}>
            <BulletItem text="Progressive qualification: Step-by-step questions adapt to the selected service lane so you only ask what matters." />
            <BulletItem text="Procurement Brief output: Every submission becomes a structured, auditable brief (requirements, schedule, readiness, budget band, contact + org)." />
            <BulletItem text="Instant routing + prioritization: The backend scores each submission and assigns it to the right lane/owner without manual triage." />
            <BulletItem text="No lost context: The brief stays linked to the Account and Person, so sales + ops see the same canonical artifact." />
            <BulletItem text="Built for &quot;quote-ready&quot; deals: Captures the details vendors need to respond fast (not a generic marketing lead)." />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

interface BulletItemProps {
  text: string;
}

function BulletItem({ text }: BulletItemProps) {
  return (
    <Typography
      sx={{
        borderLeft: `4px solid ${PrimaryColor}`,
        pl: 4,
        py: 1,
        mb: 3,
        color: '#FFFFFF',
        fontFamily: 'monospace',
        fontSize: '1rem',
        lineHeight: 1.5,
      }}
    >
      {text}
    </Typography>
  );
}
