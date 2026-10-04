-- Check admin user
SELECT
    u.email,
    u.name,
    u.user_id,
    r.role_code,
    r.role_id
FROM users u
LEFT JOIN roles r ON u.role_id = r.role_id
WHERE u.email = 'admin@erp.com';

-- Check all users with their role
SELECT
    u.email,
    u.name,
    r.role_code
FROM users u
JOIN roles r ON u.role_id = r.role_id
ORDER BY r.level;
