-- ==============================================================================
-- PHASE 02: CENTRAL STUDENT MASTER
-- Single Source of Truth for Student Profiles
-- ==============================================================================

CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE RESTRICT,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE RESTRICT,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
    
    -- Institutional Identifiers
    enrollment_number VARCHAR(50) UNIQUE,
    temporary_enrollment_number VARCHAR(50) UNIQUE,
    admission_number VARCHAR(50) UNIQUE,
    abc_id VARCHAR(50),                            -- Academic Bank of Credits (ABC) ID
    digilocker_id VARCHAR(50),
    
    -- Student Personal Information
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    dob DATE NOT NULL,
    blood_group VARCHAR(10),
    nationality VARCHAR(50) DEFAULT 'Indian' NOT NULL,
    category VARCHAR(30) DEFAULT 'GENERAL' NOT NULL CHECK (category IN ('GENERAL', 'OBC', 'SC', 'ST', 'EWS', 'MANAGEMENT', 'NRI', 'OTHER')),
    aadhaar_number VARCHAR(20),
    
    -- Contact Details
    institutional_email VARCHAR(255) NOT NULL UNIQUE,
    personal_email VARCHAR(255),
    contact_number VARCHAR(20) NOT NULL,
    emergency_contact_number VARCHAR(20),
    current_address TEXT,
    permanent_address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    
    -- Academic Lifecycle & Status
    admission_date DATE DEFAULT CURRENT_DATE NOT NULL,
    enrollment_status VARCHAR(30) DEFAULT 'ACTIVE' NOT NULL 
        CHECK (enrollment_status IN ('TEMPORARY', 'PROVISIONAL', 'ACTIVE', 'DETAINED', 'PASSED_OUT', 'TRANSFERRED', 'DROPPED', 'SUSPENDED')),
    profile_photo_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ NULL
);

-- Compound and Performance Indexes
CREATE INDEX IF NOT EXISTS idx_students_enrollment ON students(enrollment_number);
CREATE INDEX IF NOT EXISTS idx_students_temp_enrollment ON students(temporary_enrollment_number);
CREATE INDEX IF NOT EXISTS idx_students_institute ON students(institute_id);
CREATE INDEX IF NOT EXISTS idx_students_department ON students(department_id);
CREATE INDEX IF NOT EXISTS idx_students_program ON students(program_id);
CREATE INDEX IF NOT EXISTS idx_students_batch ON students(batch_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(enrollment_status);

CREATE TRIGGER trg_students_updated_at
BEFORE UPDATE ON students
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
