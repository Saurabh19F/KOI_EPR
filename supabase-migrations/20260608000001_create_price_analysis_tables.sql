-- =========================================
-- PRICE ANALYSIS MODULE - DATABASE MIGRATION
-- =========================================
-- This migration adds supporting tables for Price Analysis if they don't exist

-- 1. Check if tables exist and create if needed

-- AUDIT LOGS TABLE (if not exists)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    performed_by UUID,
    performed_by_name VARCHAR(100),
    performed_role VARCHAR(50),
    ip_address VARCHAR(50),
    user_agent TEXT,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- WORKFLOW LOGS TABLE (if not exists)
CREATE TABLE IF NOT EXISTS workflow_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID,
    enquiry_id UUID,
    rate_calculation_id UUID,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50),
    performed_by UUID,
    performed_by_name VARCHAR(100),
    performed_role VARCHAR(50),
    remarks TEXT,
    is_auto BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- INDEXES
-- =========================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed ON audit_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_workflow_logs_enquiry ON workflow_logs(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_calculation ON workflow_logs(rate_calculation_id);

-- =========================================
-- DEFAULT DATA: CURRENCY RATES (if not exists)
-- =========================================

INSERT INTO currency_rates (currency_code, currency_name, rate, effective_from, is_active)
SELECT 'USD', 'US Dollar', 90.75, CURRENT_DATE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM currency_rates WHERE currency_code = 'USD');

INSERT INTO currency_rates (currency_code, currency_name, rate, effective_from, is_active)
SELECT 'EUR', 'Euro', 105.75, CURRENT_DATE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM currency_rates WHERE currency_code = 'EUR');

INSERT INTO currency_rates (currency_code, currency_name, rate, effective_from, is_active)
SELECT 'GBP', 'British Pound', 127.25, CURRENT_DATE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM currency_rates WHERE currency_code = 'GBP');

INSERT INTO currency_rates (currency_code, currency_name, rate, effective_from, is_active)
SELECT 'CAD', 'Canadian Dollar', 60.75, CURRENT_DATE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM currency_rates WHERE currency_code = 'CAD');

INSERT INTO currency_rates (currency_code, currency_name, rate, effective_from, is_active)
SELECT 'AUD', 'Australian Dollar', 61.50, CURRENT_DATE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM currency_rates WHERE currency_code = 'AUD');

-- =========================================
-- DEFAULT DATA: HAULAGE RATES (if not exists)
-- =========================================

INSERT INTO haulage_rates (location, location_code, country, rate_per_cbm, effective_from, is_default, is_active, container_type)
SELECT 'DELHI', 'DEL', 'India', 185000, CURRENT_DATE, TRUE, TRUE, '40FT'
WHERE NOT EXISTS (SELECT 1 FROM haulage_rates WHERE location = 'DELHI');

INSERT INTO haulage_rates (location, location_code, country, rate_per_cbm, effective_from, is_default, is_active, container_type)
SELECT 'MUMBAI', 'MUM', 'India', 85000, CURRENT_DATE, FALSE, TRUE, '40FT'
WHERE NOT EXISTS (SELECT 1 FROM haulage_rates WHERE location = 'MUMBAI');

-- =========================================
-- NOTES
-- =========================================
-- The main price_analysis_master and price_analysis_items tables should already exist.
-- This migration adds audit/supporting tables and default data.
--
-- Key tables already in place:
-- - price_analysis_master (main analysis records)
-- - price_analysis_items (line items)
-- - currency_rates (currency exchange rates)
-- - haulage_rates (haulage costs by location)
-- - final_currency_rate_master (final currency conversion)
-- - freight_master (freight rates)
