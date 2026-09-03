-- ==============================================================================
-- PHASE 01: CORE ACADEMIC MASTER
-- Hierarchy: University -> Institute -> Department -> Program -> Batch -> Semester -> Division -> Subject
-- ==============================================================================

-- 1. Universities Master
CREATE TABLE IF NOT EXISTS universities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    tagline VARCHAR(255),
    address TEXT,
    website VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    established_year INT,
    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ NULL
);

CREATE TRIGGER trg_universities_updated_at
BEFORE UPDATE ON universities
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 2. Institutes / Constituent Colleges Master
CREATE TABLE IF NOT EXISTS institutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE RESTRICT,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    category VARCHAR(100),
    established_year INT,
    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_institutes_university ON institutes(university_id);

CREATE TRIGGER trg_institutes_updated_at
BEFORE UPDATE ON institutes
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 3. Departments Master
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE RESTRICT,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_departments_institute ON departments(institute_id);

CREATE TRIGGER trg_departments_updated_at
BEFORE UPDATE ON departments
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 4. Academic Years Master
CREATE TABLE IF NOT EXISTS academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    start_year INT NOT NULL,
    end_year INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL CHECK (status IN ('ACTIVE', 'ARCHIVED', 'PLANNED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT chk_ay_years CHECK (end_year > start_year)
);

CREATE TRIGGER trg_academic_years_updated_at
BEFORE UPDATE ON academic_years
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 5. Programs / Degrees Master
CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    degree_type VARCHAR(30) NOT NULL CHECK (degree_type IN ('DIPLOMA', 'UG', 'PG', 'DOCTORAL', 'CERTIFICATE')),
    duration_years INT DEFAULT 4 NOT NULL CHECK (duration_years > 0),
    total_semesters INT DEFAULT 8 NOT NULL CHECK (total_semesters > 0),
    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_programs_department ON programs(department_id);

CREATE TRIGGER trg_programs_updated_at
BEFORE UPDATE ON programs
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 6. Batches (Admission Year Cohort)
CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE RESTRICT,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    start_year INT NOT NULL,
    end_year INT NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL CHECK (status IN ('ACTIVE', 'GRADUATED', 'INACTIVE')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_batches_program ON batches(program_id);
CREATE INDEX IF NOT EXISTS idx_batches_ay ON batches(academic_year_id);

CREATE TRIGGER trg_batches_updated_at
BEFORE UPDATE ON batches
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 7. Semesters Master
CREATE TABLE IF NOT EXISTS semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE RESTRICT,
    semester_number INT NOT NULL CHECK (semester_number >= 1 AND semester_number <= 12),
    name VARCHAR(50) NOT NULL,
    term_type VARCHAR(10) NOT NULL CHECK (term_type IN ('ODD', 'EVEN')),
    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_program_semester UNIQUE (program_id, semester_number)
);

CREATE INDEX IF NOT EXISTS idx_semesters_program ON semesters(program_id);

CREATE TRIGGER trg_semesters_updated_at
BEFORE UPDATE ON semesters
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 8. Divisions / Class Sections
CREATE TABLE IF NOT EXISTS divisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE RESTRICT,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(50) NOT NULL,
    capacity INT DEFAULT 60 NOT NULL CHECK (capacity > 0),
    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_semester_division UNIQUE (semester_id, code)
);

CREATE INDEX IF NOT EXISTS idx_divisions_semester ON divisions(semester_id);

CREATE TRIGGER trg_divisions_updated_at
BEFORE UPDATE ON divisions
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 9. Subjects / Courses Master
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE RESTRICT,
    semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE RESTRICT,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    subject_type VARCHAR(30) NOT NULL CHECK (subject_type IN ('THEORY', 'PRACTICAL', 'TUTORIAL', 'PROJECT', 'ELECTIVE')),
    credits NUMERIC(4, 2) DEFAULT 3.00 NOT NULL CHECK (credits >= 0),
    total_theory_hours INT DEFAULT 45 NOT NULL,
    total_practical_hours INT DEFAULT 30 NOT NULL,
    is_elective BOOLEAN DEFAULT FALSE NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_subjects_semester ON subjects(semester_id);
CREATE INDEX IF NOT EXISTS idx_subjects_program ON subjects(program_id);

CREATE TRIGGER trg_subjects_updated_at
BEFORE UPDATE ON subjects
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
