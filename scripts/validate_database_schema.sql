-- ==============================================================================
-- SSIU ERP — SUPABASE POSTGRESQL DATABASE & RLS SECURITY VALIDATOR
-- Deep assertions on tables, RLS status, policies, SECURITY DEFINER search_paths & triggers
-- ==============================================================================

DO $$
DECLARE
    v_missing_tables TEXT[] := ARRAY[]::TEXT[];
    v_missing_rls TEXT[] := ARRAY[]::TEXT[];
    v_unhardened_erp_funcs TEXT[] := ARRAY[]::TEXT[];
    v_missing_erp_funcs TEXT[] := ARRAY[]::TEXT[];
    v_unhardened_sys_funcs TEXT[] := ARRAY[]::TEXT[];
    v_policy_count INT;
    v_expected_tables TEXT[] := ARRAY[
        'universities', 'institutes', 'departments', 'academic_years', 'programs', 
        'batches', 'semesters', 'divisions', 'subjects', 'students', 'parents', 
        'student_parent_mappings', 'faculty', 'faculty_department_affiliations',
        'student_academic_enrollments', 'faculty_subject_allocations', 
        'student_subject_registrations', 'user_accounts', 'roles', 'permissions', 
        'role_permissions', 'user_roles', 'attendance_sessions', 'attendance_records', 
        'attendance_condonations', 'timetable_slots', 'timetable_substitutions', 
        'session_plans', 'session_plan_topics', 'unit_materials', 'assignments', 
        'assignment_submissions', 'mentor_allocations', 'mentor_counseling_logs', 
        'mentor_risk_alerts', 'ptm_meetings', 'ptm_attendees', 'notifications', 
        'notification_recipients', 'audit_logs', 'security_incidents'
    ];
    v_erp_functions TEXT[] := ARRAY[
        'current_user_account_id',
        'is_super_admin',
        'has_role',
        'current_student_id',
        'current_faculty_id',
        'current_parent_id',
        'current_hod_department_ids',
        'is_parent_of_student',
        'is_faculty_allocated',
        'protect_student_immutable_columns'
    ];
    t TEXT;
    f TEXT;
BEGIN
    RAISE NOTICE '==================================================================';
    RAISE NOTICE '  SSIU ERP — Supabase PostgreSQL Schema & RLS Security Validator';
    RAISE NOTICE '==================================================================';

    -- 1. Verify All 41 Tables Exist in public schema
    FOREACH t IN ARRAY v_expected_tables LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = t
        ) THEN
            v_missing_tables := array_append(v_missing_tables, t);
        END IF;
    END LOOP;

    IF array_length(v_missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'VALIDATION FAILED: Missing required tables: %', v_missing_tables;
    ELSE
        RAISE NOTICE '✓ [PASS] All % required tables exist in public schema.', array_length(v_expected_tables, 1);
    END IF;

    -- 2. Verify Row Level Security is Enabled on All 41 Tables
    FOREACH t IN ARRAY v_expected_tables LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' AND tablename = t AND rowsecurity = TRUE
        ) THEN
            v_missing_rls := array_append(v_missing_rls, t);
        END IF;
    END LOOP;

    IF array_length(v_missing_rls, 1) > 0 THEN
        RAISE EXCEPTION 'VALIDATION FAILED: RLS not enabled on: %', v_missing_rls;
    ELSE
        RAISE NOTICE '✓ [PASS] Row Level Security (RLS) is ENABLED on all % tables.', array_length(v_expected_tables, 1);
    END IF;

    -- 3. Verify Active Policy Count
    SELECT count(*) INTO v_policy_count FROM pg_policies WHERE schemaname = 'public';
    IF v_policy_count < 70 THEN
        RAISE EXCEPTION 'VALIDATION FAILED: Insufficient RLS policies found (% total)', v_policy_count;
    ELSE
        RAISE NOTICE '✓ [PASS] % active Row Level Security policies verified across tables.', v_policy_count;
    END IF;

    -- 4. Verify 10 SSIU ERP SECURITY DEFINER Functions have hardened search_path
    FOREACH f IN ARRAY v_erp_functions LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public' AND p.proname = f AND p.prosecdef = TRUE
        ) THEN
            v_missing_erp_funcs := array_append(v_missing_erp_funcs, f);
        ELSIF NOT EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public' 
              AND p.proname = f 
              AND p.prosecdef = TRUE
              AND 'search_path=public, auth, pg_temp' = ANY(p.proconfig)
        ) THEN
            v_unhardened_erp_funcs := array_append(v_unhardened_erp_funcs, f);
        END IF;
    END LOOP;

    IF array_length(v_missing_erp_funcs, 1) > 0 THEN
        RAISE EXCEPTION 'VALIDATION FAILED: Missing ERP SECURITY DEFINER functions: %', v_missing_erp_funcs;
    END IF;

    IF array_length(v_unhardened_erp_funcs, 1) > 0 THEN
        RAISE EXCEPTION 'VALIDATION FAILED: ERP SECURITY DEFINER functions without search_path=public, auth, pg_temp: %', v_unhardened_erp_funcs;
    ELSE
        RAISE NOTICE '✓ [PASS] All % SSIU ERP SECURITY DEFINER functions have hardened search_path=public, auth, pg_temp.', array_length(v_erp_functions, 1);
    END IF;

    -- 5. Verify Non-ERP System SECURITY DEFINER Functions (e.g. Supabase rls_auto_enable)
    SELECT array_agg(p.proname) INTO v_unhardened_sys_funcs
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' 
      AND p.prosecdef = TRUE
      AND NOT (p.proname = ANY(v_erp_functions))
      AND (p.proconfig IS NULL OR NOT 'search_path=pg_catalog' = ANY(p.proconfig));

    IF v_unhardened_sys_funcs IS NOT NULL AND array_length(v_unhardened_sys_funcs, 1) > 0 THEN
        RAISE EXCEPTION 'VALIDATION FAILED: Unhardened non-ERP system functions detected: %', v_unhardened_sys_funcs;
    ELSE
        RAISE NOTICE '✓ [PASS] Supabase system SECURITY DEFINER functions verified with safe search_path=pg_catalog.';
    END IF;

    -- 6. Verify Student Immutability Trigger
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_schema = 'public' 
          AND event_object_table = 'students' 
          AND trigger_name = 'trg_protect_student_immutable'
    ) THEN
        RAISE EXCEPTION 'VALIDATION FAILED: Student immutability trigger missing on students table!';
    ELSE
        RAISE NOTICE '✓ [PASS] Student immutability trigger (trg_protect_student_immutable) is ACTIVE.';
    END IF;

    -- 7. Verify Attendance Session Creator Validation Policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'attendance_sessions' 
          AND policyname = 'Faculty manage own attendance sessions'
    ) THEN
        RAISE EXCEPTION 'VALIDATION FAILED: Faculty attendance session policy missing!';
    ELSE
        RAISE NOTICE '✓ [PASS] Attendance session creator validation policy verified on attendance_sessions.';
    END IF;

    RAISE NOTICE '==================================================================';
    RAISE NOTICE '✅ ALL DATABASE & RLS SECURITY VALIDATION CHECKS PASSED!';
    RAISE NOTICE '==================================================================';
END $$;
