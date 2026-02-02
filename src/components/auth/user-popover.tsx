// /components/auth/user-popover.tsx
import * as React from 'react';
import RouterLink from 'next/link';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import {
  Avatar,
  Divider,
  MenuItem,
  MenuList,
  Popover,
  Typography,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { SignOut as SignOutIcon } from '@phosphor-icons/react';
import { useUser } from '@/hooks/use-user';
import { authClient } from '@/lib/auth/client';
import { logger } from '@/lib/default-logger';
import { useState, useEffect } from 'react';
import { useDispatch } from '@/store';
import { incrementChatRefresh } from '@/slices/global';
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupIcon from '@mui/icons-material/Group';
import WebAssetIcon from '@mui/icons-material/WebAsset';
import StyleIcon from '@mui/icons-material/Style';

export interface UserPopoverProps {
  anchorEl: Element | null;
  onClose: () => void;
  open: boolean;
}

function formatPhoneNumberForDisplay(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}

export function UserPopover({ anchorEl, onClose, open }: UserPopoverProps): React.JSX.Element {
  const { user, checkSession } = useUser();
  const router = useRouter();
  const dispatch = useDispatch();
  const [businesses, setBusinesses] = useState<any[]>([]);

  const fetchBusinesses = async () => {
    try {
      const token = authClient.getToken();
      if (!token) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_SPACE_API_BASE_URL}/api/businesses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data);
      } else {
        logger.error('Failed to fetch businesses');
      }
    } catch (error) {
      logger.error('Error fetching businesses:', error);
    }
  };

  useEffect(() => {
    if (open && user) {
      fetchBusinesses();
    }
  }, [open, user]);

  const activeBusiness = businesses.find((b) => b.isActive);
  const inactiveBusinesses = businesses.filter((b) => !b.isActive);

  const handleSignOut = React.useCallback(async (): Promise<void> => {
    try {
      const { error } = await authClient.signOut();
      if (error) {
        logger.error('Sign out error', error);
        return;
      }
      // This will *force* a true navigation and avoid all React/Next.js guard conflicts:
      window.location.href = '/auth/sign-in';
    } catch (err) {
      logger.error('Sign out error', err);
      window.location.href = '/auth/sign-in';
    }
  }, []);

  const handleActivateBusiness = async (businessId: number) => {
    try {
      const token = authClient.getToken();
      if (!token) return;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SPACE_API_BASE_URL}/api/businesses/${businessId}/activate`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (res.ok) {
        await fetchBusinesses();
        await checkSession?.();
        dispatch(incrementChatRefresh());
        onClose();
      } else {
        logger.error('Failed to activate business');
      }
    } catch (error) {
      logger.error('Error activating business:', error);
    }
  };

  return (
    <Popover
      anchorEl={open ? anchorEl : null}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      onClose={onClose}
      open={open}
      slotProps={{
        paper: {
          sx: {
            width: '240px',
            backgroundColor: 'white',
            color: 'black',
            border: '1px solid black',
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
          },
        },
      }}
    >
      <Box sx={{ p: '16px 20px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0 }}>
          <ContactPhoneIcon sx={{ mr: 1, fontSize: '30px', color: 'black' }} />
          <Typography variant="subtitle1">Account</Typography>
        </Box>
        <Typography color="text.secondary" variant="caption">
          phone number
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ p: '16px 20px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <StorefrontIcon sx={{ mr: 1, fontSize: '30px', color: 'black' }} />
          <Typography variant="subtitle1">Businesses</Typography>
        </Box>

        {activeBusiness && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mt: 1,
              mb: 2,
              p: '6px 8px',
              borderRadius: '6px',
              backgroundColor: 'black',
              color: 'white',
            }}
          >
            <Avatar
              sx={{
                bgcolor: 'white',
                width: 32,
                height: 32,
                fontSize: 18,
                color: 'black',
                mr: 1,
              }}
              src={activeBusiness.avatar || undefined}
            >
              {!activeBusiness.avatar &&
                (activeBusiness.name?.charAt(0)?.toUpperCase() || '')}
            </Avatar>
            <Typography variant="caption" sx={{ fontWeight: 500 }}>
              {activeBusiness.name}
            </Typography>
          </Box>
        )}

        {inactiveBusinesses.map((b) => (
          <Box
            key={b.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              mt: 1,
              p: '6px 8px',
              borderRadius: '6px',
              backgroundColor: 'white',
              color: 'black',
              '&:hover': {
                backgroundColor: '#f0f0f0',
                cursor: 'pointer',
              },
            }}
            onClick={() => handleActivateBusiness(b.id)}
          >
            <Avatar
              sx={{
                bgcolor: 'black',
                width: 24,
                height: 24,
                fontSize: 14,
                color: 'white',
                mr: 1,
              }}
              src={b.avatar || undefined}
            >
              {!b.avatar && (b.name?.charAt(0)?.toUpperCase() || '')}
            </Avatar>
            <Typography variant="caption">{b.name}</Typography>
          </Box>
        ))}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mt: 2,
            p: '4px',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: '#f0f0f0',
              cursor: 'pointer',
            },
          }}
        >
          <AddBusinessIcon sx={{ mr: 1 }} />
          <Typography variant="caption">
            <RouterLink href="/app/businesses/new" style={{ color: 'inherit', textDecoration: 'none' }}>
              Create new business
            </RouterLink>
          </Typography>
        </Box>
      </Box>
      <Divider />

      <Box sx={{ p: '16px 20px' }}>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0 }}>
          <ManageAccountsIcon sx={{ mr: 1, fontSize: '30px', color: 'black' }} />
          <Typography variant="subtitle1">Manage Business</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <CalendarMonthIcon sx={{ mr: 1, fontSize: '30px', color: 'black' }} />
          <Typography variant="caption">
            <RouterLink
              href="/app/appointments"
              style={{ color: 'inherit', textDecoration: 'none' }}
              onClick={onClose}
            >
              Appointments
            </RouterLink>
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <AccessTimeIcon sx={{ mr: 1, fontSize: '30px', color: 'black' }} />
          <Typography variant="caption">
            <RouterLink
              href="/app/availability"
              style={{ color: 'inherit', textDecoration: 'none' }}
              onClick={onClose}
            >
              Availability
            </RouterLink>
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <GroupIcon sx={{ mr: 1, fontSize: '30px', color: 'black' }} />
          <Typography variant="caption">
            <RouterLink
              href="/app/customers"
              style={{ color: 'inherit', textDecoration: 'none' }}
              onClick={onClose}
            >
              Customers
            </RouterLink>
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <WebAssetIcon sx={{ mr: 1, fontSize: '30px', color: 'black' }} />
          <Typography variant="caption">
            <RouterLink
              href="/app/website"
              style={{ color: 'inherit', textDecoration: 'none' }}
              onClick={onClose}
            >
              Website/Widget
            </RouterLink>
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <StyleIcon sx={{ mr: 1, fontSize: '30px', color: 'black' }} />
          <Typography variant="caption">
            <RouterLink
              href="/app/branding"
              style={{ color: 'inherit', textDecoration: 'none' }}
              onClick={onClose}
            >
              Branding
            </RouterLink>
          </Typography>
        </Box>
      </Box>

      <Divider />

      <MenuList disablePadding sx={{ p: '8px' }}>
        <MenuItem
          onClick={handleSignOut}
          sx={{
            color: 'black',
            '&:hover': {
              backgroundColor: '#f0f0f0',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SignOutIcon fontSize="24px" style={{ marginRight: 8 }} />
            Sign out
          </Box>
        </MenuItem>
      </MenuList>
    </Popover>
  );
}
