'use client';

import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { List as ListIcon } from '@phosphor-icons/react/dist/ssr/List';
import { usePathname } from 'next/navigation';

import { usePopover } from '@/hooks/use-popover';
import { paths } from '@/paths';
import { useUser } from '@/hooks/use-user';
import { useConsumerProperty } from '@/contexts/consumer-property-context';
import { isEverselfPropertyName } from '@/lib/consumer/everself-property';

import { ConsumerMobileNav } from './consumer-mobile-nav';
import { UserPopover } from '@/components/dashboard/layout/user-popover';

const consumerBreadcrumbMap: Record<string, string> = {
  [paths.consumer.dashboard]: 'Dashboard',
  [paths.consumer.acquisition]: 'Acquisition',
  [paths.consumer.appointments]: 'Appointments',
  [paths.consumer.control]: 'Ad Campaigns',
  [paths.consumer.callCenter]: 'Call Center',
  [paths.consumer.activation]: 'Activation',
  [paths.consumer.retention]: 'Retention',
  [paths.consumer.monetization]: 'Monetization',
  [paths.consumer.creative]: 'Creative',
  [paths.consumer.publisher]: 'Publisher',
  [paths.consumer.settings]: 'Settings',
};

function getConsumerBreadcrumbLabel(pathname: string, propertyName: string | null | undefined): string {
  if (isEverselfPropertyName(propertyName) && pathname === paths.consumer.acquisition) return 'Leads';
  if (isEverselfPropertyName(propertyName) && pathname === paths.consumer.appointments) return 'Consultations';
  if (consumerBreadcrumbMap[pathname]) return consumerBreadcrumbMap[pathname];
  const segments = pathname.replace(/^\/consumer\/?/, '').split('/').filter(Boolean);
  return segments.map((s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')).join(' › ') || 'Dashboard';
}

export function ConsumerMainNav(): React.JSX.Element {
  const [openNav, setOpenNav] = React.useState<boolean>(false);
  const pathname = usePathname();
  const userPopover = usePopover<HTMLDivElement>();
  const { user } = useUser();
  const { activeProperty } = useConsumerProperty();

  const currentPage = getConsumerBreadcrumbLabel(pathname, activeProperty?.name);

  const getUserInitials = () => {
    if (user?.name) {
      const names = user.name.split(' ');
      if (names.length >= 2) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      return user.name.substring(0, 2).toUpperCase();
    }
    if (user?.email) return user.email.substring(0, 2).toUpperCase();
    if (user?.phone) return user.phone.substring(user.phone.length - 2);
    return 'OP';
  };

  return (
    <React.Fragment>
      <Box
        component="header"
        sx={{
          borderBottom: '1px solid #262626',
          backgroundColor: '#050505',
          position: 'sticky',
          top: 0,
          zIndex: 'var(--mui-zIndex-appBar)',
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between', minHeight: '64px', px: 2 }}>
          <Stack sx={{ alignItems: 'center', flex: 1, minWidth: 0 }} direction="row" spacing={2}>
            <IconButton onClick={() => setOpenNav(true)} sx={{ display: { lg: 'none' }, color: '#FFFFFF' }}>
              <ListIcon />
            </IconButton>
            <Breadcrumbs separator="›" sx={{ color: '#9CA3AF', display: { xs: 'none', md: 'flex' } }}>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Consumer</Typography>
              <Typography sx={{ color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 500 }}>{currentPage}</Typography>
            </Breadcrumbs>
          </Stack>
          <Stack sx={{ alignItems: 'center' }} direction="row" spacing={1.5}>
            <Chip
              label="Consumer"
              size="small"
              sx={{
                bgcolor: '#3b82f6',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 600,
                '& .MuiChip-label': { px: 1.5 },
              }}
            />
            <Avatar onClick={userPopover.handleOpen} ref={userPopover.anchorRef} sx={{ cursor: 'pointer', width: 32, height: 32 }} src={user?.avatar}>
              {getUserInitials()}
            </Avatar>
          </Stack>
        </Stack>
      </Box>
      <UserPopover anchorEl={userPopover.anchorRef.current} onClose={userPopover.handleClose} open={userPopover.open} />
      <ConsumerMobileNav open={openNav} onClose={() => setOpenNav(false)} />
    </React.Fragment>
  );
}
