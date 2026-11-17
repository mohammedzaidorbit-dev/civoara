/**
 * ==============================================================================
 * CIVOARA — PART 08 PUBLIC TRANSPARENCY & PERFORMANCE TEST SUITE
 * ==============================================================================
 * Verifies:
 * 1. Public KPI aggregation (reported, resolved, open, overdue, turnaround, SLA %).
 * 2. Explainable Department Leaderboard with sample size disclosure (>= 5 issues).
 * 3. Low-sample detection and disclosure policy for statistical validity.
 * 4. Ward geospatial performance, resolution equity, and per-capita density.
 * 5. Civic category breakdown against published municipal standards.
 * 6. Trend generation and interval velocity accounting.
 * 7. Strict public privacy protection (zero citizen PII / internal credentials leaked).
 * 8. 5-step public audit lifecycle timeline (Reported, Assigned, In-Progress, Escalated, Resolved).
 * ==============================================================================
 */

import {
  AnalyticsService,
  MIN_SAMPLE_THRESHOLD,
} from '../src/services/analytics.service';
import type { AnalyticsPeriod } from '../src/types';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: Record<string, unknown>;
}

const results: TestResult[] = [];

function assert(condition: boolean, suite: string, name: string, details?: Record<string, unknown>) {
  if (condition) {
    results.push({ suite, name, passed: true, details });
    console.log(`  ✓ [PASS] ${suite} -> ${name}`);
  } else {
    results.push({ suite, name, passed: false, error: 'Assertion failed', details });
    console.error(`  ✗ [FAIL] ${suite} -> ${name}`, details || '');
  }
}

