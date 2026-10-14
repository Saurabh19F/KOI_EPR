-- ============================================
-- ERP System - Supabase Seed Script
-- Run this in Supabase SQL Editor
-- ============================================

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

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- ============================================
-- STEP 2: Insert all permissions
-- ============================================

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'DASHBOARD_VIEW', 'View Dashboard', 'dashboard', 'view', 'Access to view dashboard', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'DASHBOARD_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'MASTERS_VIEW', 'View Masters', 'masters', 'view', 'Access to view master data', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'MASTERS_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'MASTERS_CREATE', 'Create Masters', 'masters', 'create', 'Access to create master data', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'MASTERS_CREATE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'MASTERS_EDIT', 'Edit Masters', 'masters', 'edit', 'Access to edit master data', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'MASTERS_EDIT');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'MASTERS_DELETE', 'Delete Masters', 'masters', 'delete', 'Access to delete master data', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'MASTERS_DELETE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'PRODUCTS_VIEW', 'View Products', 'products', 'view', 'Access to view products', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'PRODUCTS_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'PRODUCTS_CREATE', 'Create Products', 'products', 'create', 'Access to create products', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'PRODUCTS_CREATE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'PRODUCTS_EDIT', 'Edit Products', 'products', 'edit', 'Access to edit products', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'PRODUCTS_EDIT');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'PRODUCTS_DELETE', 'Delete Products', 'products', 'delete', 'Access to delete products', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'PRODUCTS_DELETE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'CUSTOMERS_VIEW', 'View Customers', 'customers', 'view', 'Access to view customers', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'CUSTOMERS_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'CUSTOMERS_CREATE', 'Create Customers', 'customers', 'create', 'Access to create customers', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'CUSTOMERS_CREATE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'CUSTOMERS_EDIT', 'Edit Customers', 'customers', 'edit', 'Access to edit customers', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'CUSTOMERS_EDIT');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'VENDORS_VIEW', 'View Vendors', 'vendors', 'view', 'Access to view vendors', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'VENDORS_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'VENDORS_CREATE', 'Create Vendors', 'vendors', 'create', 'Access to create vendors', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'VENDORS_CREATE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'VENDORS_EDIT', 'Edit Vendors', 'vendors', 'edit', 'Access to edit vendors', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'VENDORS_EDIT');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'SALES_VIEW', 'View Sales', 'sales', 'view', 'Access to view sales', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'SALES_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'SALES_CREATE', 'Create Sales', 'sales', 'create', 'Access to create sales', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'SALES_CREATE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'SALES_EDIT', 'Edit Sales', 'sales', 'edit', 'Access to edit sales', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'SALES_EDIT');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'SALES_DELETE', 'Delete Sales', 'sales', 'delete', 'Access to delete sales', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'SALES_DELETE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'SALES_APPROVE', 'Approve Sales', 'sales', 'approve', 'Access to approve sales', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'SALES_APPROVE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'PURCHASE_VIEW', 'View Purchase', 'purchase', 'view', 'Access to view purchase', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'PURCHASE_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'PURCHASE_CREATE', 'Create Purchase', 'purchase', 'create', 'Access to create purchase', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'PURCHASE_CREATE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'PURCHASE_EDIT', 'Edit Purchase', 'purchase', 'edit', 'Access to edit purchase', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'PURCHASE_EDIT');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'PURCHASE_DELETE', 'Delete Purchase', 'purchase', 'delete', 'Access to delete purchase', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'PURCHASE_DELETE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'PURCHASE_APPROVE', 'Approve Purchase', 'purchase', 'approve', 'Access to approve purchase', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'PURCHASE_APPROVE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'RATE_VIEW', 'View Rate Analysis', 'rate', 'view', 'Access to view rate analysis', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'RATE_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'RATE_CREATE', 'Create Rate Analysis', 'rate', 'create', 'Access to create rate analysis', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'RATE_CREATE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'RATE_EDIT', 'Edit Rate Analysis', 'rate', 'edit', 'Access to edit rate analysis', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'RATE_EDIT');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'RATE_APPROVE', 'Approve Rate', 'rate', 'approve', 'Access to approve rate analysis', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'RATE_APPROVE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'RATE_LOCK', 'Lock Rate', 'rate', 'lock', 'Access to lock rate analysis', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'RATE_LOCK');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'FMS_VIEW', 'View FMS', 'fms', 'view', 'Access to view FMS tasks', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'FMS_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'FMS_CREATE', 'Create FMS', 'fms', 'create', 'Access to create FMS tasks', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'FMS_CREATE');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'FMS_EDIT', 'Edit FMS', 'fms', 'edit', 'Access to edit FMS tasks', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'FMS_EDIT');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'FMS_ASSIGN', 'Assign FMS', 'fms', 'assign', 'Access to assign FMS tasks', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'FMS_ASSIGN');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'REPORTS_VIEW', 'View Reports', 'reports', 'view', 'Access to view reports', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'REPORTS_VIEW');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'REPORTS_EXPORT', 'Export Reports', 'reports', 'export', 'Access to export reports', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'REPORTS_EXPORT');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'ADMIN_USERS', 'Manage Users', 'admin', 'users', 'Access to manage users', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'ADMIN_USERS');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'ADMIN_ROLES', 'Manage Roles', 'admin', 'roles', 'Access to manage roles', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'ADMIN_ROLES');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, description, created_at, updated_at)
SELECT gen_random_uuid(), 'ADMIN_SETTINGS', 'System Settings', 'admin', 'settings', 'Access to system settings', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'ADMIN_SETTINGS');

