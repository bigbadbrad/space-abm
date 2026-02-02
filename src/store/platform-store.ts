'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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
  PortStatus,
} from '@/services/mockPlatform';
import { mockPlatform } from '@/services/mockPlatform';
import { scheduleReservation, modifyReservation, triggerPortAction, simulateTelemetry, checkFaultRules, type TelemetryPoint } from '@/services/mockApi';
import { aggregateUsage, evaluateSLA, type SLAEvaluation } from '@/services/usageAggregation';

export type UserRole = 'OPERATOR' | 'TENANT_ADMIN' | 'TENANT_OPERATOR' | 'TENANT_VIEWER';

interface PlatformState {
  // Data
  nodes: Node[];
  tenants: Tenant[];
  ports: Port[];
  reservations: Reservation[];
  activities: Activity[];
  incidents: Incident[];
  usageRecords: UsageRecord[];
  auditEvents: AuditEvent[];
  keys: Key[];
  invoices: Invoice[];
  telemetry: TelemetryPoint[];
  
  // UI State
  selectedWorkspace: string;
  selectedNode: string | null;
  incidentFlash: boolean;
  currentRole: UserRole;
  simulationMode: boolean;
  simulateOvertemp: boolean;
  
  // Actions
  initialize: () => void;
  setSelectedWorkspace: (workspace: string) => void;
  setSelectedNode: (nodeId: string | null) => void;
  setCurrentRole: (role: UserRole) => void;
  setSimulationMode: (enabled: boolean) => void;
  setSimulateOvertemp: (enabled: boolean) => void;
  updatePortStatus: (portId: string, status: PortStatus, reason: string, actorId: string) => void;
  scheduleReservation: (reservation: Omit<Reservation, 'id' | 'createdAt' | 'status'>) => { status: 'ACCEPTED' | 'REJECTED'; reason?: string; suggestions?: any[]; reservation?: Reservation };
  modifyReservation: (reservationId: string, updates: Partial<Omit<Reservation, 'id' | 'createdAt' | 'status'>>, actorId: string) => { status: 'ACCEPTED' | 'REJECTED'; reason?: string; suggestions?: any[]; reservation?: Reservation };
  cancelReservation: (reservationId: string, reason: string, actorId: string) => void;
  createIncident: (incident: Omit<Incident, 'id' | 'detectedAt'>) => Incident;
  acknowledgeIncident: (incidentId: string, actorId: string) => void;
  resolveIncident: (incidentId: string, actorId: string) => void;
  triggerPortAction: (portId: string, action: 'CUT_POWER' | 'MUTE_DATA' | 'RESTORE_POWER' | 'UNMUTE_DATA' | 'QUARANTINE' | 'UNQUARANTINE', reason: string, actorId: string) => void;
  createActivity: (activity: Omit<Activity, 'id'>) => Activity;
  generateTelemetry: () => void;
  refresh: () => void;
  generateInvoice: (tenantId: string, periodStart: string, periodEnd: string) => Invoice;
}

