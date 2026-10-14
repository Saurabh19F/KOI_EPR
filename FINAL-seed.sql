-- FINAL SEED USERS - Run this in Neon SQL Editor
-- Password for all: admin123

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Delete existing users
DELETE FROM users WHERE email LIKE '%@erp.com';

-- Create ADMIN role if not exists
INSERT INTO roles (role_id, role_code, role_name, description, level, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'ADMIN', 'Administrator', 'Full system access', 1, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE role_code = 'ADMIN');

-- Get the role_id for ADMIN
DO $$
DECLARE
admin_rid UUID;
BEGIN
SELECT role_id INTO admin_rid FROM roles WHERE role_code = 'ADMIN';
RAISE NOTICE 'Using role_id: %', admin_rid;

-- admin@erp.com
INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
VALUES (gen_random_uuid(), 'admin@erp.com', crypt('admin123', gen_salt('bf', 10), 'Admin User', 'ADM', admin_rid, true, true, NOW(), NOW());

-- neha@erp.com
INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
VALUES (gen_random_uuid(), 'neha@erp.com', crypt('admin123', gen_salt('bf', 10), 'Neha Sharma', 'NEH', admin_rid, true, false, NOW(), NOW());

-- rahul@erp.com
INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
VALUES (gen_random_uuid(), 'rahul@erp.com', crypt('admin123', gen_salt('bf', 10), 'Rahul Verma', 'RV', admin_rid, true, false, NOW(), NOW());

-- priya@erp.com
INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
VALUES (gen_random_uuid(), 'priya@erp.com', crypt('admin123', gen_salt('bf', 10), 'Priya Patel', 'PRI', admin_rid, true, false, NOW(), NOW());

-- amit@erp.com
INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
VALUES (gen_random_uuid(), 'amit@erp.com', crypt('admin123', gen_salt('bf', 10), 'Amit Kumar', 'AMT', admin_rid, true, false, NOW(), NOW());

-- sneha@erp.com
INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
VALUES (gen_random_uuid(), 'sneha@erp.com', crypt('admin123', gen_salt('bf', 10), 'Sneha Gupta', 'SNG', admin_rid, true, false, NOW(), NOW());

-- vikram@erp.com
INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
VALUES (gen_random_uuid(), 'vikram@erp.com', crypt('admin123', gen_salt('bf', 10), 'Vikram Singh', 'VIK', admin_rid, true, false, NOW(), NOW());

RAISE NOTICE 'All users created!';
END $$;

-- Verify
SELECT email, name, user_code, is_super_admin FROM users WHERE email LIKE '%@erp.com';