-- ============================================
-- STEP 3: Assign permissions to ADMIN role
-- ============================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'ADMIN'
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 4: Create demo users with password 'admin123'
-- ============================================

-- First, ensure ADMIN role exists
INSERT INTO roles (role_id, role_code, role_name, description, level, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'ADMIN', 'Administrator', 'Full system access', 1, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE role_code = 'ADMIN');

-- Get ADMIN role ID
DO $$
DECLARE
    admin_role_id UUID;
    hashed_pwd TEXT;
BEGIN
    -- Hash password 'admin123' using bcrypt
    -- NOTE: In Supabase, you may need to do this via a edge function or app code
    -- For now, we'll set a placeholder that needs to be reset
    hashed_pwd := '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qUJr8N2H0xH8C2'; -- admin123

    SELECT role_id INTO admin_role_id FROM roles WHERE role_code = 'ADMIN';

    -- Create admin user
    INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
    SELECT
        gen_random_uuid(),
        'admin@erp.com',
        hashed_pwd,
        'Admin User',
        'ADM',
        admin_role_id,
        true,
        true,
        NOW(),
        NOW()
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@erp.com');

    -- Create sales manager
    INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
    SELECT
        gen_random_uuid(),
        'neha@erp.com',
        hashed_pwd,
        'Neha Sharma',
        'NEH',
        (SELECT role_id FROM roles WHERE role_code = 'SALES_MANAGER'),
        true,
        false,
        NOW(),
        NOW()
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'neha@erp.com');

    -- Create purchase manager
    INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
    SELECT
        gen_random_uuid(),
        'rahul@erp.com',
        hashed_pwd,
        'Rahul Verma',
        'RV',
        (SELECT role_id FROM roles WHERE role_code = 'PURCHASE_MANAGER'),
        true,
        false,
        NOW(),
        NOW()
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'rahul@erp.com');

    -- Create costing manager
    INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
    SELECT
        gen_random_uuid(),
        'priya@erp.com',
        hashed_pwd,
        'Priya Patel',
        'PRI',
        (SELECT role_id FROM roles WHERE role_code = 'COSTING_MANAGER'),
        true,
        false,
        NOW(),
        NOW()
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'priya@erp.com');

    -- Create sales user
    INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
    SELECT
        gen_random_uuid(),
        'amit@erp.com',
        hashed_pwd,
        'Amit Kumar',
        'AMT',
        (SELECT role_id FROM roles WHERE role_code = 'SALES_USER'),
        true,
        false,
        NOW(),
        NOW()
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'amit@erp.com');

    -- Create purchase user
    INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
    SELECT
        gen_random_uuid(),
        'sneha@erp.com',
        hashed_pwd,
        'Sneha Gupta',
        'SNG',
        (SELECT role_id FROM roles WHERE role_code = 'PURCHASE_USER'),
        true,
        false,
        NOW(),
        NOW()
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'sneha@erp.com');

    -- Create MIS user
    INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
    SELECT
        gen_random_uuid(),
        'vikram@erp.com',
        hashed_pwd,
        'Vikram Singh',
        'VIK',
        (SELECT role_id FROM roles WHERE role_code = 'MIS_USER'),
        true,
        false,
        NOW(),
        NOW()
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'vikram@erp.com');

END $$;

-- ============================================
-- STEP 5: Seed master data
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
ON CONFLICT (category_code) DO UPDATE SET category_name = EXCLUDED.category_name, is_active = true;

-- Segments
INSERT INTO segments (segment_id, segment_code, segment_name, is_active, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'SS', 'Small Size', true, NOW(), NOW()),
    (gen_random_uuid(), 'BB', 'Big Box', true, NOW(), NOW()),
    (gen_random_uuid(), 'RB', 'Regular', true, NOW(), NOW()),
    (gen_random_uuid(), 'FF', 'Family Pack', true, NOW(), NOW())
