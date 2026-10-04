-- Check database structure for API matching

-- 1. Check all tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Check users table
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'users';

-- 3. Check roles table
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'roles';

-- 4. Check permissions table
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'permissions';

-- 5. Check role_permissions table
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'role_permissions';

-- 6. Check currency_rate_master table
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'currency_rate_master';

-- 7. Check sales_enquiry_orders table
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'sales_enquiry_orders';

-- 8. Check sales_enquiry_order_items table
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'sales_enquiry_order_items';

-- 9. Check purchase_quotes table
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'purchase_quotes';

-- 10. Check fms_tasks table
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'fms_tasks';

-- 11. Check price_analysis_master table
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'price_analysis_master';

-- 12. Check final_currency_rate_master table
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'final_currency_rate_master';

-- 13. Current Users
SELECT u.email, u.name, r.role_code
FROM users u
JOIN roles r ON u.role_id = r.role_id;

-- 14. Current Permissions by Role
SELECT r.role_code, COUNT(rp.permission_id) as cnt
FROM roles r
LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
GROUP BY r.role_code;

-- 15. Check product_categories table
SELECT column_name FROM information_schema.columns WHERE table_name = 'product_categories';

-- 16. Check segments table
SELECT column_name FROM information_schema.columns WHERE table_name = 'segments';

-- 17. Check brands table
SELECT column_name FROM information_schema.columns WHERE table_name = 'brands';
