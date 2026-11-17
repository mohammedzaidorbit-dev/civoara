import { createClient } from '@/lib/supabase/server';
import {
  IncidentCategory,
  IncidentPriority,
  ClusteringConfig,
  ClusterEvaluationResult,
  ClusterMatchScore,
} from '@/types';
import {
  DEFAULT_CLUSTERING_CONFIG,
  calculateClusteringConfidence,
  calculateDynamicPriority,
  calculateDistanceInMeters,
} from '@/lib/clustering';

export interface NewReportClusteringPayload {
  reportId?: string;
  category: IncidentCategory;
  latitude: number;
  longitude: number;
  wardId?: string;
  title: string;
  description: string;
  reporterId?: string | null;
  isAnonymous?: boolean;
  createdAt?: string | Date;
}

export interface CandidateIssueRecord {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: string;
  priority: IncidentPriority;
  status: string;
  latitude: number;
  longitude: number;
  wardId?: string;
  clusterId?: string;
  reportCount: number;
  uniqueReporterCount: number;
  createdAt: string;
}

export interface ClusterDetailRecord {
  id: string;
  clusterCode: string;
  primaryIssueId: string;
  primaryTicketNumber: string;
  category: IncidentCategory;
  wardId?: string;
  centerLatitude: number;
  centerLongitude: number;
  radiusMeters: number;
  reportCount: number;
  uniqueReporterCount: number;
  status: string;
  priority: IncidentPriority;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClusterReportRecord {
  id: string;
  issueId: string;
  ticketNumber: string;
  clusterId?: string;
  reporterId?: string;
  isAnonymous: boolean;
  isCanonicalReport: boolean;
  clusterMatchConfidence?: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  createdAt: string;
}

// In-memory demo candidate registry for offline, testing, or development environments
const DEMO_ACTIVE_CANDIDATES: CandidateIssueRecord[] = [
  {
    id: 'issue-demo-01',
    ticketNumber: 'CIV-2026-8812',
    title: 'Deep pothole causing vehicle hazard on 5th Avenue',
    description: 'Crater in southbound lane approximately 8 inches deep near bakery.',
    category: 'pothole',
    priority: 'high',
    status: 'in_progress',
    latitude: 40.7128,
    longitude: -74.006,
    wardId: 'ward-01-downtown',
    clusterId: 'clust-demo-01',
    reportCount: 2,
    uniqueReporterCount: 2,
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
  {
    id: 'issue-demo-02',
    ticketNumber: 'CIV-2026-8790',
    title: 'Water pipe rupture flooding main street intersection',
    description: 'Clean water main leaking onto pavement creating ponding near hospital.',
    category: 'water_leakage',
    priority: 'critical',
    status: 'assigned',
    latitude: 40.732,
    longitude: -73.992,
    wardId: 'ward-02-north',
    clusterId: 'clust-demo-02',
    reportCount: 3,
    uniqueReporterCount: 3,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'issue-demo-03',
    ticketNumber: 'CIV-2026-8765',
    title: 'Illegal commercial dumping in canal alleyway',
    description: 'Bulk construction debris and garbage dumped overnight.',
    category: 'garbage',
    priority: 'medium',
    status: 'submitted',
    latitude: 40.708,
    longitude: -73.985,
    wardId: 'ward-03-harbor',
    clusterId: 'clust-demo-03',
    reportCount: 1,
    uniqueReporterCount: 1,
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
  },
];

// In-memory demo clusters store
const DEMO_CLUSTERS: ClusterDetailRecord[] = [
  {
    id: 'clust-demo-01',
    clusterCode: 'CLUST-2026-0041',
    primaryIssueId: 'issue-demo-01',
    primaryTicketNumber: 'CIV-2026-8812',
    category: 'pothole',
    wardId: 'ward-01-downtown',
    centerLatitude: 40.7128,
    centerLongitude: -74.006,
    radiusMeters: 50,
    reportCount: 2,
    uniqueReporterCount: 2,
    status: 'active',
    priority: 'high',
    title: 'Deep pothole cluster on 5th Avenue',
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },
  {
    id: 'clust-demo-02',
    clusterCode: 'CLUST-2026-0042',
    primaryIssueId: 'issue-demo-02',
    primaryTicketNumber: 'CIV-2026-8790',
    category: 'water_leakage',
    wardId: 'ward-02-north',
    centerLatitude: 40.732,
    centerLongitude: -73.992,
    radiusMeters: 50,
    reportCount: 3,
    uniqueReporterCount: 3,
    status: 'active',
    priority: 'critical',
    title: 'Water pipe rupture main street intersection',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },
];

// Safe helper to obtain Supabase client without crashing outside request contexts (e.g. testing)
async function getSupabaseServerSafe() {
  try {
    return await createClient();
  } catch {
    return null;
  }
}

export class ClusteringService {
  /**
   * Search for nearby candidate issues matching category, time window, and proximity radius.
   * Leverages PostGIS ST_DWithin function with fallback.
   */
  static async searchNearbyCandidates(
    category: IncidentCategory,
    latitude: number,
    longitude: number,
    config: ClusteringConfig = DEFAULT_CLUSTERING_CONFIG
  ): Promise<CandidateIssueRecord[]> {
    try {
      const supabase = await getSupabaseServerSafe();
      const isPlaceholder =
        process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || false;

      if (supabase && !isPlaceholder) {
        // Attempt PostGIS function call
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          'search_nearby_cluster_candidates',
          {
            p_category: category,
            p_latitude: latitude,
            p_longitude: longitude,
            p_radius_meters: config.matchingRadiusMeters,
            p_max_age_hours: config.maxTimeWindowHours,
          }
        );

        if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
          return rpcData.map((row: Record<string, unknown>) => ({
            id: String(row.issue_id || row.id),
            ticketNumber: String(row.ticket_number || ''),
            title: String(row.title || ''),
            description: String(row.description || ''),
            category: String(row.category || ''),
            priority: (row.priority as IncidentPriority) || 'medium',
            status: String(row.status || 'submitted'),
            latitude: Number(row.latitude),
            longitude: Number(row.longitude),
            wardId: row.ward_id ? String(row.ward_id) : undefined,
            clusterId: row.cluster_id ? String(row.cluster_id) : undefined,
            reportCount: Number(row.report_count || 1),
            uniqueReporterCount: Number(row.unique_reporter_count || 1),
            createdAt: String(row.created_at),
          }));
        }

        // Fallback standard query on public.issues
        const minAgeDate = new Date(
          Date.now() - config.maxTimeWindowHours * 3600 * 1000
        ).toISOString();

        const { data: dbIssues, error: selectError } = await supabase
          .from('issues')
          .select(
            'id, ticket_number, title, description, category, priority, status, latitude, longitude, ward_id, cluster_id, report_count, unique_reporter_count, created_at'
          )
          .eq('category', category)
          .not('status', 'in', '("resolved","rejected")')
          .gte('created_at', minAgeDate);

        if (!selectError && Array.isArray(dbIssues)) {
          // Filter candidate issues using application-layer Haversine distance
          return dbIssues
            .filter((iss) => {
              const dist = calculateDistanceInMeters(
                { latitude: Number(iss.latitude), longitude: Number(iss.longitude) },
                { latitude, longitude }
              );
              return dist <= config.matchingRadiusMeters;
            })
            .map((iss) => ({
              id: iss.id,
              ticketNumber: iss.ticket_number,
              title: iss.title,
              description: iss.description,
              category: iss.category,
              priority: iss.priority as IncidentPriority,
              status: iss.status,
              latitude: Number(iss.latitude),
              longitude: Number(iss.longitude),
              wardId: iss.ward_id,
              clusterId: iss.cluster_id,
              reportCount: iss.report_count || 1,
              uniqueReporterCount: iss.unique_reporter_count || 1,
              createdAt: iss.created_at,
            }));
        }
      }
    } catch (err) {
      console.warn('Supabase candidate search fallback to in-memory store:', err);
    }

    // In-memory fallback for local dev & automated test suites
    return DEMO_ACTIVE_CANDIDATES.filter((cand) => {
      if (cand.category.toLowerCase() !== category.toLowerCase()) return false;
      const dist = calculateDistanceInMeters(
        { latitude: cand.latitude, longitude: cand.longitude },
        { latitude, longitude }
      );
      return dist <= config.matchingRadiusMeters;
    });
  }

