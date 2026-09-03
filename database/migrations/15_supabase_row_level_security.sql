-- ==============================================================================
-- PHASE 15: SUPABASE ROW LEVEL SECURITY (RLS) & ACCESS CONTROL POLICIES
-- Strict Multi-Tenant & Role-Based Isolation (Zero Frontend Bypass)
-- ==============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. SECURITY DEFINER HELPER FUNCTIONS (Optimized Cache-Friendly Lookups)
-- ────────────────────────────────=============================================

-- 1.1 Get Current User Account ID from Supabase auth.uid()
CREATE OR REPLACE FUNCTION current_user_account_id()
RETURNS UUID AS $$
    SELECT id FROM user_accounts 
    WHERE auth_user_id = auth.uid() 
       OR email = (auth.jwt() ->> 'email')
    LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1.2 Check if Current User is Super Admin / University Admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = current_user_account_id()
          AND r.code IN ('SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'SYSTEM_ADMIN')
          AND ur.is_active = TRUE
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1.3 Check if Current User has a specific Role
CREATE OR REPLACE FUNCTION has_role(role_name VARCHAR)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = current_user_account_id()
          AND r.code = role_name
          AND ur.is_active = TRUE
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1.4 Get Current Student Master ID
CREATE OR REPLACE FUNCTION current_student_id()
RETURNS UUID AS $$
    SELECT student_id FROM user_accounts
    WHERE id = current_user_account_id()
    LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1.5 Get Current Faculty Master ID
CREATE OR REPLACE FUNCTION current_faculty_id()
RETURNS UUID AS $$
    SELECT faculty_id FROM user_accounts
    WHERE id = current_user_account_id()
    LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1.6 Get Current Parent Master ID
CREATE OR REPLACE FUNCTION current_parent_id()
RETURNS UUID AS $$
    SELECT parent_id FROM user_accounts
    WHERE id = current_user_account_id()
    LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1.7 Get Current HOD Department ID(s)
CREATE OR REPLACE FUNCTION current_hod_department_ids()
RETURNS TABLE(department_id UUID) AS $$
    SELECT ur.department_id FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = current_user_account_id()
      AND r.code = 'HOD'
      AND ur.is_active = TRUE
      AND ur.department_id IS NOT NULL;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1.8 Verify Parent-Ward Linkage
CREATE OR REPLACE FUNCTION is_parent_of_student(target_student_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM student_parent_mappings spm
        WHERE spm.parent_id = current_parent_id()
          AND spm.student_id = target_student_id
          AND spm.can_access_portal = TRUE
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1.9 Verify Faculty Workload Assignment
CREATE OR REPLACE FUNCTION is_faculty_allocated(target_allocation_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM faculty_subject_allocations fsa
        WHERE fsa.id = target_allocation_id
          AND fsa.faculty_id = current_faculty_id()
          AND fsa.status = 'ACTIVE'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- ──────────────────────────────────────────────────────────────────────────────
-- 2. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_parent_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_department_affiliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_academic_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_subject_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_subject_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_condonations ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_substitutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_plan_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_counseling_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_risk_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ptm_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ptm_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;


-- ──────────────────────────────────────────────────────────────────────────────
-- 3. RLS POLICIES FOR STUDENT MASTER (`students`)
-- ──────────────────────────────────────────────────────────────────────────────

-- Super Admin: Full Access
CREATE POLICY "Super admin full access on students"
ON students FOR ALL
USING (is_super_admin());

-- HOD: View & Manage Students in HOD's Department
CREATE POLICY "HOD view department students"
ON students FOR SELECT
USING (
    department_id IN (SELECT department_id FROM current_hod_department_ids())
);

-- Faculty / Mentor: View Students in assigned divisions or assigned mentees
CREATE POLICY "Faculty view enrolled or mentee students"
ON students FOR SELECT
USING (
    -- Case 1: Student is in division taught by faculty
    EXISTS (
        SELECT 1 FROM student_academic_enrollments sae
        JOIN faculty_subject_allocations fsa ON fsa.division_id = sae.division_id
        WHERE sae.student_id = students.id
          AND fsa.faculty_id = current_faculty_id()
          AND sae.is_current = TRUE
    )
    OR
    -- Case 2: Student is assigned mentee of this faculty
    EXISTS (
        SELECT 1 FROM mentor_allocations ma
        WHERE ma.student_id = students.id
          AND ma.faculty_id = current_faculty_id()
          AND ma.is_active = TRUE
    )
);

-- Student: Can view ONLY their own student profile
CREATE POLICY "Student view own profile"
ON students FOR SELECT
USING (id = current_student_id());

-- Student: Can update permitted personal contact fields
CREATE POLICY "Student update own contact info"
ON students FOR UPDATE
USING (id = current_student_id())
WITH CHECK (id = current_student_id());

-- Parent: View linked ward profile
CREATE POLICY "Parent view ward profile"
ON students FOR SELECT
USING (is_parent_of_student(id));


-- ──────────────────────────────────────────────────────────────────────────────
-- 4. RLS POLICIES FOR FACULTY MASTER (`faculty`)
-- ──────────────────────────────────────────────────────────────────────────────

CREATE POLICY "Super admin full access on faculty"
ON faculty FOR ALL
USING (is_super_admin());

CREATE POLICY "HOD view and update department faculty"
ON faculty FOR ALL
USING (
    department_id IN (SELECT department_id FROM current_hod_department_ids())
);

CREATE POLICY "Faculty view own profile and departmental peers"
ON faculty FOR SELECT
USING (
    id = current_faculty_id()
    OR department_id = (SELECT department_id FROM faculty WHERE id = current_faculty_id())
);

CREATE POLICY "Students and Parents view teaching faculty and mentor"
ON faculty FOR SELECT
USING (
    -- View faculty teaching current student subjects
    EXISTS (
        SELECT 1 FROM faculty_subject_allocations fsa
        JOIN student_academic_enrollments sae ON sae.division_id = fsa.division_id
        WHERE fsa.faculty_id = faculty.id
          AND (sae.student_id = current_student_id() OR is_parent_of_student(sae.student_id))
          AND sae.is_current = TRUE
    )
    OR
    -- View mentor
    EXISTS (
        SELECT 1 FROM mentor_allocations ma
        WHERE ma.faculty_id = faculty.id
          AND (ma.student_id = current_student_id() OR is_parent_of_student(ma.student_id))
          AND ma.is_active = TRUE
    )
);


-- ──────────────────────────────────────────────────────────────────────────────
-- 5. RLS POLICIES FOR ATTENDANCE MODULE (`attendance_sessions` & `attendance_records`)
-- ──────────────────────────────────────────────────────────────────────────────

-- 5.1 Attendance Sessions
CREATE POLICY "Super Admin full access on attendance_sessions"
ON attendance_sessions FOR ALL
USING (is_super_admin());

CREATE POLICY "HOD view department attendance sessions"
ON attendance_sessions FOR SELECT
USING (
    allocation_id IN (
        SELECT fsa.id FROM faculty_subject_allocations fsa
        JOIN subjects s ON s.id = fsa.subject_id
        JOIN programs p ON p.id = s.program_id
        WHERE p.department_id IN (SELECT department_id FROM current_hod_department_ids())
    )
);

CREATE POLICY "Faculty manage own attendance sessions"
ON attendance_sessions FOR ALL
USING (is_faculty_allocated(allocation_id))
WITH CHECK (is_faculty_allocated(allocation_id));

CREATE POLICY "Student & Parent view attendance sessions for enrolled classes"
ON attendance_sessions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM faculty_subject_allocations fsa
        JOIN student_academic_enrollments sae ON sae.division_id = fsa.division_id
        WHERE fsa.id = attendance_sessions.allocation_id
          AND (sae.student_id = current_student_id() OR is_parent_of_student(sae.student_id))
          AND sae.is_current = TRUE
    )
);

-- 5.2 Attendance Records (Individual Ledgers)
CREATE POLICY "Super admin full access on attendance_records"
ON attendance_records FOR ALL
USING (is_super_admin());

CREATE POLICY "HOD view department attendance records"
ON attendance_records FOR SELECT
USING (
    session_id IN (
        SELECT atts.id FROM attendance_sessions atts
        JOIN faculty_subject_allocations fsa ON fsa.id = atts.allocation_id
        JOIN subjects s ON s.id = fsa.subject_id
        JOIN programs p ON p.id = s.program_id
        WHERE p.department_id IN (SELECT department_id FROM current_hod_department_ids())
    )
);

CREATE POLICY "Faculty manage attendance records for assigned sessions"
ON attendance_records FOR ALL
USING (
    session_id IN (
        SELECT id FROM attendance_sessions WHERE is_faculty_allocated(allocation_id)
    )
)
WITH CHECK (
    session_id IN (
        SELECT id FROM attendance_sessions WHERE is_faculty_allocated(allocation_id)
    )
);

CREATE POLICY "Student view own attendance records"
ON attendance_records FOR SELECT
USING (student_id = current_student_id());

CREATE POLICY "Parent view ward attendance records"
ON attendance_records FOR SELECT
USING (is_parent_of_student(student_id));


-- ──────────────────────────────────────────────────────────────────────────────
-- 6. RLS POLICIES FOR TIMETABLE MODULE (`timetable_slots`)
-- ──────────────────────────────────────────────────────────────────────────────

CREATE POLICY "Super admin full access on timetable_slots"
ON timetable_slots FOR ALL
USING (is_super_admin());

CREATE POLICY "HOD manage department timetable"
ON timetable_slots FOR ALL
USING (
    allocation_id IN (
        SELECT fsa.id FROM faculty_subject_allocations fsa
        JOIN subjects s ON s.id = fsa.subject_id
        JOIN programs p ON p.id = s.program_id
        WHERE p.department_id IN (SELECT department_id FROM current_hod_department_ids())
    )
);

CREATE POLICY "Faculty view timetable slots"
ON timetable_slots FOR SELECT
USING (
    is_faculty_allocated(allocation_id)
    OR allocation_id IN (
        SELECT fsa.id FROM faculty_subject_allocations fsa
        WHERE fsa.academic_year_id IN (SELECT id FROM academic_years WHERE is_current = TRUE)
    )
);

CREATE POLICY "Students and Parents view timetable for enrolled division"
ON timetable_slots FOR SELECT
USING (
    allocation_id IN (
        SELECT fsa.id FROM faculty_subject_allocations fsa
        JOIN student_academic_enrollments sae ON sae.division_id = fsa.division_id
        WHERE (sae.student_id = current_student_id() OR is_parent_of_student(sae.student_id))
          AND sae.is_current = TRUE
    )
);


-- ──────────────────────────────────────────────────────────────────────────────
-- 7. RLS POLICIES FOR SESSION PLANS & STUDY MATERIALS
-- ──────────────────────────────────────────────────────────────────────────────

-- 7.1 Session Plans
CREATE POLICY "Super admin full access on session_plans"
ON session_plans FOR ALL
USING (is_super_admin());

CREATE POLICY "HOD review and approve department session plans"
ON session_plans FOR ALL
USING (
    allocation_id IN (
        SELECT fsa.id FROM faculty_subject_allocations fsa
        JOIN subjects s ON s.id = fsa.subject_id
        JOIN programs p ON p.id = s.program_id
        WHERE p.department_id IN (SELECT department_id FROM current_hod_department_ids())
    )
);

CREATE POLICY "Faculty manage own session plans"
ON session_plans FOR ALL
USING (is_faculty_allocated(allocation_id))
WITH CHECK (is_faculty_allocated(allocation_id));

CREATE POLICY "Student view approved session plans"
ON session_plans FOR SELECT
USING (
    approval_status = 'HOD_APPROVED'
    AND allocation_id IN (
        SELECT fsa.id FROM faculty_subject_allocations fsa
        JOIN student_academic_enrollments sae ON sae.division_id = fsa.division_id
        WHERE sae.student_id = current_student_id()
          AND sae.is_current = TRUE
    )
);

-- 7.2 Unit Materials
CREATE POLICY "Super admin full access on unit_materials"
ON unit_materials FOR ALL
USING (is_super_admin());

CREATE POLICY "Faculty upload and manage unit materials"
ON unit_materials FOR ALL
USING (uploaded_by_faculty_id = current_faculty_id())
WITH CHECK (uploaded_by_faculty_id = current_faculty_id());

CREATE POLICY "Students view published unit materials for enrolled subjects"
ON unit_materials FOR SELECT
USING (
    is_published = TRUE
    AND subject_id IN (
        SELECT ssr.subject_id FROM student_subject_registrations ssr
        JOIN student_academic_enrollments sae ON sae.id = ssr.student_enrollment_id
        WHERE sae.student_id = current_student_id()
          AND sae.is_current = TRUE
    )
);


-- ──────────────────────────────────────────────────────────────────────────────
-- 8. RLS POLICIES FOR ASSIGNMENTS & SUBMISSIONS
-- ──────────────────────────────────────────────────────────────────────────────

-- 8.1 Assignments Master
CREATE POLICY "Super admin full access on assignments"
ON assignments FOR ALL
USING (is_super_admin());

CREATE POLICY "HOD view department assignments"
ON assignments FOR SELECT
USING (
    allocation_id IN (
        SELECT fsa.id FROM faculty_subject_allocations fsa
        JOIN subjects s ON s.id = fsa.subject_id
        JOIN programs p ON p.id = s.program_id
        WHERE p.department_id IN (SELECT department_id FROM current_hod_department_ids())
    )
);

CREATE POLICY "Faculty manage assignments for allocated classes"
ON assignments FOR ALL
USING (is_faculty_allocated(allocation_id))
WITH CHECK (is_faculty_allocated(allocation_id));

CREATE POLICY "Student view published assignments for enrolled classes"
ON assignments FOR SELECT
USING (
    status IN ('PUBLISHED', 'EVALUATION_IN_PROGRESS', 'CLOSED')
    AND allocation_id IN (
        SELECT fsa.id FROM faculty_subject_allocations fsa
        JOIN student_academic_enrollments sae ON sae.division_id = fsa.division_id
        WHERE sae.student_id = current_student_id()
          AND sae.is_current = TRUE
    )
);

-- 8.2 Assignment Submissions & Grading
CREATE POLICY "Super admin full access on assignment_submissions"
ON assignment_submissions FOR ALL
USING (is_super_admin());

CREATE POLICY "Faculty grade submissions for own assignments"
ON assignment_submissions FOR ALL
USING (
    assignment_id IN (
        SELECT id FROM assignments WHERE is_faculty_allocated(allocation_id)
    )
)
WITH CHECK (
    assignment_id IN (
        SELECT id FROM assignments WHERE is_faculty_allocated(allocation_id)
    )
);

CREATE POLICY "Student submit and view own assignment submissions"
ON assignment_submissions FOR ALL
USING (student_id = current_student_id())
WITH CHECK (student_id = current_student_id());

CREATE POLICY "Parent view ward assignment grades"
ON assignment_submissions FOR SELECT
USING (is_parent_of_student(student_id));


-- ──────────────────────────────────────────────────────────────────────────────
-- 9. RLS POLICIES FOR MENTORSHIP MODULE
-- ──────────────────────────────────────────────────────────────────────────────

-- 9.1 Mentor Allocations
CREATE POLICY "Super admin full access on mentor_allocations"
ON mentor_allocations FOR ALL
USING (is_super_admin());

CREATE POLICY "HOD manage department mentor allocations"
ON mentor_allocations FOR ALL
USING (
    faculty_id IN (
        SELECT id FROM faculty WHERE department_id IN (SELECT department_id FROM current_hod_department_ids())
    )
);

CREATE POLICY "Faculty view assigned mentees"
ON mentor_allocations FOR SELECT
USING (faculty_id = current_faculty_id());

CREATE POLICY "Student view assigned mentor"
ON mentor_allocations FOR SELECT
USING (student_id = current_student_id());

CREATE POLICY "Parent view ward mentor"
ON mentor_allocations FOR SELECT
USING (is_parent_of_student(student_id));

-- 9.2 Mentor Counseling Logs
CREATE POLICY "Mentor manage own counseling logs"
ON mentor_counseling_logs FOR ALL
USING (
    mentor_allocation_id IN (
        SELECT id FROM mentor_allocations WHERE faculty_id = current_faculty_id()
    )
)
WITH CHECK (
    mentor_allocation_id IN (
        SELECT id FROM mentor_allocations WHERE faculty_id = current_faculty_id()
    )
);

CREATE POLICY "Student view non-confidential counseling notes"
ON mentor_counseling_logs FOR SELECT
USING (
    is_confidential = FALSE
    AND mentor_allocation_id IN (
        SELECT id FROM mentor_allocations WHERE student_id = current_student_id()
    )
);


-- ──────────────────────────────────────────────────────────────────────────────
-- 10. RLS POLICIES FOR PARENT-TEACHER MEETINGS (PTM)
-- ──────────────────────────────────────────────────────────────────────────────

CREATE POLICY "Super admin full access on ptm_meetings"
ON ptm_meetings FOR ALL
USING (is_super_admin());

CREATE POLICY "HOD and Faculty manage department PTM meetings"
ON ptm_meetings FOR ALL
USING (
    department_id IN (SELECT department_id FROM current_hod_department_ids())
    OR organized_by_faculty_id = current_faculty_id()
);

CREATE POLICY "Parents and Students view scheduled PTM meetings"
ON ptm_meetings FOR SELECT
USING (
    department_id IN (
        SELECT s.department_id FROM students s
        WHERE s.id = current_student_id() OR is_parent_of_student(s.id)
    )
);

-- PTM Attendees
CREATE POLICY "Faculty manage PTM attendee minutes"
ON ptm_attendees FOR ALL
USING (faculty_id = current_faculty_id())
WITH CHECK (faculty_id = current_faculty_id());

CREATE POLICY "Parent view own ward PTM minutes"
ON ptm_attendees FOR SELECT
USING (is_parent_of_student(student_id));

CREATE POLICY "Student view own PTM record"
ON ptm_attendees FOR SELECT
USING (student_id = current_student_id());


-- ──────────────────────────────────────────────────────────────────────────────
-- 11. RLS POLICIES FOR NOTIFICATIONS & AUDIT LOGS
-- ──────────────────────────────────────────────────────────────────────────────

-- 11.1 Notifications Master
CREATE POLICY "Super Admin manage all notifications"
ON notifications FOR ALL
USING (is_super_admin());

CREATE POLICY "Users view authorized notifications"
ON notifications FOR SELECT
USING (
    -- Case 1: University broadcast
    scope_type = 'UNIVERSITY_WIDE'
    OR
    -- Case 2: Role broadcast
    (scope_type = 'ROLE_BASED' AND target_role_id IN (
        SELECT role_id FROM user_roles WHERE user_id = current_user_account_id() AND is_active = TRUE
    ))
    OR
    -- Case 3: Department broadcast
    (scope_type = 'DEPARTMENT_WIDE' AND target_department_id IN (
        SELECT department_id FROM user_roles WHERE user_id = current_user_account_id()
    ))
    OR
    -- Case 4: Targeted direct recipient
    id IN (SELECT notification_id FROM notification_recipients WHERE user_id = current_user_account_id())
);

-- 11.2 Notification Recipients
CREATE POLICY "Users manage own notification recipient status"
ON notification_recipients FOR ALL
USING (user_id = current_user_account_id())
WITH CHECK (user_id = current_user_account_id());

-- 11.3 Audit Logs (Strict Append-Only for Security)
CREATE POLICY "Super admin view audit logs"
ON audit_logs FOR SELECT
USING (is_super_admin());

CREATE POLICY "Authenticated users insert audit log entries"
ON audit_logs FOR INSERT
WITH CHECK (user_id = current_user_account_id() OR is_super_admin());
