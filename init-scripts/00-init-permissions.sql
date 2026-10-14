-- ================================================
-- ERP DATABASE SEED DATA
-- Run after database is created
-- ================================================

-- ================================================
-- 1. PERMISSIONS
-- ================================================
INSERT INTO permissions (permission_id, permission_name, permission_code, permission_group, description, is_active, created_at)
VALUES
-- Masters
('perm-001', 'View Masters', 'MASTERS_VIEW', 'Masters', 'View master data', true, NOW()),
('perm-002', 'Create Masters', 'MASTERS_CREATE', 'Masters', 'Create master data', true, NOW()),
('perm-003', 'Edit Masters', 'MASTERS_EDIT', 'Masters', 'Edit master data', true, NOW()),
('perm-004', 'Delete Masters', 'MASTERS_DELETE', 'Masters', 'Delete master data', true, NOW()),

-- Products
('perm-005', 'View Products', 'PRODUCTS_VIEW', 'Products', 'View products', true, NOW()),
('perm-006', 'Create Products', 'PRODUCTS_CREATE', 'Products', 'Create products', true, NOW()),
('perm-007', 'Edit Products', 'PRODUCTS_EDIT', 'Products', 'Edit products', true, NOW()),
('perm-008', 'Delete Products', 'PRODUCTS_DELETE', 'Products', 'Delete products', true, NOW()),

-- Customers
('perm-009', 'View Customers', 'CUSTOMERS_VIEW', 'Customers', 'View customers', true, NOW()),
('perm-010', 'Create Customers', 'CUSTOMERS_CREATE', 'Customers', 'Create customers', true, NOW()),
('perm-011', 'Edit Customers', 'CUSTOMERS_EDIT', 'Customers', 'Edit customers', true, NOW()),
('perm-012', 'Delete Customers', 'CUSTOMERS_DELETE', 'Customers', 'Delete customers', true, NOW()),

-- Sales
('perm-013', 'View Sales', 'SALES_VIEW', 'Sales', 'View sales enquiries', true, NOW()),
('perm-014', 'Create Sales', 'SALES_CREATE', 'Sales', 'Create sales enquiries', true, NOW()),
('perm-015', 'Edit Sales', 'SALES_EDIT', 'Sales', 'Edit sales enquiries', true, NOW()),
('perm-016', 'Delete Sales', 'SALES_DELETE', 'Sales', 'Delete sales enquiries', true, NOW()),
('perm-017', 'Approve Sales', 'SALES_APPROVE', 'Sales', 'Approve sales enquiries', true, NOW()),

-- Purchase
('perm-018', 'View Purchase', 'PURCHASE_VIEW', 'Purchase', 'View purchase quotes', true, NOW()),
('perm-019', 'Create Purchase', 'PURCHASE_CREATE', 'Purchase', 'Create purchase quotes', true, NOW()),
('perm-020', 'Edit Purchase', 'PURCHASE_EDIT', 'Purchase', 'Edit purchase quotes', true, NOW()),
('perm-021', 'Delete Purchase', 'PURCHASE_DELETE', 'Purchase', 'Delete purchase quotes', true, NOW()),
('perm-022', 'Approve Purchase', 'PURCHASE_APPROVE', 'Purchase', 'Approve purchase quotes', true, NOW()),

-- Rate
('perm-023', 'View Rate', 'RATE_VIEW', 'Rate', 'View rate analysis', true, NOW()),
('perm-024', 'Create Rate', 'RATE_CREATE', 'Rate', 'Create rate analysis', true, NOW()),
('perm-025', 'Edit Rate', 'RATE_EDIT', 'Rate', 'Edit rate analysis', true, NOW()),
('perm-026', 'Delete Rate', 'RATE_DELETE', 'Rate', 'Delete rate analysis', true, NOW()),
('perm-027', 'Approve Rate', 'RATE_APPROVE', 'Rate', 'Approve rate analysis', true, NOW()),
('perm-028', 'Lock Rate', 'RATE_LOCK', 'Rate', 'Lock rate analysis', true, NOW()),

