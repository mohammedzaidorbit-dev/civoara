import { z } from 'zod';
import { IncidentPriority } from '@/types';

export interface ConfigurableRoutingRule {
  id: string;
  name: string;
  category: string;
  wardId: string | null; // null represents wildcard citywide rule
  wardName?: string | null;
  departmentId: string;
  departmentName: string;
  responsibleOfficerId?: string | null;
  responsibleOfficerName?: string | null;
  slaHours: number;
  priorityOverride?: IncidentPriority;
  isActive: boolean;
  effectiveFrom: string; // ISO date string
  effectiveUntil?: string | null;
  createdAt: string;
}

export interface RoutingInput {
  category: string;
  wardId: string | null;
  effectiveDate?: Date | string;
  rules?: ConfigurableRoutingRule[];
}

export type RoutingMatchStatus =
  | 'exact_match'
  | 'fallback_match'
  | 'default_admin_queue'
  | 'rejected_ambiguous';

export interface RoutingResult {
  status: RoutingMatchStatus;
  departmentId: string;
  departmentName: string;
  responsibleOfficerId: string | null;
  responsibleOfficerName: string | null;
  slaHours: number;
  priority: IncidentPriority;
  matchedRuleId: string | null;
  matchedRuleName: string | null;
  isAmbiguous: boolean;
  requiresAdminReview: boolean;
  explanation: string;
  assignedAt: string;
}

export interface RoutingAssignmentEvent {
  issueId: string;
  eventType: 'routing_assigned' | 'administrative_review_queued';
  actorId?: string;
  actorRole: string;
  departmentId: string;
  departmentName: string;
  officerId: string | null;
  officerName: string | null;
  slaHours: number;
  notes: string;
  createdAt: string;
}

// -----------------------------------------------------------------------------
// Routing Rule Validation Schema (Zod)
// -----------------------------------------------------------------------------
export const routingRuleSchema = z.object({
  name: z.string().min(3, 'Rule name must be at least 3 characters long'),
  category: z.string().min(1, 'Category is required'),
  wardId: z.string().nullable().optional(),
  departmentId: z.string().min(1, 'Target department is required'),
  responsibleOfficerId: z.string().nullable().optional(),
  slaHours: z.coerce.number().min(1, 'SLA hours must be at least 1').max(720, 'Max 720 hours (30 days)'),
  priorityOverride: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  isActive: z.boolean().default(true),
  effectiveFrom: z.string().optional(),
  effectiveUntil: z.string().nullable().optional(),
});

export type RoutingRuleFormInput = z.infer<typeof routingRuleSchema>;

// -----------------------------------------------------------------------------
// Default Administrative Review Fallback Queue
// -----------------------------------------------------------------------------
export const DEFAULT_ADMIN_REVIEW_QUEUE = {
  departmentId: '20000000-0000-0000-0000-000000000000',
  departmentName: 'Central Administrative Triage Division',
  responsibleOfficerId: null,
  responsibleOfficerName: 'Unassigned (Triage Queue)',
  slaHours: 72,
  priority: 'low' as IncidentPriority,
};

