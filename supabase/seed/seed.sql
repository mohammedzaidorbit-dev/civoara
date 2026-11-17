-- ==============================================================================
-- CIVOARA — Controlled Development Seed Dataset
-- Deterministic UUIDs for automated testing and local verification
-- ==============================================================================

-- 1. WARDS SEED
INSERT INTO public.wards (id, name, code, population) VALUES
    ('10000000-0000-0000-0000-000000000001', 'Ward 1 - Central Downtown', 'WARD-01', 84000),
    ('10000000-0000-0000-0000-000000000002', 'Ward 2 - North Oakridge', 'WARD-02', 62000),
    ('10000000-0000-0000-0000-000000000003', 'Ward 3 - East Riverfront', 'WARD-03', 71000),
    ('10000000-0000-0000-0000-000000000004', 'Ward 4 - West Pine Valley', 'WARD-04', 59000),
    ('10000000-0000-0000-0000-000000000005', 'Ward 5 - South Industrial', 'WARD-05', 43000)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, population = EXCLUDED.population;

-- 2. DEPARTMENTS SEED
INSERT INTO public.departments (id, name, code, description, is_active) VALUES
    ('20000000-0000-0000-0000-000000000001', 'Roads & Highways Maintenance', 'ROADS_HIGHWAYS', 'Potholes, asphalt paving, road curbs, and storm drainage resurfacing', true),
    ('20000000-0000-0000-0000-000000000002', 'Water & Sewerage Board', 'WATER_SEWERAGE', 'Water main bursts, sewerage overflow, drinking water supply, and hydrants', true),
    ('20000000-0000-0000-0000-000000000003', 'Waste Management & Sanitation', 'WASTE_MGMT', 'Commercial and residential garbage disposal, public litter bins, and canal clearing', true),
    ('20000000-0000-0000-0000-000000000004', 'Electrical & Street Lighting', 'ELECTRICAL', 'Streetlight maintenance, electrical pole damage, and luminaire repairs', true),
    ('20000000-0000-0000-0000-000000000005', 'Traffic Engineering Division', 'TRAFFIC_TRANSIT', 'Traffic signals, road signage, pedestrian crossings, and lane markings', true)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 3. SLA POLICIES SEED
INSERT INTO public.sla_policies (id, priority, max_resolution_hours, escalation_hours, supervisor_alert_channel, is_active) VALUES
    ('30000000-0000-0000-0000-000000000001', 'critical', 4, 3, 'sms_and_email', true),
    ('30000000-0000-0000-0000-000000000002', 'high', 12, 9, 'email_and_push', true),
    ('30000000-0000-0000-0000-000000000003', 'medium', 24, 18, 'in_app_queue', true),
    ('30000000-0000-0000-0000-000000000004', 'low', 72, 60, 'standard_digest', true)
ON CONFLICT (id) DO NOTHING;

-- 4. ROUTING RULES SEED
INSERT INTO public.routing_rules (id, category, target_department_id, is_active) VALUES
    ('40000000-0000-0000-0000-000000000001', 'pothole', '20000000-0000-0000-0000-000000000001', true),
    ('40000000-0000-0000-0000-000000000002', 'water_supply', '20000000-0000-0000-0000-000000000002', true),
    ('40000000-0000-0000-0000-000000000003', 'sanitation', '20000000-0000-0000-0000-000000000003', true),
    ('40000000-0000-0000-0000-000000000004', 'street_lighting', '20000000-0000-0000-0000-000000000004', true),
    ('40000000-0000-0000-0000-000000000005', 'traffic_signal', '20000000-0000-0000-0000-000000000005', true)
ON CONFLICT (id) DO NOTHING;

-- 5. TEST AUTH USERS (Inserted into auth.users if available, and corresponding profiles)
-- Passwords for dev test accounts: Password123! (bcrypt hash: $2a$10$wT5Hq7r5j8i.B.rJ1Oq4u.JzWlVqG/aL3p7yVp8qYQv0H0oX2rE.W)
DO $$
DECLARE
    v_admin_id UUID := 'a0000000-0000-0000-0000-000000000001';
    v_comm_id UUID  := 'a0000000-0000-0000-0000-000000000002';
    v_supv_id UUID  := 'a0000000-0000-0000-0000-000000000003';
    v_off_id UUID   := 'a0000000-0000-0000-0000-000000000004';
    v_cit_id UUID   := 'a0000000-0000-0000-0000-000000000005';
