'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import { GearSix as GearSixIcon } from '@phosphor-icons/react/dist/ssr/GearSix';
import { CaretDown as CaretDownIcon } from '@phosphor-icons/react/dist/ssr/CaretDown';
import { CaretRight as CaretRightIcon } from '@phosphor-icons/react/dist/ssr/CaretRight';

import { useConsumerProperty } from '@/contexts/consumer-property-context';
import { getPublisherAccounts, putPublisherAccount, startXAuth, type PublisherSocialAccount } from '@/lib/consumer/client';

const PLATFORMS = [
  { key: 'x', label: 'X' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
] as const;

const PAID_ADVERTISING_PLATFORMS = [
  { key: 'x', label: 'X' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'google', label: 'Google' },
] as const;

/** Placeholder card: matches Social Account row styling; expansion not wired yet. */
function PaidAdvertisingCard({ label }: { label: string }): React.JSX.Element {
  return (
    <Card sx={{ bgcolor: 'var(--mui-palette-neutral-900)', border: '1px solid var(--mui-palette-neutral-700)', mb: 2 }}>
      <CardHeader
        sx={{ color: 'var(--mui-palette-neutral-200)' }}
        title={label}
        subheader="Not configured"
        action={
          <Box
            component="span"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--mui-palette-neutral-400)',
              width: 40,
              height: 40,
              pointerEvents: 'none',
            }}
            aria-hidden
          >
            <CaretRightIcon size={20} />
          </Box>
        }
      />
    </Card>
  );
}

function AccountCard({
  platform,
  label,
  propertyId,
  account,
  onSaved,
}: {
  platform: string;
  label: string;
  propertyId: string;
  account: PublisherSocialAccount | undefined;
  onSaved: () => void;
}): React.JSX.Element {
  const [open, setOpen] = React.useState(!!account);
  const [displayName, setDisplayName] = React.useState(account?.display_name ?? '');
  const [credentials, setCredentials] = React.useState<Record<string, string>>(() => {
    const c = account?.credentials_json as Record<string, unknown> | undefined;
    if (!c || typeof c !== 'object') return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(c)) if (typeof v === 'string') out[k] = v;
    return out;
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setDisplayName(account?.display_name ?? '');
    const c = account?.credentials_json as Record<string, unknown> | undefined;
    if (c && typeof c === 'object') {
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(c)) if (typeof v === 'string') out[k] = v;
      setCredentials(out);
    } else setCredentials({});
  }, [account]);

  const credentialFields = React.useMemo(() => {
    if (platform === 'x') {
      // Per-property: we only store the user/token context here.
      return [
        {
          key: 'access_token',
          label: 'Access Token',
          type: 'password',
          helper: 'X user access token for this brand account (OAuth 2.0 user token).',
        },
        {
          key: 'refresh_token',
          label: 'Refresh Token',
          type: 'password',
          helper: 'Optional: refresh token paired with the access token (if offline.access is enabled).',
        },
      ];
    }
    if (platform === 'facebook') {
      return [
        { key: 'page_id', label: 'Page ID', type: 'text', helper: 'Facebook Page ID (from Page settings or URL).' },
        { key: 'page_access_token', label: 'Page Access Token', type: 'password', helper: 'Long‑lived Page access token from Facebook App → Graph API / Tools.' },
      ];
    }
    if (platform === 'instagram') {
      return [
        { key: 'page_id', label: 'Facebook Page ID', type: 'text', helper: 'Facebook Page that owns the Instagram business account.' },
        { key: 'ig_business_account_id', label: 'Instagram Business Account ID', type: 'text', helper: 'From Meta Graph Explorer or Business Manager.' },
        { key: 'page_access_token', label: 'Page Access Token', type: 'password', helper: 'Same long‑lived Page token used for Instagram Graph API.' },
      ];
    }
    return [];
  }, [platform]);

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    const credentialsJson: Record<string, string> = {};
    for (const f of credentialFields) if (credentials[f.key]?.trim()) credentialsJson[f.key] = credentials[f.key].trim();
    const { error: err } = await putPublisherAccount(platform, {
      property_id: propertyId,
      display_name: displayName.trim() || undefined,
      credentials_json: credentialsJson,
      is_active: true,
    });
    setSaving(false);
    if (err) setError(err);
    else onSaved();
  };

  return (
    <Card sx={{ bgcolor: 'var(--mui-palette-neutral-900)', border: '1px solid var(--mui-palette-neutral-700)', mb: 2 }}>
      <CardHeader
        sx={{ color: 'var(--mui-palette-neutral-200)' }}
        title={label}
        subheader={account ? (account.display_name || 'Configured') : 'Not configured'}
        action={
          <IconButton onClick={() => setOpen((o) => !o)} size="small" sx={{ color: 'var(--mui-palette-neutral-400)' }}>
            {open ? <CaretDownIcon size={20} /> : <CaretRightIcon size={20} />}
          </IconButton>
        }
      />
      <Collapse in={open}>
        <CardContent sx={{ pt: 0 }}>
          {platform === 'x' && propertyId ? (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={async () => {
                  const { url, error: startError } = await startXAuth(propertyId);
                  if (startError || !url) {
                    setError(startError || 'Failed to start X connect flow');
                    return;
                  }
                  window.location.href = url;
                }}
              >
                Connect X
              </Button>
            </Box>
          ) : null}
          <TextField
            label="Display name"
            fullWidth
            size="small"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={platform === 'x' ? '@handle' : 'Page or account name'}
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
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#374151',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#4B5563',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#60A5FA',
                },
              },
            }}
          />
          {credentialFields.map((f) => (
            <TextField
              key={f.key}
              label={f.label}
              fullWidth
              size="small"
              type={f.type}
              value={credentials[f.key] ?? ''}
              onChange={(e) => setCredentials((prev) => ({ ...prev, [f.key]: e.target.value }))}
              helperText={f.helper}
              sx={{ mb: 1.5 }}
              InputLabelProps={{
                sx: {
                  color: '#9CA3AF',
                  '&.Mui-focused': { color: '#E5E7EB' },
                },
              }}
              InputProps={{
                sx: {
                  color: '#E5E7EB',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#374151',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#4B5563',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#60A5FA',
                  },
                },
              }}
            />
          ))}
          {error ? <Typography color="error" sx={{ fontSize: '0.875rem', mb: 1 }}>{error}</Typography> : null}
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </CardContent>
      </Collapse>
    </Card>
  );
}