// -----------------------------------------------------------------------------
// Sample Production Routing Rules
// -----------------------------------------------------------------------------
export const DEFAULT_CONFIGURED_RULES: ConfigurableRoutingRule[] = [
  // 1. Exact Category + Ward Rule: Downtown Potholes
  {
    id: 'rule-001',
    name: 'Ward 1 Downtown Express Pothole Dispatch',
    category: 'pothole',
    wardId: '10000000-0000-0000-0000-000000000001',
    wardName: 'Ward 1 - Central Downtown',
    departmentId: '20000000-0000-0000-0000-000000000001',
    departmentName: 'Roads & Highways Maintenance',
    responsibleOfficerId: 'usr-officer-01',
    responsibleOfficerName: 'Officer Sarah Chen (Badge #PW-402)',
    slaHours: 12, // High priority fast-track for downtown
    priorityOverride: 'high',
    isActive: true,
    effectiveFrom: '2026-01-01T00:00:00Z',
    effectiveUntil: null,
    createdAt: '2026-01-01T00:00:00Z',
  },
  // 2. Exact Category + Ward Rule: Oakridge Water Pipe Bursts
  {
    id: 'rule-002',
    name: 'Ward 2 North Oakridge Water Emergency',
    category: 'water_leakage',
    wardId: '10000000-0000-0000-0000-000000000002',
    wardName: 'Ward 2 - North Oakridge',
    departmentId: '20000000-0000-0000-0000-000000000002',
    departmentName: 'Water & Sewerage Board',
    responsibleOfficerId: 'usr-officer-02',
    responsibleOfficerName: 'Officer David Patel (Badge #WS-114)',
    slaHours: 6,
    priorityOverride: 'critical',
    isActive: true,
    effectiveFrom: '2026-01-01T00:00:00Z',
    effectiveUntil: null,
    createdAt: '2026-01-01T00:00:00Z',
  },
  // 3. Fallback Citywide Category Rule: Potholes
  {
    id: 'rule-003',
    name: 'Citywide Potholes & Asphalt Maintenance Fallback',
    category: 'pothole',
    wardId: null, // Wildcard fallback
    wardName: 'Citywide (All Wards)',
    departmentId: '20000000-0000-0000-0000-000000000001',
    departmentName: 'Roads & Highways Maintenance',
    responsibleOfficerId: null,
    responsibleOfficerName: null,
    slaHours: 24,
    priorityOverride: 'high',
    isActive: true,
    effectiveFrom: '2026-01-01T00:00:00Z',
    effectiveUntil: null,
    createdAt: '2026-01-01T00:00:00Z',
  },
  // 4. Fallback Citywide Category Rule: Garbage
  {
    id: 'rule-004',
    name: 'Citywide Sanitation & Refuse Fallback',
    category: 'garbage',
    wardId: null,
    wardName: 'Citywide (All Wards)',
    departmentId: '20000000-0000-0000-0000-000000000003',
    departmentName: 'Waste Management & Sanitation',
    responsibleOfficerId: null,
    responsibleOfficerName: null,
    slaHours: 48,
    priorityOverride: 'medium',
    isActive: true,
    effectiveFrom: '2026-01-01T00:00:00Z',
    effectiveUntil: null,
    createdAt: '2026-01-01T00:00:00Z',
  },
  // 5. Fallback Citywide Category Rule: Broken Streetlights
  {
    id: 'rule-005',
    name: 'Citywide Street Lighting Fallback',
    category: 'broken_streetlight',
    wardId: null,
    wardName: 'Citywide (All Wards)',
    departmentId: '20000000-0000-0000-0000-000000000004',
    departmentName: 'Electrical & Street Lighting',
    responsibleOfficerId: null,
    responsibleOfficerName: null,
    slaHours: 48,
    priorityOverride: 'medium',
    isActive: true,
    effectiveFrom: '2026-01-01T00:00:00Z',
    effectiveUntil: null,
    createdAt: '2026-01-01T00:00:00Z',
  },
  // 6. Fallback Citywide Category Rule: Water Leakage
  {
    id: 'rule-006',
    name: 'Citywide Water Leakage Fallback',
    category: 'water_leakage',
    wardId: null,
    wardName: 'Citywide (All Wards)',
    departmentId: '20000000-0000-0000-0000-000000000002',
    departmentName: 'Water & Sewerage Board',
    responsibleOfficerId: null,
    responsibleOfficerName: null,
    slaHours: 12,
    priorityOverride: 'critical',
    isActive: true,
    effectiveFrom: '2026-01-01T00:00:00Z',
    effectiveUntil: null,
    createdAt: '2026-01-01T00:00:00Z',
  },
];

/**
 * AUTOMATIC ROUTING ENGINE
 *
 * Implements strict hierarchy:
 * 1. Exact Category + Ward rule (Priority 1)
 * 2. Category-specific Fallback rule (Priority 2, wardId = null)
 * 3. Default Administrative Queue (Priority 3, missing rule or outside ward)
 *
 * SAFETY MANDATE:
 * If multiple equally valid rules exist at the same priority level,
 * the engine rejects ambiguous configuration instead of randomly selecting.
 */
