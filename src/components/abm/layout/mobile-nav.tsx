'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';
import { isNavItemActive } from '@/lib/is-nav-item-active';
import { Logo } from '@/components/core/logo';
import { useUser } from '@/hooks/use-user';

import { abmNavItems } from './config';
import { navIcons } from '@/components/dashboard/layout/nav-icons';

export interface ABMMobileNavProps {
  onClose?: () => void;
  open?: boolean;
}

export function ABMMobileNav({ open, onClose }: ABMMobileNavProps): React.JSX.Element {
  const pathname = usePathname();
  const { user } = useUser();
  const isAdmin = user?.role === 'internal_admin';
  const visibleItems = React.useMemo(
    () => abmNavItems.filter((item) => !item.adminOnly || isAdmin),
    [isAdmin]
  );

  return (
    <Drawer
      PaperProps={{
        sx: {
          '--MobileNav-background': 'var(--mui-palette-neutral-950)',
          '--NavItem-color': 'var(--mui-palette-neutral-300)',
          '--NavItem-active-background': 'var(--mui-palette-primary-main)',
          '--NavItem-active-color': 'var(--mui-palette-primary-contrastText)',
          '--NavItem-icon-color': 'var(--mui-palette-neutral-400)',
          '--NavItem-icon-active-color': 'var(--mui-palette-primary-contrastText)',
          bgcolor: 'var(--MobileNav-background)',
          color: 'var(--MobileNav-color)',
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '100%',
          width: 'var(--MobileNav-width)',
          zIndex: 'var(--MobileNav-zIndex)',
        },
      }}
      onClose={onClose}
      open={open}
    >
      <Stack spacing={2} sx={{ p: 3 }}>
        <Box component={RouterLink} href={paths.home} sx={{ display: 'inline-flex' }} onClick={onClose}>
          <Logo color="light" height={32} width={122} />
        </Box>
        <Typography sx={{ color: '#71717a', fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          ABM
        </Typography>
      </Stack>
      <Box component="nav" sx={{ flex: '1 1 auto', p: '12px' }}>
        {renderNavItems({ pathname, items: visibleItems, onClose })}
      </Box>
      <Box sx={{ p: 2 }}>
        <Box component={RouterLink} href={paths.abm.howItWorks} sx={{ color: 'var(--mui-palette-neutral-400)', fontSize: '0.875rem', textDecoration: 'none', '&:hover': { color: 'white' } }} onClick={onClose}>
          How it works
        </Box>
      </Box>
    </Drawer>
  );
}

function renderNavItems({ items = [], pathname, onClose }: { items?: NavItemConfig[]; pathname: string; onClose?: () => void }): React.JSX.Element {
  const children = items.reduce((acc: React.ReactNode[], curr: NavItemConfig): React.ReactNode[] => {
    const { key, ...item } = curr;
    acc.push(<NavItem key={key} pathname={pathname} onClose={onClose} {...item} />);
    return acc;
  }, []);
  return (
    <Stack component="ul" spacing={1} sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {children}
    </Stack>
  );
}

interface NavItemProps extends Omit<NavItemConfig, 'items'> {
  pathname: string;
  onClose?: () => void;
}

function NavItem({ disabled, external, href, icon, matcher, pathname, title, onClose }: NavItemProps): React.JSX.Element {
  const active = isNavItemActive({ disabled, external, href, matcher, pathname });
  const Icon = icon ? navIcons[icon] : null;
  return (
    <li>
      <Box
        {...(href ? { component: external ? 'a' : RouterLink, href, target: external ? '_blank' : undefined, rel: external ? 'noreferrer' : undefined } : { role: 'button' })}
        onClick={onClose}
        sx={{
          alignItems: 'center',
          borderRadius: 1,
          color: 'var(--NavItem-color)',
          cursor: 'pointer',
          display: 'flex',
          flex: '0 0 auto',
          gap: 1,
          p: '6px 16px',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          ...(disabled && { cursor: 'not-allowed', opacity: 0.5 }),
          ...(active && { bgcolor: 'var(--NavItem-active-background)', color: 'var(--NavItem-active-color)' }),
        }}
      >
        <Box sx={{ alignItems: 'center', display: 'flex', justifyContent: 'center', flex: '0 0 auto' }}>
          {Icon ? <Icon fill={active ? 'var(--NavItem-icon-active-color)' : 'var(--NavItem-icon-color)'} fontSize="var(--icon-fontSize-md)" weight={active ? 'fill' : undefined} /> : null}
        </Box>
        <Typography component="span" sx={{ color: 'inherit', fontSize: '0.875rem', fontWeight: 500, lineHeight: '28px' }}>
          {title}
        </Typography>
      </Box>
    </li>
  );
}