export default function ConsumerSettingsPage(): React.JSX.Element {
  const { activePropertyId, activeProperty, loading: propsLoading } = useConsumerProperty();
  const [accounts, setAccounts] = React.useState<PublisherSocialAccount[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadAccounts = React.useCallback(async () => {
    if (!activePropertyId) {
      setAccounts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await getPublisherAccounts(activePropertyId);
    setAccounts(data ?? []);
    setLoading(false);
  }, [activePropertyId]);

  React.useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const accountByPlatform = React.useMemo(() => {
    const m: Record<string, PublisherSocialAccount> = {};
    for (const a of accounts) m[a.platform] = a;
    return m;
  }, [accounts]);

  return (
    <Box sx={{ backgroundColor: '#050505', minHeight: '100vh', p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <GearSixIcon size={18} style={{ color: '#FFFFFF' }} />
          <Typography sx={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600 }}>Settings</Typography>
        </Box>
        <Typography sx={{ color: '#9CA3AF', fontSize: '0.8125rem', mt: 0.5 }}>
          Consumer surface — {activeProperty ? activeProperty.name : 'Select a property'}
        </Typography>
      </Box>

      {!activePropertyId ? (
        <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Select a property to manage settings.</Typography>
      ) : (
        <>
          <Typography sx={{ color: '#E5E7EB', fontSize: '1rem', fontWeight: 600, mb: 2 }}>Social Accounts</Typography>
          <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem', mb: 2 }}>
            Configure credentials for the selected property. Used by the Publisher to post to X, Facebook, and Instagram.
          </Typography>
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
              <CircularProgress size={20} />
              <Typography sx={{ color: '#9CA3AF' }}>Loading accounts…</Typography>
            </Box>
          ) : (
            PLATFORMS.map((p) => (
              <AccountCard
                key={p.key}
                platform={p.key}
                label={p.label}
                propertyId={activePropertyId}
                account={accountByPlatform[p.key]}
                onSaved={loadAccounts}
              />
            ))
          )}

          <Typography sx={{ color: '#E5E7EB', fontSize: '1rem', fontWeight: 600, mb: 2, mt: 5, pt: 3 }}>Paid Advertising</Typography>
          <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem', mb: 2 }}>
            Connect ad accounts to measure spend and performance alongside your campaigns. Configuration coming soon.
          </Typography>
          {PAID_ADVERTISING_PLATFORMS.map((p) => (
            <PaidAdvertisingCard key={`paid-${p.key}`} label={p.label} />
          ))}
        </>
      )}
    </Box>
  );
}
