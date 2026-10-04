-- COMPLETE DATABASE SEED - Run this in Neon SQL Editor
-- This will fix all tables and seed all data

BEGIN;

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- 1. CREATE ALL TABLES
-- ============================================

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

-- ============================================
-- 2. CREATE ROLES
-- ============================================

DELETE FROM roles;

INSERT INTO roles (role_id, role_code, role_name, description, level, is_active, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'ADMIN', 'Administrator', 'Full system access', 1, true, NOW(), NOW()),
    (gen_random_uuid(), 'SALES_MANAGER', 'Sales Manager', 'Sales team management', 2, true, NOW(), NOW()),
    (gen_random_uuid(), 'SALES_USER', 'Sales User', 'Create and manage own enquiries', 3, true, NOW(), NOW()),
    (gen_random_uuid(), 'PURCHASE_MANAGER', 'Purchase Manager', 'Purchase management', 2, true, NOW(), NOW()),
    (gen_random_uuid(), 'PURCHASE_USER', 'Purchase User', 'Create purchase quotes', 3, true, NOW(), NOW()),
    (gen_random_uuid(), 'COSTING_MANAGER', 'Costing Manager', 'Rate calculations', 2, true, NOW(), NOW()),
    (gen_random_uuid(), 'MIS_USER', 'MIS User', 'Reports only', 4, true, NOW(), NOW()),
    (gen_random_uuid(), 'VIEWER', 'Viewer', 'Read-only access', 5, true, NOW(), NOW());

-- ============================================
-- 3. CREATE USERS
-- ============================================

DELETE FROM users;

INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'admin@erp.com',
    crypt('admin123', gen_salt('bf', 10)),
    'Admin User',
    'ADM',
    role_id,
    true,
    true,
    NOW(),
    NOW()
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

-- ============================================
-- 4. SEED MASTER DATA
-- ============================================

-- Product Categories
DELETE FROM product_categories;
INSERT INTO product_categories (category_id, category_code, category_name, is_active)
VALUES
    (gen_random_uuid(), 'BRD', 'Biscuits & Bakery', true),
    (gen_random_uuid(), 'KRI', 'Chocolates & Confectionery', true),
    (gen_random_uuid(), 'SNA', 'Snacks & Savories', true),
    (gen_random_uuid(), 'BVR', 'Beverages', true),
    (gen_random_uuid(), 'DRY', 'Dry Fruits', true),
    (gen_random_uuid(), 'FRZ', 'Frozen Foods', true);

-- Segments
DELETE FROM segments;
INSERT INTO segments (segment_id, segment_code, segment_name, is_active)
VALUES
    (gen_random_uuid(), 'SS', 'Small Size', true),
    (gen_random_uuid(), 'BB', 'Big Box', true),
    (gen_random_uuid(), 'RB', 'Regular', true),
    (gen_random_uuid(), 'FF', 'Family Pack', true);

-- Component Groups
DELETE FROM component_groups;
INSERT INTO component_groups (group_id, group_code, group_name, is_active)
VALUES
    (gen_random_uuid(), 'GRP', 'General', true),
    (gen_random_uuid(), 'ORG', 'Organic', true),
    (gen_random_uuid(), 'STD', 'Standard', true),
    (gen_random_uuid(), 'PRM', 'Premium', true);

-- Brands
DELETE FROM brands;
INSERT INTO brands (brand_id, brand_name, country, is_active)
VALUES
    (gen_random_uuid(), 'Parle', 'India', true),
    (gen_random_uuid(), 'Britannia', 'India', true),
    (gen_random_uuid(), 'Cadbury', 'UK', true),
    (gen_random_uuid(), 'Nestle', 'Switzerland', true),
    (gen_random_uuid(), 'Haldiram', 'India', true),
    (gen_random_uuid(), 'PepsiCo', 'USA', true);

-- UOM
DELETE FROM uom_master;
INSERT INTO uom_master (uom_id, uom_name, uom_short_code, is_active)
VALUES
    (gen_random_uuid(), 'Pieces', 'PCS', true),
    (gen_random_uuid(), 'Kilograms', 'KG', true),
    (gen_random_uuid(), 'Grams', 'GM', true),
    (gen_random_uuid(), 'Liters', 'LTR', true),
    (gen_random_uuid(), 'Cartons', 'CTN', true),
    (gen_random_uuid(), 'Boxes', 'BOX', true);

