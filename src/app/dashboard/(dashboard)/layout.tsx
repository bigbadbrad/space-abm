'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import GlobalStyles from '@mui/material/GlobalStyles';

import { AuthGuard } from '@/components/auth/auth-guard';
import { ABMFilterProvider } from '@/contexts/abm-filter-context';
import { ABMMainNav } from '@/components/abm/layout/main-nav';
import { ABMSideNav } from '@/components/abm/layout/side-nav';

interface LayoutProps {
  children: React.ReactNode;
}

export default function ABMDashboardLayout({ children }: LayoutProps): React.JSX.Element {
  return (
    <AuthGuard>
      <React.Suspense
        fallback={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: '#050505' }}>
            <CircularProgress sx={{ color: '#9CA3AF' }} size={32} />
          </Box>
        }
      >
      <ABMFilterProvider>
      <GlobalStyles
        styles={{
          body: {
            '--MainNav-height': '64px',
            '--MainNav-zIndex': 1000,
            '--SideNav-width': '280px',
            '--SideNav-zIndex': 1100,
            '--MobileNav-width': '320px',
            '--MobileNav-zIndex': 1100,
          },
        }}
      />
      <Box
        sx={{
          bgcolor: '#050505',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          minHeight: '100vh',
        }}
      >
        <ABMSideNav />
        <Box sx={{ display: 'flex', flex: '1 1 auto', flexDirection: 'column', pl: { lg: 'var(--SideNav-width)' } }}>
          <ABMMainNav />
          <main>{children}</main>
        </Box>
      </Box>
      </ABMFilterProvider>
      </React.Suspense>
    </AuthGuard>
  );
}
