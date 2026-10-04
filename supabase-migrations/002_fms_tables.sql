-- ============================================
-- FMS TABLES MIGRATION
-- Create fms_step_directory and fms_tasks tables
-- ============================================

-- FMS Step Directory (master steps)
CREATE TABLE IF NOT EXISTS fms_step_directory (
    step_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID,
    step_code VARCHAR(50) UNIQUE NOT NULL,
    step_name VARCHAR(255) NOT NULL,
    description TEXT,
    sequence INTEGER DEFAULT 1,
    sla_hours INTEGER DEFAULT 24,
    assigned_role VARCHAR(100),
    assigned_department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- FMS Tasks
CREATE TABLE IF NOT EXISTS fms_tasks (
    task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID,
    unique_key VARCHAR(255) UNIQUE,
    enquiry_order_id UUID,
    enquiry_order_no VARCHAR(100),
    sku VARCHAR(100),
    product_name TEXT,
    assigned_to UUID,
    assigned_by UUID,
    step_code VARCHAR(50),
    step_name VARCHAR(255),
    planned_start_date TIMESTAMP,
    planned_end_date TIMESTAMP,
    actual_start_date TIMESTAMP,
    actual_end_date TIMESTAMP,
    sla_hours INTEGER,
    sla_deadline TIMESTAMP,
    delay_hours INTEGER DEFAULT 0,
    delay_reason TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    remarks TEXT,
    rate_output TEXT,
    rate_output_date TIMESTAMP,
    is_escalated BOOLEAN DEFAULT false,
    escalated_to UUID,
    escalated_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Email Queue Table
CREATE TABLE IF NOT EXISTS email_queue (
    email_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_email VARCHAR(255) NOT NULL,
    cc_email VARCHAR(255),
    bcc_email VARCHAR(255),
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    template_name VARCHAR(100),
    template_data JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    priority INTEGER DEFAULT 0,
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    failed_at TIMESTAMP,
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    entity_type VARCHAR(100),
    entity_id VARCHAR(255),
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

-- FMS Mail Queue
CREATE TABLE IF NOT EXISTS fms_mail_queue (
    mail_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID,
    mail_type VARCHAR(100) NOT NULL,
    recipient_email VARCHAR(255),
    recipient_name VARCHAR(255),
    subject VARCHAR(500),
    body TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- FMS Escalations
CREATE TABLE IF NOT EXISTS fms_escalations (
    escalation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL,
    from_user_id UUID,
    to_user_id UUID,
    to_role_id UUID,
    escalation_reason VARCHAR(255),
    escalation_level INTEGER DEFAULT 1,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    resolved_by UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_fms_steps_code ON fms_step_directory(step_code);
CREATE INDEX IF NOT EXISTS idx_fms_tasks_enquiry ON fms_tasks(enquiry_order_id);
CREATE INDEX IF NOT EXISTS idx_fms_tasks_status ON fms_tasks(status);
CREATE INDEX IF NOT EXISTS idx_fms_tasks_assigned ON fms_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);

-- ============================================
-- SEED DATA: Default FMS Steps
-- ============================================
INSERT INTO fms_step_directory (step_code, step_name, sequence, sla_hours, assigned_role, is_active)
VALUES
    ('ACT01', 'Purchase Rate Collection', 1, 48, 'PURCHASE', true),
    ('ACT02', 'Rate Verification', 2, 24, 'COSTING', true),
    ('ACT03', 'Manager Approval', 3, 24, 'MANAGEMENT', true)
ON CONFLICT (step_code) DO NOTHING;

DO $$
BEGIN
    RAISE NOTICE 'FMS tables created successfully!';
END $$;
