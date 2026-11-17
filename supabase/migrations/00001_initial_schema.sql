-- ==============================================================================
-- CIVOARA — CIVIC INCIDENT VERIFICATION & AUTOMATED ROUTING ARCHITECTURE
-- Initial Database Migration: Schema, RLS, Indexes, Triggers
-- ==============================================================================

-- Enable Core Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- ENUMS
-- ==============================================================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'citizen',
        'officer',
        'supervisor',
        'commissioner',
        'admin'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE incident_status AS ENUM (
        'submitted',
        'triaged',
        'assigned',
        'in_progress',
        'resolved',
        'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE incident_priority AS ENUM (
        'low',
        'medium',
        'high',
        'critical'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_channel AS ENUM (
        'in_app',
        'email',
        'sms',
        'push'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 1. WARDS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.wards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    boundary_geojson JSONB DEFAULT '{}'::jsonb,
    population INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 2. DEPARTMENTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    head_officer_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. PROFILES (Linked to auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'citizen',
    phone TEXT,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    ward_id UUID REFERENCES public.wards(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Add head_officer foreign key constraint to departments now that profiles exists
ALTER TABLE public.departments
    DROP CONSTRAINT IF EXISTS fk_departments_head_officer;

ALTER TABLE public.departments
    ADD CONSTRAINT fk_departments_head_officer
    FOREIGN KEY (head_officer_id)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;

-- ==============================================================================
-- 4. OFFICER ASSIGNMENTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.officer_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    officer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    ward_id UUID REFERENCES public.wards(id) ON DELETE SET NULL,
    is_primary BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL CHECK (status IN ('active', 'on_leave', 'suspended')) DEFAULT 'active',
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 5. ROUTING RULES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.routing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    target_department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    ward_id UUID REFERENCES public.wards(id) ON DELETE CASCADE,
    priority_override incident_priority,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 6. SLA POLICIES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.sla_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    priority incident_priority NOT NULL,
    max_resolution_hours INTEGER NOT NULL,
    escalation_hours INTEGER NOT NULL,
    supervisor_alert_channel TEXT NOT NULL DEFAULT 'sms_and_email',
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 7. ISSUE CLUSTERS (Proximity Grouping)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.issue_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_code TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    center_latitude NUMERIC(10, 7) NOT NULL,
    center_longitude NUMERIC(10, 7) NOT NULL,
    radius_meters NUMERIC(8, 2) NOT NULL DEFAULT 50.00,
    report_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 8. ISSUES (Primary Incident Entity)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    priority incident_priority NOT NULL DEFAULT 'medium',
    status incident_status NOT NULL DEFAULT 'submitted',
    is_public BOOLEAN NOT NULL DEFAULT true,
    is_public_approved BOOLEAN NOT NULL DEFAULT true,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    address TEXT,
    landmark TEXT,
    ward_id UUID REFERENCES public.wards(id) ON DELETE SET NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    assigned_officer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    cluster_id UUID REFERENCES public.issue_clusters(id) ON DELETE SET NULL,
    sla_deadline TIMESTAMPTZ,
    sla_breached BOOLEAN NOT NULL DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolution_proof_url TEXT,
    resolution_notes TEXT,
    citizen_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 9. ISSUE REPORTS (Individual citizen submissions)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.issue_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    media_urls JSONB DEFAULT '[]'::jsonb,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 10. ISSUE EVENTS (Audit Trail & Lifecycle History)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.issue_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_role TEXT,
    event_type TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 11. ESCALATION STEPS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.escalation_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    level INTEGER NOT NULL DEFAULT 1,
    escalated_to_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    escalated_to_role user_role NOT NULL,
    reason TEXT NOT NULL,
    action_taken TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 12. OWNERSHIP SEGMENTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ownership_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    ward_id UUID NOT NULL REFERENCES public.wards(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    supervisor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    geometry_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 13. ORGANIZATION VERSIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.organization_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_number TEXT NOT NULL UNIQUE,
    effective_date TIMESTAMPTZ NOT NULL,
    change_summary TEXT NOT NULL,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_current BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 14. ORGANIZATION CHANGE EVENTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.organization_change_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES public.organization_versions(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL,
    target_id UUID NOT NULL,
    change_type TEXT NOT NULL,
    old_state JSONB,
    new_state JSONB,
    initiated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 15. NOTIFICATIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    channel notification_channel NOT NULL DEFAULT 'in_app',
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- INDEXES FOR HIGH-PERFORMANCE QUERYING
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_profiles_ward ON public.profiles(ward_id);

CREATE INDEX IF NOT EXISTS idx_officer_assignments_officer ON public.officer_assignments(officer_id);
CREATE INDEX IF NOT EXISTS idx_officer_assignments_dept ON public.officer_assignments(department_id);
CREATE INDEX IF NOT EXISTS idx_officer_assignments_status ON public.officer_assignments(status);

CREATE INDEX IF NOT EXISTS idx_routing_rules_category ON public.routing_rules(category);
CREATE INDEX IF NOT EXISTS idx_routing_rules_dept ON public.routing_rules(target_department_id);

CREATE INDEX IF NOT EXISTS idx_issues_ticket ON public.issues(ticket_number);
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON public.issues(priority);
CREATE INDEX IF NOT EXISTS idx_issues_dept ON public.issues(department_id);
CREATE INDEX IF NOT EXISTS idx_issues_officer ON public.issues(assigned_officer_id);
CREATE INDEX IF NOT EXISTS idx_issues_ward ON public.issues(ward_id);
CREATE INDEX IF NOT EXISTS idx_issues_cluster ON public.issues(cluster_id);
CREATE INDEX IF NOT EXISTS idx_issues_sla ON public.issues(sla_deadline);
CREATE INDEX IF NOT EXISTS idx_issues_coords ON public.issues(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_issues_public ON public.issues(is_public, is_public_approved);

CREATE INDEX IF NOT EXISTS idx_issue_reports_issue ON public.issue_reports(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_reports_reporter ON public.issue_reports(reporter_id);

CREATE INDEX IF NOT EXISTS idx_issue_events_issue ON public.issue_events(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_events_created ON public.issue_events(created_at);

CREATE INDEX IF NOT EXISTS idx_escalation_steps_issue ON public.escalation_steps(issue_id);

CREATE INDEX IF NOT EXISTS idx_issue_clusters_code ON public.issue_clusters(cluster_code);
CREATE INDEX IF NOT EXISTS idx_issue_clusters_coords ON public.issue_clusters(center_latitude, center_longitude);

CREATE INDEX IF NOT EXISTS idx_ownership_segments_dept ON public.ownership_segments(department_id);
CREATE INDEX IF NOT EXISTS idx_ownership_segments_ward ON public.ownership_segments(ward_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at);

-- ==============================================================================
-- FUNCTIONS & TRIGGERS
-- ==============================================================================

-- 1. Automatic updated_at refresher
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
    CREATE TRIGGER trigger_profiles_updated_at
        BEFORE UPDATE ON public.profiles
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TRIGGER trigger_wards_updated_at
        BEFORE UPDATE ON public.wards
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TRIGGER trigger_departments_updated_at
        BEFORE UPDATE ON public.departments
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TRIGGER trigger_issues_updated_at
        BEFORE UPDATE ON public.issues
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Auth Role Lookup Helper (Security Definer to prevent RLS recursion)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
DECLARE
    v_role user_role;
BEGIN
    SELECT role INTO v_role
    FROM public.profiles
    WHERE id = auth.uid();
    RETURN COALESCE(v_role, 'citizen'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Auth Department Lookup Helper
CREATE OR REPLACE FUNCTION public.current_user_department_id()
RETURNS UUID AS $$
DECLARE
    v_dept_id UUID;
BEGIN
    SELECT department_id INTO v_dept_id
    FROM public.profiles
    WHERE id = auth.uid();
    RETURN v_dept_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4. Auth User Profile Auto-Creation Trigger
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        is_active
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'citizen',
        true
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 5. Role Tamper-Proof Trigger
-- Non-admin users cannot alter their own or others' roles
CREATE OR REPLACE FUNCTION public.prevent_role_tampering()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.role IS DISTINCT FROM NEW.role) THEN
        -- Allow if invoked by postgres superuser or auth admin during migration/seed
        IF current_user IN ('postgres', 'supabase_admin') THEN
            RETURN NEW;
        END IF;

        -- Check if current authenticated caller is an admin
        IF public.current_user_role() <> 'admin'::user_role THEN
            RAISE EXCEPTION 'Security Violation: Only system administrators can alter user roles.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
    CREATE TRIGGER trigger_prevent_role_tampering
        BEFORE UPDATE ON public.profiles
        FOR EACH ROW EXECUTE FUNCTION public.prevent_role_tampering();
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all 15 tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ownership_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_change_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- PROFILES POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "profiles_select_own"
    ON public.profiles FOR SELECT
    USING (
        id = auth.uid()
        OR public.current_user_role() IN ('officer', 'supervisor', 'commissioner', 'admin')
    );

CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid() OR public.current_user_role() = 'admin')
    WITH CHECK (id = auth.uid() OR public.current_user_role() = 'admin');

CREATE POLICY "profiles_admin_all"
    ON public.profiles FOR ALL
    USING (public.current_user_role() = 'admin');

-- ------------------------------------------------------------------------------
-- WARDS & DEPARTMENTS & SLA POLICIES (Publicly readable, Admin managed)
-- ------------------------------------------------------------------------------
CREATE POLICY "wards_read_public"
    ON public.wards FOR SELECT
    USING (true);

CREATE POLICY "wards_admin_manage"
    ON public.wards FOR ALL
    USING (public.current_user_role() = 'admin');

CREATE POLICY "departments_read_public"
    ON public.departments FOR SELECT
    USING (true);

CREATE POLICY "departments_admin_manage"
    ON public.departments FOR ALL
    USING (public.current_user_role() = 'admin');

CREATE POLICY "sla_policies_read_public"
    ON public.sla_policies FOR SELECT
    USING (true);

CREATE POLICY "sla_policies_admin_manage"
    ON public.sla_policies FOR ALL
    USING (public.current_user_role() = 'admin');

CREATE POLICY "routing_rules_read"
    ON public.routing_rules FOR SELECT
    USING (public.current_user_role() IN ('officer', 'supervisor', 'commissioner', 'admin'));

CREATE POLICY "routing_rules_admin_manage"
    ON public.routing_rules FOR ALL
    USING (public.current_user_role() = 'admin');

-- ------------------------------------------------------------------------------
-- OFFICER ASSIGNMENTS
-- ------------------------------------------------------------------------------
CREATE POLICY "officer_assignments_read"
    ON public.officer_assignments FOR SELECT
    USING (
        officer_id = auth.uid()
        OR public.current_user_role() IN ('supervisor', 'commissioner', 'admin')
    );

CREATE POLICY "officer_assignments_admin_manage"
    ON public.officer_assignments FOR ALL
    USING (public.current_user_role() IN ('supervisor', 'admin'));

-- ------------------------------------------------------------------------------
-- ISSUES POLICIES (Core Security Requirements)
-- ------------------------------------------------------------------------------
-- 1. Public users can only access approved public issue info
-- 2. Citizens can view their own private reports
-- 3. Officers can access issues assigned to them or their department
-- 4. Supervisors can access their authorized operational scope
-- 5. Commissioners can view department-level oversight
-- 6. Administrators have full system access
CREATE POLICY "issues_select_policy"
    ON public.issues FOR SELECT
    USING (
        -- Approved public issue
        (is_public = true AND is_public_approved = true)
        -- Or citizen who filed a report linked to this issue
        OR EXISTS (
            SELECT 1 FROM public.issue_reports r
            WHERE r.issue_id = public.issues.id AND r.reporter_id = auth.uid()
        )
        -- Or officer assigned to this issue
        OR assigned_officer_id = auth.uid()
        -- Or officer in the same department
        OR (
            public.current_user_role() = 'officer'
            AND department_id IS NOT NULL
            AND department_id = public.current_user_department_id()
        )
        -- Or supervisor, commissioner, or admin
        OR public.current_user_role() IN ('supervisor', 'commissioner', 'admin')
    );

CREATE POLICY "issues_insert_authenticated"
    ON public.issues FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "issues_update_policy"
    ON public.issues FOR UPDATE
    USING (
        assigned_officer_id = auth.uid()
        OR (
            public.current_user_role() = 'officer'
            AND department_id = public.current_user_department_id()
        )
        OR public.current_user_role() IN ('supervisor', 'admin')
    )
    WITH CHECK (
        assigned_officer_id = auth.uid()
        OR (
            public.current_user_role() = 'officer'
            AND department_id = public.current_user_department_id()
        )
        OR public.current_user_role() IN ('supervisor', 'admin')
    );

-- ------------------------------------------------------------------------------
-- ISSUE REPORTS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "issue_reports_select"
    ON public.issue_reports FOR SELECT
    USING (
        reporter_id = auth.uid()
        OR public.current_user_role() IN ('officer', 'supervisor', 'commissioner', 'admin')
    );

CREATE POLICY "issue_reports_insert"
    ON public.issue_reports FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- ------------------------------------------------------------------------------
-- ISSUE EVENTS & ESCALATIONS & CLUSTERS & SEGMENTS
-- ------------------------------------------------------------------------------
CREATE POLICY "issue_events_read"
    ON public.issue_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.issues i
            WHERE i.id = public.issue_events.issue_id
            AND (
                (i.is_public = true AND i.is_public_approved = true)
                OR i.assigned_officer_id = auth.uid()
                OR public.current_user_role() IN ('supervisor', 'commissioner', 'admin')
            )
        )
    );

CREATE POLICY "issue_events_insert"
    ON public.issue_events FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "escalation_steps_read"
    ON public.escalation_steps FOR SELECT
    USING (public.current_user_role() IN ('officer', 'supervisor', 'commissioner', 'admin'));

CREATE POLICY "escalation_steps_manage"
    ON public.escalation_steps FOR ALL
    USING (public.current_user_role() IN ('supervisor', 'admin'));

CREATE POLICY "issue_clusters_read"
    ON public.issue_clusters FOR SELECT
    USING (true);

CREATE POLICY "issue_clusters_manage"
    ON public.issue_clusters FOR ALL
    USING (public.current_user_role() IN ('supervisor', 'admin'));

CREATE POLICY "ownership_segments_read"
    ON public.ownership_segments FOR SELECT
    USING (true);

CREATE POLICY "ownership_segments_manage"
    ON public.ownership_segments FOR ALL
    USING (public.current_user_role() = 'admin');

CREATE POLICY "org_versions_read"
    ON public.organization_versions FOR SELECT
    USING (true);

CREATE POLICY "org_versions_manage"
    ON public.organization_versions FOR ALL
    USING (public.current_user_role() = 'admin');

CREATE POLICY "org_changes_read"
    ON public.organization_change_events FOR SELECT
    USING (public.current_user_role() IN ('commissioner', 'admin'));

CREATE POLICY "org_changes_manage"
    ON public.organization_change_events FOR ALL
    USING (public.current_user_role() = 'admin');

-- ------------------------------------------------------------------------------
-- NOTIFICATIONS POLICIES (Strictly User Isolated)
-- ------------------------------------------------------------------------------
CREATE POLICY "notifications_own"
    ON public.notifications FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
