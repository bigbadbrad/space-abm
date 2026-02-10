'use client';

import React from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { Box, Container, Typography } from '@mui/material';

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'] });

export function HorizontalABMBlock() {
  return (
    <Box
      component="section"
      id="horizontal-abm"
      sx={{
        pt: { xs: 8, md: 17 },
        pb: { xs: 8, md: 10 },
        backgroundColor: '#000000',
      }}
    >
      <Container maxWidth="md" sx={{ transform: { xs: 'none', md: 'translateX(-25%)' } }}>
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
            Horizontal ABM tools weren&apos;t built for space procurement.
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: '1.125rem', md: '1.25rem' },
              lineHeight: 1.6,
              color: 'rgba(148,163,184,0.9)',
              mb: 3,
            }}
          >
            Tools like 6sense and Demandbase are generic &quot;intent + ads + orchestration&quot; layers. But in space, the unit of work isn&apos;t a marketing lead — it&apos;s a mission-driven procurement request with constraints: interfaces, orbit regimes, lead times, compliance gates, capacity windows, and multi-leg service chains.
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: '1.125rem', md: '1.25rem' },
              lineHeight: 1.6,
              color: 'rgba(148,163,184,0.9)',
            }}
          >
            You can bolt space fields onto a marketing funnel… but you still force space reality through a lead-shaped workflow.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