export const usePlatformStore = create<PlatformState>()(
  persist(
    (set, get) => ({
      nodes: [],
      tenants: [],
      ports: [],
      reservations: [],
      activities: [],
      incidents: [],
      usageRecords: [],
      auditEvents: [],
      keys: [],
      invoices: [],
      telemetry: [],
      selectedWorkspace: 'workspace-1',
      selectedNode: null,
      incidentFlash: false,
      currentRole: 'OPERATOR',
      simulationMode: false,
      simulateOvertemp: false,

      initialize: () => {
        const state = get();
        if (state.nodes.length === 0) {
          set({
            nodes: mockPlatform.getNodes(),
            tenants: mockPlatform.getTenants(),
            ports: mockPlatform.getPorts(),
            reservations: mockPlatform.getReservations(),
            activities: mockPlatform.getActivities(),
            incidents: mockPlatform.getIncidents(),
            usageRecords: mockPlatform.getUsageRecords(),
            auditEvents: mockPlatform.getAuditEvents(),
            keys: mockPlatform.getKeys(),
            invoices: mockPlatform.getInvoices(),
          });
        }
        
        // Always ensure we have seed reservations for demo (check after nodes are loaded)
        const seedReservationIds = ['res-seed-1', 'res-seed-2', 'res-seed-3'];
        const currentReservations = state.reservations || [];
        const hasSeedReservations = seedReservationIds.some(id => 
          currentReservations.some(r => r.id === id)
        );
        
        if (!hasSeedReservations) {
          // Get fresh seed reservations with current dates
          const freshSeedReservations = mockPlatform.getSeedReservations();
          const existingReservations = currentReservations.filter(r => 
            !seedReservationIds.includes(r.id)
          );
          set({
            reservations: [...existingReservations, ...freshSeedReservations],
          });
        }
        
        // Always ensure we have seed usage records for demo
        if (state.usageRecords.length === 0) {
          set({
            usageRecords: mockPlatform.getUsageRecords(),
          });
        }
      },

      setSelectedWorkspace: (workspace: string) => {
        set({ selectedWorkspace: workspace });
      },

      setSelectedNode: (nodeId: string | null) => {
        set({ selectedNode: nodeId });
        if (nodeId) {
          set({ ports: mockPlatform.getPorts({ nodeId }) });
        } else {
          set({ ports: mockPlatform.getPorts() });
        }
      },

      setCurrentRole: (role: UserRole) => {
        set({ currentRole: role });
      },

      setSimulationMode: (enabled: boolean) => {
        set({ simulationMode: enabled });
      },

      setSimulateOvertemp: (enabled: boolean) => {
        set({ simulateOvertemp: enabled });
        if (enabled) {
          // Force an overtemp on port-beta-1
          const port = mockPlatform.getPort('port-beta-1');
          if (port) {
            // Set temperature to 65C (above 60C threshold)
            port.temperature = 65;
            // Trigger the fault rule with complete telemetry point
            const telemetryPoint: TelemetryPoint = {
              timestamp: new Date().toISOString(),
              portId: 'port-beta-1',
              nodeId: 'node-beta',
              powerDraw: port.currentPowerDraw,
              temperature: 65,
              voltage: 28,
              current: port.currentPowerDraw / 28,
              dataRate: port.dataRate,
              dataErrorRate: 0.01,
              heartbeatStatus: 'OK',
            };
            const incidents = checkFaultRules([telemetryPoint]);
            if (incidents.length > 0) {
              get().refresh();
            }
          }
        } else {
          // Reset temperature when disabled
          const port = mockPlatform.getPort('port-beta-1');
          if (port && port.status === 'POWER_CUT') {
            port.temperature = 58; // Reset to previous value
            // Optionally restore power
            // mockPlatform.updatePortStatus('port-beta-1', 'ACTIVE', 'Overtemp simulation disabled', 'system');
          }
          get().refresh();
        }
      },

      updatePortStatus: (portId: string, status: PortStatus, reason: string, actorId: string) => {
        mockPlatform.updatePortStatus(portId, status, reason, actorId);
        get().refresh();
      },

      scheduleReservation: (reservation: Omit<Reservation, 'id' | 'createdAt' | 'status'>) => {
        const result = scheduleReservation(reservation);
        if (result.status === 'ACCEPTED' && result.reservation) {
          get().refresh();
        }
        return result;
      },

      modifyReservation: (reservationId: string, updates: Partial<Omit<Reservation, 'id' | 'createdAt' | 'status'>>, actorId: string) => {
        const result = modifyReservation(reservationId, updates, actorId);
        if (result.status === 'ACCEPTED' && result.reservation) {
          get().refresh();
        }
        return result;
      },

      cancelReservation: (reservationId: string, reason: string, actorId: string) => {
        mockPlatform.cancelReservation(reservationId, reason, actorId);
        get().refresh();
      },

      createIncident: (incident: Omit<Incident, 'id' | 'detectedAt'>) => {
        const newIncident = mockPlatform.createIncident(incident);
        get().refresh();
        set({ incidentFlash: true });
        setTimeout(() => set({ incidentFlash: false }), 2000);
        return newIncident;
      },

      acknowledgeIncident: (incidentId: string, actorId: string) => {
        mockPlatform.acknowledgeIncident(incidentId, actorId);
        get().refresh();
      },

      resolveIncident: (incidentId: string, actorId: string) => {
        mockPlatform.resolveIncident(incidentId, actorId);
        get().refresh();
      },

      triggerPortAction: (portId: string, action: 'CUT_POWER' | 'MUTE_DATA' | 'RESTORE_POWER' | 'UNMUTE_DATA' | 'QUARANTINE' | 'UNQUARANTINE', reason: string, actorId: string) => {
        triggerPortAction(portId, action, reason, actorId);
        get().refresh();
      },

      createActivity: (activity: Omit<Activity, 'id'>) => {
        const newActivity = mockPlatform.createActivity(activity);
        get().refresh();
        return newActivity;
      },

      generateTelemetry: () => {
        const simulateOvertemp = get().simulateOvertemp;
        const points = simulateTelemetry(simulateOvertemp);
        const newPoints = [...get().telemetry, ...points].slice(-1000); // Keep last 1000 points
        set({ telemetry: newPoints });

        // Run fault rules
        const incidents = checkFaultRules(points);
        if (incidents.length > 0) {
          get().refresh();
        }
      },

      refresh: () => {
        const state = get();
        const currentRole = state.currentRole;
        
        // RBAC filtering
        let filteredReservations = mockPlatform.getReservations();
        
        // Ensure seed reservations are present
        const seedReservationIds = ['res-seed-1', 'res-seed-2', 'res-seed-3'];
        const hasSeedReservations = seedReservationIds.some(id => 
          filteredReservations.some(r => r.id === id)
        );
        
        if (!hasSeedReservations) {
          // Add fresh seed reservations
          const freshSeedReservations = mockPlatform.getSeedReservations();
          filteredReservations = [...filteredReservations, ...freshSeedReservations];
        }
        
        let filteredIncidents = mockPlatform.getIncidents();
        let filteredAuditEvents = mockPlatform.getAuditEvents();
        let filteredInvoices = mockPlatform.getInvoices();
        
        // Get usage records (seed records are always in mockPlatform)
        let filteredUsageRecords = mockPlatform.getUsageRecords();
        
        // For tenant roles, filter to tenant's data (would need tenant context - using first tenant for demo)
        if (currentRole !== 'OPERATOR') {
          const tenantId = state.tenants[0]?.id; // In real app, get from auth context
          if (tenantId) {
            filteredReservations = filteredReservations.filter(r => r.tenantId === tenantId);
            filteredIncidents = filteredIncidents.filter(i => i.tenantId === tenantId);
            filteredAuditEvents = filteredAuditEvents.filter(a => a.tenantId === tenantId);
            filteredInvoices = filteredInvoices.filter(i => i.tenantId === tenantId);
            filteredUsageRecords = filteredUsageRecords.filter(u => u.tenantId === tenantId);
          }
        }
        
        set({
          nodes: mockPlatform.getNodes(),
          ports: state.selectedNode ? mockPlatform.getPorts({ nodeId: state.selectedNode }) : mockPlatform.getPorts(),
          reservations: filteredReservations,
          activities: mockPlatform.getActivities(),
          incidents: filteredIncidents,
          usageRecords: filteredUsageRecords,
          auditEvents: filteredAuditEvents,
          keys: mockPlatform.getKeys(),
          invoices: filteredInvoices,
        });
      },

      generateInvoice: (tenantId: string, periodStart: string, periodEnd: string) => {
        const tenant = mockPlatform.getTenant(tenantId);
        if (!tenant) throw new Error('Tenant not found');

        const reservations = mockPlatform.getReservations({
          tenantId,
          from: periodStart,
          to: periodEnd,
        });

        const usage = mockPlatform.getUsageRecords({
          tenantId,
          from: periodStart,
          to: periodEnd,
        });

        // Calculate totals
        const baseFee = 50000; // $50k base
        const totalEnergyWh = usage.reduce((sum, u) => sum + u.energyWhUsed, 0);
        const totalDownlinkGb = usage.reduce((sum, u) => sum + u.downlinkGb, 0);
        const overageEnergy = Math.max(0, totalEnergyWh - 10000); // 10kWh included
        const overageDownlink = Math.max(0, totalDownlinkGb - 100); // 100GB included

        const computeOverage = overageEnergy * 0.2 + overageDownlink * 20; // $0.20/Wh, $20/GB

        // SLA evaluation
        const slaEvaluation = evaluateSLA(tenantId, periodStart, periodEnd, 99.9);
        const slaCredit = -slaEvaluation.creditAmount;

        const invoice: Invoice = {
          id: `inv-${Date.now()}`,
          tenantId,
          invoicePeriodStart: periodStart,
          invoicePeriodEnd: periodEnd,
          lineItems: [
            { description: 'Base Platform Fee', amount: baseFee, quantity: 1, unit: 'monthly' },
            { description: 'Compute Overage', amount: computeOverage, quantity: 1, unit: 'overage' },
            { description: 'SLA Credit', amount: slaCredit, quantity: 1, unit: 'credit' },
          ],
          status: 'DRAFT',
          total: baseFee + computeOverage + slaCredit,
        };

        mockPlatform.addAuditEvent({
          actorType: 'SYSTEM',
          actorId: 'billing-system',
          workspaceId: 'workspace-1',
          tenantId,
          action: 'INVOICE_GENERATED',
          objectType: 'INVOICE',
          objectId: invoice.id,
          after: invoice,
        });

        get().refresh();
        return invoice;
      },
    }),
    {
      name: 'spacebilt-platform-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        nodes: state.nodes,
        tenants: state.tenants,
        ports: state.ports,
        reservations: state.reservations,
        incidents: state.incidents,
        auditEvents: state.auditEvents,
        telemetry: state.telemetry.slice(-500), // Only persist last 500 points
        currentRole: state.currentRole,
        selectedWorkspace: state.selectedWorkspace,
        selectedNode: state.selectedNode,
      }),
    }
  )
);
