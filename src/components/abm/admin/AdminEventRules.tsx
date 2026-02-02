'use client';

import * as React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Drawer from '@mui/material/Drawer';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { DotsSixVertical as DragHandleIcon } from '@phosphor-icons/react/dist/ssr/DotsSixVertical';
import { abmApi, type ABMEventRule } from '@/lib/abm/client';
import { LANE_OPTIONS } from '@/components/abm/layout/config';

const EVENT_NAMES = ['page_view', 'cta_click', 'form_started', 'form_submitted', '*'];
const MATCH_TYPES = ['path_prefix', 'contains', 'equals', 'path_regex'];
const CONTENT_TYPES = ['service_page', 'pricing', 'security', 'integrations', 'request_reservation', 'case_study', 'docs', 'blog', 'comparison', 'other'];

function SortableRuleRow({ rule: r, onEdit }: { rule: ABMEventRule; onEdit: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: r.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <TableRow ref={setNodeRef} style={style} hover onClick={onEdit} sx={{ cursor: 'pointer', opacity: isDragging ? 0.5 : 1 }}>
      <TableCell sx={{ width: 40, color: '#9CA3AF', cursor: 'grab', p: 0.5 }} onClick={(e) => e.stopPropagation()} {...attributes} {...listeners}>
        <DragHandleIcon size={18} />
      </TableCell>
      <TableCell sx={{ color: '#FFFFFF' }}>{r.enabled ? '✓' : '—'}</TableCell>
      <TableCell sx={{ color: '#FFFFFF' }}>{r.priority}</TableCell>
      <TableCell sx={{ color: '#FFFFFF' }}>{r.event_name}</TableCell>
      <TableCell sx={{ color: '#FFFFFF' }}>{r.match_type}</TableCell>
      <TableCell sx={{ color: '#FFFFFF', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.match_value}</TableCell>
      <TableCell sx={{ color: '#FFFFFF' }}>{r.content_type || '—'}</TableCell>
      <TableCell sx={{ color: '#FFFFFF' }}>{r.lane || '—'}</TableCell>
      <TableCell sx={{ color: '#9CA3AF', fontSize: '0.75rem' }}>{r.updated_at ? new Date(r.updated_at).toLocaleDateString() : '—'}</TableCell>
    </TableRow>
  );
}

export function AdminEventRules(): React.JSX.Element {
  const [rules, setRules] = React.useState<ABMEventRule[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ABMEventRule | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [testPath, setTestPath] = React.useState('');
  const [testEvent, setTestEvent] = React.useState('page_view');
  const [testResult, setTestResult] = React.useState<{ matched: boolean; content_type?: string; lane?: string } | null>(null);
  const [form, setForm] = React.useState({
    enabled: true,
    priority: 100,
    event_name: 'page_view',
    match_type: 'path_prefix',
    match_value: '',
    content_type: '',
    lane: '',
    weight_override: '',
    notes: '',
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await abmApi.getEventRules();
    if (err) setError(err);
    else if (data?.rules) setRules(data.rules);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm({
      enabled: true,
      priority: 100,
      event_name: 'page_view',
      match_type: 'path_prefix',
      match_value: '',
      content_type: '',
      lane: '',
      weight_override: '',
      notes: '',
    });
    setDrawerOpen(true);
  };

  const openEdit = (rule: ABMEventRule) => {
    setEditing(rule);
    setForm({
      enabled: rule.enabled,
      priority: rule.priority,
      event_name: rule.event_name,
      match_type: rule.match_type,
      match_value: rule.match_value,
      content_type: rule.content_type || '',
      lane: rule.lane || '',
      weight_override: rule.weight_override != null ? String(rule.weight_override) : '',
      notes: rule.notes || '',
    });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const body = {
      enabled: form.enabled,
      priority: Number(form.priority) || 100,
      event_name: form.event_name,
      match_type: form.match_type,
      match_value: form.match_value || '',
      content_type: form.content_type || null,
      lane: form.lane || null,
      weight_override: form.weight_override ? Number(form.weight_override) : null,
      notes: form.notes || null,
    };
    if (editing) {
      const { error: err } = await abmApi.patchEventRule(editing.id, body);
      if (err) setError(err);
      else {
        setDrawerOpen(false);
        load();
      }
    } else {
      const { error: err } = await abmApi.postEventRules(body);
      if (err) setError(err);
      else {
        setDrawerOpen(false);
        load();
      }
    }
    setSaving(false);
  };

  const handleTest = async () => {
    const { data } = await abmApi.testEventRule(testPath, testEvent);
    setTestResult(data ?? null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rules.findIndex((r) => r.id === active.id);
    const newIndex = rules.findIndex((r) => r.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newRules = arrayMove(rules, oldIndex, newIndex);
    setRules(newRules);
    const { error: err } = await abmApi.reorderEventRules(newRules.map((r) => r.id));
    if (err) setError(err);
    else load();
  };

  const laneOptions = LANE_OPTIONS.filter((o) => o !== 'All');

  return (
    <Card sx={{ bgcolor: '#0A0A0A', border: '1px solid #262626' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#FFFFFF' }}>Event Rules</Typography>
          <Button variant="contained" size="small" onClick={openNew}>Add Rule</Button>
        </Box>
        {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
        {loading ? (
          <Typography color="text.secondary">Loading…</Typography>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#9CA3AF', width: 40 }} />
                  <TableCell sx={{ color: '#9CA3AF' }}>Enabled</TableCell>
                  <TableCell sx={{ color: '#9CA3AF' }}>Priority</TableCell>
                <TableCell sx={{ color: '#9CA3AF' }}>Event</TableCell>
                <TableCell sx={{ color: '#9CA3AF' }}>Match Type</TableCell>
                <TableCell sx={{ color: '#9CA3AF' }}>Match Value</TableCell>
                <TableCell sx={{ color: '#9CA3AF' }}>Content Type</TableCell>
                <TableCell sx={{ color: '#9CA3AF' }}>Lane</TableCell>
                <TableCell sx={{ color: '#9CA3AF' }}>Updated</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <SortableContext items={rules.map((r) => r.id)} strategy={verticalListSortingStrategy}>
                {rules.map((r) => (
                  <SortableRuleRow key={r.id} rule={r} onEdit={() => openEdit(r)} />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
          </DndContext>
        )}

        <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <Box sx={{ width: 400, p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>{editing ? 'Edit Rule' : 'New Rule'}</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={<Switch checked={form.enabled} onChange={(_, v) => setForm((f) => ({ ...f, enabled: v }))} />}
                label="Enabled"
              />
              <TextField label="Priority" type="number" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) || 100 }))} />
              <InputLabel>Event name</InputLabel>
              <Select value={form.event_name} onChange={(e) => setForm((f) => ({ ...f, event_name: e.target.value }))}>
                {EVENT_NAMES.map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
              </Select>
              <InputLabel>Match type</InputLabel>
              <Select value={form.match_type} onChange={(e) => setForm((f) => ({ ...f, match_type: e.target.value }))}>
                {MATCH_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
              <TextField label="Match value" value={form.match_value} onChange={(e) => setForm((f) => ({ ...f, match_value: e.target.value }))} placeholder="/ground-station" />
              <InputLabel>Content type</InputLabel>
              <Select value={form.content_type} onChange={(e) => setForm((f) => ({ ...f, content_type: e.target.value }))}>
                <MenuItem value="">—</MenuItem>
                {CONTENT_TYPES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
              <InputLabel>Lane</InputLabel>
              <Select value={form.lane} onChange={(e) => setForm((f) => ({ ...f, lane: e.target.value }))}>
                <MenuItem value="">—</MenuItem>
                {laneOptions.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
              </Select>
              <TextField label="Weight override" type="number" value={form.weight_override} onChange={(e) => setForm((f) => ({ ...f, weight_override: e.target.value }))} placeholder="Optional" />
              <TextField label="Notes" multiline value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />

              <Typography variant="subtitle2" sx={{ mt: 2 }}>Test Rule</Typography>
              <TextField
                label="Path / URL"
                value={testPath}
                onChange={(e) => setTestPath(e.target.value)}
                placeholder="/ground-station"
                size="small"
              />
              <Select value={testEvent} onChange={(e) => setTestEvent(e.target.value)} size="small">
                {EVENT_NAMES.map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
              </Select>
              <Button variant="outlined" size="small" onClick={handleTest}>Test</Button>
              {testResult && (
                <Typography variant="body2" sx={{ color: testResult.matched ? 'success.main' : 'text.secondary' }}>
                  {testResult.matched ? `Match: content_type=${testResult.content_type}, lane=${testResult.lane}` : 'No match'}
                </Typography>
              )}

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
