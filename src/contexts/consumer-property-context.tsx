'use client';

import * as React from 'react';
import { getConsumerProperties, type ConsumerProperty } from '@/lib/consumer/client';

const STORAGE_KEY = 'consumer.activePropertyId';

export interface ConsumerPropertyContextValue {
  properties: ConsumerProperty[];
  activeProperty: ConsumerProperty | null;
  activePropertyId: string | null;
  setActivePropertyId: (id: string | null) => void;
  refreshProperties: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const ConsumerPropertyContext = React.createContext<ConsumerPropertyContextValue | undefined>(undefined);

export function ConsumerPropertyProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [properties, setProperties] = React.useState<ConsumerProperty[]>([]);
  const [activePropertyId, setActivePropertyIdState] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refreshProperties = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await getConsumerProperties();
    setLoading(false);
    if (err) {
      setError(err);
      setProperties([]);
      return;
    }
    setProperties(data ?? []);
  }, []);

  const setActivePropertyId = React.useCallback((id: string | null) => {
    setActivePropertyIdState(id);
    if (typeof window !== 'undefined') {
      if (id) window.localStorage.setItem(STORAGE_KEY, id);
      else window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error: err } = await getConsumerProperties();
      if (!mounted) return;
      setLoading(false);
      if (err) {
        setError(err);
        setProperties([]);
        return;
      }
      const list = data ?? [];
      setProperties(list);
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
      const found = stored && list.some((p) => p.id === stored);
      if (found) setActivePropertyIdState(stored);
      else if (list.length > 0) {
        setActivePropertyIdState(list[0].id);
        if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, list[0].id);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const activeProperty = React.useMemo(
    () => properties.find((p) => p.id === activePropertyId) ?? null,
    [properties, activePropertyId]
  );

  const value: ConsumerPropertyContextValue = {
    properties,
    activeProperty,
    activePropertyId,
    setActivePropertyId,
    refreshProperties,
    loading,
    error,
  };

  return (
    <ConsumerPropertyContext.Provider value={value}>
      {children}
    </ConsumerPropertyContext.Provider>
  );
}

export function useConsumerProperty(): ConsumerPropertyContextValue {
  const ctx = React.useContext(ConsumerPropertyContext);
  if (ctx === undefined) throw new Error('useConsumerProperty must be used within ConsumerPropertyProvider');
  return ctx;
}
