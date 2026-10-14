-- ============================================
-- ERP Quick Setup for Supabase
-- Run this in Supabase SQL Editor
-- ============================================

-- Password for all demo users: admin123
-- bcrypt hash: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qUJr8N2H0xH8C2

-- ============================================
-- STEP 1: Create role_permissions junction table
-- ============================================
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_rp_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_rp_perm ON role_permissions(permission_id);

-- ============================================
-- STEP 2: Insert Permissions (if not exists)
-- ============================================

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'DASHBOARD_VIEW', 'View Dashboard', 'dashboard', 'view', 'Dashboard access', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'DASHBOARD_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'MASTERS_VIEW', 'View Masters', 'masters', 'view', 'View master data', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'MASTERS_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'MASTERS_CREATE', 'Create Masters', 'masters', 'create', 'Create master data', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'MASTERS_CREATE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'MASTERS_EDIT', 'Edit Masters', 'masters', 'edit', 'Edit master data', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'MASTERS_EDIT');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'SALES_VIEW', 'View Sales', 'sales', 'view', 'View sales', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'SALES_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'SALES_CREATE', 'Create Sales', 'sales', 'create', 'Create sales', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'SALES_CREATE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'SALES_EDIT', 'Edit Sales', 'sales', 'edit', 'Edit sales', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'SALES_EDIT');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'SALES_APPROVE', 'Approve Sales', 'sales', 'approve', 'Approve sales', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'SALES_APPROVE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'PURCHASE_VIEW', 'View Purchase', 'purchase', 'view', 'View purchase', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'PURCHASE_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'PURCHASE_CREATE', 'Create Purchase', 'purchase', 'create', 'Create purchase', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'PURCHASE_CREATE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'RATE_VIEW', 'View Rate', 'rate', 'view', 'View rates', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'RATE_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'FMS_VIEW', 'View FMS', 'fms', 'view', 'View FMS', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'FMS_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'REPORTS_VIEW', 'View Reports', 'reports', 'view', 'View reports', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'REPORTS_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'ADMIN_USERS', 'Admin Users', 'admin', 'users', 'Manage users', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'ADMIN_USERS');

-- ============================================
-- STEP 3: Create ADMIN role and assign permissions
-- ============================================

-- Create ADMIN role
INSERT INTO roles (role_id, role_code, role_name, description, level, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'ADMIN', 'Administrator', 'Full system access', 1, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE role_code = 'ADMIN');

-- Grant all permissions to ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'ADMIN'
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 4: Create demo users with password "admin123"
-- ============================================

-- First, get or create ADMIN role ID
DO $$
DECLARE
    admin_role_uuid UUID;
    hashed_pwd TEXT := '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qUJr8N2H0xH8C2';
BEGIN
    -- Get or create ADMIN role
    SELECT role_id INTO admin_role_uuid FROM roles WHERE role_code = 'ADMIN';

    IF admin_role_uuid IS NULL THEN
        INSERT INTO roles (role_id, role_code, role_name, description, level, is_active, created_at, updated_at)
        VALUES (gen_random_uuid(), 'ADMIN', 'Administrator', 'Full system access', 1, true, NOW(), NOW())
        RETURNING role_id INTO admin_role_uuid;
    END IF;

    -- Create admin user
    INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
    VALUES (gen_random_uuid(), 'admin@erp.com', hashed_pwd, 'Admin User', 'ADM', admin_role_uuid, true, true, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name,
        role_id = EXCLUDED.role_id,
        is_active = true,
        is_super_admin = true;

    -- Create other demo users
    INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
    VALUES (gen_random_uuid(), 'neha@erp.com', hashed_pwd, 'Neha Sharma', 'NEH', admin_role_uuid, true, false, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name;

    INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
    VALUES (gen_random_uuid(), 'rahul@erp.com', hashed_pwd, 'Rahul Verma', 'RV', admin_role_uuid, true, false, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name;

    INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
    VALUES (gen_random_uuid(), 'priya@erp.com', hashed_pwd, 'Priya Patel', 'PRI', admin_role_uuid, true, false, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name;

    INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
    VALUES (gen_random_uuid(), 'amit@erp.com', hashed_pwd, 'Amit Kumar', 'AMT', admin_role_uuid, true, false, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name;
END $$;

-- ============================================
-- STEP 5: Verify
-- ============================================

SELECT 'Setup Complete!' AS status;

SELECT email, name, is_super_admin FROM users ORDER BY created_at;
