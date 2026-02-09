import fs from 'fs';
import path from 'path';
import { Box, Container } from '@mui/material';
import { HeroBlock } from '@/components/HeroBlock';
import { HowSpaceABMWorksBlock } from '@/components/home/HowSpaceABMWorksBlock';
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
      <HowSpaceABMWorksBlock />
      <WidgetProcurementBriefBlock />
      <ABMBuiltForSpaceBlock />
      <RevenueLifecycleBlock />
      <SpaceABMPricingBlock />
    </>
  );
}
