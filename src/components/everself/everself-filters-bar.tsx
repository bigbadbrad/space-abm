'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

import { everselfFieldSx } from '@/components/everself/everself-field-sx';

export type EverselfFiltersState = {
  start: Dayjs;
  end: Dayjs;
  /** `null` = all cities; otherwise exactly one city name. */
  city: string | null;
  channels: string[];
  campaign: string;
  bookingGroup: 'booked' | 'lead';
};

export function EverselfFiltersBar({
  value,
  onChange,
  availableCities,
  onApply,
}: {
  value: EverselfFiltersState;
  onChange: (next: EverselfFiltersState) => void;
  availableCities: string[];
  onApply: () => void;
}): React.JSX.Element {
  const cityOptions = React.useMemo(() => {
    const set = new Set(availableCities);
    if (value.city && !set.has(value.city)) {
      return [value.city, ...availableCities];
    }
    return availableCities;
  }, [availableCities, value.city]);

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 1,
        border: '1px solid #27272F',
        bgcolor: '#0A0A0A',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Typography sx={{ color: '#E5E7EB', fontSize: '0.8rem', fontWeight: 600 }}>Filters</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <DatePicker
          label="Start"
          value={value.start}
          onChange={(v) => v && onChange({ ...value, start: v.startOf('day') })}
          slotProps={{ textField: { size: 'small', sx: { ...everselfFieldSx, minWidth: 150 } } }}
        />
        <DatePicker
          label="End"
          value={value.end}
          onChange={(v) => v && onChange({ ...value, end: v.startOf('day') })}
          slotProps={{ textField: { size: 'small', sx: { ...everselfFieldSx, minWidth: 150 } } }}
        />
        <FormControl size="small" sx={{ minWidth: 220, ...everselfFieldSx }}>
          <InputLabel id="ev-cities-label">City</InputLabel>
          <Select<string>
            labelId="ev-cities-label"
            label="City"
            value={value.city ?? ''}
            onChange={(e) => {
              const v = e.target.value as string;
              onChange({ ...value, city: v === '' ? null : v });
            }}
          >
            <MenuItem value="">
              <em>All</em>
            </MenuItem>
            {cityOptions.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160, ...everselfFieldSx }}>
          <InputLabel id="ev-ch-label">Channels</InputLabel>
          <Select<string[]>
            labelId="ev-ch-label"
            multiple
            value={value.channels}
            onChange={(e) =>
              onChange({ ...value, channels: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })
            }
            input={<OutlinedInput label="Channels" />}
            renderValue={(sel) => (sel.length === 0 ? 'All' : sel.join(', '))}
          >
            <MenuItem value="google">google</MenuItem>
            <MenuItem value="meta">meta</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small"
          label="Campaign search"
          value={value.campaign}
          onChange={(e) => onChange({ ...value, campaign: e.target.value })}
          sx={{ minWidth: 200, ...everselfFieldSx }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', mr: 0.5 }}>Booking cohort</Typography>
          <ToggleButtonGroup
            size="small"
            value={value.bookingGroup}
            exclusive
            onChange={(_, v) => v && onChange({ ...value, bookingGroup: v })}
            sx={{
              '& .MuiToggleButton-root': {
                color: '#9CA3AF',
                borderColor: '#374151',
                textTransform: 'none',
                px: 1.25,
              },
              '& .Mui-selected': { bgcolor: '#1D4ED8 !important', color: '#F9FAFB !important' },
            }}
          >
            <ToggleButton value="booked">Booked date</ToggleButton>
            <ToggleButton value="lead">Lead date</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Button variant="contained" size="small" onClick={onApply} sx={{ textTransform: 'none' }}>
          Apply
        </Button>
      </Box>
    </Box>
  );
}

export function defaultEverselfFilters(): EverselfFiltersState {
  const end = dayjs().startOf('day');
  const start = end.subtract(29, 'day');
  return {
    start,
    end,
    city: null,
    channels: [],
    campaign: '',
    bookingGroup: 'booked',
  };
}
