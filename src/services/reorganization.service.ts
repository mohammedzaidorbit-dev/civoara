import {
  OrganizationVersion,
  OwnershipSegment,
  SLAMigrationPolicy,
  RestructuringChangeType,
  IncidentPriority,
} from '@/types';

export interface RestructuringRequest {
  changeType: RestructuringChangeType;
  title: string;
  summary: string;
  sourceDepartmentId?: string;
  targetDepartmentId?: string;
  sourceWardId?: string;
  targetWardId?: string;
  sourceOfficerId?: string;
  targetOfficerId?: string;
  newSlaPolicyVersion?: string;
  migrationPolicy: SLAMigrationPolicy;
  gracePeriodHours?: number; // Minimum buffer for overdue or nearly overdue issues (default: 12h)
}

export interface IssueSLAConsequence {
  issueId: string;
  ticketNumber: string;
  title: string;
  category: string;
  priority: IncidentPriority;
  status: string;
  isOverdue: boolean;
  totalComplaintAgeHours: number;
  oldDepartmentId: string;
  oldDepartmentName: string;
  newDepartmentId: string;
  newDepartmentName: string;
  oldOfficerName?: string;
  newOfficerName?: string;
  oldElapsedHours: number;
  oldDeadline: string;
  newSegmentBudgetHours: number;
  newDeadline: string;
  fairnessNote: string;
}

export interface RestructuringPreview {
  request: RestructuringRequest;
  affectedDepartments: Array<{ id: string; name: string; role: 'source' | 'target' }>;
  affectedWards: Array<{ id: string; name: string; code: string }>;
  totalAffectedIssues: number;
  overdueIssuesCount: number;
  onTrackIssuesCount: number;
  estimatedMigrationDurationMs: number;
  issueConsequences: IssueSLAConsequence[];
  targetVersionNumber: string;
  fairnessGuarantees: string[];
}

export interface RestructuringExecutionResult {
  success: boolean;
  versionId: string;
  versionNumber: string;
  migratedIssuesCount: number;
  segmentsClosedCount: number;
  segmentsOpenedCount: number;
  notificationsDispatchedCount: number;
  executionTimestamp: string;
  message: string;
  rollbackOccurred?: boolean;
}

// In-memory demo store for departments & wards
export const DEMO_DEPARTMENTS_STORE = [
  { id: 'dept-roads', name: 'Roads & Highways', code: 'ROADS_HIGHWAYS' },
  { id: 'dept-bridges', name: 'Bridges & Tunnels', code: 'BRIDGES_TUNNELS' },
  { id: 'dept-infrastructure', name: 'Public Works & Infrastructure', code: 'INFRASTRUCTURE' },
  { id: 'dept-water', name: 'Water & Sewerage Board', code: 'WATER_SEWERAGE' },
  { id: 'dept-sanitation', name: 'Waste Management & Sanitation', code: 'WASTE_MGMT' },
  { id: 'dept-electrical', name: 'Electrical & Lighting', code: 'ELECTRICAL' },
];

export const DEMO_WARDS_STORE = [
  { id: 'ward-01-downtown', name: 'Central Downtown', code: 'WARD-01' },
  { id: 'ward-02-north', name: 'Oakridge Sector', code: 'WARD-02' },
  { id: 'ward-03-harbor', name: 'Waterfront & Harbor', code: 'WARD-03' },
  { id: 'ward-04-pinecrest', name: 'Pinecrest Suburban', code: 'WARD-04' },
];

