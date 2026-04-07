/** US-style integer grouping, e.g. 134850 → "134,850". */
export function fmtInt(n: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
}

/** Whole US dollars with grouping, e.g. $10,459 */
export function fmtUsd0(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `$${fmtInt(Math.round(n))}`;
}
