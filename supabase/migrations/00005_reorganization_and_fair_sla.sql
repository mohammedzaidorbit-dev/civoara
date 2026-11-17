-- ==============================================================================
-- CIVOARA DATABASE MIGRATION: 00005_reorganization_and_fair_sla.sql
-- Part 07: Administrative Restructuring & Fair SLA Migration Engine
-- ==============================================================================

-- 1. Enhance public.organization_versions with structured change metadata
ALTER TABLE public.organization_versions
ADD COLUMN IF NOT EXISTS change_type TEXT NOT NULL DEFAULT 'general',
ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS migration_policy TEXT NOT NULL DEFAULT 'fair_pro_rata';

-- 2. Enhance public.ownership_segments with issue lifecycle and SLA metrics
ALTER TABLE public.ownership_segments
ADD COLUMN IF NOT EXISTS issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS assigned_officer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS organization_version_id UUID REFERENCES public.organization_versions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sla_policy_version TEXT NOT NULL DEFAULT 'v1.0-demo',
ADD COLUMN IF NOT EXISTS segment_sla_budget_hours NUMERIC(8, 2) NOT NULL DEFAULT 48.00,
ADD COLUMN IF NOT EXISTS segment_elapsed_hours NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS segment_outcome TEXT NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS transfer_reason TEXT;

-- 3. Enhance public.issues with active segment and historical tracking
ALTER TABLE public.issues
ADD COLUMN IF NOT EXISTS active_ownership_segment_id UUID REFERENCES public.ownership_segments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS organization_version_id UUID REFERENCES public.organization_versions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS accumulated_historical_elapsed_hours NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS migration_policy_applied TEXT DEFAULT 'fair_pro_rata',
ADD COLUMN IF NOT EXISTS is_transferred_reorganization BOOLEAN NOT NULL DEFAULT false;

-- 4. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_ownership_segments_issue
ON public.ownership_segments (issue_id, start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_ownership_segments_org_ver
ON public.ownership_segments (organization_version_id);

CREATE INDEX IF NOT EXISTS idx_org_versions_current
ON public.organization_versions (is_current);

CREATE INDEX IF NOT EXISTS idx_issues_org_version
ON public.issues (organization_version_id, department_id, status);

-- 5. Seed initial organization version if none exists
INSERT INTO public.organization_versions (
    version_number,
    effective_date,
    change_summary,
    change_type,
    is_current
)
SELECT 
    'ORG-2026.1',
    timezone('utc'::text, now()),
    'Initial municipal operations baseline structure (Department of Roads, Water, Sanitation, Lighting).',
    'baseline',
    true
WHERE NOT EXISTS (
    SELECT 1 FROM public.organization_versions WHERE is_current = true
);
