'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import InputBase from '@mui/material/InputBase';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import CircularProgress from '@mui/material/CircularProgress';
import { CaretDown as CaretDownIcon } from '@phosphor-icons/react/dist/ssr/CaretDown';
import { Globe as GlobeIcon } from '@phosphor-icons/react/dist/ssr/Globe';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';

import { useConsumerProperty } from '@/contexts/consumer-property-context';
import { createConsumerProperty } from '@/lib/consumer/client';

const PRODUCT_TYPES = [
  { value: 'content', label: 'Content' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'saas', label: 'SaaS' },
  { value: 'other', label: 'Other' },
];

export function ConsumerPropertySelect(): React.JSX.Element {
  const { properties, activeProperty, setActivePropertyId, refreshProperties, loading, error } = useConsumerProperty();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [search, setSearch] = React.useState('');
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [addName, setAddName] = React.useState('');
  const [addDomain, setAddDomain] = React.useState('');
  const [addProductType, setAddProductType] = React.useState('other');
  const [addSubmitting, setAddSubmitting] = React.useState(false);
  const [addError, setAddError] = React.useState<string | null>(null);
  const open = Boolean(anchorEl);

  const filtered = React.useMemo(() => {
    if (!search.trim()) return properties;
    const q = search.trim().toLowerCase();
    return properties.filter((p) => p.name.toLowerCase().includes(q) || p.domain.toLowerCase().includes(q));
  }, [properties, search]);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
    setSearch('');
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (id: string) => {
    setActivePropertyId(id);
    handleClose();
  };

  const handleAddProperty = () => {
    handleClose();
    setAddModalOpen(true);
    setAddError(null);
    setAddName('');
    setAddDomain('');
    setAddProductType('other');
  };

  const handleAddSubmit = async () => {
    setAddError(null);
    const name = addName.trim();
    const domain = addDomain.trim();
    if (name.length < 2 || name.length > 128) {
      setAddError('Name must be 2–128 characters');
      return;
    }
    if (!domain) {
      setAddError('Domain is required');
      return;
    }
    if (/\s/.test(domain)) {
      setAddError('Use domain only, e.g. 650.dog');
      return;
    }
    setAddSubmitting(true);
    const { data, error: err, status } = await createConsumerProperty({
      name,
      domain,
      product_type: addProductType,
    });
    setAddSubmitting(false);
    if (err) {
      setAddError(status === 409 ? 'That domain already exists.' : err);
      return;
    }
    if (data) {
      setAddModalOpen(false);
      await refreshProperties();
      setActivePropertyId(data.id);
      // Toast could be added via a global snackbar; spec says "Property created"
    }
  };

  return (
    <>
      <ButtonBase
        onClick={handleOpen}
        aria-haspopup="listbox"
        aria-expanded={open ? 'true' : 'false'}
        disabled={loading}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          width: '100%',
          px: 1.5,
          py: 1.25,
          borderRadius: 1,
          border: '1px solid var(--mui-palette-neutral-700)',
          bgcolor: 'var(--mui-palette-neutral-900)',
          color: 'var(--mui-palette-neutral-200)',
          textAlign: 'left',
          '&:hover': {
            bgcolor: 'rgba(255,255,255,0.06)',
            borderColor: 'var(--mui-palette-neutral-600)',
          },
        }}
      >
        {loading ? (
          <CircularProgress size={18} sx={{ color: 'var(--mui-palette-neutral-400)' }} />
        ) : (
          <GlobeIcon size={18} style={{ color: 'var(--mui-palette-neutral-400)', flexShrink: 0 }} />
        )}
        <Typography sx={{ flex: 1, fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {error ? 'Error loading' : activeProperty?.name ?? (properties.length === 0 ? 'No properties' : 'Select property')}
        </Typography>
        <CaretDownIcon size={16} style={{ color: 'var(--mui-palette-neutral-400)', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </ButtonBase>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1.5,
              minWidth: 260,
              maxWidth: 320,
              maxHeight: 360,
              bgcolor: 'var(--mui-palette-neutral-900)',
              border: '1px solid var(--mui-palette-neutral-700)',
              borderRadius: 1.5,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            },
          },
        }}
        MenuListProps={{ sx: { py: 0 } }}
      >
        <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid var(--mui-palette-neutral-700)' }}>
          <InputBase
            placeholder="Search property"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startAdornment={<MagnifyingGlassIcon size={18} style={{ marginRight: 8, color: 'var(--mui-palette-neutral-500)' }} />}
            sx={{
              fontSize: '0.875rem',
              color: 'var(--mui-palette-neutral-200)',
              width: '100%',
              '& input::placeholder': { color: 'var(--mui-palette-neutral-500)' },
            }}
          />
        </Box>
        <Box sx={{ maxHeight: 240, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <Typography sx={{ px: 2, py: 2, color: 'var(--mui-palette-neutral-500)', fontSize: '0.875rem' }}>
              No properties match
            </Typography>
          ) : (
            filtered.map((property) => (
              <MenuItem
                key={property.id}
                onClick={() => handleSelect(property.id)}
                selected={activeProperty?.id === property.id}
                sx={{
                  color: 'var(--mui-palette-neutral-200)',
                  fontSize: '0.875rem',
                  py: 1.25,
                  '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.08)', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' } },
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <GlobeIcon size={18} style={{ color: 'var(--mui-palette-neutral-400)' }} />
                </ListItemIcon>
                <ListItemText primary={property.name} primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} />
              </MenuItem>
            ))
          )}
        </Box>
        <Box sx={{ borderTop: '1px solid var(--mui-palette-neutral-700)', py: 0.5 }}>
          <MenuItem
            onClick={handleAddProperty}
            sx={{
              color: 'var(--mui-palette-primary-main)',
              fontSize: '0.875rem',
              py: 1.25,
              '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.12)' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <PlusIcon size={18} style={{ color: 'var(--mui-palette-primary-main)' }} />
            </ListItemIcon>
            <ListItemText primary="Add property" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} />
          </MenuItem>
        </Box>
      </Menu>

      <Dialog open={addModalOpen} onClose={() => !addSubmitting && setAddModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Property</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            placeholder="e.g. GroupText"
            helperText="2–128 characters"
            error={!!(addError && addError.includes('Name'))}
          />
          <TextField
            label="Domain"
            fullWidth
            margin="normal"
            value={addDomain}
            onChange={(e) => setAddDomain(e.target.value)}
            placeholder="650.dog"
            helperText="Use domain only, e.g. 650.dog"
            error={!!(addError && (addError.includes('domain') || addError.includes('already')))}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Product Type</InputLabel>
            <Select
              value={addProductType}
              label="Product Type"
              onChange={(e) => setAddProductType(e.target.value)}
            >
              {PRODUCT_TYPES.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {addError ? (
            <Typography color="error" sx={{ mt: 1, fontSize: '0.875rem' }}>
              {addError}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddModalOpen(false)} disabled={addSubmitting}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleAddSubmit} disabled={addSubmitting}>
            {addSubmitting ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
