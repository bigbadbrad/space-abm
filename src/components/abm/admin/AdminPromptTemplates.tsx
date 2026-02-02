'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Drawer from '@mui/material/Drawer';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { abmApi, type ABMPromptTemplate } from '@/lib/abm/client';

export function AdminPromptTemplates(): React.JSX.Element {
  const [templates, setTemplates] = React.useState<ABMPromptTemplate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ABMPromptTemplate | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    enabled: true,
    lane: '*',
    persona: '*',
    intent_stage: '*',
    version: '1.0',
    system_prompt: '',
    user_prompt_template: '',
    max_words: 180,
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await abmApi.getPromptTemplates();
    if (err) setError(err);
    else if (data?.templates) setTemplates(data.templates);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm({
      enabled: true,
      lane: '*',
      persona: '*',
      intent_stage: '*',
      version: '1.0',
      system_prompt: 'You are an elite B2B ABM strategist. Generate concise, actionable account summaries.',
      user_prompt_template: 'Create an Account Brief. JSON: {{JSON_HERE}}',
      max_words: 180,
    });
    setDrawerOpen(true);
  };

  const openEdit = (t: ABMPromptTemplate) => {
    setEditing(t);
    setForm({
      enabled: t.enabled,
      lane: t.lane,
      persona: t.persona,
      intent_stage: t.intent_stage,
      version: t.version || '1.0',
      system_prompt: t.system_prompt,
      user_prompt_template: t.user_prompt_template,
      max_words: t.max_words,
    });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const body = { ...form };
    if (editing) {
      const { error: err } = await abmApi.patchPromptTemplate(editing.id, body);
      if (err) setError(err);
      else {
        setDrawerOpen(false);
        load();
      }
    } else {
      const { error: err } = await abmApi.postPromptTemplate(body);
      if (err) setError(err);
      else {
        setDrawerOpen(false);
        load();
      }
    }
    setSaving(false);
  };

  return (
    <Card sx={{ bgcolor: '#0A0A0A', border: '1px solid #262626' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#FFFFFF' }}>Prompt Templates</Typography>
          <Button variant="contained" size="small" onClick={openNew}>Add Template</Button>
        </Box>
        {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
        {loading ? (
          <Typography color="text.secondary">Loading…</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#9CA3AF' }}>Enabled</TableCell>
                <TableCell sx={{ color: '#9CA3AF' }}>Lane</TableCell>
                <TableCell sx={{ color: '#9CA3AF' }}>Persona</TableCell>
                <TableCell sx={{ color: '#9CA3AF' }}>Stage</TableCell>
                <TableCell sx={{ color: '#9CA3AF' }}>Version</TableCell>
                <TableCell sx={{ color: '#9CA3AF' }}>Updated</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.map((t) => (
                <TableRow key={t.id} hover onClick={() => openEdit(t)} sx={{ cursor: 'pointer' }}>
                  <TableCell sx={{ color: '#FFFFFF' }}>{t.enabled ? '✓' : '—'}</TableCell>
                  <TableCell sx={{ color: '#FFFFFF' }}>{t.lane}</TableCell>
                  <TableCell sx={{ color: '#FFFFFF' }}>{t.persona}</TableCell>
                  <TableCell sx={{ color: '#FFFFFF' }}>{t.intent_stage}</TableCell>
                  <TableCell sx={{ color: '#FFFFFF' }}>{t.version || '—'}</TableCell>
                  <TableCell sx={{ color: '#9CA3AF', fontSize: '0.75rem' }}>{t.updated_at ? new Date(t.updated_at).toLocaleDateString() : '—'}</TableCell>
                  <TableCell />
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <Box sx={{ width: 500, p: 3, overflow: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>{editing ? 'Edit Template' : 'New Template'}</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={<Switch checked={form.enabled} onChange={(_, v) => setForm((f) => ({ ...f, enabled: v }))} />}
                label="Enabled"
              />
              <TextField label="Lane" value={form.lane} onChange={(e) => setForm((f) => ({ ...f, lane: e.target.value }))} placeholder="* or Launch" />
              <TextField label="Persona" value={form.persona} onChange={(e) => setForm((f) => ({ ...f, persona: e.target.value }))} placeholder="* or sales" />
              <TextField label="Intent stage" value={form.intent_stage} onChange={(e) => setForm((f) => ({ ...f, intent_stage: e.target.value }))} placeholder="* or Hot" />
              <TextField label="Version" value={form.version} onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))} />
              <TextField label="System prompt" multiline rows={4} value={form.system_prompt} onChange={(e) => setForm((f) => ({ ...f, system_prompt: e.target.value }))} fullWidth />
              <TextField label="User prompt template" multiline rows={6} value={form.user_prompt_template} onChange={(e) => setForm((f) => ({ ...f, user_prompt_template: e.target.value }))} fullWidth helperText="Must contain {{JSON_HERE}}" />
              <TextField label="Max words" type="number" value={form.max_words} onChange={(e) => setForm((f) => ({ ...f, max_words: Number(e.target.value) || 180 }))} />
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button variant="contained" onClick={handleSave} disabled={saving}>Save</Button>
                <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
              </Box>
            </Box>
          </Box>
        </Drawer>
      </CardContent>
    </Card>
  );
}
