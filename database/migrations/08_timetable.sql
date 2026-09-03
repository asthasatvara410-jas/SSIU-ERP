-- ==============================================================================
-- PHASE 08: TIMETABLE & SCHEDULING MODULE
-- Weekly Master Timetable & Dynamic Faculty Substitutions
-- ==============================================================================

-- 1. Master Timetable Slot Schedule
CREATE TABLE IF NOT EXISTS timetable_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    allocation_id UUID NOT NULL REFERENCES faculty_subject_allocations(id) ON DELETE RESTRICT,
    day_of_week VARCHAR(15) NOT NULL 
        CHECK (day_of_week IN ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY')),
    slot_number INT NOT NULL CHECK (slot_number >= 1 AND slot_number <= 12),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    classroom_number VARCHAR(50) NOT NULL,
    lab_number VARCHAR(50),
    slot_type VARCHAR(20) DEFAULT 'LECTURE' NOT NULL CHECK (slot_type IN ('LECTURE', 'LAB', 'TUTORIAL', 'SEMINAR', 'PROJECT')),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    effective_from DATE DEFAULT CURRENT_DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_timetable_allocation_slot UNIQUE (allocation_id, day_of_week, slot_number, effective_from)
);

CREATE INDEX IF NOT EXISTS idx_tt_allocation ON timetable_slots(allocation_id);
CREATE INDEX IF NOT EXISTS idx_tt_day_slot ON timetable_slots(day_of_week, slot_number);

CREATE TRIGGER trg_timetable_slots_updated_at
BEFORE UPDATE ON timetable_slots
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 2. Timetable Substitutions (Leave adjustments & ad-hoc temporary coverage)
CREATE TABLE IF NOT EXISTS timetable_substitutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timetable_slot_id UUID NOT NULL REFERENCES timetable_slots(id) ON DELETE RESTRICT,
    original_faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE RESTRICT,
    substitute_faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE RESTRICT,
    substitution_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PROPOSED' NOT NULL 
        CHECK (status IN ('PROPOSED', 'ACCEPTED', 'REJECTED', 'HOD_APPROVED', 'COMPLETED', 'CANCELLED')),
    approved_by_hod_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_substitution_slot_date UNIQUE (timetable_slot_id, substitution_date)
);

CREATE INDEX IF NOT EXISTS idx_tt_sub_date ON timetable_substitutions(substitution_date);
CREATE INDEX IF NOT EXISTS idx_tt_sub_orig_fac ON timetable_substitutions(original_faculty_id);
CREATE INDEX IF NOT EXISTS idx_tt_sub_sub_fac ON timetable_substitutions(substitute_faculty_id);

CREATE TRIGGER trg_timetable_substitutions_updated_at
BEFORE UPDATE ON timetable_substitutions
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
