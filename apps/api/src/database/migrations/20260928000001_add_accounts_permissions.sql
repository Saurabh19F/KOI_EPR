-- ============================================
-- Add Accounts Module Permissions
-- Assigns ACCOUNTS_VIEW, ACCOUNTS_CREATE to ACCOUNTANT role
-- Assigns ACCOUNTS_VIEW, ACCOUNTS_APPROVE to CHIEF_ACCOUNTANT role
-- Also grants all accounts permissions to ADMIN
-- ============================================

-- Step 1: Insert accounts permissions (skip if already exist)
INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'ACCOUNTS_VIEW', 'View Accounts', 'accounts', 'view', 'Access to view accounts module and ledger entries', NOW(), NOW()),
    (gen_random_uuid(), 'ACCOUNTS_CREATE', 'Create Ledger Entry', 'accounts', 'create', 'Access to upload and edit ledger entries', NOW(), NOW()),
    (gen_random_uuid(), 'ACCOUNTS_APPROVE', 'Approve Ledger Entry', 'accounts', 'approve', 'Access to approve or reject ledger entries', NOW(), NOW())
ON CONFLICT (permission_code) DO NOTHING;

-- Step 2: Grant ACCOUNTS_VIEW + ACCOUNTS_CREATE to ACCOUNTANT role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'ACCOUNTANT'
AND p.permission_code IN ('ACCOUNTS_VIEW', 'ACCOUNTS_CREATE')
ON CONFLICT DO NOTHING;

-- Step 3: Grant ACCOUNTS_VIEW + ACCOUNTS_APPROVE to CHIEF_ACCOUNTANT role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'CHIEF_ACCOUNTANT'
AND p.permission_code IN ('ACCOUNTS_VIEW', 'ACCOUNTS_APPROVE')
ON CONFLICT DO NOTHING;

-- Step 4: Grant all accounts permissions to ADMIN role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'ADMIN'
AND p.permission_code IN ('ACCOUNTS_VIEW', 'ACCOUNTS_CREATE', 'ACCOUNTS_APPROVE')
ON CONFLICT DO NOTHING;

-- Step 5: Verify
SELECT 'Accounts Permissions Setup Complete' AS status;
SELECT r.role_code, array_agg(p.permission_code ORDER BY p.permission_code) AS accounts_permissions
FROM roles r
JOIN role_permissions rp ON r.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.permission_id
WHERE p.permission_code LIKE 'ACCOUNTS_%'
GROUP BY r.role_code;
