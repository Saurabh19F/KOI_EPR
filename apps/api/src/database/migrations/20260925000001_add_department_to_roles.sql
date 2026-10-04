-- Add department_id column to roles table
ALTER TABLE roles ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(department_id) ON DELETE SET NULL;

-- Map roles to their departments
-- Sales roles
UPDATE roles SET department_id = (SELECT department_id FROM departments WHERE department_code = 'SALES')
WHERE role_code IN ('SALES_MANAGER', 'SALES_USER');

-- Purchase roles
UPDATE roles SET department_id = (SELECT department_id FROM departments WHERE department_code = 'PURCHASE')
WHERE role_code IN ('PURCHASE_MANAGER', 'PURCHASE_USER');

-- Costing roles
UPDATE roles SET department_id = (SELECT department_id FROM departments WHERE department_code = 'COSTING')
WHERE role_code IN ('COSTING_MANAGER', 'COSTING_USER');

-- Production roles
UPDATE roles SET department_id = (SELECT department_id FROM departments WHERE department_code = 'PRODUCTION')
WHERE role_code IN ('PRODUCTION_MANAGER');

-- Inventory roles
UPDATE roles SET department_id = (SELECT department_id FROM departments WHERE department_code = 'INVENTORY')
WHERE role_code IN ('INVENTORY_MANAGER');

-- Finance & Accounts roles
UPDATE roles SET department_id = (SELECT department_id FROM departments WHERE department_code = 'FINANCE')
WHERE role_code IN ('FINANCE_MANAGER', 'FINANCE_USER', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT', 'ACCOUNTS');

-- MIS roles
UPDATE roles SET department_id = (SELECT department_id FROM departments WHERE department_code = 'MIS')
WHERE role_code IN ('MIS', 'MIS_USER');

-- Quality roles
UPDATE roles SET department_id = (SELECT department_id FROM departments WHERE department_code = 'QUALITY')
WHERE role_code IN ('QUALITY_MANAGER');

-- Logistics roles
UPDATE roles SET department_id = (SELECT department_id FROM departments WHERE department_code = 'LOGISTICS')
WHERE role_code IN ('LOGISTICS_MANAGER');

-- HR roles
UPDATE roles SET department_id = (SELECT department_id FROM departments WHERE department_code = 'HR')
WHERE role_code IN ('HR_MANAGER');

-- Global roles (no department) - ADMIN, MANAGEMENT, VIEWER, DESIGNER stay with department_id = NULL
