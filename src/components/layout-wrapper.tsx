'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Box } from '@mui/material';
import { MainNavbar } from '@/components/main-navbar';
import { Footer } from '@/components/footer';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const isDashboardAppRoute = pathname?.startsWith('/dashboard') && !pathname?.startsWith('/dashboard/how-it-works');

  if (isDashboardAppRoute) {
    return <React.Fragment>{children}</React.Fragment>;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flex: '1 1 auto',
        flexDirection: 'column',
        backgroundColor: '#000000',
        minHeight: '100vh',
      }}
    >
      <MainNavbar />
      <Box
        component="main"
        sx={{
          paddingTop: { xs: '80px', sm: '72px' },
          backgroundColor: '#000000',
        }}
      >
        {children}
      </Box>
      <Footer />
    </Box>
  );
}
