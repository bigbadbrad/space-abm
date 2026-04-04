'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function EverselfHowItWorksModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}): React.JSX.Element {
  const [markdown, setMarkdown] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setMarkdown(null);
    (async () => {
      try {
        const res = await fetch('/api/demo/everself/how-it-works?doc=readers');
        const data = (await res.json()) as { markdown?: string; message?: string };
        if (!res.ok) throw new Error(data.message ?? 'Failed to load');
        if (!cancelled) setMarkdown(data.markdown ?? '');
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { bgcolor: '#0A0A0A', border: '1px solid #27272F', maxHeight: '90vh' } }}
    >
      <DialogTitle sx={{ color: '#F9FAFB', borderBottom: '1px solid #27272F', pb: 1.5 }}>How to read this report</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} sx={{ color: '#9CA3AF' }} />
          </Box>
        ) : error ? (
          <Typography sx={{ color: '#F87171' }}>{error}</Typography>
        ) : (
          <Box
            sx={{
              color: '#E5E7EB',
              fontSize: '0.875rem',
              lineHeight: 1.65,
              '& h1': { color: '#F9FAFB', fontSize: '1.35rem', fontWeight: 700, mt: 0, mb: 1.5 },
              '& h2': { color: '#F3F4F6', fontSize: '1.05rem', fontWeight: 600, mt: 2.5, mb: 1 },
              '& h3': { color: '#E5E7EB', fontSize: '0.95rem', fontWeight: 600, mt: 2, mb: 0.75 },
              '& p': { mb: 1.25 },
              '& ul, & ol': { pl: 2.5, mb: 1.25 },
              '& li': { mb: 0.5 },
              '& code': {
                bgcolor: '#111827',
                px: 0.5,
                py: 0.125,
                borderRadius: 0.5,
                fontSize: '0.8em',
                fontFamily: 'ui-monospace, monospace',
              },
              '& pre': {
                bgcolor: '#111827',
                p: 1.5,
                borderRadius: 1,
                overflow: 'auto',
                border: '1px solid #27272F',
                fontSize: '0.75rem',
              },
              '& pre code': { bgcolor: 'transparent', p: 0 },
              '& table': { width: '100%', borderCollapse: 'collapse', my: 1.5, fontSize: '0.8rem' },
              '& th, & td': { border: '1px solid #374151', px: 1, py: 0.75, textAlign: 'left' },
              '& th': { bgcolor: '#111827', color: '#D1D5DB' },
              '& a': { color: '#93C5FD' },
              '& hr': { borderColor: '#27272F', my: 2 },
              '& blockquote': { borderLeft: '3px solid #4B5563', pl: 1.5, m: 0, color: '#9CA3AF' },
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown ?? ''}</ReactMarkdown>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ borderTop: '1px solid #27272F', px: 2, py: 1.5 }}>
        <Button onClick={onClose} sx={{ color: '#93C5FD', textTransform: 'none' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
