// Usage Aggregation - Generate usage records from reservations and telemetry

import type { Reservation, UsageRecord } from './mockPlatform';
import { mockPlatform } from './mockPlatform';

// Aggregate usage from completed reservations, stored usage records, and telemetry
export function aggregateUsage(
  from: string,
  to: string,
  tenantId?: string
): UsageRecord[] {
  // First, get stored usage records (these are the source of truth)
  const storedRecords = mockPlatform.getUsageRecords({
    tenantId,
    from,
    to,
  });
  
  // If we have stored records, use them (they're already aggregated)
  if (storedRecords.length > 0) {
    return storedRecords;
  }
  
  // Otherwise, aggregate from reservations (fallback)
  const reservations = mockPlatform.getReservations({
    tenantId,
    from,
    to,
  }).filter(r => r.status === 'COMPLETED' || r.status === 'IN_PROGRESS');

  const usageMap = new Map<string, UsageRecord>();

  reservations.forEach((reservation) => {
    const start = new Date(reservation.startTime);
    const end = new Date(reservation.endTime);
    const durationMs = end.getTime() - start.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    const durationMinutes = durationMs / (1000 * 60);

    // Group by date
    const dateStr = start.toISOString().split('T')[0];
    
    if (!usageMap.has(dateStr)) {
      usageMap.set(dateStr, {
        id: `usage-${dateStr}-${reservation.tenantId}`,
        tenantId: reservation.tenantId,
        reservationId: reservation.id,
        date: dateStr,
        energyWhUsed: 0,
        avgPowerW: 0,
        peakPowerW: 0,
        thermalWAvg: 0,
        downlinkGb: 0,
        uplinkMb: 0,
        computeUnitSeconds: 0,
        pointingMinutesDelivered: 0,
        reservationMinutesRequested: durationMinutes,
        reservationMinutesDelivered: 0,
      });
    }

    const usage = usageMap.get(dateStr)!;
    
    // Calculate energy from power and duration
    const energyWh = reservation.resourceBundle.powerAvgW * durationHours;
    usage.energyWhUsed += energyWh;
    usage.avgPowerW = (usage.avgPowerW + reservation.resourceBundle.powerAvgW) / 2;
    usage.peakPowerW = Math.max(usage.peakPowerW, reservation.resourceBundle.powerPeakW);
    usage.thermalWAvg = (usage.thermalWAvg + reservation.resourceBundle.thermalW) / 2;
    usage.downlinkGb += reservation.resourceBundle.downlinkGbBudget;
    usage.computeUnitSeconds += reservation.resourceBundle.computeUnits * durationMs / 1000;
    usage.pointingMinutesDelivered += reservation.resourceBundle.pointingMinutes;
    
    // If reservation is completed, delivered = requested
    if (reservation.status === 'COMPLETED') {
      usage.reservationMinutesDelivered += durationMinutes;
    } else {
      // For in-progress, calculate partial delivery
      const now = new Date();
      if (now >= start && now <= end) {
        const partialMs = now.getTime() - start.getTime();
        usage.reservationMinutesDelivered += partialMs / (1000 * 60);
      }
    }
  });

  // Note: Telemetry-based usage would be added here if we had access to telemetry store
  // For now, we aggregate from reservations only

  return Array.from(usageMap.values());
}

// SLA Evaluation - Calculate uptime and determine credits
export interface SLAEvaluation {
  tenantId: string;
  periodStart: string;
  periodEnd: string;
  promisedUptime: number; // e.g., 99.9
  actualUptime: number;
  downtimeMinutes: number;
  incidents: number;
  slaBreached: boolean;
  creditAmount: number; // in cents
}

export function evaluateSLA(
  tenantId: string,
  periodStart: string,
  periodEnd: string,
  promisedUptime: number = 99.9
): SLAEvaluation {
  const reservations = mockPlatform.getReservations({
    tenantId,
    from: periodStart,
    to: periodEnd,
  });

  const incidents = mockPlatform.getIncidents({
    status: 'OPEN',
  }).filter(i => i.tenantId === tenantId);

  // Calculate total reservation minutes
  let totalRequestedMinutes = 0;
  let totalDeliveredMinutes = 0;

  reservations.forEach((reservation) => {
    const start = new Date(reservation.startTime);
    const end = new Date(reservation.endTime);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    totalRequestedMinutes += durationMinutes;

    if (reservation.status === 'COMPLETED') {
      totalDeliveredMinutes += durationMinutes;
    } else if (reservation.status === 'IN_PROGRESS') {
      const now = new Date();
      if (now >= start && now <= end) {
        const partialMinutes = (now.getTime() - start.getTime()) / (1000 * 60);
        totalDeliveredMinutes += partialMinutes;
      }
    } else if (reservation.status === 'FAILED' || reservation.status === 'PREEMPTED') {
      // No delivery for failed/preempted
    } else if (reservation.status === 'AT_RISK') {
      // Partial delivery (estimate 50% for at-risk)
      totalDeliveredMinutes += durationMinutes * 0.5;
    }
  });

  // Calculate downtime from incidents
  let downtimeMinutes = 0;
  incidents.forEach((incident) => {
    // Estimate downtime based on severity
    const severityDowntime: Record<string, number> = {
      SEV0: 60, // 1 hour
      SEV1: 30, // 30 minutes
      SEV2: 15, // 15 minutes
      SEV3: 5,  // 5 minutes
    };
    downtimeMinutes += severityDowntime[incident.severity] || 15;
  });

  // Subtract downtime from delivered
  totalDeliveredMinutes = Math.max(0, totalDeliveredMinutes - downtimeMinutes);

  const actualUptime = totalRequestedMinutes > 0
    ? (totalDeliveredMinutes / totalRequestedMinutes) * 100
    : 100;

  const slaBreached = actualUptime < promisedUptime;

  // Calculate credit: 1% of base fee per 0.1% below SLA
  const baseFee = 50000; // $500 base monthly fee
  let creditAmount = 0;
  if (slaBreached) {
    const breachPercentage = promisedUptime - actualUptime;
    creditAmount = Math.round((breachPercentage / 0.1) * (baseFee * 0.01));
  }

  return {
    tenantId,
    periodStart,
    periodEnd,
    promisedUptime,
    actualUptime,
    downtimeMinutes,
    incidents: incidents.length,
    slaBreached,
    creditAmount,
  };
}

