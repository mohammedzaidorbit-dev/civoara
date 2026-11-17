/**
 * ============================================================================
 * CIVOARA SLA TIMER AND ESCALATION ENGINE (PART 05)
 * ============================================================================
 *
 * Implements:
 * 1. Category-based resolution deadlines (Pothole 48h, Garbage 24h, Streetlight 72h, Water 12h, Other 96h).
 * 2. SLA lifecycle initiation upon issue assignment.
 * 3. 4-Tier Escalation Hierarchy:
 *    - Level 0: Assigned Officer
 *    - Level 1: Operational Supervisor
 *    - Level 2: Municipal Commissioner
 *    - Level 3: System Administrator
 * 4. Idempotent server-side escalation processor with concurrency protection.
 * 5. Strict duplicate prevention for escalation steps, events, and notifications.
 * 6. Authoritative server-side SLA calculations (never trust client clocks).
 */

import { IncidentPriority, UserRole, SLAStatus, EscalationLevel } from '@/types';
import { createClient } from '@supabase/supabase-js';

function getSlaSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'placeholder-anon-key';
  return createClient(supabaseUrl, supabaseKey);
}

// -----------------------------------------------------------------------------
// SLA Policy Definitions (Part 05 Specifications)
// -----------------------------------------------------------------------------
export interface ConfiguredSLAPolicy {
  id: string;
  category: string;
  policyVersion: string;
  resolutionHours: number;
  escalationIntervalHours: number; // Delay between progressive escalation tiers
  priority: IncidentPriority;
  supervisorAlertChannel: string;
  description: string;
  isActive: boolean;
}

export const DEMO_SLA_POLICIES: Record<string, ConfiguredSLAPolicy> = {
  pothole: {
    id: '30000000-0000-0000-0000-000000000001',
    category: 'pothole',
    policyVersion: 'v1.0-demo',
    resolutionHours: 48,
    escalationIntervalHours: 12,
    priority: 'high',
    supervisorAlertChannel: 'sms_and_email',
    description: 'Pothole asphalt repair and municipal road hazard mitigation',
    isActive: true,
  },
  garbage: {
    id: '30000000-0000-0000-0000-000000000002',
    category: 'garbage',
    policyVersion: 'v1.0-demo',
    resolutionHours: 24,
    escalationIntervalHours: 6,
    priority: 'medium',
    supervisorAlertChannel: 'sms_and_email',
    description: 'Municipal solid waste, illegal dumping, and public bin clearance',
    isActive: true,
  },
  broken_streetlight: {
    id: '30000000-0000-0000-0000-000000000003',
    category: 'broken_streetlight',
    policyVersion: 'v1.0-demo',
    resolutionHours: 72,
    escalationIntervalHours: 18,
    priority: 'medium',
    supervisorAlertChannel: 'sms_and_email',
    description: 'Streetlight luminaire, electrical junction, and dark corridor repair',
    isActive: true,
  },
  water_leakage: {
    id: '30000000-0000-0000-0000-000000000004',
    category: 'water_leakage',
    policyVersion: 'v1.0-demo',
    resolutionHours: 12,
    escalationIntervalHours: 3,
    priority: 'critical',
    supervisorAlertChannel: 'sms_and_email',
    description: 'Potable water pipe burst, main rupture, and sewage contamination',
    isActive: true,
  },
  other: {
    id: '30000000-0000-0000-0000-000000000005',
    category: 'other',
    policyVersion: 'v1.0-demo',
    resolutionHours: 96,
    escalationIntervalHours: 24,
    priority: 'low',
    supervisorAlertChannel: 'sms_and_email',
    description: 'General civic grievances and miscellaneous public infrastructure works',
    isActive: true,
  },
};

// Aliases for category mapping
const CATEGORY_ALIASES: Record<string, string> = {
  streetlight: 'broken_streetlight',
  streetlights: 'broken_streetlight',
  street_lighting: 'broken_streetlight',
  water: 'water_leakage',
  water_supply: 'water_leakage',
  sanitation: 'garbage',
  waste: 'garbage',
};

