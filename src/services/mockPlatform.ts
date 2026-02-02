// Mock Platform Data Engine - Client-side state management for SpaceBilt Control Plane

export type NodeStatus = 'HEALTHY' | 'DEGRADED' | 'SAFE_MODE';
export type PortStatus = 'AVAILABLE' | 'RESERVED_FOR_INTEGRATION' | 'ACTIVE' | 'THROTTLED' | 'MUTED_DATA' | 'POWER_CUT' | 'QUARANTINED' | 'MAINTENANCE' | 'ISOLATED';
export type ReservationStatus = 'REQUESTED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'IN_PROGRESS' | 'COMPLETED' | 'PREEMPTED' | 'FAILED' | 'AT_RISK';
export type PriorityTier = 'P0' | 'P1' | 'P2' | 'P3';
export type ActivityType = 'COLLECT_SENSOR' | 'DOWNLINK' | 'UPLINK_COMMAND' | 'ONBOARD_PROCESS' | 'CALIBRATE' | 'HEALTH_CHECK' | 'SAFE_MODE_TEST';
export type ActivityStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'ABORTED';
export type IncidentSeverity = 'SEV0' | 'SEV1' | 'SEV2' | 'SEV3';
export type IncidentStatus = 'OPEN' | 'ACK' | 'MITIGATED' | 'RESOLVED' | 'POSTMORTEM_REQUIRED';

export interface Node {
  id: string;
  name: string;
  orbitRegime: 'LEO' | 'GEO' | 'MEO';
  status: NodeStatus;
  availablePorts: number;
  activeTenants: number;
  nextContactWindow?: string;
  lastHeartbeat: string;
  softwareVersion: string;
  powerGenerationMax: number; // W
  batteryCapacity: number; // Wh
  maxDischarge: number; // W
  thermalDissipationMax: number; // W
  downlinkCommittedMbps: number;
  downlinkDailyCapGB: number;
  pointingCapacityMinutes: number; // per orbit/day
  slewBudgetDeg: number; // per day
  computeCapacity: number; // abstract units
}

export interface Tenant {
  id: string;
  name: string;
  contractId?: string;
}

export interface Port {
  id: string;
  nodeId: string;
  portNumber: number;
  tenantId?: string;
  moduleId?: string;
  moduleName?: string;
  status: PortStatus;
  powerBudget: number; // W avg
  powerBudgetPeak: number; // W peak
  thermalBudget: number; // W
  dataBudget: number; // GB/day
  currentPowerDraw: number; // W
  temperature: number; // C
  dataRate: number; // Mbps
  lastFault?: string;
  isolationState: string;
}

export interface Reservation {
  id: string;
  tenantId: string;
  nodeId: string;
  portId?: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  resourceBundle: {
    powerAvgW: number;
    powerPeakW: number;
    energyWhBudget: number;
    thermalW: number;
    downlinkMbpsAvg: number;
    downlinkGbBudget: number;
    computeUnits: number;
    pointingMinutes: number;
  };
  priorityTier: PriorityTier;
  preemptible: boolean;
  status: ReservationStatus;
  reason?: string;
  createdBy: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  reservationId: string;
  type: ActivityType;
  parameters: Record<string, any>;
  status: ActivityStatus;
  telemetryPointers?: string[];
}

export interface Incident {
  id: string;
  severity: IncidentSeverity;
  nodeId: string;
  portIds: string[];
  tenantId?: string;
  trigger: string; // rule id or 'manual'
  detectedAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  autoActions: string[];
  status: IncidentStatus;
  notes?: string;
  attachments?: string[];
}

