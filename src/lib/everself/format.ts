/** US-style integer grouping, e.g. 134850 → "134,850". */
export function fmtInt(n: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
}
