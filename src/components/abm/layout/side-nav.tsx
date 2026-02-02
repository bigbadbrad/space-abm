'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';
import { isNavItemActive } from '@/lib/is-nav-item-active';
import { LogoMoney } from '@/components/logo-money';
import { PrimaryColor } from '@/config';
import { useUser } from '@/hooks/use-user';

import { abmNavItems } from './config';
import { navIcons } from '@/components/dashboard/layout/nav-icons';

export function ABMSideNav(): React.JSX.Element {
  const pathname = usePathname();
  const { user } = useUser();
  const isAdmin = user?.role === 'internal_admin';
  const visibleItems = React.useMemo(
    () => abmNavItems.filter((item) => !item.adminOnly || isAdmin),
    [isAdmin]
  );

  return (
    <Box
      sx={{
        '--SideNav-background': 'var(--mui-palette-neutral-950)',
        '--SideNav-color': 'var(--mui-palette-common-white)',
        '--NavItem-color': 'var(--mui-palette-neutral-300)',
        '--NavItem-hover-background': 'rgba(255, 255, 255, 0.04)',
        '--NavItem-active-background': 'var(--mui-palette-primary-main)',
        '--NavItem-active-color': 'var(--mui-palette-primary-contrastText)',
        '--NavItem-icon-color': 'var(--mui-palette-neutral-400)',
        '--NavItem-icon-active-color': 'var(--mui-palette-primary-contrastText)',
        bgcolor: 'var(--SideNav-background)',
        color: 'var(--SideNav-color)',
        display: { xs: 'none', lg: 'flex' },
        flexDirection: 'column',
        height: '100%',
        left: 0,
        maxWidth: '100%',
        position: 'fixed',
        scrollbarWidth: 'none',
        top: 0,
        width: 'var(--SideNav-width)',
        zIndex: 'var(--SideNav-zIndex)',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      <Stack spacing={2} sx={{ p: 3 }}>
        <Box
          component={RouterLink}
          href={paths.home}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            textDecoration: 'none',
            mb: 2,
            transition: 'opacity 0.2s ease',
            '&:hover': { opacity: 0.8 },
          }}
        >
          <LogoMoney primaryColor={PrimaryColor} secondaryColor="#F5F5F7" textColor="#F5F5F7" height={100} />
        </Box>
        <Typography sx={{ color: '#71717a', fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          ABM
        </Typography>
      </Stack>
      <Divider sx={{ borderColor: 'var(--mui-palette-neutral-700)' }} />
      <Box component="nav" sx={{ flex: '1 1 auto', p: '12px' }}>
        {renderNavItems({ pathname, items: visibleItems })}
      </Box>
      <Divider sx={{ borderColor: 'var(--mui-palette-neutral-700)' }} />
      <Box sx={{ p: 2 }}>
        <Box
          component={RouterLink}
          href={paths.abm.howItWorks}
          sx={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            color: 'var(--mui-palette-neutral-400)',
            fontSize: '0.875rem',
            fontWeight: 500,
            transition: 'color 0.2s ease',
            '&:hover': { color: 'var(--mui-palette-common-white)' },
          }}
        >
          How it works
        </Box>
      </Box>
    </Box>
  );
}

function renderNavItems({ items = [], pathname }: { items?: NavItemConfig[]; pathname: string }): React.JSX.Element {
  const children = items.reduce((acc: React.ReactNode[], curr: NavItemConfig): React.ReactNode[] => {
    const { key, ...item } = curr;
    acc.push(<NavItem key={key} pathname={pathname} {...item} />);
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
}

function NavItem({ disabled, external, href, icon, matcher, pathname, title }: NavItemProps): React.JSX.Element {
  const active = isNavItemActive({ disabled, external, href, matcher, pathname });
  const Icon = icon ? navIcons[icon] : null;
  return (
    <li>
      <Box
        {...(href ? { component: external ? 'a' : RouterLink, href, target: external ? '_blank' : undefined, rel: external ? 'noreferrer' : undefined } : { role: 'button' })}
        sx={{
          alignItems: 'center',
          borderRadius: 1,
          color: 'var(--NavItem-color)',
          cursor: 'pointer',
          display: 'flex',
          flex: '0 0 auto',
          gap: 1,
          p: '6px 16px',
          position: 'relative',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          ...(disabled && { bgcolor: 'var(--NavItem-disabled-background)', color: 'var(--NavItem-disabled-color)', cursor: 'not-allowed' }),
          ...(active && { bgcolor: 'var(--NavItem-active-background)', color: 'var(--NavItem-active-color)' }),
        }}
      >
        <Box sx={{ alignItems: 'center', display: 'flex', justifyContent: 'center', flex: '0 0 auto' }}>
          {Icon ? <Icon fill={active ? 'var(--NavItem-icon-active-color)' : 'var(--NavItem-icon-color)'} fontSize="var(--icon-fontSize-md)" weight={active ? 'fill' : undefined} /> : null}
        </Box>
        <Box sx={{ flex: '1 1 auto' }}>
          <Typography component="span" sx={{ color: 'inherit', fontSize: '0.875rem', fontWeight: 500, lineHeight: '28px' }}>
            {title}
          </Typography>
        </Box>
      </Box>
    </li>
  );
}
