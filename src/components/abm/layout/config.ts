import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export const abmNavItems: NavItemConfig[] = [
  { key: 'overview', title: 'Command Center', href: paths.abm.overview, icon: 'gauge' },
  { key: 'accounts', title: 'Accounts', href: paths.abm.accounts, icon: 'building-office', matcher: { type: 'startsWith', href: paths.abm.accounts } },
  { key: 'people', title: 'People', href: paths.abm.people, icon: 'users' },
  { key: 'lanes', title: 'Service Lanes', href: paths.abm.lanes, icon: 'columns' },
  { key: 'missions', title: 'Missions', href: paths.abm.missions, icon: 'rocket-launch', matcher: { type: 'startsWith', href: paths.abm.missions } },
  { key: 'lead-requests', title: 'Lead Requests', href: paths.abm.leadRequests, icon: 'file-text', matcher: { type: 'startsWith', href: paths.abm.leadRequests } },
  { key: 'activity', title: 'Activity', href: paths.abm.activity, icon: 'chart-line' },
  { key: 'admin', title: 'Admin', href: paths.abm.admin, icon: 'gear-six', adminOnly: true },
];

/** Converts lane keys like "hosted_payload" to user-friendly "hosted payload" */
export function formatLaneDisplayName(lane: string | null | undefined): string {
  if (!lane) return '—';
  return lane.replace(/_/g, ' ');
}

export const LANE_OPTIONS = [
  'All',
  'Launch',
  'Last-Mile Insertion (Post-Launch)',
  'Orbit Transfer (On-Orbit)',
  'Refuel',
  'Docking',
  'Upgrade',
  'Disposal',
  'Other',
];

export const STAGE_OPTIONS = ['All', 'Cold', 'Warm', 'Hot'];
export const SURGE_OPTIONS = ['All', 'Normal', 'Surging', 'Exploding'];
