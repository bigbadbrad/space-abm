'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import { GearSix as GearSixIcon } from '@phosphor-icons/react/dist/ssr/GearSix';
import { useUser } from '@/hooks/use-user';
import { paths } from '@/paths';

import { AdminEventRules } from '@/components/abm/admin/AdminEventRules';
import { AdminPromptTemplates } from '@/components/abm/admin/AdminPromptTemplates';
import { AdminMissionTemplates } from '@/components/abm/admin/AdminMissionTemplates';
import { AdminScoringModels } from '@/components/abm/admin/AdminScoringModels';
import { AdminAuditLog } from '@/components/abm/admin/AdminAuditLog';
import { AdminJobs } from '@/components/abm/admin/AdminJobs';
import { AdminProcurement } from '@/components/abm/admin/AdminProcurement';

export default function ABMAdminPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') || 'event-rules';
  const [tab, setTab] = React.useState(tabParam);
  const { user } = useUser();
  const isAdmin = user?.role === 'internal_admin';

  React.useEffect(() => {
    setTab(tabParam);
  }, [tabParam]);

  const handleTabChange = (_: React.SyntheticEvent, v: string) => {
    setTab(v);
    router.push(`${paths.abm.admin}?tab=${v}`);
  };

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3, bgcolor: '#050505', minHeight: '100vh' }}>
        <Card sx={{ bgcolor: '#0A0A0A', border: '1px solid #262626' }}>
          <CardContent>
            <Typography color="error">Access denied. Admin only.</Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#050505', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2 }}>
        <GearSixIcon size={20} style={{ color: '#FFFFFF' }} />
        <Typography sx={{ color: '#FFFFFF', fontSize: '1.5rem', fontWeight: 600 }}>Admin</Typography>
      </Box>
      <Tabs value={tab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tab label="Event Rules" value="event-rules" />
        <Tab label="Scoring Models" value="scoring-models" />
        <Tab label="Prompt Templates" value="prompt-templates" />
        <Tab label="Mission Templates" value="mission-templates" />
        <Tab label="Audit Log" value="audit-log" />
        <Tab label="Jobs & Health" value="jobs" />
        <Tab label="Procurement" value="procurement" />
      </Tabs>
      {tab === 'event-rules' && <AdminEventRules />}
      {tab === 'scoring-models' && <AdminScoringModels />}
      {tab === 'prompt-templates' && <AdminPromptTemplates />}
      {tab === 'mission-templates' && <AdminMissionTemplates />}
      {tab === 'audit-log' && <AdminAuditLog />}
      {tab === 'jobs' && <AdminJobs />}
      {tab === 'procurement' && <AdminProcurement />}
    </Box>
  );
}
