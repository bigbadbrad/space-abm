'use client';

// Suppress React 19 ref warnings from MUI v5 (harmless; upgrade to MUI v6 for full support)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Accessing element.ref was removed in React 19')) {
      return;
    }
    originalError.apply(console, args);
  };
}

import React from 'react';
import type { FC } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AppBar, Box, IconButton, MenuList, MenuItem, Popover, Toolbar } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

import { PrimaryColor } from '@/config';
import { paths } from '@/paths';
import { authClient } from '@/lib/auth/client';
import { logger } from '@/lib/default-logger';
import { useUser } from '@/hooks/use-user';
import { LogoCool } from './logo-cool';

export const MainNavbar: FC = () => {
  const colorScheme: 'dark' | 'light' = 'dark';
  const logoSecondaryColor = colorScheme === 'dark' ? '#F5F5F7' : '#111827';
  const logoTextColor = colorScheme === 'dark' ? '#F5F5F7' : '#111827';

  const pathname = usePathname();
  const router = useRouter();
  const { user, checkSession } = useUser();

  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleSignIn = React.useCallback(() => {
    handleMenuClose();
    window.location.href = paths.auth.signIn;
  }, []);

  const handleSignOut = React.useCallback(async (): Promise<void> => {
    try {
      const { error } = await authClient.signOut();
      if (error) {
        logger.error('Sign out error', error);
        return;
      }
      await checkSession?.();
      router.refresh();
      handleMenuClose();
    } catch (err) {
      logger.error('Sign out error', err);
    }
  }, [checkSession, router]);

  React.useEffect(() => {
    handleMenuClose();
  }, [pathname]);

  return (
    <AppBar
      elevation={0}
      sx={{
        backgroundColor: colorScheme === 'dark' ? '#1d1d1f' : '#fafafc',
        color: colorScheme === 'dark' ? 'text.secondary' : 'text.primary',
        borderTop: colorScheme === 'dark'
          ? '1px solid rgba(255, 255, 255, 0.24)'
          : '1px solid rgba(0, 0, 0, 0.12)',
        borderBottom: colorScheme === 'dark'
          ? '1px solid rgba(255, 255, 255, 0.24)'
          : '1px solid rgba(0, 0, 0, 0.12)',
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          width: '100%',
          px: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'auto 1fr auto', sm: '1fr auto 1fr' },
          alignItems: 'center',
          minHeight: { xs: 64, sm: 72 },
        }}
      >
        {/* LEFT spacer (reserved for future nav) */}
        <Box sx={{ gridColumn: { xs: '1 / 2', sm: '1 / 2' } }} />

        {/* CENTER — logo */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gridColumn: { xs: '2 / 3', sm: '2 / 3' },
          }}
        >
          <Link
            href="/"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              maxWidth: '350px',
              margin: '0 auto',
            }}
          >
            <LogoCool
              textColor={logoTextColor}
              height={20}
            />
          </Link>
        </Box>

        {/* RIGHT — hamburger menu for dashboard / auth */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gridColumn: { xs: '3 / 4', sm: '3 / 4' },
          }}
        >
          <IconButton
            onClick={handleMenuOpen}
            sx={{ color: '#FFFFFF' }}
            aria-label="open navigation menu"
            aria-controls={menuOpen ? 'main-nav-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={menuOpen ? 'true' : undefined}
          >
            <MenuIcon />
          </IconButton>
          <Popover
            id="main-nav-menu"
            open={menuOpen}
            anchorEl={menuAnchorEl}
            onClose={handleMenuClose}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: { sx: { minWidth: 160, mt: 1.5 } },
            }}
          >
            <MenuList disablePadding sx={{ p: '8px', '& .MuiMenuItem-root': { borderRadius: 1 } }}>
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  window.location.href = paths.abm.overview;
                }}
              >
                Dashboard
              </MenuItem>
              {user ? (
                <MenuItem onClick={handleSignOut}>Sign out</MenuItem>
              ) : (
                <MenuItem onClick={handleSignIn}>Sign in</MenuItem>
              )}
            </MenuList>
          </Popover>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
