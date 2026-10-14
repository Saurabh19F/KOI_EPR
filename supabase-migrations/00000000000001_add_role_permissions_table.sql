-- Migration: Add role_permissions junction table for ManyToMany relationship
-- Date: 2026-06-03

-- Create the role_permissions junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Insert default permissions if they don't exist
INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'DASHBOARD_VIEW',
    'View Dashboard',
    'dashboard',
    'view',
    'Access to view dashboard',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'DASHBOARD_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'MASTERS_VIEW',
    'View Masters',
    'masters',
    'view',
    'Access to view master data',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'MASTERS_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'MASTERS_CREATE',
    'Create Masters',
    'masters',
    'create',
    'Access to create master data',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'MASTERS_CREATE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'MASTERS_EDIT',
    'Edit Masters',
    'masters',
    'edit',
    'Access to edit master data',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'MASTERS_EDIT');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'MASTERS_DELETE',
    'Delete Masters',
    'masters',
    'delete',
    'Access to delete master data',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'MASTERS_DELETE');

-- Products
INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'PRODUCTS_VIEW', 'View Products', 'products', 'view', 'Access to view products', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'PRODUCTS_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'PRODUCTS_CREATE', 'Create Products', 'products', 'create', 'Access to create products', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'PRODUCTS_CREATE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'PRODUCTS_EDIT', 'Edit Products', 'products', 'edit', 'Access to edit products', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'PRODUCTS_EDIT');

-- Customers
INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'CUSTOMERS_VIEW', 'View Customers', 'customers', 'view', 'Access to view customers', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'CUSTOMERS_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'CUSTOMERS_CREATE', 'Create Customers', 'customers', 'create', 'Access to create customers', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'CUSTOMERS_CREATE');

-- Sales
INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'SALES_VIEW', 'View Sales', 'sales', 'view', 'Access to view sales', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'SALES_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'SALES_CREATE', 'Create Sales', 'sales', 'create', 'Access to create sales', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'SALES_CREATE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'SALES_EDIT', 'Edit Sales', 'sales', 'edit', 'Access to edit sales', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'SALES_EDIT');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'SALES_DELETE', 'Delete Sales', 'sales', 'delete', 'Access to delete sales', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'SALES_DELETE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'SALES_APPROVE', 'Approve Sales', 'sales', 'approve', 'Access to approve sales', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'SALES_APPROVE');

-- Purchase
INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'PURCHASE_VIEW', 'View Purchase', 'purchase', 'view', 'Access to view purchase', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'PURCHASE_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'PURCHASE_CREATE', 'Create Purchase', 'purchase', 'create', 'Access to create purchase', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'PURCHASE_CREATE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'PURCHASE_EDIT', 'Edit Purchase', 'purchase', 'edit', 'Access to edit purchase', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'PURCHASE_EDIT');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'PURCHASE_DELETE', 'Delete Purchase', 'purchase', 'delete', 'Access to delete purchase', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'PURCHASE_DELETE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'PURCHASE_APPROVE', 'Approve Purchase', 'purchase', 'approve', 'Access to approve purchase', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'PURCHASE_APPROVE');

-- Rate/Price Analysis
INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'RATE_VIEW', 'View Rate Analysis', 'rate', 'view', 'Access to view rate analysis', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'RATE_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'RATE_CREATE', 'Create Rate Analysis', 'rate', 'create', 'Access to create rate analysis', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'RATE_CREATE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'RATE_EDIT', 'Edit Rate Analysis', 'rate', 'edit', 'Access to edit rate analysis', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'RATE_EDIT');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'RATE_APPROVE', 'Approve Rate', 'rate', 'approve', 'Access to approve rate analysis', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'RATE_APPROVE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'RATE_LOCK', 'Lock Rate', 'rate', 'lock', 'Access to lock rate analysis', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'RATE_LOCK');

-- FMS/Workflow
INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'FMS_VIEW', 'View FMS', 'fms', 'view', 'Access to view FMS tasks', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'FMS_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'FMS_CREATE', 'Create FMS', 'fms', 'create', 'Access to create FMS tasks', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'FMS_CREATE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'FMS_EDIT', 'Edit FMS', 'fms', 'edit', 'Access to edit FMS tasks', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'FMS_EDIT');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'FMS_ASSIGN', 'Assign FMS', 'fms', 'assign', 'Access to assign FMS tasks', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'FMS_ASSIGN');

-- Reports
INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'REPORTS_VIEW', 'View Reports', 'reports', 'view', 'Access to view reports', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'REPORTS_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'REPORTS_EXPORT', 'Export Reports', 'reports', 'export', 'Access to export reports', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'REPORTS_EXPORT');

-- Admin
INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'ADMIN_USERS', 'Manage Users', 'admin', 'users', 'Access to manage users', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'ADMIN_USERS');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'ADMIN_ROLES', 'Manage Roles', 'admin', 'roles', 'Access to manage roles', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'ADMIN_ROLES');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'ADMIN_SETTINGS', 'System Settings', 'admin', 'settings', 'Access to system settings', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'ADMIN_SETTINGS');

-- Grant all permissions to ADMIN role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'ADMIN'
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.role_id AND rp.permission_id = p.permission_id
);

-- Grant basic permissions to other roles
-- MANAGEMENT gets view and approve permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'MANAGEMENT'
AND p.action IN ('view', 'approve')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.role_id AND rp.permission_id = p.permission_id
);

-- Grant basic view permissions to VIEWER role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'VIEWER'
AND p.action = 'view'
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.role_id AND rp.permission_id = p.permission_id
);

COMMENT ON TABLE role_permissions IS 'Junction table for many-to-many relationship between roles and permissions';
