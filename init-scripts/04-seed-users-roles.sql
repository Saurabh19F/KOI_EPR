-- =====================================================
-- ERP Database Initialization Script
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- COMPANIES
-- =====================================================
CREATE TABLE IF NOT EXISTS companies (
    company_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_code VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(100),
    gst_number VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- DEPARTMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS departments (
    department_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID,
    department_code VARCHAR(50) UNIQUE NOT NULL,
    department_name VARCHAR(255) NOT NULL,
    head_user_id UUID,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

-- =====================================================
-- PERMISSIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS permissions (
    permission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permission_code VARCHAR(100) UNIQUE NOT NULL,
    permission_name VARCHAR(255) NOT NULL,
    module_name VARCHAR(100),
    action VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ROLES
-- =====================================================
CREATE TABLE IF NOT EXISTS roles (
    role_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID,
    role_code VARCHAR(50) UNIQUE NOT NULL,
    role_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    level INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

-- =====================================================
-- ROLE PERMISSIONS (Junction Table)
-- =====================================================
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE
);

-- =====================================================
-- USERS
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID,
    department_id UUID,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    user_code VARCHAR(50),
    phone VARCHAR(50),
    avatar TEXT,
    is_active BOOLEAN DEFAULT true,
    is_super_admin BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(50),
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(company_id),
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

-- =====================================================
-- USER ROLES (Junction Table)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_roles_company ON roles(company_id);
CREATE INDEX IF NOT EXISTS idx_departments_company ON departments(company_id);

-- =====================================================
-- INSERT DEFAULT PERMISSIONS
-- =====================================================
INSERT INTO permissions (permission_code, permission_name, module_name, action) VALUES
-- Masters
('MASTERS_VIEW', 'View Masters', 'masters', 'view'),
('MASTERS_CREATE', 'Create Masters', 'masters', 'create'),
('MASTERS_EDIT', 'Edit Masters', 'masters', 'edit'),
('MASTERS_DELETE', 'Delete Masters', 'masters', 'delete'),
-- Products
('PRODUCTS_VIEW', 'View Products', 'products', 'view'),
('PRODUCTS_CREATE', 'Create Products', 'products', 'create'),
('PRODUCTS_EDIT', 'Edit Products', 'products', 'edit'),
('PRODUCTS_DELETE', 'Delete Products', 'products', 'delete'),
-- Customers
('CUSTOMERS_VIEW', 'View Customers', 'customers', 'view'),
('CUSTOMERS_CREATE', 'Create Customers', 'customers', 'create'),
('CUSTOMERS_EDIT', 'Edit Customers', 'customers', 'edit'),
('CUSTOMERS_DELETE', 'Delete Customers', 'customers', 'delete'),
-- Vendors
('VENDORS_VIEW', 'View Vendors', 'vendors', 'view'),
('VENDORS_CREATE', 'Create Vendors', 'vendors', 'create'),
('VENDORS_EDIT', 'Edit Vendors', 'vendors', 'edit'),
('VENDORS_DELETE', 'Delete Vendors', 'vendors', 'delete'),
-- Sales
('SALES_VIEW', 'View Sales', 'sales', 'view'),
('SALES_CREATE', 'Create Sales', 'sales', 'create'),
('SALES_EDIT', 'Edit Sales', 'sales', 'edit'),
('SALES_DELETE', 'Delete Sales', 'sales', 'delete'),
('SALES_APPROVE', 'Approve Sales', 'sales', 'approve'),
-- Purchase
('PURCHASE_VIEW', 'View Purchase', 'purchase', 'view'),
('PURCHASE_CREATE', 'Create Purchase', 'purchase', 'create'),
('PURCHASE_EDIT', 'Edit Purchase', 'purchase', 'edit'),
('PURCHASE_DELETE', 'Delete Purchase', 'purchase', 'delete'),
('PURCHASE_APPROVE', 'Approve Purchase', 'purchase', 'approve'),
-- Rate
('RATE_VIEW', 'View Rate', 'rate', 'view'),
('RATE_CREATE', 'Create Rate', 'rate', 'create'),
('RATE_EDIT', 'Edit Rate', 'rate', 'edit'),
('RATE_DELETE', 'Delete Rate', 'rate', 'delete'),
('RATE_APPROVE', 'Approve Rate', 'rate', 'approve'),
('RATE_LOCK', 'Lock Rate', 'rate', 'lock'),
-- FMS
('FMS_VIEW', 'View FMS', 'fms', 'view'),
('FMS_CREATE', 'Create FMS', 'fms', 'create'),
('FMS_EDIT', 'Edit FMS', 'fms', 'edit'),
('FMS_UPDATE', 'Update FMS Task', 'fms', 'update'),
('FMS_ASSIGN', 'Assign FMS Task', 'fms', 'assign'),
-- Reports
('REPORTS_VIEW', 'View Reports', 'reports', 'view'),
('REPORTS_EXPORT', 'Export Reports', 'reports', 'export'),
-- Admin
('ADMIN_FULL', 'Full Admin Access', 'admin', 'full'),
('ADMIN_SETTINGS', 'Admin Settings', 'admin', 'settings'),
('ADMIN_USERS', 'Manage Users', 'admin', 'users'),
('ADMIN_ROLES', 'Manage Roles', 'admin', 'roles'),
-- Inventory
('INVENTORY_VIEW', 'View Inventory', 'inventory', 'view'),
('INVENTORY_CREATE', 'Create Inventory', 'inventory', 'create'),
('INVENTORY_EDIT', 'Edit Inventory', 'inventory', 'edit'),
('INVENTORY_DELETE', 'Delete Inventory', 'inventory', 'delete'),
-- Quality
('QUALITY_VIEW', 'View Quality', 'quality', 'view'),
('QUALITY_CREATE', 'Create Quality', 'quality', 'create'),
('QUALITY_EDIT', 'Edit Quality', 'quality', 'edit'),
-- Logistics
('LOGISTICS_VIEW', 'View Logistics', 'logistics', 'view'),
('LOGISTICS_CREATE', 'Create Logistics', 'logistics', 'create'),
('LOGISTICS_EDIT', 'Edit Logistics', 'logistics', 'edit'),
-- Production
('PRODUCTION_VIEW', 'View Production', 'production', 'view'),
('PRODUCTION_CREATE', 'Create Production', 'production', 'create'),
('PRODUCTION_EDIT', 'Edit Production', 'production', 'edit'),
-- Financial
('FINANCIAL_VIEW', 'View Financial', 'financial', 'view'),
('FINANCIAL_CREATE', 'Create Financial', 'financial', 'create'),
('FINANCIAL_EDIT', 'Edit Financial', 'financial', 'edit'),
('FINANCIAL_APPROVE', 'Approve Financial', 'financial', 'approve')
ON CONFLICT (permission_code) DO NOTHING;

-- =====================================================
-- INSERT DEFAULT ROLES
-- =====================================================
INSERT INTO roles (role_code, role_name, description, level) VALUES
('ADMIN', 'Administrator', 'Full system access', 1),
('MANAGEMENT', 'Management', 'High level management access', 1),
('SALES_MANAGER', 'Sales Manager', 'Sales department management', 2),
('SALES_USER', 'Sales Executive', 'Sales team member', 3),
('PURCHASE_MANAGER', 'Purchase Manager', 'Purchase department management', 2),
('PURCHASE_USER', 'Purchase Executive', 'Purchase team member', 3),
('COSTING_MANAGER', 'Costing Manager', 'Costing / Rate Analysis management', 2),
('COSTING_USER', 'Costing Executive', 'Costing team member', 3),
('INVENTORY_MANAGER', 'Inventory Manager', 'Inventory & Warehouse management', 2),
('PRODUCTION_MANAGER', 'Production Manager', 'Production department management', 2),
('FINANCE_MANAGER', 'Finance Manager', 'Finance & Accounts management', 2),
('QUALITY_MANAGER', 'Quality Manager', 'Quality Control management', 2),
('LOGISTICS_MANAGER', 'Logistics Manager', 'Logistics & Dispatch management', 2),
('HR_MANAGER', 'HR Manager', 'Human Resources management', 2),
('MIS_USER', 'MIS Manager', 'Reports and MIS access', 2),
('VIEWER', 'Viewer (Read Only)', 'Read-only access across all modules', 4)
ON CONFLICT (role_code) DO NOTHING;

-- =====================================================
-- INSERT DEFAULT COMPANY
-- =====================================================
INSERT INTO companies (company_code, company_name, address) VALUES
('DEFAULT', 'Default Company', 'Company Address')
ON CONFLICT (company_code) DO NOTHING;

-- =====================================================
-- INSERT DEFAULT DEPARTMENTS
-- =====================================================
INSERT INTO departments (department_code, department_name) VALUES
('SALES', 'Sales'),
('PURCHASE', 'Purchase'),
('COSTING', 'Costing / Rate Analysis'),
('PRODUCTION', 'Production'),
('INVENTORY', 'Inventory & Warehouse'),
('FINANCE', 'Finance & Accounts'),
('MIS', 'MIS & Reports'),
('QUALITY', 'Quality Control'),
('LOGISTICS', 'Logistics & Dispatch'),
('HR', 'Human Resources'),
('IT_ADMIN', 'IT & Administration')
ON CONFLICT (department_code) DO NOTHING;

-- =====================================================
-- INSERT DEFAULT ADMIN USER (password: admin123)
-- =====================================================
DO $$
DECLARE
    admin_role_id UUID;
    admin_dept_id UUID;
    admin_user_id UUID;
BEGIN
    -- Get role and department IDs
    SELECT role_id INTO admin_role_id FROM roles WHERE role_code = 'ADMIN';
    SELECT department_id INTO admin_dept_id FROM departments WHERE department_code = 'ADMIN';
    
    -- Check if admin user exists
    SELECT user_id INTO admin_user_id FROM users WHERE email = 'admin@erp.com';
    
    -- Only create if not exists
    IF admin_user_id IS NULL THEN
        INSERT INTO users (email, password, name, user_code, department_id, is_super_admin)
        VALUES (
            'admin@erp.com',
            '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
            'System Administrator',
            'ADMIN',
            admin_dept_id,
            true
        ) RETURNING user_id INTO admin_user_id;
        
        -- Assign admin role
        INSERT INTO user_roles (user_id, role_id)
        VALUES (admin_user_id, admin_role_id)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- =====================================================
-- GRANT ALL PERMISSIONS TO ADMIN ROLE
-- =====================================================
DO $$
DECLARE
    admin_role_id UUID;
BEGIN
    SELECT role_id INTO admin_role_id FROM roles WHERE role_code = 'ADMIN';
    
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT admin_role_id, permission_id FROM permissions
    ON CONFLICT DO NOTHING;
END $$;

-- =====================================================
-- GRANT BASIC PERMISSIONS TO OTHER ROLES
-- =====================================================
DO $$
BEGIN
    -- Sales Manager gets sales and reports permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.role_id, p.permission_id
    FROM roles r, permissions p
    WHERE r.role_code = 'SALES_MANAGER'
    AND p.module_name IN ('sales', 'reports', 'masters')
    AND p.action IN ('view', 'create', 'edit')
    ON CONFLICT DO NOTHING;
    
    -- Sales User gets basic sales permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.role_id, p.permission_id
    FROM roles r, permissions p
    WHERE r.role_code = 'SALES_USER'
    AND p.module_name IN ('sales', 'masters')
    AND p.action IN ('view', 'create', 'edit')
    ON CONFLICT DO NOTHING;
    
    -- Purchase Manager gets purchase and reports permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.role_id, p.permission_id
    FROM roles r, permissions p
    WHERE r.role_code = 'PURCHASE_MANAGER'
    AND p.module_name IN ('purchase', 'reports', 'masters')
    AND p.action IN ('view', 'create', 'edit', 'approve')
    ON CONFLICT DO NOTHING;
    
    -- Purchase User gets basic purchase permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.role_id, p.permission_id
    FROM roles r, permissions p
    WHERE r.role_code = 'PURCHASE_USER'
    AND p.module_name IN ('purchase', 'masters')
    AND p.action IN ('view', 'create', 'edit')
    ON CONFLICT DO NOTHING;
    
    -- Costing Manager gets rate permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.role_id, p.permission_id
    FROM roles r, permissions p
    WHERE r.role_code = 'COSTING_MANAGER'
    AND p.module_name IN ('rate', 'reports', 'masters')
    AND p.action IN ('view', 'create', 'edit', 'approve', 'lock')
    ON CONFLICT DO NOTHING;
    
    -- Costing User gets basic rate permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.role_id, p.permission_id
    FROM roles r, permissions p
    WHERE r.role_code = 'COSTING_USER'
    AND p.module_name IN ('rate', 'masters')
    AND p.action IN ('view', 'create', 'edit')
    ON CONFLICT DO NOTHING;
    
    -- MIS User gets all reports permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.role_id, p.permission_id
    FROM roles r, permissions p
    WHERE r.role_code = 'MIS_USER'
    AND p.module_name = 'reports'
    ON CONFLICT DO NOTHING;
    
    -- Viewer gets view-only permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.role_id, p.permission_id
    FROM roles r, permissions p
    WHERE r.role_code = 'VIEWER'
    AND p.action = 'view'
    ON CONFLICT DO NOTHING;
END $$;

-- =====================================================
-- PRINT COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ ERP Database initialized successfully!';
    RAISE NOTICE '📧 Default admin email: admin@erp.com';
    RAISE NOTICE '🔑 Default password: admin123';
END $$;
