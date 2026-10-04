-- ================================================
-- Platform SaaS Tables - Database Schema
-- Run this script to create all SaaS platform tables
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 1. SUBSCRIPTION PLANS
-- ================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    plan_type VARCHAR(50) DEFAULT 'starter',
    default_billing_cycle VARCHAR(20) DEFAULT 'monthly',
    
    -- Pricing
    monthly_price_inr DECIMAL(10,2) DEFAULT 0,
    yearly_price_inr DECIMAL(10,2) DEFAULT 0,
    monthly_price_usd DECIMAL(10,2) DEFAULT 0,
    yearly_price_usd DECIMAL(10,2) DEFAULT 0,
    
    -- Limits
    user_limit INT DEFAULT 5,
    storage_limit_mb INT DEFAULT 1000,
    api_limit_per_month INT DEFAULT 10000,
    email_limit_per_month INT DEFAULT 1000,
    document_limit_per_month INT DEFAULT 100,
    
    -- Trial
    trial_days INT DEFAULT 14,
    trial_enabled BOOLEAN DEFAULT true,
    
    -- Features (boolean flags)
    sales_enquiry_enabled BOOLEAN DEFAULT true,
    purchase_quote_enabled BOOLEAN DEFAULT true,
    price_analysis_enabled BOOLEAN DEFAULT true,
    rate_fms_enabled BOOLEAN DEFAULT true,
    inventory_enabled BOOLEAN DEFAULT false,
    production_enabled BOOLEAN DEFAULT false,
    finance_enabled BOOLEAN DEFAULT false,
    dashboard_enabled BOOLEAN DEFAULT true,
    reports_enabled BOOLEAN DEFAULT true,
    api_access_enabled BOOLEAN DEFAULT false,
    webhook_enabled BOOLEAN DEFAULT false,
    custom_domain_enabled BOOLEAN DEFAULT false,
    white_label_enabled BOOLEAN DEFAULT false,
    sandbox_enabled BOOLEAN DEFAULT false,
    multi_branch_enabled BOOLEAN DEFAULT false,
    multi_currency_enabled BOOLEAN DEFAULT false,
    advanced_analytics_enabled BOOLEAN DEFAULT false,
    ai_assistant_enabled BOOLEAN DEFAULT false,
    
    -- Support SLA
    support_sla VARCHAR(50) DEFAULT 'email',
    support_response_hours INT DEFAULT 24,
    
    -- Metadata
    sort_order INT DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    stripe_price_id_monthly VARCHAR(255),
    stripe_price_id_yearly VARCHAR(255),
    metadata JSONB,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 2. FEATURES
-- ================================================
CREATE TABLE IF NOT EXISTS features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feature_code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    icon VARCHAR(100),
    help_url VARCHAR(500),
    sort_order INT DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 3. PLAN FEATURES (Junction)
-- ================================================
CREATE TABLE IF NOT EXISTS plan_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT true,
    max_limit INT,
    soft_limit INT,
    hard_limit INT,
    limit_unit VARCHAR(50),
    metadata JSONB,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(plan_id, feature_id)
);

-- ================================================
-- 4. SUBSCRIPTIONS
-- ================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    plan_id UUID REFERENCES subscription_plans(id),
    status VARCHAR(50) DEFAULT 'trialing',
    billing_cycle VARCHAR(20) DEFAULT 'monthly',
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    trial_start TIMESTAMP,
    trial_end TIMESTAMP,
    trial_converted BOOLEAN DEFAULT false,
    total_amount DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'INR',
    coupon_id UUID,
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    stripe_price_id VARCHAR(255),
    payment_method_id VARCHAR(255),
    card_last4 VARCHAR(4),
    card_brand VARCHAR(50),
    auto_renew BOOLEAN DEFAULT true,
    cancelled_at TIMESTAMP,
    cancelled_by UUID,
    cancel_reason TEXT,
    cancelled_immediately BOOLEAN DEFAULT false,
    paused_at TIMESTAMP,
    paused_by UUID,
    resume_at TIMESTAMP,
    failed_payment_attempts INT DEFAULT 0,
    next_retry_at TIMESTAMP,
    metadata JSONB,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 5. TRIAL HISTORY
-- ================================================
CREATE TABLE IF NOT EXISTS trial_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    event VARCHAR(50) NOT NULL,
    previous_trial_end TIMESTAMP,
    new_trial_end TIMESTAMP,
    extended_days INT,
    reminder_number INT,
    reason TEXT,
    metadata JSONB,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 6. USAGE METRICS
