export type ThreatLevel = 'High' | 'Medium' | 'Low';

export interface BusSpec {
  class: string;
  power: string;
  mass: string;
  lifespan: string;
}

export interface ProductLine {
  model: string;
  power: string;
  notes: string;
}

export interface Competitor {
  id: string;
  name: string;
  relationship_status: string;
  threat_level: ThreatLevel;
  archetype: string;
  business_model: string;
  bus_spec: BusSpec;
  product_line?: ProductLine[];
  technical_weakness: string;
  spacebilt_kill_shot: string;
}

export interface SpaceBiltReference {
  standard_node: BusSpec;
  performance_node: BusSpec;
}

export interface CompetitorData {
  meta: {
    title: string;
    market_segment: string;
    version: string;
    last_updated: string;
    description: string;
  };
  competitors: Competitor[];
  spacebilt_reference: SpaceBiltReference;
}

