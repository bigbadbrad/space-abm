'use client';

import React from 'react';
import { Box } from '@mui/material';
import { PrimaryColor } from '@/config';

interface GradientLineProps {
  sx?: Record<string, unknown>;
}

// Original thin gradient line used across the site
export function GradientLine({ sx }: GradientLineProps) {
  const primaryDark = PrimaryColor;
  const primaryMid = 'rgba(255, 121, 27, 0.7)';
  const primaryLight = 'rgba(255, 121, 27, 0.4)';
  const primaryVeryLight = 'rgba(255, 121, 27, 0.2)';

  return (
    <Box
      component="div"
      sx={{
        height: '1px',
        width: '100%',
        display: 'block',
        background: `linear-gradient(90deg, ${primaryDark}, ${primaryMid} 31%, ${primaryLight} 68%, ${primaryVeryLight})`,
        mb: 3,
        ...sx,
      }}
    />
  );
}

// New solid accent line (thicker, matches vertical accents)
export function SolidAccentLine({ sx }: GradientLineProps) {
  return (
    <Box
      component="div"
      sx={{
        height: '2px',
        width: '100%',
        display: 'block',
        backgroundColor: PrimaryColor,
        mb: 3,
        ...sx,
      }}
    />
  );
}
