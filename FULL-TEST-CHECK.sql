-- ============================================
-- FULL TESTING SQL - Run in Neon SQL Editor
-- ============================================

-- 1. Check Users
SELECT '1. USERS' as test;
SELECT u.email, u.name, u.is_super_admin, r.role_code, r.role_name
FROM users u
JOIN roles r ON u.role_id = r.role_id;

-- 2. Check Roles
SELECT '2. ROLES' as test;
SELECT role_code, role_name, level FROM roles ORDER BY level;

-- 3. Check Permissions Count
SELECT '3. PERMISSIONS COUNT' as test;
SELECT r.role_code, COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
GROUP BY r.role_code
ORDER BY r.level;

-- 4. Check Sample Permissions for ADMIN
SELECT '4. ADMIN PERMISSIONS (sample)' as test;
SELECT p.permission_code, p.permission_name, p.action
FROM permissions p
INNER JOIN role_permissions rp ON p.permission_id = rp.permission_id
INNER JOIN roles r ON rp.role_id = r.role_id
WHERE r.role_code = 'ADMIN'
LIMIT 10;

-- 5. Check Currency Rates
SELECT '5. CURRENCY RATES' as test;
SELECT currency_code, currency_name, rate FROM currency_rate_master WHERE is_active = true ORDER BY currency_code;

-- 6. Check Product Categories
SELECT '6. PRODUCT CATEGORIES' as test;
SELECT category_code, category_name FROM product_categories WHERE is_active = true;

-- 7. Check Customers
SELECT '7. CUSTOMERS' as test;
SELECT buyer_code, customer_name, zone FROM customers WHERE is_active = true LIMIT 5;

-- 8. Check Vendors
SELECT '8. VENDORS' as test;
SELECT vendor_code, vendor_name FROM vendors WHERE is_active = true LIMIT 5;

-- 9. Check Zones
SELECT '9. ZONES' as test;
SELECT zone_code, zone_name FROM zones WHERE is_active = true;

-- 10. Check Segments
SELECT '10. SEGMENTS' as test;
SELECT segment_code, segment_name FROM segments WHERE is_active = true;

-- ============================================
-- TEST RESULT SUMMARY
-- ============================================

SELECT '=== TEST SUMMARY ===' as result;

-- Count all data
SELECT 'Users:' as item, COUNT(*) as count FROM users
UNION ALL SELECT 'Roles:', COUNT(*) FROM roles
UNION ALL SELECT 'Permissions:', COUNT(*) FROM permissions
UNION ALL SELECT 'Role-Permission links:', COUNT(*) FROM role_permissions
UNION ALL SELECT 'Currency Rates:', COUNT(*) FROM currency_rate_master WHERE is_active = true
UNION ALL SELECT 'Categories:', COUNT(*) FROM product_categories WHERE is_active = true
UNION ALL SELECT 'Customers:', COUNT(*) FROM customers WHERE is_active = true
UNION ALL SELECT 'Vendors:', COUNT(*) FROM vendors WHERE is_active = true;
