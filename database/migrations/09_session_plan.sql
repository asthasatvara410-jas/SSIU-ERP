-- ==============================================================================
-- PHASE 09: SESSION PLAN & CURRICULUM DELIVERY MODULE
-- Syllabus Mapping, Topic Delivery Tracking & Unit Materials
-- ==============================================================================

-- 1. Session Plan Header
CREATE TABLE IF NOT EXISTS session_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    allocation_id UUID NOT NULL UNIQUE REFERENCES faculty_subject_allocations(id) ON DELETE RESTRICT,
    total_planned_sessions INT DEFAULT 45 NOT NULL CHECK (total_planned_sessions > 0),
    total_completed_sessions INT DEFAULT 0 NOT NULL CHECK (total_completed_sessions >= 0),
    academic_objectives TEXT,
    course_learning_outcomes TEXT,
    approval_status VARCHAR(30) DEFAULT 'DRAFT' NOT NULL 
        CHECK (approval_status IN ('DRAFT', 'SUBMITTED', 'HOD_APPROVED', 'REJECTED', 'REVISION_REQUESTED')),
    approved_by_hod_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ NULL
);

CREATE TRIGGER trg_session_plans_updated_at
BEFORE UPDATE ON session_plans
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 2. Session Plan Topics (Line Items per Lecture)
CREATE TABLE IF NOT EXISTS session_plan_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_plan_id UUID NOT NULL REFERENCES session_plans(id) ON DELETE CASCADE,
    unit_number INT NOT NULL CHECK (unit_number >= 1 AND unit_number <= 10),
    session_number INT NOT NULL CHECK (session_number >= 1),
    topic_title VARCHAR(255) NOT NULL,
    sub_topics TEXT,
    pedagogy VARCHAR(100) DEFAULT 'CHALK_AND_TALK' NOT NULL 
        CHECK (pedagogy IN ('CHALK_AND_TALK', 'ICT_PRESENTATION', 'SEMINAR', 'CASE_STUDY', 'LAB_PRACTICE', 'FLIPPED_CLASSROOM', 'GROUP_DISCUSSION')),
    planned_date DATE,
    actual_completed_date DATE,
    delivery_status VARCHAR(20) DEFAULT 'PENDING' NOT NULL 
        CHECK (delivery_status IN ('PENDING', 'COMPLETED', 'RESCHEDULED', 'SKIPPED')),
    completion_remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_plan_session_seq UNIQUE (session_plan_id, session_number)
);

CREATE INDEX IF NOT EXISTS idx_spt_plan ON session_plan_topics(session_plan_id);
CREATE INDEX IF NOT EXISTS idx_spt_status ON session_plan_topics(delivery_status);

CREATE TRIGGER trg_session_plan_topics_updated_at
BEFORE UPDATE ON session_plan_topics
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 3. Unit Study Materials
CREATE TABLE IF NOT EXISTS unit_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    topic_id UUID REFERENCES session_plan_topics(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    unit_number INT NOT NULL,
    material_type VARCHAR(30) DEFAULT 'PDF' NOT NULL CHECK (material_type IN ('PDF', 'PPT', 'DOC', 'VIDEO_LINK', 'NOTES', 'CODE_SAMPLE')),
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    uploaded_by_faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE RESTRICT,
    is_published BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_unit_mat_subject ON unit_materials(subject_id);
CREATE INDEX IF NOT EXISTS idx_unit_mat_unit ON unit_materials(subject_id, unit_number);

CREATE TRIGGER trg_unit_materials_updated_at
BEFORE UPDATE ON unit_materials
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