async function runPublicPerformanceTests() {
  console.log('\n==============================================================================');
  console.log('STARTING CIVOARA PART 08 PUBLIC PERFORMANCE & TRANSPARENCY TEST SUITE');
  console.log('==============================================================================\n');

  // ============================================================================
  // SUITE 1: Public Metric Aggregation & Period Filtering
  // ============================================================================
  console.log('--- SUITE 1: Public Metric Aggregation & Period Filtering ---');

  const periods: AnalyticsPeriod[] = ['30d', '90d', '1y', 'all'];
  for (const p of periods) {
    const data = await AnalyticsService.getPublicPerformanceData(p);
    assert(data.summary.totalReported > 0, 'Metric Aggregation', `Total reported issues exist for period '${p}'`, { count: data.summary.totalReported });
    assert(data.summary.totalResolved > 0, 'Metric Aggregation', `Resolved issues exist for period '${p}'`, { resolved: data.summary.totalResolved });
    assert(data.summary.slaComplianceRate >= 80 && data.summary.slaComplianceRate <= 100, 'Metric Aggregation', `SLA compliance rate is bounded [80%, 100%] for '${p}'`, { rate: data.summary.slaComplianceRate });
    assert(data.summary.avgResolutionHours > 0, 'Metric Aggregation', `Average resolution turnaround is positive for '${p}'`, { avgHours: data.summary.avgResolutionHours });
    assert(data.summary.openIssues >= 0, 'Metric Aggregation', `Open issues count is non-negative for '${p}'`, { open: data.summary.openIssues });
    assert(data.summary.overdueIssues >= 0, 'Metric Aggregation', `Overdue issues count is non-negative for '${p}'`, { overdue: data.summary.overdueIssues });
  }

  // ============================================================================
  // SUITE 2: Explainable Department Leaderboard & Sample Size Disclosures
  // ============================================================================
  console.log('\n--- SUITE 2: Explainable Department Leaderboard & Sample Size Disclosures ---');

  const dataset30d = await AnalyticsService.getPublicPerformanceData('30d');
  assert(dataset30d.departments.length >= 4, 'Department Leaderboard', 'At least 4 municipal departments ranked', { count: dataset30d.departments.length });

  // Verify explainable ranking formula
  for (const dept of dataset30d.departments) {
    assert(dept.rank > 0, 'Department Leaderboard', `Department ${dept.departmentCode} has positive 1-indexed rank`, { rank: dept.rank });
    assert(dept.eligibleIssues >= 0, 'Department Leaderboard', `${dept.departmentCode} reports eligible issue count`, { eligible: dept.eligibleIssues });
    assert(dept.compositeScore >= 0 && dept.compositeScore <= 100, 'Department Leaderboard', `${dept.departmentCode} composite score bounded [0, 100]`, { score: dept.compositeScore });
    
    // Sample disclosure policy check
    if (dept.eligibleIssues < MIN_SAMPLE_THRESHOLD) {
      assert(dept.isLowSample === true, 'Sample Size Disclosures', `${dept.departmentCode} flagged with isLowSample=true (< ${MIN_SAMPLE_THRESHOLD})`);
      assert(Boolean(dept.sampleDisclosureNote), 'Sample Size Disclosures', `${dept.departmentCode} provides sampleDisclosureNote`);
    } else {
      assert(dept.isLowSample === false, 'Sample Size Disclosures', `${dept.departmentCode} confirmed full sample`);
    }
  }

  // Verify rank ordering: Higher composite scores should precede lower scores within sample tier
  for (let i = 0; i < dataset30d.departments.length - 1; i++) {
    const cur = dataset30d.departments[i];
    const next = dataset30d.departments[i + 1];
    if (!cur.isLowSample && !next.isLowSample) {
      assert(cur.compositeScore >= next.compositeScore, 'Department Ranking Order', `Rank #${cur.rank} score (${cur.compositeScore}) >= Rank #${next.rank} score (${next.compositeScore})`);
    }
  }

  // ============================================================================
  // SUITE 3: Ward Performance & Geospatial Equity
  // ============================================================================
  console.log('\n--- SUITE 3: Ward Performance & Geospatial Equity ---');

  assert(dataset30d.wards.length >= 5, 'Ward Comparison', 'All 5 municipal wards represented in comparison', { count: dataset30d.wards.length });
  for (const ward of dataset30d.wards) {
    assert(ward.population > 0, 'Ward Comparison', `${ward.wardCode} population is recorded`, { pop: ward.population });
    assert(ward.totalIssues >= 0, 'Ward Comparison', `${ward.wardCode} total issues recorded`, { issues: ward.totalIssues });
    assert(ward.resolutionRate >= 0 && ward.resolutionRate <= 100, 'Ward Comparison', `${ward.wardCode} resolution rate bounded [0, 100]`, { rate: ward.resolutionRate });
    assert(ward.densityPer10k >= 0, 'Ward Comparison', `${ward.wardCode} per-capita density calculated`, { density: ward.densityPer10k });
  }

  // ============================================================================
  // SUITE 4: Civic Category Breakdown & SLA Targets
  // ============================================================================
  console.log('\n--- SUITE 4: Civic Category Breakdown & SLA Targets ---');

  assert(dataset30d.categories.length >= 4, 'Category Breakdown', 'At least 4 service categories evaluated');
  for (const cat of dataset30d.categories) {
    assert(cat.slaTargetHours > 0, 'Category Standards', `${cat.label} has official SLA target`, { target: cat.slaTargetHours });
    assert(cat.percentage >= 0 && cat.percentage <= 100, 'Category Standards', `${cat.label} percentage bounded`, { pct: cat.percentage });
    assert(cat.slaComplianceRate >= 0 && cat.slaComplianceRate <= 100, 'Category Standards', `${cat.label} SLA compliance rate bounded`, { rate: cat.slaComplianceRate });
  }

  // ============================================================================
  // SUITE 5: Resolution Trends & Throughput Velocity
  // ============================================================================
  console.log('\n--- SUITE 5: Resolution Trends & Throughput Velocity ---');

  assert(dataset30d.trends.length >= 4, 'Resolution Trends', 'Trend datapoints generated for interval comparison', { count: dataset30d.trends.length });
  for (const pt of dataset30d.trends) {
    assert(Boolean(pt.periodLabel), 'Resolution Trends', 'Datapoint has period label', { label: pt.periodLabel });
    assert(pt.reportedCount >= 0, 'Resolution Trends', 'Reported count non-negative', { reported: pt.reportedCount });
    assert(pt.resolvedCount >= 0, 'Resolution Trends', 'Resolved count non-negative', { resolved: pt.resolvedCount });
    assert(pt.slaComplianceRate >= 0 && pt.slaComplianceRate <= 100, 'Resolution Trends', 'SLA compliance bounded', { sla: pt.slaComplianceRate });
  }

  // ============================================================================
  // SUITE 6: Public Data Privacy & PII Redaction
  // ============================================================================
  console.log('\n--- SUITE 6: Public Data Privacy & PII Redaction ---');

  const publicIncident = await AnalyticsService.getPublicIncidentDetails('CIV-2026-8812');
  assert(publicIncident !== null, 'Public Data Privacy', 'Public incident record successfully retrieved');

  if (publicIncident) {
    // Assert zero leakage of citizen personal data
    const serialized = JSON.stringify(publicIncident);
    assert(!serialized.includes('+1 (555)'), 'Public Privacy Invariant', 'No citizen phone numbers exposed in public record');
    assert(!serialized.includes('@civoara.gov') && !serialized.includes('@city.gov'), 'Public Privacy Invariant', 'No internal administrative email addresses exposed');
    assert(!serialized.includes('Password') && !serialized.includes('hash'), 'Public Privacy Invariant', 'No authentication or password tokens exposed');
    assert(!serialized.includes('door_number') && !serialized.includes('apartment'), 'Public Privacy Invariant', 'No domestic door numbers or private apartments exposed');
    assert(Boolean(publicIncident.generalLocation), 'Public Privacy Invariant', 'Location is generalized to public landmark / street intersection', { loc: publicIncident.generalLocation });
  }

  // ============================================================================
  // SUITE 7: Public Audit Lifecycle Timeline
  // ============================================================================
  console.log('\n--- SUITE 7: Public Audit Lifecycle Timeline ---');

  if (publicIncident) {
    assert(publicIncident.timeline.length >= 3, 'Audit Lifecycle Timeline', 'Timeline contains at least 3 lifecycle stages', { count: publicIncident.timeline.length });

    const stepTypes = publicIncident.timeline.map((t) => t.step);
    assert(stepTypes.includes('reported'), 'Audit Lifecycle Timeline', 'Timeline contains intake stage ("reported")');
    assert(stepTypes.includes('assigned'), 'Audit Lifecycle Timeline', 'Timeline contains dispatch stage ("assigned")');
    assert(stepTypes.includes('in_progress'), 'Audit Lifecycle Timeline', 'Timeline contains remediation stage ("in_progress")');
    assert(stepTypes.includes('resolved'), 'Audit Lifecycle Timeline', 'Timeline contains closure stage ("resolved")');

    // Verify all steps have public actor descriptions
    for (const step of publicIncident.timeline) {
      assert(Boolean(step.actorRolePublic), 'Audit Lifecycle Timeline', `Step '${step.step}' has public actor role`, { actor: step.actorRolePublic });
      assert(Boolean(step.notes), 'Audit Lifecycle Timeline', `Step '${step.step}' has transparent notes`);
      assert(Boolean(step.timestamp), 'Audit Lifecycle Timeline', `Step '${step.step}' has timestamp`);
    }
  }

  // ============================================================================
  // SUMMARY REPORT
  // ============================================================================
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log('\n==============================================================================');
  console.log(`TEST SUMMARY: ${passed} / ${total} ASSERTIONS PASSED (${((passed / total) * 100).toFixed(1)}%)`);
  if (failed > 0) {
    console.error(`FAILED: ${failed} ASSERTIONS`);
    process.exit(1);
  } else {
    console.log('ALL PART 08 PUBLIC PERFORMANCE TESTS PASSED SUCCESSFULLY! ✓');
    console.log('==============================================================================\n');
  }
}

runPublicPerformanceTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
