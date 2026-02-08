'use client';

import * as React from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import CircularProgress from '@mui/material/CircularProgress';
import dayjs from 'dayjs';
import { DotsThree as DotsThreeIcon } from '@phosphor-icons/react/dist/ssr/DotsThree';
import { FileText as FileTextIcon } from '@phosphor-icons/react/dist/ssr/FileText';
import { CaretDown as CaretDownIcon } from '@phosphor-icons/react/dist/ssr/CaretDown';
import { ArrowSquareOut as ArrowSquareOutIcon } from '@phosphor-icons/react/dist/ssr/ArrowSquareOut';
import { Copy as CopyIcon } from '@phosphor-icons/react/dist/ssr/Copy';
import { EnvelopeSimple as EnvelopeSimpleIcon } from '@phosphor-icons/react/dist/ssr/EnvelopeSimple';
import { User as UserIcon } from '@phosphor-icons/react/dist/ssr/User';
import { CheckCircle as CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { Warning as WarningIcon } from '@phosphor-icons/react/dist/ssr/Warning';

import { paths } from '@/paths';
import { abmApi, type ABMProgramDetailView } from '@/lib/abm/client';
import { formatLaneDisplayName, formatSourceLabel } from '@/components/abm/layout/config';

const STATUS_COLORS: Record<string, string> = {
  open: '#10B981',
  closed: '#9CA3AF',
  awarded: '#3b82f6',
};

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

export interface ProgramInspectorProps {
  detail: ABMProgramDetailView | null;
  loading: boolean;
  programId: string | null;
  linkAccountId: string;
  linkMissionId: string;
  linking: boolean;
  onLinkAccountIdChange: (v: string) => void;
  onLinkMissionIdChange: (v: string) => void;
  onLinkAccount: () => void;
  onUnlinkAccount: (linkId: string) => void;
  onLinkMission: () => void;
  onCreateMission: () => void;
  onRefresh: () => void;
}

export function ProgramInspector({
  detail,
  loading,
  programId,
  linkAccountId,
  linkMissionId,
  linking,
  onLinkAccountIdChange,
  onLinkMissionIdChange,
  onLinkAccount,
  onUnlinkAccount,
  onLinkMission,
  onCreateMission,
  onRefresh,
}: ProgramInspectorProps): React.JSX.Element {
  const [tab, setTab] = React.useState(0);
  const [summaryExpanded, setSummaryExpanded] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [noteText, setNoteText] = React.useState('');
  const [addingNote, setAddingNote] = React.useState(false);
  const [triageStatus, setTriageStatus] = React.useState(detail?.triage?.triage_status || 'new');
  const [priority, setPriority] = React.useState(detail?.triage?.priority || 'medium');
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (detail) {
      setTriageStatus(detail.triage?.triage_status || 'new');
      setPriority(detail.triage?.priority || 'medium');
    }
  }, [detail]);

  const handleAddNote = async () => {
    if (!programId || !noteText.trim() || addingNote) return;
    setAddingNote(true);
    const res = await abmApi.postProgramNote(programId, noteText.trim());
    setAddingNote(false);
    if (!res.error) {
      setNoteText('');
      onRefresh();
    }
  };

  const handleTriageUpdate = async (field: 'triage_status' | 'priority', value: string) => {
    if (!programId) return;
    if (field === 'triage_status') setTriageStatus(value);
    else setPriority(value);
    await abmApi.patchProgram(programId, { [field]: value });
    onRefresh();
  };

  const handleSuppress = async () => {
    if (!programId) return;
    setAnchorEl(null);
    await abmApi.patchProgram(programId, { suppressed: true, suppressed_reason: 'Marked irrelevant' });
    onRefresh();
  };

  const handleCopyLink = () => {
    if (!detail?.program?.url) return;
    navigator.clipboard.writeText(detail.program.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    setAnchorEl(null);
  };

  const dueInDays = detail?.program?.due_at
    ? Math.ceil(dayjs(detail.program.due_at).diff(dayjs(), 'day', true))
    : null;

  if (!programId) {
    return (
      <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', minHeight: 300 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 280 }}>
          <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Select a program from the list</Typography>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', minHeight: 300 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 280 }}>
          <CircularProgress size={32} sx={{ color: '#9CA3AF' }} />
        </CardContent>
      </Card>
    );
  }

  if (!detail) {
    return (
      <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', minHeight: 300 }}>
        <CardContent>
          <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Failed to load program</Typography>
        </CardContent>
      </Card>
    );
  }

  const p = detail.program;
  const statusColor = STATUS_COLORS[p.status] || '#9CA3AF';

  return (
    <Card sx={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', p: 0 }}>
        {/* Fixed header */}
        <Box sx={{ p: 2, borderBottom: '1px solid #262626', flexShrink: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 1 }}>
            <Tooltip title={p.title} arrow>
              <Typography
                sx={{
                  color: '#FFFFFF',
                  fontSize: '1rem',
                  fontWeight: 600,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {p.title}
              </Typography>
            </Tooltip>
            <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ color: '#9CA3AF' }}>
              <DotsThreeIcon size={18} />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
            <Chip label={formatSourceLabel(p.source)} size="small" sx={{ bgcolor: '#262626', color: '#fff', fontSize: '0.65rem' }} />
            <Chip label={p.status} size="small" sx={{ bgcolor: '#262626', color: statusColor, fontSize: '0.65rem' }} />
            <Chip label={formatLaneDisplayName(p.service_lane)} size="small" sx={{ bgcolor: '#262626', color: '#3b82f6', fontSize: '0.65rem' }} />
            <Chip label={`${p.relevance_score ?? 0}`} size="small" sx={{ bgcolor: (p.relevance_score ?? 0) >= 60 ? '#10B98133' : '#262626', color: (p.relevance_score ?? 0) >= 60 ? '#10B981' : '#9CA3AF', fontSize: '0.65rem' }} />
            <Chip label={`${Math.round((p.match_confidence ?? 0) * 100)}%`} size="small" sx={{ bgcolor: '#262626', color: '#9CA3AF', fontSize: '0.65rem' }} />
            {dueInDays != null && (
              <Chip
                label={dueInDays <= 7 ? `Due in ${dueInDays}d` : `Due ${dayjs(p.due_at).format('MM/DD')}`}
                size="small"
                sx={{ bgcolor: dueInDays <= 7 ? '#F59E0B33' : '#262626', color: dueInDays <= 7 ? '#F59E0B' : '#9CA3AF', fontSize: '0.65rem' }}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
            <Button variant="contained" size="small" onClick={onCreateMission} sx={{ bgcolor: '#3b82f6' }}>
              Create Mission
            </Button>
            <Button variant="outlined" size="small" sx={{ borderColor: '#262626', color: '#9CA3AF' }}>
              Link Account
            </Button>
            {p.url && (
              <Button component="a" href={p.url} target="_blank" rel="noopener noreferrer" size="small" sx={{ color: '#3b82f6', minWidth: 0 }}>
                Open {formatSourceLabel(p.source)} <ArrowSquareOutIcon size={14} style={{ marginLeft: 4 }} />
              </Button>
            )}
          </Box>

          {detail.why_matched && (
            <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', fontStyle: 'italic' }}>
              Matched: {detail.why_matched}
            </Typography>
          )}

          <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
            <MenuItem onClick={handleSuppress}>Mark irrelevant / Suppress</MenuItem>
            <MenuItem onClick={handleCopyLink}>{copied ? 'Copied!' : 'Copy link'}</MenuItem>
          </Menu>
        </Box>

        {/* Tabs */}
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid #262626', minHeight: 40, '& .MuiTab-root': { minHeight: 40, py: 0 } }}>
          <Tab label="Overview" sx={{ color: '#9CA3AF', fontSize: '0.75rem' }} />
          <Tab label="Requirements" sx={{ color: '#9CA3AF', fontSize: '0.75rem' }} />
          <Tab label="Attachments" sx={{ color: '#9CA3AF', fontSize: '0.75rem' }} />
          <Tab label="Contacts" sx={{ color: '#9CA3AF', fontSize: '0.75rem' }} />
          <Tab label="Actions & Notes" sx={{ color: '#9CA3AF', fontSize: '0.75rem' }} />
          <Tab label="Matching" sx={{ color: '#9CA3AF', fontSize: '0.75rem' }} />
        </Tabs>

        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <TabPanel value={tab} index={0}>
            <Accordion defaultExpanded sx={{ bgcolor: 'transparent', border: '1px solid #262626', '&:before': { display: 'none' }, mb: 1 }}>
              <AccordionSummary expandIcon={<CaretDownIcon size={16} style={{ color: '#9CA3AF' }} />} sx={{ minHeight: 40 }}>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase' }}>Key Facts</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, fontSize: '0.8rem' }}>
                  <Typography sx={{ color: '#9CA3AF' }}>Agency</Typography>
                  <Typography sx={{ color: '#E5E7EB' }}>{detail.overview?.agency || '—'}</Typography>
                  <Typography sx={{ color: '#9CA3AF' }}>Notice type</Typography>
                  <Typography sx={{ color: '#E5E7EB' }}>{detail.overview?.notice_type || '—'}</Typography>
                  <Typography sx={{ color: '#9CA3AF' }}>Posted</Typography>
                  <Typography sx={{ color: '#E5E7EB' }}>{detail.overview?.posted_at ? dayjs(detail.overview.posted_at).format('MM/DD/YYYY') : '—'}</Typography>
                  <Typography sx={{ color: '#9CA3AF' }}>Due date</Typography>
                  <Typography sx={{ color: '#E5E7EB' }}>{detail.overview?.due_at ? dayjs(detail.overview.due_at).format('MM/DD/YYYY') : '—'}</Typography>
                  <Typography sx={{ color: '#9CA3AF' }}>Set-aside</Typography>
                  <Typography sx={{ color: '#E5E7EB' }}>{detail.overview?.set_aside || '—'}</Typography>
                  <Typography sx={{ color: '#9CA3AF' }}>NAICS / PSC</Typography>
                  <Typography sx={{ color: '#E5E7EB' }}>{[detail.overview?.naics, detail.overview?.psc].filter(Boolean).join(' / ') || '—'}</Typography>
                  <Typography sx={{ color: '#9CA3AF' }}>Place of performance</Typography>
                  <Typography sx={{ color: '#E5E7EB' }}>
                    {detail.overview?.place_of_performance
                      ? [detail.overview.place_of_performance.state, detail.overview.place_of_performance.country].filter(Boolean).join(', ') || detail.overview.place_of_performance.country || '—'
                      : '—'}
                  </Typography>
                  <Typography sx={{ color: '#9CA3AF' }}>Solicitation #</Typography>
                  <Typography sx={{ color: '#E5E7EB', fontFamily: 'monospace' }}>{detail.overview?.solicitation_number || '—'}</Typography>
                </Box>
              </AccordionDetails>
            </Accordion>

            <Accordion defaultExpanded sx={{ bgcolor: 'transparent', border: '1px solid #262626', '&:before': { display: 'none' }, mb: 1 }}>
              <AccordionSummary expandIcon={<CaretDownIcon size={16} style={{ color: '#9CA3AF' }} />} sx={{ minHeight: 40 }}>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase' }}>Summary</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography sx={{ color: '#E5E7EB', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                  {summaryExpanded ? (detail.requirements?.description || '—') : (detail.requirements?.description || '—').slice(0, 400)}
                  {(detail.requirements?.description?.length ?? 0) > 400 && !summaryExpanded && '…'}
                </Typography>
                {(detail.requirements?.description?.length ?? 0) > 400 && (
                  <Button size="small" onClick={() => setSummaryExpanded(!summaryExpanded)} sx={{ color: '#3b82f6', mt: 0.5 }}>
                    {summaryExpanded ? 'Show less' : 'Read more'}
                  </Button>
                )}
              </AccordionDetails>
            </Accordion>

            <Accordion defaultExpanded sx={{ bgcolor: 'transparent', border: '1px solid #262626', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<CaretDownIcon size={16} style={{ color: '#9CA3AF' }} />} sx={{ minHeight: 40 }}>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase' }}>Linked Accounts & Missions</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ mb: 1 }}>
                  {p.accountLinks?.length ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {p.accountLinks.map((l) => (
                        <Chip
                          key={l.id}
                          label={l.prospectCompany?.name || l.prospectCompany?.domain || l.prospect_company_id}
                          size="small"
                          component={Link}
                          href={paths.abm.account(l.prospect_company_id)}
                          sx={{ bgcolor: '#262626', color: '#fff', cursor: 'pointer', textDecoration: 'none' }}
                          onDelete={() => onUnlinkAccount(l.id)}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>No linked accounts</Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center' }}>
                    <TextField
                      size="small"
                      placeholder="Account ID to link"
                      value={linkAccountId}
                      onChange={(e) => onLinkAccountIdChange(e.target.value)}
                      sx={{ flex: 1, minWidth: 120, '& .MuiInputBase-root': { backgroundColor: '#0A0A0A', color: '#fff' } }}
                    />
                    <Button variant="outlined" size="small" onClick={onLinkAccount} disabled={linking || !linkAccountId} sx={{ borderColor: '#262626', color: '#3b82f6' }}>
                      Link
                    </Button>
                  </Box>
                </Box>
                <Box>
                  {p.missionLinks?.length ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {p.missionLinks.map((l) => (
                        <Button
                          key={l.id}
                          component={Link}
                          href={`${paths.abm.missions}?id=${l.mission_id}`}
                          size="small"
                          variant="outlined"
                          sx={{ borderColor: '#262626', color: '#3b82f6', mr: 0.5, mb: 0.5 }}
                        >
                          {l.mission?.title?.slice(0, 30) || l.mission_id} →
                        </Button>
                      ))}
                    </Box>
                  ) : null}
                  <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center' }}>
                    <TextField
                      size="small"
                      placeholder="Mission ID to link"
                      value={linkMissionId}
                      onChange={(e) => onLinkMissionIdChange(e.target.value)}
                      sx={{ flex: 1, minWidth: 120, '& .MuiInputBase-root': { backgroundColor: '#0A0A0A', color: '#fff' } }}
                    />
                    <Button variant="outlined" size="small" onClick={onLinkMission} disabled={linking || !linkMissionId} sx={{ borderColor: '#262626', color: '#3b82f6' }}>
                      Attach
                    </Button>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          </TabPanel>

          <TabPanel value={tab} index={1}>
            {detail.requirements?.extracted && (detail.requirements.extracted.objective || (detail.requirements.extracted.scope?.length ?? 0) > 0) ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {detail.requirements.extracted.objective && (
                  <Box>
                    <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mb: 0.5 }}>Objective</Typography>
                    <Typography sx={{ color: '#E5E7EB', fontSize: '0.85rem' }}>{detail.requirements.extracted.objective}</Typography>
                  </Box>
                )}
                {(detail.requirements.extracted.scope?.length ?? 0) > 0 ? (
                  <Box>
                    <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mb: 0.5 }}>Scope</Typography>
                    <List dense>
                      {detail.requirements.extracted.scope!.map((s, i) => (
                        <ListItem key={i} sx={{ py: 0 }}>
                          <ListItemText primary={s} primaryTypographyProps={{ sx: { color: '#E5E7EB', fontSize: '0.85rem' } }} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                ) : null}
                {(detail.requirements.extracted.deliverables?.length ?? 0) > 0 ? (
                  <Box>
                    <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mb: 0.5 }}>Deliverables</Typography>
                    <List dense>
                      {detail.requirements.extracted.deliverables!.map((s, i) => (
                        <ListItem key={i} sx={{ py: 0 }}>
                          <ListItemText primary={s} primaryTypographyProps={{ sx: { color: '#E5E7EB', fontSize: '0.85rem' } }} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                ) : null}
                {(detail.requirements.extracted.submission?.length ?? 0) > 0 ? (
                  <Box>
                    <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mb: 0.5 }}>Submission</Typography>
                    <List dense>
                      {detail.requirements.extracted.submission!.map((s, i) => (
                        <ListItem key={i} sx={{ py: 0 }}>
                          <ListItemText primary={s} primaryTypographyProps={{ sx: { color: '#E5E7EB', fontSize: '0.85rem' } }} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                ) : null}
              </Box>
            ) : (
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.85rem' }}>
                {detail.requirements?.description ? 'No structured extraction available. See full description in Overview.' : 'No requirements data available.'}
              </Typography>
            )}
          </TabPanel>

          <TabPanel value={tab} index={2}>
            {detail.attachments?.length ? (
              <List dense>
                {detail.attachments.map((a, i) => (
                  <ListItem key={i} sx={{ borderBottom: '1px solid #262626' }}>
                    <FileTextIcon size={18} style={{ color: '#9CA3AF', marginRight: 8 }} />
                    <ListItemText primary={a.title || 'Document'} secondary={a.url} primaryTypographyProps={{ sx: { color: '#E5E7EB', fontSize: '0.85rem' } }} secondaryTypographyProps={{ sx: { color: '#6B7280', fontSize: '0.7rem', wordBreak: 'break-all' } }} />
                    <ListItemSecondaryAction>
                      <IconButton size="small" component="a" href={a.url} target="_blank" rel="noopener noreferrer" sx={{ color: '#3b82f6' }}>
                        <ArrowSquareOutIcon size={16} />
                      </IconButton>
                      <IconButton size="small" onClick={() => navigator.clipboard.writeText(a.url)} sx={{ color: '#9CA3AF' }}>
                        <CopyIcon size={16} />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.85rem' }}>No attachments found</Typography>
            )}
          </TabPanel>

          <TabPanel value={tab} index={3}>
            {detail.contacts?.length ? (
              <List dense>
                {detail.contacts.map((c, i) => (
                  <ListItem key={i} sx={{ borderBottom: '1px solid #262626', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <UserIcon size={16} style={{ color: '#9CA3AF' }} />
                      <Typography sx={{ color: '#E5E7EB', fontSize: '0.9rem', fontWeight: 600 }}>{c.name || '—'}</Typography>
                      {c.role && (
                        <Chip label={c.role} size="small" sx={{ bgcolor: '#262626', color: '#9CA3AF', fontSize: '0.65rem' }} />
                      )}
                    </Box>
                    {c.email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.8rem' }}>
                        <EnvelopeSimpleIcon size={14} style={{ color: '#9CA3AF' }} />
                        <Typography component="a" href={`mailto:${c.email}`} sx={{ color: '#3b82f6', textDecoration: 'none' }}>
                          {c.email}
                        </Typography>
                      </Box>
                    )}
                    {c.phone && <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>{c.phone}</Typography>}
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.85rem' }}>No contacts found</Typography>
            )}
          </TabPanel>

          <TabPanel value={tab} index={4}>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mb: 1 }}>Assign & workflow</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel sx={{ color: '#9CA3AF' }}>Status</InputLabel>
                  <Select
                    value={triageStatus}
                    label="Status"
                    onChange={(e) => handleTriageUpdate('triage_status', e.target.value)}
                    sx={{ backgroundColor: '#0A0A0A', color: '#fff' }}
                  >
                    <MenuItem value="new">New</MenuItem>
                    <MenuItem value="triaged">Triaged</MenuItem>
                    <MenuItem value="linked">Linked</MenuItem>
                    <MenuItem value="mission_created">Mission created</MenuItem>
                    <MenuItem value="ignored">Ignored</MenuItem>
                    <MenuItem value="suppressed">Suppressed</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <InputLabel sx={{ color: '#9CA3AF' }}>Priority</InputLabel>
                  <Select value={priority} label="Priority" onChange={(e) => handleTriageUpdate('priority', e.target.value)} sx={{ backgroundColor: '#0A0A0A', color: '#fff' }}>
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mb: 1 }}>Add note</Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <TextField
                  multiline
                  minRows={2}
                  placeholder="Add a note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  sx={{ flex: 1, '& .MuiInputBase-root': { backgroundColor: '#0A0A0A', color: '#fff' } }}
                />
                <Button variant="outlined" size="small" onClick={handleAddNote} disabled={!noteText.trim() || addingNote} sx={{ borderColor: '#262626', color: '#3b82f6' }}>
                  {addingNote ? '…' : 'Add'}
                </Button>
              </Box>
            </Box>

            <Box>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mb: 1 }}>Notes timeline</Typography>
              {detail.notes?.length ? (
                <List dense>
                  {detail.notes.map((n) => (
                    <ListItem key={n.id} sx={{ flexDirection: 'column', alignItems: 'flex-start', borderBottom: '1px solid #262626', py: 1 }}>
                      <Typography sx={{ color: '#E5E7EB', fontSize: '0.85rem' }}>{n.note}</Typography>
                      <Typography sx={{ color: '#6B7280', fontSize: '0.7rem' }}>
                        {n.user?.preferred_name || n.user?.name || 'Unknown'} · {dayjs(n.created_at).format('MM/DD HH:mm')}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.85rem' }}>No notes yet</Typography>
              )}
            </Box>

            <Box sx={{ mt: 2 }}>
              <Button variant="contained" size="small" onClick={onCreateMission} sx={{ bgcolor: '#3b82f6', mr: 1 }}>
                Create Mission
              </Button>
              <Button variant="outlined" size="small" sx={{ borderColor: '#262626', color: '#9CA3AF' }}>
                Link Account
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={tab} index={5}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mb: 0.5 }}>Score & confidence</Typography>
                <Typography sx={{ color: '#E5E7EB', fontSize: '0.9rem' }}>
                  Relevance: {detail.matching?.relevance_score ?? 0} · Confidence: {Math.round((detail.matching?.match_confidence ?? 0) * 100)}%
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', mb: 0.5 }}>Matched rules</Typography>
                {detail.matching?.match_reasons_json?.length ? (
                  <List dense>
                    {detail.matching.match_reasons_json.map((r, i) => (
                      <ListItem key={i} sx={{ py: 0.25 }}>
                        <CheckCircleIcon size={14} style={{ color: '#10B981', marginRight: 8, flexShrink: 0 }} />
                        <ListItemText primary={r.label || `+${r.add_score ?? 0}`} primaryTypographyProps={{ sx: { color: '#E5E7EB', fontSize: '0.8rem' } }} />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography sx={{ color: '#9CA3AF', fontSize: '0.85rem' }}>No match reasons</Typography>
                )}
              </Box>
              {detail.matching?.suppressed && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon size={18} style={{ color: '#EF4444' }} />
                  <Typography sx={{ color: '#EF4444', fontSize: '0.85rem' }}>{detail.matching.suppressed_reason || 'Suppressed'}</Typography>
                </Box>
              )}
              <Typography sx={{ color: '#6B7280', fontSize: '0.7rem' }}>Version: {detail.matching?.classification_version || 'v1'}</Typography>
            </Box>
          </TabPanel>
        </Box>
      </CardContent>
    </Card>
  );
}