-- FMS
('perm-029', 'View FMS', 'FMS_VIEW', 'FMS', 'View FMS tasks', true, NOW()),
('perm-030', 'Create FMS', 'FMS_CREATE', 'FMS', 'Create FMS tasks', true, NOW()),
('perm-031', 'Edit FMS', 'FMS_EDIT', 'FMS', 'Edit FMS tasks', true, NOW()),
('perm-032', 'Update FMS', 'FMS_UPDATE', 'FMS', 'Update FMS tasks', true, NOW()),
('perm-033', 'Assign FMS', 'FMS_ASSIGN', 'FMS', 'Assign FMS tasks', true, NOW()),

-- Reports
('perm-034', 'View Reports', 'REPORTS_VIEW', 'Reports', 'View reports', true, NOW()),
('perm-035', 'Export Reports', 'REPORTS_EXPORT', 'Reports', 'Export reports', true, NOW()),

-- Admin
('perm-036', 'Admin Full', 'ADMIN_FULL', 'Admin', 'Full admin access', true, NOW()),
('perm-037', 'Settings', 'ADMIN_SETTINGS', 'Admin', 'Access settings', true, NOW()),
('perm-038', 'Manage Users', 'ADMIN_USERS', 'Admin', 'Manage users', true, NOW());

-- ================================================
-- 2. ROLES
-- ================================================
INSERT INTO roles (role_id, role_name, role_code, description, is_active, created_at)
VALUES
('role-admin', 'Administrator', 'ADMIN', 'Full system access', true, NOW()),
('role-mgmt', 'Management', 'MANAGEMENT', 'High level access', true, NOW()),
('role-sales-mgr', 'Sales Manager', 'SALES_MANAGER', 'Sales management', true, NOW()),
('role-sales', 'Sales User', 'SALES_USER', 'Sales team', true, NOW()),
('role-purchase-mgr', 'Purchase Manager', 'PURCHASE_MANAGER', 'Purchase management', true, NOW()),
('role-purchase', 'Purchase User', 'PURCHASE_USER', 'Purchase team', true, NOW()),
('role-costing-mgr', 'Costing Manager', 'COSTING_MANAGER', 'Costing management', true, NOW()),
('role-costing', 'Costing User', 'COSTING_USER', 'Costing team', true, NOW()),
('role-mis', 'MIS User', 'MIS_USER', 'Reports only', true, NOW()),
('role-finance', 'Finance User', 'FINANCE_USER', 'Finance access', true, NOW()),
('role-viewer', 'Viewer', 'VIEWER', 'Read-only access', true, NOW());

-- ================================================
-- 3. ROLE PERMISSIONS
-- ================================================
-- ADMIN gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role-admin', permission_id FROM permissions;

-- MANAGEMENT gets most permissions except admin settings
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role-mgmt', permission_id FROM permissions
WHERE permission_code NOT IN ('ADMIN_FULL', 'ADMIN_USERS');

-- SALES_MANAGER gets sales, customers, reports
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role-sales-mgr', permission_id FROM permissions
WHERE permission_group IN ('Sales', 'Customers', 'Reports', 'Masters');

-- SALES_USER gets basic sales access
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role-sales', permission_id FROM permissions
WHERE permission_code IN ('SALES_VIEW', 'SALES_CREATE', 'SALES_EDIT', 'CUSTOMERS_VIEW', 'MASTERS_VIEW', 'REPORTS_VIEW');

-- PURCHASE_MANAGER gets purchase, vendors, reports
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role-purchase-mgr', permission_id FROM permissions
WHERE permission_group IN ('Purchase', 'Reports', 'Masters');

-- PURCHASE_USER gets basic purchase access
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role-purchase', permission_id FROM permissions
WHERE permission_code IN ('PURCHASE_VIEW', 'PURCHASE_CREATE', 'PURCHASE_EDIT', 'REPORTS_VIEW', 'MASTERS_VIEW');

-- COSTING_MANAGER gets rate, purchase, sales access
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role-costing-mgr', permission_id FROM permissions
WHERE permission_group IN ('Rate', 'Purchase', 'Sales', 'Masters', 'Reports');

-- COSTING_USER gets rate access
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role-costing', permission_id FROM permissions
WHERE permission_code IN ('RATE_VIEW', 'RATE_CREATE', 'RATE_EDIT', 'MASTERS_VIEW', 'REPORTS_VIEW');

-- MIS_USER gets reports only
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role-mis', permission_id FROM permissions
WHERE permission_group IN ('Reports', 'Masters');

