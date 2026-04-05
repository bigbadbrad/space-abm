'use client';

import * as React from 'react';

import {
  EVERSELF_DEMO_SYNC_STORAGE_KEY,
  readEverselfDemoSyncState,
  type EverselfDemoSyncState,
} from '@/lib/everself/everself-demo-sync';

/** Re-reads when localStorage changes (same tab custom event + other tabs storage). */
export function useEverselfDemoSyncState(): [EverselfDemoSyncState, () => void] {
  const [state, setState] = React.useState<EverselfDemoSyncState>({ generation: 0 });

  const refresh = React.useCallback(() => {
    setState(readEverselfDemoSyncState());
  }, []);

  React.useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === EVERSELF_DEMO_SYNC_STORAGE_KEY) refresh();
    };
    const onCustom = () => refresh();
    window.addEventListener('storage', onStorage);
    window.addEventListener('everself-demo-sync', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('everself-demo-sync', onCustom);
    };
  }, [refresh]);

  return [state, refresh];
}
