'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { Calendar as CalendarIcon } from '@phosphor-icons/react/dist/ssr/Calendar';

import { EverselfAppointmentsPage } from '@/components/everself/everself-appointments-page';
import { useConsumerProperty } from '@/contexts/consumer-property-context';
import { isEverselfPropertyName } from '@/lib/consumer/everself-property';

function Placeholder(): React.JSX.Element {
  return (
    <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <CalendarIcon size={18} style={{ color: '#FFFFFF' }} />
          <Typography sx={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600 }}>Appointments</Typography>
        </Box>
        <Typography sx={{ color: '#9CA3AF', fontSize: '0.8125rem', mt: 0.5 }}>Consumer surface — placeholder</Typography>
      </Box>
      <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>
        Appointments analytics are available for the Everself property demo.
      </Typography>
    </Box>
  );
}

export default function ConsumerAppointmentsPage(): React.JSX.Element {
  const { activeProperty, loading } = useConsumerProperty();

  if (loading) {
    return (
      <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#9CA3AF' }} />
      </Box>
    );
  }

  if (isEverselfPropertyName(activeProperty?.name)) {
    return (
      <React.Suspense
        fallback={
          <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress sx={{ color: '#9CA3AF' }} />
          </Box>
        }
      >
        <EverselfAppointmentsPage />
      </React.Suspense>
    );
  }

  return <Placeholder />;
}