export interface UsageRecord {
  id: string;
  tenantId: string;
  reservationId?: string;
  date: string;
  energyWhUsed: number;
  avgPowerW: number;
  peakPowerW: number;
  thermalWAvg: number;
  downlinkGb: number;
  uplinkMb: number;
  computeUnitSeconds: number;
  pointingMinutesDelivered: number;
  reservationMinutesRequested: number;
  reservationMinutesDelivered: number;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actorType: 'USER' | 'SYSTEM';
  actorId: string;
  workspaceId: string;
  tenantId?: string;
  nodeId?: string;
  portId?: string;
  action: string;
  objectType: string;
  objectId: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface Key {
  id: string;
  tenantId: string;
  keyType: 'DATA_ENCRYPTION' | 'COMMAND_SIGNING' | 'DOWNLINK_TLS' | 'PAYLOAD_APP_SIGNING';
  fingerprint: string;
  createdAt: string;
  rotatedAt?: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  rotationPolicy?: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  invoicePeriodStart: string;
  invoicePeriodEnd: string;
  lineItems: Array<{
    description: string;
    amount: number;
    quantity?: number;
    unit?: string;
  }>;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'VOID';
  total: number;
}

// Seed Data
const seedNodes: Node[] = [
  {
    id: 'node-alpha',
    name: 'SB-Node-Alpha',
    orbitRegime: 'LEO',
    status: 'HEALTHY',
    availablePorts: 6,
    activeTenants: 2,
    nextContactWindow: new Date(Date.now() + 3600000).toISOString(),
    lastHeartbeat: new Date().toISOString(),
    softwareVersion: 'v2.1.3',
    powerGenerationMax: 5000,
    batteryCapacity: 10000,
    maxDischarge: 3000,
    thermalDissipationMax: 2000,
    downlinkCommittedMbps: 100,
    downlinkDailyCapGB: 1000,
    pointingCapacityMinutes: 120,
    slewBudgetDeg: 180,
    computeCapacity: 100,
  },
  {
    id: 'node-beta',
    name: 'SB-Node-Beta',
    orbitRegime: 'GEO',
    status: 'DEGRADED',
    availablePorts: 4,
    activeTenants: 1,
    nextContactWindow: new Date(Date.now() + 7200000).toISOString(),
    lastHeartbeat: new Date(Date.now() - 300000).toISOString(),
    softwareVersion: 'v2.0.8',
    powerGenerationMax: 4000,
    batteryCapacity: 8000,
    maxDischarge: 2500,
    thermalDissipationMax: 1500,
    downlinkCommittedMbps: 80,
    downlinkDailyCapGB: 800,
    pointingCapacityMinutes: 100,
    slewBudgetDeg: 150,
    computeCapacity: 80,
  },
];

const seedTenants: Tenant[] = [
  { id: 'tenant-a', name: 'Acme Corp', contractId: 'contract-a' },
  { id: 'tenant-b', name: 'Global Observer', contractId: 'contract-b' },
  { id: 'tenant-c', name: 'Gov-Secure', contractId: 'contract-c' },
];

const seedPorts: Port[] = [
  // Node Alpha ports
  { id: 'port-alpha-1', nodeId: 'node-alpha', portNumber: 1, tenantId: 'tenant-a', moduleId: 'mod-cam-1', moduleName: 'High-Res Camera', status: 'ACTIVE', powerBudget: 200, powerBudgetPeak: 300, thermalBudget: 150, dataBudget: 50, currentPowerDraw: 185, temperature: 45, dataRate: 25, isolationState: 'NORMAL' },
  { id: 'port-alpha-2', nodeId: 'node-alpha', portNumber: 2, tenantId: 'tenant-a', moduleId: 'mod-radio-1', moduleName: 'S-Band Radio', status: 'ACTIVE', powerBudget: 150, powerBudgetPeak: 200, thermalBudget: 100, dataBudget: 100, currentPowerDraw: 142, temperature: 38, dataRate: 50, isolationState: 'NORMAL' },
  { id: 'port-alpha-3', nodeId: 'node-alpha', portNumber: 3, tenantId: 'tenant-b', moduleId: 'mod-sensor-1', moduleName: 'Hyperspectral Sensor', status: 'ACTIVE', powerBudget: 300, powerBudgetPeak: 400, thermalBudget: 200, dataBudget: 75, currentPowerDraw: 275, temperature: 52, dataRate: 35, isolationState: 'NORMAL' },
  { id: 'port-alpha-4', nodeId: 'node-alpha', portNumber: 4, status: 'AVAILABLE', powerBudget: 0, powerBudgetPeak: 0, thermalBudget: 0, dataBudget: 0, currentPowerDraw: 0, temperature: 22, dataRate: 0, isolationState: 'NORMAL' },
  { id: 'port-alpha-5', nodeId: 'node-alpha', portNumber: 5, status: 'AVAILABLE', powerBudget: 0, powerBudgetPeak: 0, thermalBudget: 0, dataBudget: 0, currentPowerDraw: 0, temperature: 22, dataRate: 0, isolationState: 'NORMAL' },
  { id: 'port-alpha-6', nodeId: 'node-alpha', portNumber: 6, status: 'AVAILABLE', powerBudget: 0, powerBudgetPeak: 0, thermalBudget: 0, dataBudget: 0, currentPowerDraw: 0, temperature: 22, dataRate: 0, isolationState: 'NORMAL' },
  { id: 'port-alpha-7', nodeId: 'node-alpha', portNumber: 7, status: 'AVAILABLE', powerBudget: 0, powerBudgetPeak: 0, thermalBudget: 0, dataBudget: 0, currentPowerDraw: 0, temperature: 22, dataRate: 0, isolationState: 'NORMAL' },
  { id: 'port-alpha-8', nodeId: 'node-alpha', portNumber: 8, status: 'AVAILABLE', powerBudget: 0, powerBudgetPeak: 0, thermalBudget: 0, dataBudget: 0, currentPowerDraw: 0, temperature: 22, dataRate: 0, isolationState: 'NORMAL' },
  // Node Beta ports
  { id: 'port-beta-1', nodeId: 'node-beta', portNumber: 1, tenantId: 'tenant-c', moduleId: 'mod-secure-1', moduleName: 'Secure Comms Module', status: 'THROTTLED', powerBudget: 250, powerBudgetPeak: 350, thermalBudget: 180, dataBudget: 60, currentPowerDraw: 200, temperature: 58, dataRate: 30, lastFault: 'Over-temperature detected', isolationState: 'THROTTLED' },
  { id: 'port-beta-2', nodeId: 'node-beta', portNumber: 2, status: 'AVAILABLE', powerBudget: 0, powerBudgetPeak: 0, thermalBudget: 0, dataBudget: 0, currentPowerDraw: 0, temperature: 22, dataRate: 0, isolationState: 'NORMAL' },
  { id: 'port-beta-3', nodeId: 'node-beta', portNumber: 3, status: 'AVAILABLE', powerBudget: 0, powerBudgetPeak: 0, thermalBudget: 0, dataBudget: 0, currentPowerDraw: 0, temperature: 22, dataRate: 0, isolationState: 'NORMAL' },
  { id: 'port-beta-4', nodeId: 'node-beta', portNumber: 4, status: 'AVAILABLE', powerBudget: 0, powerBudgetPeak: 0, thermalBudget: 0, dataBudget: 0, currentPowerDraw: 0, temperature: 22, dataRate: 0, isolationState: 'NORMAL' },
  { id: 'port-beta-5', nodeId: 'node-beta', portNumber: 5, status: 'AVAILABLE', powerBudget: 0, powerBudgetPeak: 0, thermalBudget: 0, dataBudget: 0, currentPowerDraw: 0, temperature: 22, dataRate: 0, isolationState: 'NORMAL' },
  { id: 'port-beta-6', nodeId: 'node-beta', portNumber: 6, status: 'AVAILABLE', powerBudget: 0, powerBudgetPeak: 0, thermalBudget: 0, dataBudget: 0, currentPowerDraw: 0, temperature: 22, dataRate: 0, isolationState: 'NORMAL' },
  { id: 'port-beta-7', nodeId: 'node-beta', portNumber: 7, status: 'AVAILABLE', powerBudget: 0, powerBudgetPeak: 0, thermalBudget: 0, dataBudget: 0, currentPowerDraw: 0, temperature: 22, dataRate: 0, isolationState: 'NORMAL' },
  { id: 'port-beta-8', nodeId: 'node-beta', portNumber: 8, status: 'AVAILABLE', powerBudget: 0, powerBudgetPeak: 0, thermalBudget: 0, dataBudget: 0, currentPowerDraw: 0, temperature: 22, dataRate: 0, isolationState: 'NORMAL' },
];

// Seed Reservations - Always have at least 2 for demo
const seedReservations = (): Reservation[] => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  
  const dayAfter = new Date(now);
  dayAfter.setDate(dayAfter.getDate() + 2);
  dayAfter.setHours(14, 0, 0, 0);
  
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(9, 0, 0, 0);
  
