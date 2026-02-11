'use client';

import React from 'react';
import Image from 'next/image';
import { JetBrains_Mono } from 'next/font/google';
import { Box, Container, Typography } from '@mui/material';

import { PrimaryColor } from '@/config';

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'] });

export function IntentTrackingBlock(): React.ReactElement {
  return (
    <Box
      component="section"
      id="intent-tracking"
      sx={{
        py: { xs: 8, md: 25 },
        backgroundColor: '#000000',
      }}
    >
      <Container
        maxWidth="md"
        sx={{
          transform: { xs: 'none', md: 'translateX(25%)' },
        }}
      >
        <Typography
          component="p"
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: PrimaryColor,
            mb: 2,
          }}
        >
          Intent Tracking + Identity Resolution
        </Typography>

        <Typography
          component="h2"
          sx={{
            fontFamily: jetbrainsMono.style.fontFamily,
            fontSize: { xs: '2.25rem', sm: '2.75rem', md: '3rem' },
            lineHeight: 1.2,
            fontWeight: 700,
            color: '#F5F5F7',
            mb: 3,
          }}
        >
          First-party intent tracking (anonymous → known)
        </Typography>

        <Typography
          sx={{
            fontSize: { xs: '1.075rem', md: '1.2rem' },
            lineHeight: 1.7,
            color: 'rgba(148,163,184,0.9)',
            mb: 4,
          }}
        >
          SpaceGTM captures first-party intent across your site using tracking tools like PostHog and Marketo. We track
          anonymous visitors, record their service-lane behavior over time, and when they submit a request—or we
          identify them via your systems—we link that history to a known person and account.
        </Typography>

        <Typography
          sx={{
            fontFamily: 'monospace',
            fontSize: { xs: '1rem', md: '1.1rem' },
            lineHeight: 1.6,
            color: '#F5F5F7',
            borderLeft: `3px solid ${PrimaryColor}`,
            pl: 3,
            mb: 5,
          }}
        >
          So sales sees the full &quot;why now&quot; timeline for every opportunity—before the first call.
        </Typography>

        <Box
          sx={{
            mt: 2,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Image
            src="/marketo.png"
            alt="Marketo logo"
            width={125}
            height={36}
            style={{ objectFit: 'contain' }}
          />
          <Image
            src="/posthog.png"
            alt="PostHog logo"
            width={140}
            height={40}
            style={{ objectFit: 'contain' }}
          />
        </Box>
      </Container>
    </Box>
  );
}