-- FINANCE_USER gets reports, purchase
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role-finance', permission_id FROM permissions
WHERE permission_code IN ('REPORTS_VIEW', 'REPORTS_EXPORT', 'PURCHASE_VIEW', 'MASTERS_VIEW');

-- VIEWER gets read-only
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role-viewer', permission_id FROM permissions
WHERE permission_code LIKE '%_VIEW';

-- ================================================
-- 4. DEPARTMENTS
-- ================================================
INSERT INTO departments (department_id, department_name, department_code, description, is_active, created_at)
VALUES
('dept-sales', 'Sales', 'SALES', 'Sales Department', true, NOW()),
('dept-purchase', 'Purchase', 'PURCHASE', 'Purchase Department', true, NOW()),
('dept-costing', 'Costing', 'COSTING', 'Costing Department', true, NOW()),
('dept-finance', 'Finance', 'FINANCE', 'Finance Department', true, NOW()),
('dept-warehouse', 'Warehouse', 'WAREHOUSE', 'Warehouse Department', true, NOW()),
('dept-management', 'Management', 'MGMT', 'Management', true, NOW());

-- ================================================
-- 5. USERS
-- ================================================
INSERT INTO users (user_id, name, email, password, phone, department_id, is_active, created_at)
VALUES
('user-admin', 'System Admin', 'admin@erp.com', '$2b$10$rQZ8KxL.VcQhX7gF7XkJ8.F8k8Gz1P0J8h5C2wQ9xJ4L6m8N0q2S', NULL, 'dept-management', true, NOW()),
('user-sales1', 'Neha Sharma', 'neha@erp.com', '$2b$10$rQZ8KxL.VcQhX7gF7XkJ8.F8k8Gz1P0J8h5C2wQ9xJ4L6m8N0q2S', '+91 98765 43210', 'dept-sales', true, NOW()),
('user-sales2', 'Rahul Verma', 'rahul@erp.com', '$2b$10$rQZ8KxL.VcQhX7gF7XkJ8.F8k8Gz1P0J8h5C2wQ9xJ4L6m8N0q2S', '+91 98765 43211', 'dept-sales', true, NOW()),
('user-purchase1', 'Priya Patel', 'priya@erp.com', '$2b$10$rQZ8KxL.VcQhX7gF7XkJ8.F8k8Gz1P0J8h5C2wQ9xJ4L6m8N0q2S', '+91 98765 43212', 'dept-purchase', true, NOW()),
('user-purchase2', 'Amit Singh', 'amit@erp.com', '$2b$10$rQZ8KxL.VcQhX7gF7XkJ8.F8k8Gz1P0J8h5C2wQ9xJ4L6m8N0q2S', '+91 98765 43213', 'dept-purchase', true, NOW()),
('user-costing1', 'Sneha Gupta', 'sneha@erp.com', '$2b$10$rQZ8KxL.VcQhX7gF7XkJ8.F8k8Gz1P0J8h5C2wQ9xJ4L6m8N0q2S', '+91 98765 43214', 'dept-costing', true, NOW()),
('user-manager1', 'Vikram Malhotra', 'vikram@erp.com', '$2b$10$rQZ8KxL.VcQhX7gF7XkJ8.F8k8Gz1P0J8h5C2wQ9xJ4L6m8N0q2S', '+91 98765 43215', 'dept-management', true, NOW());

-- NOTE: Password for all users is 'admin123' (hashed with bcrypt)

-- ================================================
-- 6. USER ROLES
-- ================================================
INSERT INTO user_roles (user_id, role_id)
VALUES
('user-admin', 'role-admin'),
('user-sales1', 'role-sales'),
('user-sales2', 'role-sales-mgr'),
('user-purchase1', 'role-purchase'),
('user-purchase2', 'role-purchase-mgr'),
('user-costing1', 'role-costing-mgr'),
('user-manager1', 'role-mgmt');

-- ================================================
-- 7. ZONES
-- ================================================
INSERT INTO zones (zone_id, zone_name, zone_code, is_active, created_at)
VALUES
('zone-usa', 'United States', 'USA', true, NOW()),
('zone-uk', 'United Kingdom', 'UK', true, NOW()),
('zone-dom', 'Domestic', 'DOM', true, NOW()),
('zone-eu', 'European Union', 'EU', true, NOW()),
('zone-asia', 'Asia Pacific', 'ASIA', true, NOW());

