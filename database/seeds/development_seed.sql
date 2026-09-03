-- ==============================================================================
-- SSIU ERP — DEVELOPMENT & TESTING SEED DATA
-- Clearly marked DEVELOPMENT/DEMO data (Do NOT use in production)
-- ==============================================================================

-- 1. University & Institute
INSERT INTO universities (id, code, name, short_name, established_year, status)
VALUES ('11111111-1111-1111-1111-111111111111', 'SSIU', 'Swarrnim Startup & Innovation University', 'SSIU', 2017, 'ACTIVE')
ON CONFLICT (code) DO NOTHING;

INSERT INTO institutes (id, university_id, code, name, short_name, category, established_year, status)
VALUES ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'SSCIT', 'Swarrnim School of Computing & IT', 'SSCIT', 'Engineering & Technology', 2017, 'ACTIVE')
ON CONFLICT (code) DO NOTHING;

-- 2. Academic Departments
INSERT INTO departments (id, institute_id, code, name, short_name, status)
VALUES 
    ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222222', 'DEP-CE', 'Department of Computer Engineering', 'CE', 'ACTIVE'),
    ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222222', 'DEP-IT', 'Department of Information Technology', 'IT', 'ACTIVE'),
    ('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222222', 'DEP-CSAI', 'Department of Computer Science & AI', 'CSAI', 'ACTIVE')
ON CONFLICT (code) DO NOTHING;

-- 3. Academic Year 2026-27
INSERT INTO academic_years (id, code, name, start_year, end_year, start_date, end_date, is_current, status)
VALUES ('44444444-4444-4444-4444-444444444444', '2026-27', 'Academic Year 2026-2027', 2026, 2027, '2026-06-15', '2027-05-31', TRUE, 'ACTIVE')
ON CONFLICT (code) DO NOTHING;

-- 4. Programs & Batches
INSERT INTO programs (id, department_id, code, name, degree_type, duration_years, total_semesters, status)
VALUES 
    ('55555555-5555-5555-5555-555555555501', '33333333-3333-3333-3333-333333333301', 'BTECH-CE', 'B.Tech in Computer Engineering', 'UG', 4, 8, 'ACTIVE'),
    ('55555555-5555-5555-5555-555555555502', '33333333-3333-3333-3333-333333333302', 'BTECH-IT', 'B.Tech in Information Technology', 'UG', 4, 8, 'ACTIVE')
ON CONFLICT (code) DO NOTHING;

INSERT INTO batches (id, program_id, academic_year_id, code, name, start_year, end_year, status)
VALUES ('66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555501', '44444444-4444-4444-4444-444444444444', 'BATCH-CE-2024-2028', 'CE Cohort 2024-2028', 2024, 2028, 'ACTIVE')
ON CONFLICT (code) DO NOTHING;

-- 5. Semesters & Divisions
INSERT INTO semesters (id, program_id, semester_number, name, term_type, status)
VALUES 
    ('77777777-7777-7777-7777-777777777705', '55555555-5555-5555-5555-555555555501', 5, 'Semester 5 (Autumn 2026)', 'ODD', 'ACTIVE'),
    ('77777777-7777-7777-7777-777777777706', '55555555-5555-5555-5555-555555555501', 6, 'Semester 6 (Spring 2027)', 'EVEN', 'ACTIVE')
ON CONFLICT (program_id, semester_number) DO NOTHING;

INSERT INTO divisions (id, semester_id, code, name, capacity, status)
VALUES 
    ('88888888-8888-8888-8888-888888888801', '77777777-7777-7777-7777-777777777705', 'DIV-A', 'Division A', 60, 'ACTIVE'),
    ('88888888-8888-8888-8888-888888888802', '77777777-7777-7777-7777-777777777705', 'DIV-B', 'Division B', 60, 'ACTIVE')
ON CONFLICT (semester_id, code) DO NOTHING;

