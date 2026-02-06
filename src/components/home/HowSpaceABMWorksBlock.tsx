'use client';

import React from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { Box, Container, Typography } from '@mui/material';
import { PrimaryColor } from '@/config';

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'] });

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
              mb: 3,
            }}
          >
            How it works.
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: '1.125rem', md: '1.25rem' },
              lineHeight: 1.6,
              color: 'rgba(148,163,184,0.9)',
              mb: 3,
            }}
          >
            Turn anonymous interest and reservation requests into auditable sales artifacts, explainable intent, and ranked accounts.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', mt: 3 }}>
            <BulletItem text="Capture intent as prospects explore service pages and submit Request a Reservation." />
            <BulletItem text="Store every submission as a Lead Request — the canonical, auditable sales artifact." />
            <BulletItem text="Upsert the Account + Person by linking the Lead Request to a Prospect Company and Contact." />
            <BulletItem text="Write Intent Signals — a time-series trail explaining exactly why an account is heating up." />
            <BulletItemWithSub>
              Continuously score:
              <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 3 }}>
                <li>Lead Score per Lead Request</li>
                <li>Intent Score per account (rolling 30-day score with decay + normalization)</li>
              </Box>
            </BulletItemWithSub>
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

function BulletItemWithSub({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        borderLeft: `4px solid ${PrimaryColor}`,
        pl: 4,
        py: 1,
        mb: 3,
        color: '#FFFFFF',
        fontFamily: 'monospace',
        fontSize: '1rem',
        lineHeight: 1.5,
        '& ul': { color: '#FFFFFF' },
        '& li': { mb: 0.25 },
      }}
    >
      {children}
    </Box>
  );
}
