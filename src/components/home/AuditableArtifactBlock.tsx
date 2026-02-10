'use client';

import React from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { Box, Container, Grid, Typography } from '@mui/material';
import { SolidAccentLine } from './GradientLine';

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'] });

const ITEMS = [
  {
    title: 'Lead Request (canonical artifact)',
    body: 'Every submission is stored as a Lead Request — the auditable sales artifact you can route and revisit.',
  },
  {
    title: 'Procurement Brief (quote-grade output)',
    body: 'Structured requirements, schedule window, readiness, budget band, org + contact — ready for quoting.',
  },
  {
    title: 'Intent Signals (explainable heat)',
    body: 'A time-series trail that shows exactly why an account is heating up — not just a score.',
  },
];

export function AuditableArtifactBlock() {
  return (
    <Box
      component="section"
      id="auditable-artifact"
      sx={{
        py: { xs: 8, md: 10 },
        backgroundColor: '#000000',
        color: '#FFFFFF',
      }}
    >
      <Container maxWidth="md" sx={{ transform: { xs: 'none', md: 'translateX(-10%)' } }}>
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
            Every interaction becomes an auditable sales artifact.
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: '1.125rem', md: '1.25rem' },
              lineHeight: 1.6,
              color: 'rgba(148,163,184,0.9)',
              mb: 6,
            }}
          >
            Turn anonymous interest and reservation requests into auditable artifacts, explainable intent, and ranked accounts — so Sales and Ops work from the same canonical record.
          </Typography>

          <Grid container spacing={4}>
            {ITEMS.map((item, index) => (
              <Grid key={item.title} item xs={12} sm={6} md={4} sx={{ minWidth: 0, pl: index === 0 ? 0 : undefined }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    pl: index === 0 ? 0 : { xs: 2, md: 3 },
                    pr: { xs: 2, md: 3 },
                  }}
                >
                  <SolidAccentLine />
                  <Typography sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' }, fontWeight: 600, color: '#FFFFFF', mb: 2 }}>
                    {item.title}
                  </Typography>
                  <Typography sx={{ fontSize: { xs: '1rem', md: '1.125rem' }, lineHeight: 1.6, color: 'rgba(148,163,184,0.9)' }}>
                    {item.body}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}
