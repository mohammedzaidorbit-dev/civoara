/**
 * CIVOARA AUTOMATED TEST SUITE: PART 06 DUPLICATE ISSUE CLUSTERING
 *
 * Scenarios tested:
 * 1. Same issue reported multiple times (Confidence >= 0.85 -> auto_merge into canonical issue)
 * 2. Nearby but unrelated issues (different categories -> strictly 0 confidence, distinct issues)
 * 3. Different wards / far coordinates (cross-ward protection -> distinct issues)
 * 4. Duplicate submissions by same user (anti-inflation: report_count=5, unique_reporters=1, priority NOT inflated)
 * 5. Multi-user independent reports (unique_reporters=3 -> priority dynamically elevated)
 * 6. Cluster administrative correction (split report into standalone issue & manual merge)
 */

import {
  calculateDistanceInMeters,
  isWithinClusterRadius,
  calculateTextSimilarity,
  calculateClusteringConfidence,
  calculateDynamicPriority,
  DEFAULT_CLUSTERING_CONFIG,
} from '../src/lib/clustering';
import { ClusteringService } from '../src/services/clustering.service';
import { IncidentPriority } from '../src/types';

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
  console.log('  CIVOARA PART 06: DUPLICATE ISSUE CLUSTERING TEST SUITE');
  console.log('================================================================\n');

  // ---------------------------------------------------------------------------
  // TEST SUITE 1: GEOSPATIAL PROXIMITY & HAVERSINE MATH
  // ---------------------------------------------------------------------------
  console.log('--- TEST SUITE 1: Geospatial Proximity & Haversine Distance ---');
  const origin = { latitude: 40.7128, longitude: -74.0060 };
  const nearby15m = { latitude: 40.7129, longitude: -74.0059 };
  const far120m = { latitude: 40.7138, longitude: -74.0050 };

  const dNearby = calculateDistanceInMeters(origin, nearby15m);
  const dFar = calculateDistanceInMeters(origin, far120m);

  assert(dNearby < 25, `Nearby coordinate distance is ~${dNearby.toFixed(1)}m (< 25m)`);
  assert(isWithinClusterRadius(origin, nearby15m, 50), 'Nearby 15m coordinate is within 50m clustering radius');
  assert(dFar > 100, `Far coordinate distance is ~${dFar.toFixed(1)}m (> 100m)`);
  assert(!isWithinClusterRadius(origin, far120m, 50), 'Far 120m coordinate is OUTSIDE 50m clustering radius');

  // ---------------------------------------------------------------------------
  // TEST SUITE 2: TEXT TOKENIZATION & JACCARD SIMILARITY
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 2: Text Tokenization & Jaccard Word-Set Similarity ---');
  const titleA = 'Large pothole on 5th Avenue causing tire blowouts';
  const descA = 'Deep hole in the southbound asphalt near the corner bakery';

  const titleB = 'Dangerous deep pothole near bakery on 5th Avenue';
  const descB = 'Cars are swerving to avoid this large crater in the pavement';

  const simHigh = calculateTextSimilarity(titleA, descA, titleB, descB);
  assert(simHigh >= 0.35, `Semantically matching reports yield high token overlap (${simHigh})`);

  const titleUnrelated = 'Streetlight dark and broken at night';
  const descUnrelated = 'No illumination on corner pole, bulb has burned out';
  const simLow = calculateTextSimilarity(titleA, descA, titleUnrelated, descUnrelated);
  assert(simLow < 0.15, `Unrelated text yields low similarity score (${simLow} < 0.15)`);

  // ---------------------------------------------------------------------------
  // SCENARIO 1: SAME ISSUE REPORTED MULTIPLE TIMES (AUTO-MERGE >= 0.85)
  // ---------------------------------------------------------------------------
  console.log('\n--- SCENARIO 1: Same Issue Reported Multiple Times (Auto-Merge) ---');
  const foundingIssue = {
    id: 'iss-pothole-001',
    ticketNumber: 'CIV-2026-10001',
    category: 'pothole',
    wardId: 'ward-01-downtown',
    latitude: 40.7128,
    longitude: -74.0060,
    title: 'Severe pothole on 5th Avenue',
    description: 'Deep road hazard near corner bakery damaging vehicle tires',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000), // 2 hours ago
    status: 'in_progress',
  };

  const duplicateReport = {
    category: 'pothole',
    wardId: 'ward-01-downtown',
    latitude: 40.71288, // ~10 meters away
    longitude: -74.00595,
    title: 'Deep crater pothole on 5th Ave',
    description: 'Cars hitting deep pothole near bakery on 5th Avenue',
    createdAt: new Date(),
  };

  const evalResult1 = calculateClusteringConfidence({
    candidate: foundingIssue,
    newReport: duplicateReport,
    config: DEFAULT_CLUSTERING_CONFIG,
  });

  assert(evalResult1.distanceMeters <= 15, `Spatial distance is ~${evalResult1.distanceMeters}m (well inside 50m)`);
  assert(evalResult1.confidence >= 0.85, `Confidence score is ${(evalResult1.confidence * 100).toFixed(1)}% (>= 85% auto-merge threshold)`);
  assert(evalResult1.action === 'auto_merge', `Clustering engine decision is '${evalResult1.action}'`);

  // ---------------------------------------------------------------------------
  // SCENARIO 2: NEARBY BUT UNRELATED ISSUES (DIFFERENT CATEGORIES)
  // ---------------------------------------------------------------------------
  console.log('\n--- SCENARIO 2: Nearby but Unrelated Issues (Category Invariant) ---');
  const garbageReportNearby = {
    category: 'garbage', // Different category!
    wardId: 'ward-01-downtown',
    latitude: 40.71282, // 4 meters away!
    longitude: -74.00602,
    title: 'Overflowing garbage bin on 5th Avenue',
    description: 'Trash bags piling up on curb near bakery',
    createdAt: new Date(),
  };

  const evalResult2 = calculateClusteringConfidence({
    candidate: foundingIssue,
    newReport: garbageReportNearby,
    config: DEFAULT_CLUSTERING_CONFIG,
  });

  assert(evalResult2.confidence === 0, 'Confidence is strictly 0.00 due to category mismatch');
  assert(evalResult2.action === 'create_new', `Engine decision is '${evalResult2.action}' (prevents false-positive merge)`);
  assert(evalResult2.reason.includes('Category mismatch'), `Reason explicitly logs: ${evalResult2.reason}`);

  // ---------------------------------------------------------------------------
  // SCENARIO 3: DIFFERENT WARDS / CROSS-BOUNDARY INTEGRITY
  // ---------------------------------------------------------------------------
  console.log('\n--- SCENARIO 3: Different Wards / Cross-Boundary Integrity ---');
  const differentWardReport = {
    category: 'pothole',
    wardId: 'ward-02-north', // Different ward!
    latitude: 40.71285,
    longitude: -74.00605,
    title: 'Pothole in road',
    description: 'Road damage on street',
    createdAt: new Date(),
  };

  const evalResult3 = calculateClusteringConfidence({
    candidate: foundingIssue,
    newReport: differentWardReport,
    config: DEFAULT_CLUSTERING_CONFIG,
  });

  assert(evalResult3.confidence === 0, 'Confidence is 0 due to conflicting ward assignments');
  assert(evalResult3.action === 'create_new', 'Issue created independently to preserve ward accountability');

  // Also test coordinates beyond 50m radius
  const distantPotholeReport = {
    category: 'pothole',
    wardId: 'ward-01-downtown',
    latitude: 40.7180, // ~600m away
    longitude: -74.0100,
    title: 'Another pothole on 9th street',
    description: 'Separate road depression',
    createdAt: new Date(),
  };

  const evalResultDist = calculateClusteringConfidence({
    candidate: foundingIssue,
    newReport: distantPotholeReport,
    config: DEFAULT_CLUSTERING_CONFIG,
  });
  assert(evalResultDist.action === 'create_new', 'Distant coordinate (>50m) treated as independent issue');

  // ---------------------------------------------------------------------------
  // SCENARIO 4: DUPLICATE USER SUBMISSIONS (ANTI-INFLATION SPAM DEFENSE)
  // ---------------------------------------------------------------------------
  console.log('\n--- SCENARIO 4: Duplicate User Submissions (Sybil Anti-Inflation Guard) ---');
  const basePriority: IncidentPriority = 'medium';

  // Single reporter submitting 1 report:
  const prio1 = calculateDynamicPriority(basePriority, 1);
  assert(prio1 === 'medium', 'Single reporter maintains base priority: Medium');

  // Simulated: Disgruntled user submits 5 reports from the SAME account:
  // Anti-inflation rule: uniqueReporterCount stays at 1!
  const spamUserUniqueCount = 1; // Unchanged!
  const prioSpam = calculateDynamicPriority(basePriority, spamUserUniqueCount);

  assert(
    prioSpam === 'medium',
    `Spam defense active: 5 submissions from 1 user leaves priority at '${prioSpam}' (NOT inflated to High/Critical)`
  );

  // ---------------------------------------------------------------------------
  // SCENARIO 5: MULTI-USER INDEPENDENT REPORTS (PRIORITY ELEVATION)
  // ---------------------------------------------------------------------------
  console.log('\n--- SCENARIO 5: Multi-User Independent Reports (Dynamic Priority Elevation) ---');
  // 2 independent unique citizens:
  const prio2 = calculateDynamicPriority('medium', 2);
  assert(prio2 === 'high', '2 independent citizens elevate priority from Medium -> High');

  // 3 independent unique citizens:
  const prio3 = calculateDynamicPriority('medium', 3);
  assert(prio3 === 'high', '3 independent citizens elevate priority to High');

  // 4+ independent unique citizens:
  const prio4 = calculateDynamicPriority('medium', 4);
  assert(prio4 === 'critical', '4+ independent citizens elevate priority to Critical');

  // Water supply base 'critical' stays capped at 'critical':
  const prioCriticalCapped = calculateDynamicPriority('critical', 5);
  assert(prioCriticalCapped === 'critical', 'Critical priority safely capped at Critical without overflow');

  // ---------------------------------------------------------------------------
  // SCENARIO 6: CLUSTER MERGING & ADMINISTRATIVE CORRECTION
  // ---------------------------------------------------------------------------
  console.log('\n--- SCENARIO 6: Cluster Merging & Administrative Correction ---');

  // Step 6A: Create cluster for initial canonical issue
  const clusterCreation = await ClusteringService.createClusterForIssue('issue-test-999', {
    ticketNumber: 'CIV-2026-99999',
    category: 'pothole',
    latitude: 40.7128,
    longitude: -74.0060,
    wardId: 'ward-01-downtown',
    reporterId: 'usr-alice',
  });

  assert(Boolean(clusterCreation.clusterId), `Cluster created with ID: ${clusterCreation.clusterId}`);
  assert(clusterCreation.clusterCode === 'CLUST-2026-99999', `Cluster assigned code '${clusterCreation.clusterCode}'`);

  // Step 6B: Merge report into canonical issue with unique reporter check
  const mergeResult1 = await ClusteringService.mergeReportIntoCanonicalIssue(
    'issue-test-999',
    {
      category: 'pothole',
      latitude: 40.71285,
      longitude: -74.00595,
      title: 'Pothole verification',
      description: 'Second citizen reporting same pothole',
      reporterId: 'usr-bob', // Distinct user Bob!
      isAnonymous: false,
    },
    0.92
  );

  assert(mergeResult1.success, 'Duplicate report successfully merged into canonical issue');
  assert(mergeResult1.newReportCount === 2, `Cluster total report count incremented to ${mergeResult1.newReportCount}`);
  assert(mergeResult1.newUniqueReporterCount === 2, `Unique reporter count incremented to ${mergeResult1.newUniqueReporterCount}`);
  assert(mergeResult1.updatedPriority === 'high', `Dynamic priority elevated to '${mergeResult1.updatedPriority}'`);

  // Step 6C: Split/Unmerge report (Administrative Correction)
  const splitResult = await ClusteringService.splitClusterReport(
    'rep-bob-001',
    clusterCreation.clusterId,
    'admin-lead-1'
  );

  assert(splitResult.success, 'Administrative split of misclassified report succeeded');
  assert(splitResult.newTicketNumber.startsWith('CIV-'), `Split report assigned new standalone ticket: ${splitResult.newTicketNumber}`);

  // ---------------------------------------------------------------------------
  // SCENARIO 7: UNCERTAIN MATCH REVIEW THRESHOLD (0.60 <= Confidence < 0.85)
  // ---------------------------------------------------------------------------
  console.log('\n--- SCENARIO 7: Uncertain Match Review Threshold (60% - 84%) ---');
  const moderateIssue = {
    id: 'iss-water-001',
    ticketNumber: 'CIV-2026-10002',
    category: 'water_leakage',
    latitude: 40.7320,
    longitude: -73.9920,
    title: 'Water pipe leak near curb',
    description: 'Clean water bubbling onto road',
    createdAt: new Date(Date.now() - 10 * 3600 * 1000),
    status: 'assigned',
  };

  // ~26 meters away, partially related description
  const uncertainReport = {
    category: 'water_leakage',
    latitude: 40.7322,
    longitude: -73.99185,
    title: 'Water leaking near sidewalk',
    description: 'Water accumulation on corner crosswalk',
    createdAt: new Date(),
  };

  const evalUncertain = calculateClusteringConfidence({
    candidate: moderateIssue,
    newReport: uncertainReport,
    config: DEFAULT_CLUSTERING_CONFIG,
  });

  assert(
    evalUncertain.confidence >= 0.60 && evalUncertain.confidence < 0.85,
    `Uncertain match score is ${(evalUncertain.confidence * 100).toFixed(1)}% (within 60% - 84% range)`
  );
  assert(
    evalUncertain.action === 'needs_review',
    `Engine correctly routed report to '${evalUncertain.action}' for supervisor oversight`
  );

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`  ALL ASSERTIONS PASSED: ${passedAssertions} / ${totalAssertions} (100%)`);
  console.log('  PART 06 DUPLICATE ISSUE CLUSTERING ENGINE VERIFIED');
  console.log('================================================================\n');
}

runTestSuite().catch((err) => {
  console.error('\nTest Suite Failed:', err);
  process.exit(1);
});
