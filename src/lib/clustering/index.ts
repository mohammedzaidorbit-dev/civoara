import {
  IncidentLocation,
  IncidentPriority,
  ClusteringConfig,
  ClusterMatchScore,
} from '@/types';

/**
 * Default clustering operational parameters.
 * Conservative thresholds prevent accidental false-positive merges.
 */
export const DEFAULT_CLUSTERING_CONFIG: ClusteringConfig = {
  matchingRadiusMeters: 50, // Strict 50-meter proximity radius
  maxTimeWindowHours: 72, // 72-hour window for active duplicates
  autoMergeThreshold: 0.85, // Conservative auto-merge confidence threshold (>= 85%)
  reviewThreshold: 0.6, // Flag for administrative triage (60% - 84%)
};

/**
 * Common English stopwords filtered during text similarity calculations
 */
const ENGLISH_STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below',
  'between', 'both', 'but', 'by', 'could', 'did', 'do', 'does', 'doing', 'down',
  'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having',
  'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i',
  'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most',
  'my', 'myself', 'near', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once',
  'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same',
  'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves',
  'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under',
  'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which',
  'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours', 'yourself',
  'yourselves', 'street', 'road', 'corner', 'lane', 'avenue', 'area',
]);

/**
 * Calculates great-circle distance between two geographic coordinates using Haversine formula (in meters)
 */
export function calculateDistanceInMeters(
  locA: IncidentLocation,
  locB: IncidentLocation
): number {
  const R = 6371e3; // Earth radius in meters
  const rad = Math.PI / 180;
  const phi1 = locA.latitude * rad;
  const phi2 = locB.latitude * rad;
  const deltaPhi = (locB.latitude - locA.latitude) * rad;
  const deltaLambda = (locB.longitude - locA.longitude) * rad;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 100) / 100;
}

/**
 * Checks whether two coordinates fall within the spatial clustering radius
 */
export function isWithinClusterRadius(
  locA: IncidentLocation,
  locB: IncidentLocation,
  thresholdMeters: number = DEFAULT_CLUSTERING_CONFIG.matchingRadiusMeters
): boolean {
  return calculateDistanceInMeters(locA, locB) <= thresholdMeters;
}

/**
 * Normalizes a word token with simple civic-friendly suffix stemming
 */
function stemWord(word: string): string {
  if (word === 'avenue' || word === 'ave') return 'ave';
  if (word === 'street' || word === 'st') return 'st';
  if (word === 'road' || word === 'rd') return 'rd';
  if (word.endsWith('ing') && word.length > 5) return word.slice(0, -3);
  if (word.endsWith('ies') && word.length > 5) return word.slice(0, -3) + 'y';
  if (word.endsWith('es') && word.length > 4) return word.slice(0, -2);
  if (word.endsWith('ed') && word.length > 4) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) return word.slice(0, -1);
  return word;
}

/**
 * Tokenizes text into a set of lowercased, stemmed word tokens
 */
export function tokenizeText(text: string): Set<string> {
  if (!text) return new Set();
  const normalized = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((w) => stemWord(w.trim()))
    .filter((w) => w.length > 1 && !ENGLISH_STOPWORDS.has(w));
  return new Set(normalized);
}

/**
 * Computes Dice-Sørensen text overlap similarity between two incident reports.
 * Dice Index = 2 * |A ∩ B| / (|A| + |B|)
 * More balanced than strict Jaccard when reports have asymmetric description lengths.
 */
