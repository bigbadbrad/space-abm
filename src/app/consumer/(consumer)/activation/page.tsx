'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { RocketLaunch as RocketLaunchIcon } from '@phosphor-icons/react/dist/ssr/RocketLaunch';

export default function ConsumerActivationPage(): React.JSX.Element {
  return (
    <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <RocketLaunchIcon size={18} style={{ color: '#FFFFFF' }} />
          <Typography sx={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600 }}>Activation</Typography>
        </Box>
        <Typography sx={{ color: '#9CA3AF', fontSize: '0.8125rem', mt: 0.5 }}>Consumer surface — placeholder</Typography>
      </Box>
      <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>
        This is the Activation tab. Content coming soon.
      </Typography>
    </Box>
  );
}
