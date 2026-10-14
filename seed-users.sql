-- SEED USERS - Run this in Neon SQL Editor
-- Password for all users is: admin123

BEGIN;

-- Enable pgcrypto for bcrypt password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Delete existing test users
DELETE FROM users WHERE email LIKE '%@erp.com';

-- Make sure ADMIN role exists
INSERT INTO roles (role_id, role_code, role_name, description, level, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'ADMIN', 'Administrator', 'Full system access', 1, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE role_code = 'ADMIN');

-- Get role ID
DO $$
DECLARE
    admin_role_id UUID;
BEGIN
    SELECT role_id INTO admin_role_id FROM roles WHERE role_code = 'ADMIN';

    -- admin
    INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
    VALUES (gen_random_uuid(), 'admin@erp.com', crypt('admin123', gen_salt('bf', 10)), 'Admin User', 'ADM', admin_role_id, true, true, NOW(), NOW());

    -- neha (Sales Manager)
    INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
    VALUES (gen_random_uuid(), 'neha@erp.com', crypt('admin123', gen_salt('bf', 10)), 'Neha Sharma', 'NEH', admin_role_id, true, false, NOW(), NOW());

    -- rahul (Purchase Manager)
    INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
    VALUES (gen_random_uuid(), 'rahul@erp.com', crypt('admin123', gen_salt('bf', 10)), 'Rahul Verma', 'RV', admin_role_id, true, false, NOW(), NOW());

    -- priya (Costing Manager)
    INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
    VALUES (gen_random_uuid(), 'priya@erp.com', crypt('admin123', gen_salt('bf', 10)), 'Priya Patel', 'PRI', admin_role_id, true, false, NOW(), NOW());

    -- amit (Sales Manager)
    INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
    VALUES (gen_random_uuid(), 'amit@erp.com', crypt('admin123', gen_salt('bf', 10)), 'Amit Kumar', 'AMT', admin_role_id, true, false, NOW(), NOW());

    -- sneha (Purchase Manager)
    INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
    VALUES (gen_random_uuid(), 'sneha@erp.com', crypt('admin123', gen_salt('bf', 10)), 'Sneha Gupta', 'SNG', admin_role_id, true, false, NOW(), NOW());

    -- vikram (MIS Manager)
    INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
    VALUES (gen_random_uuid(), 'vikram@erp.com', crypt('admin123', gen_salt('bf', 10)), 'Vikram Singh', 'VIK', admin_role_id, true, false, NOW(), NOW());

    RAISE NOTICE 'Users created!';
END $$;

COMMIT;

-- Verify
SELECT email, name, user_code, is_super_admin FROM users WHERE email LIKE '%@erp.com';