-- 6. Subjects for Semester 5
INSERT INTO subjects (id, program_id, semester_id, code, name, short_name, subject_type, credits, total_theory_hours, total_practical_hours, status)
VALUES 
    ('99999999-9999-9999-9999-999999999901', '55555555-5555-5555-5555-555555555501', '77777777-7777-7777-7777-777777777705', 'CS501', 'Advanced Database Management Systems', 'ADBMS', 'THEORY', 4.00, 45, 0, 'ACTIVE'),
    ('99999999-9999-9999-9999-999999999902', '55555555-5555-5555-5555-555555555501', '77777777-7777-7777-7777-777777777705', 'CS502', 'Operating Systems & System Programming', 'OS', 'THEORY', 4.00, 45, 0, 'ACTIVE'),
    ('99999999-9999-9999-9999-999999999903', '55555555-5555-5555-5555-555555555501', '77777777-7777-7777-7777-777777777705', 'CS503', 'Artificial Intelligence & Neural Networks', 'AI', 'THEORY', 3.00, 45, 0, 'ACTIVE'),
    ('99999999-9999-9999-9999-999999999904', '55555555-5555-5555-5555-555555555501', '77777777-7777-7777-7777-777777777705', 'CS505P', 'Database & AI Laboratory', 'DBAI-LAB', 'PRACTICAL', 2.00, 0, 30, 'ACTIVE')
ON CONFLICT (code) DO NOTHING;

-- 7. Faculty Members
INSERT INTO faculty (id, institute_id, department_id, employee_code, first_name, middle_name, last_name, gender, designation, highest_qualification, institutional_email, contact_number, employment_type, employment_status, joining_date)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333301', 'FAC-CE-001', 'Amit', 'K', 'Shah', 'MALE', 'HOD & Professor', 'Ph.D in AI & Distributed Systems', 'amit.shah@swarrnim.edu.in', '+91 98765 43210', 'REGULAR', 'ACTIVE', '2017-07-01'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333301', 'FAC-CE-002', 'Priya', 'R', 'Sharma', 'FEMALE', 'Assistant Professor', 'M.Tech in Software Engineering', 'priya.sharma@swarrnim.edu.in', '+91 98765 43211', 'REGULAR', 'ACTIVE', '2019-08-01'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333301', 'FAC-CE-003', 'Rajesh', 'M', 'Patel', 'MALE', 'Associate Professor', 'Ph.D in Cloud Computing', 'rajesh.patel@swarrnim.edu.in', '+91 98765 43212', 'REGULAR', 'ACTIVE', '2018-06-15')
ON CONFLICT (employee_code) DO NOTHING;

-- 8. Students Master
INSERT INTO students (id, institute_id, department_id, program_id, batch_id, enrollment_number, admission_number, abc_id, first_name, middle_name, last_name, gender, dob, category, institutional_email, contact_number, enrollment_status, admission_date)
VALUES 
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333301', '55555555-5555-5555-5555-555555555501', '66666666-6666-6666-6666-666666666601', '20240101001', 'ADM-2024-001', 'ABC-9081-2341', 'Aarav', 'M', 'Patel', 'MALE', '2004-05-12', 'GENERAL', 'aarav.patel@swarrnim.edu.in', '+91 91234 56780', 'ACTIVE', '2024-07-15'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333301', '55555555-5555-5555-5555-555555555501', '66666666-6666-6666-6666-666666666601', '20240101002', 'ADM-2024-002', 'ABC-9081-2342', 'Diya', 'S', 'Mehta', 'FEMALE', '2004-09-20', 'GENERAL', 'diya.mehta@swarrnim.edu.in', '+91 91234 56781', 'ACTIVE', '2024-07-15'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333301', '55555555-5555-5555-5555-555555555501', '66666666-6666-6666-6666-666666666601', '20240101003', 'ADM-2024-003', 'ABC-9081-2343', 'Rohan', 'K', 'Joshi', 'MALE', '2004-11-05', 'OBC', 'rohan.joshi@swarrnim.edu.in', '+91 91234 56782', 'ACTIVE', '2024-07-15')
ON CONFLICT (enrollment_number) DO NOTHING;

