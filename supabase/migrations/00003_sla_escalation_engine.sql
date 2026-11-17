-- ==============================================================================
-- CIVOARA DATABASE MIGRATION: 00003_sla_escalation_engine.sql
-- Part 05: SLA Timer and Escalation Engine
-- ==============================================================================

-- 1. Extend public.sla_policies with category-based definitions and versioning
ALTER TABLE public.sla_policies 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS policy_version TEXT NOT NULL DEFAULT 'v1.0-demo';

-- 2. Extend public.issues with SLA lifecycle and escalation tracking fields
ALTER TABLE public.issues
ADD COLUMN IF NOT EXISTS sla_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sla_policy_id UUID REFERENCES public.sla_policies(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sla_policy_version TEXT,
ADD COLUMN IF NOT EXISTS current_escalation_level INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_escalated_at TIMESTAMPTZ;

-- 3. Idempotency Constraint on escalation_steps
-- Guarantees that an issue cannot have duplicate escalation step records for the same level.
CREATE UNIQUE INDEX IF NOT EXISTS idx_escalation_steps_issue_level 
ON public.escalation_steps (issue_id, level);

-- 4. High-Performance Query Indexes for SLA Worker
CREATE INDEX IF NOT EXISTS idx_issues_sla_monitoring 
ON public.issues (status, sla_deadline, sla_breached, current_escalation_level)
WHERE status NOT IN ('resolved', 'rejected');

CREATE INDEX IF NOT EXISTS idx_issues_escalation_level
ON public.issues (current_escalation_level);

CREATE INDEX IF NOT EXISTS idx_sla_policies_category_version
ON public.sla_policies (category, policy_version, is_active);

-- 5. Seed Demonstration SLA Policies (Part 05 Specifications)
-- Pothole: 48h, Garbage: 24h, Streetlight: 72h, Water leakage: 12h, Other: 96h
INSERT INTO public.sla_policies (
    id,
    category,
    priority,
    max_resolution_hours,
    escalation_hours,
    supervisor_alert_channel,
    policy_version,
    is_active
) VALUES 
(
    '30000000-0000-0000-0000-000000000001',
    'pothole',
    'high',
    48,
    12,
    'sms_and_email',
    'v1.0-demo',
    true
),
(
    '30000000-0000-0000-0000-000000000002',
    'garbage',
    'medium',
    24,
    6,
    'sms_and_email',
    'v1.0-demo',
    true
),
(
    '30000000-0000-0000-0000-000000000003',
    'broken_streetlight',
    'medium',
    72,
    18,
    'sms_and_email',
    'v1.0-demo',
    true
),
(
    '30000000-0000-0000-0000-000000000004',
    'water_leakage',
    'critical',
    12,
    3,
    'sms_and_email',
    'v1.0-demo',
    true
),
(
    '30000000-0000-0000-0000-000000000005',
    'other',
    'low',
    96,
    24,
    'sms_and_email',
    'v1.0-demo',
    true
)
ON CONFLICT (id) DO UPDATE SET
    category = EXCLUDED.category,
    max_resolution_hours = EXCLUDED.max_resolution_hours,
    escalation_hours = EXCLUDED.escalation_hours,
    policy_version = EXCLUDED.policy_version,
    updated_at = timezone('utc'::text, now());