-- ================================================
-- 8. LOCATIONS
-- ================================================
INSERT INTO locations (location_id, location_name, location_code, city, state, country, is_active, created_at)
VALUES
('loc-delhi', 'Delhi Warehouse', 'DEL', 'New Delhi', 'Delhi', 'India', true, NOW()),
('loc-mumbai', 'Mumbai Warehouse', 'MUM', 'Mumbai', 'Maharashtra', 'India', true, NOW()),
('loc-bangalore', 'Bangalore Office', 'BLR', 'Bangalore', 'Karnataka', 'India', true, NOW()),
('loc-chennai', 'Chennai Office', 'CHN', 'Chennai', 'Tamil Nadu', 'India', true, NOW());

-- ================================================
-- 9. PAYMENT TERMS
-- ================================================
INSERT INTO payment_terms (payment_terms_id, terms_name, terms_code, days, description, is_active, created_at)
VALUES
('pt-immediate', 'Immediate', 'IMMEDIATE', 0, 'Payment immediately', true, NOW()),
('pt-15days', '15 Days', 'NET15', 15, 'Net 15 days', true, NOW()),
('pt-30days', '30 Days', 'NET30', 30, 'Net 30 days', true, NOW()),
('pt-45days', '45 Days', 'NET45', 45, 'Net 45 days', true, NOW()),
('pt-60days', '60 Days', 'NET60', 60, 'Net 60 days', true, NOW()),
('pt-90days', '90 Days', 'NET90', 90, 'Net 90 days', true, NOW());

-- ================================================
-- 10. CURRENCIES
-- ================================================
INSERT INTO currencies (currency_id, currency_name, currency_code, currency_symbol, is_active, created_at)
VALUES
('curr-inr', 'Indian Rupee', 'INR', '₹', true, NOW()),
('curr-usd', 'US Dollar', 'USD', '$', true, NOW()),
('curr-gbp', 'British Pound', 'GBP', '£', true, NOW()),
('curr-eur', 'Euro', 'EUR', '€', true, NOW()),
('curr-cad', 'Canadian Dollar', 'CAD', 'C$', true, NOW()),
('curr-aud', 'Australian Dollar', 'AUD', 'A$', true, NOW());

-- ================================================
-- 11. UOM
-- ================================================
INSERT INTO uom (uom_id, uom_name, uom_code, description, is_active, created_at)
VALUES
('uom-pcs', 'Pieces', 'PCS', 'Individual pieces', true, NOW()),
('uom-box', 'Box', 'BOX', 'Box packaging', true, NOW()),
('uom-carton', 'Carton', 'CTN', 'Carton packaging', true, NOW()),
('uom-kg', 'Kilogram', 'KG', 'Weight in kilograms', true, NOW()),
('uom-meter', 'Meter', 'MTR', 'Length in meters', true, NOW()),
('uom-liter', 'Liter', 'LTR', 'Volume in liters', true, NOW()),
('uom-set', 'Set', 'SET', 'Complete set', true, NOW());

-- ================================================
-- 12. GST RATES
-- ================================================
INSERT INTO gst_rates (gst_rate_id, rate_name, percentage, description, is_active, created_at)
VALUES
('gst-0', 'Exempt', 0, 'Zero rated/exempt', true, NOW()),
('gst-5', '5% GST', 5, '5% GST', true, NOW()),
('gst-12', '12% GST', 12, '12% GST', true, NOW()),
('gst-18', '18% GST', 18, '18% GST', true, NOW()),
('gst-28', '28% GST', 28, '28% GST', true, NOW());

-- ================================================
-- 13. PRODUCT CATEGORIES
-- ================================================
INSERT INTO product_categories (category_id, category_name, category_code, description, is_active, created_at)
VALUES
('cat-brd', 'Bird Products', 'BRD', 'Bird care and accessories', true, NOW()),
('cat-kri', 'Krishna Products', 'KRI', 'Krishna brand products', true, NOW()),
('cat-sna', 'Snake Products', 'SNA', 'Snake care and accessories', true, NOW()),
('cat-bvr', 'Beaver Products', 'BVR', 'Beaver products', true, NOW());