  const nextWeekEnd = new Date(nextWeek);
  nextWeekEnd.setHours(17, 0, 0, 0);

  return [
    {
      id: 'res-seed-1',
      tenantId: 'tenant-a',
      nodeId: 'node-alpha',
      portId: 'port-alpha-4',
      startTime: tomorrow.toISOString(),
      endTime: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
      resourceBundle: {
        powerAvgW: 250,
        powerPeakW: 350,
        energyWhBudget: 500,
        thermalW: 125,
        downlinkMbpsAvg: 15,
        downlinkGbBudget: 10,
        computeUnits: 5,
        pointingMinutes: 30,
      },
      priorityTier: 'P1',
      preemptible: false,
      status: 'ACCEPTED',
      createdBy: 'operator-1',
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // Created yesterday
    },
    {
      id: 'res-seed-2',
      tenantId: 'tenant-b',
      nodeId: 'node-alpha',
      portId: 'port-alpha-5',
      startTime: dayAfter.toISOString(),
      endTime: new Date(dayAfter.getTime() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours later
      resourceBundle: {
        powerAvgW: 400,
        powerPeakW: 550,
        energyWhBudget: 1600,
        thermalW: 200,
        downlinkMbpsAvg: 25,
        downlinkGbBudget: 40,
        computeUnits: 10,
        pointingMinutes: 60,
      },
      priorityTier: 'P2',
      preemptible: true,
      status: 'ACCEPTED',
      createdBy: 'operator-1',
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(), // Created 12 hours ago
    },
    {
      id: 'res-seed-3',
      tenantId: 'tenant-c',
      nodeId: 'node-beta',
      portId: 'port-beta-2',
      startTime: nextWeek.toISOString(),
      endTime: nextWeekEnd.toISOString(),
      resourceBundle: {
        powerAvgW: 300,
        powerPeakW: 400,
        energyWhBudget: 2400,
        thermalW: 150,
        downlinkMbpsAvg: 20,
        downlinkGbBudget: 30,
        computeUnits: 8,
        pointingMinutes: 45,
      },
      priorityTier: 'P0',
      preemptible: false,
      status: 'ACCEPTED',
      createdBy: 'operator-1',
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // Created 3 days ago
    },
  ];
};

// Seed Usage Records - Demo data for the 3 tenants
const seedUsageRecords = (): UsageRecord[] => {
  const now = new Date();
  const records: UsageRecord[] = [];
  
  // Generate usage records for the last 30 days for each tenant
  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (29 - i));
    const dateStr = date.toISOString().split('T')[0];
    