export function evaluateRoutingRules(input: RoutingInput): RoutingResult {
  const allRules = input.rules ?? DEFAULT_CONFIGURED_RULES;
  const now = input.effectiveDate ? new Date(input.effectiveDate) : new Date();
  const assignedAt = now.toISOString();

  // 1. Filter to active rules valid for current effective date
  const activeRules = allRules.filter((rule) => {
    if (!rule.isActive) return false;

    // Check effective date boundaries
    if (rule.effectiveFrom && new Date(rule.effectiveFrom) > now) return false;
    if (rule.effectiveUntil && new Date(rule.effectiveUntil) < now) return false;

    // Match category
    return rule.category.toLowerCase() === input.category.toLowerCase();
  });

  // PRIORITY 1: Check Exact Category + Ward Match
  if (input.wardId) {
    const exactMatches = activeRules.filter((r) => r.wardId === input.wardId);

    if (exactMatches.length > 1) {
      // AMBIGUITY REJECTION: Reject ambiguous configuration
      return {
        status: 'rejected_ambiguous',
        departmentId: DEFAULT_ADMIN_REVIEW_QUEUE.departmentId,
        departmentName: DEFAULT_ADMIN_REVIEW_QUEUE.departmentName,
        responsibleOfficerId: null,
        responsibleOfficerName: null,
        slaHours: DEFAULT_ADMIN_REVIEW_QUEUE.slaHours,
        priority: 'high', // Escalate ambiguous conflict
        matchedRuleId: null,
        matchedRuleName: null,
        isAmbiguous: true,
        requiresAdminReview: true,
        explanation: `AMBIGUOUS CONFIGURATION: Found ${exactMatches.length} conflicting active rules for Category "${input.category}" in Ward "${input.wardId}". Refusing random selection; escalated to Administrative Review.`,
        assignedAt,
      };
    }

    if (exactMatches.length === 1) {
      const match = exactMatches[0];
      return {
        status: 'exact_match',
        departmentId: match.departmentId,
        departmentName: match.departmentName,
        responsibleOfficerId: match.responsibleOfficerId || null,
        responsibleOfficerName: match.responsibleOfficerName || null,
        slaHours: match.slaHours,
        priority: match.priorityOverride || 'medium',
        matchedRuleId: match.id,
        matchedRuleName: match.name,
        isAmbiguous: false,
        requiresAdminReview: false,
        explanation: `Exact match applied: Rule "${match.name}" mapped incident to ${match.departmentName} with ${match.slaHours}h SLA.`,
        assignedAt,
      };
    }
  }

  // PRIORITY 2: Check Category-Specific Fallback Rule (wardId is null)
  const fallbackMatches = activeRules.filter(
    (r) => r.wardId === null || r.wardId === undefined || r.wardId === ''
  );

  if (fallbackMatches.length > 1) {
    // AMBIGUITY REJECTION: Multiple fallback rules for the same category
    return {
      status: 'rejected_ambiguous',
      departmentId: DEFAULT_ADMIN_REVIEW_QUEUE.departmentId,
      departmentName: DEFAULT_ADMIN_REVIEW_QUEUE.departmentName,
      responsibleOfficerId: null,
      responsibleOfficerName: null,
      slaHours: DEFAULT_ADMIN_REVIEW_QUEUE.slaHours,
      priority: 'high',
      matchedRuleId: null,
      matchedRuleName: null,
      isAmbiguous: true,
      requiresAdminReview: true,
      explanation: `AMBIGUOUS CONFIGURATION: Found ${fallbackMatches.length} conflicting fallback rules for Category "${input.category}". Refusing random assignment; routed to Administrative Review.`,
      assignedAt,
    };
  }

  if (fallbackMatches.length === 1) {
    const fallback = fallbackMatches[0];
    return {
      status: 'fallback_match',
      departmentId: fallback.departmentId,
      departmentName: fallback.departmentName,
      responsibleOfficerId: fallback.responsibleOfficerId || null,
      responsibleOfficerName: fallback.responsibleOfficerName || null,
      slaHours: fallback.slaHours,
      priority: fallback.priorityOverride || 'medium',
      matchedRuleId: fallback.id,
      matchedRuleName: fallback.name,
      isAmbiguous: false,
      requiresAdminReview: false,
      explanation: `Fallback rule applied: Citywide Category Fallback "${fallback.name}" assigned to ${fallback.departmentName}.`,
      assignedAt,
    };
  }

  // PRIORITY 3: Default Administrative Queue (Missing rule or unassigned ward)
  const isOutsideWard = input.wardId === null;
  return {
    status: 'default_admin_queue',
    departmentId: DEFAULT_ADMIN_REVIEW_QUEUE.departmentId,
    departmentName: DEFAULT_ADMIN_REVIEW_QUEUE.departmentName,
    responsibleOfficerId: null,
    responsibleOfficerName: null,
    slaHours: DEFAULT_ADMIN_REVIEW_QUEUE.slaHours,
    priority: 'low',
    matchedRuleId: null,
    matchedRuleName: null,
    isAmbiguous: false,
    requiresAdminReview: true,
    explanation: isOutsideWard
      ? 'Incident coordinates fall outside configured wards. Routed to Central Administrative Triage Queue.'
      : `No active routing rule found for Category "${input.category}". Routed to Central Administrative Triage Queue.`,
    assignedAt,
  };
}

/**
 * Creates an immutable audit event for every assignment.
 * "Every assignment must create an issue event."
 */
export function createRoutingIssueEvent(
  issueId: string,
  routingResult: RoutingResult,
  actorRole = 'routing_engine'
): RoutingAssignmentEvent {
  const isSpecial = routingResult.isAmbiguous || routingResult.requiresAdminReview;
  const eventType = isSpecial
    ? 'administrative_review_queued'
    : 'routing_assigned';

  const notes = routingResult.isAmbiguous
    ? `ROUTING CONFLICT: ${routingResult.explanation}`
    : routingResult.requiresAdminReview
    ? `ADMINISTRATIVE TRIAGE: ${routingResult.explanation}`
    : `AUTOMATIC DISPATCH: Assigned to ${routingResult.departmentName}${
        routingResult.responsibleOfficerName
          ? ` (${routingResult.responsibleOfficerName})`
          : ''
      } under ${routingResult.slaHours}h SLA${
        routingResult.matchedRuleId ? ` via [${routingResult.matchedRuleId}: ${routingResult.matchedRuleName}]` : ''
      }.`;

  return {
    issueId,
    eventType,
    actorRole,
    departmentId: routingResult.departmentId,
    departmentName: routingResult.departmentName,
    officerId: routingResult.responsibleOfficerId,
    officerName: routingResult.responsibleOfficerName,
    slaHours: routingResult.slaHours,
    notes,
    createdAt: new Date().toISOString(),
  };
}
