import * as React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps): React.JSX.Element {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <Box sx={{ display: 'flex', flex: '1 1 auto', flexDirection: 'column' }}>
        <Box
          sx={{
            alignItems: 'flex-start',
            display: 'flex',
            flex: '1 1 auto',
            justifyContent: 'center',
            pt: { xs: 4, sm: 16 },
            px: 3,
            pb: { xs: 4, sm: 10 },
          }}
        >
          <Box sx={{ maxWidth: '450px', width: '100%' }}>{children}</Box>
        </Box>
      </Box>
    </Box>
  );
}

