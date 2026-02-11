'use client';

import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import { Funnel as FunnelIcon } from '@phosphor-icons/react/dist/ssr/Funnel';
import { List as ListIcon } from '@phosphor-icons/react/dist/ssr/List';
import { MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { usePathname } from 'next/navigation';

import { usePopover } from '@/hooks/use-popover';
import { paths } from '@/paths';
import { useUser } from '@/hooks/use-user';
import { PrimaryColor } from '@/config';
import { useABMFilters } from '@/contexts/abm-filter-context';

import { ABMMobileNav } from './mobile-nav';
import { FiltersDrawer } from './filters-drawer';
import { UserPopover } from '@/components/dashboard/layout/user-popover';

const breadcrumbMap: Record<string, string> = {
  [paths.abm.overview]: 'Overview',
  [paths.abm.accounts]: 'Accounts',
  [paths.abm.activity]: 'Activity',
  [paths.abm.lanes]: 'Service Lanes',
  [paths.abm.people]: 'People',
  [paths.abm.leadRequests]: 'Lead Requests',
  [paths.abm.admin]: 'Scoring & Prompts',
};

function getBreadcrumbLabel(pathname: string): string {
  if (breadcrumbMap[pathname]) return breadcrumbMap[pathname];
  if (pathname.startsWith(paths.abm.accounts + '/')) return 'Account Detail';
  if (pathname.startsWith(paths.abm.leadRequests + '/')) return 'Lead Request';
  const segments = pathname.replace(/^\/abm\/?/, '').split('/').filter(Boolean);
  return segments.map((s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')).join(' › ') || 'Overview';
}

export function ABMMainNav(): React.JSX.Element {
  const [openNav, setOpenNav] = React.useState<boolean>(false);
  const [filtersOpen, setFiltersOpen] = React.useState<boolean>(false);
  const pathname = usePathname();
  const userPopover = usePopover<HTMLDivElement>();
  const { user } = useUser();
  const { filters, applyFilters, hasActiveFilters } = useABMFilters();
  const [searchInput, setSearchInput] = React.useState(filters.search);

  React.useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      applyFilters({ search: searchInput.trim() });
    }
  };

  const currentPage = getBreadcrumbLabel(pathname);

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
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Dashboard</Typography>
              <Typography sx={{ color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 500 }}>{currentPage}</Typography>
            </Breadcrumbs>
            <Box sx={{ flex: 1, maxWidth: 320, minWidth: 120 }}>
              <InputBase
                placeholder="Search account name/domain"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                startAdornment={
                  <MagnifyingGlassIcon size={18} style={{ marginRight: 8, color: '#9CA3AF' }} weight="regular" />
                }
                sx={{
                  bgcolor: '#0A0A0A',
                  border: '1px solid #262626',
                  borderRadius: 1,
                  px: 1.5,
                  py: 0.75,
                  fontSize: '0.875rem',
                  color: '#fff',
                  width: '100%',
                  '& input::placeholder': { color: '#6b7280' },
                  '& .MuiInputBase-input': { pl: 0 },
                }}
              />
            </Box>
          </Stack>
          <Stack sx={{ alignItems: 'center' }} direction="row" spacing={1.5}>
            <Tooltip title="Filters">
              <IconButton
                onClick={() => setFiltersOpen(true)}
                sx={{
                  color: '#FFFFFF',
                  ...(hasActiveFilters && { color: '#3b82f6' }),
                }}
              >
                <FunnelIcon size={20} weight={hasActiveFilters ? 'fill' : 'regular'} />
              </IconButton>
            </Tooltip>
            <Chip
              label="GTM Live"
              size="small"
              sx={{
                bgcolor: PrimaryColor,
                color: '#000',
                fontSize: '0.75rem',
                fontWeight: 600,
                '& .MuiChip-label': { px: 1.5 },
              }}
              icon={
                <Box sx={{ bgcolor: PrimaryColor, borderRadius: '50%', boxShadow: `0 0 8px ${PrimaryColor}40`, height: 6, width: 6 }} />
              }
            />
            <Avatar onClick={userPopover.handleOpen} ref={userPopover.anchorRef} sx={{ cursor: 'pointer', width: 32, height: 32 }} src={user?.avatar}>
              {getUserInitials()}
            </Avatar>
          </Stack>
        </Stack>
      </Box>
      <UserPopover anchorEl={userPopover.anchorRef.current} onClose={userPopover.handleClose} open={userPopover.open} />
      <ABMMobileNav open={openNav} onClose={() => setOpenNav(false)} />
      <FiltersDrawer open={filtersOpen} onClose={() => setFiltersOpen(false)} />
    </React.Fragment>
  );
}
