import type { AppointmentRow } from '@/lib/everself/types';

export const EVERSELF_DEMO_SYNC_STORAGE_KEY = 'everself_demo_sync_state_v1';

export type EverselfDemoSyncState = {
  /** 0 = never synced; 1 = first import applied; 2+ = no further data changes. */
  generation: number;
};

/** Deterministic rows appended on first sync (8 booked + 3 completed + 1 no_show + 2 bad). */
const DEMO_SYNC_NEW_APPOINTMENTS: AppointmentRow[] = [
  { appointment_id: 'appt_sync_001', lead_id: 'lead_029', city: 'Los Angeles', booked_at: '2026-04-01T10:00:00Z', status: 'booked', type: 'consult' },
  { appointment_id: 'appt_sync_002', lead_id: 'lead_030', city: 'Los Angeles', booked_at: '2026-04-01T11:00:00Z', status: 'booked', type: 'consult' },
  { appointment_id: 'appt_sync_003', lead_id: 'lead_031', city: 'Los Angeles', booked_at: '2026-04-01T12:00:00Z', status: 'booked', type: 'consult' },
  { appointment_id: 'appt_sync_004', lead_id: 'lead_032', city: 'Los Angeles', booked_at: '2026-04-02T10:00:00Z', status: 'booked', type: 'consult' },
  { appointment_id: 'appt_sync_005', lead_id: 'lead_033', city: 'Los Angeles', booked_at: '2026-04-02T11:00:00Z', status: 'booked', type: 'consult' },
  { appointment_id: 'appt_sync_006', lead_id: 'lead_034', city: 'Los Angeles', booked_at: '2026-04-02T12:00:00Z', status: 'booked', type: 'consult' },
  { appointment_id: 'appt_sync_007', lead_id: 'lead_035', city: 'Los Angeles', booked_at: '2026-04-03T09:00:00Z', status: 'booked', type: 'consult' },
  { appointment_id: 'appt_sync_008', lead_id: 'lead_036', city: 'Los Angeles', booked_at: '2026-04-03T10:00:00Z', status: 'booked', type: 'consult' },
  {
    appointment_id: 'appt_sync_009',
    lead_id: 'lead_037',
    city: 'Los Angeles',
    booked_at: '2026-03-28T10:00:00Z',
    status: 'completed',
    type: 'consult',
    completed_at: '2026-04-03T10:00:00Z',
  },
  {
    appointment_id: 'appt_sync_010',
    lead_id: 'lead_038',
    city: 'Los Angeles',
    booked_at: '2026-03-29T10:00:00Z',
    status: 'completed',
    type: 'consult',
    completed_at: '2026-04-03T14:00:00Z',
  },
  {
    appointment_id: 'appt_sync_011',
    lead_id: 'lead_039',
    city: 'Los Angeles',
    booked_at: '2026-03-30T10:00:00Z',
    status: 'completed',
    type: 'consult',
    completed_at: '2026-04-04T11:00:00Z',
  },
  { appointment_id: 'appt_sync_012', lead_id: 'lead_040', city: 'Los Angeles', booked_at: '2026-04-02T15:00:00Z', status: 'no_show', type: 'consult' },
  { appointment_id: 'appt_sync_bad_001', lead_id: '', city: 'Los Angeles', booked_at: '2026-04-03T12:00:00Z', status: 'booked', type: 'consult' },
  {
    appointment_id: 'appt_sync_bad_002',
    lead_id: 'lead_BAD999',
    city: 'Los Angeles',
    booked_at: '2026-04-03T13:00:00Z',
    status: 'booked',
    type: 'consult',
  },
];

export function readEverselfDemoSyncState(): EverselfDemoSyncState {
  if (typeof window === 'undefined') return { generation: 0 };
  try {
    const raw = window.localStorage.getItem(EVERSELF_DEMO_SYNC_STORAGE_KEY);
    if (!raw) return { generation: 0 };
    const p = JSON.parse(raw) as { generation?: number };
    return { generation: typeof p.generation === 'number' && p.generation >= 0 ? p.generation : 0 };
  } catch {
    return { generation: 0 };
  }
}

export function writeEverselfDemoSyncState(s: EverselfDemoSyncState): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(EVERSELF_DEMO_SYNC_STORAGE_KEY, JSON.stringify(s));
  window.dispatchEvent(new Event('everself-demo-sync'));
}

function applyFirstSyncToBase(base: AppointmentRow[]): AppointmentRow[] {
  const map = new Map(base.map((a) => [a.appointment_id, { ...a }]));
  for (const id of ['appt_0027', 'appt_0031']) {
    const row = map.get(id);
    if (row && row.status === 'booked') {
      row.status = 'completed';
      row.completed_at = '2026-04-04T18:00:00Z';
    }
  }
  const merged = Array.from(map.values());
  merged.push(...DEMO_SYNC_NEW_APPOINTMENTS);
  return merged;
}

/** After first successful sync, merges deterministic patch + new rows into the fixture list. */
export function mergeEverselfDemoAppointments(base: AppointmentRow[], state: EverselfDemoSyncState): AppointmentRow[] {
  if (state.generation < 1) return base;
  return applyFirstSyncToBase(base);
}

export type EverselfDemoSyncRunResult =
  | { kind: 'imported'; toast: string }
  | { kind: 'noop'; toast: string };

/** First run: apply generation 1 + imported toast. Second: bump to 2 + no updates. Later: noop only. */
export function runEverselfDemoSync(): EverselfDemoSyncRunResult {
  const s = readEverselfDemoSyncState();
  if (s.generation === 0) {
    writeEverselfDemoSyncState({ generation: 1 });
    return {
      kind: 'imported',
      toast: 'Imported 16 appointment updates · 2 failed (missing or unknown lead_id)',
    };
  }
  if (s.generation === 1) {
    writeEverselfDemoSyncState({ generation: 2 });
    return { kind: 'noop', toast: 'No new updates' };
  }
  return { kind: 'noop', toast: 'No new updates' };
}
