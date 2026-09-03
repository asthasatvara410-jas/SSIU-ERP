-- ==============================================================================
-- PHASE 03: CENTRAL PARENT / GUARDIAN MASTER
-- Supports Multi-Ward and Multi-Guardian Mapping
-- ==============================================================================

-- 1. Parent / Guardian Master
CREATE TABLE IF NOT EXISTS parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    relation_type VARCHAR(30) DEFAULT 'FATHER' NOT NULL CHECK (relation_type IN ('FATHER', 'MOTHER', 'GUARDIAN')),
    occupation VARCHAR(100),
    annual_income NUMERIC(12, 2),
    contact_number VARCHAR(20) NOT NULL,
    alternate_contact_number VARCHAR(20),
    email VARCHAR(255),
    residential_address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_parents_contact ON parents(contact_number);
CREATE INDEX IF NOT EXISTS idx_parents_email ON parents(email);

CREATE TRIGGER trg_parents_updated_at
BEFORE UPDATE ON parents
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 2. Student-Parent Junction Table (Normalized Many-to-Many Relationship)
CREATE TABLE IF NOT EXISTS student_parent_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    is_primary_contact BOOLEAN DEFAULT TRUE NOT NULL,
    can_access_portal BOOLEAN DEFAULT TRUE NOT NULL,
    relationship_label VARCHAR(50) DEFAULT 'Parent' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_student_parent UNIQUE (student_id, parent_id)
);

CREATE INDEX IF NOT EXISTS idx_spm_student ON student_parent_mappings(student_id);
CREATE INDEX IF NOT EXISTS idx_spm_parent ON student_parent_mappings(parent_id);

CREATE TRIGGER trg_student_parent_mappings_updated_at
BEFORE UPDATE ON student_parent_mappings
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
