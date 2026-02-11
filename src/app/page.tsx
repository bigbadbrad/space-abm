import fs from 'fs';
import path from 'path';
import { Box, Container } from '@mui/material';
import { HeroBlock } from '@/components/home/HeroBlock';
import { HowSpaceABMWorksBlock } from '@/components/home/HowSpaceABMWorksBlock';
import { HorizontalABMBlock } from '@/components/home/HorizontalABMBlock';
import { SpaceABMStartsBlock } from '@/components/home/SpaceABMStartsBlock';
import { AuditableArtifactBlock } from '@/components/home/AuditableArtifactBlock';
import { WidgetProcurementBriefBlock } from '@/components/home/WidgetProcurementBriefBlock';
import { IntentTrackingBlock } from '@/components/home/IntentTrackingBlock';
import { ABMBuiltForSpaceBlock } from '@/components/home/ABMBuiltForSpaceBlock';
import { RevenueLifecycleBlock } from '@/components/home/RevenueLifecycleBlock';
import { SpaceABMPricingBlock } from '@/components/home/SpaceABMPricingBlock';
import { MarkdownRenderer } from '@/components/dashboard/docs/markdown-renderer';
import { MotionSection } from '@/components/home/MotionSection';

export const metadata = {
  title: 'Space GTM — Purpose-Built ABM for Space Services',
  description: 'The first ABM platform built for missions, not just leads.',
};

export default function Page() {
  const filePath = path.join(process.cwd(), 'content', 'how-it-works.md');
  const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';

  return (
    <>
      <MotionSection id="hero">
        <HeroBlock />
      </MotionSection>
      <MotionSection id="lanes">
        <HorizontalABMBlock />
      </MotionSection>
      <MotionSection id="starts">
        <SpaceABMStartsBlock />
      </MotionSection>
      <MotionSection id="audit">
        <AuditableArtifactBlock />
      </MotionSection>
      <MotionSection id="widget-brief">
        <WidgetProcurementBriefBlock />
      </MotionSection>
      <MotionSection id="how-it-works">
        <HowSpaceABMWorksBlock />
      </MotionSection>
      <MotionSection id="intent-tracking">
        <IntentTrackingBlock />
      </MotionSection>
      <MotionSection id="built-for-space">
        <ABMBuiltForSpaceBlock />
      </MotionSection>
      <MotionSection id="revenue-lifecycle">
        <RevenueLifecycleBlock />
      </MotionSection>
      <MotionSection id="pricing">
        <SpaceABMPricingBlock />
      </MotionSection>
    </>
  );
}