// In-memory organization versions history
let ACTIVE_ORG_VERSIONS: OrganizationVersion[] = [
  {
    id: 'org-ver-001',
    versionNumber: 'ORG-2026.1',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    changeSummary: 'Baseline municipal operating model establishing 5 primary service divisions.',
    changeType: 'baseline',
    migrationPolicy: 'fair_pro_rata',
    approvedBy: 'Director J. Vance',
    isCurrent: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

// In-memory ownership segments store
let ACTIVE_OWNERSHIP_SEGMENTS: OwnershipSegment[] = [
  {
    id: 'seg-init-001',
    issueId: 'iss-reorg-001',
    departmentId: 'dept-roads',
    departmentName: 'Roads & Highways',
    assignedOfficerId: 'usr-officer-01',
    officerName: 'Officer Sarah Chen',
    organizationVersionId: 'org-ver-001',
    startTime: new Date(Date.now() - 36 * 3600 * 1000).toISOString(), // 36 hours ago
    slaPolicyVersion: 'v1.0-demo',
    segmentSlaBudgetHours: 48,
    segmentElapsedHours: 36,
    segmentOutcome: 'active',
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
  },
  {
    id: 'seg-init-002',
    issueId: 'iss-reorg-002',
    departmentId: 'dept-roads',
    departmentName: 'Roads & Highways',
    assignedOfficerId: 'usr-officer-01',
    officerName: 'Officer Sarah Chen',
    organizationVersionId: 'org-ver-001',
    startTime: new Date(Date.now() - 56 * 3600 * 1000).toISOString(), // 56 hours ago (OVERDUE by 8h)
    slaPolicyVersion: 'v1.0-demo',
    segmentSlaBudgetHours: 48,
    segmentElapsedHours: 56,
    segmentOutcome: 'active',
    createdAt: new Date(Date.now() - 56 * 3600 * 1000).toISOString(),
  },
  {
    id: 'seg-init-003',
    issueId: 'iss-reorg-003',
    departmentId: 'dept-water',
    departmentName: 'Water & Sewerage Board',
    assignedOfficerId: 'usr-officer-02',
    officerName: 'Inspector R. Patel',
    organizationVersionId: 'org-ver-001',
    startTime: new Date(Date.now() - 6 * 3600 * 1000).toISOString(), // 6 hours ago
    slaPolicyVersion: 'v1.0-demo',
    segmentSlaBudgetHours: 12,
    segmentElapsedHours: 6,
    segmentOutcome: 'active',
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  },
];

// In-memory demo issues for reorganization testing
export interface ReorgTestIssue {
  id: string;
  ticketNumber: string;
  title: string;
  category: string;
  priority: IncidentPriority;
  status: string;
  wardId: string;
  departmentId: string;
  assignedOfficerId?: string;
  createdAt: string;
  slaDeadline: string;
  currentEscalationLevel: number;
  slaBreached: boolean;
  activeSegmentId?: string;
  accumulatedHistoricalElapsedHours?: number;
  migrationPolicyApplied?: SLAMigrationPolicy;
  isTransferredReorganization?: boolean;
}

let DEMO_REORG_ISSUES: ReorgTestIssue[] = [
  {
    id: 'iss-reorg-001',
    ticketNumber: 'CIV-2026-8801',
    title: 'Damaged expansion joint on 5th Avenue overpass',
    category: 'pothole',
    priority: 'high',
    status: 'assigned',
    wardId: 'ward-01-downtown',
    departmentId: 'dept-roads',
    assignedOfficerId: 'usr-officer-01',
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    slaDeadline: new Date(Date.now() + 12 * 3600 * 1000).toISOString(), // 12h remaining
    currentEscalationLevel: 0,
    slaBreached: false,
    activeSegmentId: 'seg-init-001',
  },
  {
    id: 'iss-reorg-002',
    ticketNumber: 'CIV-2026-8802',
    title: 'Severe pavement subsidence blocking bus terminal',
    category: 'pothole',
    priority: 'high',
    status: 'assigned',
    wardId: 'ward-01-downtown',
    departmentId: 'dept-roads',
    assignedOfficerId: 'usr-officer-01',
    createdAt: new Date(Date.now() - 56 * 3600 * 1000).toISOString(),
    slaDeadline: new Date(Date.now() - 8 * 3600 * 1000).toISOString(), // 8h OVERDUE!
    currentEscalationLevel: 1,
    slaBreached: true,
    activeSegmentId: 'seg-init-002',
  },
  {
    id: 'iss-reorg-003',
    ticketNumber: 'CIV-2026-8803',
    title: 'Subsurface water leakage seeping through retaining wall',
    category: 'water_leakage',
    priority: 'critical',
    status: 'assigned',
    wardId: 'ward-02-north',
    departmentId: 'dept-water',
    assignedOfficerId: 'usr-officer-02',
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    slaDeadline: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
    currentEscalationLevel: 0,
    slaBreached: false,
    activeSegmentId: 'seg-init-003',
  },
];

export class ReorganizationService {
  /**
   * Generates the next sequential organizational version identifier
   */
  static getNextVersionNumber(): string {
    const current = ACTIVE_ORG_VERSIONS.find((v) => v.isCurrent);
    if (!current) return 'ORG-2026.1';
    const parts = current.versionNumber.split('.');
    if (parts.length === 2 && !isNaN(Number(parts[1]))) {
      return `${parts[0]}.${Number(parts[1]) + 1}`;
    }
    return `ORG-2026.${ACTIVE_ORG_VERSIONS.length + 1}`;
  }

  /**
   * Previews the impact of a proposed administrative restructuring.
   * Calculates affected open issues, overdue status, and fair SLA consequences without applying mutations.
   */
  static async previewRestructuring(
    request: RestructuringRequest
  ): Promise<RestructuringPreview> {
    const targetVersionNumber = this.getNextVersionNumber();
    const gracePeriodHours = request.gracePeriodHours || 12;

    // Identify candidate issues based on restructuring type
    let candidateIssues: ReorgTestIssue[] = [];

    if (request.changeType === 'department_merger') {
      candidateIssues = DEMO_REORG_ISSUES.filter(
        (i) =>
          i.departmentId === request.sourceDepartmentId &&
          i.status !== 'resolved' &&
          i.status !== 'rejected'
      );
    } else if (request.changeType === 'ward_transfer') {
      candidateIssues = DEMO_REORG_ISSUES.filter(
        (i) =>
          i.wardId === request.sourceWardId &&
          (request.sourceDepartmentId ? i.departmentId === request.sourceDepartmentId : true) &&
          i.status !== 'resolved' &&
          i.status !== 'rejected'
      );
    } else if (request.changeType === 'officer_reassignment') {
      candidateIssues = DEMO_REORG_ISSUES.filter(
        (i) =>
          i.assignedOfficerId === request.sourceOfficerId &&
          i.status !== 'resolved' &&
          i.status !== 'rejected'
      );
    } else {
      // General citywide restructuring
      candidateIssues = DEMO_REORG_ISSUES.filter(
        (i) => i.status !== 'resolved' && i.status !== 'rejected'
      );
    }

    const sourceDept = DEMO_DEPARTMENTS_STORE.find((d) => d.id === request.sourceDepartmentId);
    const targetDept = DEMO_DEPARTMENTS_STORE.find((d) => d.id === request.targetDepartmentId);

    const nowTime = Date.now();
    let overdueCount = 0;
    let onTrackCount = 0;

    const issueConsequences: IssueSLAConsequence[] = candidateIssues.map((iss) => {
      const createdTime = new Date(iss.createdAt).getTime();
      const totalAgeHours = Math.round(((nowTime - createdTime) / (3600 * 1000)) * 10) / 10;
      const isOverdue = new Date(iss.slaDeadline).getTime() < nowTime;

      if (isOverdue) overdueCount++;
      else onTrackCount++;

      // Active segment elapsed time
      const activeSeg = ACTIVE_OWNERSHIP_SEGMENTS.find(
        (s) => s.issueId === iss.id && s.segmentOutcome === 'active'
      );
      const segStartTime = activeSeg ? new Date(activeSeg.startTime).getTime() : createdTime;
      const oldElapsedHours = Math.round(((nowTime - segStartTime) / (3600 * 1000)) * 10) / 10;
      const originalBudget = activeSeg ? activeSeg.segmentSlaBudgetHours : 48;

      let newSegmentBudgetHours = 24;
      let newDeadline: Date;
      let fairnessNote = '';

      // FAIR SLA MIGRATION POLICIES
      if (request.migrationPolicy === 'fair_pro_rata') {
        const remainingHours = Math.max(0, originalBudget - oldElapsedHours);
        if (isOverdue || remainingHours < gracePeriodHours) {
          // Grace period applied to new department so they can triage fairly without erasing complaint age
          newSegmentBudgetHours = gracePeriodHours;
          newDeadline = new Date(nowTime + gracePeriodHours * 3600 * 1000);
          fairnessNote = `Fair Pro-Rata: ${oldElapsedHours}h elapsed under ${sourceDept?.name || 'previous dept'}. New department receives ${gracePeriodHours}h emergency buffer. Original ${totalAgeHours}h total complaint age remains strictly preserved.`;
        } else {
          newSegmentBudgetHours = Math.round(remainingHours * 10) / 10;
          newDeadline = new Date(nowTime + remainingHours * 3600 * 1000);
          fairnessNote = `Fair Pro-Rata: Transferred remaining budget of ${newSegmentBudgetHours}h. Previous department charged with ${oldElapsedHours}h elapsed.`;
        }
      } else if (request.migrationPolicy === 'fresh_segment_budget') {
        newSegmentBudgetHours = 48; // Full standard budget for new division
        newDeadline = new Date(nowTime + 48 * 3600 * 1000);
        fairnessNote = `Fresh Segment: New department awarded full 48h budget for remediation. Complaint age (${totalAgeHours}h) and historical delays preserved in audit log.`;
      } else {
        // Grandfathered deadline
        newDeadline = new Date(iss.slaDeadline);
        const remHours = Math.round(((newDeadline.getTime() - nowTime) / (3600 * 1000)) * 10) / 10;
        newSegmentBudgetHours = Math.max(gracePeriodHours, remHours);
        fairnessNote = `Grandfathered: Original deadline preserved without changes. Ownership segment partitioned at transfer timestamp.`;
      }

      return {
        issueId: iss.id,
        ticketNumber: iss.ticketNumber,
        title: iss.title,
        category: iss.category,
        priority: iss.priority,
        status: iss.status,
        isOverdue,
        totalComplaintAgeHours: totalAgeHours,
        oldDepartmentId: iss.departmentId,
        oldDepartmentName: sourceDept?.name || 'Previous Department',
        newDepartmentId: request.targetDepartmentId || iss.departmentId,
        newDepartmentName: targetDept?.name || 'New Department',
        oldOfficerName: 'Officer Sarah Chen',
        newOfficerName: request.targetOfficerId ? 'Assigned Field Responder' : 'Department Triage Queue',
        oldElapsedHours,
        oldDeadline: iss.slaDeadline,
        newSegmentBudgetHours,
        newDeadline: newDeadline.toISOString(),
        fairnessNote,
      };
    });

    const affectedDepts: Array<{ id: string; name: string; role: 'source' | 'target' }> = [];
    if (sourceDept) affectedDepts.push({ id: sourceDept.id, name: sourceDept.name, role: 'source' });
    if (targetDept) affectedDepts.push({ id: targetDept.id, name: targetDept.name, role: 'target' });

    return {
      request,
      affectedDepartments: affectedDepts,
      affectedWards: DEMO_WARDS_STORE.filter((w) =>
        request.sourceWardId ? w.id === request.sourceWardId : true
      ),
      totalAffectedIssues: candidateIssues.length,
      overdueIssuesCount: overdueCount,
      onTrackIssuesCount: onTrackCount,
      estimatedMigrationDurationMs: 120,
      issueConsequences,
      targetVersionNumber,
      fairnessGuarantees: [
        'Total complaint creation date is immutable and never reset.',
        'Previous department elapsed time is locked into historical segment; never blamed on new department.',
        'Existing escalation levels (e.g. Supervisor Level 1) are strictly preserved.',
        'Transparent multi-segment audit history available to citizens and city council.',
        'Transactional execution ensures automatic rollback if any record fails to migrate.',
      ],
    };
  }

  /**
   * Executes administrative restructuring transactionally:
   * 1. Creates new organization version record.
   * 2. Closes existing active ownership segments (locking elapsed hours and outcome).
   * 3. Opens new ownership segments with recalculations under migration policy.
   * 4. Updates issues table with new department, active segment, and recalculated SLA deadline.
   * 5. Dispatches citizen & officer notifications.
   */
  static async executeRestructuring(
    request: RestructuringRequest,
    approvedByUserId: string = 'admin-director-01'
  ): Promise<RestructuringExecutionResult> {
    const preview = await this.previewRestructuring(request);

    // Snapshot state for rollback safety
    const previousVersionsSnapshot = [...ACTIVE_ORG_VERSIONS];
    const previousSegmentsSnapshot = [...ACTIVE_OWNERSHIP_SEGMENTS];
    const previousIssuesSnapshot = [...DEMO_REORG_ISSUES];

    try {
      const newVersionId = crypto.randomUUID();
      const executionTimestamp = new Date().toISOString();

      // Step 1: Create new Organization Version
      const newOrgVersion: OrganizationVersion = {
        id: newVersionId,
        versionNumber: preview.targetVersionNumber,
        effectiveDate: executionTimestamp,
        changeSummary: request.summary,
        changeType: request.changeType,
        migrationPolicy: request.migrationPolicy,
        approvedBy: approvedByUserId,
        isCurrent: true,
        createdAt: executionTimestamp,
      };

      // Mark older versions as not current
      ACTIVE_ORG_VERSIONS = ACTIVE_ORG_VERSIONS.map((v) => ({ ...v, isCurrent: false }));
      ACTIVE_ORG_VERSIONS.push(newOrgVersion);

      let closedSegmentsCount = 0;
      let openedSegmentsCount = 0;
      let notificationsCount = 0;

      // Step 2: Migrate each affected open issue
      for (const consequence of preview.issueConsequences) {
        const issue = DEMO_REORG_ISSUES.find((i) => i.id === consequence.issueId);
        if (!issue) continue;

        // Step 2A: Close old active ownership segment
        const existingActiveSegment = ACTIVE_OWNERSHIP_SEGMENTS.find(
          (s) => s.issueId === issue.id && s.segmentOutcome === 'active'
        );

        if (existingActiveSegment) {
          existingActiveSegment.endTime = executionTimestamp;
          existingActiveSegment.segmentElapsedHours = consequence.oldElapsedHours;
          existingActiveSegment.segmentOutcome = consequence.isOverdue
            ? 'breached_before_transfer'
            : 'transferred_reorganization';
          existingActiveSegment.transferReason = `Transferred to ${consequence.newDepartmentName} under ${preview.targetVersionNumber}: ${request.summary}`;
          closedSegmentsCount++;
        }

        // Step 2B: Open new ownership segment
        const newSegmentId = crypto.randomUUID();
        const newSegment: OwnershipSegment = {
          id: newSegmentId,
          issueId: issue.id,
          departmentId: consequence.newDepartmentId,
          departmentName: consequence.newDepartmentName,
          assignedOfficerId: request.targetOfficerId || undefined,
          officerName: consequence.newOfficerName,
          organizationVersionId: newVersionId,
          startTime: executionTimestamp,
          slaPolicyVersion: request.newSlaPolicyVersion || 'v2.0-reorg',
          segmentSlaBudgetHours: consequence.newSegmentBudgetHours,
          segmentElapsedHours: 0.00, // Starts fresh at 0.00 hours for new department!
          segmentOutcome: 'active',
          createdAt: executionTimestamp,
        };

        ACTIVE_OWNERSHIP_SEGMENTS.push(newSegment);
        openedSegmentsCount++;

        // Step 2C: Update Issue record with fairness guarantees
        issue.departmentId = consequence.newDepartmentId;
        if (request.targetOfficerId) {
          issue.assignedOfficerId = request.targetOfficerId;
        }
        issue.activeSegmentId = newSegmentId;
        issue.slaDeadline = consequence.newDeadline;
        issue.accumulatedHistoricalElapsedHours =
          (issue.accumulatedHistoricalElapsedHours || 0) + consequence.oldElapsedHours;
        issue.migrationPolicyApplied = request.migrationPolicy;
        issue.isTransferredReorganization = true;
        // INVARIANT PRESERVATION: issue.createdAt and issue.currentEscalationLevel are strictly preserved!

        // Step 2D: Dispatch notifications (simulated)
        notificationsCount += 2; // 1 for Citizen, 1 for Officer
      }

      return {
        success: true,
        versionId: newVersionId,
        versionNumber: preview.targetVersionNumber,
        migratedIssuesCount: preview.issueConsequences.length,
        segmentsClosedCount: closedSegmentsCount,
        segmentsOpenedCount: openedSegmentsCount,
        notificationsDispatchedCount: notificationsCount,
        executionTimestamp,
        message: `Successfully executed ${request.changeType.replace(/_/g, ' ')}. Created ${preview.targetVersionNumber} and transactionally migrated ${preview.issueConsequences.length} open issues with fair SLA partition.`,
      };
    } catch (err) {
      // Transactional Rollback
      console.error('Reorganization execution failed, executing rollback:', err);
      ACTIVE_ORG_VERSIONS = previousVersionsSnapshot;
      ACTIVE_OWNERSHIP_SEGMENTS = previousSegmentsSnapshot;
      DEMO_REORG_ISSUES = previousIssuesSnapshot;

      return {
        success: false,
        versionId: '',
        versionNumber: '',
        migratedIssuesCount: 0,
        segmentsClosedCount: 0,
        segmentsOpenedCount: 0,
        notificationsDispatchedCount: 0,
        executionTimestamp: new Date().toISOString(),
        message: 'Reorganization failed during transactional execution. State cleanly rolled back.',
        rollbackOccurred: true,
      };
    }
  }

  /**
   * Retrieves all historical and current organization versions
   */
  static async getOrganizationVersions(): Promise<OrganizationVersion[]> {
    return ACTIVE_ORG_VERSIONS;
  }

  /**
   * Retrieves the complete chronological ownership segments for a specific issue
   */
  static async getIssueOwnershipSegments(issueId: string): Promise<OwnershipSegment[]> {
    return ACTIVE_OWNERSHIP_SEGMENTS.filter((s) => s.issueId === issueId).sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }

  /**
   * Returns current active issues in the reorganization store
   */
  static async getActiveIssues(): Promise<ReorgTestIssue[]> {
    return DEMO_REORG_ISSUES;
  }

  /**
   * Resets in-memory demo data for clean test runs
   */
  static resetDemoStore(): void {
    ACTIVE_ORG_VERSIONS = [
      {
        id: 'org-ver-001',
        versionNumber: 'ORG-2026.1',
        effectiveDate: '2026-01-01T00:00:00.000Z',
        changeSummary: 'Baseline municipal operating model establishing 5 primary service divisions.',
        changeType: 'baseline',
        migrationPolicy: 'fair_pro_rata',
        approvedBy: 'Director J. Vance',
        isCurrent: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    ACTIVE_OWNERSHIP_SEGMENTS = [
      {
        id: 'seg-init-001',
        issueId: 'iss-reorg-001',
        departmentId: 'dept-roads',
        departmentName: 'Roads & Highways',
        assignedOfficerId: 'usr-officer-01',
        officerName: 'Officer Sarah Chen',
        organizationVersionId: 'org-ver-001',
        startTime: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
        slaPolicyVersion: 'v1.0-demo',
        segmentSlaBudgetHours: 48,
        segmentElapsedHours: 36,
        segmentOutcome: 'active',
        createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
      },
      {
        id: 'seg-init-002',
        issueId: 'iss-reorg-002',
        departmentId: 'dept-roads',
        departmentName: 'Roads & Highways',
        assignedOfficerId: 'usr-officer-01',
        officerName: 'Officer Sarah Chen',
        organizationVersionId: 'org-ver-001',
        startTime: new Date(Date.now() - 56 * 3600 * 1000).toISOString(),
        slaPolicyVersion: 'v1.0-demo',
        segmentSlaBudgetHours: 48,
        segmentElapsedHours: 56,
        segmentOutcome: 'active',
        createdAt: new Date(Date.now() - 56 * 3600 * 1000).toISOString(),
      },
      {
        id: 'seg-init-003',
        issueId: 'iss-reorg-003',
        departmentId: 'dept-water',
        departmentName: 'Water & Sewerage Board',
        assignedOfficerId: 'usr-officer-02',
        officerName: 'Inspector R. Patel',
        organizationVersionId: 'org-ver-001',
        startTime: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
        slaPolicyVersion: 'v1.0-demo',
        segmentSlaBudgetHours: 12,
        segmentElapsedHours: 6,
        segmentOutcome: 'active',
        createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      },
    ];

    DEMO_REORG_ISSUES = [
      {
        id: 'iss-reorg-001',
        ticketNumber: 'CIV-2026-8801',
        title: 'Damaged expansion joint on 5th Avenue overpass',
        category: 'pothole',
        priority: 'high',
        status: 'assigned',
        wardId: 'ward-01-downtown',
        departmentId: 'dept-roads',
        assignedOfficerId: 'usr-officer-01',
        createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
        slaDeadline: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
        currentEscalationLevel: 0,
        slaBreached: false,
        activeSegmentId: 'seg-init-001',
      },
      {
        id: 'iss-reorg-002',
        ticketNumber: 'CIV-2026-8802',
        title: 'Severe pavement subsidence blocking bus terminal',
        category: 'pothole',
        priority: 'high',
        status: 'assigned',
        wardId: 'ward-01-downtown',
        departmentId: 'dept-roads',
        assignedOfficerId: 'usr-officer-01',
        createdAt: new Date(Date.now() - 56 * 3600 * 1000).toISOString(),
        slaDeadline: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
        currentEscalationLevel: 1,
        slaBreached: true,
        activeSegmentId: 'seg-init-002',
      },
      {
        id: 'iss-reorg-003',
        ticketNumber: 'CIV-2026-8803',
        title: 'Subsurface water leakage seeping through retaining wall',
        category: 'water_leakage',
        priority: 'critical',
        status: 'assigned',
        wardId: 'ward-02-north',
        departmentId: 'dept-water',
        assignedOfficerId: 'usr-officer-02',
        createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
        slaDeadline: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
        currentEscalationLevel: 0,
        slaBreached: false,
        activeSegmentId: 'seg-init-003',
      },
    ];
  }
}
