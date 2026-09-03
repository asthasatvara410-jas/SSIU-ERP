-- ==============================================================================
-- PHASE 05: CENTRAL ACADEMIC MAPPING LAYER
-- Bridges Students, Faculty, and Academic Structure (Zero Data Duplication)
-- ==============================================================================

-- 1. Student Academic Progression & Placement Record
-- Tracks student movement through Academic Years, Semesters, and Divisions
CREATE TABLE IF NOT EXISTS student_academic_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE RESTRICT,
    division_id UUID NOT NULL REFERENCES divisions(id) ON DELETE RESTRICT,
    roll_number VARCHAR(30),
    is_current BOOLEAN DEFAULT TRUE NOT NULL,
    enrollment_date DATE DEFAULT CURRENT_DATE NOT NULL,
    academic_status VARCHAR(30) DEFAULT 'ENROLLED' NOT NULL 
        CHECK (academic_status IN ('ENROLLED', 'PROMOTED', 'DETAINED', 'BACKLOG', 'CANCELLED', 'TRANSFERRED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_student_ay_semester UNIQUE (student_id, academic_year_id, semester_id)
);

CREATE INDEX IF NOT EXISTS idx_sae_student ON student_academic_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_sae_ay ON student_academic_enrollments(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_sae_semester ON student_academic_enrollments(semester_id);
CREATE INDEX IF NOT EXISTS idx_sae_division ON student_academic_enrollments(division_id);
CREATE INDEX IF NOT EXISTS idx_sae_current ON student_academic_enrollments(student_id, is_current);

CREATE TRIGGER trg_student_academic_enrollments_updated_at
BEFORE UPDATE ON student_academic_enrollments
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 2. Faculty Teaching Allocation & Subject Workload Mapping
-- Maps Faculty to Subjects, Divisions, and Academic Years
CREATE TABLE IF NOT EXISTS faculty_subject_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE RESTRICT,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    division_id UUID NOT NULL REFERENCES divisions(id) ON DELETE RESTRICT,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    allocation_role VARCHAR(30) DEFAULT 'PRIMARY_FACULTY' NOT NULL 
        CHECK (allocation_role IN ('PRIMARY_FACULTY', 'CO_FACULTY', 'LAB_INSTRUCTOR', 'GUEST_LECTURER')),
    weekly_theory_hours INT DEFAULT 3 NOT NULL CHECK (weekly_theory_hours >= 0),
    weekly_practical_hours INT DEFAULT 2 NOT NULL CHECK (weekly_practical_hours >= 0),
    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE', 'TRANSFERRED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_faculty_subject_div_ay UNIQUE (faculty_id, subject_id, division_id, academic_year_id)
);

CREATE INDEX IF NOT EXISTS idx_fsa_faculty ON faculty_subject_allocations(faculty_id);
CREATE INDEX IF NOT EXISTS idx_fsa_subject ON faculty_subject_allocations(subject_id);
CREATE INDEX IF NOT EXISTS idx_fsa_division ON faculty_subject_allocations(division_id);
CREATE INDEX IF NOT EXISTS idx_fsa_ay ON faculty_subject_allocations(academic_year_id);

CREATE TRIGGER trg_faculty_subject_allocations_updated_at
BEFORE UPDATE ON faculty_subject_allocations
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 3. Student Subject Registration (Supports Core & Elective enrollments per term)
CREATE TABLE IF NOT EXISTS student_subject_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_enrollment_id UUID NOT NULL REFERENCES student_academic_enrollments(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    registration_type VARCHAR(20) DEFAULT 'REGULAR' NOT NULL CHECK (registration_type IN ('REGULAR', 'REMEDIAL', 'ELECTIVE', 'AUDIT')),
    is_approved BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_student_enrollment_subject UNIQUE (student_enrollment_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_ssr_enrollment ON student_subject_registrations(student_enrollment_id);
CREATE INDEX IF NOT EXISTS idx_ssr_subject ON student_subject_registrations(subject_id);

CREATE TRIGGER trg_student_subject_registrations_updated_at
BEFORE UPDATE ON student_subject_registrations
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
