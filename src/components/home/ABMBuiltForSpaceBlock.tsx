'use client';

import React from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { Box, Container, Typography } from '@mui/material';
import { PrimaryColor } from '@/config';

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'] });

export function ABMBuiltForSpaceBlock() {
  return (
    <Box
      component="section"
      id="abm-built-for-space"
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
            Mission management.
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: '1.125rem', md: '1.25rem' },
              lineHeight: 1.6,
              color: 'rgba(148,163,184,0.9)',
              mb: 3,
            }}
          >
            Space ABM is the first ABM built for space programs, not SaaS pipelines.  Demandbase and 6sense can tell you who&apos;s showing intent. SpaceABM tells you what they&apos;re trying to fly — and tracks it as a Mission from first signal to reservation.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', mt: 3 }}>
            <ABMBulletItem text="Mission Workspaces: Convert anonymous intent + lead requests into a structured “program” object with lane, orbit, schedule window, readiness, and budget band." />
            <ABMBulletItem text="Evidence-backed “Why now”: Every score is explainable — signals, weights, and timelines tied to the Mission." />
            <ABMBulletItem text="Procurement-grade briefs: Capture quote-ready requirements (interfaces, mass/power, timeline, ops model) and route to the right operators." />
            <ABMBulletItem text="Built for multi-leg outcomes: Launch + mobility + hosting + ground + return — track the package, not just the account." />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

interface ABMBulletItemProps {
  text: string;
}

function ABMBulletItem({ text }: ABMBulletItemProps) {
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