    // Acme Corp - High usage tenant
    records.push({
      id: `usage-${dateStr}-tenant-a`,
      tenantId: 'tenant-a',
      date: dateStr,
      energyWhUsed: 800 + Math.random() * 200, // 800-1000 Wh
      avgPowerW: 250,
      peakPowerW: 350,
      thermalWAvg: 125,
      downlinkGb: 15 + Math.random() * 10, // 15-25 GB
      uplinkMb: 50 + Math.random() * 20,
      computeUnitSeconds: 50000 + Math.random() * 20000,
      pointingMinutesDelivered: 30 + Math.random() * 10,
      reservationMinutesRequested: 120,
      reservationMinutesDelivered: 118 + Math.random() * 2,
    });
    
    // Global Observer - Medium usage tenant
    records.push({
      id: `usage-${dateStr}-tenant-b`,
      tenantId: 'tenant-b',
      date: dateStr,
      energyWhUsed: 600 + Math.random() * 150, // 600-750 Wh
      avgPowerW: 200,
      peakPowerW: 280,
      thermalWAvg: 100,
      downlinkGb: 10 + Math.random() * 8, // 10-18 GB
      uplinkMb: 30 + Math.random() * 15,
      computeUnitSeconds: 35000 + Math.random() * 15000,
      pointingMinutesDelivered: 25 + Math.random() * 8,
      reservationMinutesRequested: 90,
      reservationMinutesDelivered: 88 + Math.random() * 2,
    });
    
