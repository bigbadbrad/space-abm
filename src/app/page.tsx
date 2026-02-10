import fs from 'fs';
import path from 'path';
import { Box, Container } from '@mui/material';
import { HeroBlock } from '@/components/home/HeroBlock';
import { HowSpaceABMWorksBlock } from '@/components/home/HowSpaceABMWorksBlock';
import { HorizontalABMBlock } from '@/components/home/HorizontalABMBlock';
import { SpaceABMStartsBlock } from '@/components/home/SpaceABMStartsBlock';
import { AuditableArtifactBlock } from '@/components/home/AuditableArtifactBlock';
import { WidgetProcurementBriefBlock } from '@/components/home/WidgetProcurementBriefBlock';
import { ABMBuiltForSpaceBlock } from '@/components/home/ABMBuiltForSpaceBlock';
import { RevenueLifecycleBlock } from '@/components/home/RevenueLifecycleBlock';
import { SpaceABMPricingBlock } from '@/components/home/SpaceABMPricingBlock';
import { MarkdownRenderer } from '@/components/dashboard/docs/markdown-renderer';

export const metadata = {
  title: 'Space ABM — Purpose-Built ABM for Space Services',
  description:
    'SpaceABM is designed around the actual unit of work in space: a mission-driven procurement request. Less vendor glue code, less brittle customization, optimized for closing space services deals.',
};

export default function Page() {
  const filePath = path.join(process.cwd(), 'content', 'how-it-works.md');
  const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';

  return (
    <>
      <HeroBlock />
      <HorizontalABMBlock />
      <SpaceABMStartsBlock />
      <AuditableArtifactBlock />
      <WidgetProcurementBriefBlock />
      <HowSpaceABMWorksBlock />
      <ABMBuiltForSpaceBlock />
      <RevenueLifecycleBlock />
      <SpaceABMPricingBlock />
    </>
  );
}