-- ================================================
CREATE TABLE IF NOT EXISTS usage_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    count BIGINT DEFAULT 0,
    prev_month_count BIGINT DEFAULT 0,
    change_percent DECIMAL(10,2) DEFAULT 0,
    metadata JSONB,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, metric_type, date)
);

-- ================================================
-- 7. COMPANY BRANDING
-- ================================================
CREATE TABLE IF NOT EXISTS company_branding (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID UNIQUE NOT NULL,
    logo_url VARCHAR(500),
    favicon_url VARCHAR(500),
    primary_color VARCHAR(20) DEFAULT '#2563EB',
    secondary_color VARCHAR(20) DEFAULT '#64748B',
    success_color VARCHAR(20) DEFAULT '#22C55E',
    warning_color VARCHAR(20) DEFAULT '#F59E0B',
    danger_color VARCHAR(20) DEFAULT '#EF4444',
    text_color VARCHAR(20) DEFAULT '#1E293B',
    background_color VARCHAR(20) DEFAULT '#F8FAFC',
    font_family VARCHAR(255),
    font_url VARCHAR(500),
    login_page_heading VARCHAR(255),
    login_page_subheading VARCHAR(255),
    login_page_background_url VARCHAR(500),
    email_header_url VARCHAR(500),
    email_footer_text TEXT,
    show_platform_branding BOOLEAN DEFAULT true,
    show_powered_by BOOLEAN DEFAULT true,
    custom_css TEXT,
    metadata JSONB,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 8. COMPANY DOMAINS
-- ================================================
CREATE TABLE IF NOT EXISTS company_domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    domain_type VARCHAR(50) DEFAULT 'custom',
    verification_status VARCHAR(50) DEFAULT 'pending',
    verification_token VARCHAR(255),
    verification_method VARCHAR(50),
    verified_at TIMESTAMP,
    dns_records JSONB,
    is_ssl_enabled BOOLEAN DEFAULT false,
    ssl_certificate_id VARCHAR(255),
    ssl_expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    redirect_to VARCHAR(500),
    metadata JSONB,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 9. COMPANY CONTACTS
-- ================================================
CREATE TABLE IF NOT EXISTS company_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    contact_type VARCHAR(50) DEFAULT 'primary',
    name VARCHAR(255) NOT NULL,
    designation VARCHAR(100),
    department VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    mobile VARCHAR(50),
    fax VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 10. COMPANY SETTINGS
-- ================================================
CREATE TABLE IF NOT EXISTS company_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID UNIQUE NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    currency VARCHAR(10) DEFAULT 'INR',
    locale VARCHAR(10) DEFAULT 'en-IN',
    date_format VARCHAR(50) DEFAULT 'DD/MM/YYYY',
    time_format VARCHAR(50) DEFAULT 'hh:mm A',
    thousands_separator VARCHAR(5) DEFAULT ',',
    decimal_separator VARCHAR(5) DEFAULT '.',
    auto_number_enquiry BOOLEAN DEFAULT true,
    auto_number_quote BOOLEAN DEFAULT true,
    auto_number_invoice BOOLEAN DEFAULT true,
    enquiry_prefix_length INT DEFAULT 4,
    quote_prefix_length INT DEFAULT 4,
    email_notifications_enabled BOOLEAN DEFAULT true,
    email_from_name VARCHAR(255),
    email_from_address VARCHAR(255),
    email_reply_to VARCHAR(255),
    email_reminder_enabled BOOLEAN DEFAULT true,
    email_reminder_days INT DEFAULT 3,
    whatsapp_enabled BOOLEAN DEFAULT false,
    whatsapp_api_key VARCHAR(255),
    whatsapp_template_id VARCHAR(255),
    sms_enabled BOOLEAN DEFAULT false,
    sms_api_key VARCHAR(255),
    sms_sender_id VARCHAR(50),
    default_gst_percent INT DEFAULT 18,
    tds_enabled BOOLEAN DEFAULT false,
    default_tds_percent INT DEFAULT 10,
    inventory_enabled BOOLEAN DEFAULT false,
    default_reorder_level INT DEFAULT 0,
    negative_stock_allowed BOOLEAN DEFAULT true,
    auto_approval_enabled BOOLEAN DEFAULT false,
    auto_approval_limit DECIMAL(15,2) DEFAULT 100000,
    task_sla_hours INT DEFAULT 24,
    finance_enabled BOOLEAN DEFAULT false,
    bank_name VARCHAR(255),
    bank_account_no VARCHAR(100),
    bank_ifsc VARCHAR(50),
    show_powered_by BOOLEAN DEFAULT true,
    show_watermark BOOLEAN DEFAULT true,
    mfa_enabled BOOLEAN DEFAULT false,
    ip_whitelist_enabled BOOLEAN DEFAULT false,
    allowed_ip_list TEXT,
    session_timeout_minutes INT DEFAULT 90,
    max_login_attempts INT DEFAULT 5,
    audit_log_retention_days INT DEFAULT 365,
    session_retention_days INT DEFAULT 90,
    metadata JSONB,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 11. ONBOARDING CHECKLISTS
-- ================================================
CREATE TABLE IF NOT EXISTS onboarding_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    step_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    completed_by UUID,
    step_data JSONB,
    step_url VARCHAR(255),
    is_required BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    metadata JSONB,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 12. PROVISIONING JOBS
-- ================================================
CREATE TABLE IF NOT EXISTS provisioning_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    job_id VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    total_tasks INT DEFAULT 0,
    completed_tasks INT DEFAULT 0,
    failed_tasks INT DEFAULT 0,
    current_task VARCHAR(255),
    completed_steps JSONB,
    failed_steps JSONB,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    retry_count INT DEFAULT 0,
    metadata JSONB,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 13. API KEYS
-- ================================================
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    key_prefix VARCHAR(20) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_last4 VARCHAR(4) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    user_id UUID,
    permissions JSONB,
    allowed_ips JSONB,
    rate_limit_per_minute INT,
    expires_at TIMESTAMP,
    last_used_at TIMESTAMP,
    total_calls BIGINT DEFAULT 0,
    revoked_at TIMESTAMP,
    revoked_by UUID,
    revoke_reason TEXT,
    metadata JSONB,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 14. WEBHOOKS
-- ================================================
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    url VARCHAR(500) NOT NULL,
    secret VARCHAR(255) NOT NULL,
    signing_algorithm VARCHAR(50) DEFAULT 'HMAC-SHA256',
    is_active BOOLEAN DEFAULT true,
    include_headers BOOLEAN DEFAULT true,
    events JSONB,
    headers JSONB,
    retry_policy JSONB,
    max_retries INT DEFAULT 3,
    timeout_ms INT DEFAULT 1000,
    user_id UUID,
    is_system BOOLEAN DEFAULT false,
    metadata JSONB,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 15. WEBHOOK LOGS
-- ================================================
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID NOT NULL,
    company_id UUID NOT NULL,
    event VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    response JSONB,
    response_status_code INT,
    status VARCHAR(50) DEFAULT 'pending',
    attempt_number INT DEFAULT 0,
    total_attempts INT DEFAULT 0,
    error_message TEXT,
    error_code VARCHAR(100),
    duration_ms DECIMAL(10,2),
    next_retry_at TIMESTAMP,
    completed_at TIMESTAMP,
    metadata JSONB,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 16. SUPPORT TICKETS
-- ================================================
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    ticket_number VARCHAR(100) UNIQUE NOT NULL,
    subject VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'other',
    priority VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'open',
    reporter_id UUID,
    reporter_name VARCHAR(255),
    reporter_email VARCHAR(255),
    assigned_to UUID,
    assigned_to_name VARCHAR(255),
    related_entity_type VARCHAR(100),
    related_entity_id UUID,
    attachments JSONB,
    internal_notes TEXT,
    resolution TEXT,
    resolved_at TIMESTAMP,
    resolved_by UUID,
    closed_at TIMESTAMP,
    closed_by UUID,
    satisfaction_rating INT,
    satisfaction_comment TEXT,
    metadata JSONB,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 17. ANNOUNCEMENTS
-- ================================================
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    target VARCHAR(50) DEFAULT 'all',
    target_plans JSONB,
    target_companies JSONB,
    is_active BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP,
    published_by UUID,
    starts_at TIMESTAMP,
    ends_at TIMESTAMP,
    show_on_dashboard BOOLEAN DEFAULT false,
    show_on_login BOOLEAN DEFAULT false,
    dismissible BOOLEAN DEFAULT true,
    sticky BOOLEAN DEFAULT false,
    action_url VARCHAR(500),
    action_label VARCHAR(100),
    sort_order INT DEFAULT 0,
    metadata JSONB,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 18. MAINTENANCE WINDOWS
-- ================================================
CREATE TABLE IF NOT EXISTS maintenance_windows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'scheduled',
    scheduled_start_at TIMESTAMP NOT NULL,
    scheduled_end_at TIMESTAMP NOT NULL,
    actual_start_at TIMESTAMP,
    actual_end_at TIMESTAMP,
    is_planned BOOLEAN DEFAULT false,
    notify_before BOOLEAN DEFAULT true,
    notify_hours_before INT DEFAULT 24,
    allow_read_only BOOLEAN DEFAULT false,
    require_maintenance BOOLEAN DEFAULT false,
    affected_services JSONB,
    affected_tenants JSONB,
    show_banner BOOLEAN DEFAULT true,
    is_recurring BOOLEAN DEFAULT false,
    recurring_pattern VARCHAR(100),
    metadata JSONB,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 19. BACKUP LOGS
-- ================================================
CREATE TABLE IF NOT EXISTS backup_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID,
    backup_id VARCHAR(100) UNIQUE NOT NULL,
    backup_name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'full',
    status VARCHAR(50) DEFAULT 'in_progress',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    size_bytes BIGINT,
    duration_seconds INT,
    storage_location VARCHAR(500),
    storage_url VARCHAR(500),
    checksum VARCHAR(255),
    is_automated BOOLEAN DEFAULT true,
    retention_until TIMESTAMP,
    is_compressed BOOLEAN DEFAULT true,
    is_encrypted BOOLEAN DEFAULT true,
    error_message TEXT,
    metadata JSONB,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 20. RESTORE LOGS
-- ================================================
CREATE TABLE IF NOT EXISTS restore_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    restore_id VARCHAR(100) UNIQUE NOT NULL,
    backup_id UUID,
    backup_log_id UUID,
    restore_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'in_progress',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_seconds INT,
    data_restored_bytes BIGINT,
    tables_restored INT,
    records_restored INT,
    is_point_in_time BOOLEAN DEFAULT false,
    point_in_time_at TIMESTAMP,
    is_sandbox BOOLEAN DEFAULT false,
    sandbox_name VARCHAR(255),
    overwrite_existing BOOLEAN DEFAULT false,
    error_message TEXT,
    metadata JSONB,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 21. PLATFORM AUDIT LOGS
-- ================================================
CREATE TABLE IF NOT EXISTS platform_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID,
    user_id UUID,
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    module VARCHAR(100),
    ip_address VARCHAR(50),
    user_agent TEXT,
    request_id VARCHAR(100),
    session_id VARCHAR(100),
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 22. LOGIN HISTORY
-- ================================================
CREATE TABLE IF NOT EXISTS login_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID,
    user_id UUID,
    user_email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'success',
    ip_address VARCHAR(50),
    user_agent TEXT,
    device_type VARCHAR(50),
    device_name VARCHAR(100),
    browser VARCHAR(100),
    browser_version VARCHAR(50),
    os VARCHAR(100),
    os_version VARCHAR(50),
    country VARCHAR(100),
    city VARCHAR(100),
    latitude VARCHAR(50),
    longitude VARCHAR(50),
    session_id VARCHAR(100),
    token_id VARCHAR(100),
    refresh_token_id VARCHAR(100),
    login_method VARCHAR(50),
    mfa_method VARCHAR(50),
    failure_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 23. SECURITY EVENTS
-- ================================================
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID,
    user_id UUID,
    user_email VARCHAR(255),
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) DEFAULT 'info',
    description TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    session_id VARCHAR(100),
    entity_type VARCHAR(100),
    entity_id UUID,
    metadata JSONB,
    resolved_at TIMESTAMP,
    resolved_by UUID,
    resolution TEXT,
    is_alert_sent BOOLEAN DEFAULT false,
    alert_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- INDEXES
