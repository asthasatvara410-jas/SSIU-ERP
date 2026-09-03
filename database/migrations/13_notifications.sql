-- ==============================================================================
-- PHASE 13: NOTIFICATIONS & DISPATCH ENGINE
-- Scoped Broadcasts, Targeted Delivery & Real-time Read Receipts
-- ==============================================================================

-- 1. Notifications Master Dispatch Record
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    module VARCHAR(50) NOT NULL,                   -- 'ACADEMIC', 'EXAM', 'FEES', 'ATTENDANCE', 'HOSTEL', 'NOTICE'
    priority VARCHAR(20) DEFAULT 'NORMAL' NOT NULL 
        CHECK (priority IN ('URGENT', 'HIGH', 'MEDIUM', 'NORMAL', 'LOW')),
    notification_type VARCHAR(30) DEFAULT 'INFORMATION' NOT NULL 
        CHECK (notification_type IN ('INFORMATION', 'ACTION_REQUIRED', 'DEADLINE', 'WARNING', 'STATUS_UPDATE', 'SUCCESS', 'REJECTION')),
    scope_type VARCHAR(30) DEFAULT 'TARGETED' NOT NULL 
        CHECK (scope_type IN ('TARGETED', 'ROLE_BASED', 'DEPARTMENT_WIDE', 'INSTITUTE_WIDE', 'UNIVERSITY_WIDE')),
    
    -- Scoping Constraints
    target_role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    target_institute_id UUID REFERENCES institutes(id) ON DELETE SET NULL,
    target_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    target_program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
    target_semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL,
    target_division_id UUID REFERENCES divisions(id) ON DELETE SET NULL,
    
    -- Action & Deep Link Meta
    link_tab VARCHAR(100),
    action_url TEXT,
    action_label VARCHAR(100),
    attachment_name VARCHAR(255),
    attachment_url TEXT,
    
    created_by_user_id UUID REFERENCES user_accounts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_notif_module ON notifications(module);
CREATE INDEX IF NOT EXISTS idx_notif_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notif_scope ON notifications(scope_type);
CREATE INDEX IF NOT EXISTS idx_notif_created_at ON notifications(created_at DESC);

-- 2. Notification Recipients & Read State
CREATE TABLE IF NOT EXISTS notification_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    read_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_notif_recipient UNIQUE (notification_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_nr_user_read ON notification_recipients(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_nr_notif ON notification_recipients(notification_id);
