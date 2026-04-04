import type { Channel } from './types';

export function safeDivide(n: number, d: number): number | null {
  if (d === 0 || !Number.isFinite(n) || !Number.isFinite(d)) return null;
  return n / d;
}

export function roundMoney(n: number | null): number | null {
  if (n === null || !Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}

export function roundRate(n: number | null): number | null {
  if (n === null || !Number.isFinite(n)) return null;
  return Math.round(n * 10000) / 10000;
}

export function median(sorted: number[]): number | null {
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

export function percentile75(sorted: number[]): number | null {
  if (sorted.length === 0) return null;
  const idx = Math.ceil(0.75 * sorted.length) - 1;
  return sorted[Math.max(0, idx)]!;
}

export function daysBetweenUtc(aIso: string, bIso: string): number {
  const a = Date.parse(aIso);
  const b = Date.parse(bIso);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}

export function pctChange(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null;
  return (current - previous) / previous;
}

export function isGoogleClickId(lead: {
  gclid?: string | null;
  wbraid?: string | null;
  gbraid?: string | null;
}): boolean {
  return Boolean(lead.gclid || lead.wbraid || lead.gbraid);
}

export function isMetaClickId(lead: {
  fbclid?: string | null;
  fbp?: string | null;
  fbc?: string | null;
}): boolean {
  return Boolean(lead.fbclid || lead.fbp || lead.fbc);
}

export function leadHasAnyClickId(lead: {
  channel: Channel;
  gclid?: string | null;
  wbraid?: string | null;
  gbraid?: string | null;
  fbclid?: string | null;
  fbp?: string | null;
  fbc?: string | null;
}): boolean {
  if (lead.channel === 'google') return isGoogleClickId(lead);
  if (lead.channel === 'meta') return isMetaClickId(lead);
  return isGoogleClickId(lead) || isMetaClickId(lead);
}

export function isLeadAttributed(lead: {
  channel: Channel;
  utm_source?: string | null;
  utm_campaign?: string | null;
  gclid?: string | null;
  wbraid?: string | null;
  gbraid?: string | null;
  fbclid?: string | null;
  fbp?: string | null;
  fbc?: string | null;
}): boolean {
  if (leadHasAnyClickId(lead)) return true;
  if (lead.utm_source && lead.utm_campaign) return true;
  return false;
}