-- ================================================
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_subscription_status ON companies(subscription_status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_company_id ON subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_company_date ON usage_metrics(company_id, date);
CREATE INDEX IF NOT EXISTS idx_trial_history_company ON trial_history(company_id);
CREATE INDEX IF NOT EXISTS idx_login_history_company ON login_history(company_id);
CREATE INDEX IF NOT EXISTS idx_security_events_company ON security_events(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON platform_audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_company ON api_keys(company_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_company ON webhooks(company_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook ON webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_company ON support_tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_company ON onboarding_checklists(company_id);
CREATE INDEX IF NOT EXISTS idx_provisioning_company ON provisioning_jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_backup_logs_company ON backup_logs(company_id);

-- ================================================
-- SEED DEFAULT PLANS
-- ================================================
INSERT INTO subscription_plans (plan_code, name, description, plan_type, monthly_price_inr, yearly_price_inr, user_limit, trial_days, sort_order, is_public, is_active) VALUES
('starter', 'Starter', 'Perfect for small teams getting started', 'starter', 4999, 49999, 5, 14, 1, true, true),
('growth', 'Growth', 'For growing businesses with more needs', 'growth', 9999, 99999, 20, 14, 2, true, true),
('professional', 'Professional', 'Advanced features for professional teams', 'professional', 19999, 199999, 50, 14, 3, true, true),
('enterprise', 'Enterprise', 'Full-featured solution for large organizations', 'enterprise', 49999, 499999, 200, 14, 4, true, true)
ON CONFLICT (plan_code) DO NOTHING;

-- Update growth plan with more features
UPDATE subscription_plans SET 
    api_access_enabled = true,
    webhook_enabled = true,
    multi_currency_enabled = true,
    dashboard_enabled = true,
    reports_enabled = true,
    price_analysis_enabled = true,
    rate_fms_enabled = true
WHERE plan_code = 'growth';

-- Update professional plan with more features
UPDATE subscription_plans SET 
    api_access_enabled = true,
    webhook_enabled = true,
    multi_currency_enabled = true,
    multi_branch_enabled = true,
    custom_domain_enabled = true,
    advanced_analytics_enabled = true
WHERE plan_code = 'professional';

-- Update enterprise plan with all features
UPDATE subscription_plans SET 
    api_access_enabled = true,
    webhook_enabled = true,
    multi_currency_enabled = true,
    multi_branch_enabled = true,
    custom_domain_enabled = true,
    white_label_enabled = true,
    sandbox_enabled = true,
    advanced_analytics_enabled = true,
    ai_assistant_enabled = true,
    inventory_enabled = true,
    production_enabled = true,
    finance_enabled = true
WHERE plan_code = 'enterprise';

-- ================================================
-- SEED DEFAULT FEATURES
-- ================================================
INSERT INTO features (feature_code, name, description, category, sort_order, is_active) VALUES
('sales_enquiry', 'Sales Enquiry', 'Create and manage sales enquiries', 'sales', 1, true),
('sales_approval', 'Sales Approval', 'Approve sales enquiries', 'sales', 2, true),
('purchase_quote', 'Purchase Quote', 'Create and manage purchase quotes', 'purchase', 3, true),
('vendor_quote', 'Vendor Quote', 'Compare vendor quotes', 'purchase', 4, true),
('price_analysis', 'Price Analysis', 'Price analysis and calculations', 'rate', 5, true),
('rate_fms', 'Rate FMS', 'Rate workflow management', 'rate', 6, true),
('products', 'Products', 'Product master management', 'masters', 7, true),
('customers', 'Customers', 'Customer master management', 'masters', 8, true),
('vendors', 'Vendors', 'Vendor master management', 'masters', 9, true),
('inventory', 'Inventory', 'Inventory management', 'inventory', 10, true),
('production', 'Production', 'Production planning', 'production', 11, true),
('finance', 'Finance', 'Finance and accounting', 'finance', 12, true),
('dashboard', 'Dashboard', 'Analytics dashboard', 'analytics', 13, true),
('reports', 'Reports', 'Report generation', 'analytics', 14, true),
('advanced_analytics', 'Advanced Analytics', 'Advanced analytics and insights', 'analytics', 15, true),
('api_access', 'API Access', 'REST API access', 'api', 16, true),
('webhooks', 'Webhooks', 'Webhook integrations', 'api', 17, true),
('custom_domain', 'Custom Domain', 'Use custom domain', 'customization', 18, true),
('white_label', 'White Label', 'Hide platform branding', 'customization', 19, true),
('sandbox', 'Sandbox', 'Sandbox environment', 'customization', 20, true),
('multi_branch', 'Multi-Branch', 'Multiple branch support', 'customization', 21, true),
('multi_currency', 'Multi-Currency', 'Multiple currency support', 'customization', 22, true),
('ai_assistant', 'AI Assistant', 'AI-powered assistance', 'support', 23, true)
ON CONFLICT (feature_code) DO NOTHING;

-- ================================================
-- PRINT COMPLETION MESSAGE
-- ================================================
DO $$
BEGIN
    RAISE NOTICE '✅ SaaS Platform tables created successfully!';
    RAISE NOTICE '📦 Default subscription plans seeded: starter, growth, professional, enterprise';
    RAISE NOTICE '🎯 Default features seeded: 23 features';
    RAISE NOTICE '📋 Removed billing tables (invoices, payments, coupons) - billing will be added later';
END $$;
