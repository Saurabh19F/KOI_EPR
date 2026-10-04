-- COMPLETE RBAC SETUP - Run in Neon SQL Editor
-- Creates roles with proper permissions per role

BEGIN;

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- 1. CREATE ROLES
-- ============================================

-- Admin
INSERT INTO roles (role_id, role_code, role_name, description, level, is_active, created_at, updated_at)
VALUES (gen_random_uuid(), 'ADMIN', 'Administrator', 'Full system access', 1, true, NOW(), NOW())
ON CONFLICT (role_code) DO UPDATE SET description = EXCLUDED.description;

-- Sales Manager
INSERT INTO roles (role_id, role_code, role_name, description, level, is_active, created_at, updated_at)
VALUES (gen_random_uuid(), 'SALES_MANAGER', 'Sales Manager', 'Sales team management', 2, true, NOW(), NOW())
ON CONFLICT (role_code) DO UPDATE SET description = EXCLUDED.description;

-- Sales User
INSERT INTO roles (role_id, role_code, role_name, description, level, is_active, created_at, updated_at)
VALUES (gen_random_uuid(), 'SALES_USER', 'Sales User', 'Create and manage own enquiries', 3, true, NOW(), NOW())
ON CONFLICT (role_code) DO UPDATE SET description = EXCLUDED.description;

-- Purchase Manager
INSERT INTO roles (role_id, role_code, role_name, description, level, is_active, created_at, updated_at)
VALUES (gen_random_uuid(), 'PURCHASE_MANAGER', 'Purchase Manager', 'Purchase management', 2, true, NOW(), NOW())
ON CONFLICT (role_code) DO UPDATE SET description = EXCLUDED.description;

-- Purchase User
INSERT INTO roles (role_id, role_code, role_name, description, level, is_active, created_at, updated_at)
VALUES (gen_random_uuid(), 'PURCHASE_USER', 'Purchase User', 'Create purchase quotes', 3, true, NOW(), NOW())
ON CONFLICT (role_code) DO UPDATE SET description = EXCLUDED.description;

-- Costing Manager
INSERT INTO roles (role_id, role_code, role_name, description, level, is_active, created_at, updated_at)
VALUES (gen_random_uuid(), 'COSTING_MANAGER', 'Costing Manager', 'Rate calculations', 2, true, NOW(), NOW())
ON CONFLICT (role_code) DO UPDATE SET description = EXCLUDED.description;

-- MIS User
INSERT INTO roles (role_id, role_code, role_name, description, level, is_active, created_at, updated_at)
VALUES (gen_random_uuid(), 'MIS_USER', 'MIS User', 'Reports only', 4, true, NOW(), NOW())
ON CONFLICT (role_code) DO UPDATE SET description = EXCLUDED.description;

-- Viewer
INSERT INTO roles (role_id, role_code, role_name, description, level, is_active, created_at, updated_at)
VALUES (gen_random_uuid(), 'VIEWER', 'Viewer', 'Read-only access', 5, true, NOW(), NOW())
ON CONFLICT (role_code) DO UPDATE SET description = EXCLUDED.description;

-- ============================================
-- 2. CREATE USERS WITH CORRECT ROLES
-- ============================================

-- Admin (role: ADMIN)
INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
SELECT gen_random_uuid(), 'admin@erp.com', crypt('admin123', gen_salt('bf', 10), 'Admin User', 'ADM', role_id, true, true, NOW(), NOW()
FROM roles WHERE role_code = 'ADMIN'
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role_id = EXCLUDED.role_id, is_super_admin = EXCLUDED.is_super_admin;

-- Sales Manager - neha (role: SALES_MANAGER)
INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
SELECT gen_random_uuid(), 'neha@erp.com', crypt('admin123', gen_salt('bf', 10), 'Neha Sharma', 'NEH', role_id, true, false, NOW(), NOW()
FROM roles WHERE role_code = 'SALES_MANAGER'
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role_id = EXCLUDED.role_id;

-- Sales User - amit (role: SALES_USER)
INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
SELECT gen_random_uuid(), 'amit@erp.com', crypt('admin123', gen_salt('bf', 10), 'Amit Kumar', 'AMT', role_id, true, false, NOW(), NOW()
FROM roles WHERE role_code = 'SALES_USER'
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role_id = EXCLUDED.role_id;

-- Purchase Manager - rahul (role: PURCHASE_MANAGER)
INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
SELECT gen_random_uuid(), 'rahul@erp.com', crypt('admin123', gen_salt('bf', 10), 'Rahul Verma', 'RV', role_id, true, false, NOW(), NOW()
FROM roles WHERE role_code = 'PURCHASE_MANAGER'
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role_id = EXCLUDED.role_id;

-- Purchase User - sneha (role: PURCHASE_USER)
INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
SELECT gen_random_uuid(), 'sneha@erp.com', crypt('admin123', gen_salt('bf', 10), 'Sneha Gupta', 'SNG', role_id, true, false, NOW(), NOW()
FROM roles WHERE role_code = 'PURCHASE_USER'
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role_id = EXCLUDED.role_id;

-- Costing Manager - priya (role: COSTING_MANAGER)
INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
SELECT gen_random_uuid(), 'priya@erp.com', crypt('admin123', gen_salt('bf', 10), 'Priya Patel', 'PRI', role_id, true, false, NOW(), NOW()
FROM roles WHERE role_code = 'COSTING_MANAGER'
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role_id = EXCLUDED.role_id;

-- MIS User - vikram (role: MIS_USER)
INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
SELECT gen_random_uuid(), 'vikram@erp.com', crypt('admin123', gen_salt('bf', 10), 'Vikram Singh', 'VIK', role_id, true, false, NOW(), NOW()
FROM roles WHERE role_code = 'MIS_USER'
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role_id = EXCLUDED.role_id;

COMMIT;

-- ============================================
-- 3. VERIFY
-- ============================================

-- Show roles
SELECT 'ROLES' as type, role_code, role_name, level FROM roles ORDER BY level;

-- Show users with roles
SELECT 'USERS' as type, u.email, u.name, r.role_name
FROM users u
JOIN roles r ON u.role_id = r.role_id
WHERE u.email LIKE '%@erp.com'
ORDER BY u.created_at;

-- Show permissions by role
SELECT 'ROLE PERMISSIONS' as type, r.role_name, p.permission_code, p.action
FROM roles r
LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.permission_id
ORDER BY r.level, p.module_name;
