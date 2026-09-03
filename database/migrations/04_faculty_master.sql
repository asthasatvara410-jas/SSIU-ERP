-- ==============================================================================
-- PHASE 04: CENTRAL FACULTY & STAFF MASTER
-- Single Source of Truth for Faculty & Academic Mentors
-- ==============================================================================

CREATE TABLE IF NOT EXISTS faculty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE RESTRICT,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    
    -- Employee Identifiers
    employee_code VARCHAR(50) NOT NULL UNIQUE,
    biometric_id VARCHAR(50),
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    dob DATE,
    blood_group VARCHAR(10),
    aadhaar_number VARCHAR(20),
    pan_number VARCHAR(20),
    
    -- Academic & Professional Profile
    designation VARCHAR(100) NOT NULL,             -- 'Assistant Professor', 'Associate Professor', 'Professor', 'HOD', 'Dean'
    highest_qualification VARCHAR(255) NOT NULL,   -- 'Ph.D in AI & ML', 'M.Tech Computer Engineering'
    specialization TEXT,
    teaching_experience_years NUMERIC(4, 1) DEFAULT 0.0,
    industry_experience_years NUMERIC(4, 1) DEFAULT 0.0,
    research_areas TEXT,
    
    -- Contact Details
    institutional_email VARCHAR(255) NOT NULL UNIQUE,
    personal_email VARCHAR(255),
    contact_number VARCHAR(20) NOT NULL,
    alternate_contact_number VARCHAR(20),
    current_address TEXT,
    permanent_address TEXT,
    
    -- Employment Details
    employment_type VARCHAR(30) DEFAULT 'REGULAR' NOT NULL 
        CHECK (employment_type IN ('REGULAR', 'CONTRACTUAL', 'PROBATION', 'VISITING', 'ADJUNCT', 'EMERITUS')),
    employment_status VARCHAR(30) DEFAULT 'ACTIVE' NOT NULL 
        CHECK (employment_status IN ('ACTIVE', 'ON_LEAVE', 'RELIEVED', 'RETIRED', 'SUSPENDED')),
    joining_date DATE NOT NULL,
    confirmation_date DATE,
    relieving_date DATE,
    profile_photo_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ NULL
);

-- Secondary / Joint Department Affiliations (For interdisciplinary faculty)
CREATE TABLE IF NOT EXISTS faculty_department_affiliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    affiliation_type VARCHAR(30) DEFAULT 'JOINT' NOT NULL CHECK (affiliation_type IN ('PRIMARY', 'JOINT', 'VISITING', 'ALLIED')),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_faculty_dept_affiliation UNIQUE (faculty_id, department_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_faculty_employee_code ON faculty(employee_code);
CREATE INDEX IF NOT EXISTS idx_faculty_institute ON faculty(institute_id);
CREATE INDEX IF NOT EXISTS idx_faculty_department ON faculty(department_id);
CREATE INDEX IF NOT EXISTS idx_faculty_status ON faculty(employment_status);
CREATE INDEX IF NOT EXISTS idx_fda_faculty ON faculty_department_affiliations(faculty_id);

CREATE TRIGGER trg_faculty_updated_at
BEFORE UPDATE ON faculty
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER trg_faculty_department_affiliations_updated_at
BEFORE UPDATE ON faculty_department_affiliations
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
