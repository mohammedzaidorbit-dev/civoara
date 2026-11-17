import {
  PublicPerformanceSummary,
  DepartmentPerformanceRank,
  WardPerformanceRecord,
  CategoryStatistic,
  ResolutionTrendPoint,
} from '@/types';
import { CONFIGURED_MUNICIPAL_WARDS } from '@/services/ward.service';

export const INITIAL_PUBLIC_SUMMARY: PublicPerformanceSummary = {
  totalReported: 1480,
  totalResolved: 1425,
  openIssues: 48,
  overdueIssues: 7,
  avgResolutionHours: 5.2,
  slaComplianceRate: 96.3,
  citizenVerificationRate: 97.8,
  activeClusters: 42,
  period: '30d',
  measurementDate: new Date().toISOString(),
};

export const INITIAL_DEPARTMENTS: DepartmentPerformanceRank[] = [
  {
    rank: 1,
    departmentId: '20000000-0000-0000-0000-000000000004',
    departmentName: 'Electrical & Street Lighting',
    departmentCode: 'ELECTRICAL',
    eligibleIssues: 289,
    resolvedCount: 286,
    avgResolutionHours: 4.1,
    targetSlaHours: 48,
    slaComplianceRate: 99.2,
    compositeScore: 98.4,
    isLowSample: false,
    statusRating: 'exceeding',
  },
  {
    rank: 2,
    departmentId: '20000000-0000-0000-0000-000000000003',
    departmentName: 'Waste Management & Sanitation',
    departmentCode: 'WASTE_MGMT',
    eligibleIssues: 512,
    resolvedCount: 501,
    avgResolutionHours: 3.5,
    targetSlaHours: 24,
    slaComplianceRate: 98.1,
    compositeScore: 97.2,
    isLowSample: false,
    statusRating: 'exceeding',
  },
  {
    rank: 3,
    departmentId: '20000000-0000-0000-0000-000000000001',
    departmentName: 'Roads & Highways Maintenance',
    departmentCode: 'ROADS_HIGHWAYS',
    eligibleIssues: 412,
    resolvedCount: 398,
    avgResolutionHours: 6.2,
    targetSlaHours: 24,
    slaComplianceRate: 96.4,
    compositeScore: 94.8,
    isLowSample: false,
    statusRating: 'meeting',
  },
  {
    rank: 4,
    departmentId: '20000000-0000-0000-0000-000000000005',
    departmentName: 'Traffic Engineering Division',
    departmentCode: 'TRAFFIC_TRANSIT',
    eligibleIssues: 158,
    resolvedCount: 149,
    avgResolutionHours: 5.0,
    targetSlaHours: 48,
    slaComplianceRate: 95.2,
    compositeScore: 93.6,
    isLowSample: false,
    statusRating: 'meeting',
  },
  {
    rank: 5,
    departmentId: '20000000-0000-0000-0000-000000000002',
    departmentName: 'Water & Sewerage Board',
    departmentCode: 'WATER_SEWERAGE',
    eligibleIssues: 109,
    resolvedCount: 91,
    avgResolutionHours: 8.4,
    targetSlaHours: 12,
    slaComplianceRate: 85.7,
    compositeScore: 84.1,
    isLowSample: false,
    statusRating: 'needs_attention',
  },
];

export const INITIAL_WARDS: WardPerformanceRecord[] = CONFIGURED_MUNICIPAL_WARDS.map((w, idx) => {
  const counts = [420, 310, 280, 260, 210];
  const totalIssues = counts[idx % counts.length];
  const resolvedIssues = Math.round(totalIssues * 0.96);
  const overdueIssues = Math.max(0, totalIssues - resolvedIssues - 2);

  return {
    wardId: w.id,
    wardCode: w.code,
    wardName: w.name,
    population: w.population,
    totalIssues,
    resolvedIssues,
    overdueIssues,
    resolutionRate: Number(((resolvedIssues / totalIssues) * 100).toFixed(1)),
    avgResolutionHours: Number((4.5 + idx * 0.4).toFixed(1)),
    densityPer10k: Number(((totalIssues / w.population) * 10000).toFixed(2)),
  };
});

export const INITIAL_CATEGORIES: CategoryStatistic[] = [
  { category: 'garbage', label: 'Sanitation & Refuse', count: 512, percentage: 34.6, slaTargetHours: 24, avgResolutionHours: 3.5, slaComplianceRate: 98.1 },
  { category: 'pothole', label: 'Road Potholes & Asphalt', count: 412, percentage: 27.8, slaTargetHours: 24, avgResolutionHours: 6.2, slaComplianceRate: 96.4 },
  { category: 'broken_streetlight', label: 'Streetlights & Luminaires', count: 289, percentage: 19.5, slaTargetHours: 48, avgResolutionHours: 4.1, slaComplianceRate: 99.2 },
  { category: 'traffic_signal', label: 'Traffic & Transit Hazards', count: 158, percentage: 10.7, slaTargetHours: 48, avgResolutionHours: 5.0, slaComplianceRate: 95.2 },
  { category: 'water_leakage', label: 'Water Mains & Hydrants', count: 109, percentage: 7.4, slaTargetHours: 12, avgResolutionHours: 8.4, slaComplianceRate: 85.7 },
];

export const INITIAL_TRENDS: ResolutionTrendPoint[] = [
  { periodLabel: 'Week 1', reportedCount: 380, resolvedCount: 365, overdueCount: 14, slaComplianceRate: 96.1 },
  { periodLabel: 'Week 2', reportedCount: 360, resolvedCount: 350, overdueCount: 10, slaComplianceRate: 97.2 },
  { periodLabel: 'Week 3', reportedCount: 390, resolvedCount: 375, overdueCount: 15, slaComplianceRate: 96.0 },
  { periodLabel: 'Week 4', reportedCount: 350, resolvedCount: 335, overdueCount: 8, slaComplianceRate: 97.6 },
];
