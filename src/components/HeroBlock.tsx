'use client';

import type { FC } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { Box, Container, Typography } from '@mui/material';

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'] });

export const HeroBlock: FC = () => {
  return (
    <Box sx={{ backgroundColor: '#000000', pt: { xs: 12, md: 16 }, pb: { xs: 8, md: 12 }, borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
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
          The First ABM Platform Built for Missions, Not Just Leads.
        </Typography>
        <Typography variant="body1" sx={{ color: '#d1d1d2', fontSize: { xs: '1rem', sm: '1.125rem' }, lineHeight: 1.8, textAlign: 'left' }}>
          Unlike 6sense or Demandbase—which are built to be generic "intent + ads + orchestration" layers—SpaceABM is designed around the actual unit of work in space: a mission-driven procurement request. You can bolt custom fields and segments onto a horizontal ABM tool, but you still end up forcing space-specific reality (interfaces, orbit regimes, lead times, compliance gates, capacity windows, multi-leg service chains) through a marketing-shaped funnel.
        </Typography>
        <Typography variant="body1" sx={{ color: '#d1d1d2', fontSize: { xs: '1rem', sm: '1.125rem' }, lineHeight: 1.8, textAlign: 'left', mt: 3 }}>
          SpaceABM starts where those platforms stop: it turns first-party behavior into service-lane intent and constraints, generates procurement-ready briefs, and orchestrates the next steps all the way to quotes, scheduling, and routing to fulfillable capacity—with explainable "why this is hot" logic instead of a black-box score.
        </Typography>
        <Typography variant="body1" sx={{ color: '#d1d1d2', fontSize: { xs: '1rem', sm: '1.125rem' }, lineHeight: 1.8, textAlign: 'left', mt: 3 }}>
          The result is less vendor glue code, less brittle customization, and a system that&apos;s optimized for closing space services deals, not just running campaigns.
        </Typography>
      </Container>
    </Box>
  );
};
