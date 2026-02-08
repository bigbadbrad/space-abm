'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import { abmApi, type ABMTopicRule, type ABMSourceWeight, type ABMImportRun, type ABMProgramRule, type ABMProgramSuppressionRule, type ABMLaneDefinition, type ABMAgencyBlacklistEntry } from '@/lib/abm/client';

export function AdminProcurement(): React.JSX.Element {
  const [topicRules, setTopicRules] = React.useState<ABMTopicRule[]>([]);
  const [sourceWeights, setSourceWeights] = React.useState<ABMSourceWeight[]>([]);
  const [importRuns, setImportRuns] = React.useState<ABMImportRun[]>([]);
  const [programRules, setProgramRules] = React.useState<ABMProgramRule[]>([]);
  const [suppressionRules, setSuppressionRules] = React.useState<ABMProgramSuppressionRule[]>([]);
  const [laneDefinitions, setLaneDefinitions] = React.useState<ABMLaneDefinition[]>([]);
  const [agencyBlacklist, setAgencyBlacklist] = React.useState<ABMAgencyBlacklistEntry[]>([]);
  const [newAgencyPattern, setNewAgencyPattern] = React.useState('');
  const [addingAgency, setAddingAgency] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [importing, setImporting] = React.useState(false);
  const [ingestingUsaspending, setIngestingUsaspending] = React.useState(false);
  const [ingestingSpacewerx, setIngestingSpacewerx] = React.useState(false);
  const [reclassifying, setReclassifying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const [rulesRes, weightsRes, runsRes, progRulesRes, suppRulesRes, lanesRes, blacklistRes] = await Promise.all([
      abmApi.getTopicRules(),
      abmApi.getSourceWeights(),
      abmApi.getImportRuns(),
      abmApi.getProgramRules(),
      abmApi.getProgramSuppressionRules(),
      abmApi.getLaneDefinitions(),
      abmApi.getAgencyBlacklist(),
    ]);
    if (rulesRes.data) setTopicRules(rulesRes.data.rules || []);
    if (weightsRes.data) setSourceWeights(weightsRes.data.weights || []);
    if (runsRes.data) setImportRuns(runsRes.data.runs || []);
    if (progRulesRes.data) setProgramRules(progRulesRes.data.rules || []);
    if (suppRulesRes.data) setSuppressionRules(suppRulesRes.data.rules || []);
    if (lanesRes.data) setLaneDefinitions(lanesRes.data.lanes || []);
    if (blacklistRes.data) setAgencyBlacklist(blacklistRes.data.entries || []);
    const err = rulesRes.error || weightsRes.error || runsRes.error || progRulesRes.error || suppRulesRes.error || lanesRes.error || blacklistRes.error;
    if (err) setError(err);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleRunImport = async () => {
    setImporting(true);
    const res = await abmApi.runSamImport();
    setImporting(false);
    if (!res.error) load();
  };

  const handleUsaspendingIngest = async () => {
    setIngestingUsaspending(true);
    await abmApi.runUsaspendingIngest();
    setIngestingUsaspending(false);
    load();
  };

  const handleSpacewerxIngest = async () => {
    setIngestingSpacewerx(true);
    await abmApi.runSpacewerxIngest();
    setIngestingSpacewerx(false);
    load();
  };

  const handleFlushCache = async () => {
    await abmApi.flushCache();
    load();
  };

  const handleReclassify = async (range: string) => {
    setReclassifying(true);
    setError(null);
    const res = await abmApi.reclassifyPrograms(range);
    setReclassifying(false);
    if (res.error) setError(res.error);
    else load();
  };

  const handleAddAgencyBlacklist = async () => {
    const pattern = newAgencyPattern.trim();
    if (!pattern) return;
    setAddingAgency(true);
    setError(null);
    const res = await abmApi.postAgencyBlacklist({ agency_pattern: pattern });
    setAddingAgency(false);
    if (res.error) setError(res.error);
    else {
      setNewAgencyPattern('');
      load();
    }
  };

  const handleRemoveAgencyBlacklist = async (id: string) => {
    setError(null);
    const res = await abmApi.deleteAgencyBlacklist(id);
    if (res.error) setError(res.error);
    else load();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress sx={{ color: '#9CA3AF' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {error && <Typography color="error">{error}</Typography>}

      <Card sx={{ bgcolor: '#0A0A0A', border: '1px solid #262626' }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 2 }}>Import Runs</Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Button variant="contained" onClick={handleRunImport} disabled={importing} sx={{ bgcolor: '#3b82f6' }}>
              {importing ? 'Running…' : 'Run SAM import'}
            </Button>
            <Button variant="contained" onClick={handleUsaspendingIngest} disabled={ingestingUsaspending} sx={{ bgcolor: '#10B981' }}>
              {ingestingUsaspending ? 'Running…' : 'Run USAspending ingest'}
            </Button>
            <Button variant="contained" onClick={handleSpacewerxIngest} disabled={ingestingSpacewerx} sx={{ bgcolor: '#8B5CF6' }}>
              {ingestingSpacewerx ? 'Running…' : 'Run SpaceWERX ingest'}
            </Button>
            <Button variant="outlined" onClick={() => handleReclassify('7d')} disabled={reclassifying} sx={{ borderColor: '#262626', color: '#9CA3AF' }}>
              {reclassifying ? 'Reclassifying…' : 'Reclassify last 7d'}
            </Button>
            <Button variant="outlined" onClick={() => handleReclassify('30d')} disabled={reclassifying} sx={{ borderColor: '#262626', color: '#9CA3AF' }}>
              Reclassify last 30d
            </Button>
            <Button variant="outlined" onClick={handleFlushCache} sx={{ borderColor: '#262626', color: '#9CA3AF' }}>
              Flush cache
            </Button>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Source</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Started</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Status</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Fetched</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Upserted</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Errors</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {importRuns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ color: '#9CA3AF', borderColor: '#262626', textAlign: 'center', py: 3 }}>No import runs yet</TableCell>
                </TableRow>
              ) : (
                importRuns.slice(0, 10).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell sx={{ color: '#FFFFFF', borderColor: '#262626' }}>{r.source}</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem' }}>{r.started_at ? new Date(r.started_at).toLocaleString() : '—'}</TableCell>
                    <TableCell sx={{ borderColor: '#262626' }}>
                      <Box component="span" sx={{ color: r.status === 'success' ? '#10B981' : r.status === 'failed' ? '#EF4444' : '#F59E0B' }}>{r.status}</Box>
                    </TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>{r.records_fetched ?? '—'}</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>{r.records_upserted ?? '—'}</TableCell>
                    <TableCell sx={{ color: r.error_count ? '#EF4444' : '#9CA3AF', borderColor: '#262626' }}>{r.error_count ?? 0}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card sx={{ bgcolor: '#0A0A0A', border: '1px solid #262626' }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 2 }}>Topic Rules</Typography>
          <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem', mb: 2 }}>Pattern-based classification for procurement programs. Edit via API or add UI later.</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Priority</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Field</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Match</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Lane</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Topic</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Weight</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topicRules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ color: '#9CA3AF', borderColor: '#262626', textAlign: 'center', py: 3 }}>No topic rules. Run seed:procurement.</TableCell>
                </TableRow>
              ) : (
                topicRules.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell sx={{ color: '#FFFFFF', borderColor: '#262626' }}>{r.priority}</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>{r.match_field || 'title'}</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.match_value || '—'}</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>{r.service_lane || '—'}</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>{r.topic || '—'}</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>{r.weight ?? '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card sx={{ bgcolor: '#0A0A0A', border: '1px solid #262626' }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 2 }}>Agency Blacklist</Typography>
          <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem', mb: 2 }}>
            Departments/agencies to ignore. Programs whose agency contains a blacklisted pattern are suppressed.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              size="small"
              variant="outlined"
              label="Add agency pattern"
              placeholder="e.g. VETERANS AFFAIRS, DEPT OF DEFENSE"
              value={newAgencyPattern}
              onChange={(e) => setNewAgencyPattern(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddAgencyBlacklist()}
              disabled={addingAgency}
              sx={{
                minWidth: 280,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#1a1a1a',
                  color: '#fff',
                  '& fieldset': { borderColor: '#404040' },
                  '&:hover fieldset': { borderColor: '#6366f1' },
                  '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                },
                '& .MuiInputLabel-root': { color: '#9CA3AF' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#6366f1' },
              }}
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleAddAgencyBlacklist}
              disabled={!newAgencyPattern.trim() || addingAgency}
              sx={{
                bgcolor: newAgencyPattern.trim() ? '#6366f1' : '#404040',
                color: '#fff',
                '&:hover': { bgcolor: newAgencyPattern.trim() ? '#4f46e5' : '#404040' },
                '&.Mui-disabled': { bgcolor: '#262626', color: '#6b7280' },
              }}
            >
              {addingAgency ? 'Adding…' : 'Add'}
            </Button>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Pattern</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Notes</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Enabled</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', width: 60 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {agencyBlacklist.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ color: '#9CA3AF', borderColor: '#262626', textAlign: 'center', py: 3 }}>No agencies blacklisted. Add patterns to ignore (e.g. VETERANS AFFAIRS).</TableCell>
                </TableRow>
              ) : (
                agencyBlacklist.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell sx={{ color: '#FFFFFF', borderColor: '#262626', fontFamily: 'monospace' }}>{e.agency_pattern}</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem' }}>{e.notes || '—'}</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>{e.enabled ? '✓' : '—'}</TableCell>
                    <TableCell sx={{ borderColor: '#262626' }}>
                      <IconButton size="small" onClick={() => handleRemoveAgencyBlacklist(e.id)} sx={{ color: '#EF4444' }} title="Remove">
                        ×
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card sx={{ bgcolor: '#0A0A0A', border: '1px solid #262626' }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 2 }}>Program Rules (Positive)</Typography>
          <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem', mb: 2 }}>Rules that add relevance score and assign lane/topic.</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Priority</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Field</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Match</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Lane</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Add Score</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {programRules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ color: '#9CA3AF', borderColor: '#262626', textAlign: 'center', py: 3 }}>No program rules. Run seed:program-intelligence.</TableCell>
                </TableRow>
              ) : (
                programRules.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell sx={{ color: '#FFFFFF', borderColor: '#262626' }}>{r.priority}</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>{r.match_field || '*'}</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.match_value || '—'}</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>{r.service_lane || '—'}</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>{r.add_score ?? '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card sx={{ bgcolor: '#0A0A0A', border: '1px solid #262626' }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 2 }}>Suppression Rules</Typography>
          <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem', mb: 2 }}>Rules that suppress non-space notices (HVAC, plumbing, etc.).</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Priority</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Field</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Match</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Reason</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {suppressionRules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ color: '#9CA3AF', borderColor: '#262626', textAlign: 'center', py: 3 }}>No suppression rules. Run seed:program-intelligence.</TableCell>
                </TableRow>
              ) : (
                suppressionRules.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell sx={{ color: '#FFFFFF', borderColor: '#262626' }}>{r.priority}</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>{r.match_field || '*'}</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.match_value || '—'}</TableCell>
                    <TableCell sx={{ color: '#EF4444', borderColor: '#262626', fontSize: '0.8rem' }}>{r.suppress_reason || '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card sx={{ bgcolor: '#0A0A0A', border: '1px solid #262626' }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 2 }}>Lane Definitions</Typography>
          <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem', mb: 2 }}>Service lane keys for classifier and UI.</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Key</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Display Name</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {laneDefinitions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} sx={{ color: '#9CA3AF', borderColor: '#262626', textAlign: 'center', py: 3 }}>No lane definitions. Run seed:program-intelligence.</TableCell>
                </TableRow>
              ) : (
                laneDefinitions.map((l) => (
                  <TableRow key={l.lane_key}>
                    <TableCell sx={{ color: '#FFFFFF', borderColor: '#262626', fontFamily: 'monospace' }}>{l.lane_key}</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>{l.display_name}</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626', fontSize: '0.8rem', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.description || '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card sx={{ bgcolor: '#0A0A0A', border: '1px solid #262626' }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 2 }}>Source Weights</Typography>
          <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem', mb: 2 }}>Multipliers for procurement signal sources.</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Source</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Multiplier</TableCell>
                <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>Enabled</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sourceWeights.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} sx={{ color: '#9CA3AF', borderColor: '#262626', textAlign: 'center', py: 3 }}>No source weights. Run seed:procurement.</TableCell>
                </TableRow>
              ) : (
                sourceWeights.map((w) => (
                  <TableRow key={w.source}>
                    <TableCell sx={{ color: '#FFFFFF', borderColor: '#262626' }}>{w.source}</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>{w.multiplier}</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', borderColor: '#262626' }}>{w.enabled ? '✓' : '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}