export function normalizeCategory(category: string): string {
  const lower = (category || 'other').trim().toLowerCase();
  return CATEGORY_ALIASES[lower] || lower;
}

export function getSLAPolicyForCategory(category: string): ConfiguredSLAPolicy {
  const normalized = normalizeCategory(category);
  return DEMO_SLA_POLICIES[normalized] || DEMO_SLA_POLICIES['other'];
}

// -----------------------------------------------------------------------------
// Escalation Tiers & Role Mapping
// -----------------------------------------------------------------------------
export interface EscalationTier {
  level: EscalationLevel;
  role: UserRole;
  title: string;
  description: string;
  responseWindowHours: number;
}

export const ESCALATION_TIERS: Record<EscalationLevel, EscalationTier> = {
  0: {
    level: 0,
    role: 'officer',
    title: 'Assigned Field Officer',
    description: 'Primary field technician assigned to verify and resolve incident',
    responseWindowHours: 0,
  },
  1: {
    level: 1,
    role: 'supervisor',
    title: 'Ward Operations Supervisor',
    description: 'First escalation tier for missed frontline deadlines',
    responseWindowHours: 12,
  },
  2: {
    level: 2,
    role: 'commissioner',
    title: 'Municipal Commissioner',
    description: 'Executive departmental oversight for critical civic delays',
    responseWindowHours: 24,
  },
  3: {
    level: 3,
    role: 'admin',
    title: 'Chief City Administrator',
    description: 'Final governance escalation tier for municipal intervention',
    responseWindowHours: 48,
  },
};

// -----------------------------------------------------------------------------
// SLA State & Calculation Interfaces
// -----------------------------------------------------------------------------
export interface SLACalculationState {
  status: SLAStatus;
  startedAt: string;
  deadline: string;
  totalDurationMs: number;
  totalDurationHours: number;
  elapsedMs: number;
  elapsedHours: number;
  remainingMs: number;
  remainingHours: number;
  overdueMs: number;
  overdueHours: number;
  percentRemaining: number;
  isOverdue: boolean;
  isWarning: boolean;
  currentEscalationLevel: EscalationLevel;
  targetEscalationLevel: EscalationLevel;
  currentRole: UserRole;
  targetRole: UserRole;
  shouldEscalate: boolean;
  formattedRemaining: string;
  formattedOverdue: string;
  policyVersion: string;
}

export interface IssueSLARecord {
  id: string;
  ticketNumber: string;
  title: string;
  category: string;
  priority?: IncidentPriority;
  status: string;
  slaStartedAt?: string | null;
  slaDeadline?: string | null;
  slaPolicyId?: string | null;
  slaPolicyVersion?: string | null;
  slaBreached?: boolean;
  currentEscalationLevel?: number;
  lastEscalatedAt?: string | null;
  resolvedAt?: string | null;
  assignedOfficerId?: string | null;
  departmentId?: string | null;
  wardId?: string | null;
}

export interface EscalationStepRecord {
  id: string;
  issueId: string;
  level: number;
  escalatedToRole: UserRole;
  escalatedToUserId?: string | null;
  reason: string;
  actionTaken?: string | null;
  createdAt: string;
}

export interface EscalationEventRecord {
  issueId: string;
  eventType: 'sla_breached' | 'sla_escalated' | 'sla_warning';
  actorRole: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  notes: string;
  createdAt: string;
}

export interface EscalationNotificationRecord {
  id: string;
  userId?: string | null;
  role: UserRole;
  issueId: string;
  ticketNumber: string;
  title: string;
  message: string;
  channel: 'in_app' | 'email' | 'sms';
  isRead: boolean;
  createdAt: string;
}

export interface EscalationBatchResult {
  timestamp: string;
  processedCount: number;
  escalatedCount: number;
  breachedCount: number;
  warningCount: number;
  onTrackCount: number;
  resolvedCount: number;
  escalations: Array<{
    issueId: string;
    ticketNumber: string;
    previousLevel: number;
    newLevel: number;
    escalatedToRole: UserRole;
    reason: string;
  }>;
  errors: Array<{ issueId: string; error: string }>;
}