    // Gov-Secure - Lower usage but critical
    records.push({
      id: `usage-${dateStr}-tenant-c`,
      tenantId: 'tenant-c',
      date: dateStr,
      energyWhUsed: 400 + Math.random() * 100, // 400-500 Wh
      avgPowerW: 150,
      peakPowerW: 220,
      thermalWAvg: 75,
      downlinkGb: 5 + Math.random() * 5, // 5-10 GB
      uplinkMb: 20 + Math.random() * 10,
      computeUnitSeconds: 20000 + Math.random() * 10000,
      pointingMinutesDelivered: 15 + Math.random() * 5,
      reservationMinutesRequested: 60,
      reservationMinutesDelivered: 59.5 + Math.random() * 0.5, // Slightly lower delivery for demo
    });
  }
  
  return records;
};

// Mock Platform Store (in-memory state)
class MockPlatformStore {
  private nodes: Node[] = [...seedNodes];
  private tenants: Tenant[] = [...seedTenants];
  private ports: Port[] = [...seedPorts];
  private reservations: Reservation[] = [...seedReservations()];
  private activities: Activity[] = [];
  private incidents: Incident[] = [];
  private usageRecords: UsageRecord[] = [...seedUsageRecords()];
  private auditEvents: AuditEvent[] = [];
  private keys: Key[] = [];
  private invoices: Invoice[] = [];
  private incidentFlash: boolean = false;

  // Getters
  getNodes(): Node[] {
    return [...this.nodes];
  }

  getNode(id: string): Node | undefined {
    return this.nodes.find(n => n.id === id);
  }

  getTenants(): Tenant[] {
    return [...this.tenants];
  }

  getTenant(id: string): Tenant | undefined {
    return this.tenants.find(t => t.id === id);
  }

  getPorts(filters?: { nodeId?: string; tenantId?: string; status?: PortStatus }): Port[] {
    let result = [...this.ports];
    if (filters?.nodeId) {
      result = result.filter(p => p.nodeId === filters.nodeId);
    }
    if (filters?.tenantId) {
      result = result.filter(p => p.tenantId === filters.tenantId);
    }
    if (filters?.status) {
      result = result.filter(p => p.status === filters.status);
    }
    return result;
  }

  getPort(id: string): Port | undefined {
    return this.ports.find(p => p.id === id);
  }

  getReservation(reservationId: string): Reservation | undefined {
    return this.reservations.find(r => r.id === reservationId);
  }

  getSeedReservations(): Reservation[] {
    // Always return fresh seed reservations with current dates
    return seedReservations();
  }

  getReservations(filters?: { tenantId?: string; nodeId?: string; portId?: string; from?: string; to?: string; status?: ReservationStatus }): Reservation[] {
    let result = [...this.reservations];
    if (filters?.tenantId) {
      result = result.filter(r => r.tenantId === filters.tenantId);
    }
    if (filters?.nodeId) {
      result = result.filter(r => r.nodeId === filters.nodeId);
    }
    if (filters?.portId) {
      result = result.filter(r => r.portId === filters.portId);
    }
    if (filters?.from) {
      result = result.filter(r => r.startTime >= filters.from!);
    }
    if (filters?.to) {
      result = result.filter(r => r.endTime <= filters.to!);
    }
    if (filters?.status) {
      result = result.filter(r => r.status === filters.status);
    }
    return result;
  }

  getActivities(reservationId?: string): Activity[] {
    if (reservationId) {
      return this.activities.filter(a => a.reservationId === reservationId);
    }
    return [...this.activities];
  }

  getIncidents(filters?: { nodeId?: string; portId?: string; status?: IncidentStatus }): Incident[] {
    let result = [...this.incidents];
    if (filters?.nodeId) {
      result = result.filter(i => i.nodeId === filters.nodeId);
    }
    if (filters?.portId) {
      result = result.filter(i => i.portIds.includes(filters.portId!));
    }
    if (filters?.status) {
      result = result.filter(i => i.status === filters.status);
    }
    return result;
  }

  getUsageRecords(filters?: { tenantId?: string; from?: string; to?: string }): UsageRecord[] {
    let result = [...this.usageRecords];
    if (filters?.tenantId) {
      result = result.filter(u => u.tenantId === filters.tenantId);
    }
    if (filters?.from) {
      result = result.filter(u => u.date >= filters.from!);
    }
    if (filters?.to) {
      result = result.filter(u => u.date <= filters.to!);
    }
    return result;
  }

