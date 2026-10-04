-- Simple Currency Rates Seed (no ON CONFLICT)

-- Delete existing currency rates
DELETE FROM currency_rate_master WHERE currency_code IN ('USD', 'GBP', 'EUR', 'AED', 'SGD', 'AUD', 'INR');

-- Insert currency rates
INSERT INTO currency_rate_master (rate_id, company_id, currency_code, currency_name, rate, rate_date, source, is_active, created_at, updated_at)
VALUES
    (gen_random_uuid(), NULL, 'USD', 'US Dollar', 83.50, CURRENT_DATE, 'MANUAL', true, NOW(), NOW()),
    (gen_random_uuid(), NULL, 'GBP', 'British Pound', 105.25, CURRENT_DATE, 'MANUAL', true, NOW(), NOW()),
    (gen_random_uuid(), NULL, 'EUR', 'Euro', 90.75, CURRENT_DATE, 'MANUAL', true, NOW(), NOW()),
    (gen_random_uuid(), NULL, 'AED', 'UAE Dirham', 22.75, CURRENT_DATE, 'MANUAL', true, NOW(), NOW()),
    (gen_random_uuid(), NULL, 'SGD', 'Singapore Dollar', 62.00, CURRENT_DATE, 'MANUAL', true, NOW(), NOW()),
    (gen_random_uuid(), NULL, 'AUD', 'Australian Dollar', 55.50, CURRENT_DATE, 'MANUAL', true, NOW(), NOW()),
    (gen_random_uuid(), NULL, 'INR', 'Indian Rupee', 1.00, CURRENT_DATE, 'BASE', true, NOW(), NOW());

-- Verify
SELECT currency_code, currency_name, rate, source FROM currency_rate_master ORDER BY currency_code;