-- ================================================
-- 14. SEGMENTS
-- ================================================
INSERT INTO segments (segment_id, segment_name, segment_code, description, is_active, created_at)
VALUES
('seg-ss', 'Standard Series', 'SS', 'Standard product series', true, NOW()),
('seg-bb', 'Baby Series', 'BB', 'Baby/juvenile series', true, NOW()),
('seg-rb', 'Royal Series', 'RB', 'Royal/premium series', true, NOW()),
('seg-ff', 'Free Fall Series', 'FF', 'Free fall series', true, NOW());

-- ================================================
-- 15. COMPONENT GROUPS
-- ================================================
INSERT INTO component_groups (group_id, group_name, group_code, description, is_active, created_at)
VALUES
('grp-grp', 'General', 'GRP', 'General components', true, NOW()),
('grp-org', 'Organic', 'ORG', 'Organic components', true, NOW()),
('grp-syn', 'Synthetic', 'SYN', 'Synthetic components', true, NOW()),
('grp-nat', 'Natural', 'NAT', 'Natural components', true, NOW());

-- ================================================
-- 16. BRANDS
-- ================================================
INSERT INTO brands (brand_id, brand_name, brand_code, description, is_active, created_at)
VALUES
('brand-premium', 'Premium', 'PREMIUM', 'Premium quality brand', true, NOW()),
('brand-economy', 'Economy', 'ECON', 'Economy range', true, NOW()),
('brand-standard', 'Standard', 'STD', 'Standard quality', true, NOW()),
('brand-organic', 'Organic', 'ORG', 'Organic certified', true, NOW());

-- ================================================
-- 17. PORTS
-- ================================================
INSERT INTO ports (port_id, port_name, port_code, city, country, is_active, created_at)
VALUES
('port-mumbai', 'Jawaharlal Nehru Port', 'JNPT', 'Mumbai', 'India', true, NOW()),
('port-chennai', 'Chennai Port', 'CHNPT', 'Chennai', 'India', true, NOW()),
('port-kolkata', 'Kolkata Port', 'KOLPT', 'Kolkata', 'India', true, NOW()),
('port-delhi', 'Delhi ICD', 'DELICD', 'Delhi', 'India', true, NOW());

-- ================================================
-- 18. NUMBER SERIES
-- ================================================
INSERT INTO number_series (series_id, series_code, series_name, prefix, suffix, current_no, padding_digit, year_wise, is_active, created_at)
VALUES
('ns-enquiry', 'ENQUIRY', 'Enquiry Number', 'ENQ', NULL, 0, 4, true, true, NOW()),
('ns-customer', 'CUSTOMER', 'Customer Code', NULL, NULL, 0, 6, false, true, NOW()),
('ns-vendor', 'VENDOR', 'Vendor Code', 'VND', NULL, 0, 5, false, true, NOW()),
('ns-purchase', 'PURCHASE_QUOTE', 'Purchase Quote', 'PUR', NULL, 0, 4, true, true, NOW()),
('ns-rate', 'PRICE_ANALYSIS', 'Price Analysis', 'PA', NULL, 0, 4, true, true, NOW()),
('ns-product', 'PRODUCT', 'Product SKU', NULL, NULL, 0, 3, false, true, NOW());

-- ================================================
-- 19. SAMPLE CUSTOMERS
-- ================================================
INSERT INTO customers (customer_id, buyer_code, customer_name, email, phone, zone, billing_city, billing_country, gst_number, is_active, created_at)
VALUES
('cust-001', 'USA-000001', 'Pet Supplies Inc', 'petsupplies@email.com', '+1 555 123 4567', 'USA', 'New York', 'USA', 'US123456789', true, NOW()),
('cust-002', 'USA-000002', 'Animal Kingdom LLC', 'info@animalkingdom.com', '+1 555 234 5678', 'USA', 'Los Angeles', 'USA', 'US987654321', true, NOW()),
('cust-003', 'UK-000001', 'British Pets Ltd', 'sales@britishpets.co.uk', '+44 20 1234 5678', 'UK', 'London', 'UK', 'GB123456789', true, NOW()),
('cust-004', 'DOM-000001', 'Indian Pet Shop', 'indpetshop@email.in', '+91 98765 11111', 'DOM', 'Mumbai', 'India', '27ABCDE1234F1Z5', true, NOW()),
('cust-005', 'DOM-000002', 'Delhi Pet Mart', 'delhipetmart@email.in', '+91 98765 22222', 'DOM', 'Delhi', 'India', '07ABCDE1234F1Z5', true, NOW()),
('cust-006', 'EU-000001', 'European Pet Distributors', 'info@eupetdist.eu', '+31 20 123 4567', 'EU', 'Amsterdam', 'Netherlands', 'NL123456789B01', true, NOW());

