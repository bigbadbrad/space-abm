import type { ControlStateV2 } from '@/lib/everself/everself-control-types';

export const EVERSELF_DEMO_CONTROL_STORAGE_KEY_V2 = 'everself_demo_control_state_v2';

export function defaultControlStateV2(): ControlStateV2 {
  const now = new Date().toISOString();
  return {
    last_updated_at: now,
    overrides: { campaigns: {}, city_budgets: {} },
    annotations: [],
    alert_rules: {
      budget_cut: { enabled: true, cooldown_days: 1 },
      bid_strategy: { enabled: true, cooldown_days: 1 },
      creative: { enabled: true, cooldown_days: 1 },
      structure: { enabled: true, cooldown_days: 1 },
      velocity: { enabled: true, cooldown_days: 1 },
    },
    change_log: [],
    demo_changes: [],
    acknowledged_alerts: {},
  };
}

export function readControlStateV2(): ControlStateV2 {
  if (typeof window === 'undefined') return defaultControlStateV2();
  try {
    const raw = window.localStorage.getItem(EVERSELF_DEMO_CONTROL_STORAGE_KEY_V2);
    if (!raw) return defaultControlStateV2();
    const p = JSON.parse(raw) as Partial<ControlStateV2>;
    const base = defaultControlStateV2();
    return {
      ...base,
      ...p,
      overrides: {
        campaigns: { ...base.overrides.campaigns, ...(p.overrides?.campaigns ?? {}) },
        city_budgets: { ...base.overrides.city_budgets, ...(p.overrides?.city_budgets ?? {}) },
      },
      annotations: Array.isArray(p.annotations) ? p.annotations : [],
      alert_rules: { ...base.alert_rules, ...(p.alert_rules ?? {}) },
      change_log: Array.isArray(p.change_log) ? p.change_log : [],
      demo_changes: Array.isArray(p.demo_changes) ? p.demo_changes : [],
      acknowledged_alerts: typeof p.acknowledged_alerts === 'object' && p.acknowledged_alerts ? p.acknowledged_alerts : {},
    };
  } catch {
    return defaultControlStateV2();
  }
}

export function writeControlStateV2(s: ControlStateV2): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(EVERSELF_DEMO_CONTROL_STORAGE_KEY_V2, JSON.stringify(s));
  window.dispatchEvent(new Event('everself-control-state'));
}

export function resetControlStateV2(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(EVERSELF_DEMO_CONTROL_STORAGE_KEY_V2);
  window.dispatchEvent(new Event('everself-control-state'));
}
