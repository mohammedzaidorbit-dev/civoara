import { IncidentCategory } from '@/types';

export interface RoutingRule {
  category: IncidentCategory;
  targetDepartmentCode: string;
}

export const DEFAULT_ROUTING_RULES: Record<IncidentCategory, string> = {
  pothole: 'ROADS_HIGHWAYS',
  sanitation: 'WASTE_MGMT',
  garbage: 'WASTE_MGMT',
  water_supply: 'WATER_SEWERAGE',
  water_leakage: 'WATER_SEWERAGE',
  street_lighting: 'ELECTRICAL',
  broken_streetlight: 'ELECTRICAL',
  traffic_signal: 'TRAFFIC_TRANSIT',
  drainage: 'STORMWATER_DRAINAGE',
  other: 'GENERAL_MUNICIPAL',
};

export function resolveDepartmentForCategory(category: IncidentCategory): string {
  return DEFAULT_ROUTING_RULES[category] || DEFAULT_ROUTING_RULES.other;
}
