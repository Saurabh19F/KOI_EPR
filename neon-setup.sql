-- ============================================
-- ERP Setup for Neon PostgreSQL
-- Run this in Neon SQL Editor: https://console.neon.tech
-- ============================================

-- Password for all demo users: admin123
-- bcrypt hash: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qUJr8N2H0xH8C2

-- ============================================
-- STEP 1: Create role_permissions junction table
-- ============================================
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rp_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_rp_perm ON role_permissions(permission_id);

-- ============================================
-- STEP 2: Insert Permissions (if not exists)
-- ============================================

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'DASHBOARD_VIEW', 'View Dashboard', 'dashboard', 'view', 'Dashboard access', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'DASHBOARD_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'MASTERS_VIEW', 'View Masters', 'masters', 'view', 'View master data', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'MASTERS_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'MASTERS_CREATE', 'Create Masters', 'masters', 'create', 'Create master data', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'MASTERS_CREATE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'MASTERS_EDIT', 'Edit Masters', 'masters', 'edit', 'Edit master data', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'MASTERS_EDIT');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'MASTERS_DELETE', 'Delete Masters', 'masters', 'delete', 'Delete master data', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'MASTERS_DELETE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'PRODUCTS_VIEW', 'View Products', 'products', 'view', 'View products', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'PRODUCTS_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'PRODUCTS_CREATE', 'Create Products', 'products', 'create', 'Create products', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'PRODUCTS_CREATE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'PRODUCTS_EDIT', 'Edit Products', 'products', 'edit', 'Edit products', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'PRODUCTS_EDIT');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'CUSTOMERS_VIEW', 'View Customers', 'customers', 'view', 'View customers', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'CUSTOMERS_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'CUSTOMERS_CREATE', 'Create Customers', 'customers', 'create', 'Create customers', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'CUSTOMERS_CREATE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'CUSTOMERS_EDIT', 'Edit Customers', 'customers', 'edit', 'Edit customers', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'CUSTOMERS_EDIT');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'SALES_VIEW', 'View Sales', 'sales', 'view', 'View sales', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'SALES_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'SALES_CREATE', 'Create Sales', 'sales', 'create', 'Create sales', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'SALES_CREATE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'SALES_EDIT', 'Edit Sales', 'sales', 'edit', 'Edit sales', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'SALES_EDIT');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'SALES_DELETE', 'Delete Sales', 'sales', 'delete', 'Delete sales', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'SALES_DELETE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'SALES_APPROVE', 'Approve Sales', 'sales', 'approve', 'Approve sales', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'SALES_APPROVE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'PURCHASE_VIEW', 'View Purchase', 'purchase', 'view', 'View purchase', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'PURCHASE_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'PURCHASE_CREATE', 'Create Purchase', 'purchase', 'create', 'Create purchase', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'PURCHASE_CREATE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'PURCHASE_EDIT', 'Edit Purchase', 'purchase', 'edit', 'Edit purchase', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'PURCHASE_EDIT');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'PURCHASE_APPROVE', 'Approve Purchase', 'purchase', 'approve', 'Approve purchase', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'PURCHASE_APPROVE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'RATE_VIEW', 'View Rate', 'rate', 'view', 'View rates', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'RATE_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'RATE_CREATE', 'Create Rate', 'rate', 'create', 'Create rates', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'RATE_CREATE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'RATE_EDIT', 'Edit Rate', 'rate', 'edit', 'Edit rates', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'RATE_EDIT');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'RATE_APPROVE', 'Approve Rate', 'rate', 'approve', 'Approve rates', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'RATE_APPROVE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'FMS_VIEW', 'View FMS', 'fms', 'view', 'View FMS', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'FMS_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'FMS_CREATE', 'Create FMS', 'fms', 'create', 'Create FMS tasks', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'FMS_CREATE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'REPORTS_VIEW', 'View Reports', 'reports', 'view', 'View reports', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'REPORTS_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'REPORTS_EXPORT', 'Export Reports', 'reports', 'export', 'Export reports', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'REPORTS_EXPORT');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'ADMIN_USERS', 'Admin Users', 'admin', 'users', 'Manage users', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'ADMIN_USERS');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'ADMIN_ROLES', 'Admin Roles', 'admin', 'roles', 'Manage roles', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'ADMIN_ROLES');

