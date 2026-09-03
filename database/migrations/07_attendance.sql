-- ==============================================================================
-- PHASE 07: ATTENDANCE MANAGEMENT MODULE
-- Lecture Sessions, Biometric Logs & Student Attendance Ledgers
-- ==============================================================================

-- 1. Attendance Lecture Sessions
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    allocation_id UUID NOT NULL REFERENCES faculty_subject_allocations(id) ON DELETE RESTRICT,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    session_type VARCHAR(20) DEFAULT 'REGULAR' NOT NULL 
        CHECK (session_type IN ('REGULAR', 'EXTRA', 'REMEDIAL', 'LAB', 'TUTORIAL')),
    session_mode VARCHAR(20) DEFAULT 'OFFLINE' NOT NULL CHECK (session_mode IN ('OFFLINE', 'ONLINE', 'HYBRID')),
    topic_covered TEXT,
    classroom_number VARCHAR(50),
    total_present INT DEFAULT 0 NOT NULL CHECK (total_present >= 0),
    total_absent INT DEFAULT 0 NOT NULL CHECK (total_absent >= 0),
    is_locked BOOLEAN DEFAULT FALSE NOT NULL,      -- Locked after 24h/faculty finalization
    taken_by_user_id UUID NOT NULL REFERENCES user_accounts(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_session_allocation_datetime UNIQUE (allocation_id, session_date, start_time)
);

CREATE INDEX IF NOT EXISTS idx_att_sessions_allocation ON attendance_sessions(allocation_id);
CREATE INDEX IF NOT EXISTS idx_att_sessions_date ON attendance_sessions(session_date);

CREATE TRIGGER trg_attendance_sessions_updated_at
BEFORE UPDATE ON attendance_sessions
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 2. Student Attendance Ledger
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'PRESENT' NOT NULL 
        CHECK (status IN ('PRESENT', 'ABSENT', 'ON_LEAVE', 'OD_DUTY', 'EXCUSED')),
    remarks VARCHAR(255),
    marked_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_attendance_session_student UNIQUE (session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_att_records_session ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_att_records_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_att_records_status ON attendance_records(status);

-- 3. Attendance Condonation & Shortage Justification Applications
CREATE TABLE IF NOT EXISTS attendance_condonations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_number VARCHAR(50) NOT NULL UNIQUE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    reason_category VARCHAR(50) NOT NULL CHECK (reason_category IN ('MEDICAL', 'SPORTS_CULTURAL', 'BEREAVEMENT', 'OFFICIAL_DUTY', 'OTHER')),
    justification TEXT NOT NULL,
    supporting_document_url TEXT,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    missed_sessions_count INT DEFAULT 1 NOT NULL CHECK (missed_sessions_count > 0),
    approval_stage VARCHAR(30) DEFAULT 'SUBMITTED' NOT NULL 
        CHECK (approval_stage IN ('SUBMITTED', 'FACULTY_RECOMMENDED', 'MENTOR_RECOMMENDED', 'HOD_APPROVED', 'HOI_APPROVED', 'REJECTED')),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_condonation_student ON attendance_condonations(student_id);
CREATE INDEX IF NOT EXISTS idx_condonation_subject ON attendance_condonations(subject_id);

CREATE TRIGGER trg_attendance_condonations_updated_at
BEFORE UPDATE ON attendance_condonations
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
