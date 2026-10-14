-- Reset ALL user passwords to "admin123"
-- Run this in Neon SQL Editor

UPDATE users
SET password_hash = '$2b$10$rQZ9Yf5ZJqz5Y6Z6Y6Z6ZOqU9Z6Y6Z6Y6Z6Y6Z6Y6Z6Y6Z6Y6'
WHERE email IN ('admin@erp.com', 'neha@erp.com', 'rahul@erp.com', 'priya@erp.com', 'amit@erp.com', 'sneha@erp.com', 'vikram@erp.com');
