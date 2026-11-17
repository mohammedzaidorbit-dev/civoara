-- ==============================================================================
-- CIVOARA — Migration 00002: Storage Buckets & Citizen Reporting Policies
-- ==============================================================================

-- 1. Storage Bucket for Incident Photographs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'incident-media',
    'incident-media',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

-- Storage Policies
DO $$ BEGIN
    CREATE POLICY "Public Read Access for Incident Media"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'incident-media');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow Uploads to Incident Media"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'incident-media');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Allow Citizen and Guest Issue Submissions
-- Update RLS policies to allow both authenticated citizens and guest submissions
DROP POLICY IF EXISTS "issues_insert_authenticated" ON public.issues;
CREATE POLICY "issues_insert_all"
    ON public.issues FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "issue_reports_insert" ON public.issue_reports;
CREATE POLICY "issue_reports_insert_all"
    ON public.issue_reports FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "issue_events_insert" ON public.issue_events;
CREATE POLICY "issue_events_insert_all"
    ON public.issue_events FOR INSERT
    WITH CHECK (true);

-- 3. Ticket Number Generator Sequence & Function
CREATE SEQUENCE IF NOT EXISTS public.ticket_number_seq START 8850;

CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
    next_val BIGINT;
    year_prefix TEXT;
BEGIN
    next_val := nextval('public.ticket_number_seq');
    year_prefix := to_char(CURRENT_DATE, 'YYYY');
    RETURN 'CIV-' || year_prefix || '-' || LPAD(next_val::text, 4, '0');
END;
$$ LANGUAGE plpgsql;