-- GST Rates
DELETE FROM gst_rates;
INSERT INTO gst_rates (gst_rate_id, gst_name, gst_percent, is_active)
VALUES
    (gen_random_uuid(), 'Exempt', 0, true),
    (gen_random_uuid(), 'GST 5%', 5, true),
    (gen_random_uuid(), 'GST 12%', 12, true),
    (gen_random_uuid(), 'GST 18%', 18, true),
    (gen_random_uuid(), 'GST 28%', 28, true);

-- Zones
DELETE FROM zones;
INSERT INTO zones (zone_id, zone_code, zone_name, is_active)
VALUES
    (gen_random_uuid(), 'USA', 'USA & Canada', true),
    (gen_random_uuid(), 'UK', 'United Kingdom', true),
    (gen_random_uuid(), 'EU', 'European Union', true),
    (gen_random_uuid(), 'DOM', 'Domestic', true),
    (gen_random_uuid(), 'ME', 'Middle East', true),
    (gen_random_uuid(), 'APAC', 'Asia Pacific', true);

-- Locations
DELETE FROM locations;
INSERT INTO locations (location_id, location_name, region, is_active)
VALUES
    (gen_random_uuid(), 'Delhi NCR', 'North', true),
    (gen_random_uuid(), 'Mumbai', 'West', true),
    (gen_random_uuid(), 'Bangalore', 'South', true),
    (gen_random_uuid(), 'Chennai', 'South', true),
    (gen_random_uuid(), 'Kolkata', 'East', true);

-- Haulage
DELETE FROM haulage_master;
INSERT INTO haulage_master (haulage_id, location_name, amount, is_active)
VALUES
    (gen_random_uuid(), 'Delhi', 185000, true),
    (gen_random_uuid(), 'Mumbai', 85000, true),
    (gen_random_uuid(), 'Chennai', 95000, true),
    (gen_random_uuid(), 'Kolkata', 120000, true);

-- Currency Rates
DELETE FROM currency_rate_master;
INSERT INTO currency_rate_master (rate_id, company_id, currency_code, currency_name, rate, rate_date, source, is_active)
VALUES
    (gen_random_uuid(), NULL, 'USD', 'US Dollar', 83.50, CURRENT_DATE, 'MANUAL', true),
    (gen_random_uuid(), NULL, 'GBP', 'British Pound', 105.25, CURRENT_DATE, 'MANUAL', true),
    (gen_random_uuid(), NULL, 'EUR', 'Euro', 90.75, CURRENT_DATE, 'MANUAL', true),
    (gen_random_uuid(), NULL, 'AED', 'UAE Dirham', 22.75, CURRENT_DATE, 'MANUAL', true),
    (gen_random_uuid(), NULL, 'INR', 'Indian Rupee', 1.00, CURRENT_DATE, 'BASE', true);

-- Customers
DELETE FROM customers;
INSERT INTO customers (customer_id, buyer_code, customer_name, zone, country, status, is_active)
VALUES
    (gen_random_uuid(), 'USA-000001', 'ABC Imports LLC', 'USA', 'US', 'active', true),
    (gen_random_uuid(), 'UK-000001', 'UK Distributors Ltd', 'UK', 'GB', 'active', true),
    (gen_random_uuid(), 'ME-000001', 'Gulf Trading Co', 'ME', 'AE', 'active', true),
    (gen_random_uuid(), 'DOM-000001', 'Local Mart', 'DOM', 'IN', 'active', true);

-- Vendors
DELETE FROM vendors;
INSERT INTO vendors (vendor_id, vendor_code, vendor_name, is_active)
VALUES
    (gen_random_uuid(), 'VND-001', 'ABC Manufacturers', true),
    (gen_random_uuid(), 'VND-002', 'XYZ Suppliers', true),
    (gen_random_uuid(), 'VND-003', 'Global Exports', true);

COMMIT;

-- ============================================
-- VERIFY
-- ============================================

SELECT 'Users:' as "", COUNT(*) as count FROM users;
SELECT 'Roles:' as "", COUNT(*) as count FROM roles;
SELECT 'Permissions:' as "", COUNT(*) as count FROM permissions;
SELECT 'Categories:' as "", COUNT(*) as count FROM product_categories;
SELECT 'Currency Rates:' as "", COUNT(*) as count FROM currency_rate_master;
SELECT 'Customers:' as "", COUNT(*) as count FROM customers;
SELECT 'Vendors:' as "", COUNT(*) as count FROM vendors;

-- Show users
SELECT u.email, u.name, r.role_code
FROM users u
JOIN roles r ON u.role_id = r.role_id
ORDER BY r.level;