BEGIN
    -- Check if auth.users table is accessible
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES
            (v_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@civoara.gov', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Director J. Vance"}', now(), now()),
            (v_comm_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'commissioner@civoara.gov', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Commissioner M. Sterling"}', now(), now()),
            (v_supv_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'supervisor@civoara.gov', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Supervisor R. Thorne"}', now(), now()),
            (v_off_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'officer@civoara.gov', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Officer Sarah Chen"}', now(), now()),
            (v_cit_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'citizen@civoara.gov', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Citizen Alex Morgan"}', now(), now())
        ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;
    END IF;

    -- Profiles Insert / Update
    INSERT INTO public.profiles (id, email, full_name, role, phone, department_id, ward_id, is_active) VALUES
        (v_admin_id, 'admin@civoara.gov', 'Director J. Vance', 'admin', '+1 (555) 010-0001', null, null, true),
        (v_comm_id, 'commissioner@civoara.gov', 'Commissioner M. Sterling', 'commissioner', '+1 (555) 010-0002', null, null, true),
        (v_supv_id, 'supervisor@civoara.gov', 'Supervisor R. Thorne', 'supervisor', '+1 (555) 010-0003', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', true),
        (v_off_id, 'officer@civoara.gov', 'Officer Sarah Chen', 'officer', '+1 (555) 010-0004', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', true),
        (v_cit_id, 'citizen@civoara.gov', 'Citizen Alex Morgan', 'citizen', '+1 (555) 010-0005', null, '10000000-0000-0000-0000-000000000004', true)
    ON CONFLICT (id) DO UPDATE SET
        role = EXCLUDED.role,
        full_name = EXCLUDED.full_name,
        department_id = EXCLUDED.department_id,
        ward_id = EXCLUDED.ward_id;
END $$;

-- 6. ISSUE CLUSTERS SEED
INSERT INTO public.issue_clusters (id, cluster_code, category, center_latitude, center_longitude, radius_meters, report_count) VALUES
    ('50000000-0000-0000-0000-000000000001', 'CLUST-041', 'pothole', 37.7749290, -122.4194160, 42.50, 3)
ON CONFLICT (cluster_code) DO NOTHING;

-- 7. ISSUES SEED
INSERT INTO public.issues (
    id, ticket_number, title, description, category, priority, status,
    is_public, is_public_approved, latitude, longitude, address,
    ward_id, department_id, assigned_officer_id, cluster_id,
    sla_deadline, sla_breached, citizen_verified
) VALUES
    (
        '60000000-0000-0000-0000-000000000001',
        'CIV-2026-8812',
        'Deep pothole causing vehicle hazard on 5th Avenue',
        'Hazardous pothole roughly 2 feet wide and 5 inches deep on northbound lane. Vehicles swerving sharply into oncoming traffic.',
        'pothole',
        'high',
        'in_progress',
        true,
        true,
        37.7749290,
        -122.4194160,
        '5th Ave & Pine St',
        '10000000-0000-0000-0000-000000000004',
        '20000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000004',
        '50000000-0000-0000-0000-000000000001',
        timezone('utc'::text, now()) + INTERVAL '4 hours',
        false,
        false
    ),
    (
        '60000000-0000-0000-0000-000000000002',
        'CIV-2026-8790',
        'Water pipe leak flooding pedestrian walkway',
        'Municipal clean water main rupture leaking onto sidewalk. Significant loss of water pressure in adjacent blocks.',
        'water_supply',
        'critical',
        'assigned',
        true,
        true,
        37.7833330,
        -122.4166670,
        'Oakridge Sector 4',
        '10000000-0000-0000-0000-000000000002',
        '20000000-0000-0000-0000-000000000002',
        null,
        null,
        timezone('utc'::text, now()) + INTERVAL '2 hours',
        false,
        false
    ),
    (
        '60000000-0000-0000-0000-000000000003',
        'CIV-2026-8641',
        'Streetlight outage along Elm Street corridor',
        'Luminaire fixture flickering and permanently dark at night. Safety hazard for evening pedestrians.',
        'street_lighting',
        'medium',
        'resolved',
        true,
        true,
        37.7650000,
        -122.4200000,
        'Elm St, Pole #44',
        '10000000-0000-0000-0000-000000000003',
        '20000000-0000-0000-0000-000000000004',
        'a0000000-0000-0000-0000-000000000004',
        null,
        timezone('utc'::text, now()) - INTERVAL '12 hours',
        false,
        true
    )
ON CONFLICT (ticket_number) DO NOTHING;

-- 8. ISSUE REPORTS SEED
INSERT INTO public.issue_reports (
    id, issue_id, reporter_id, is_anonymous, title, description, latitude, longitude, address
) VALUES
    (
        '70000000-0000-0000-0000-000000000001',
        '60000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000005',
        false,
        'Pothole damaged car rim on 5th Ave',
        'Struck an unpainted deep pothole during morning commute. Severely bent wheel rim.',
        37.7749290,
        -122.4194160,
        '5th Ave & Pine St'
    )
ON CONFLICT (id) DO NOTHING;

-- 9. ISSUE EVENTS SEED
INSERT INTO public.issue_events (
    id, issue_id, actor_id, actor_role, event_type, notes
) VALUES
    ('80000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 'citizen', 'INCIDENT_INTAKE', 'Report filed with geo-coordinates'),
    ('80000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000001', null, 'system', 'PROXIMITY_CLUSTERED', 'Grouped into cluster CLUST-041 (<42m proximity)'),
    ('80000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'supervisor', 'OFFICER_DISPATCHED', 'Assigned to Officer Sarah Chen (PW-4091)')
ON CONFLICT (id) DO NOTHING;

-- 10. NOTIFICATIONS SEED
INSERT INTO public.notifications (
    id, user_id, issue_id, title, message, channel, is_read
) VALUES
    (
        '90000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000005',
        '60000000-0000-0000-0000-000000000001',
        'Officer Dispatched to Your Report',
        'Officer Sarah Chen (Roads & Highways) has accepted ticket CIV-2026-8812.',
        'in_app',
        false
    )
ON CONFLICT (id) DO NOTHING;
