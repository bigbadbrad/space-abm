'use client';

import * as React from 'react';

import {
  EVERSELF_DEMO_CONTROL_STORAGE_KEY_V2,
  defaultControlStateV2,
  readControlStateV2,
  writeControlStateV2,
} from '@/lib/everself/everself-demo-control-state';
import type { ControlStateV2 } from '@/lib/everself/everself-control-types';

export function useEverselfControlState(): [ControlStateV2, () => void, (next: ControlStateV2) => void] {
  const [state, setState] = React.useState<ControlStateV2>(defaultControlStateV2);

  const refresh = React.useCallback(() => {
    setState(readControlStateV2());
  }, []);

  const set = React.useCallback((next: ControlStateV2) => {
    writeControlStateV2(next);
    setState(next);
  }, []);

  React.useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === EVERSELF_DEMO_CONTROL_STORAGE_KEY_V2) refresh();
    };
    const onCustom = () => refresh();
    window.addEventListener('storage', onStorage);
    window.addEventListener('everself-control-state', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('everself-control-state', onCustom);
    };
  }, [refresh]);

  return [state, refresh, set];
}
