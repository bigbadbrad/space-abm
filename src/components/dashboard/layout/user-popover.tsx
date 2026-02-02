'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import { SignOut as SignOutIcon } from '@phosphor-icons/react/dist/ssr/SignOut';

import { paths } from '@/paths';
import { authClient } from '@/lib/auth/client';
import { logger } from '@/lib/default-logger';
import { useUser } from '@/hooks/use-user';

export interface UserPopoverProps {
  anchorEl: Element | null;
  onClose: () => void;
  open: boolean;
}

export function UserPopover({ anchorEl, onClose, open }: UserPopoverProps): React.JSX.Element {
  const { user, checkSession } = useUser();
  const router = useRouter();

  const handleSignOut = React.useCallback(async (): Promise<void> => {
    try {
      const { error } = await authClient.signOut();
      if (error) {
        logger.error('Sign out error', error);
        return;
      }
      await checkSession?.();
      router.refresh();
      onClose();
    } catch (err) {
      logger.error('Sign out error', err);
    }
  }, [checkSession, router, onClose]);

  const displayName = user?.name || 'User';
  const displayContact = user?.email || user?.phone || '';

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
            bgcolor: '#0A0A0A',
            color: '#e5e7eb',
            border: '1px solid #262626',
            borderRadius: 2,
          },
        },
      }}
    >
      <Box sx={{ p: '16px 20px' }}>
        <Typography variant="subtitle1" sx={{ color: '#e5e7eb', fontWeight: 600 }}>
          {displayName}
        </Typography>
        {displayContact && (
          <Typography variant="body2" sx={{ color: '#9ca3af', mt: 0.5 }}>
            {displayContact}
          </Typography>
        )}
      </Box>
      <Divider sx={{ borderColor: '#262626' }} />
      <MenuList disablePadding sx={{ p: '8px', '& .MuiMenuItem-root': { borderRadius: 1 } }}>
        <MenuItem
          onClick={() => {
            onClose();
            router.push(paths.home);
          }}
          sx={{ color: '#e5e7eb', '&:hover': { bgcolor: '#1f1f1f' } }}
        >
          <ListItemIcon>
            <SignOutIcon fontSize="var(--icon-fontSize-md)" style={{ color: '#9ca3af' }} />
          </ListItemIcon>
          Back to home
        </MenuItem>
        <MenuItem onClick={handleSignOut} sx={{ color: '#e5e7eb', '&:hover': { bgcolor: '#1f1f1f' } }}>
          <ListItemIcon>
            <SignOutIcon fontSize="var(--icon-fontSize-md)" style={{ color: '#9ca3af' }} />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </MenuList>
    </Popover>
  );
}