ON CONFLICT (segment_code) DO UPDATE SET segment_name = EXCLUDED.segment_name, is_active = true;

-- Component Groups
INSERT INTO component_groups (group_id, group_code, group_name, is_active, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'GRP', 'General', true, NOW(), NOW()),
    (gen_random_uuid(), 'ORG', 'Organic', true, NOW(), NOW()),
    (gen_random_uuid(), 'STD', 'Standard', true, NOW(), NOW()),
    (gen_random_uuid(), 'PRM', 'Premium', true, NOW(), NOW())
ON CONFLICT (group_code) DO UPDATE SET group_name = EXCLUDED.group_name, is_active = true;

-- Brands
INSERT INTO brands (brand_id, brand_name, country, is_active, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'Parle', 'India', true, NOW(), NOW()),
    (gen_random_uuid(), 'Britannia', 'India', true, NOW(), NOW()),
    (gen_random_uuid(), 'Cadbury', 'UK', true, NOW(), NOW()),
    (gen_random_uuid(), 'Nestle', 'Switzerland', true, NOW(), NOW()),
    (gen_random_uuid(), 'Ferrero', 'Italy', true, NOW(), NOW()),
    (gen_random_uuid(), 'Mars', 'USA', true, NOW(), NOW()),
    (gen_random_uuid(), 'PepsiCo', 'USA', true, NOW(), NOW()),
    (gen_random_uuid(), 'Haldiram', 'India', true, NOW(), NOW()),
    (gen_random_uuid(), 'Lays', 'USA', true, NOW(), NOW()),
    (gen_random_uuid(), 'Doritos', 'USA', true, NOW(), NOW())
ON CONFLICT (brand_name) DO UPDATE SET country = EXCLUDED.country, is_active = true;

-- UOM
INSERT INTO uom_master (uom_id, uom_name, uom_short_code, is_active, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'Pieces', 'PCS', true, NOW(), NOW()),
    (gen_random_uuid(), 'Kilograms', 'KG', true, NOW(), NOW()),
    (gen_random_uuid(), 'Grams', 'GM', true, NOW(), NOW()),
    (gen_random_uuid(), 'Liters', 'LTR', true, NOW(), NOW()),
    (gen_random_uuid(), 'Milliliters', 'ML', true, NOW(), NOW()),
    (gen_random_uuid(), 'Cartons', 'CTN', true, NOW(), NOW()),
    (gen_random_uuid(), 'Boxes', 'BOX', true, NOW(), NOW()),
    (gen_random_uuid(), 'Packets', 'PKT', true, NOW(), NOW())
ON CONFLICT (uom_name) DO UPDATE SET uom_short_code = EXCLUDED.uom_short_code, is_active = true;

-- GST Rates
INSERT INTO gst_rates (gst_rate_id, gst_name, gst_percent, is_active, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'Exempt', 0, true, NOW(), NOW()),
    (gen_random_uuid(), 'GST 5%', 5, true, NOW(), NOW()),
    (gen_random_uuid(), 'GST 12%', 12, true, NOW(), NOW()),
    (gen_random_uuid(), 'GST 18%', 18, true, NOW(), NOW()),
    (gen_random_uuid(), 'GST 28%', 28, true, NOW(), NOW())
ON CONFLICT (gst_percent) DO UPDATE SET gst_name = EXCLUDED.gst_name, is_active = true;

-- Zones
INSERT INTO zones (zone_id, zone_code, zone_name, is_active, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'USA', 'USA & Canada', true, NOW(), NOW()),
    (gen_random_uuid(), 'UK', 'United Kingdom', true, NOW(), NOW()),
    (gen_random_uuid(), 'EU', 'European Union', true, NOW(), NOW()),
    (gen_random_uuid(), 'DOM', 'Domestic', true, NOW(), NOW()),
    (gen_random_uuid(), 'ME', 'Middle East', true, NOW(), NOW()),
    (gen_random_uuid(), 'APAC', 'Asia Pacific', true, NOW(), NOW())
ON CONFLICT (zone_code) DO UPDATE SET zone_name = EXCLUDED.zone_name, is_active = true;

