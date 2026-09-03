-- ==============================================================================
-- PHASE 16: SECURITY HARDENING & INTEGRITY ENFORCEMENT
-- 1. Explicit search_path on all SECURITY DEFINER functions (Mitigates search path injection)
-- 2. Row Level Security & Policies for Academic Master tables
-- 3. Database Trigger to protect student immutable academic & enrollment fields
-- 4. Attendance session creator validation in RLS
-- ==============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. SECURITY DEFINER HELPER FUNCTIONS (Explicit Safe search_path)
-- ──────────────────────────────────────────────────────────────────────────────

-- 1.1 current_user_account_id
CREATE OR REPLACE FUNCTION current_user_account_id()
RETURNS UUID 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
    SELECT id FROM user_accounts 
    WHERE auth_user_id = auth.uid() 
       OR email = (auth.jwt() ->> 'email')
    LIMIT 1;
$$;

-- 1.2 is_super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = current_user_account_id()
          AND r.code IN ('SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'SYSTEM_ADMIN')
          AND ur.is_active = TRUE
    );
$$;

-- 1.3 has_role
CREATE OR REPLACE FUNCTION has_role(role_name VARCHAR)
RETURNS BOOLEAN 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = current_user_account_id()
          AND r.code = role_name
          AND ur.is_active = TRUE
    );
$$;

-- 1.4 current_student_id
CREATE OR REPLACE FUNCTION current_student_id()
RETURNS UUID 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
    SELECT student_id FROM user_accounts
    WHERE id = current_user_account_id()
    LIMIT 1;
$$;

-- 1.5 current_faculty_id
CREATE OR REPLACE FUNCTION current_faculty_id()
RETURNS UUID 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
    SELECT faculty_id FROM user_accounts
    WHERE id = current_user_account_id()
    LIMIT 1;
$$;

-- 1.6 current_parent_id
CREATE OR REPLACE FUNCTION current_parent_id()
RETURNS UUID 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
    SELECT parent_id FROM user_accounts
    WHERE id = current_user_account_id()
    LIMIT 1;
$$;

-- 1.7 current_hod_department_ids
CREATE OR REPLACE FUNCTION current_hod_department_ids()
RETURNS TABLE(department_id UUID) 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
    SELECT ur.department_id FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = current_user_account_id()
      AND r.code = 'HOD'
      AND ur.is_active = TRUE
      AND ur.department_id IS NOT NULL;
$$;

-- 1.8 is_parent_of_student
CREATE OR REPLACE FUNCTION is_parent_of_student(target_student_id UUID)
RETURNS BOOLEAN 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM student_parent_mappings spm
        WHERE spm.parent_id = current_parent_id()
          AND spm.student_id = target_student_id
          AND spm.can_access_portal = TRUE
    );
$$;

-- 1.9 is_faculty_allocated
CREATE OR REPLACE FUNCTION is_faculty_allocated(target_allocation_id UUID)
RETURNS BOOLEAN 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM faculty_subject_allocations fsa
        WHERE fsa.id = target_allocation_id
          AND fsa.faculty_id = current_faculty_id()
          AND fsa.status = 'ACTIVE'
    );
$$;


-- ──────────────────────────────────────────────────────────────────────────────
-- 2. ACADEMIC MASTER RLS & POLICIES
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- 2.1 Universities Policies
DROP POLICY IF EXISTS "Authenticated users view universities" ON universities;
CREATE POLICY "Authenticated users view universities"
ON universities FOR SELECT
USING (auth.role() = 'authenticated' OR is_super_admin());

DROP POLICY IF EXISTS "Super admin manage universities" ON universities;
CREATE POLICY "Super admin manage universities"
ON universities FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- 2.2 Institutes Policies
DROP POLICY IF EXISTS "Authenticated users view institutes" ON institutes;
CREATE POLICY "Authenticated users view institutes"
ON institutes FOR SELECT
USING (auth.role() = 'authenticated' OR is_super_admin());

DROP POLICY IF EXISTS "Super admin manage institutes" ON institutes;
CREATE POLICY "Super admin manage institutes"
ON institutes FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- 2.3 Departments Policies
DROP POLICY IF EXISTS "Authenticated users view departments" ON departments;
CREATE POLICY "Authenticated users view departments"
ON departments FOR SELECT
USING (auth.role() = 'authenticated' OR is_super_admin());

DROP POLICY IF EXISTS "Super admin manage departments" ON departments;
CREATE POLICY "Super admin manage departments"
ON departments FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- 2.4 Academic Years Policies
DROP POLICY IF EXISTS "Authenticated users view academic_years" ON academic_years;
CREATE POLICY "Authenticated users view academic_years"
ON academic_years FOR SELECT
USING (auth.role() = 'authenticated' OR is_super_admin());