-- ================================================
-- 20. SAMPLE VENDORS
-- ================================================
INSERT INTO vendors (vendor_id, vendor_code, vendor_name, email, phone, city, country, gst_number, is_active, created_at)
VALUES
('vend-001', 'VND-00001', 'China Export Co', 'sales@chinaexport.cn', '+86 21 1234 5678', 'Shanghai', 'China', 'CN123456789', true, NOW()),
('vend-002', 'VND-00002', 'Taiwan Manufacturing', 'orders@taiwanmfg.tw', '+886 2 1234 5678', 'Taipei', 'Taiwan', 'TW123456789', true, NOW()),
('vend-003', 'VND-00003', 'Mumbai Suppliers', 'info@mumbaisuppliers.in', '+91 22 1234 5678', 'Mumbai', 'India', '27ABCD1234E1Z5', true, NOW()),
('vend-004', 'VND-00004', 'Delhi Wholesale', 'orders@delhiwholesale.in', '+91 11 1234 5678', 'Delhi', 'India', '07ABCD1234E1Z5', true, NOW()),
('vend-005', 'VND-00005', 'UK Components Ltd', 'sales@ukcomponents.co.uk', '+44 20 1234 5678', 'Manchester', 'UK', 'GB987654321', true, NOW());

-- ================================================
-- 21. SAMPLE PRODUCTS
-- ================================================
INSERT INTO products (product_id, sku, product_name, category_id, segment_id, group_id, uom_id, gst_rate_id, standard_cost, is_active, created_at)
VALUES
('prod-001', 'BRD-SS-GRP-001', 'Premium Bird Cage Medium', 'cat-brd', 'seg-ss', 'grp-grp', 'uom-pcs', 'gst-18', 2500.00, true, NOW()),
('prod-002', 'BRD-SS-GRP-002', 'Bird Food Premium 5kg', 'cat-brd', 'seg-ss', 'grp-grp', 'uom-kg', 'gst-5', 850.00, true, NOW()),
('prod-003', 'BRD-BB-GRP-001', 'Baby Bird Feeder Small', 'cat-brd', 'seg-bb', 'grp-grp', 'uom-pcs', 'gst-18', 450.00, true, NOW()),
('prod-004', 'BRD-RB-ORG-001', 'Royal Organic Bird Seed 10kg', 'cat-brd', 'seg-rb', 'grp-org', 'uom-kg', 'gst-5', 1200.00, true, NOW()),
('prod-005', 'KRI-SS-GRP-001', 'Krishna Brass Idol 6inch', 'cat-kri', 'seg-ss', 'grp-grp', 'uom-pcs', 'gst-12', 3500.00, true, NOW()),
('prod-006', 'KRI-RB-NAT-001', 'Royal Brass Temple Bell', 'cat-kri', 'seg-rb', 'grp-nat', 'uom-pcs', 'gst-12', 5500.00, true, NOW()),
('prod-007', 'SNA-SS-GRP-001', 'Snake Hook Standard', 'cat-sna', 'seg-ss', 'grp-grp', 'uom-pcs', 'gst-18', 1200.00, true, NOW()),
('prod-008', 'BVR-SS-SYN-001', 'Beaver Synthetic Liner', 'cat-bvr', 'seg-ss', 'grp-syn', 'uom-meter', 'gst-18', 800.00, true, NOW());

-- ================================================
-- 22. CURRENCY RATES
-- ================================================
INSERT INTO currency_rates (rate_id, currency_id, rate, effective_date, is_active, created_at)
VALUES
('cr-inr-1', 'curr-inr', 1.00, '2026-01-01', true, NOW()),
('cr-usd-1', 'curr-usd', 83.50, '2026-01-01', true, NOW()),
('cr-gbp-1', 'curr-gbp', 105.20, '2026-01-01', true, NOW()),
('cr-eur-1', 'curr-eur', 90.75, '2026-01-01', true, NOW()),
('cr-cad-1', 'curr-cad', 61.50, '2026-01-01', true, NOW()),
('cr-aud-1', 'curr-aud', 54.80, '2026-01-01', true, NOW());

