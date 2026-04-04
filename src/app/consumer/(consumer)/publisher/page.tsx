'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import { BuildingOffice as BuildingOfficeIcon } from '@phosphor-icons/react/dist/ssr/BuildingOffice';

import { useConsumerProperty } from '@/contexts/consumer-property-context';
import {
  getPublisherPosts,
  createPublisherPost,
  publishNowPublisherPost,
  cancelPublisherPost,
  deletePublisherPost,
  importPublisherJson,
  type PublisherPost,
  type ImportJsonResponse,
} from '@/lib/consumer/client';

const PLATFORMS = ['x', 'facebook', 'instagram'];
const STATUSES = ['draft', 'scheduled', 'publishing', 'published', 'failed', 'canceled'];

export default function ConsumerPublisherPage(): React.JSX.Element {
  const { activePropertyId, activeProperty } = useConsumerProperty();
  const [tab, setTab] = React.useState(0);
  const [posts, setPosts] = React.useState<PublisherPost[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<string>('');
  const [platformFilter, setPlatformFilter] = React.useState<string>('');
  const [importJson, setImportJson] = React.useState('');
  const [importing, setImporting] = React.useState(false);
  const [importResult, setImportResult] = React.useState<ImportJsonResponse | null>(null);
  const [newPlatform, setNewPlatform] = React.useState('x');
  const [newText, setNewText] = React.useState('');
  const [newMediaUrls, setNewMediaUrls] = React.useState('');
  const [creating, setCreating] = React.useState(false);

  const loadPosts = React.useCallback(async () => {
    if (!activePropertyId) return;
    setLoading(true);
    const { data } = await getPublisherPosts({
      property_id: activePropertyId,
      ...(statusFilter && { status: statusFilter }),
      ...(platformFilter && { platform: platformFilter }),
    });
    setPosts(data ?? []);
    setLoading(false);
  }, [activePropertyId, statusFilter, platformFilter]);

  React.useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handlePublishNow = async (id: string) => {
    const { error } = await publishNowPublisherPost(id);
    if (!error) loadPosts();
  };

  const handleCancel = async (id: string) => {
    const { error } = await cancelPublisherPost(id);
    if (!error) loadPosts();
  };

  const handleDelete = async (id: string) => {
    const { error } = await deletePublisherPost(id);
    if (!error) {
      // Optimistically remove the post from the local list so user doesn't have to hit Refresh.
      setPosts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleImport = async () => {
    if (!activePropertyId) return;
    let items: Array<{ key: string; platform: string; scheduled_for: string; text: string; media_urls?: string[] }>;
    try {
      const parsed = JSON.parse(importJson);
      if (Array.isArray(parsed)) items = parsed;
      else if (parsed && Array.isArray(parsed.items)) items = parsed.items;
      else throw new Error('Paste a JSON array of items or an object with "items" array');
    } catch (e) {
      setImportResult({ created: 0, updated: 0, skipped_published: 0, skipped_publishing: 0, errors: [{ key: '', message: e instanceof Error ? e.message : 'Invalid JSON' }] });
      return;
    }
    setImporting(true);
    setImportResult(null);
    const { data } = await importPublisherJson({ property_id: activePropertyId, items });
    setImportResult(data ?? null);
    setImporting(false);
    if (data) loadPosts();
  };

  const handleCreateDraft = async () => {
    if (!activePropertyId || !newText.trim()) return;
    setCreating(true);
    const mediaUrls = newMediaUrls.trim() ? newMediaUrls.split(/\s+/).filter(Boolean) : [];
    const { error } = await createPublisherPost({
      property_id: activePropertyId,
      platform: newPlatform,
      text: newText.trim(),
      media_urls: mediaUrls,
    });
    setCreating(false);
    if (!error) {
      setNewText('');
      setNewMediaUrls('');
      loadPosts();
    }
  };

  const formatDate = (s: string | null) => (s ? new Date(s).toLocaleString() : '—');

  return (
    <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <BuildingOfficeIcon size={18} style={{ color: '#FFFFFF' }} />
          <Typography sx={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600 }}>Publisher</Typography>
        </Box>
        <Typography sx={{ color: '#9CA3AF', fontSize: '0.8125rem', mt: 0.5 }}>
          {activeProperty ? activeProperty.name : 'Select a property'}
        </Typography>
      </Box>

      {!activePropertyId ? (
        <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Select a property to manage the publisher queue.</Typography>
      ) : (
        <>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tab label="Queue" />
            <Tab label="Import JSON" />
            <Tab label="New Post" />
          </Tabs>

          {tab === 0 && (
            <Box>
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <FormControl
                  size="small"
                  sx={{
                    minWidth: 120,
                    '& .MuiInputLabel-root': { color: '#9CA3AF' },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#E5E7EB' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#4B5563' },
                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#60A5FA' },
                    '& .MuiSelect-select': { color: '#E5E7EB' },
                  }}
                >
                  <InputLabel>Status</InputLabel>
                  <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    {STATUSES.map((s) => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl
                  size="small"
                  sx={{
                    minWidth: 120,
                    '& .MuiInputLabel-root': { color: '#9CA3AF' },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#E5E7EB' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#4B5563' },
                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#60A5FA' },
                    '& .MuiSelect-select': { color: '#E5E7EB' },
                  }}
                >
                  <InputLabel>Platform</InputLabel>
                  <Select value={platformFilter} label="Platform" onChange={(e) => setPlatformFilter(e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    {PLATFORMS.map((p) => (
                      <MenuItem key={p} value={p}>{p}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button variant="outlined" size="small" onClick={loadPosts} disabled={loading}>
                  Refresh
                </Button>
              </Box>
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 3 }}>
                  <CircularProgress size={24} />
                  <Typography sx={{ color: '#9CA3AF' }}>Loading posts…</Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} sx={{ bgcolor: 'var(--mui-palette-neutral-900)', border: '1px solid var(--mui-palette-neutral-700)' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: '#9CA3AF' }}>Scheduled</TableCell>
                        <TableCell sx={{ color: '#9CA3AF' }}>Platform</TableCell>
                        <TableCell sx={{ color: '#9CA3AF' }}>Status</TableCell>
                        <TableCell sx={{ color: '#9CA3AF' }}>Preview</TableCell>
                        <TableCell sx={{ color: '#9CA3AF' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {posts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} sx={{ color: '#9CA3AF', py: 3, textAlign: 'center' }}>
                            No posts match filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        posts.map((post) => (
                          <TableRow key={post.id}>
                            <TableCell sx={{ color: '#E5E7EB' }}>{formatDate(post.scheduled_for)}</TableCell>
                            <TableCell sx={{ color: '#E5E7EB' }}>{post.platform}</TableCell>
                            <TableCell>
                              <Chip
                                label={post.status}
                                size="small"
                                sx={{
                                  textTransform: 'capitalize',
                                  ...(post.status === 'publishing' && {
                                    bgcolor: 'rgba(59,130,246,0.16)',
                                    color: '#BFDBFE',
                                    border: '1px solid rgba(59,130,246,0.5)',
                                  }),
                                }}
                                color={
                                  post.status === 'published'
                                    ? 'success'
                                    : post.status === 'failed'
                                    ? 'error'
                                    : post.status === 'publishing'
                                    ? 'warning'
                                    : 'default'
                                }
                              />
                            </TableCell>
                            <TableCell sx={{ color: '#E5E7EB', maxWidth: 200 }}>{post.text.slice(0, 60)}{post.text.length > 60 ? '…' : ''}</TableCell>
                            <TableCell>
                              {post.status === 'draft' && (
                                <>
                                  <Button size="small" onClick={() => handlePublishNow(post.id)}>Publish now</Button>
                                  <Button
                                    size="small"
                                    color="error"
                                    sx={{ ml: 1, textTransform: 'none' }}
                                    onClick={() => handleDelete(post.id)}
                                  >
                                    Delete
                                  </Button>
                                </>
                              )}
                              {post.status === 'scheduled' && (
                                <>
                                  <Button size="small" onClick={() => handlePublishNow(post.id)}>Publish now</Button>
                                  <Button size="small" color="error" onClick={() => handleCancel(post.id)}>Cancel</Button>
                                </>
                              )}
                              {post.status === 'failed' && (
                                <>
                                  <Button size="small" onClick={() => handlePublishNow(post.id)}>Retry</Button>
                                  <Button
                                    size="small"
                                    color="error"
                                    sx={{ ml: 1, textTransform: 'none' }}
                                    onClick={() => handleDelete(post.id)}
                                  >
                                    Delete
                                  </Button>
                                </>
                              )}
                              {post.status === 'publishing' && (
                                <Button
                                  size="small"
                                  color="error"
                                  sx={{ textTransform: 'none' }}
                                  onClick={() => handleDelete(post.id)}
                                >
                                  Delete
                                </Button>
                              )}
                              {post.error_message && (
                                <Typography sx={{ color: 'error.main', fontSize: '0.75rem' }}>
                                  {post.error_message}
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {tab === 1 && (
            <Box>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem', mb: 1 }}>
                Paste JSON with <code style={{ background: '#1f2937', padding: '2px 6px', borderRadius: 4 }}>{"{ \"property_id\": \"...\", \"items\": [ ... ] }"}</code> or just an array of items with key, platform, scheduled_for, text, media_urls.
              </Typography>
              <TextField
                multiline
                minRows={8}
                fullWidth
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder='[{ "key": "post-1", "platform": "x", "scheduled_for": "2026-03-10T17:00:00Z", "text": "Hello world", "media_urls": [] }]'
                sx={{ mb: 2, '& textarea': { fontFamily: 'monospace', fontSize: '0.8125rem' } }}
              />
              <Button variant="contained" onClick={handleImport} disabled={importing}>
                {importing ? 'Importing…' : 'Import'}
              </Button>
              {importResult && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'var(--mui-palette-neutral-900)', borderRadius: 1, border: '1px solid var(--mui-palette-neutral-700)' }}>
                  <Typography sx={{ color: '#E5E7EB', fontWeight: 600, mb: 1 }}>Import summary</Typography>
                  <Typography sx={{ color: '#9CA3AF' }}>Created: {importResult.created} · Updated: {importResult.updated} · Skipped (published): {importResult.skipped_published} · Skipped (publishing): {importResult.skipped_publishing}</Typography>
                  {importResult.errors?.length > 0 && (
                    <Typography sx={{ color: 'error.main', mt: 1, fontSize: '0.875rem' }}>
                      Errors: {importResult.errors.map((e) => `${e.key}: ${e.message}`).join('; ')}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}

          {tab === 2 && (
            <Box sx={{ maxWidth: 560 }}>
              <FormControl
                fullWidth
                sx={{
                  mb: 2,
                  '& .MuiInputLabel-root': { color: '#9CA3AF' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#E5E7EB' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#4B5563' },
                  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#60A5FA' },
                  '& .MuiSelect-select': { color: '#E5E7EB' },
                }}
              >
                <InputLabel>Platform</InputLabel>
                <Select value={newPlatform} label="Platform" onChange={(e) => setNewPlatform(e.target.value)}>
                  {PLATFORMS.map((p) => (
                    <MenuItem key={p} value={p}>{p}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Text"
                fullWidth
                multiline
                minRows={3}
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Post content…"
                sx={{ mb: 2 }}
                InputLabelProps={{
                  sx: {
                    color: '#9CA3AF',
                    '&.Mui-focused': { color: '#E5E7EB' },
                  },
                }}
                InputProps={{
                  sx: {
                    color: '#E5E7EB',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#4B5563' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#60A5FA' },
                  },
                }}
              />
              <TextField
                label="Media URLs (one per line or space-separated)"
                fullWidth
                value={newMediaUrls}
                onChange={(e) => setNewMediaUrls(e.target.value)}
                placeholder="https://…"
                sx={{ mb: 2 }}
                InputLabelProps={{
                  sx: {
                    color: '#9CA3AF',
                    '&.Mui-focused': { color: '#E5E7EB' },
                  },
                }}
                InputProps={{
                  sx: {
                    color: '#E5E7EB',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#4B5563' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#60A5FA' },
                  },
                }}
              />
              <Button variant="contained" onClick={handleCreateDraft} disabled={creating || !newText.trim()}>
                {creating ? 'Creating…' : 'Save draft'}
              </Button>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
