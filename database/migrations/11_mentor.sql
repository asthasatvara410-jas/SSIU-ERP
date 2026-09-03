-- ==============================================================================
-- PHASE 11: MENTORSHIP & ACADEMIC ADVISING MODULE
-- Mentor-Mentee Allocations, Counseling Notes & Early Risk Alerts
-- ==============================================================================

-- 1. Student Mentor Allocation Master
CREATE TABLE IF NOT EXISTS mentor_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE RESTRICT,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    assigned_at DATE DEFAULT CURRENT_DATE NOT NULL,
    assigned_by_hod_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_student_mentor_ay UNIQUE (student_id, academic_year_id)
);

CREATE INDEX IF NOT EXISTS idx_mentor_alloc_faculty ON mentor_allocations(faculty_id);
CREATE INDEX IF NOT EXISTS idx_mentor_alloc_student ON mentor_allocations(student_id);
CREATE INDEX IF NOT EXISTS idx_mentor_alloc_ay ON mentor_allocations(academic_year_id);

CREATE TRIGGER trg_mentor_allocations_updated_at
BEFORE UPDATE ON mentor_allocations
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 2. Mentor Counseling Sessions & Interaction Ledger
CREATE TABLE IF NOT EXISTS mentor_counseling_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_allocation_id UUID NOT NULL REFERENCES mentor_allocations(id) ON DELETE CASCADE,
    meeting_date DATE NOT NULL,
    category VARCHAR(50) NOT NULL 
        CHECK (category IN ('ACADEMIC_PROGRESS', 'ATTENDANCE_SHORTAGE', 'CAREER_COUNSELING', 'PERSONAL_WELLBEING', 'DISCIPLINARY', 'EXAM_PREPARATION', 'PARENTAL_CONCERN')),
    is_confidential BOOLEAN DEFAULT FALSE NOT NULL,
    discussion_points TEXT NOT NULL,
    action_items TEXT,
    follow_up_date DATE,
    student_acknowledged BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_counseling_alloc ON mentor_counseling_logs(mentor_allocation_id);
CREATE INDEX IF NOT EXISTS idx_counseling_date ON mentor_counseling_logs(meeting_date);

CREATE TRIGGER trg_mentor_counseling_logs_updated_at
BEFORE UPDATE ON mentor_counseling_logs
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 3. Mentor Early Academic Risk Alerts
CREATE TABLE IF NOT EXISTS mentor_risk_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_allocation_id UUID NOT NULL REFERENCES mentor_allocations(id) ON DELETE CASCADE,
    risk_level VARCHAR(20) DEFAULT 'MEDIUM' NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    risk_factor VARCHAR(50) NOT NULL CHECK (risk_factor IN ('ATTENDANCE_DEFICIT', 'FAILED_INTERNAL_EXAM', 'BACKLOGS', 'FEE_DUES', 'PROLONGED_ABSENCE')),
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'OPEN' NOT NULL CHECK (status IN ('OPEN', 'IN_REVIEW', 'PARENT_NOTIFIED', 'RESOLVED', 'CLOSED')),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_risk_alerts_alloc ON mentor_risk_alerts(mentor_allocation_id);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_status ON mentor_risk_alerts(status);

CREATE TRIGGER trg_mentor_risk_alerts_updated_at
BEFORE UPDATE ON mentor_risk_alerts
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