-- ================================================
-- 23. HAULAGE RATES
-- ================================================
INSERT INTO haulage (haulage_id, location_id, haulage_type, rate, currency_id, is_active, created_at)
VALUES
('haul-delhi-1', 'loc-delhi', 'Import', 185000.00, 'curr-inr', true, NOW()),
('haul-mumbai-1', 'loc-mumbai', 'Import', 85000.00, 'curr-inr', true, NOW()),
('haul-delhi-2', 'loc-delhi', 'Export', 95000.00, 'curr-inr', true, NOW()),
('haul-mumbai-2', 'loc-mumbai', 'Export', 65000.00, 'curr-inr', true, NOW());

-- ================================================
-- 24. FREIGHT RATES
-- ================================================
INSERT INTO freight (freight_id, port_id, freight_type, rate_per_cbm, currency_id, is_active, created_at)
VALUES
('frt-jnpt-1', 'port-mumbai', 'Sea Freight', 8500.00, 'curr-inr', true, NOW()),
('frt-chnpt-1', 'port-chennai', 'Sea Freight', 9200.00, 'curr-inr', true, NOW()),
('frt-kolpt-1', 'port-kolkata', 'Sea Freight', 7800.00, 'curr-inr', true, NOW());

-- ================================================
-- 25. SAMPLE SALES ENQUIRY
-- ================================================
INSERT INTO sales_enquiry_orders (enquiry_order_id, enquiry_number, customer_id, status, remarks, created_by, created_at)
VALUES
('enq-001', 'ENQ-NEH-2026-0001', 'cust-004', 'draft', 'Initial enquiry from Indian customer', 'user-sales1', NOW()),
('enq-002', 'ENQ-RAH-2026-0001', 'cust-001', 'submitted', 'US customer order', 'user-sales2', NOW()),
('enq-003', 'ENQ-NEH-2026-0002', 'cust-003', 'purchase_pending', 'UK customer - awaiting vendor quotes', 'user-sales1', NOW());

-- ================================================
-- 26. SAMPLE ENQUIRY ITEMS
-- ================================================
INSERT INTO sales_enquiry_order_items (item_id, enquiry_order_id, product_id, sku, product_name, quantity, expected_rate, created_at)
VALUES
('enqi-001', 'enq-001', 'prod-001', 'BRD-SS-GRP-001', 'Premium Bird Cage Medium', 50, 2800.00, NOW()),
('enqi-002', 'enq-001', 'prod-002', 'BRD-SS-GRP-002', 'Bird Food Premium 5kg', 100, 900.00, NOW()),
('enqi-003', 'enq-002', 'prod-005', 'KRI-SS-GRP-001', 'Krishna Brass Idol 6inch', 25, 3800.00, NOW()),
('enqi-004', 'enq-003', 'prod-006', 'KRI-RB-NAT-001', 'Royal Brass Temple Bell', 30, 5800.00, NOW());

-- ================================================
-- 27. FMS TASKS
-- ================================================
INSERT INTO fms_tasks (task_id, unique_key, enquiry_order_id, enquiry_order_no, sku, product_name, assigned_to, step_code, step_name, status, sla_deadline, created_at)
VALUES
('fms-001', 'RATEFMS-ENQ-NEH-2026-0001-BRD-SS-GRP-001-NEH-ACT01', 'enq-001', 'ENQ-NEH-2026-0001', 'BRD-SS-GRP-001', 'Premium Bird Cage Medium', 'user-costing1', 'ACT01', 'Rate Analysis', 'pending', NOW() + INTERVAL '2 days', NOW()),
('fms-002', 'RATEFMS-ENQ-RAH-2026-0001-KRI-SS-GRP-001-RAH-ACT01', 'enq-002', 'ENQ-RAH-2026-0001', 'KRI-SS-GRP-001', 'Krishna Brass Idol 6inch', 'user-costing1', 'ACT01', 'Rate Analysis', 'in_progress', NOW() + INTERVAL '1 day', NOW());

-- ================================================
-- PRINT SUMMARY
-- ================================================
SELECT 'Database seeded successfully!' AS status;
SELECT 'Admin login: admin@erp.com / admin123' AS credentials;