-- Locations
INSERT INTO locations (location_id, location_name, region, is_active, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'Delhi NCR', 'North', true, NOW(), NOW()),
    (gen_random_uuid(), 'Mumbai', 'West', true, NOW(), NOW()),
    (gen_random_uuid(), 'Bangalore', 'South', true, NOW(), NOW()),
    (gen_random_uuid(), 'Chennai', 'South', true, NOW(), NOW()),
    (gen_random_uuid(), 'Kolkata', 'East', true, NOW(), NOW()),
    (gen_random_uuid(), 'Hyderabad', 'South', true, NOW(), NOW()),
    (gen_random_uuid(), 'Pune', 'West', true, NOW(), NOW()),
    (gen_random_uuid(), 'Ahmedabad', 'West', true, NOW(), NOW())
ON CONFLICT (location_name) DO UPDATE SET region = EXCLUDED.region, is_active = true;

-- Haulage Charges
INSERT INTO haulage_master (haulage_id, location_name, amount, is_active, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'Delhi', 185000, true, NOW(), NOW()),
    (gen_random_uuid(), 'Mumbai', 85000, true, NOW(), NOW()),
    (gen_random_uuid(), 'Chennai', 95000, true, NOW(), NOW()),
    (gen_random_uuid(), 'Kolkata', 120000, true, NOW(), NOW())
ON CONFLICT (location_name) DO UPDATE SET amount = EXCLUDED.amount, is_active = true;

-- Currency Rates
INSERT INTO currency_rate_master (rate_id, currency_code, rate, margin, is_active, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'USD', 83.50, 0.25, true, NOW(), NOW()),
    (gen_random_uuid(), 'GBP', 105.25, 0.25, true, NOW(), NOW()),
    (gen_random_uuid(), 'EUR', 90.75, 0.25, true, NOW(), NOW()),
    (gen_random_uuid(), 'AED', 22.75, 0.10, true, NOW(), NOW()),
    (gen_random_uuid(), 'SGD', 62.00, 0.15, true, NOW(), NOW()),
    (gen_random_uuid(), 'AUD', 55.50, 0.20, true, NOW(), NOW())
ON CONFLICT (currency_code) DO UPDATE SET rate = EXCLUDED.rate, margin = EXCLUDED.margin, is_active = true;

-- Sample Customers
INSERT INTO customers (customer_id, buyer_code, customer_name, zone, country, status, is_active, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'USA-000001', 'ABC Imports LLC', 'USA', 'US', 'active', true, NOW(), NOW()),
    (gen_random_uuid(), 'UK-000001', 'UK Distributors Ltd', 'UK', 'GB', 'active', true, NOW(), NOW()),
    (gen_random_uuid(), 'ME-000001', 'Gulf Trading Co', 'ME', 'AE', 'active', true, NOW(), NOW()),
    (gen_random_uuid(), 'APAC-000001', 'Asia Pacific Traders', 'APAC', 'SG', 'active', true, NOW(), NOW()),
    (gen_random_uuid(), 'EU-000001', 'European Foods GmbH', 'EU', 'DE', 'active', true, NOW(), NOW()),
    (gen_random_uuid(), 'DOM-000001', 'Local Mart', 'DOM', 'IN', 'active', true, NOW(), NOW())
ON CONFLICT (buyer_code) DO UPDATE SET customer_name = EXCLUDED.customer_name, is_active = true;

-- Sample Vendors
INSERT INTO vendors (vendor_id, vendor_code, vendor_name, is_active, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'VND-001', 'ABC Manufacturers', true, NOW(), NOW()),
    (gen_random_uuid(), 'VND-002', 'XYZ Suppliers', true, NOW(), NOW()),
    (gen_random_uuid(), 'VND-003', 'Global Exports', true, NOW(), NOW()),
    (gen_random_uuid(), 'VND-004', 'Prime Industries', true, NOW(), NOW()),
    (gen_random_uuid(), 'VND-005', 'Quality Foods Co', true, NOW(), NOW())
ON CONFLICT (vendor_code) DO UPDATE SET vendor_name = EXCLUDED.vendor_name, is_active = true;

-- ============================================
-- STEP 6: Verify setup
-- ============================================

SELECT 'Setup Complete!' AS status;

SELECT 'Roles' AS table_name, COUNT(*) AS count FROM roles
UNION ALL
SELECT 'Permissions', COUNT(*) FROM permissions
UNION ALL
SELECT 'Role Permissions', COUNT(*) FROM role_permissions
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Product Categories', COUNT(*) FROM product_categories
UNION ALL
SELECT 'Customers', COUNT(*) FROM customers
UNION ALL
SELECT 'Vendors', COUNT(*) FROM vendors;

-- Show user permissions for admin
SELECT u.email, r.role_code, COUNT(p.permission_id) AS permission_count
FROM users u
JOIN roles r ON u.role_id = r.role_id
LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.permission_id
GROUP BY u.email, r.role_code;
