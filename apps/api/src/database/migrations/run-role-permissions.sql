-- ============================================
-- ERP Database Fix - Role Permissions
-- Run this AFTER running other migrations
-- ============================================

-- Step 1: Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Step 3: Check if permissions exist, if not insert them
DO $$
DECLARE
    perm_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO perm_count FROM permissions;
    IF perm_count = 0 THEN
        -- Insert all permissions
        INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
        VALUES
            (gen_random_uuid(), 'DASHBOARD_VIEW', 'View Dashboard', 'dashboard', 'view', 'Access to view dashboard', NOW(), NOW()),
            (gen_random_uuid(), 'MASTERS_VIEW', 'View Masters', 'masters', 'view', 'Access to view master data', NOW(), NOW()),
            (gen_random_uuid(), 'MASTERS_CREATE', 'Create Masters', 'masters', 'create', 'Access to create master data', NOW(), NOW()),
            (gen_random_uuid(), 'MASTERS_EDIT', 'Edit Masters', 'masters', 'edit', 'Access to edit master data', NOW(), NOW()),
            (gen_random_uuid(), 'MASTERS_DELETE', 'Delete Masters', 'masters', 'delete', 'Access to delete master data', NOW(), NOW()),
            (gen_random_uuid(), 'PRODUCTS_VIEW', 'View Products', 'products', 'view', 'Access to view products', NOW(), NOW()),
            (gen_random_uuid(), 'PRODUCTS_CREATE', 'Create Products', 'products', 'create', 'Access to create products', NOW(), NOW()),
            (gen_random_uuid(), 'PRODUCTS_EDIT', 'Edit Products', 'products', 'edit', 'Access to edit products', NOW(), NOW()),
            (gen_random_uuid(), 'CUSTOMERS_VIEW', 'View Customers', 'customers', 'view', 'Access to view customers', NOW(), NOW()),
            (gen_random_uuid(), 'CUSTOMERS_CREATE', 'Create Customers', 'customers', 'create', 'Access to create customers', NOW(), NOW()),
            (gen_random_uuid(), 'CUSTOMERS_EDIT', 'Edit Customers', 'customers', 'edit', 'Access to edit customers', NOW(), NOW()),
            (gen_random_uuid(), 'SALES_VIEW', 'View Sales', 'sales', 'view', 'Access to view sales', NOW(), NOW()),
            (gen_random_uuid(), 'SALES_CREATE', 'Create Sales', 'sales', 'create', 'Access to create sales', NOW(), NOW()),
            (gen_random_uuid(), 'SALES_EDIT', 'Edit Sales', 'sales', 'edit', 'Access to edit sales', NOW(), NOW()),
            (gen_random_uuid(), 'SALES_APPROVE', 'Approve Sales', 'sales', 'approve', 'Access to approve sales', NOW(), NOW()),
            (gen_random_uuid(), 'PURCHASE_VIEW', 'View Purchase', 'purchase', 'view', 'Access to view purchase', NOW(), NOW()),
            (gen_random_uuid(), 'PURCHASE_CREATE', 'Create Purchase', 'purchase', 'create', 'Access to create purchase', NOW(), NOW()),
            (gen_random_uuid(), 'PURCHASE_EDIT', 'Edit Purchase', 'purchase', 'edit', 'Access to edit purchase', NOW(), NOW()),
            (gen_random_uuid(), 'PURCHASE_APPROVE', 'Approve Purchase', 'purchase', 'approve', 'Access to approve purchase', NOW(), NOW()),
            (gen_random_uuid(), 'RATE_VIEW', 'View Rate Analysis', 'rate', 'view', 'Access to view rate analysis', NOW(), NOW()),
            (gen_random_uuid(), 'RATE_CREATE', 'Create Rate Analysis', 'rate', 'create', 'Access to create rate analysis', NOW(), NOW()),
            (gen_random_uuid(), 'RATE_EDIT', 'Edit Rate Analysis', 'rate', 'edit', 'Access to edit rate analysis', NOW(), NOW()),
            (gen_random_uuid(), 'RATE_APPROVE', 'Approve Rate', 'rate', 'approve', 'Access to approve rate analysis', NOW(), NOW()),
            (gen_random_uuid(), 'RATE_LOCK', 'Lock Rate', 'rate', 'lock', 'Access to lock rate analysis', NOW(), NOW()),
            (gen_random_uuid(), 'FMS_VIEW', 'View FMS', 'fms', 'view', 'Access to view FMS tasks', NOW(), NOW()),
            (gen_random_uuid(), 'FMS_CREATE', 'Create FMS', 'fms', 'create', 'Access to create FMS tasks', NOW(), NOW()),
            (gen_random_uuid(), 'FMS_EDIT', 'Edit FMS', 'fms', 'edit', 'Access to edit FMS tasks', NOW(), NOW()),
            (gen_random_uuid(), 'REPORTS_VIEW', 'View Reports', 'reports', 'view', 'Access to view reports', NOW(), NOW()),
            (gen_random_uuid(), 'REPORTS_EXPORT', 'Export Reports', 'reports', 'export', 'Access to export reports', NOW(), NOW()),
            (gen_random_uuid(), 'ADMIN_USERS', 'Manage Users', 'admin', 'users', 'Access to manage users', NOW(), NOW()),
            (gen_random_uuid(), 'ADMIN_ROLES', 'Manage Roles', 'admin', 'roles', 'Access to manage roles', NOW(), NOW()),
            (gen_random_uuid(), 'ADMIN_SETTINGS', 'System Settings', 'admin', 'settings', 'Access to system settings', NOW(), NOW());
    END IF;
END $$;

-- Step 4: Grant all permissions to ADMIN role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'ADMIN'
ON CONFLICT DO NOTHING;

-- Grant basic view permissions to MANAGEMENT role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'MANAGEMENT'
AND p.action IN ('view', 'approve')
ON CONFLICT DO NOTHING;

-- Grant basic view permissions to VIEWER role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'VIEWER'
AND p.action = 'view'
ON CONFLICT DO NOTHING;

-- Step 5: Verify
SELECT 'Role Permissions Setup Complete' AS status;
SELECT r.role_code, COUNT(rp.permission_id) AS permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
GROUP BY r.role_code;