-- ============================================
-- STEP 3: Create Roles and assign permissions
-- ============================================

-- ADMIN Role
INSERT INTO roles (role_id, role_code, role_name, description, level, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'ADMIN', 'Administrator', 'Full system access', 1, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE role_code = 'ADMIN')
RETURNING role_id INTO :admin_role_id;

-- SALES_MANAGER Role
INSERT INTO roles (role_id, role_code, role_name, description, level, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'SALES_MANAGER', 'Sales Manager', 'Sales management', 2, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE role_code = 'SALES_MANAGER');

-- PURCHASE_MANAGER Role
INSERT INTO roles (role_id, role_code, role_name, description, level, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'PURCHASE_MANAGER', 'Purchase Manager', 'Purchase management', 2, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE role_code = 'PURCHASE_MANAGER');

-- SALES_USER Role
INSERT INTO roles (role_id, role_code, role_name, description, level, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'SALES_USER', 'Sales User', 'Sales team', 3, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE role_code = 'SALES_USER');

-- PURCHASE_USER Role
INSERT INTO roles (role_id, role_code, role_name, description, level, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'PURCHASE_USER', 'Purchase User', 'Purchase team', 3, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE role_code = 'PURCHASE_USER');

-- COSTING_USER Role
INSERT INTO roles (role_id, role_code, role_name, description, level, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'COSTING_USER', 'Costing User', 'Costing team', 3, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE role_code = 'COSTING_USER');

-- VIEWER Role
INSERT INTO roles (role_id, role_code, role_name, description, level, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'VIEWER', 'Viewer', 'Read-only access', 10, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE role_code = 'VIEWER');

-- Grant all permissions to ADMIN role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'ADMIN'
ON CONFLICT DO NOTHING;

-- Grant basic permissions to SALES_MANAGER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'SALES_MANAGER'
AND p.action IN ('view', 'create', 'edit', 'approve')
AND p.module_name IN ('dashboard', 'masters', 'sales', 'reports')
ON CONFLICT DO NOTHING;

-- Grant basic permissions to VIEWER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'VIEWER'
AND p.action = 'view'
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 4: Create demo users with password "admin123"
-- ============================================

-- bcrypt hash for "admin123"
DO $$
DECLARE
    admin_role_uuid UUID;
    hashed_pwd TEXT := '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qUJr8N2H0xH8C2';
