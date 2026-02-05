import fs from 'fs';
import path from 'path';
import { Box, Container } from '@mui/material';
import { HeroBlock } from '@/components/HeroBlock';
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
      <SpaceABMPricingBlock />
      <Box sx={{ py: 6, backgroundColor: '#000000', color: '#e5e7eb' }}>
        <Container maxWidth="md">
          <Box
            sx={{
              '& h1': { fontSize: '2rem', fontWeight: 700, mt: 4, mb: 2 },
              '& h2': { fontSize: '1.5rem', fontWeight: 600, mt: 3, mb: 1.5 },
              '& h3': { fontSize: '1.25rem', fontWeight: 600, mt: 2, mb: 1 },
              '& h4': { fontSize: '1.1rem', fontWeight: 600, mt: 1.5, mb: 0.75 },
              '& p': { lineHeight: 1.7, mb: 1.5 },
              '& ul': { pl: 3, mb: 2 },
              '& ol': { pl: 3, mb: 2 },
              '& li': { mb: 0.5 },
              '& hr': { borderColor: 'rgba(229,231,235,0.24)', my: 3 },
              '& code': { bgcolor: 'rgba(229,231,235,0.08)', px: 0.75, py: 0.25, borderRadius: 1, fontSize: '0.9em' },
              '& pre': { bgcolor: 'rgba(229,231,235,0.06)', p: 2, borderRadius: 1, overflow: 'auto', fontSize: '0.875rem' },
              '& pre code': { bgcolor: 'transparent', p: 0 },
              '& strong': { fontWeight: 600 },
              '& a': { color: '#38bdf8', textDecoration: 'none' },
              '& a:hover': { textDecoration: 'underline' },
            }}
          >
            {content ? <MarkdownRenderer content={content} /> : null}
          </Box>
        </Container>
      </Box>
    </>
  );
}
