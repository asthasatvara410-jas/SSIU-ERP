-- ==============================================================================
-- PHASE 10: ASSIGNMENT & CONTINUOUS EVALUATION MODULE
-- Tasks, Homework, Student Submissions & Grading Ledgers
-- ==============================================================================

-- 1. Assignment Master
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    allocation_id UUID NOT NULL REFERENCES faculty_subject_allocations(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assignment_number INT DEFAULT 1 NOT NULL CHECK (assignment_number > 0),
    max_marks NUMERIC(5, 2) DEFAULT 10.00 NOT NULL CHECK (max_marks > 0),
    weightage_percent NUMERIC(4, 2) DEFAULT 5.00,
    due_date TIMESTAMPTZ NOT NULL,
    allow_late_submissions BOOLEAN DEFAULT FALSE NOT NULL,
    attachment_url TEXT,
    status VARCHAR(20) DEFAULT 'PUBLISHED' NOT NULL CHECK (status IN ('DRAFT', 'PUBLISHED', 'EVALUATION_IN_PROGRESS', 'CLOSED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_allocation_assignment_num UNIQUE (allocation_id, assignment_number)
);

CREATE INDEX IF NOT EXISTS idx_assignments_allocation ON assignments(allocation_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due ON assignments(due_date);

CREATE TRIGGER trg_assignments_updated_at
BEFORE UPDATE ON assignments
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 2. Student Submissions & Grading Ledger
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE RESTRICT,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    submission_url TEXT NOT NULL,
    file_name VARCHAR(255),
    submission_notes TEXT,
    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_late BOOLEAN DEFAULT FALSE NOT NULL,
    
    -- Evaluation Details
    marks_obtained NUMERIC(5, 2) CHECK (marks_obtained >= 0),
    graded_by_faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
    graded_at TIMESTAMPTZ,
    faculty_feedback TEXT,
    status VARCHAR(30) DEFAULT 'SUBMITTED' NOT NULL 
        CHECK (status IN ('SUBMITTED', 'GRADED', 'LATE_SUBMITTED', 'RESUBMISSION_REQUESTED', 'REJECTED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_assignment_student_submission UNIQUE (assignment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_asgn_sub_assignment ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_asgn_sub_student ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_asgn_sub_status ON assignment_submissions(status);

CREATE TRIGGER trg_assignment_submissions_updated_at
BEFORE UPDATE ON assignment_submissions
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
