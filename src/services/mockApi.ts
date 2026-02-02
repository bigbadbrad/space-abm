// Mock API Layer - Intercepts calls and updates the store with LocalStorage persistence

import type {
  Node,
  Port,
  Reservation,
  Incident,
  Tenant,
  Activity,
  UsageRecord,
  AuditEvent,
  Key,
  Invoice,
  PriorityTier,
  ReservationStatus,
  PortStatus,
} from './mockPlatform';
import { mockPlatform } from './mockPlatform';

export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
}

export interface TelemetryPoint {
  timestamp: string;
  portId: string;
  nodeId: string;
  powerDraw: number; // W
  temperature: number; // C
  voltage: number; // V
  current: number; // A
  dataRate: number; // Mbps
  dataErrorRate: number; // errors per second
  heartbeatStatus: 'OK' | 'MISSING' | 'STALE';
}

export interface ArbiterResult {
  status: 'ACCEPTED' | 'REJECTED';
  reason?: string;
  suggestions?: Array<{ startTime: string; endTime: string }>;
}

export interface AlternativeWindow {
  startTime: string;
  endTime: string;
  availablePower: number;
}

// LocalStorage Keys
const STORAGE_KEYS = {
  WORKSPACES: 'spacebilt_workspaces',
  NODES: 'spacebilt_nodes',
  PORTS: 'spacebilt_ports',
  TENANTS: 'spacebilt_tenants',
  RESERVATIONS: 'spacebilt_reservations',
  INCIDENTS: 'spacebilt_incidents',
  AUDIT_LOGS: 'spacebilt_audit_logs',
  TELEMETRY: 'spacebilt_telemetry',
  USAGE_RECORDS: 'spacebilt_usage_records',
  KEYS: 'spacebilt_keys',
  INVOICES: 'spacebilt_invoices',
} as const;

// Load from LocalStorage
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

// Save to LocalStorage
export function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

// Deterministic Arbiter Logic
export function runArbiter(
  newReservation: Omit<Reservation, 'id' | 'createdAt' | 'status'>,
  existingReservations: Reservation[],
  node: Node
): ArbiterResult {
  const { startTime, endTime, resourceBundle, priorityTier, portId } = newReservation;

  // Check if port is available (if specified)
  if (portId) {
    const port = mockPlatform.getPort(portId);
    if (!port || (port.status !== 'ACTIVE' && port.status !== 'AVAILABLE')) {
      return {
        status: 'REJECTED',
        reason: 'PORT_UNAVAILABLE',
        suggestions: generateAlternativeWindows(newReservation, existingReservations, node),
      };
    }
  }

  // Get overlapping reservations
  const overlapping = existingReservations.filter((r) => {
    if (r.status === 'CANCELLED' || r.status === 'COMPLETED' || r.status === 'REJECTED') return false;
    const rStart = new Date(r.startTime);
    const rEnd = new Date(r.endTime);
    const newStart = new Date(startTime);
    const newEnd = new Date(endTime);
    return (newStart < rEnd && newEnd > rStart);
  });

  // Calculate total power required during the window
  const totalPowerRequired = resourceBundle.powerAvgW;
  const totalPowerScheduled = overlapping.reduce((sum, r) => sum + r.resourceBundle.powerAvgW, 0);
  const availablePower = node.powerGenerationMax - totalPowerScheduled;

  // Check power capacity
  if (totalPowerRequired > availablePower) {
    // Check if we can preempt lower priority reservations
    const canPreempt = overlapping.some((r) => {
      const priorityOrder: Record<PriorityTier, number> = { P0: 4, P1: 3, P2: 2, P3: 1 };
      return priorityOrder[priorityTier] > priorityOrder[r.priorityTier] && r.preemptible;
    });

    if (!canPreempt) {
      return {
        status: 'REJECTED',
        reason: 'INSUFFICIENT_POWER',
        suggestions: generateAlternativeWindows(newReservation, existingReservations, node),
      };
    }
  }

  // Check thermal capacity
  const totalThermal = overlapping.reduce((sum, r) => sum + r.resourceBundle.thermalW, 0);
  if (totalThermal + resourceBundle.thermalW > node.thermalDissipationMax) {
    return {
      status: 'REJECTED',
      reason: 'THERMAL_LIMIT',
      suggestions: generateAlternativeWindows(newReservation, existingReservations, node),
    };
  }

  // Check downlink capacity
  const totalDownlink = overlapping.reduce((sum, r) => sum + r.resourceBundle.downlinkMbpsAvg, 0);
  if (totalDownlink + resourceBundle.downlinkMbpsAvg > node.downlinkCommittedMbps) {
    return {
      status: 'REJECTED',
      reason: 'DOWNLINK_CAP',
      suggestions: generateAlternativeWindows(newReservation, existingReservations, node),
    };
  }

  // Preempt lower priority reservations if needed
  overlapping.forEach((r) => {
    const priorityOrder: Record<PriorityTier, number> = { P0: 4, P1: 3, P2: 2, P3: 1 };
    if (
      priorityOrder[priorityTier] > priorityOrder[r.priorityTier] &&
      r.preemptible &&
      r.status === 'ACCEPTED'
    ) {
      mockPlatform.cancelReservation(r.id, `Preempted by ${priorityTier} reservation`, 'system');
    }
  });

  return { status: 'ACCEPTED' };
}

