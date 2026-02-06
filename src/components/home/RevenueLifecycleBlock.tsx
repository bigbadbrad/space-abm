'use client';

import React from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { Box, Container, Typography } from '@mui/material';
import { PrimaryColor } from '@/config';

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'] });

export function RevenueLifecycleBlock() {
  return (
    <Box
      component="section"
      id="revenue-lifecycle"
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
              mb: 2,
            }}
          >
            Revenue lifecycle for space.
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: '1.25rem', md: '1.375rem' },
              lineHeight: 1.5,
              color: 'rgba(148,163,184,0.9)',
              mb: 3,
            }}
          >
            From procurement brief to committed mission.
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: '1.125rem', md: '1.25rem' },
              lineHeight: 1.6,
              color: 'rgba(148,163,184,0.9)',
            }}
          >
            In space, deals don&apos;t move through generic CRMs—they move through requirements, readiness gates, and schedule windows. Space ABM turns every qualified request into an executable opportunity with owners, due dates, and an audit trail—so you can progress with full visibility from:
            <br /><br />
            <Box component="span" sx={{ color: PrimaryColor, fontWeight: 500 }}>interest → qualified brief → routed providers → committed schedule → closed revenue</Box>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
