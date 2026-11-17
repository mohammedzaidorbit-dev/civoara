export type UserRole =
  | 'citizen'
  | 'officer'
  | 'supervisor'
  | 'commissioner'
  | 'admin';

export type IncidentCategory =
  | 'pothole'
  | 'sanitation'
  | 'garbage'
  | 'water_supply'
  | 'water_leakage'
  | 'street_lighting'
  | 'broken_streetlight'
  | 'traffic_signal'
  | 'drainage'
  | 'other';

export type IncidentStatus =
  | 'submitted'
  | 'triaged'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'rejected';

export type IncidentPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Ward {
  id: string;
  name: string;
  code: string;
  boundaryGeojson?: Record<string, unknown>;
  population?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  headOfficerId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OfficerAssignment {
  id: string;
  officerId: string;
  departmentId: string;
  wardId?: string;
  isPrimary: boolean;
  status: 'active' | 'on_leave' | 'suspended';
  assignedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoutingRule {
  id: string;
  category: IncidentCategory;
  targetDepartmentId: string;
  wardId?: string;
  priorityOverride?: IncidentPriority;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SLAStatus =
  | 'on_track'
  | 'warning'
  | 'breached'
  | 'escalated'
  | 'resolved'
  | 'paused';

export type EscalationLevel = 0 | 1 | 2 | 3;

export interface SLAPolicy {
  id: string;
  category?: string;
  priority: IncidentPriority;
  maxResolutionHours: number;
  escalationHours: number;
  supervisorAlertChannel: string;
  policyVersion?: string;
  departmentId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IssueLocation {
  latitude: number;
  longitude: number;
  address?: string;
  landmark?: string;
}

export type IncidentLocation = IssueLocation;

export interface Issue {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: IncidentCategory;
  priority: IncidentPriority;
  status: IncidentStatus;
  isPublic: boolean;
  isPublicApproved: boolean;
  location: IssueLocation;
  wardId?: string;
  departmentId?: string;
  assignedOfficerId?: string;
  clusterId?: string;
  reportCount?: number;
  uniqueReporterCount?: number;
  clusterConfidence?: number;
  requiresClusteringReview?: boolean;
  activeOwnershipSegmentId?: string;
  organizationVersionId?: string;
  accumulatedHistoricalElapsedHours?: number;
  migrationPolicyApplied?: SLAMigrationPolicy;
  isTransferredReorganization?: boolean;
  ownershipSegments?: OwnershipSegment[];
  slaDeadline?: string;
  slaStartedAt?: string;
  slaPolicyId?: string;
  slaPolicyVersion?: string;
  slaBreached: boolean;
  currentEscalationLevel: number;
  lastEscalatedAt?: string;
  resolvedAt?: string;
  resolutionProofUrl?: string;
  resolutionNotes?: string;
  citizenVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IssueReport {
  id: string;
  issueId: string;
  reporterId?: string;
  clusterId?: string;
  isAnonymous: boolean;
  isCanonicalReport?: boolean;
  clusterMatchConfidence?: number;
  title: string;
  description: string;
  mediaUrls: string[];
  location: IssueLocation;
  createdAt: string;
}

export interface IssueEvent {
  id: string;
  issueId: string;
  actorId?: string;
  actorRole?: UserRole | string;
  eventType: string;
  oldValue?: Record<string, unknown> | string | null;
  newValue?: Record<string, unknown> | string | null;
  notes?: string;
  createdAt: string;
}

export interface EscalationStep {
  id: string;
  issueId: string;
  level: number;
  escalatedToUserId?: string;
  escalatedToRole: UserRole | string;
  reason: string;
  actionTaken?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface IssueCluster {
  id: string;
  clusterCode: string;
  primaryIssueId?: string;
  wardId?: string;
  category: IncidentCategory;
  centerLatitude: number;
  centerLongitude: number;
  radiusMeters: number;
  reportCount: number;
  uniqueReporterCount?: number;
  status?: 'active' | 'merged' | 'split' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface ClusteringConfig {
  matchingRadiusMeters: number;
  maxTimeWindowHours: number;
  autoMergeThreshold: number;
  reviewThreshold: number;
}

export interface ClusterMatchScore {
  confidence: number;
  spatialScore: number;
  textScore: number;
  temporalScore: number;
  distanceMeters: number;
  timeDifferenceHours: number;
  action: 'auto_merge' | 'needs_review' | 'create_new';
  reason: string;
}

export interface ClusterEvaluationResult {
  action: 'auto_merge' | 'needs_review' | 'create_new';
  targetClusterId?: string;
  targetClusterCode?: string;
  canonicalIssueId?: string;
  canonicalTicketNumber?: string;
  clusterReportCount?: number;
  uniqueReporterCount?: number;
  confidence?: number;
  matchScore?: ClusterMatchScore;
}

export type SegmentOutcome =
  | 'active'
  | 'completed'
  | 'transferred_reorganization'
  | 'transferred_ward'
  | 'breached_before_transfer'
  | 'reassigned';

export type SLAMigrationPolicy =
  | 'fair_pro_rata' // Deducts elapsed time; gives remaining or minimum grace buffer
  | 'fresh_segment_budget' // Grants standard budget to new department while preserving global age
  | 'grandfathered_deadline'; // Keeps absolute deadline fixed

export interface OwnershipSegment {
  id: string;
  issueId: string;
  departmentId: string;
  departmentName?: string;
  assignedOfficerId?: string;
  officerName?: string;
  organizationVersionId?: string;
  startTime: string;
  endTime?: string;
  slaPolicyVersion: string;
  segmentSlaBudgetHours: number;
  segmentElapsedHours: number;
  segmentOutcome: SegmentOutcome;
  transferReason?: string;
  createdAt: string;
}

export type RestructuringChangeType =
  | 'department_merger'
  | 'ward_transfer'
  | 'officer_reassignment'
  | 'routing_update'
  | 'escalation_change'
  | 'sla_policy_update';

export interface OrganizationVersion {
  id: string;
  versionNumber: string;
  effectiveDate: string;
  changeSummary: string;
  changeType: RestructuringChangeType | string;
  migrationPolicy?: SLAMigrationPolicy;
  metadata?: Record<string, unknown>;
  approvedBy?: string;
  isCurrent: boolean;
  createdAt: string;
}

export interface OrganizationChangeEvent {
  id: string;
  versionId: string;
  targetType: string;
  targetId: string;
  changeType: string;
  oldState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  initiatedBy?: string;
  createdAt: string;
}

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';

export interface Notification {
  id: string;
  userId: string;
  issueId?: string;
  title: string;
  message: string;
  channel: NotificationChannel;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  departmentId?: string;
  wardId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==============================================================================
// PUBLIC TRANSPARENCY & PERFORMANCE METRICS (Part 08)
// ==============================================================================

export type AnalyticsPeriod = '30d' | '90d' | '1y' | 'all';

export interface PublicPerformanceSummary {
  totalReported: number;
  totalResolved: number;
  openIssues: number;
  overdueIssues: number;
  avgResolutionHours: number;
  slaComplianceRate: number; // 0 to 100 percentage
  citizenVerificationRate: number; // 0 to 100 percentage
  activeClusters: number;
  period: AnalyticsPeriod;
  measurementDate: string;
}

export type DepartmentRatingTier = 'exceeding' | 'meeting' | 'needs_attention';

export interface DepartmentPerformanceRank {
  rank: number;
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  eligibleIssues: number;
  resolvedCount: number;
  avgResolutionHours: number;
  targetSlaHours: number;
  slaComplianceRate: number; // 0 to 100 percentage
  compositeScore: number; // 0 to 100 weighted index
  isLowSample: boolean; // True if eligible issues < MIN_SAMPLE_THRESHOLD (5)
  sampleDisclosureNote?: string;
  statusRating: DepartmentRatingTier;
}

export interface WardPerformanceRecord {
  wardId: string;
  wardCode: string;
  wardName: string;
  population: number;
  totalIssues: number;
  resolvedIssues: number;
  overdueIssues: number;
  resolutionRate: number; // 0 to 100 percentage
  avgResolutionHours: number;
  densityPer10k: number; // Issues per 10,000 residents
}

export interface CategoryStatistic {
  category: IncidentCategory;
  label: string;
  count: number;
  percentage: number;
  slaTargetHours: number;
  avgResolutionHours: number;
  slaComplianceRate: number;
}

export interface ResolutionTrendPoint {
  periodLabel: string;
  reportedCount: number;
  resolvedCount: number;
  overdueCount: number;
  slaComplianceRate: number;
}

export type PublicTimelineStep =
  | 'reported'
  | 'assigned'
  | 'in_progress'
  | 'escalated'
  | 'resolved';

export interface PublicIncidentTimelineEvent {
  step: PublicTimelineStep;
  title: string;
  timestamp: string;
  actorRolePublic: string;
  notes: string;
  isCompleted: boolean;
  isActive: boolean;
}

export interface PublicSanitizedIncident {
  id: string;
  ticketNumber: string;
  title: string;
  category: IncidentCategory;
  status: IncidentStatus;
  priority: IncidentPriority;
  wardName: string;
  generalLocation: string;
  latitude: number;
  longitude: number;
  reportedAt: string;
  resolvedAt?: string;
  slaHours: number;
  slaRemainingText: string;
  isOverdue: boolean;
  timeline: PublicIncidentTimelineEvent[];
}