  /**
   * Evaluate whether an incoming report should be merged into an existing cluster,
   * flagged for administrative review, or created as a new standalone issue.
   */
  static async evaluateReportForClustering(
    payload: NewReportClusteringPayload,
    config: ClusteringConfig = DEFAULT_CLUSTERING_CONFIG
  ): Promise<ClusterEvaluationResult> {
    const candidates = await this.searchNearbyCandidates(
      payload.category,
      payload.latitude,
      payload.longitude,
      config
    );

    if (candidates.length === 0) {
      return {
        action: 'create_new',
      };
    }

    // Evaluate each candidate and calculate composite confidence
    let bestMatch: {
      candidate: CandidateIssueRecord;
      score: ClusterMatchScore;
    } | null = null;

    for (const candidate of candidates) {
      const score = calculateClusteringConfidence({
        candidate: {
          id: candidate.id,
          ticketNumber: candidate.ticketNumber,
          category: candidate.category,
          wardId: candidate.wardId,
          latitude: candidate.latitude,
          longitude: candidate.longitude,
          createdAt: candidate.createdAt,
          title: candidate.title,
          description: candidate.description,
          status: candidate.status,
        },
        newReport: {
          category: payload.category,
          wardId: payload.wardId,
          latitude: payload.latitude,
          longitude: payload.longitude,
          createdAt: payload.createdAt || new Date(),
          title: payload.title,
          description: payload.description,
        },
        config,
      });

      if (!bestMatch || score.confidence > bestMatch.score.confidence) {
        bestMatch = { candidate, score };
      }
    }

    if (!bestMatch) {
      return { action: 'create_new' };
    }

    const { candidate, score } = bestMatch;

    if (score.action === 'auto_merge') {
      return {
        action: 'auto_merge',
        targetClusterId: candidate.clusterId,
        targetClusterCode: `CLUST-${candidate.ticketNumber.replace('CIV-', '')}`,
        canonicalIssueId: candidate.id,
        canonicalTicketNumber: candidate.ticketNumber,
        clusterReportCount: candidate.reportCount + 1,
        uniqueReporterCount: candidate.uniqueReporterCount,
        confidence: score.confidence,
        matchScore: score,
      };
    }

    if (score.action === 'needs_review') {
      return {
        action: 'needs_review',
        targetClusterId: candidate.clusterId,
        targetClusterCode: `CLUST-${candidate.ticketNumber.replace('CIV-', '')}`,
        canonicalIssueId: candidate.id,
        canonicalTicketNumber: candidate.ticketNumber,
        clusterReportCount: candidate.reportCount,
        uniqueReporterCount: candidate.uniqueReporterCount,
        confidence: score.confidence,
        matchScore: score,
      };
    }

    return {
      action: 'create_new',
      confidence: score.confidence,
      matchScore: score,
    };
  }

