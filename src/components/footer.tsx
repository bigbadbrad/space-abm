'use client';

import type { FC } from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import Link from 'next/link';
import { LogoMoney } from './logo-money';
import XIcon from '@mui/icons-material/X';

export const Footer: FC = () => {
  const colorScheme: 'dark' | 'light' = 'dark';
  const iconColor = colorScheme === 'dark' ? '#d1d1d2' : '#444444';

  return (
    <Box
      sx={{
        backgroundColor: colorScheme === 'dark' ? '#1d1d1f' : '#f3f3f6',
        textAlign: 'center',
        pt: 8,
        pb: 10,
        color: colorScheme === 'dark' ? '#d1d1d2' : '#444444',
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ flexDirection: 'column', display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <Link href="/" style={{ display: 'flex', justifyContent: 'center' }}>
            <LogoMoney color={colorScheme === 'dark' ? '#F5F5F7' : '#111827'} height={120} />
          </Link>
          <Box sx={{ mt: 4, display: 'flex', flexDirection: { xs: 'row', md: 'row' }, alignItems: 'center', justifyContent: 'center', gap: 1, width: '100%' }}>
            <Link href="/dashboard/how-it-works"><Button sx={{ color: iconColor, textTransform: 'none' }}>How it works</Button></Link>
            <Link href="/"><Button sx={{ color: iconColor, textTransform: 'none' }}>About</Button></Link>
            <Link href="/"><Button sx={{ color: iconColor, textTransform: 'none' }}>Press</Button></Link>
            <Box sx={{ position: 'relative', display: 'inline-block', '&:hover::before': { content: '"hello@fullorbit.co"', position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(0, 0, 0, 0.9)', color: 'white', padding: '8px 12px', borderRadius: '4px', fontSize: '0.875rem', whiteSpace: 'nowrap', zIndex: 9999, pointerEvents: 'none', marginBottom: '8px' } }}>
              <Button sx={{ color: iconColor, textTransform: 'none' }}>Contact</Button>
            </Box>
          </Box>
          <Box sx={{ pt: 0, display: 'flex', flexDirection: { xs: 'row', md: 'row' }, alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <a href="https://x.com/fullorbitco" target="_blank" rel="noopener noreferrer">
              <XIcon sx={{ color: colorScheme === 'dark' ? '#d1d1d2' : '#444444', fontSize: '2.6rem', mx: '0.4rem' }} />
            </a>
          </Box>
          <Typography variant="subtitle1" sx={{ pt: 3, pb: 5 }}>
            © 2026 Space ABM<br />
            All Rights Reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};
