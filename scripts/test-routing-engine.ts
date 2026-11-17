/**
 * ============================================================================
 * CIVOARA AUTOMATIC ROUTING ENGINE & GEOSPATIAL TEST SUITE
 * ============================================================================
 *
 * Verifies Part 04 specifications:
 * 1. Exact match (Category + Ward -> matches Priority 1 rule).
 * 2. Fallback match (Category + null Ward -> matches Priority 2 rule).
 * 3. Missing rule (Unknown category -> falls back to Central Administrative Triage Queue).
 * 4. Inactive rule (isActive: false -> skipped, falls back to next priority level).
 * 5. Conflicting rules (Multiple active rules for same category/ward -> rejected as ambiguous, escalated to Admin Review).
 * 6. Issue outside configured wards (Point outside all ward polygons -> marked unassigned and routed to Admin Review).
 * 7. Issue event creation (Audit logging for routing decisions).
 */

import {
  evaluateRoutingRules,
  createRoutingIssueEvent,
  DEFAULT_ADMIN_REVIEW_QUEUE,
  ConfigurableRoutingRule,
} from '../src/services/routing.service';
import {
  identifyResponsibleWard,
  DEMO_TEST_LOCATIONS,
} from '../src/services/ward.service';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
    failedTests++;
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('  CIVOARA PART 04 - ROUTING ENGINE & POSTGIS TESTS');
  console.log('======================================================\n');

  // ---------------------------------------------------------------------------
  // TEST SCENARIO 1: Exact Match (Priority 1)
  // ---------------------------------------------------------------------------
  console.log('--- Scenario 1: Exact Category + Ward Match ---');
  {
    const ward1Id = '10000000-0000-0000-0000-000000000001';
    const result = evaluateRoutingRules({
      category: 'pothole',
      wardId: ward1Id,
    });

    assert(
      result.status === 'exact_match',
      'Should return exact_match status',
      `Got: ${result.status}`
    );
    assert(
      result.matchedRuleId === 'rule-001',
      'Should match rule-001 (Downtown Express Pothole Dispatch)',
      `Matched: ${result.matchedRuleId}`
    );
    assert(
      result.responsibleOfficerId === 'usr-officer-01',
      'Should assign responsible officer Sarah Chen',
      `Assigned: ${result.responsibleOfficerName}`
    );
    assert(
      result.slaHours === 12,
      'Should apply fast-track 12h SLA',
      `SLA: ${result.slaHours}`
    );
    assert(
      result.requiresAdminReview === false,
      'Should not require admin review',
      `RequiresAdminReview: ${result.requiresAdminReview}`
    );
  }

  // ---------------------------------------------------------------------------
  // TEST SCENARIO 2: Fallback Match (Priority 2)
  // ---------------------------------------------------------------------------
  console.log('\n--- Scenario 2: Category Fallback Match ---');
  {
    // Ward 3 does not have a dedicated pothole rule in default config
    const ward3Id = '10000000-0000-0000-0000-000000000003';
    const result = evaluateRoutingRules({
      category: 'pothole',
      wardId: ward3Id,
    });

    assert(
      result.status === 'fallback_match',
      'Should return fallback_match status for Ward 3 potholes',
      `Got: ${result.status}`
    );
    assert(
      result.matchedRuleId === 'rule-003',
      'Should match rule-003 (Citywide Potholes Fallback)',
      `Matched: ${result.matchedRuleId}`
    );
    assert(
      result.responsibleOfficerId === null,
      'Fallback rule should route to department pool without dedicated officer',
      `Officer: ${result.responsibleOfficerName}`
    );
    assert(
      result.slaHours === 24,
      'Should apply standard citywide 24h SLA',
      `SLA: ${result.slaHours}`
    );
  }

  // ---------------------------------------------------------------------------
  // TEST SCENARIO 3: Missing Rule (Priority 3 Default Administrative Queue)
  // ---------------------------------------------------------------------------
  console.log('\n--- Scenario 3: Missing Rule Default Admin Queue ---');
  {
    const result = evaluateRoutingRules({
      category: 'unregistered_hazard_category_xyz',
      wardId: '10000000-0000-0000-0000-000000000001',
    });

    assert(
      result.status === 'default_admin_queue',
      'Should route to default_admin_queue when no rules exist',
      `Got: ${result.status}`
    );
    assert(
      result.departmentId === DEFAULT_ADMIN_REVIEW_QUEUE.departmentId,
      'Should route to Central Administrative Triage Division',
      `Dept: ${result.departmentName}`
    );
    assert(
      result.requiresAdminReview === true,
      'Should flag requiresAdminReview as true',
      `RequiresAdminReview: ${result.requiresAdminReview}`
    );
    assert(
      result.matchedRuleId === null,
      'Matched rule ID should be null',
      `Rule: ${result.matchedRuleId}`
    );
  }

  // ---------------------------------------------------------------------------
  // TEST SCENARIO 4: Inactive Rule (Should be skipped)
  // ---------------------------------------------------------------------------
  console.log('\n--- Scenario 4: Inactive Rule Handling ---');
  {
    const inactiveRule: ConfigurableRoutingRule = {
      id: 'rule-test-inactive',
      name: 'Deactivated Test Rule',
      category: 'water_leakage',
      wardId: '10000000-0000-0000-0000-000000000002',
      departmentId: '20000000-0000-0000-0000-000000000002',
      departmentName: 'Water & Sewerage Board',
      slaHours: 1,
      isActive: false, // Inactive
      effectiveFrom: '2020-01-01T00:00:00Z',
      effectiveUntil: null,
      createdAt: '2020-01-01T00:00:00Z',
    };

    const fallbackRule: ConfigurableRoutingRule = {
      id: 'rule-test-active-fallback',
      name: 'Active Fallback',
      category: 'water_leakage',
      wardId: null,
      departmentId: '20000000-0000-0000-0000-000000000002',
      departmentName: 'Water & Sewerage Board',
      slaHours: 24,
      isActive: true,
      effectiveFrom: '2020-01-01T00:00:00Z',
      effectiveUntil: null,
      createdAt: '2020-01-01T00:00:00Z',
    };

    const result = evaluateRoutingRules({
      category: 'water_leakage',
      wardId: '10000000-0000-0000-0000-000000000002',
      rules: [inactiveRule, fallbackRule],
    });

    assert(
      result.status === 'fallback_match',
      'Should bypass inactive exact rule and match active fallback',
      `Got: ${result.status}`
    );
    assert(
      result.matchedRuleId === 'rule-test-active-fallback',
      'Should match active fallback rule ID',
      `Matched: ${result.matchedRuleId}`
    );
  }

  // ---------------------------------------------------------------------------
  // TEST SCENARIO 5: Conflicting Rules (Ambiguity Rejection)
  // ---------------------------------------------------------------------------
  console.log('\n--- Scenario 5: Conflicting Rules (Ambiguity Rejection) ---');
  {
    const ruleA: ConfigurableRoutingRule = {
      id: 'rule-conflict-a',
      name: 'Conflict Directive A',
      category: 'broken_streetlight',
      wardId: '10000000-0000-0000-0000-000000000001',
      departmentId: 'dept-01',
      departmentName: 'Power & Grid Authority',
      slaHours: 12,
      isActive: true,
      effectiveFrom: '2026-01-01T00:00:00Z',
      createdAt: '2026-01-01T00:00:00Z',
    };

    const ruleB: ConfigurableRoutingRule = {
      id: 'rule-conflict-b',
      name: 'Conflict Directive B',
      category: 'broken_streetlight',
      wardId: '10000000-0000-0000-0000-000000000001',
      departmentId: 'dept-02',
      departmentName: 'Streetlight Infrastructure',
      slaHours: 24,
      isActive: true,
      effectiveFrom: '2026-01-01T00:00:00Z',
      createdAt: '2026-01-01T00:00:00Z',
    };

    const result = evaluateRoutingRules({
      category: 'broken_streetlight',
      wardId: '10000000-0000-0000-0000-000000000001',
      rules: [ruleA, ruleB],
    });

    assert(
      result.status === 'rejected_ambiguous',
      'Should reject ambiguous configuration instead of random assignment',
      `Got: ${result.status}`
    );
    assert(
      result.isAmbiguous === true,
      'isAmbiguous flag must be true',
      `isAmbiguous: ${result.isAmbiguous}`
    );
    assert(
      result.requiresAdminReview === true,
      'requiresAdminReview must be true to alert administrators',
      `requiresAdminReview: ${result.requiresAdminReview}`
    );
    assert(
      result.priority === 'high',
      'Priority should be escalated to high for manual resolution',
      `Priority: ${result.priority}`
    );
  }

  // ---------------------------------------------------------------------------
  // TEST SCENARIO 6: Geospatial Ward Identification & Out-of-Bounds
  // ---------------------------------------------------------------------------
  console.log('\n--- Scenario 6: PostGIS Polygon Ward Resolution ---');
  {
    // 6a: In-bounds Downtown test point
    const downtownLoc = DEMO_TEST_LOCATIONS[0];
    const downtownWard = identifyResponsibleWard(
      downtownLoc.latitude,
      downtownLoc.longitude
    );
    assert(
      downtownWard.ward !== null &&
        downtownWard.ward.id === '10000000-0000-0000-0000-000000000001',
      'Downtown coordinates should resolve to Ward 1 (Central Downtown)',
      `Resolved: ${downtownWard.wardName}`
    );
    assert(
      downtownWard.isUnassigned === false,
      'In-bounds location should not be unassigned',
      `isUnassigned: ${downtownWard.isUnassigned}`
    );

    // 6b: Out-of-bounds Outer Highway test point
    const outOfBoundsLoc = DEMO_TEST_LOCATIONS[5]; // Highway 10 Outside Ward Boundaries
    const outOfBoundsWard = identifyResponsibleWard(
      outOfBoundsLoc.latitude,
      outOfBoundsLoc.longitude
    );
    assert(
      outOfBoundsWard.ward === null,
      'Out-of-bounds coordinates must have null ward',
      `Got ward: ${outOfBoundsWard.wardName}`
    );
    assert(
      outOfBoundsWard.isUnassigned === true,
      'Out-of-bounds coordinates must be flagged as unassigned',
      `isUnassigned: ${outOfBoundsWard.isUnassigned}`
    );
    assert(
      outOfBoundsWard.requiresAdminReview === true,
      'Out-of-bounds coordinates must require admin review',
      `requiresAdminReview: ${outOfBoundsWard.requiresAdminReview}`
    );

    // 6c: Route out-of-bounds issue through routing engine
    const outOfBoundsRouting = evaluateRoutingRules({
      category: 'pothole',
      wardId: null, // Out-of-bounds issue has no ward
    });
    assert(
      outOfBoundsRouting.status === 'fallback_match' ||
        outOfBoundsRouting.status === 'default_admin_queue',
      'Out-of-bounds issue routes cleanly via fallback or admin queue',
      `Status: ${outOfBoundsRouting.status}`
    );
  }

  // ---------------------------------------------------------------------------
  // TEST SCENARIO 7: Issue Event Audit Logging
  // ---------------------------------------------------------------------------
  console.log('\n--- Scenario 7: Issue Event Creation ---');
  {
    const routingResult = evaluateRoutingRules({
      category: 'pothole',
      wardId: '10000000-0000-0000-0000-000000000001',
    });

    const event = createRoutingIssueEvent('issue-uuid-12345', routingResult);

    assert(
      event.issueId === 'issue-uuid-12345',
      'Event should record target issueId',
      `Issue: ${event.issueId}`
    );
    assert(
      event.eventType === 'routing_assigned',
      'Event type should be routing_assigned',
      `EventType: ${event.eventType}`
    );
    assert(
      event.actorRole === 'routing_engine',
      'Actor role should be routing_engine',
      `ActorRole: ${event.actorRole}`
    );
    assert(
      event.departmentName === 'Roads & Highways Maintenance',
      'Event should record assigned department',
      `Dept: ${event.departmentName}`
    );
    assert(
      event.officerId === 'usr-officer-01',
      'Event should record assigned officer',
      `Officer: ${event.officerName}`
    );
    assert(
      event.notes.includes('rule-001'),
      'Audit notes should reference matched rule ID',
      `Notes: ${event.notes}`
    );
  }

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`  TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
