'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@mui/material/Alert';

import { paths } from '@/paths';
import { logger } from '@/lib/default-logger';
import { useUser } from '@/hooks/use-user';

export interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps): React.JSX.Element | null {
  const router = useRouter();
  const { user, isLoading } = useUser();

  React.useEffect(() => {
    if (!isLoading && !user) {
      logger.debug('User not authenticated, redirecting to sign in');
      router.replace(paths.auth.signIn);
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#050505' }}>
        <Alert severity="info" sx={{ bgcolor: '#0A0A0A', color: '#e5e7eb' }}>Loading...</Alert>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return <React.Fragment>{children}</React.Fragment>;
}
