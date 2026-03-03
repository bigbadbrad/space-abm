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
import { LogoSpaceGtmStacked } from '@/components/logo-space-gtm-stacked';

import { consumerNavItems } from './config';
import { navIcons } from '@/components/dashboard/layout/nav-icons';
import { ConsumerPropertySelect } from './consumer-property-select';

export interface ConsumerMobileNavProps {
  onClose?: () => void;
  open?: boolean;
}

export function ConsumerMobileNav({ open, onClose }: ConsumerMobileNavProps): React.JSX.Element {
  const pathname = usePathname();

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
        <Box component={RouterLink} href={paths.consumer.dashboard} sx={{ display: 'inline-flex' }} onClick={onClose}>
          <LogoSpaceGtmStacked color="#F5F5F7" height={48} />
        </Box>
      </Stack>
      <Box sx={{ px: 2, pb: 1 }}>
        <ConsumerPropertySelect />
      </Box>
      <Box component="nav" sx={{ flex: '1 1 auto', p: '12px' }}>
        {renderNavItems({ pathname, items: consumerNavItems, onClose })}
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