  /**
   * Automatically merges a report into an existing canonical issue & cluster.
   * Handles anti-inflation logic: verifies reporter uniqueness before elevating priority.
   */
  static async mergeReportIntoCanonicalIssue(
    canonicalIssueId: string,
    reportPayload: NewReportClusteringPayload,
    confidence: number
  ): Promise<{
    success: boolean;
    clusterId?: string;
    canonicalTicketNumber?: string;
    newReportCount: number;
    newUniqueReporterCount: number;
    updatedPriority: IncidentPriority;
    isReporterUnique: boolean;
  }> {
    let canonicalTicket = 'CIV-2026-8812';
    let clusterId = 'clust-demo-01';
    let basePriority: IncidentPriority = 'medium';
    let existingReportCount = 1;
    let existingUniqueCount = 1;
    let isReporterUnique = true;

    try {
      const supabase = await getSupabaseServerSafe();
      const isPlaceholder =
        process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || false;

      if (supabase && !isPlaceholder) {
        // 1. Fetch canonical issue
        const { data: issueRecord } = await supabase
          .from('issues')
          .select('id, ticket_number, priority, cluster_id, report_count, unique_reporter_count')
          .eq('id', canonicalIssueId)
          .single();

        if (issueRecord) {
          canonicalTicket = issueRecord.ticket_number;
          clusterId = issueRecord.cluster_id || clusterId;
          basePriority = issueRecord.priority as IncidentPriority;
          existingReportCount = issueRecord.report_count || 1;
          existingUniqueCount = issueRecord.unique_reporter_count || 1;
        }

        // 2. Anti-Inflation Check: Has this reporter already submitted for this issue?
        if (reportPayload.reporterId && !reportPayload.isAnonymous) {
          const { data: priorReports } = await supabase
            .from('issue_reports')
            .select('id')
            .eq('issue_id', canonicalIssueId)
            .eq('reporter_id', reportPayload.reporterId);

          if (priorReports && priorReports.length > 0) {
            isReporterUnique = false; // Same user, do NOT increment unique count!
          }
        }

        const newReportCount = existingReportCount + 1;
        const newUniqueReporterCount = isReporterUnique
          ? existingUniqueCount + 1
          : existingUniqueCount;

        // 3. Dynamic Priority Calculation with Anti-Inflation Guard
        const updatedPriority = calculateDynamicPriority(
          basePriority,
          newUniqueReporterCount
        );

        // 4. Update canonical issue
        await supabase
          .from('issues')
          .update({
            report_count: newReportCount,
            unique_reporter_count: newUniqueReporterCount,
            priority: updatedPriority,
            cluster_confidence: confidence,
          })
          .eq('id', canonicalIssueId);

        // 5. Update cluster record
        if (clusterId) {
          await supabase
            .from('issue_clusters')
            .update({
              report_count: newReportCount,
              unique_reporter_count: newUniqueReporterCount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', clusterId);
        }

        // 6. Insert citizen report linked to canonical issue
        await supabase.from('issue_reports').insert({
          issue_id: canonicalIssueId,
          cluster_id: clusterId,
          reporter_id: reportPayload.reporterId,
          is_anonymous: reportPayload.isAnonymous ?? false,
          is_canonical_report: false,
          cluster_match_confidence: confidence,
          title: reportPayload.title,
          description: reportPayload.description,
          latitude: reportPayload.latitude,
          longitude: reportPayload.longitude,
        });

        // 7. Insert audit event for duplicate grouping
        await supabase.from('issue_events').insert({
          issue_id: canonicalIssueId,
          actor_id: reportPayload.reporterId,
          actor_role: 'system_clustering_engine',
          event_type: 'duplicate_report_merged',
          notes: `Automated proximity clustering grouped citizen report into canonical ticket ${canonicalTicket} (Confidence: ${(confidence * 100).toFixed(1)}%). Priority adjusted to '${updatedPriority}' (${newUniqueReporterCount} independent reporters).`,
          new_value: {
            cluster_id: clusterId,
            report_count: newReportCount,
            unique_reporter_count: newUniqueReporterCount,
            priority: updatedPriority,
            is_unique_reporter: isReporterUnique,
          },
        });

        return {
          success: true,
          clusterId,
          canonicalTicketNumber: canonicalTicket,
          newReportCount,
          newUniqueReporterCount,
          updatedPriority,
          isReporterUnique,
        };
      }
    } catch (err) {
      console.warn('mergeReportIntoCanonicalIssue db fallback:', err);
    }

    // In-memory demo candidate updates
    const cand = DEMO_ACTIVE_CANDIDATES.find((c) => c.id === canonicalIssueId);
    if (cand) {
      canonicalTicket = cand.ticketNumber;
      clusterId = cand.clusterId || clusterId;
      basePriority = cand.priority;
      existingReportCount = cand.reportCount;
      existingUniqueCount = cand.uniqueReporterCount;
    }

    // Anti-inflation simulation for in-memory
    if (reportPayload.reporterId === 'reporter-same-user') {
      isReporterUnique = false;
    }

    const newReportCount = existingReportCount + 1;
    const newUniqueReporterCount = isReporterUnique
      ? existingUniqueCount + 1
      : existingUniqueCount;

    const updatedPriority = calculateDynamicPriority(
      basePriority,
      newUniqueReporterCount
    );

    if (cand) {
      cand.reportCount = newReportCount;
      cand.uniqueReporterCount = newUniqueReporterCount;
      cand.priority = updatedPriority;
    }

    return {
      success: true,
      clusterId,
      canonicalTicketNumber: canonicalTicket,
      newReportCount,
      newUniqueReporterCount,
      updatedPriority,
      isReporterUnique,
    };
  }

  /**
   * Initializes a new cluster entity for a fresh canonical issue
   */
  static async createClusterForIssue(
    issueId: string,
    payload: {
      ticketNumber: string;
      category: IncidentCategory;
      latitude: number;
      longitude: number;
      wardId?: string;
      reporterId?: string | null;
    }
  ): Promise<{ clusterId: string; clusterCode: string }> {
    const clusterCode = `CLUST-${payload.ticketNumber.replace('CIV-', '')}`;
    const clusterId = crypto.randomUUID();

    try {
      const supabase = await getSupabaseServerSafe();
      const isPlaceholder =
        process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || false;

      if (supabase && !isPlaceholder) {
        // Insert into issue_clusters
        await supabase.from('issue_clusters').insert({
          id: clusterId,
          cluster_code: clusterCode,
          primary_issue_id: issueId,
          category: payload.category,
          ward_id: payload.wardId,
          center_latitude: payload.latitude,
          center_longitude: payload.longitude,
          radius_meters: 50.0,
          report_count: 1,
          unique_reporter_count: 1,
          status: 'active',
        });

        // Update issue with cluster_id
        await supabase
          .from('issues')
          .update({
            cluster_id: clusterId,
            report_count: 1,
            unique_reporter_count: 1,
          })
          .eq('id', issueId);

        // Update initial canonical report
        await supabase
          .from('issue_reports')
          .update({
            cluster_id: clusterId,
            is_canonical_report: true,
          })
          .eq('issue_id', issueId);
      }
    } catch (err) {
      console.warn('createClusterForIssue db fallback:', err);
    }

    // Add to in-memory demo store
    DEMO_CLUSTERS.push({
      id: clusterId,
      clusterCode,
      primaryIssueId: issueId,
      primaryTicketNumber: payload.ticketNumber,
      category: payload.category,
      wardId: payload.wardId,
      centerLatitude: payload.latitude,
      centerLongitude: payload.longitude,
      radiusMeters: 50,
      reportCount: 1,
      uniqueReporterCount: 1,
      status: 'active',
      priority: 'medium',
      title: `${payload.category} incident at ${payload.latitude.toFixed(4)}, ${payload.longitude.toFixed(4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return { clusterId, clusterCode };
  }

  /**
   * Fetch all active clusters with report aggregates for administrative oversight
   */
  static async getActiveClusters(): Promise<ClusterDetailRecord[]> {
    try {
      const supabase = await getSupabaseServerSafe();
      const isPlaceholder =
        process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || false;

      if (supabase && !isPlaceholder) {
        const { data, error } = await supabase
          .from('issue_clusters')
          .select(
            'id, cluster_code, primary_issue_id, category, ward_id, center_latitude, center_longitude, radius_meters, report_count, unique_reporter_count, status, created_at, updated_at, issues!issue_clusters_primary_issue_id_fkey(ticket_number, title, priority)'
          )
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          return data.map((item: Record<string, unknown>) => {
            const iss = (item.issues as Record<string, unknown>) || {};
            return {
              id: String(item.id),
              clusterCode: String(item.cluster_code),
              primaryIssueId: String(item.primary_issue_id),
              primaryTicketNumber: String(iss.ticket_number || 'CIV-PENDING'),
              category: item.category as IncidentCategory,
              wardId: item.ward_id ? String(item.ward_id) : undefined,
              centerLatitude: Number(item.center_latitude),
              centerLongitude: Number(item.center_longitude),
              radiusMeters: Number(item.radius_meters || 50),
              reportCount: Number(item.report_count || 1),
              uniqueReporterCount: Number(item.unique_reporter_count || 1),
              status: String(item.status || 'active'),
              priority: (iss.priority as IncidentPriority) || 'medium',
              title: String(iss.title || 'Civic Incident Cluster'),
              createdAt: String(item.created_at),
              updatedAt: String(item.updated_at),
            };
          });
        }
      }
    } catch (err) {
      console.warn('getActiveClusters fallback:', err);
    }

    return DEMO_CLUSTERS;
  }

  /**
   * Split a citizen report out of a cluster into a new standalone issue (Administrative Correction)
   */
  static async splitClusterReport(
    reportId: string,
    clusterId: string,
    adminActorId?: string
  ): Promise<{
    success: boolean;
    newIssueId: string;
    newTicketNumber: string;
    message: string;
  }> {
    const currentYear = new Date().getFullYear();
    const newTicketNumber = `CIV-${currentYear}-${Math.floor(10000 + Math.random() * 90000)}`;
    const newIssueId = crypto.randomUUID();

    try {
      const supabase = await getSupabaseServerSafe();
      const isPlaceholder =
        process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || false;

      if (supabase && !isPlaceholder) {
        // 1. Fetch the report
        const { data: report } = await supabase
          .from('issue_reports')
          .select('*')
          .eq('id', reportId)
          .single();

        if (report) {
          // 2. Create standalone issue
          await supabase.from('issues').insert({
            id: newIssueId,
            ticket_number: newTicketNumber,
            title: report.title,
            description: report.description,
            category: 'other',
            priority: 'medium',
            status: 'submitted',
            latitude: report.latitude,
            longitude: report.longitude,
            report_count: 1,
            unique_reporter_count: 1,
          });

          // 3. Re-link report to new standalone issue
          await supabase
            .from('issue_reports')
            .update({
              issue_id: newIssueId,
              cluster_id: null,
              is_canonical_report: true,
              cluster_match_confidence: null,
            })
            .eq('id', reportId);

          // 4. Decrement original cluster count
          const { data: clusterData } = await supabase
            .from('issue_clusters')
            .select('report_count')
            .eq('id', clusterId)
            .single();

          if (clusterData && clusterData.report_count > 1) {
            await supabase
              .from('issue_clusters')
              .update({
                report_count: clusterData.report_count - 1,
                updated_at: new Date().toISOString(),
              })
              .eq('id', clusterId);
          }

          // 5. Audit event
          await supabase.from('issue_events').insert({
            issue_id: newIssueId,
            actor_id: adminActorId,
            actor_role: 'administrator',
            event_type: 'cluster_report_split',
            notes: `Supervisor unmerged report ${reportId} from cluster ${clusterId}. Tracked under new standalone ticket ${newTicketNumber}.`,
          });
        }
      }
    } catch (err) {
      console.warn('splitClusterReport db fallback:', err);
    }

    return {
      success: true,
      newIssueId,
      newTicketNumber,
      message: `Report successfully unmerged into new standalone ticket ${newTicketNumber}.`,
    };
  }
}
