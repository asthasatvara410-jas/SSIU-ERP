-- ==============================================================================
-- PHASE 14: AUDIT LOGGING & SECURITY GOVERNANCE
-- Immutable Activity Ledger & Access Audit Trails
-- ==============================================================================

-- 1. Immutable Central Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_accounts(id) ON DELETE SET NULL,
    actor_username VARCHAR(100),
    actor_role VARCHAR(50),
    action VARCHAR(50) NOT NULL,                   -- 'INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'STATUS_CHANGE'
    entity_name VARCHAR(100) NOT NULL,             -- e.g. 'students', 'attendance_records', 'marks'
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    ip_address VARCHAR(50),
    user_agent TEXT,
    session_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity_record ON audit_logs(entity_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at DESC);

-- 2. Security Incidents & Anomaly Tracking
CREATE TABLE IF NOT EXISTS security_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_type VARCHAR(50) NOT NULL,            -- 'BRUTE_FORCE_ATTEMPT', 'UNAUTHORIZED_ACCESS_BLOCKED', 'TAMPERING_DETECTED', 'SQLI_ATTEMPT'
    severity VARCHAR(20) DEFAULT 'MEDIUM' NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    user_id UUID REFERENCES user_accounts(id) ON DELETE SET NULL,
    target_resource VARCHAR(255) NOT NULL,
    ip_address VARCHAR(50) NOT NULL,
    details JSONB,
    status VARCHAR(20) DEFAULT 'OPEN' NOT NULL CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE', 'BLOCKED')),
    resolved_by_user_id UUID REFERENCES user_accounts(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sec_incident_type ON security_incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_sec_incident_severity ON security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_sec_incident_status ON security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_sec_incident_created ON security_incidents(created_at DESC);