export function calculateTextSimilarity(
  titleA: string,
  descA: string,
  titleB: string,
  descB: string
): number {
  const titleTokensA = tokenizeText(titleA);
  const titleTokensB = tokenizeText(titleB);
  const allTokensA = tokenizeText(`${titleA} ${descA}`);
  const allTokensB = tokenizeText(`${titleB} ${descB}`);

  if (allTokensA.size === 0 && allTokensB.size === 0) return 0.6;
  if (allTokensA.size === 0 || allTokensB.size === 0) return 0.3;

  // 1. Overall Combined Dice Similarity
  let combinedMatch = 0;
  for (const token of allTokensA) {
    if (allTokensB.has(token)) combinedMatch++;
  }
  const combinedScore = (2 * combinedMatch) / (allTokensA.size + allTokensB.size);

  // 2. Title Dice Similarity (higher semantic signal for incident type)
  let titleScore = 0;
  if (titleTokensA.size > 0 && titleTokensB.size > 0) {
    let titleMatch = 0;
    for (const token of titleTokensA) {
      if (titleTokensB.has(token)) titleMatch++;
    }
    titleScore = (2 * titleMatch) / (titleTokensA.size + titleTokensB.size);
  } else {
    titleScore = combinedScore;
  }

  // Blended text score: 50% title + 50% combined description
  const finalScore = 0.5 * titleScore + 0.5 * combinedScore;
  return Math.round(finalScore * 1000) / 1000;
}

export interface CandidateEvaluationInput {
  candidate: {
    id: string;
    ticketNumber?: string;
    category: string;
    wardId?: string;
    latitude: number;
    longitude: number;
    createdAt: string | Date;
    title: string;
    description: string;
    status?: string;
  };
  newReport: {
    category: string;
    wardId?: string;
    latitude: number;
    longitude: number;
    createdAt: string | Date;
    title: string;
    description: string;
  };
  config?: ClusteringConfig;
}

/**
 * Computes multi-dimensional confidence score for duplicate candidate clustering
 */
