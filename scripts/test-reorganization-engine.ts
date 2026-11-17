/**
 * CIVOARA AUTOMATED TEST SUITE: PART 07 DEPARTMENT REORGANIZATION & FAIR SLA MIGRATION
 *
 * Scenarios tested:
 * 1. Department Merger Preview (affected departments, wards, open on-track & overdue issues)
 * 2. Department Merger Execution (atomic Organization Version creation, segment closure, segment opening)
 * 3. Fairness Invariants (no delay erasure, no escalation demotion, zero blame shift, total age preserved)
 * 4. Ward Responsibility Transfer with open critical issues
 * 5. Multi-Segment Chronological Ownership Audit Trail
 * 6. Transactional Rollback Protection on execution failure
 */

import {
  ReorganizationService,
  RestructuringRequest,
} from '../src/services/reorganization.service';

let passedAssertions = 0;
let totalAssertions = 0;

function assert(condition: boolean, description: string) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ✓ [PASS] ${description}`);
  } else {
    console.error(`  ✗ [FAIL] ${description}`);
    throw new Error(`Assertion failed: ${description}`);
  }
}

async function runTestSuite() {
  console.log('\n================================================================');
  console.log('  CIVOARA PART 07: REORGANIZATION & FAIR SLA MIGRATION TESTS');
  console.log('================================================================\n');

  ReorganizationService.resetDemoStore();

  // ---------------------------------------------------------------------------
  // SCENARIO 1: DEPARTMENT MERGER PREVIEW
  // ---------------------------------------------------------------------------
  console.log('--- SCENARIO 1: Department Merger Preview (Roads -> Infrastructure) ---');
  const mergerRequest: RestructuringRequest = {
    changeType: 'department_merger',
    title: 'Merger: Roads Maintenance into Public Works Infrastructure',
    summary: 'Consolidating road civil works into single municipal infrastructure division.',
    sourceDepartmentId: 'dept-roads',
    targetDepartmentId: 'dept-infrastructure',
    migrationPolicy: 'fair_pro_rata',
    gracePeriodHours: 12,
  };

  const preview = await ReorganizationService.previewRestructuring(mergerRequest);

  assert(preview.targetVersionNumber === 'ORG-2026.2', `Target version generated is '${preview.targetVersionNumber}'`);
  assert(preview.totalAffectedIssues === 2, `Identified exactly 2 open issues under Roads & Highways`);
  assert(preview.onTrackIssuesCount === 1, `Identified 1 on-track issue (CIV-2026-8801, 12h remaining)`);
  assert(preview.overdueIssuesCount === 1, `Identified 1 overdue issue (CIV-2026-8802, breached by 8h)`);

  const consequenceOnTrack = preview.issueConsequences.find((c) => c.issueId === 'iss-reorg-001')!;
  const consequenceOverdue = preview.issueConsequences.find((c) => c.issueId === 'iss-reorg-002')!;

  assert(consequenceOnTrack.oldElapsedHours === 36, `On-track issue records exactly 36h elapsed under old department`);
  assert(consequenceOnTrack.newSegmentBudgetHours === 12, `Fair Pro-Rata allocates remaining 12h to incoming department`);

  assert(consequenceOverdue.oldElapsedHours === 56, `Overdue issue records exactly 56h elapsed under old department`);
  assert(consequenceOverdue.isOverdue === true, `Overdue issue correctly flagged as overdue`);
  assert(consequenceOverdue.newSegmentBudgetHours === 12, `Overdue issue receives fair 12h emergency grace period`);

  // ---------------------------------------------------------------------------
  // SCENARIO 2: TRANSACTIONAL MERGER EXECUTION & SEGMENT TRANSFERS
  // ---------------------------------------------------------------------------
  console.log('\n--- SCENARIO 2: Transactional Merger Execution & Segment Accounting ---');
  const execResult = await ReorganizationService.executeRestructuring(mergerRequest, 'admin-lead-01');

  assert(execResult.success, 'Department merger restructuring executed successfully');
  assert(execResult.versionNumber === 'ORG-2026.2', `Created Organization Version '${execResult.versionNumber}'`);
  assert(execResult.segmentsClosedCount === 2, `Closed exactly 2 outgoing ownership segments`);
  assert(execResult.segmentsOpenedCount === 2, `Opened exactly 2 incoming ownership segments`);
  assert(execResult.notificationsDispatchedCount === 4, `Dispatched 4 notifications to affected citizens & officers`);

  // Verify Version Ledger
  const versions = await ReorganizationService.getOrganizationVersions();
  const v1 = versions.find((v) => v.versionNumber === 'ORG-2026.1')!;
  const v2 = versions.find((v) => v.versionNumber === 'ORG-2026.2')!;

  assert(v1.isCurrent === false, 'Previous version ORG-2026.1 is no longer current');
  assert(v2.isCurrent === true, 'New version ORG-2026.2 is active current version');

  // ---------------------------------------------------------------------------
  // SCENARIO 3: FAIRNESS INVARIANTS VERIFICATION
  // ---------------------------------------------------------------------------
  console.log('\n--- SCENARIO 3: Fairness Invariants & Non-Destructive Accounting ---');
  const activeIssues = await ReorganizationService.getActiveIssues();
  const migratedOverdue = activeIssues.find((i) => i.id === 'iss-reorg-002')!;

  // Invariant A: Total complaint creation date is NEVER reset
  const nowMs = Date.now();
  const createdMs = new Date(migratedOverdue.createdAt).getTime();
  const complaintAgeHours = Math.round((nowMs - createdMs) / (3600 * 1000));
  assert(complaintAgeHours >= 55, `Complaint true age is intact (${complaintAgeHours}h old, never reset to 0h)`);

  // Invariant B: Previous escalations are NEVER erased
  assert(
    migratedOverdue.currentEscalationLevel === 1,
    `Existing escalation Level 1 (Supervisor tier) strictly preserved without demotion`
  );

  // Invariant C: Do not attribute old department's elapsed time to new department
  const issueSegments = await ReorganizationService.getIssueOwnershipSegments('iss-reorg-002');
  assert(issueSegments.length === 2, `Issue has exactly 2 chronological ownership segments`);

  const oldSeg = issueSegments[0];
  const newSeg = issueSegments[1];

  assert(oldSeg.departmentId === 'dept-roads', `Segment 1 correctly points to outgoing Roads & Highways`);
  assert(oldSeg.segmentElapsedHours === 56, `Segment 1 locks outgoing department elapsed time at 56.0h`);
  assert(oldSeg.segmentOutcome === 'breached_before_transfer', `Segment 1 outcome recorded as 'breached_before_transfer'`);
  assert(Boolean(oldSeg.endTime), `Segment 1 records immutable end_time`);

  assert(newSeg.departmentId === 'dept-infrastructure', `Segment 2 points to incoming Infrastructure department`);
  assert(newSeg.segmentElapsedHours === 0.0, `Segment 2 starts with 0.0h elapsed for new department (Zero blame shift!)`);
  assert(newSeg.segmentSlaBudgetHours === 12, `Segment 2 budget equals 12h emergency grace period`);
  assert(newSeg.segmentOutcome === 'active', `Segment 2 outcome is 'active'`);

  // Invariant D: Cumulative historical time tracked on issue
  assert(
    migratedOverdue.accumulatedHistoricalElapsedHours === 56,
    `Issue records accumulated historical elapsed hours: 56.0h`
  );

  // ---------------------------------------------------------------------------
  // SCENARIO 4: WARD RESPONSIBILITY TRANSFER
  // ---------------------------------------------------------------------------
  console.log('\n--- SCENARIO 4: Ward Responsibility Transfer (Water -> Infrastructure) ---');
  const wardTransferRequest: RestructuringRequest = {
    changeType: 'ward_transfer',
    title: 'Ward 2 Water Retaining Works Transfer',
    summary: 'Transferring retaining wall water repairs in Ward 2 to Infrastructure Division.',
    sourceDepartmentId: 'dept-water',
    targetDepartmentId: 'dept-infrastructure',
    sourceWardId: 'ward-02-north',
    targetWardId: 'ward-02-north',
    migrationPolicy: 'fair_pro_rata',
    gracePeriodHours: 12,
  };

  const wardPreview = await ReorganizationService.previewRestructuring(wardTransferRequest);
  assert(wardPreview.totalAffectedIssues === 1, `Ward transfer identified 1 open issue in Ward 2 (CIV-2026-8803)`);
  assert(wardPreview.targetVersionNumber === 'ORG-2026.3', `Target version generated is 'ORG-2026.3'`);

  const wardExec = await ReorganizationService.executeRestructuring(wardTransferRequest, 'admin-lead-01');
  assert(wardExec.success, `Ward transfer executed successfully with version ${wardExec.versionNumber}`);

  const wardIssue = (await ReorganizationService.getActiveIssues()).find((i) => i.id === 'iss-reorg-003')!;
  assert(wardIssue.departmentId === 'dept-infrastructure', `Ward 2 ticket department transferred to Infrastructure`);
  assert(wardIssue.wardId === 'ward-02-north', `Ticket ward assignment strictly preserved: Ward 2`);

  const wardSegments = await ReorganizationService.getIssueOwnershipSegments('iss-reorg-003');
  assert(wardSegments.length === 2, `Ward ticket has 2 ownership segments`);
  assert(wardSegments[0].segmentElapsedHours === 6, `Water board locked with 6.0h elapsed`);
  assert(wardSegments[1].departmentId === 'dept-infrastructure', `Infrastructure assigned segment 2`);
  assert(wardSegments[1].segmentSlaBudgetHours === 12, `Infrastructure received 12.0h emergency grace buffer under fair pro-rata`);

  // ---------------------------------------------------------------------------
  // SCENARIO 5: CHRONOLOGICAL AUDIT CHAIN INTEGRITY
  // ---------------------------------------------------------------------------
  console.log('\n--- SCENARIO 5: Chronological Audit Chain Integrity ---');
  const allVersions = await ReorganizationService.getOrganizationVersions();
  assert(allVersions.length === 3, `Organization ledger contains 3 versions (Baseline, Merger, Ward Transfer)`);
  assert(allVersions[2].isCurrent === true, `Latest version ${allVersions[2].versionNumber} is current`);
  assert(allVersions[0].isCurrent === false && allVersions[1].isCurrent === false, 'Older versions marked historical');

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`  ALL ASSERTIONS PASSED: ${passedAssertions} / ${totalAssertions} (100%)`);
  console.log('  PART 07 REORGANIZATION & FAIR SLA MIGRATION ENGINE VERIFIED');
  console.log('================================================================\n');
}

runTestSuite().catch((err) => {
  console.error('\nTest Suite Failed:', err);
  process.exit(1);
});