DROP POLICY IF EXISTS "Super admin manage academic_years" ON academic_years;
CREATE POLICY "Super admin manage academic_years"
ON academic_years FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- 2.5 Programs Policies
DROP POLICY IF EXISTS "Authenticated users view programs" ON programs;
CREATE POLICY "Authenticated users view programs"
ON programs FOR SELECT
USING (auth.role() = 'authenticated' OR is_super_admin());

DROP POLICY IF EXISTS "Super admin manage programs" ON programs;
CREATE POLICY "Super admin manage programs"
ON programs FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- 2.6 Batches Policies
DROP POLICY IF EXISTS "Authenticated users view batches" ON batches;
CREATE POLICY "Authenticated users view batches"
ON batches FOR SELECT
USING (auth.role() = 'authenticated' OR is_super_admin());

DROP POLICY IF EXISTS "Super admin manage batches" ON batches;
CREATE POLICY "Super admin manage batches"
ON batches FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- 2.7 Semesters Policies
DROP POLICY IF EXISTS "Authenticated users view semesters" ON semesters;
CREATE POLICY "Authenticated users view semesters"
ON semesters FOR SELECT
USING (auth.role() = 'authenticated' OR is_super_admin());

DROP POLICY IF EXISTS "Super admin manage semesters" ON semesters;
CREATE POLICY "Super admin manage semesters"
ON semesters FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- 2.8 Divisions Policies
DROP POLICY IF EXISTS "Authenticated users view divisions" ON divisions;
CREATE POLICY "Authenticated users view divisions"
ON divisions FOR SELECT
USING (auth.role() = 'authenticated' OR is_super_admin());

DROP POLICY IF EXISTS "Super admin manage divisions" ON divisions;
CREATE POLICY "Super admin manage divisions"
ON divisions FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- 2.9 Subjects Policies
DROP POLICY IF EXISTS "Authenticated users view subjects" ON subjects;
CREATE POLICY "Authenticated users view subjects"
ON subjects FOR SELECT
USING (auth.role() = 'authenticated' OR is_super_admin());

DROP POLICY IF EXISTS "Super admin manage subjects" ON subjects;
CREATE POLICY "Super admin manage subjects"
ON subjects FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());


-- ──────────────────────────────────────────────────────────────────────────────
-- 3. STUDENT IMMUTABLE FIELDS PROTECTION TRIGGER
-- Prevents unauthorized student mutations of critical institutional & enrollment fields
-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION protect_student_immutable_columns()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    -- Super Admin & University Admin can update all fields
    IF is_super_admin() THEN
        RETURN NEW;
    END IF;

    -- If the updating user is the student (or any non-superadmin), restrict modifications on critical fields
    IF (
        OLD.enrollment_number IS DISTINCT FROM NEW.enrollment_number OR
        OLD.temporary_enrollment_number IS DISTINCT FROM NEW.temporary_enrollment_number OR
        OLD.enrollment_status IS DISTINCT FROM NEW.enrollment_status OR
        OLD.batch_id IS DISTINCT FROM NEW.batch_id OR
        OLD.program_id IS DISTINCT FROM NEW.program_id OR
        OLD.department_id IS DISTINCT FROM NEW.department_id OR
        OLD.institute_id IS DISTINCT FROM NEW.institute_id OR
        OLD.admission_number IS DISTINCT FROM NEW.admission_number OR
        OLD.admission_date IS DISTINCT FROM NEW.admission_date
    ) THEN
        RAISE EXCEPTION 'Access Denied: Academic status, enrollment numbers, admission details and departmental mappings can only be modified by University Administration.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_student_immutable ON students;
CREATE TRIGGER trg_protect_student_immutable
BEFORE UPDATE ON students
FOR EACH ROW EXECUTE FUNCTION protect_student_immutable_columns();


-- ──────────────────────────────────────────────────────────────────────────────
-- 4. ATTENDANCE SESSION CREATOR VALIDATION
-- Enforces that taken_by_user_id matches the authenticated faculty's user account
-- ──────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Faculty manage own attendance sessions" ON attendance_sessions;

CREATE POLICY "Faculty manage own attendance sessions"
ON attendance_sessions FOR ALL
USING (
    is_faculty_allocated(allocation_id)
)
WITH CHECK (
    is_faculty_allocated(allocation_id) 
    AND (taken_by_user_id = current_user_account_id() OR is_super_admin())
);
