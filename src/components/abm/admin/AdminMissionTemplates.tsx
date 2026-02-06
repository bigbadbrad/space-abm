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
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import { abmApi, type ABMMissionTemplate } from '@/lib/abm/client';
import { LANE_OPTIONS } from '@/components/abm/layout/config';

export function AdminMissionTemplates(): React.JSX.Element {
  const [templates, setTemplates] = React.useState<ABMMissionTemplate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ABMMissionTemplate | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    lane: 'Launch',
    template_name: '',
    default_title_pattern: '',
    default_fields_json: '',
    enabled: true,
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await abmApi.getMissionTemplates();
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
      lane: 'Launch',
      template_name: '',
      default_title_pattern: '',
      default_fields_json: '',
      enabled: true,
    });
    setDrawerOpen(true);
  };

  const openEdit = (t: ABMMissionTemplate) => {
    setEditing(t);
    setForm({
      lane: t.lane,
      template_name: t.template_name,
      default_title_pattern: t.default_title_pattern || '',
      default_fields_json: t.default_fields_json ? JSON.stringify(t.default_fields_json, null, 2) : '',
      enabled: t.enabled,
    });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    let defaultFields: Record<string, unknown> | null = null;
    if (form.default_fields_json.trim()) {
      try {
        defaultFields = JSON.parse(form.default_fields_json);
      } catch {
        setError('Invalid JSON in default_fields_json');
        setSaving(false);
        return;
      }
    }
    const body = {
      lane: form.lane,
      template_name: form.template_name,
      default_title_pattern: form.default_title_pattern || null,
      default_fields_json: defaultFields,
      enabled: form.enabled,
    };
    if (editing) {
      const { error: err } = await abmApi.patchMissionTemplate(editing.id, body);
      if (err) setError(err);
      else {
        setDrawerOpen(false);
        load();
      }
    } else {
      const { error: err } = await abmApi.postMissionTemplate(body);
      if (err) setError(err);
      else {
        setDrawerOpen(false);
        load();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    const { error: err } = await abmApi.deleteMissionTemplate(id);
    if (err) setError(err);
    else load();
  };

  return (
    <Card sx={{ bgcolor: '#0A0A0A', border: '1px solid #262626' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#FFFFFF' }}>Mission Templates</Typography>
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
                <TableCell sx={{ color: '#9CA3AF' }}>Template Name</TableCell>
                <TableCell sx={{ color: '#9CA3AF' }}>Title Pattern</TableCell>
                <TableCell sx={{ color: '#9CA3AF' }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ color: '#9CA3AF', py: 3 }}>No mission templates. Add one for quick-create by lane.</TableCell>
                </TableRow>
              ) : (
                templates.map((t) => (
                  <TableRow key={t.id} hover sx={{ cursor: 'pointer' }} onClick={() => openEdit(t)}>
                    <TableCell sx={{ color: '#FFFFFF' }}>{t.enabled ? '✓' : '—'}</TableCell>
                    <TableCell sx={{ color: '#FFFFFF' }}>{t.lane}</TableCell>
                    <TableCell sx={{ color: '#FFFFFF' }}>{t.template_name}</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.default_title_pattern || '—'}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button size="small" color="error" onClick={() => handleDelete(t.id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: 400, bgcolor: '#0A0A0A', borderLeft: '1px solid #262626' } }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 2 }}>{editing ? 'Edit' : 'New'} Mission Template</Typography>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel sx={{ color: '#9CA3AF' }}>Lane</InputLabel>
              <Select value={form.lane} label="Lane" onChange={(e) => setForm((f) => ({ ...f, lane: e.target.value }))} sx={{ bgcolor: '#1a1a1a', color: '#fff' }}>
                {LANE_OPTIONS.filter((l) => l !== 'All').map((l) => (
                  <MenuItem key={l} value={l}>{l}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField fullWidth size="small" label="Template Name" value={form.template_name} onChange={(e) => setForm((f) => ({ ...f, template_name: e.target.value }))} sx={{ mb: 2, '& .MuiInputBase-root': { bgcolor: '#1a1a1a', color: '#fff' } }} />
            <TextField fullWidth size="small" label="Default Title Pattern" value={form.default_title_pattern} onChange={(e) => setForm((f) => ({ ...f, default_title_pattern: e.target.value }))} placeholder="e.g. {lane} — {org}" sx={{ mb: 2, '& .MuiInputBase-root': { bgcolor: '#1a1a1a', color: '#fff' } }} />
            <TextField fullWidth size="small" label="Default Fields (JSON)" value={form.default_fields_json} onChange={(e) => setForm((f) => ({ ...f, default_fields_json: e.target.value }))} multiline rows={4} placeholder='{"mission_type": "Rideshare"}' sx={{ mb: 2, '& .MuiInputBase-root': { bgcolor: '#1a1a1a', color: '#fff' } }} />
            <FormControlLabel control={<Switch checked={form.enabled} onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))} />} label="Enabled" sx={{ color: '#9CA3AF', mb: 2, display: 'block' }} />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" onClick={handleSave} disabled={saving || !form.template_name}>Save</Button>
              <Button variant="outlined" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            </Box>
          </Box>
        </Drawer>
      </CardContent>
    </Card>
  );
}
