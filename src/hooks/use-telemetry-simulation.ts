'use client';

import { useEffect, useRef } from 'react';
import { usePlatformStore } from '@/store/platform-store';

export function useTelemetrySimulation(enabled: boolean = true) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const generateTelemetry = usePlatformStore((state) => state.generateTelemetry);
  const simulationMode = usePlatformStore((state) => state.simulationMode);

  useEffect(() => {
    if (enabled && simulationMode) {
      // Generate telemetry every 5 seconds
      intervalRef.current = setInterval(() => {
        generateTelemetry();
      }, 5000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [enabled, simulationMode, generateTelemetry]);
}