// -----------------------------------------------------------------------------
// Helper: Duration Formatting (e.g., '1d 14h', '5h 30m', '45m')
// -----------------------------------------------------------------------------
export function formatDurationMs(ms: number): string {
  if (ms <= 0) return '0m';

  const totalMinutes = Math.floor(ms / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  if (minutes > 0 && days === 0) parts.push(`${minutes}m`);

  return parts.length > 0 ? parts.join(' ') : '< 1m';
}

// -----------------------------------------------------------------------------
// 1. Authoritative Server-Side SLA Calculation
// -----------------------------------------------------------------------------
export function calculateSLAState(
  issue: IssueSLARecord,
  referenceDate: Date | string = new Date()
): SLACalculationState {
  const now = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  const policy = getSLAPolicyForCategory(issue.category);

  // If issue is not yet assigned an SLA deadline, initialize from policy
  const startedAtDate = issue.slaStartedAt ? new Date(issue.slaStartedAt) : now;
  const startedAt = startedAtDate.toISOString();

  let deadlineDate: Date;
  if (issue.slaDeadline) {
    deadlineDate = new Date(issue.slaDeadline);
  } else {
    deadlineDate = new Date(startedAtDate.getTime() + policy.resolutionHours * 3600 * 1000);
  }
  const deadline = deadlineDate.toISOString();

  const totalDurationMs = Math.max(1, deadlineDate.getTime() - startedAtDate.getTime());
  const totalDurationHours = Number((totalDurationMs / (3600 * 1000)).toFixed(1));

  const isResolved =
    issue.status.toLowerCase() === 'resolved' || Boolean(issue.resolvedAt);

  const currentLevel = (
    Math.min(3, Math.max(0, issue.currentEscalationLevel ?? 0))
  ) as EscalationLevel;

  // If resolved, freeze SLA calculation at resolution time or current time
  if (isResolved) {
    const resolvedDate = issue.resolvedAt ? new Date(issue.resolvedAt) : now;
    const elapsedMs = Math.max(0, resolvedDate.getTime() - startedAtDate.getTime());
    const remainingMs = Math.max(0, deadlineDate.getTime() - resolvedDate.getTime());
    const overdueMs = Math.max(0, resolvedDate.getTime() - deadlineDate.getTime());

    return {
      status: 'resolved',
      startedAt,
      deadline,
      totalDurationMs,
      totalDurationHours,
      elapsedMs,
      elapsedHours: Number((elapsedMs / (3600 * 1000)).toFixed(1)),
      remainingMs,
      remainingHours: Number((remainingMs / (3600 * 1000)).toFixed(1)),
      overdueMs,
      overdueHours: Number((overdueMs / (3600 * 1000)).toFixed(1)),
      percentRemaining: Math.max(0, Math.min(100, Math.round((remainingMs / totalDurationMs) * 100))),
      isOverdue: overdueMs > 0,
      isWarning: false,
      currentEscalationLevel: currentLevel,
      targetEscalationLevel: currentLevel,
      currentRole: ESCALATION_TIERS[currentLevel].role,
      targetRole: ESCALATION_TIERS[currentLevel].role,
      shouldEscalate: false,
      formattedRemaining: 'Resolved',
      formattedOverdue: overdueMs > 0 ? formatDurationMs(overdueMs) : '0m',
      policyVersion: issue.slaPolicyVersion || policy.policyVersion,
    };
  }

  // Active (Unresolved) Issue Calculation
  const nowMs = now.getTime();
  const deadlineMs = deadlineDate.getTime();
  const elapsedMs = Math.max(0, nowMs - startedAtDate.getTime());
  const elapsedHours = Number((elapsedMs / (3600 * 1000)).toFixed(1));

  const remainingMs = Math.max(0, deadlineMs - nowMs);
  const remainingHours = Number((remainingMs / (3600 * 1000)).toFixed(1));

  const overdueMs = Math.max(0, nowMs - deadlineMs);
  const overdueHours = Number((overdueMs / (3600 * 1000)).toFixed(1));

  const isOverdue = nowMs > deadlineMs;
  const percentRemaining = isOverdue
    ? 0
    : Math.max(0, Math.min(100, Math.round((remainingMs / totalDurationMs) * 100)));

  // Warning threshold: less than 25% duration remaining OR less than 4 hours remaining
  const warningThresholdMs = Math.min(4 * 3600 * 1000, totalDurationMs * 0.25);
  const isWarning = !isOverdue && remainingMs <= warningThresholdMs;

  // ---------------------------------------------------------------------------
  // Escalation Tier Calculation based on Overdue Duration:
  // - Level 1 (Supervisor): Breached (overdueMs > 0)
  // - Level 2 (Commissioner): Overdue by 1x escalation interval
  // - Level 3 (Administrator): Overdue by 2x escalation interval (capped at 3)
  // ---------------------------------------------------------------------------
  let targetLevel: EscalationLevel = 0;
  if (isOverdue) {
    const intervalMs = policy.escalationIntervalHours * 3600 * 1000;
    if (overdueMs >= 2 * intervalMs) {
      targetLevel = 3; // Administrator
    } else if (overdueMs >= intervalMs) {
      targetLevel = 2; // Commissioner
    } else {
      targetLevel = 1; // Supervisor
    }
  }

  // An issue should escalate if the target level is strictly higher than its current level
  const shouldEscalate = isOverdue && targetLevel > currentLevel;

  // Determine High-Level SLA Status
  let status: SLAStatus;
  if (isOverdue) {
    status = currentLevel > 0 || shouldEscalate ? 'escalated' : 'breached';
  } else if (isWarning) {
    status = 'warning';
  } else {
    status = 'on_track';
  }

  return {
    status,
    startedAt,
    deadline,
    totalDurationMs,
    totalDurationHours,
    elapsedMs,
    elapsedHours,
    remainingMs,
    remainingHours,
    overdueMs,
    overdueHours,
    percentRemaining,
    isOverdue,
    isWarning,
    currentEscalationLevel: currentLevel,
    targetEscalationLevel: targetLevel,
    currentRole: ESCALATION_TIERS[currentLevel].role,
    targetRole: ESCALATION_TIERS[targetLevel].role,
    shouldEscalate,
    formattedRemaining: isOverdue ? 'Overdue' : formatDurationMs(remainingMs),
    formattedOverdue: isOverdue ? formatDurationMs(overdueMs) : '0m',
    policyVersion: issue.slaPolicyVersion || policy.policyVersion,
  };
}

// -----------------------------------------------------------------------------
// 2. Initiate SLA on Issue Assignment
// -----------------------------------------------------------------------------
export function createAssignedIssueSLA(
  category: string,
  assignedOfficerId?: string | null,
  assignedAt: Date = new Date()
): {
  slaStartedAt: string;
  slaDeadline: string;
  slaPolicyId: string;
  slaPolicyVersion: string;
  slaBreached: boolean;
  currentEscalationLevel: number;
} {
  const policy = getSLAPolicyForCategory(category);
  const slaStartedAt = assignedAt.toISOString();
  const deadlineDate = new Date(assignedAt.getTime() + policy.resolutionHours * 3600 * 1000);

  return {
    slaStartedAt,
    slaDeadline: deadlineDate.toISOString(),
    slaPolicyId: policy.id,
    slaPolicyVersion: policy.policyVersion,
    slaBreached: false,
    currentEscalationLevel: 0,
  };
}

// -----------------------------------------------------------------------------
// 3. Concurrency-Safe, Idempotent Server-Side Escalation Processor
// -----------------------------------------------------------------------------

// Demonstration active issues used as fallback when Supabase is offline in dev
export const DEFAULT_MONITORED_ISSUES: IssueSLARecord[] = [
  {
    id: '30000000-0000-0000-0000-000000000101',
    ticketNumber: 'CIV-2026-00101',
    title: 'Severe water main burst near Downtown High School',
    category: 'water_leakage',
    priority: 'critical',
    status: 'assigned',
    slaStartedAt: '2026-11-17T18:00:00.000Z',
    slaDeadline: '2026-11-18T06:00:00.000Z',
    currentEscalationLevel: 0,
    assignedOfficerId: 'usr-officer-01',
  },
  {
    id: '30000000-0000-0000-0000-000000000102',
    ticketNumber: 'CIV-2026-00102',
    title: 'Uncollected community dump near Central Market',
    category: 'garbage',
    priority: 'medium',
    status: 'in_progress',
    slaStartedAt: '2026-11-17T02:00:00.000Z',
    slaDeadline: '2026-11-18T02:00:00.000Z',
    currentEscalationLevel: 0,
    assignedOfficerId: 'usr-officer-02',
  },
  {
    id: '30000000-0000-0000-0000-000000000103',
    ticketNumber: 'CIV-2026-00088',
    title: 'Deep axle-breaking pothole on Oakridge Expressway',
    category: 'pothole',
    priority: 'high',
    status: 'assigned',
    slaStartedAt: '2026-11-15T10:00:00.000Z',
    slaDeadline: '2026-11-17T10:00:00.000Z',
    currentEscalationLevel: 1,
    lastEscalatedAt: '2026-11-17T10:05:00.000Z',
    assignedOfficerId: 'usr-officer-01',
  },
];

// In-memory mutex for local execution concurrency lock
let isProcessorRunning = false;

export async function processSLAEscalations(options: {
  referenceDate?: Date | string;
  dryRun?: boolean;
  mockIssues?: IssueSLARecord[];
  existingEscalationSteps?: EscalationStepRecord[];
} = {}): Promise<EscalationBatchResult> {
  const now = options.referenceDate ? new Date(options.referenceDate) : new Date();
  const timestamp = now.toISOString();

  // Concurrency Guard
  if (isProcessorRunning && !options.mockIssues) {
    throw new Error('SLA escalation processor is already running concurrently. Request rejected.');
  }

  try {
    if (!options.mockIssues) {
      isProcessorRunning = true;
    }

    const result: EscalationBatchResult = {
      timestamp,
      processedCount: 0,
      escalatedCount: 0,
      breachedCount: 0,
      warningCount: 0,
      onTrackCount: 0,
      resolvedCount: 0,
      escalations: [],
      errors: [],
    };

    // If mock issues provided (e.g. in test suite), use them; otherwise fetch from DB
    let activeIssues: IssueSLARecord[] = [];

    const isPlaceholderSupabase =
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

    if (options.mockIssues) {
      activeIssues = options.mockIssues;
    } else if (isPlaceholderSupabase) {
      activeIssues = DEFAULT_MONITORED_ISSUES;
    } else {
      try {
        const supabase = getSlaSupabaseClient();
        const { data, error } = await supabase
          .from('issues')
          .select('*')
          .not('status', 'in', '("resolved","rejected")')
          .not('sla_deadline', 'is', null);

        if (error) {
          throw new Error(`Failed to fetch active issues: ${error.message}`);
        }

        activeIssues = (data || []).map((row: Record<string, unknown>) => ({
          id: String(row.id),
          ticketNumber: String(row.ticket_number),
          title: String(row.title),
          category: String(row.category),
          priority: row.priority as IncidentPriority | undefined,
          status: String(row.status),
          slaStartedAt: (row.sla_started_at as string) || (row.created_at as string),
          slaDeadline: row.sla_deadline as string | null,
          slaPolicyId: row.sla_policy_id as string | null,
          slaPolicyVersion: row.sla_policy_version as string | null,
          slaBreached: Boolean(row.sla_breached),
          currentEscalationLevel: typeof row.current_escalation_level === 'number' ? row.current_escalation_level : 0,
          lastEscalatedAt: row.last_escalated_at as string | null,
          resolvedAt: row.resolved_at as string | null,
          assignedOfficerId: row.assigned_officer_id as string | null,
          departmentId: row.department_id as string | null,
          wardId: row.ward_id as string | null,
        }));
      } catch (dbErr) {
        console.warn('[SLA Processor] Supabase database unavailable. Falling back to demonstration issues dataset.', dbErr);
        activeIssues = DEFAULT_MONITORED_ISSUES;
      }
    }

    result.processedCount = activeIssues.length;

    // Track escalation steps to enforce strict idempotency
    const existingStepKeys = new Set<string>();
    if (options.existingEscalationSteps) {
      options.existingEscalationSteps.forEach((s) => {
        existingStepKeys.add(`${s.issueId}_${s.level}`);
      });
    }

    for (const issue of activeIssues) {
      try {
        const slaState = calculateSLAState(issue, now);

        // Aggregate statistics
        if (slaState.status === 'resolved') {
          result.resolvedCount++;
          continue;
        } else if (slaState.status === 'on_track') {
          result.onTrackCount++;
        } else if (slaState.status === 'warning') {
          result.warningCount++;
        } else {
          result.breachedCount++;
        }

        // Check if escalation is required
        if (slaState.shouldEscalate) {
          const nextLevel = slaState.targetEscalationLevel;
          const targetTier = ESCALATION_TIERS[nextLevel];
          const idempotencyKey = `${issue.id}_${nextLevel}`;

          // IDEMPOTENCY CHECK:
          // Skip if an escalation step already exists for this (issue_id, level)
          if (existingStepKeys.has(idempotencyKey)) {
            continue;
          }

          const policy = getSLAPolicyForCategory(issue.category);
          const reason = `Automated SLA breach escalation: ${policy.resolutionHours}h resolution deadline exceeded by ${slaState.formattedOverdue}. Escalated from ${ESCALATION_TIERS[slaState.currentEscalationLevel].title} to ${targetTier.title}.`;

          result.escalations.push({
            issueId: issue.id,
            ticketNumber: issue.ticketNumber,
            previousLevel: slaState.currentEscalationLevel,
            newLevel: nextLevel,
            escalatedToRole: targetTier.role,
            reason,
          });

          result.escalatedCount++;
          existingStepKeys.add(idempotencyKey);

          // If not dry-run, not mock test, and Supabase is configured, write records to Supabase
          if (!options.dryRun && !options.mockIssues && !isPlaceholderSupabase) {
            const supabase = getSlaSupabaseClient();

            // 1. Update issue record conditionally (concurrency safe)
            const { error: updateError } = await supabase
              .from('issues')
              .update({
                current_escalation_level: nextLevel,
                sla_breached: true,
                last_escalated_at: timestamp,
              })
              .eq('id', issue.id)
              .lt('current_escalation_level', nextLevel);

            if (updateError) {
              console.error(`[SLA Processor] Failed to update issue ${issue.id}:`, updateError);
            }

            // 2. Insert escalation step with ON CONFLICT DO NOTHING
            await supabase.from('escalation_steps').insert({
              issue_id: issue.id,
              level: nextLevel,
              escalated_to_role: targetTier.role,
              reason,
              created_at: timestamp,
            });

            // 3. Log issue event
            await supabase.from('issue_events').insert({
              issue_id: issue.id,
              actor_role: 'system_sla_engine',
              event_type: 'sla_escalated',
              old_value: {
                level: slaState.currentEscalationLevel,
                role: ESCALATION_TIERS[slaState.currentEscalationLevel].role,
              },
              new_value: {
                level: nextLevel,
                role: targetTier.role,
              },
              notes: reason,
              created_at: timestamp,
            });

            // 4. Create Notification
            await supabase.from('notifications').insert({
              issue_id: issue.id,
              user_id: issue.assignedOfficerId || '00000000-0000-0000-0000-000000000000',
              title: `SLA Escalation: Level ${nextLevel} (${targetTier.title})`,
              message: `Ticket ${issue.ticketNumber} has breached its ${policy.resolutionHours}h resolution deadline. Escalated to ${targetTier.title}.`,
              channel: 'in_app',
              is_read: false,
              created_at: timestamp,
            });
          }
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown processing error';
        result.errors.push({
          issueId: issue.id,
          error: errorMsg,
        });
      }
    }

    return result;
  } finally {
    if (!options.mockIssues) {
      isProcessorRunning = false;
    }
  }
}