// Generate alternative time windows
function generateAlternativeWindows(
  reservation: Omit<Reservation, 'id' | 'createdAt' | 'status'>,
  existingReservations: Reservation[],
  node: Node
): AlternativeWindow[] {
  const suggestions: AlternativeWindow[] = [];
  const duration = new Date(reservation.endTime).getTime() - new Date(reservation.startTime).getTime();
  const now = new Date();

  // Suggest next 3 available windows (24h, 48h, 72h from now)
  for (let i = 1; i <= 3; i++) {
    const startTime = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + duration);

    // Check if this window has capacity
    const overlapping = existingReservations.filter((r) => {
      if (r.status === 'CANCELLED' || r.status === 'COMPLETED') return false;
      const rStart = new Date(r.startTime);
      const rEnd = new Date(r.endTime);
      return (startTime < rEnd && endTime > rStart);
    });

    const scheduledPower = overlapping.reduce((sum, r) => sum + r.resourceBundle.powerAvgW, 0);
    const availablePower = node.powerGenerationMax - scheduledPower;

    if (availablePower >= reservation.resourceBundle.powerAvgW) {
      suggestions.push({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        availablePower,
      });
    }
  }

  return suggestions;
}

// Schedule Reservation with Arbiter
export function scheduleReservation(
  reservation: Omit<Reservation, 'id' | 'createdAt' | 'status'>
): ArbiterResult & { reservation?: Reservation } {
  const node = mockPlatform.getNode(reservation.nodeId);
  if (!node) {
    return { status: 'REJECTED', reason: 'NODE_NOT_FOUND' };
  }

  const existingReservations = mockPlatform.getReservations({ nodeId: reservation.nodeId });
  const arbiterResult = runArbiter(reservation, existingReservations, node);

  if (arbiterResult.status === 'ACCEPTED') {
    const newReservation: Reservation = {
      ...reservation,
      id: `res-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'ACCEPTED',
      createdAt: new Date().toISOString(),
    };

    mockPlatform.createReservation(newReservation);
    return { ...arbiterResult, reservation: newReservation };
  }

  return arbiterResult;
}

// Modify Reservation with Arbiter (re-run arbiter on changes)
export function modifyReservation(
  reservationId: string,
  updates: Partial<Omit<Reservation, 'id' | 'createdAt' | 'status'>>,
  actorId: string
): ArbiterResult & { reservation?: Reservation } {
  const existingReservation = mockPlatform.getReservation(reservationId);
  if (!existingReservation) {
    return { status: 'REJECTED', reason: 'RESERVATION_NOT_FOUND' };
  }

  // Only allow modifications to ACCEPTED or REQUESTED reservations
  if (existingReservation.status !== 'ACCEPTED' && existingReservation.status !== 'REQUESTED') {
    return { status: 'REJECTED', reason: 'CANNOT_MODIFY_RESERVATION_IN_CURRENT_STATE' };
  }

  const updatedReservation: Omit<Reservation, 'id' | 'createdAt' | 'status'> = {
    tenantId: updates.tenantId ?? existingReservation.tenantId,
    nodeId: updates.nodeId ?? existingReservation.nodeId,
    portId: updates.portId ?? existingReservation.portId,
    startTime: updates.startTime ?? existingReservation.startTime,
    endTime: updates.endTime ?? existingReservation.endTime,
    resourceBundle: updates.resourceBundle ?? existingReservation.resourceBundle,
    priorityTier: updates.priorityTier ?? existingReservation.priorityTier,
    preemptible: updates.preemptible ?? existingReservation.preemptible,
    createdBy: existingReservation.createdBy,
  };

  const node = mockPlatform.getNode(updatedReservation.nodeId);
  if (!node) {
    return { status: 'REJECTED', reason: 'NODE_NOT_FOUND' };
  }

  // Get existing reservations excluding the one being modified
  const existingReservations = mockPlatform
    .getReservations({ nodeId: updatedReservation.nodeId })
    .filter((r) => r.id !== reservationId);

  const arbiterResult = runArbiter(updatedReservation, existingReservations, node);

  if (arbiterResult.status === 'ACCEPTED') {
    // Update the reservation
    const reservation = mockPlatform.getReservation(reservationId);
    if (reservation) {
      Object.assign(reservation, updatedReservation);
      
      // Create audit event
      mockPlatform.addAuditEvent({
        actorType: 'USER',
        actorId,
        workspaceId: 'workspace-1',
        nodeId: reservation.nodeId,
        portId: reservation.portId,
        tenantId: reservation.tenantId,
        action: 'RESERVATION_MODIFY',
        objectType: 'RESERVATION',
        objectId: reservationId,
        before: existingReservation,
        after: reservation,
        reason: 'Reservation modified',
      });
    }

    return { ...arbiterResult, reservation };
  }

  return arbiterResult;
}

// Trigger Port Action with Audit Log
export function triggerPortAction(
  portId: string,
  action: 'CUT_POWER' | 'MUTE_DATA' | 'RESTORE_POWER' | 'UNMUTE_DATA' | 'QUARANTINE' | 'UNQUARANTINE',
  reason: string,
  actorId: string
): void {
  const port = mockPlatform.getPort(portId);
  if (!port) return;

  let newStatus: PortStatus;
  switch (action) {
    case 'CUT_POWER':
      newStatus = 'POWER_CUT';
      break;
    case 'MUTE_DATA':
      newStatus = 'MUTED_DATA';
      break;
    case 'RESTORE_POWER':
      newStatus = port.tenantId ? 'ACTIVE' : 'AVAILABLE';
      break;
    case 'UNMUTE_DATA':
      newStatus = port.tenantId ? 'ACTIVE' : 'AVAILABLE';
      break;
    case 'QUARANTINE':
      newStatus = 'QUARANTINED';
      break;
    case 'UNQUARANTINE':
      newStatus = port.tenantId ? 'ACTIVE' : 'AVAILABLE';
      break;
    default:
      return;
  }

  const oldStatus = port.status;
  mockPlatform.updatePortStatus(portId, newStatus, reason, actorId);

  // Create audit log entry
  mockPlatform.addAuditEvent({
    actorType: 'USER',
    actorId,
    workspaceId: 'workspace-1',
    nodeId: port.nodeId,
    portId,
    tenantId: port.tenantId,
    action: `PORT_${action}`,
    objectType: 'PORT',
    objectId: portId,
    before: { status: oldStatus },
    after: { status: newStatus },
    reason,
  });
}

// Violation tracking for time-based rules
interface ViolationWindow {
  portId: string;
  ruleType: 'OVER_CURRENT' | 'OVER_TEMP' | 'DATA_ERROR';
  firstViolation: string; // ISO timestamp
  lastViolation: string; // ISO timestamp
}

// In-memory violation tracking (resets on page reload, but that's fine for demo)
const violationWindows = new Map<string, ViolationWindow>();

// Simulate Telemetry
export function simulateTelemetry(simulateOvertemp: boolean = false): TelemetryPoint[] {
  const ports = mockPlatform.getPorts({ status: 'ACTIVE' });
  const now = new Date();
  const points: TelemetryPoint[] = [];

  ports.forEach((port) => {
    // Add some realistic variation
    const powerVariation = (Math.random() - 0.5) * 20; // ±10W
    const tempVariation = (Math.random() - 0.5) * 5; // ±2.5°C
    
    // Simulate overtemp if toggle is on and this is port-beta-1
    let temperature = Math.max(20, port.temperature + tempVariation);
    if (simulateOvertemp && port.id === 'port-beta-1') {
      temperature = 65; // Force overtemp
    }

    // Generate realistic data error rate (normally low, occasionally spikes)
    const baseErrorRate = 0.01; // 0.01 errors/sec normally
    const errorSpike = Math.random() < 0.05 ? 10 : 0; // 5% chance of spike
    const dataErrorRate = baseErrorRate + errorSpike;

    // Heartbeat status (normally OK, occasionally missing)
    const heartbeatStatus: 'OK' | 'MISSING' | 'STALE' = 
      Math.random() < 0.98 ? 'OK' : 
      Math.random() < 0.5 ? 'MISSING' : 'STALE';

    points.push({
      timestamp: now.toISOString(),
      portId: port.id,
      nodeId: port.nodeId,
      powerDraw: Math.max(0, port.currentPowerDraw + powerVariation),
      temperature,
      voltage: 28 + (Math.random() - 0.5) * 0.5,
      current: (port.currentPowerDraw / 28) + (Math.random() - 0.5) * 0.2,
      dataRate: port.dataRate + (Math.random() - 0.5) * 5,
      dataErrorRate,
      heartbeatStatus,
    });
  });

  return points;
}

// Rules Engine - Check telemetry and trigger incidents with time-based windows
export function checkFaultRules(telemetryPoints: TelemetryPoint[]): Incident[] {
  const incidents: Incident[] = [];
  const ports = mockPlatform.getPorts();
  const now = Date.now();

  telemetryPoints.forEach((point) => {
    const port = ports.find((p) => p.id === point.portId);
    if (!port) return;

    const violationKey = (ruleType: string) => `${port.id}:${ruleType}`;

    // Rule 1: Over-current (Power > Cap for 30s) → THROTTLE
    if (point.powerDraw > port.powerBudgetPeak) {
      const key = violationKey('OVER_CURRENT');
      const existing = violationWindows.get(key);
      
      if (existing) {
        const duration = now - new Date(existing.firstViolation).getTime();
        if (duration >= 30000) { // 30 seconds
          const existingIncident = mockPlatform
            .getIncidents({ portId: port.id })
            .find((i) => i.trigger === 'RULE_OVER_CURRENT' && i.status === 'OPEN');

          if (!existingIncident) {
            // Set status to THROTTLED
            mockPlatform.updatePortStatus(port.id, 'THROTTLED', 'Over-current detected for 30s', 'system');
            
            // Create audit event
            mockPlatform.addAuditEvent({
              actorType: 'SYSTEM',
              actorId: 'rules-engine',
              workspaceId: 'workspace-1',
              nodeId: port.nodeId,
              portId: port.id,
              tenantId: port.tenantId,
              action: 'PORT_THROTTLED',
              objectType: 'PORT',
              objectId: port.id,
              before: { status: port.status },
              after: { status: 'THROTTLED' },
              reason: 'Over-current detected for 30s',
            });

            const incident = mockPlatform.createIncident({
              severity: 'SEV2',
              nodeId: port.nodeId,
              portIds: [port.id],
              tenantId: port.tenantId,
              trigger: 'RULE_OVER_CURRENT',
              autoActions: [`Port ${port.portNumber} throttled to ${port.powerBudget}W`],
              status: 'OPEN',
            });
            incidents.push(incident);
            markReservationsAtRisk(port.id);
            autoRescheduleLowPriority(port.id);
            violationWindows.delete(key);
          }
        } else {
          // Update last violation time
          existing.lastViolation = point.timestamp;
        }
      } else {
        // Start tracking violation
        violationWindows.set(key, {
          portId: port.id,
          ruleType: 'OVER_CURRENT',
          firstViolation: point.timestamp,
          lastViolation: point.timestamp,
        });
      }
    } else {
      // Clear violation if condition no longer met
      violationWindows.delete(violationKey('OVER_CURRENT'));
    }

    // Rule 2: Over-temperature (Temp > Max for 60s) → CUT_POWER
    const maxTemp = 60; // C
    if (point.temperature > maxTemp) {
      const key = violationKey('OVER_TEMP');
      const existing = violationWindows.get(key);
      
      // For simulateOvertemp, trigger immediately (bypass time window)
      const isSimulatedOvertemp = port.id === 'port-beta-1' && point.temperature >= 65;
      
      if (existing || isSimulatedOvertemp) {
        const duration = existing 
          ? now - new Date(existing.firstViolation).getTime()
          : 60001; // Force trigger for simulated overtemp
        
        if (duration >= 60000 || isSimulatedOvertemp) { // 60 seconds or simulated
          const existingIncident = mockPlatform
            .getIncidents({ portId: port.id })
            .find((i) => i.trigger === 'RULE_OVER_TEMP' && i.status === 'OPEN');

          if (!existingIncident) {
            // Set status to POWER_CUT
            mockPlatform.updatePortStatus(port.id, 'POWER_CUT', isSimulatedOvertemp 
              ? 'Over-temperature detected (simulated)' 
              : 'Over-temperature detected for 60s', 'system');
            
            // Create audit event
            mockPlatform.addAuditEvent({
              actorType: 'SYSTEM',
              actorId: 'rules-engine',
              workspaceId: 'workspace-1',
              nodeId: port.nodeId,
              portId: port.id,
              tenantId: port.tenantId,
              action: 'PORT_POWER_CUT',
              objectType: 'PORT',
              objectId: port.id,
              before: { status: port.status },
              after: { status: 'POWER_CUT' },
              reason: isSimulatedOvertemp 
                ? 'Over-temperature detected (simulated)' 
                : 'Over-temperature detected for 60s',
            });

            const incident = mockPlatform.createIncident({
              severity: 'SEV1',
              nodeId: port.nodeId,
              portIds: [port.id],
              tenantId: port.tenantId,
              trigger: 'RULE_OVER_TEMP',
              autoActions: [`Port ${port.portNumber} power cut due to over-temperature`],
              status: 'OPEN',
            });
            incidents.push(incident);
            markReservationsAtRisk(port.id);
            autoRescheduleLowPriority(port.id);
            violationWindows.delete(key);
          }
        } else if (existing) {
          existing.lastViolation = point.timestamp;
        }
      } else {
        violationWindows.set(key, {
          portId: port.id,
          ruleType: 'OVER_TEMP',
          firstViolation: point.timestamp,
          lastViolation: point.timestamp,
        });
      }
    } else {
      violationWindows.delete(violationKey('OVER_TEMP'));
    }

    // Rule 3: Data error rate high → MUTE_DATA
    const errorThreshold = 5; // errors per second
    if (point.dataErrorRate > errorThreshold) {
      const existingIncident = mockPlatform
        .getIncidents({ portId: port.id })
        .find((i) => i.trigger === 'RULE_DATA_ERROR' && i.status === 'OPEN');

      if (!existingIncident) {
        // Set status to MUTED_DATA
        mockPlatform.updatePortStatus(port.id, 'MUTED_DATA', `High data error rate: ${point.dataErrorRate.toFixed(2)} errors/sec`, 'system');
        
        // Create audit event
        mockPlatform.addAuditEvent({
          actorType: 'SYSTEM',
          actorId: 'rules-engine',
          workspaceId: 'workspace-1',
          nodeId: port.nodeId,
          portId: port.id,
          tenantId: port.tenantId,
          action: 'PORT_MUTED_DATA',
          objectType: 'PORT',
          objectId: port.id,
          before: { status: port.status },
          after: { status: 'MUTED_DATA' },
          reason: `High data error rate: ${point.dataErrorRate.toFixed(2)} errors/sec`,
        });

        const incident = mockPlatform.createIncident({
          severity: 'SEV2',
          nodeId: port.nodeId,
          portIds: [port.id],
          tenantId: port.tenantId,
          trigger: 'RULE_DATA_ERROR',
          autoActions: [`Port ${port.portNumber} data muted due to high error rate`],
          status: 'OPEN',
        });
        incidents.push(incident);
        markReservationsAtRisk(port.id);
      }
    }

    // Rule 4: Heartbeat missing → QUARANTINE
    if (point.heartbeatStatus === 'MISSING' || point.heartbeatStatus === 'STALE') {
      const existingIncident = mockPlatform
        .getIncidents({ portId: port.id })
        .find((i) => i.trigger === 'RULE_HEARTBEAT' && i.status === 'OPEN');

      if (!existingIncident) {
        // Set status to QUARANTINED
        mockPlatform.updatePortStatus(port.id, 'QUARANTINED', `Heartbeat ${point.heartbeatStatus.toLowerCase()}`, 'system');
        
        // Create audit event
        mockPlatform.addAuditEvent({
          actorType: 'SYSTEM',
          actorId: 'rules-engine',
          workspaceId: 'workspace-1',
          nodeId: port.nodeId,
          portId: port.id,
          tenantId: port.tenantId,
          action: 'PORT_QUARANTINED',
          objectType: 'PORT',
          objectId: port.id,
          before: { status: port.status },
          after: { status: 'QUARANTINED' },
          reason: `Heartbeat ${point.heartbeatStatus.toLowerCase()}`,
        });

        const incident = mockPlatform.createIncident({
          severity: 'SEV1',
          nodeId: port.nodeId,
          portIds: [port.id],
          tenantId: port.tenantId,
          trigger: 'RULE_HEARTBEAT',
          autoActions: [`Port ${port.portNumber} quarantined due to missing heartbeat`],
          status: 'OPEN',
        });
        incidents.push(incident);
        markReservationsAtRisk(port.id);
        autoRescheduleLowPriority(port.id);
      }
    }
  });

  return incidents;
}

// Mark reservations as AT_RISK when incidents occur
function markReservationsAtRisk(portId: string): void {
  const now = new Date();
  const reservations = mockPlatform.getReservations({ portId });
  
  reservations.forEach((reservation) => {
    const start = new Date(reservation.startTime);
    const end = new Date(reservation.endTime);
    
    // Only mark active or upcoming reservations that are not already at risk
    if (reservation.status !== 'AT_RISK' && (reservation.status === 'ACCEPTED' || reservation.status === 'IN_PROGRESS')) {
      if (now >= start && now <= end) {
        // Active reservation
        mockPlatform.updateReservationStatus(reservation.id, 'AT_RISK', 'Port incident detected', 'system');
      } else if (now < start) {
        // Upcoming reservation
        mockPlatform.updateReservationStatus(reservation.id, 'AT_RISK', 'Port incident detected', 'system');
      }
    }
  });
}

// Auto-reschedule P2/P3 reservations when incidents occur
function autoRescheduleLowPriority(portId: string): void {
  const now = new Date();
  const reservations = mockPlatform.getReservations({ portId });
  
  reservations.forEach((reservation) => {
    // Only auto-reschedule P2 and P3 reservations
    if ((reservation.priorityTier === 'P2' || reservation.priorityTier === 'P3') && 
        reservation.status === 'AT_RISK' &&
        reservation.preemptible) {
      
      const start = new Date(reservation.startTime);
      const end = new Date(reservation.endTime);
      const duration = end.getTime() - start.getTime();
      
      // Reschedule to 24 hours later
      const newStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const newEnd = new Date(newStart.getTime() + duration);
      
      // Cancel old reservation
      mockPlatform.cancelReservation(reservation.id, 'Auto-rescheduled due to port incident', 'system');
      
      // Create new reservation
      const newReservationData: Omit<Reservation, 'id' | 'createdAt'> = {
        tenantId: reservation.tenantId,
        nodeId: reservation.nodeId,
        portId: reservation.portId,
        startTime: newStart.toISOString(),
        endTime: newEnd.toISOString(),
        resourceBundle: reservation.resourceBundle,
        priorityTier: reservation.priorityTier,
        preemptible: reservation.preemptible,
        status: 'REQUESTED',
        createdBy: reservation.createdBy,
      };
      
      const result = mockPlatform.createReservation(newReservationData);
      
      if (result.success && result.reservation) {
        // Create audit event
        mockPlatform.addAuditEvent({
          actorType: 'SYSTEM',
          actorId: 'rules-engine',
          workspaceId: 'workspace-1',
          nodeId: reservation.nodeId,
          portId: reservation.portId,
          tenantId: reservation.tenantId,
          action: 'RESERVATION_AUTO_RESCHEDULED',
          objectType: 'RESERVATION',
          objectId: result.reservation.id,
          before: { reservationId: reservation.id, startTime: reservation.startTime, endTime: reservation.endTime },
          after: { reservationId: result.reservation.id, startTime: result.reservation.startTime, endTime: result.reservation.endTime },
          reason: 'Auto-rescheduled due to port incident',
        });
      }
    }
  });
}