-- 9. Parents Master & Student Linkages
INSERT INTO parents (id, first_name, middle_name, last_name, relation_type, occupation, contact_number, email, status)
VALUES 
    ('cccccccc-cccc-cccc-cccc-cccccccccccc1', 'Mahesh', 'B', 'Patel', 'FATHER', 'Business Owner', '+91 99887 76655', 'mahesh.patel@gmail.com', 'ACTIVE'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc2', 'Suresh', 'N', 'Mehta', 'FATHER', 'Civil Engineer', '+91 99887 76656', 'suresh.mehta@gmail.com', 'ACTIVE')
ON CONFLICT DO NOTHING;

INSERT INTO student_parent_mappings (student_id, parent_id, is_primary_contact, can_access_portal, relationship_label)
VALUES 
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'cccccccc-cccc-cccc-cccc-cccccccccccc1', TRUE, TRUE, 'Father'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'cccccccc-cccc-cccc-cccc-cccccccccccc2', TRUE, TRUE, 'Father')
ON CONFLICT (student_id, parent_id) DO NOTHING;

-- 10. Student Academic Enrollments (Progression)
INSERT INTO student_academic_enrollments (id, student_id, academic_year_id, semester_id, division_id, roll_number, is_current, academic_status)
VALUES 
    ('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '44444444-4444-4444-4444-444444444444', '77777777-7777-7777-7777-777777777705', '88888888-8888-8888-8888-888888888801', '01', TRUE, 'ENROLLED'),
    ('dddddddd-dddd-dddd-dddd-ddddddddddd2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '44444444-4444-4444-4444-444444444444', '77777777-7777-7777-7777-777777777705', '88888888-8888-8888-8888-888888888801', '02', TRUE, 'ENROLLED'),
    ('dddddddd-dddd-dddd-dddd-ddddddddddd3', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', '44444444-4444-4444-4444-444444444444', '77777777-7777-7777-7777-777777777705', '88888888-8888-8888-8888-888888888801', '03', TRUE, 'ENROLLED')
ON CONFLICT (student_id, academic_year_id, semester_id) DO NOTHING;

-- 11. Faculty Workload & Subject Allocations
INSERT INTO faculty_subject_allocations (id, faculty_id, subject_id, division_id, academic_year_id, allocation_role, status)
VALUES 
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '99999999-9999-9999-9999-999999999901', '88888888-8888-8888-8888-888888888801', '44444444-4444-4444-4444-444444444444', 'PRIMARY_FACULTY', 'ACTIVE'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '99999999-9999-9999-9999-999999999902', '88888888-8888-8888-8888-888888888801', '44444444-4444-4444-4444-444444444444', 'PRIMARY_FACULTY', 'ACTIVE'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '99999999-9999-9999-9999-999999999903', '88888888-8888-8888-8888-888888888801', '44444444-4444-4444-4444-444444444444', 'PRIMARY_FACULTY', 'ACTIVE')
ON CONFLICT (faculty_id, subject_id, division_id, academic_year_id) DO NOTHING;

-- 12. Student-Mentor Mappings
INSERT INTO mentor_allocations (id, faculty_id, student_id, academic_year_id, is_active, assigned_at)
VALUES 
    ('ffffffff-ffff-ffff-ffff-fffffffffff1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '44444444-4444-4444-4444-444444444444', TRUE, '2026-06-20'),
    ('ffffffff-ffff-ffff-ffff-fffffffffff2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', '44444444-4444-4444-4444-444444444444', TRUE, '2026-06-20'),
    ('ffffffff-ffff-ffff-ffff-fffffffffff3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '44444444-4444-4444-4444-444444444444', TRUE, '2026-06-20')
ON CONFLICT (student_id, academic_year_id) DO NOTHING;
