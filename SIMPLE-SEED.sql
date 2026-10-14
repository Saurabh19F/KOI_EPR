-- SIMPLE SEED - Run this first

-- 1. Fix users with correct role_id
DELETE FROM users;

INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
SELECT gen_random_uuid(), 'admin@erp.com', crypt('admin123', gen_salt('bf', 10)), 'Admin User', 'ADM', role_id, true, true, NOW(), NOW()
FROM roles WHERE role_code = 'ADMIN';

INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
SELECT gen_random_uuid(), 'neha@erp.com', crypt('admin123', gen_salt('bf', 10)), 'Neha Sharma', 'NEH', role_id, true, false, NOW(), NOW()
FROM roles WHERE role_code = 'SALES_MANAGER';

INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
SELECT gen_random_uuid(), 'amit@erp.com', crypt('admin123', gen_salt('bf', 10)), 'Amit Kumar', 'AMT', role_id, true, false, NOW(), NOW()
FROM roles WHERE role_code = 'SALES_USER';

INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
SELECT gen_random_uuid(), 'rahul@erp.com', crypt('admin123', gen_salt('bf', 10)), 'Rahul Verma', 'RV', role_id, true, false, NOW(), NOW()
FROM roles WHERE role_code = 'PURCHASE_MANAGER';

INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
SELECT gen_random_uuid(), 'sneha@erp.com', crypt('admin123', gen_salt('bf', 10)), 'Sneha Gupta', 'SNG', role_id, true, false, NOW(), NOW()
FROM roles WHERE role_code = 'PURCHASE_USER';

INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
SELECT gen_random_uuid(), 'priya@erp.com', crypt('admin123', gen_salt('bf', 10)), 'Priya Patel', 'PRI', role_id, true, false, NOW(), NOW()
FROM roles WHERE role_code = 'COSTING_MANAGER';

INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
SELECT gen_random_uuid(), 'vikram@erp.com', crypt('admin123', gen_salt('bf', 10)), 'Vikram Singh', 'VIK', role_id, true, false, NOW(), NOW()
FROM roles WHERE role_code = 'MIS_USER';

-- 2. Verify
SELECT u.email, u.name, r.role_code
FROM users u
JOIN roles r ON u.role_id = r.role_id
ORDER BY r.level;
