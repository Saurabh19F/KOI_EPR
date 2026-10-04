-- COMPLETE USER RESET - Run this in Neon SQL Editor
-- Creates fresh admin user with password "admin123"

-- First, ensure ADMIN role exists
INSERT INTO roles (role_id, role_code, role_name, description, level, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'ADMIN', 'Administrator', 'Full system access', 1, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE role_code = 'ADMIN')
RETURNING role_id INTO :admin_role_id;

-- Get ADMIN role ID
DO $$
DECLARE
    admin_role_id UUID;
    user_id_val UUID;
BEGIN
    -- Get ADMIN role
    SELECT role_id INTO admin_role_id FROM roles WHERE role_code = 'ADMIN';
    RAISE NOTICE 'ADMIN role ID: %', admin_role_id;
END $$;

-- Create admin user with password "admin123"
-- bcrypt hash for "admin123" is: $2b$10$YourHashHere
-- Using direct password: admin123

DO $$
DECLARE
    admin_role_id UUID;
    new_user_id UUID;
BEGIN
    -- Get ADMIN role
    SELECT role_id INTO admin_role_id FROM roles WHERE role_code = 'ADMIN';

    IF admin_role_id IS NULL THEN
        -- Create role if not exists
        INSERT INTO roles (role_id, role_code, role_name, description, level, is_active, created_at, updated_at)
        VALUES (gen_random_uuid(), 'ADMIN', 'Administrator', 'Full system access', 1, true, NOW(), NOW())
        RETURNING role_id INTO admin_role_id;
    END IF;

    RAISE NOTICE 'Using role_id: %', admin_role_id;
END $$;

-- Simple password reset - set password directly (for testing only)
-- NOTE: In production, always use bcrypt hashing

-- Method 1: If bcrypt module available in Postgres
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Reset all test users with correct password
DO $$
DECLARE
    admin_role_id UUID;
BEGIN
    -- Get ADMIN role
    SELECT role_id INTO admin_role_id FROM roles WHERE role_code = 'ADMIN';

    IF admin_role_id IS NULL THEN
        INSERT INTO roles (role_id, role_code, role_name, description, level, is_active, created_at, updated_at)
        VALUES (gen_random_uuid(), 'ADMIN', 'Administrator', 'Full system access', 1, true, NOW(), NOW())
        RETURNING role_id INTO admin_role_id;
    END IF;

    -- Delete existing test users
    DELETE FROM users WHERE email LIKE '%@erp.com';

    -- Insert fresh admin user with crypt password
    INSERT INTO users (
        user_id,
        email,
        password_hash,
        name,
        user_code,
        role_id,
        is_active,
        is_super_admin,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        'admin@erp.com',
        crypt('admin123', gen_salt('bf', 10),
        'Admin User',
        'ADM',
        admin_role_id,
        true,
        true,
        NOW(),
        NOW()
    );

    INSERT INTO users (
        user_id,
        email,
        password_hash,
        name,
        user_code,
        role_id,
        is_active,
        is_super_admin,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        'neha@erp.com',
        crypt('admin123', gen_salt('bf', 10),
        'Neha Sharma',
        'NEH',
        admin_role_id,
        true,
        false,
        NOW(),
        NOW()
    );

    INSERT INTO users (
        user_id,
        email,
        password_hash,
        name,
        user_code,
        role_id,
        is_active,
        is_super_admin,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        'amit@erp.com',
        crypt('admin123', gen_salt('bf', 10),
        'Amit Kumar',
        'AMT',
        admin_role_id,
        true,
        false,
        NOW(),
        NOW()
    );
END $$;

-- Verify
SELECT email, name, is_super_admin, is_active FROM users ORDER BY created_at;
