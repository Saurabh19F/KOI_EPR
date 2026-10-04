-- Seed permissions for all roles - SIMPLE VERSION

-- Check what roles exist
SELECT role_code, role_id FROM roles;

-- Check what permissions exist
SELECT permission_code FROM permissions;

-- Clear existing
DELETE FROM role_permissions WHERE true;

-- Insert for ADMIN (gets all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_code = 'ADMIN';

-- Insert for SALES_MANAGER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_code = 'SALES_MANAGER'
AND p.permission_code IN (
    'DASHBOARD_VIEW', 'MASTERS_VIEW', 'SALES_VIEW', 'SALES_CREATE',
    'SALES_EDIT', 'SALES_APPROVE', 'REPORTS_VIEW', 'REPORTS_EXPORT',
    'RATE_VIEW', 'RATE_CREATE', 'RATE_EDIT', 'RATE_APPROVE', 'RATE_LOCK'
);

-- Insert for PURCHASE_MANAGER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_code = 'PURCHASE_MANAGER'
AND p.permission_code IN (
    'DASHBOARD_VIEW', 'MASTERS_VIEW', 'PURCHASE_VIEW', 'PURCHASE_CREATE',
    'PURCHASE_EDIT', 'PURCHASE_APPROVE', 'REPORTS_VIEW', 'REPORTS_EXPORT'
);

-- Insert for COSTING_MANAGER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_code = 'COSTING_MANAGER'
AND p.permission_code IN (
    'DASHBOARD_VIEW', 'MASTERS_VIEW', 'PURCHASE_VIEW', 'RATE_VIEW',
    'RATE_CREATE', 'RATE_EDIT', 'RATE_APPROVE', 'RATE_LOCK',
    'REPORTS_VIEW', 'REPORTS_EXPORT', 'FMS_VIEW', 'FMS_CREATE', 'FMS_EDIT'
);

-- Insert for MIS
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_code = 'MIS'
AND p.permission_code IN (
    'DASHBOARD_VIEW', 'MASTERS_VIEW', 'SALES_VIEW', 'PURCHASE_VIEW',
    'RATE_VIEW', 'REPORTS_VIEW', 'REPORTS_EXPORT', 'FMS_VIEW'
);

-- Insert for ACCOUNTS
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_code = 'ACCOUNTS'
AND p.permission_code IN (
    'DASHBOARD_VIEW', 'MASTERS_VIEW', 'REPORTS_VIEW', 'REPORTS_EXPORT'
);

-- Insert for WAREHOUSE_MGR
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_code = 'WAREHOUSE_MGR'
AND p.permission_code IN (
    'DASHBOARD_VIEW', 'MASTERS_VIEW', 'REPORTS_VIEW', 'REPORTS_EXPORT',
    'FMS_VIEW', 'FMS_EDIT'
);

-- Insert for VIEWER (view only)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_code = 'VIEWER'
AND p.action = 'view';

-- Verify
SELECT r.role_name, COUNT(rp.permission_id) as perm_count
FROM roles r
LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
GROUP BY r.role_name
ORDER BY r.role_name;