  getAuditEvents(filters?: { tenantId?: string; nodeId?: string; portId?: string; action?: string; from?: string; to?: string }): AuditEvent[] {
    let result = [...this.auditEvents];
    if (filters?.tenantId) {
      result = result.filter(a => a.tenantId === filters.tenantId);
    }
    if (filters?.nodeId) {
      result = result.filter(a => a.nodeId === filters.nodeId);
    }
    if (filters?.portId) {
      result = result.filter(a => a.portId === filters.portId);
    }
    if (filters?.action) {
      result = result.filter(a => a.action === filters.action);
    }
    if (filters?.from) {
      result = result.filter(a => a.timestamp >= filters.from!);
    }
    if (filters?.to) {
      result = result.filter(a => a.timestamp <= filters.to!);
    }
    return result;
  }

  getKeys(tenantId?: string): Key[] {
    if (tenantId) {
      return this.keys.filter(k => k.tenantId === tenantId);
    }
    return [...this.keys];
  }

  getInvoices(tenantId?: string): Invoice[] {
    if (tenantId) {
      return this.invoices.filter(i => i.tenantId === tenantId);
    }
    return [...this.invoices];
  }

  getIncidentFlash(): boolean {
    return this.incidentFlash;
  }

  // Actions
  updateNodeStatus(nodeId: string, status: NodeStatus, reason: string, actorId: string): void {
    const node = this.nodes.find(n => n.id === nodeId);
    if (node) {
      const oldStatus = node.status;
      node.status = status;
      this.addAuditEvent({
        actorType: 'USER',
        actorId,
        workspaceId: 'workspace-1',
        nodeId,
        action: 'NODE_STATUS_CHANGE',
        objectType: 'NODE',
        objectId: nodeId,
        before: { status: oldStatus },
        after: { status },
        reason,
      });
    }
  }

  updatePortStatus(portId: string, status: PortStatus, reason: string, actorId: string): void {
    const port = this.ports.find(p => p.id === portId);
    if (port) {
      const oldStatus = port.status;
      port.status = status;
      if (status === 'POWER_CUT' || status === 'ISOLATED') {
        port.isolationState = 'ISOLATED';
        port.currentPowerDraw = 0;
      } else if (status === 'MUTED_DATA') {
        port.dataRate = 0;
      }
      this.addAuditEvent({
        actorType: 'USER',
        actorId,
        workspaceId: 'workspace-1',
        nodeId: port.nodeId,
        portId,
        tenantId: port.tenantId,
        action: 'PORT_STATUS_CHANGE',
        objectType: 'PORT',
        objectId: portId,
        before: { status: oldStatus },
        after: { status },
        reason,
      });
    }
  }

