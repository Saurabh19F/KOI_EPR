-- Check admin user and all users with roles
SELECT
    u.email,
    u.name,
    u.user_id,
    r.role_code as role
FROM users u
LEFT JOIN roles r ON u.role_id = r.role_id
ORDER BY r.level NULLS LAST;

-- Check which user is which
SELECT email, name, user_id FROM users;
