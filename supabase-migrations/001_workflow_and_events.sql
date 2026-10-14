-- ============================================
-- WORKFLOW TABLES MIGRATION
-- For Supabase PostgreSQL
-- Note: Tables already exist, this adds missing data/columns
-- ============================================

-- ============================================
-- EMAIL QUEUE TABLE (if not exists)
-- ============================================
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
    priority INT DEFAULT 0,
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    failed_at TIMESTAMP,
    retry_count INT DEFAULT 0,
    error_message TEXT,
    entity_type VARCHAR(100),
    entity_id VARCHAR(255),
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- FMS MAIL QUEUE TABLE (if not exists)
-- ============================================
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

-- ============================================
-- FMS ESCALATIONS TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS fms_escalations (
    escalation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL,
    from_user_id UUID,
    to_user_id UUID,
    to_role_id UUID,
    escalation_reason VARCHAR(255),
    escalation_level INT DEFAULT 1,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    resolved_by UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE (if not exists)
-- ============================================

-- Email queue indexes
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled ON email_queue(scheduled_at);

-- FMS indexes
CREATE INDEX IF NOT EXISTS idx_fms_escalations_task ON fms_escalations(task_id);
CREATE INDEX IF NOT EXISTS idx_fms_escalations_unresolved ON fms_escalations(is_resolved) WHERE is_resolved = false;

-- ============================================
-- SEED DATA: Default Rate FMS Workflow
-- Use entity_type instead of module
-- ============================================

-- Insert default Rate FMS workflow (only if not exists)
INSERT INTO workflow_definitions (workflow_id, workflow_code, workflow_name, entity_type, description, is_active)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'RATE_FMS',
    'Rate FMS Workflow',
    'sales_enquiry',
    'Default workflow for rate follow-up tasks from sales enquiries',
    true
) ON CONFLICT (workflow_code) DO NOTHING;

-- Insert workflow steps (only if not exists)
INSERT INTO workflow_steps (step_id, workflow_id, step_order, step_name, approval_level, is_escalation, escalation_days)
VALUES
    ('b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 1, 'Purchase Rate Collection', 1, false, 2),
    ('b2b2c3d4-e5f6-7890-abcd-ef1234567892', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 2, 'Rate Verification', 2, false, 1),
    ('b3b2c3d4-e5f6-7890-abcd-ef1234567893', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 3, 'Manager Approval', 3, true, 1)
ON CONFLICT DO NOTHING;

-- ============================================
-- PRINT SUCCESS
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Workflow and Events migration completed successfully!';
END $$;
