/**
 * ============================================================================
 * CIVOARA PART 05 — SLA TIMER AND ESCALATION ENGINE TEST SUITE
 * ============================================================================
 *
 * Verifies all Part 05 specifications:
 * 1. Normal issue (Within deadline -> on_track, Level 0, no escalation).
 * 2. Approaching deadline (< 25% or < 4h -> warning, no escalation).
 * 3. Overdue issue (Deadline missed -> auto-escalates to Level 1: Supervisor).
 * 4. Multiple escalation levels (Progressive escalation to Level 2: Commissioner, Level 3: Admin, capped).
 * 5. Already escalated issue (Idempotent, prevents duplicate escalation at same level).
 * 6. Resolved issue (SLA stopped, no further escalations regardless of elapsed time).
 * 7. Duplicate job execution (Concurrency & retry safety: 0 duplicate steps, 0 duplicate events).
 */

import {
  calculateSLAState,
  processSLAEscalations,
  createAssignedIssueSLA,
  DEMO_SLA_POLICIES,
  IssueSLARecord,
  EscalationStepRecord,
} from '../src/services/sla.service';

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
  console.log('  CIVOARA PART 05 - SLA & ESCALATION ENGINE TESTS');
  console.log('======================================================\n');

  const baseTime = new Date('2026-11-17T12:00:00.000Z');

  // ---------------------------------------------------------------------------
  // SCENARIO 0: Configured Category Deadlines & SLA Initiation
  // ---------------------------------------------------------------------------
  console.log('--- Scenario 0: Policy Definitions & Assignment Initiation ---');
  {
    assert(
      DEMO_SLA_POLICIES.pothole.resolutionHours === 48,
      'Pothole SLA policy deadline is 48 hours',
      `Got: ${DEMO_SLA_POLICIES.pothole.resolutionHours}`
    );
    assert(
      DEMO_SLA_POLICIES.garbage.resolutionHours === 24,
      'Garbage SLA policy deadline is 24 hours',
      `Got: ${DEMO_SLA_POLICIES.garbage.resolutionHours}`
    );
    assert(
      DEMO_SLA_POLICIES.broken_streetlight.resolutionHours === 72,
      'Streetlight SLA policy deadline is 72 hours',
      `Got: ${DEMO_SLA_POLICIES.broken_streetlight.resolutionHours}`
    );
    assert(
      DEMO_SLA_POLICIES.water_leakage.resolutionHours === 12,
      'Water leakage SLA policy deadline is 12 hours',
      `Got: ${DEMO_SLA_POLICIES.water_leakage.resolutionHours}`
    );
    assert(
      DEMO_SLA_POLICIES.other.resolutionHours === 96,
      'Other SLA policy deadline is 96 hours',
      `Got: ${DEMO_SLA_POLICIES.other.resolutionHours}`
    );

    // Test initiate assignment
    const assignmentSLA = createAssignedIssueSLA('pothole', 'usr-officer-01', baseTime);
    const expectedDeadline = new Date(baseTime.getTime() + 48 * 3600 * 1000).toISOString();

    assert(
      assignmentSLA.slaDeadline === expectedDeadline,
      'Initiating pothole SLA sets deadline exactly 48 hours from assignment',
      `Expected ${expectedDeadline}, got ${assignmentSLA.slaDeadline}`
    );
    assert(
      assignmentSLA.currentEscalationLevel === 0,
      'New assignment starts at Escalation Level 0 (Assigned Officer)',
      `Level: ${assignmentSLA.currentEscalationLevel}`
    );
    assert(
      assignmentSLA.slaPolicyVersion === 'v1.0-demo',
      'Records applicable SLA policy version (v1.0-demo)',
      `Version: ${assignmentSLA.slaPolicyVersion}`
    );
  }

  // ---------------------------------------------------------------------------
  // SCENARIO 1: Normal Issue (Within Deadline -> on_track)
  // ---------------------------------------------------------------------------
  console.log('\n--- Scenario 1: Normal Issue Within SLA Deadline ---');
  {
    // Garbage ticket (24h SLA) created at 12:00, checked 4 hours later (16:00)
    const normalIssue: IssueSLARecord = {
      id: 'issue-normal-01',
      ticketNumber: 'CIV-2026-N001',
      title: 'Uncollected recycling bags on 4th Ave',
      category: 'garbage',
      status: 'assigned',
      slaStartedAt: '2026-11-17T12:00:00.000Z',
      slaDeadline: '2026-11-18T12:00:00.000Z', // 24h later
      currentEscalationLevel: 0,
    };

    const evalTime = new Date('2026-11-17T16:00:00.000Z'); // 4 hours in (20h remaining)
    const slaState = calculateSLAState(normalIssue, evalTime);

    assert(
      slaState.status === 'on_track',
      'Normal issue with 20h remaining should have status on_track',
      `Got: ${slaState.status}`
    );
    assert(
      slaState.isOverdue === false,
      'Normal issue must not be overdue',
      `isOverdue: ${slaState.isOverdue}`
    );
    assert(
      slaState.isWarning === false,
      'Normal issue must not trigger warning threshold (> 25% remaining)',
      `isWarning: ${slaState.isWarning}`
    );
    assert(
      slaState.currentEscalationLevel === 0,
      'Normal issue remains at Escalation Level 0',
      `Level: ${slaState.currentEscalationLevel}`
    );
    assert(
      slaState.shouldEscalate === false,
      'Normal issue must not request escalation',
      `shouldEscalate: ${slaState.shouldEscalate}`
    );
    assert(
      slaState.remainingHours === 20,
      'Accurately calculates remaining hours (20.0h)',
      `Remaining: ${slaState.remainingHours}`
    );
  }

  // ---------------------------------------------------------------------------
  // SCENARIO 2: Approaching Deadline (Warning Threshold)
  // ---------------------------------------------------------------------------
  console.log('\n--- Scenario 2: Approaching Deadline (Warning Status) ---');
  {
    // Garbage ticket (24h SLA). Checked with 2 hours remaining (< 4h warning threshold)
    const warningIssue: IssueSLARecord = {
      id: 'issue-warning-02',
      ticketNumber: 'CIV-2026-W002',
      title: 'Commercial waste bin overflow',
      category: 'garbage',
      status: 'in_progress',
      slaStartedAt: '2026-11-17T12:00:00.000Z',
      slaDeadline: '2026-11-18T12:00:00.000Z',
      currentEscalationLevel: 0,
    };

    const evalTime = new Date('2026-11-18T10:00:00.000Z'); // 2 hours before deadline
    const slaState = calculateSLAState(warningIssue, evalTime);

    assert(
      slaState.status === 'warning',
      'Approaching deadline (2h remaining out of 24h) must set status to warning',
      `Got: ${slaState.status}`
    );
    assert(
      slaState.isWarning === true,
      'isWarning flag must be true',
      `isWarning: ${slaState.isWarning}`
    );
    assert(
      slaState.isOverdue === false,
      'Approaching deadline is not yet overdue',
      `isOverdue: ${slaState.isOverdue}`
    );
    assert(
      slaState.shouldEscalate === false,
      'Warning status does not trigger premature escalation',
      `shouldEscalate: ${slaState.shouldEscalate}`
    );
    assert(
      slaState.remainingHours === 2,
      'Calculates exactly 2h remaining',
      `Remaining: ${slaState.remainingHours}`
    );
  }

  // ---------------------------------------------------------------------------
  // SCENARIO 3: Overdue Issue (Auto-Escalation to Level 1: Supervisor)
  // ---------------------------------------------------------------------------
  console.log('\n--- Scenario 3: Overdue Issue (Escalation to Level 1) ---');
  {
    // Water leakage (12h SLA). Deadline was 2026-11-18T00:00:00Z.
    // Evaluated 2 hours after deadline (02:00:00Z).
    const overdueIssue: IssueSLARecord = {
      id: 'issue-overdue-03',
      ticketNumber: 'CIV-2026-O003',
      title: 'Water main fracture causing flooding',
      category: 'water_leakage',
      status: 'assigned',
      slaStartedAt: '2026-11-17T12:00:00.000Z',
      slaDeadline: '2026-11-18T00:00:00.000Z', // 12h SLA
      currentEscalationLevel: 0,
    };

    const evalTime = new Date('2026-11-18T02:00:00.000Z'); // 2h past deadline
    const slaState = calculateSLAState(overdueIssue, evalTime);

    assert(
      slaState.isOverdue === true,
      'Missed deadline flags issue as isOverdue = true',
      `isOverdue: ${slaState.isOverdue}`
    );
    assert(
      slaState.overdueHours === 2,
      'Calculates 2.0 overdue hours',
      `Overdue: ${slaState.overdueHours}`
    );
    assert(
      slaState.targetEscalationLevel === 1,
      'Immediate breach targets Escalation Level 1 (Operational Supervisor)',
      `TargetLevel: ${slaState.targetEscalationLevel}`
    );
    assert(
      slaState.targetRole === 'supervisor',
      'Target escalation role is supervisor',
      `TargetRole: ${slaState.targetRole}`
    );
    assert(
      slaState.shouldEscalate === true,
      'shouldEscalate is true for un-escalated overdue issue',
      `shouldEscalate: ${slaState.shouldEscalate}`
    );

    // Run processor to apply escalation
    const batchResult = await processSLAEscalations({
      referenceDate: evalTime,
      mockIssues: [overdueIssue],
    });

    assert(
      batchResult.escalatedCount === 1,
      'Processor successfully escalated the overdue issue',
      `EscalatedCount: ${batchResult.escalatedCount}`
    );
    assert(
      batchResult.escalations[0].newLevel === 1,
      'Escalation record reflects transition to Level 1',
      `NewLevel: ${batchResult.escalations[0]?.newLevel}`
    );
    assert(
      batchResult.escalations[0].escalatedToRole === 'supervisor',
      'Escalation step targets role supervisor',
      `Role: ${batchResult.escalations[0]?.escalatedToRole}`
    );
  }

  // ---------------------------------------------------------------------------
  // SCENARIO 4: Multiple Escalation Levels (Progressive Tiering)
  // ---------------------------------------------------------------------------
  console.log('\n--- Scenario 4: Multiple Progressive Escalation Levels ---');
  {
    // Water leakage policy: 12h resolution, 3h escalation interval
    // Interval 1: 0 to 3h overdue -> Level 1 (Supervisor)
    // Interval 2: 3h to 6h overdue -> Level 2 (Commissioner)
    // Interval 3: > 6h overdue -> Level 3 (Administrator, capped)
    const baseIssue: IssueSLARecord = {
      id: 'issue-multi-04',
      ticketNumber: 'CIV-2026-M004',
      title: 'Major pipeline rupture near school',
      category: 'water_leakage',
      status: 'assigned',
      slaStartedAt: '2026-11-17T00:00:00.000Z',
      slaDeadline: '2026-11-17T12:00:00.000Z', // 12h SLA
      currentEscalationLevel: 1, // Already at Level 1
    };

    // 4a. 4 hours overdue (exceeds 3h interval -> should target Level 2 Commissioner)
    const time4hOverdue = new Date('2026-11-17T16:00:00.000Z');
    const state4h = calculateSLAState(baseIssue, time4hOverdue);

    assert(
      state4h.targetEscalationLevel === 2,
      '4h overdue on water leakage escalates to Level 2 (Municipal Commissioner)',
      `TargetLevel: ${state4h.targetEscalationLevel}`
    );
    assert(
      state4h.targetRole === 'commissioner',
      'Target role is commissioner',
      `TargetRole: ${state4h.targetRole}`
    );
    assert(
      state4h.shouldEscalate === true,
      'Should escalate from Level 1 to Level 2',
      `shouldEscalate: ${state4h.shouldEscalate}`
    );

    // 4b. 8 hours overdue (exceeds 6h interval -> should target Level 3 Administrator)
    const baseIssueLevel2: IssueSLARecord = {
      ...baseIssue,
      currentEscalationLevel: 2,
    };
    const time8hOverdue = new Date('2026-11-17T20:00:00.000Z');
    const state8h = calculateSLAState(baseIssueLevel2, time8hOverdue);

    assert(
      state8h.targetEscalationLevel === 3,
      '8h overdue on water leakage escalates to Level 3 (Chief Administrator)',
      `TargetLevel: ${state8h.targetEscalationLevel}`
    );
    assert(
      state8h.targetRole === 'admin',
      'Target role is admin',
      `TargetRole: ${state8h.targetRole}`
    );
    assert(
      state8h.shouldEscalate === true,
      'Should escalate from Level 2 to Level 3',
      `shouldEscalate: ${state8h.shouldEscalate}`
    );

    // 4c. Extreme overdue (30 days overdue -> MUST be capped at Level 3 without looping)
    const baseIssueLevel3: IssueSLARecord = {
      ...baseIssue,
      currentEscalationLevel: 3,
    };
    const extremeOverdueTime = new Date('2026-12-17T00:00:00.000Z');
    const stateExtreme = calculateSLAState(baseIssueLevel3, extremeOverdueTime);

    assert(
      stateExtreme.targetEscalationLevel === 3,
      'Extreme overdue is strictly capped at Level 3',
      `TargetLevel: ${stateExtreme.targetEscalationLevel}`
    );
    assert(
      stateExtreme.shouldEscalate === false,
      'When already at Level 3, shouldEscalate is FALSE (prevents infinite escalation loops)',
      `shouldEscalate: ${stateExtreme.shouldEscalate}`
    );
  }

  // ---------------------------------------------------------------------------
  // SCENARIO 5: Already Escalated Issue (Idempotency)
  // ---------------------------------------------------------------------------
  console.log('\n--- Scenario 5: Already Escalated Issue (Idempotency Protection) ---');
  {
    // Issue is 1 hour overdue and current level is ALREADY 1
    const alreadyEscalatedIssue: IssueSLARecord = {
      id: 'issue-already-05',
      ticketNumber: 'CIV-2026-E005',
      title: 'Pothole on Main St',
      category: 'pothole',
      status: 'assigned',
      slaStartedAt: '2026-11-15T00:00:00.000Z',
      slaDeadline: '2026-11-17T00:00:00.000Z',
      currentEscalationLevel: 1, // Already escalated to Supervisor
    };

    const evalTime = new Date('2026-11-17T02:00:00.000Z'); // 2 hours overdue (interval is 12h for pothole)
    const slaState = calculateSLAState(alreadyEscalatedIssue, evalTime);

    assert(
      slaState.currentEscalationLevel === 1,
      'Current level is 1',
      `Level: ${slaState.currentEscalationLevel}`
    );
    assert(
      slaState.targetEscalationLevel === 1,
      'Target level remains 1 (within Level 1 window)',
      `Target: ${slaState.targetEscalationLevel}`
    );
    assert(
      slaState.shouldEscalate === false,
      'shouldEscalate is FALSE because issue is already at target level',
      `shouldEscalate: ${slaState.shouldEscalate}`
    );

    // Run processor: should NOT trigger duplicate escalation
    const existingStep: EscalationStepRecord = {
      id: 'step-existing-01',
      issueId: 'issue-already-05',
      level: 1,
      escalatedToRole: 'supervisor',
      reason: 'Prior escalation',
      createdAt: '2026-11-17T00:05:00.000Z',
    };

    const batchResult = await processSLAEscalations({
      referenceDate: evalTime,
      mockIssues: [alreadyEscalatedIssue],
      existingEscalationSteps: [existingStep],
    });

    assert(
      batchResult.escalatedCount === 0,
      'Processor skips already escalated issue (0 escalations applied)',
      `EscalatedCount: ${batchResult.escalatedCount}`
    );
    assert(
      batchResult.escalations.length === 0,
      'No duplicate escalation records generated',
      `Escalations length: ${batchResult.escalations.length}`
    );
  }

  // ---------------------------------------------------------------------------
  // SCENARIO 6: Resolved Issue (SLA Frozen & Exempt from Escalation)
  // ---------------------------------------------------------------------------
  console.log('\n--- Scenario 6: Resolved Issue Exemption ---');
  {
    // Issue was resolved 5 days ago, well past original deadline
    const resolvedIssue: IssueSLARecord = {
      id: 'issue-resolved-06',
      ticketNumber: 'CIV-2026-R006',
      title: 'Restored streetlight luminaire',
      category: 'broken_streetlight',
      status: 'resolved',
      slaStartedAt: '2026-11-10T12:00:00.000Z',
      slaDeadline: '2026-11-13T12:00:00.000Z', // 72h SLA
      resolvedAt: '2026-11-12T16:00:00.000Z', // Resolved within deadline!
      currentEscalationLevel: 0,
    };

    const currentEvalTime = new Date('2026-11-20T12:00:00.000Z'); // 7 days after deadline
    const slaState = calculateSLAState(resolvedIssue, currentEvalTime);

    assert(
      slaState.status === 'resolved',
      'Resolved issue retains resolved status even when clock progresses',
      `Status: ${slaState.status}`
    );
    assert(
      slaState.shouldEscalate === false,
      'Resolved issue must NEVER escalate',
      `shouldEscalate: ${slaState.shouldEscalate}`
    );
    assert(
      slaState.isOverdue === false,
      'Resolved issue is not overdue if resolved before deadline',
      `isOverdue: ${slaState.isOverdue}`
    );

    // Run processor: should count in resolvedCount and apply 0 escalations
    const batchResult = await processSLAEscalations({
      referenceDate: currentEvalTime,
      mockIssues: [resolvedIssue],
    });

    assert(
      batchResult.resolvedCount === 1,
      'Processor identifies and tallies resolved issue',
      `ResolvedCount: ${batchResult.resolvedCount}`
    );
    assert(
      batchResult.escalatedCount === 0,
      '0 escalations applied to resolved issues',
      `EscalatedCount: ${batchResult.escalatedCount}`
    );
  }

  // ---------------------------------------------------------------------------
  // SCENARIO 7: Duplicate Job Execution & Concurrency Protection
  // ---------------------------------------------------------------------------
  console.log('\n--- Scenario 7: Duplicate Job Execution & Concurrency Protection ---');
  {
    const issueToEscalate: IssueSLARecord = {
      id: 'issue-concurrency-07',
      ticketNumber: 'CIV-2026-C007',
      title: 'Hazardous pothole',
      category: 'pothole',
      status: 'assigned',
      slaStartedAt: '2026-11-15T00:00:00.000Z',
      slaDeadline: '2026-11-17T00:00:00.000Z',
      currentEscalationLevel: 0,
    };

    const evalTime = new Date('2026-11-17T01:00:00.000Z');

    // Run 1: First execution escalates issue from 0 to 1
    const run1 = await processSLAEscalations({
      referenceDate: evalTime,
      mockIssues: [issueToEscalate],
    });

    assert(
      run1.escalatedCount === 1,
      'First run escalates issue to Level 1',
      `EscalatedCount: ${run1.escalatedCount}`
    );

    // Simulate database state after Run 1
    const updatedIssue: IssueSLARecord = {
      ...issueToEscalate,
      currentEscalationLevel: 1,
    };
    const createdStep: EscalationStepRecord = {
      id: 'step-run1',
      issueId: issueToEscalate.id,
      level: 1,
      escalatedToRole: 'supervisor',
      reason: run1.escalations[0].reason,
      createdAt: evalTime.toISOString(),
    };

    // Run 2: Immediate duplicate run with identical timestamp
    const run2 = await processSLAEscalations({
      referenceDate: evalTime,
      mockIssues: [updatedIssue],
      existingEscalationSteps: [createdStep],
    });

    assert(
      run2.escalatedCount === 0,
      'Immediate duplicate run produces exactly 0 escalations (idempotent)',
      `Run 2 EscalatedCount: ${run2.escalatedCount}`
    );
    assert(
      run2.escalations.length === 0,
      'Immediate duplicate run records 0 new escalation steps',
      `Run 2 length: ${run2.escalations.length}`
    );

    // Run 3: Third run simulates retry or jitter after 1 minute
    const run3Time = new Date('2026-11-17T01:01:00.000Z');
    const run3 = await processSLAEscalations({
      referenceDate: run3Time,
      mockIssues: [updatedIssue],
      existingEscalationSteps: [createdStep],
    });

    assert(
      run3.escalatedCount === 0,
      'Retry run after 1m produces 0 duplicate escalations',
      `Run 3 EscalatedCount: ${run3.escalatedCount}`
    );
  }

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`  PART 05 TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error in Part 05 test suite:', err);
  process.exit(1);
});
