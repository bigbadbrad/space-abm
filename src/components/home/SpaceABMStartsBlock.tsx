'use client';

import React from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { Box, Container, Typography } from '@mui/material';
import { PrimaryColor } from '@/config';

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'] });

export function SpaceABMStartsBlock() {
  return (
    <Box
      component="section"
      id="space-abm-starts"
      sx={{
        py: { xs: 8, md: 10 },
        backgroundColor: '#000000',
      }}
    >
      <Container maxWidth="md" sx={{ transform: { xs: 'none', md: 'translateX(25%)' } }}>
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
            SpaceGTM starts where those platforms stop.
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: '1.125rem', md: '1.25rem' },
              lineHeight: 1.6,
              color: 'rgba(148,163,184,0.9)',
              mb: 3,
            }}
          >
            SpaceGTM captures intent as prospects explore service lanes, then generates procurement-grade briefs and orchestrates next steps all the way to quotes, scheduling, and routing to fulfillable capacity — with explainable &quot;why this is hot&quot; logic (not a black-box score).
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', mt: 3 }}>
            <BulletItem text="Procurement brief (quote-grade)" />
            <BulletItem text="Explainable intent trail (why now)" />
            <BulletItem text="Mission object to track from first signal → reservation" />
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
