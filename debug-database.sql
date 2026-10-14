-- Database Structure Check - Run in Neon SQL Editor

-- 1. Check all tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- 2. Check users table structure
SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;

-- 3. Check permissions table
SELECT * FROM permissions LIMIT 5;

-- 4. Check roles table
SELECT * FROM roles LIMIT 5;

-- 5. Check role_permissions count
SELECT COUNT(*) as count FROM role_permissions;

-- 6. Check product_categories
SELECT * FROM product_categories LIMIT 5;

-- 7. Check currency_rate_master
SELECT * FROM currency_rate_master LIMIT 5;

-- 8. Check sales_enquiry table if exists
SELECT column_name FROM information_schema.columns WHERE table_name = 'sales_enquiries' ORDER BY ordinal_position;

-- 9. Check what columns are in sales_enquiry_items if exists
SELECT column_name FROM information_schema.columns WHERE table_name = 'sales_enquiry_items' ORDER BY ordinal_position;

-- 10. Check customers table
SELECT * FROM customers LIMIT 5;