  createReservation(reservation: Omit<Reservation, 'id' | 'createdAt'>): { success: boolean; reservation?: Reservation; reason?: string } {
    // Arbiter logic
    const node = this.getNode(reservation.nodeId);
    if (!node) {
      return { success: false, reason: 'NODE_NOT_FOUND' };
    }

    // Check power capacity
    const totalPowerRequested = reservation.resourceBundle.powerAvgW;
    if (totalPowerRequested > 5000) {
      return { success: false, reason: 'INSUFFICIENT_POWER' };
    }

    // Check if port is available (if specified)
    if (reservation.portId) {
      const port = this.getPort(reservation.portId);
      if (!port || port.status !== 'ACTIVE') {
        return { success: false, reason: 'PORT_UNAVAILABLE' };
      }
    }

    const newReservation: Reservation = {
      ...reservation,
      id: `res-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'ACCEPTED',
    };

    this.reservations.push(newReservation);
    this.addAuditEvent({
      actorType: 'USER',
      actorId: reservation.createdBy,
      workspaceId: 'workspace-1',
      nodeId: reservation.nodeId,
      portId: reservation.portId,
      tenantId: reservation.tenantId,
      action: 'RESERVATION_CREATE',
      objectType: 'RESERVATION',
      objectId: newReservation.id,
      after: newReservation,
    });

    return { success: true, reservation: newReservation };
  }

  cancelReservation(reservationId: string, reason: string, actorId: string): void {
    const reservation = this.reservations.find(r => r.id === reservationId);
    if (reservation) {
      reservation.status = 'CANCELLED';
      this.addAuditEvent({
        actorType: 'USER',
        actorId,
        workspaceId: 'workspace-1',
        nodeId: reservation.nodeId,
        tenantId: reservation.tenantId,
        action: 'RESERVATION_CANCEL',
        objectType: 'RESERVATION',
        objectId: reservationId,
        reason,
      });
    }
  }

  updateReservationStatus(reservationId: string, status: ReservationStatus, reason: string, actorId: string): void {
    const reservation = this.reservations.find(r => r.id === reservationId);
    if (reservation) {
      const oldStatus = reservation.status;
      reservation.status = status;
      reservation.reason = reason;
      this.addAuditEvent({
        actorType: actorId === 'system' ? 'SYSTEM' : 'USER',
        actorId,
        workspaceId: 'workspace-1',
        nodeId: reservation.nodeId,
        portId: reservation.portId,
        tenantId: reservation.tenantId,
        action: 'RESERVATION_STATUS_CHANGE',
        objectType: 'RESERVATION',
        objectId: reservationId,
        before: { status: oldStatus },
        after: { status },
        reason,
      });
    }
  }

  createActivity(activity: Omit<Activity, 'id'>): Activity {
    const newActivity: Activity = {
      ...activity,
      id: `act-${Date.now()}`,
    };
    this.activities.push(newActivity);
    return newActivity;
  }

  createIncident(incident: Omit<Incident, 'id' | 'detectedAt'>): Incident {
    const newIncident: Incident = {
      ...incident,
      id: `inc-${Date.now()}`,
      detectedAt: new Date().toISOString(),
    };
    this.incidents.push(newIncident);
    this.incidentFlash = true;
    setTimeout(() => {
      this.incidentFlash = false;
    }, 2000);
    return newIncident;
  }

  acknowledgeIncident(incidentId: string, actorId: string): void {
    const incident = this.incidents.find(i => i.id === incidentId);
    if (incident && incident.status === 'OPEN') {
      incident.status = 'ACK';
      incident.acknowledgedAt = new Date().toISOString();
      this.addAuditEvent({
        actorType: 'USER',
        actorId,
        workspaceId: 'workspace-1',
        nodeId: incident.nodeId,
        portId: incident.portIds[0],
        tenantId: incident.tenantId,
        action: 'INCIDENT_ACK',
        objectType: 'INCIDENT',
        objectId: incidentId,
      });
    }
  }

  resolveIncident(incidentId: string, actorId: string): void {
    const incident = this.incidents.find(i => i.id === incidentId);
    if (incident) {
      incident.status = 'RESOLVED';
      incident.resolvedAt = new Date().toISOString();
      this.addAuditEvent({
        actorType: 'USER',
        actorId,
        workspaceId: 'workspace-1',
        nodeId: incident.nodeId,
        portId: incident.portIds[0],
        tenantId: incident.tenantId,
        action: 'INCIDENT_RESOLVE',
        objectType: 'INCIDENT',
        objectId: incidentId,
      });
    }
  }

  addAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): void {
    const newEvent: AuditEvent = {
      ...event,
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditEvents.push(newEvent);
  }

  createKey(key: Omit<Key, 'id' | 'createdAt'>): Key {
    const newKey: Key = {
      ...key,
      id: `key-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.keys.push(newKey);
    this.addAuditEvent({
      actorType: 'USER',
      actorId: 'system',
      workspaceId: 'workspace-1',
      tenantId: key.tenantId,
      action: 'KEY_CREATE',
      objectType: 'KEY',
      objectId: newKey.id,
      after: newKey,
    });
    return newKey;
  }

  // Simulate telemetry stream
  generateTelemetryEvent(portId: string): Record<string, any> {
    const port = this.getPort(portId);
    if (!port) return {};
    return {
      timestamp: new Date().toISOString(),
      portId,
      powerDraw: port.currentPowerDraw + (Math.random() * 10 - 5),
      temperature: port.temperature + (Math.random() * 2 - 1),
      dataRate: port.dataRate + (Math.random() * 5 - 2.5),
      voltage: 28 + (Math.random() * 0.5 - 0.25),
      current: (port.currentPowerDraw / 28) + (Math.random() * 0.1 - 0.05),
    };
  }
}

// Singleton instance
export const mockPlatform = new MockPlatformStore();

