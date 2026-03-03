'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { GearSix as GearSixIcon } from '@phosphor-icons/react/dist/ssr/GearSix';

export default function ConsumerSettingsPage(): React.JSX.Element {
  return (
    <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <GearSixIcon size={18} style={{ color: '#FFFFFF' }} />
          <Typography sx={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600 }}>Settings</Typography>
        </Box>
        <Typography sx={{ color: '#9CA3AF', fontSize: '0.8125rem', mt: 0.5 }}>Consumer surface — placeholder</Typography>
      </Box>
      <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>
        This is the Settings tab. Content coming soon.
      </Typography>
    </Box>
  );
}
