-- ============================================
-- COMPLETE DATABASE SEED & FIX
-- Matches your actual database structure
-- ============================================

BEGIN;

-- 1. Delete wrong role entry (SALES_MGR)
DELETE FROM roles WHERE role_code = 'SALES_MGR';
DELETE FROM role_permissions WHERE role_id NOT IN (SELECT role_id FROM roles);

-- 2. Seed users with all roles
DELETE FROM users;

-- ADMIN
INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
SELECT gen_random_uuid(), 'admin@erp.com', crypt('admin123', gen_salt('bf', 10)), 'Admin User', 'ADM', role_id, true, true, NOW(), NOW()
FROM roles WHERE role_code = 'ADMIN';

-- SALES_MANAGER
INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
SELECT gen_random_uuid(), 'neha@erp.com', crypt('admin123', gen_salt('bf', 10)), 'Neha Sharma', 'NEH', role_id, true, false, NOW(), NOW()
FROM roles WHERE role_code = 'SALES_MANAGER';

-- SALES_USER
INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
SELECT gen_random_uuid(), 'amit@erp.com', crypt('admin123', gen_salt('bf', 10)), 'Amit Kumar', 'AMT', role_id, true, false, NOW(), NOW()
FROM roles WHERE role_code = 'SALES_USER';

-- PURCHASE_MANAGER
INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
SELECT gen_random_uuid(), 'rahul@erp.com', crypt('admin123', gen_salt('bf', 10)), 'Rahul Verma', 'RV', role_id, true, false, NOW(), NOW()
FROM roles WHERE role_code = 'PURCHASE_MANAGER';

-- PURCHASE_USER
INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
SELECT gen_random_uuid(), 'sneha@erp.com', crypt('admin123', gen_salt('bf', 10)), 'Sneha Gupta', 'SNG', role_id, true, false, NOW(), NOW()
FROM roles WHERE role_code = 'PURCHASE_USER';

-- COSTING_MANAGER
INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
SELECT gen_random_uuid(), 'priya@erp.com', crypt('admin123', gen_salt('bf', 10)), 'Priya Patel', 'PRI', role_id, true, false, NOW(), NOW()
FROM roles WHERE role_code = 'COSTING_MANAGER';

-- MIS_USER
INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
SELECT gen_random_uuid(), 'vikram@erp.com', crypt('admin123', gen_salt('bf', 10)), 'Vikram Singh', 'VIK', role_id, true, false, NOW(), NOW()
FROM roles WHERE role_code = 'MIS_USER';

COMMIT;

-- ============================================
-- VERIFY
-- ============================================

SELECT '=== USERS ===' as "";
SELECT u.email, u.name, r.role_code
FROM users u
JOIN roles r ON u.role_id = r.role_id
ORDER BY r.level;

SELECT '=== ROLE PERMISSIONS COUNT ===' as "";
SELECT r.role_code, COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
GROUP BY r.role_code
ORDER BY r.level;

SELECT '=== CURRENCY RATES ===' as "";
SELECT currency_code, currency_name, rate FROM currency_rate_master WHERE is_active = true ORDER BY currency_code;