BEGIN
    -- Get ADMIN role ID
    SELECT role_id INTO admin_role_uuid FROM roles WHERE role_code = 'ADMIN';

    -- Create admin user
    INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
    VALUES (gen_random_uuid(), 'admin@erp.com', hashed_pwd, 'Admin User', 'ADM', admin_role_uuid, true, true, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name,
        role_id = EXCLUDED.role_id,
        is_active = true,
        is_super_admin = true;

    -- Create other demo users
    INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
    VALUES (gen_random_uuid(), 'neha@erp.com', hashed_pwd, 'Neha Sharma', 'NEH', admin_role_uuid, true, false, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name;

    INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
    VALUES (gen_random_uuid(), 'rahul@erp.com', hashed_pwd, 'Rahul Verma', 'RV', admin_role_uuid, true, false, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name;

    INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
    VALUES (gen_random_uuid(), 'priya@erp.com', hashed_pwd, 'Priya Patel', 'PRI', admin_role_uuid, true, false, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name;

    INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
    VALUES (gen_random_uuid(), 'amit@erp.com', hashed_pwd, 'Amit Kumar', 'AMT', admin_role_uuid, true, false, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name;

    INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
    VALUES (gen_random_uuid(), 'sneha@erp.com', hashed_pwd, 'Sneha Gupta', 'SNG', admin_role_uuid, true, false, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name;
END $$;

-- ============================================
-- STEP 5: Seed Master Data
-- ============================================

-- Product Categories
INSERT INTO product_categories (category_id, category_code, category_name, is_active, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'BRD', 'Biscuits & Bakery', true, NOW(), NOW()),
    (gen_random_uuid(), 'KRI', 'Chocolates & Confectionery', true, NOW(), NOW()),
    (gen_random_uuid(), 'SNA', 'Snacks & Savories', true, NOW(), NOW()),
    (gen_random_uuid(), 'BVR', 'Beverages', true, NOW(), NOW()),
    (gen_random_uuid(), 'DRY', 'Dry Fruits', true, NOW(), NOW()),
    (gen_random_uuid(), 'FRZ', 'Frozen Foods', true, NOW(), NOW())
ON CONFLICT (category_code) DO UPDATE SET
    category_name = EXCLUDED.category_name,
    is_active = true;

-- Segments
INSERT INTO segments (segment_id, segment_code, segment_name, is_active, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'SS', 'Small Size', true, NOW(), NOW()),
    (gen_random_uuid(), 'BB', 'Big Box', true, NOW(), NOW()),
    (gen_random_uuid(), 'RB', 'Regular', true, NOW(), NOW()),
    (gen_random_uuid(), 'FF', 'Family Pack', true, NOW(), NOW())
ON CONFLICT (segment_code) DO UPDATE SET
    segment_name = EXCLUDED.segment_name,
    is_active = true;

-- Component Groups
INSERT INTO component_groups (group_id, group_code, group_name, is_active, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'GRP', 'General', true, NOW(), NOW()),
    (gen_random_uuid(), 'ORG', 'Organic', true, NOW(), NOW()),
    (gen_random_uuid(), 'STD', 'Standard', true, NOW(), NOW()),
    (gen_random_uuid(), 'PRM', 'Premium', true, NOW(), NOW())
ON CONFLICT (group_code) DO UPDATE SET
    group_name = EXCLUDED.group_name,
    is_active = true;

-- Brands
INSERT INTO brands (brand_id, brand_name, country, is_active, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'Parle', 'India', true, NOW(), NOW()),
    (gen_random_uuid(), 'Britannia', 'India', true, NOW(), NOW()),
    (gen_random_uuid(), 'Cadbury', 'UK', true, NOW(), NOW()),
    (gen_random_uuid(), 'Nestle', 'Switzerland', true, NOW(), NOW()),
    (gen_random_uuid(), 'Haldiram', 'India', true, NOW(), NOW()),
    (gen_random_uuid(), 'PepsiCo', 'USA', true, NOW(), NOW())
ON CONFLICT (brand_name) DO UPDATE SET
    country = EXCLUDED.country,
    is_active = true;

-- GST Rates
INSERT INTO gst_rates (gst_rate_id, gst_name, gst_percent, is_active, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'Exempt', 0, true, NOW(), NOW()),
    (gen_random_uuid(), 'GST 5%', 5, true, NOW(), NOW()),
    (gen_random_uuid(), 'GST 12%', 12, true, NOW(), NOW()),
    (gen_random_uuid(), 'GST 18%', 18, true, NOW(), NOW()),
    (gen_random_uuid(), 'GST 28%', 28, true, NOW(), NOW())
ON CONFLICT (gst_percent) DO UPDATE SET
    gst_name = EXCLUDED.gst_name,
    is_active = true;

-- Zones
INSERT INTO zones (zone_id, zone_code, zone_name, is_active, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'USA', 'USA & Canada', true, NOW(), NOW()),
    (gen_random_uuid(), 'UK', 'United Kingdom', true, NOW(), NOW()),
    (gen_random_uuid(), 'EU', 'European Union', true, NOW(), NOW()),
    (gen_random_uuid(), 'DOM', 'Domestic', true, NOW(), NOW()),
    (gen_random_uuid(), 'ME', 'Middle East', true, NOW(), NOW()),
    (gen_random_uuid(), 'APAC', 'Asia Pacific', true, NOW(), NOW())
ON CONFLICT (zone_code) DO UPDATE SET
    zone_name = EXCLUDED.zone_name,
    is_active = true;

-- Locations
INSERT INTO locations (location_id, location_name, region, is_active, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'Delhi NCR', 'North', true, NOW(), NOW()),
    (gen_random_uuid(), 'Mumbai', 'West', true, NOW(), NOW()),
    (gen_random_uuid(), 'Bangalore', 'South', true, NOW(), NOW()),
    (gen_random_uuid(), 'Chennai', 'South', true, NOW(), NOW()),
    (gen_random_uuid(), 'Kolkata', 'East', true, NOW(), NOW()),
    (gen_random_uuid(), 'Hyderabad', 'South', true, NOW(), NOW())
ON CONFLICT (location_name) DO UPDATE SET
    region = EXCLUDED.region,
    is_active = true;

-- Haulage Charges
INSERT INTO haulage_master (haulage_id, location_name, amount, is_active, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'Delhi', 185000, true, NOW(), NOW()),
    (gen_random_uuid(), 'Mumbai', 85000, true, NOW(), NOW()),
    (gen_random_uuid(), 'Chennai', 95000, true, NOW(), NOW()),
    (gen_random_uuid(), 'Kolkata', 120000, true, NOW(), NOW())
ON CONFLICT (location_name) DO UPDATE SET
    amount = EXCLUDED.amount,
    is_active = true;

-- Currency Rates
INSERT INTO currency_rate_master (rate_id, currency_code, rate, margin, is_active, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'USD', 83.50, 0.25, true, NOW(), NOW()),
    (gen_random_uuid(), 'GBP', 105.25, 0.25, true, NOW(), NOW()),
    (gen_random_uuid(), 'EUR', 90.75, 0.25, true, NOW(), NOW()),
    (gen_random_uuid(), 'AED', 22.75, 0.10, true, NOW(), NOW())
ON CONFLICT (currency_code) DO UPDATE SET
    rate = EXCLUDED.rate,
    margin = EXCLUDED.margin,
    is_active = true;

-- Sample Customers
INSERT INTO customers (customer_id, buyer_code, customer_name, zone, country, status, is_active, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'USA-000001', 'ABC Imports LLC', 'USA', 'US', 'active', true, NOW(), NOW()),
    (gen_random_uuid(), 'UK-000001', 'UK Distributors Ltd', 'UK', 'GB', 'active', true, NOW(), NOW()),
    (gen_random_uuid(), 'ME-000001', 'Gulf Trading Co', 'ME', 'AE', 'active', true, NOW(), NOW()),
    (gen_random_uuid(), 'DOM-000001', 'Local Mart', 'DOM', 'IN', 'active', true, NOW(), NOW())
ON CONFLICT (buyer_code) DO UPDATE SET
    customer_name = EXCLUDED.customer_name,
    is_active = true;

-- Sample Vendors
INSERT INTO vendors (vendor_id, vendor_code, vendor_name, is_active, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'VND-001', 'ABC Manufacturers', true, NOW(), NOW()),
    (gen_random_uuid(), 'VND-002', 'XYZ Suppliers', true, NOW(), NOW()),
    (gen_random_uuid(), 'VND-003', 'Global Exports', true, NOW(), NOW()),
    (gen_random_uuid(), 'VND-004', 'Prime Industries', true, NOW(), NOW())
ON CONFLICT (vendor_code) DO UPDATE SET
    vendor_name = EXCLUDED.vendor_name,
    is_active = true;

-- ============================================
-- STEP 6: Verify
-- ============================================

SELECT '✅ Setup Complete!' AS status;

-- Show table counts
SELECT 'roles' AS table_name, COUNT(*) AS count FROM roles
UNION ALL SELECT 'permissions', COUNT(*) FROM permissions
UNION ALL SELECT 'role_permissions', COUNT(*) FROM role_permissions
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'product_categories', COUNT(*) FROM product_categories
UNION ALL SELECT 'customers', COUNT(*) FROM customers
UNION ALL SELECT 'vendors', COUNT(*) FROM vendors;

-- Show users
SELECT email, name, is_super_admin FROM users ORDER BY created_at;
