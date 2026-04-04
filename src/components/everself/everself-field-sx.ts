/** Shared MUI field styling for dark ConsumerGTM surfaces */
export const everselfFieldSx = {
  '& .MuiInputLabel-root': { color: '#9CA3AF' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#E5E7EB' },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#4B5563' },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#60A5FA' },
  '& .MuiInputBase-input': { color: '#E5E7EB' },
  '& .MuiSelect-select': { color: '#E5E7EB' },
} as const;
