'use client';

import * as React from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';

import { useABMFilters } from '@/contexts/abm-filter-context';
import { LANE_OPTIONS, STAGE_OPTIONS, SURGE_OPTIONS } from './config';

export interface FiltersDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function FiltersDrawer({ open, onClose }: FiltersDrawerProps): React.JSX.Element {
  const { filters, applyFilters, resetFilters } = useABMFilters();
  const [range, setRange] = React.useState(filters.range);
  const [stage, setStage] = React.useState(filters.stage);
  const [surge, setSurge] = React.useState(filters.surge);
  const [lane, setLane] = React.useState(filters.lane);

  React.useEffect(() => {
    if (open) {
      setRange(filters.range);
      setStage(filters.stage);
      setSurge(filters.surge);
      setLane(filters.lane);
    }
  }, [open, filters]);

  const handleApply = () => {
    applyFilters({ range, stage, surge, lane });
    onClose();
  };

  const handleReset = () => {
    resetFilters();
    setRange('7d');
    setStage('All');
    setSurge('All');
    setLane('All');
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          bgcolor: '#0A0A0A',
          borderLeft: '1px solid #262626',
          width: { xs: '100%', sm: 320 },
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Typography sx={{ color: '#FFFFFF', fontSize: '1.125rem', fontWeight: 600, mb: 3 }}>Filters</Typography>
        <Stack spacing={3}>
          <Box>
            <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 500, mb: 1, textTransform: 'uppercase' }}>Date range</Typography>
            <ToggleButtonGroup value={range} exclusive onChange={(_, v) => v && setRange(v)} size="small" sx={{ display: 'flex' }}>
              <ToggleButton value="7d" sx={{ flex: 1, py: 1, fontSize: '0.8rem', color: '#9CA3AF', borderColor: '#262626', '&.Mui-selected': { bgcolor: 'primary.main', color: 'white' } }}>7d</ToggleButton>
              <ToggleButton value="30d" sx={{ flex: 1, py: 1, fontSize: '0.8rem', color: '#9CA3AF', borderColor: '#262626', '&.Mui-selected': { bgcolor: 'primary.main', color: 'white' } }}>30d</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <FormControl size="small" fullWidth>
            <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 500, mb: 1, textTransform: 'uppercase' }}>Stage</Typography>
            <Select value={stage} onChange={(e) => setStage(e.target.value)} displayEmpty sx={{ bgcolor: '#050505', border: '1px solid #262626', color: '#fff', fontSize: '0.875rem', '& .MuiSelect-select': { py: 1.5 } }}>
              {STAGE_OPTIONS.map((o) => (
                <MenuItem key={o} value={o} sx={{ fontSize: '0.875rem' }}>{o}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 500, mb: 1, textTransform: 'uppercase' }}>Surge</Typography>
            <Select value={surge} onChange={(e) => setSurge(e.target.value)} displayEmpty sx={{ bgcolor: '#050505', border: '1px solid #262626', color: '#fff', fontSize: '0.875rem', '& .MuiSelect-select': { py: 1.5 } }}>
              {SURGE_OPTIONS.map((o) => (
                <MenuItem key={o} value={o} sx={{ fontSize: '0.875rem' }}>{o}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 500, mb: 1, textTransform: 'uppercase' }}>Service lane</Typography>
            <Select value={lane} onChange={(e) => setLane(e.target.value)} displayEmpty sx={{ bgcolor: '#050505', border: '1px solid #262626', color: '#fff', fontSize: '0.875rem', '& .MuiSelect-select': { py: 1.5 } }}>
              {LANE_OPTIONS.map((o) => (
                <MenuItem key={o} value={o} sx={{ fontSize: '0.875rem' }}>{o}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button variant="outlined" size="medium" onClick={handleReset} sx={{ borderColor: '#262626', color: '#9CA3AF', '&:hover': { borderColor: '#525252', bgcolor: 'rgba(255,255,255,0.04)' } }}>Reset</Button>
            <Button variant="contained" size="medium" onClick={handleApply} sx={{ flex: 1 }}>Apply</Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
}
