'use client';

import React from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { Box, Button, Container, Grid, Typography } from '@mui/material';
import { PrimaryColor } from '@/config';

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'] });

export type PricingCard = {
  badge?: string;
  title: string;
  bullets: string[];
};

export interface SpaceABMPricingBlockProps {
  headline?: string;
  subhead?: string;
  cards?: PricingCard[];
  footnote?: string;
  ctaLabel?: string;
}

const DEFAULT_CARDS: PricingCard[] = [
  {
    title: 'Qualified Opportunity Feed (the brief)',
    bullets: [
      'Structured procurement brief + metadata',
      'Route/page, readiness score, routing tags',
      'Compliance posture flags for filtering',
    ],
  },
  {
    badge: 'MOST POPULAR',
    title: 'Account Context (SpaceABM portal)',
    bullets: [
      'Account + domain, intent level (H/M/L)',
      'Evidence: pages, widget steps, fields',
      'Buying committee signals + changes over time',
    ],
  },
  {
    title: "Proof Pack (why it's real)",
    bullets: [
      'One-page "evidence timeline" per opportunity',
      'Shows progression: pricing → config → submit',
      'What changed: budget/timeline/readiness upgrades',
    ],
  },
];

const DEFAULT_FOOTNOTE =
  'The biggest quality drivers are brief completeness, verification (domain + role), and evidence depth. Want comparables? Generate a quote-grade procurement brief.';

const DEFAULT_CTA_LABEL = 'Contact Sales';

const DEFAULT_HEADLINE = 'How Space ABM qualified opportunities are priced.';
const DEFAULT_SUBHEAD =
  "You're not buying a lead. You're buying a quote-grade opportunity + account intent + proof trail.";

export function SpaceABMPricingBlock({
  headline = DEFAULT_HEADLINE,
  subhead = DEFAULT_SUBHEAD,
  cards = DEFAULT_CARDS,
  footnote = DEFAULT_FOOTNOTE,
  ctaLabel = DEFAULT_CTA_LABEL,
}: SpaceABMPricingBlockProps) {
  return (
    <Box
      component="section"
      id="space-abm-pricing"
      sx={{
        py: { xs: 8, md: 10 },
        backgroundColor: '#000000',
        color: '#FFFFFF',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ mb: 8 }}>
          <Typography
            component="h2"
            sx={{
              fontFamily: jetbrainsMono.style.fontFamily,
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '64px' },
              lineHeight: 1.2,
              fontWeight: 700,
              color: '#F5F5F7',
              mb: subhead ? 2 : 6,
            }}
          >
            {headline}
          </Typography>
          {subhead && (
            <Typography
              sx={{
                fontSize: '1rem',
                lineHeight: 1.5,
                color: 'rgba(148,163,184,0.9)',
                mb: 6,
              }}
            >
              {subhead}
            </Typography>
          )}

          <Grid container spacing={4} sx={{ mb: 6 }}>
            {cards.map((card, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Box
                  role="group"
                  sx={{
                    pt: 1.5,
                    px: 3,
                    pb: 8,
                    borderRadius: 2,
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderTop: `2px solid ${PrimaryColor}`,
                    bgcolor: 'rgba(10,10,10,0.8)',
                    height: '100%',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 0 50px -12px rgba(255, 121, 27, 0.2)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 0 60px -8px rgba(255, 121, 27, 0.4)',
                    },
                  }}
                >
                  <Box sx={{ height: '1.75rem', mb: 0.5, display: 'flex', alignItems: 'flex-start' }}>
                    {card.badge && (
                      <Typography
                        sx={{
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          textTransform: 'uppercase',
                          letterSpacing: 2,
                          color: PrimaryColor,
                          fontWeight: 500,
                        }}
                      >
                        {card.badge}
                      </Typography>
                    )}
                  </Box>
                  <Typography
                    component="h3"
                    sx={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      mb: 1.5,
                    }}
                  >
                    {card.title}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {card.bullets.map((bullet, idx) => (
                      <Typography
                        key={idx}
                        sx={{
                          fontSize: '0.875rem',
                          lineHeight: 1.75,
                          color: 'rgba(148,163,184,0.9)',
                        }}
                      >
                        {bullet}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography
              sx={{
                fontSize: '1rem',
                color: 'rgba(148,163,184,0.9)',
                fontStyle: 'italic',
                maxWidth: 720,
                mx: 'auto',
              }}
            >
              {footnote}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Button
              variant="outlined"
              sx={{
                borderRadius: 999,
                px: 3,
                textTransform: 'none',
                bgcolor: 'transparent',
                color: PrimaryColor,
                borderColor: PrimaryColor,
                '&:hover': {
                  bgcolor: PrimaryColor,
                  borderColor: PrimaryColor,
                  color: '#FFF',
                },
                '&:focus-visible': {
                  outline: `2px solid ${PrimaryColor}`,
                  outlineOffset: 2,
                },
              }}
            >
              {ctaLabel}
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
