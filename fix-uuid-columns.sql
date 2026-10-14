-- Fix UUID columns - Run this in Neon SQL Editor
-- This fixes the "operator does not exist: uuid = character varying" error

-- Fix users table
ALTER TABLE users ALTER COLUMN company_id TYPE uuid USING company_id::uuid;
ALTER TABLE users ALTER COLUMN department_id TYPE uuid USING department_id::uuid;
ALTER TABLE users ALTER COLUMN role_id TYPE uuid USING role_id::uuid;

-- Fix roles table
ALTER TABLE roles ALTER COLUMN company_id TYPE uuid USING company_id::uuid;

-- Fix departments table
ALTER TABLE departments ALTER COLUMN company_id TYPE uuid USING company_id::uuid;
ALTER TABLE departments ALTER COLUMN head_user_id TYPE uuid USING head_user_id::uuid;

-- Verify the changes
SELECT 'Users columns fixed' AS status;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('company_id', 'department_id', 'role_id');
