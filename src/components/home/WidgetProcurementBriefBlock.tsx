'use client';

import React from 'react';
import Image from 'next/image';
import { JetBrains_Mono } from 'next/font/google';
import { Box, Button, Container, Grid, Typography } from '@mui/material';
import { PrimaryColor } from '@/config';

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'] });

export function WidgetProcurementBriefBlock() {
  return (
    <Box
      component="section"
      id="widget-procurement-brief"
      sx={{
        py: { xs: 8, md: 10 },
        backgroundColor: '#000000',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                bgcolor: '#050509',
                width: '100%',
                transform: { xs: 'none', md: 'scale(1.25)' },
                transformOrigin: 'right center',
              }}
            >
              <Image
                src="/widget.png"
                alt="Reservation widget preview"
                width={800}
                height={600}
                style={{ width: '100%', height: 'auto', display: 'block' }}
                priority
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={8}>
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
                The widget that produces a procurement brief.
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: '1.125rem', md: '1.25rem' },
                  lineHeight: 1.6,
                  color: 'rgba(148,163,184,0.9)',
                  mb: 3,
                }}
              >
                Not a &quot;contact us&quot; form — a progressive Request a Reservation flow that adapts to the selected service lane and only asks what matters.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', mt: 3 }}>
                <BulletItem text="Progressive qualification: Step-by-step questions adapt to the selected service lane so you only ask what matters." />
                <BulletItem text="Procurement Brief output: Every submission becomes a structured, auditable brief (requirements, schedule, readiness, budget band, contact + org)." />
                <BulletItem text="Instant routing + prioritization: The backend scores each submission and assigns it to the right lane/owner without manual triage." />
                <BulletItem text="No lost context: The brief stays linked to the Account and Person, so sales + ops see the same canonical artifact." />
                <BulletItem text="Built for &quot;quote-ready&quot; deals: Captures the details vendors need to respond fast (not a generic marketing lead)." />
              </Box>
              <Box sx={{ mt: 4 }}>
                <Button
                  component="a"
                  href="https://fullorbit.co?utm_source=space-gtm&utm_medium=cta&utm_campaign=homepage-widget"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outlined"
                  sx={{
                    borderRadius: 999,
                    px: 3,
                    textTransform: 'none',
                    bgcolor: 'transparent',
                    color: '#FFFFFF',
                    borderColor: PrimaryColor,
                    '&:hover': {
                      bgcolor: PrimaryColor,
                      borderColor: PrimaryColor,
                      color: '#FFFFFF',
                    },
                    '&:focus-visible': {
                      outline: `2px solid ${PrimaryColor}`,
                      outlineOffset: 2,
                    },
                  }}
                >
                  See widget in action
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
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
