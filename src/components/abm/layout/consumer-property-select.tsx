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
import { CaretDown as CaretDownIcon } from '@phosphor-icons/react/dist/ssr/CaretDown';
import { Globe as GlobeIcon } from '@phosphor-icons/react/dist/ssr/Globe';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';

// Placeholder until backend is wired; will list configured properties
const MOCK_PROPERTIES = [
  { id: '1', name: 'ranch.dog', domain: 'ranch.dog' },
  { id: '2', name: '650.dog', domain: '650.dog' },
];

export function ConsumerPropertySelect(): React.JSX.Element {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selected, setSelected] = React.useState<{ id: string; name: string; domain: string } | null>(MOCK_PROPERTIES[0] ?? null);
  const [search, setSearch] = React.useState('');
  const open = Boolean(anchorEl);

  const filtered = React.useMemo(() => {
    if (!search.trim()) return MOCK_PROPERTIES;
    const q = search.trim().toLowerCase();
    return MOCK_PROPERTIES.filter((p) => p.name.toLowerCase().includes(q) || p.domain.toLowerCase().includes(q));
  }, [search]);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
    setSearch('');
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (property: { id: string; name: string; domain: string }) => {
    setSelected(property);
    handleClose();
  };

  const handleAddProperty = () => {
    handleClose();
    // TODO: wire to add-property flow when backend is ready
  };

  return (
    <>
      <ButtonBase
        onClick={handleOpen}
        aria-haspopup="listbox"
        aria-expanded={open ? 'true' : 'false'}
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
        <GlobeIcon size={18} style={{ color: 'var(--mui-palette-neutral-400)', flexShrink: 0 }} />
        <Typography sx={{ flex: 1, fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected?.name ?? 'Select property'}
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
                onClick={() => handleSelect(property)}
                selected={selected?.id === property.id}
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
    </>
  );
}
