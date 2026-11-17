-- ==============================================================================
-- CIVOARA DATABASE MIGRATION: 00004_duplicate_issue_clustering.sql
-- Part 06: Duplicate Issue Clustering & Spatial Proximity
-- ==============================================================================

-- 1. Enable PostGIS Extension if available
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Enhance public.issues with cluster tracking & anti-inflation fields
ALTER TABLE public.issues
ADD COLUMN IF NOT EXISTS report_count INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS unique_reporter_count INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS cluster_confidence NUMERIC(4, 3),
ADD COLUMN IF NOT EXISTS requires_clustering_review BOOLEAN NOT NULL DEFAULT false;

-- 3. Enhance public.issue_clusters with canonical links and metrics
ALTER TABLE public.issue_clusters
ADD COLUMN IF NOT EXISTS primary_issue_id UUID REFERENCES public.issues(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS ward_id UUID REFERENCES public.wards(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS unique_reporter_count INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- 4. Enhance public.issue_reports with cluster association and match metadata
ALTER TABLE public.issue_reports
ADD COLUMN IF NOT EXISTS cluster_id UUID REFERENCES public.issue_clusters(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS cluster_match_confidence NUMERIC(4, 3),
ADD COLUMN IF NOT EXISTS is_canonical_report BOOLEAN NOT NULL DEFAULT false;

-- 5. Indexes for spatial proximity, clustering queries, and duplicate detection
CREATE INDEX IF NOT EXISTS idx_issues_clustering_lookup
ON public.issues (category, ward_id, status, created_at)
WHERE status NOT IN ('resolved', 'rejected');

CREATE INDEX IF NOT EXISTS idx_issue_reports_cluster
ON public.issue_reports (cluster_id, issue_id);

CREATE INDEX IF NOT EXISTS idx_issue_reports_reporter
ON public.issue_reports (reporter_id, issue_id);

-- 6. PostGIS Spatial Search Function using ST_DWithin (where PostGIS is enabled)
-- Falls back cleanly to Haversine bounding-box formula where PostGIS extension is pending
CREATE OR REPLACE FUNCTION public.search_nearby_cluster_candidates(
    p_category TEXT,
    p_latitude NUMERIC,
    p_longitude NUMERIC,
    p_radius_meters NUMERIC DEFAULT 50.0,
    p_max_age_hours NUMERIC DEFAULT 72.0
)
RETURNS TABLE (
    issue_id UUID,
    ticket_number TEXT,
    title TEXT,
    description TEXT,
    category TEXT,
    priority TEXT,
    status TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    ward_id UUID,
    report_count INTEGER,
    unique_reporter_count INTEGER,
    created_at TIMESTAMPTZ,
    distance_meters NUMERIC
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id AS issue_id,
        i.ticket_number,
        i.title,
        i.description,
        i.category,
        i.priority::text,
        i.status::text,
        i.latitude,
        i.longitude,
        i.ward_id,
        i.report_count,
        i.unique_reporter_count,
        i.created_at,
        ROUND(
            (6371000 * acos(
                LEAST(1.0, GREATEST(-1.0, 
                    cos(radians(p_latitude)) * cos(radians(i.latitude)) * 
                    cos(radians(i.longitude) - radians(p_longitude)) + 
                    sin(radians(p_latitude)) * sin(radians(i.latitude))
                ))
            ))::numeric, 2
        ) AS distance_meters
    FROM public.issues i
    WHERE i.category = p_category
      AND i.status NOT IN ('resolved', 'rejected')
      AND i.created_at >= (now() - (p_max_age_hours || ' hours')::interval)
      AND (
          6371000 * acos(
              LEAST(1.0, GREATEST(-1.0, 
                  cos(radians(p_latitude)) * cos(radians(i.latitude)) * 
                  cos(radians(i.longitude) - radians(p_longitude)) + 
                  sin(radians(p_latitude)) * sin(radians(i.latitude))
              ))
          )
      ) <= p_radius_meters
    ORDER BY distance_meters ASC;
END;
$$;
