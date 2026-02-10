'use client';

import type { FC } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { Box, Container, Typography } from '@mui/material';

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'] });

export const HeroBlock: FC = () => {
  return (
    <Box sx={{ backgroundColor: '#000000', pt: { xs: 4, md: 20 }, pb: { xs: 8, md: 12 } }}>
      <Container maxWidth="md">
        <Typography
          component="h1"
          sx={{
            fontFamily: jetbrainsMono.style.fontFamily,
            fontSize: { xs: '2.5rem', sm: '3.5rem', md: '64px' },
            fontWeight: 700,
            color: '#F5F5F7',
            lineHeight: 1.2,
            mb: 4,
            textAlign: 'center',
          }}
        >
          The first ABM platform built for missions, not just leads.
        </Typography>
        <Typography
          sx={{
            fontSize: { xs: '1.125rem', md: '1.25rem' },
            lineHeight: 1.6,
            color: 'rgba(148,163,184,0.9)',
            textAlign: 'left',
            mb: 3,
          }}
        >
          Space GTM turns first-party behavior into service-lane intent + mission constraints, then outputs a procurement-ready brief your team can route to quotes, scheduling, and fulfillable capacity.
        </Typography>
        <Typography
          sx={{
            fontSize: { xs: '1.125rem', md: '1.25rem' },
            lineHeight: 1.6,
            color: 'rgba(148,163,184,0.9)',
            textAlign: 'left',
          }}
        >
          Less vendor glue code. Less brittle customization. Built to close space services deals — not just run campaigns.
        </Typography>
      </Container>
    </Box>
  );
};
