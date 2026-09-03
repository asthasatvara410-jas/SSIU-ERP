-- ==============================================================================
-- PHASE 06: USERS, ROLES & ACCESS PERMISSIONS
-- Central Identity, RBAC & Scoped Authorization
-- ==============================================================================

-- 1. Central User Accounts
CREATE TABLE IF NOT EXISTS user_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,                      -- Maps to Supabase auth.users(id) if Supabase Auth is enabled
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    account_type VARCHAR(30) NOT NULL CHECK (account_type IN ('STUDENT', 'FACULTY', 'STAFF', 'ADMIN', 'PARENT', 'EXTERNAL')),
    student_id UUID UNIQUE REFERENCES students(id) ON DELETE SET NULL,
    faculty_id UUID UNIQUE REFERENCES faculty(id) ON DELETE SET NULL,
    parent_id UUID UNIQUE REFERENCES parents(id) ON DELETE SET NULL,
    account_status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL 
        CHECK (account_status IN ('ACTIVE', 'LOCKED', 'SUSPENDED', 'PENDING_ACTIVATION', 'DISABLED')),
    lock_reason TEXT,
    last_login_at TIMESTAMPTZ,
    last_login_ip VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_users_username ON user_accounts(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON user_accounts(email);
CREATE INDEX IF NOT EXISTS idx_users_type ON user_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_users_student ON user_accounts(student_id);
CREATE INDEX IF NOT EXISTS idx_users_faculty ON user_accounts(faculty_id);

CREATE TRIGGER trg_user_accounts_updated_at
BEFORE UPDATE ON user_accounts
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 2. System Roles
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,              -- 'STUDENT', 'FACULTY', 'HOD', 'PRINCIPAL', 'REGISTRAR', 'SUPER_ADMIN'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    hierarchy_level INT DEFAULT 10 NOT NULL,       -- Numerical rank for role precedence
    is_system_role BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TRIGGER trg_roles_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 3. System Permissions
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module VARCHAR(50) NOT NULL,                   -- 'ACADEMIC', 'ATTENDANCE', 'EXAMS', 'FEES', 'HRMS'
    action VARCHAR(50) NOT NULL,                   -- 'CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'EXPORT'
    code VARCHAR(100) NOT NULL UNIQUE,             -- e.g. 'attendance.take', 'marks.approve'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. Role Permissions Junction
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (role_id, permission_id)
);

-- 5. User Roles Scoped Mapping (Supports multi-role and institute/department scoped assignments)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    institute_id UUID REFERENCES institutes(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_user_role_scope UNIQUE (user_id, role_id, institute_id, department_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);