export function calculateClusteringConfidence(
  input: CandidateEvaluationInput
): ClusterMatchScore {
  const { candidate, newReport } = input;
  const config = input.config || DEFAULT_CLUSTERING_CONFIG;

  // 1. Strict Category Invariant: Different categories can NEVER merge
  if (candidate.category.toLowerCase() !== newReport.category.toLowerCase()) {
    return {
      confidence: 0,
      spatialScore: 0,
      textScore: 0,
      temporalScore: 0,
      distanceMeters: 0,
      timeDifferenceHours: 0,
      action: 'create_new',
      reason: `Category mismatch: '${newReport.category}' does not match candidate '${candidate.category}'`,
    };
  }

  // 2. Spatial Distance Calculation
  const distanceMeters = calculateDistanceInMeters(
    { latitude: candidate.latitude, longitude: candidate.longitude },
    { latitude: newReport.latitude, longitude: newReport.longitude }
  );

  // If outside matching radius, strictly reject merge
  if (distanceMeters > config.matchingRadiusMeters) {
    return {
      confidence: 0,
      spatialScore: 0,
      textScore: 0,
      temporalScore: 0,
      distanceMeters,
      timeDifferenceHours: 0,
      action: 'create_new',
      reason: `Spatial distance (${distanceMeters}m) exceeds cluster radius (${config.matchingRadiusMeters}m)`,
    };
  }

  // Spatial Score: 1.0 at 0m down to 0.6 at radius boundary (50m)
  const spatialScore =
    Math.round(
      (1.0 - 0.4 * (distanceMeters / config.matchingRadiusMeters)) * 1000
    ) / 1000;

  // 3. Ward Compatibility Check
  // If both have wards configured and they disagree, reject merge (cross-boundary protection)
  if (
    candidate.wardId &&
    newReport.wardId &&
    candidate.wardId !== newReport.wardId
  ) {
    return {
      confidence: 0,
      spatialScore,
      textScore: 0,
      temporalScore: 0,
      distanceMeters,
      timeDifferenceHours: 0,
      action: 'create_new',
      reason: `Ward incompatibility: Report ward (${newReport.wardId}) does not match candidate ward (${candidate.wardId})`,
    };
  }

  // 4. Temporal Difference Calculation
  const candTime = new Date(candidate.createdAt).getTime();
  const reportTime = new Date(newReport.createdAt).getTime();
  const diffHours = Math.abs(reportTime - candTime) / (1000 * 60 * 60);

  if (diffHours > config.maxTimeWindowHours) {
    return {
      confidence: 0,
      spatialScore,
      textScore: 0,
      temporalScore: 0,
      distanceMeters,
      timeDifferenceHours: Math.round(diffHours * 10) / 10,
      action: 'create_new',
      reason: `Elapsed time (${diffHours.toFixed(1)}h) exceeds cluster time window (${config.maxTimeWindowHours}h)`,
    };
  }

  // If candidate is already closed or resolved, do not merge into it
  if (candidate.status === 'resolved' || candidate.status === 'rejected') {
    return {
      confidence: 0,
      spatialScore,
      textScore: 0,
      temporalScore: 0,
      distanceMeters,
      timeDifferenceHours: Math.round(diffHours * 10) / 10,
      action: 'create_new',
      reason: `Candidate issue is already ${candidate.status}`,
    };
  }

  // Temporal Score: 1.0 at 0h down to 0.7 at window boundary
  const temporalScore =
    Math.round(
      (1.0 - 0.3 * (diffHours / config.maxTimeWindowHours)) * 1000
    ) / 1000;

  // 5. Text Similarity
  const textScore = calculateTextSimilarity(
    candidate.title,
    candidate.description,
    newReport.title,
    newReport.description
  );

  // 6. Composite Confidence Weighting:
  // 50% spatial proximity + 25% text similarity + 25% temporal recency
  const compositeConfidence =
    Math.round(
      (0.50 * spatialScore + 0.25 * textScore + 0.25 * temporalScore) * 1000
    ) / 1000;

  // 7. Threshold Decision
  let action: 'auto_merge' | 'needs_review' | 'create_new' = 'create_new';
  let reason = '';

  if (compositeConfidence >= config.autoMergeThreshold) {
    action = 'auto_merge';
    reason = `High composite confidence (${(compositeConfidence * 100).toFixed(1)}% >= ${(config.autoMergeThreshold * 100).toFixed(0)}%). Auto-merged into canonical issue.`;
  } else if (compositeConfidence >= config.reviewThreshold) {
    action = 'needs_review';
    reason = `Moderate composite confidence (${(compositeConfidence * 100).toFixed(1)}%). Flagged for administrative clustering review.`;
  } else {
    action = 'create_new';
    reason = `Confidence (${(compositeConfidence * 100).toFixed(1)}% < ${(config.reviewThreshold * 100).toFixed(0)}%) below threshold. Tracked as independent issue.`;
  }

  return {
    confidence: compositeConfidence,
    spatialScore,
    textScore,
    temporalScore,
    distanceMeters,
    timeDifferenceHours: Math.round(diffHours * 10) / 10,
    action,
    reason,
  };
}

/**
 * Calculates dynamically adjusted priority based on independent reporter count.
 * ANTI-INFLATION PROTECTION:
 * Only distinct, independent reporters can elevate ticket priority.
 * Repeated reports from the SAME citizen do not increment uniqueReporterCount and NEVER inflate priority.
 */
export function calculateDynamicPriority(
  basePriority: IncidentPriority,
  uniqueReporterCount: number
): IncidentPriority {
  // If only 1 independent citizen verified the report, keep base priority
  if (uniqueReporterCount <= 1) {
    return basePriority;
  }

  // Priority ladder
  const priorityOrder: IncidentPriority[] = ['low', 'medium', 'high', 'critical'];
  const currentIndex = priorityOrder.indexOf(basePriority);
  if (currentIndex === -1) return basePriority;

  // 2 - 3 independent citizens: boost priority by 1 tier
  if (uniqueReporterCount >= 2 && uniqueReporterCount <= 3) {
    const elevatedIndex = Math.min(currentIndex + 1, priorityOrder.length - 1);
    return priorityOrder[elevatedIndex];
  }

  // 4+ independent citizens: boost priority by 2 tiers (capped at critical)
  if (uniqueReporterCount >= 4) {
    const elevatedIndex = Math.min(currentIndex + 2, priorityOrder.length - 1);
    return priorityOrder[elevatedIndex];
  }

  return basePriority;
}
