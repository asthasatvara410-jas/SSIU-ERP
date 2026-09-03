-- ==============================================================================
-- PHASE 12: PARENT-TEACHER MEETING (PTM) MODULE
-- Schedules, Attendance Logs & Grievance / Action Follow-ups
-- ==============================================================================

-- 1. PTM Meeting Events Master
CREATE TABLE IF NOT EXISTS ptm_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
    semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    agenda TEXT,
    meeting_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    venue VARCHAR(100),
    is_virtual BOOLEAN DEFAULT FALSE NOT NULL,
    meeting_link TEXT,
    organized_by_faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'SCHEDULED' NOT NULL 
        CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_ptm_dept ON ptm_meetings(department_id);
CREATE INDEX IF NOT EXISTS idx_ptm_date ON ptm_meetings(meeting_date);

CREATE TRIGGER trg_ptm_meetings_updated_at
BEFORE UPDATE ON ptm_meetings
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 2. PTM Attendees & Interaction Minutes
CREATE TABLE IF NOT EXISTS ptm_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ptm_meeting_id UUID NOT NULL REFERENCES ptm_meetings(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    parent_id UUID REFERENCES parents(id) ON DELETE SET NULL,
    faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE RESTRICT,
    parent_name_snapshot VARCHAR(150) NOT NULL,
    parent_contact_snapshot VARCHAR(20),
    attended BOOLEAN DEFAULT FALSE NOT NULL,
    attendance_time TIMESTAMPTZ,
    academic_feedback_given TEXT,
    parent_concerns_raised TEXT,
    action_plan_agreed TEXT,
    satisfaction_score INT CHECK (satisfaction_score BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_ptm_student_record UNIQUE (ptm_meeting_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_ptm_att_meeting ON ptm_attendees(ptm_meeting_id);
CREATE INDEX IF NOT EXISTS idx_ptm_att_student ON ptm_attendees(student_id);
CREATE INDEX IF NOT EXISTS idx_ptm_att_faculty ON ptm_attendees(faculty_id);

CREATE TRIGGER trg_ptm_attendees_updated_at
BEFORE UPDATE ON ptm_attendees
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
