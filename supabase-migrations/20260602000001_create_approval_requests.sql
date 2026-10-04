-- Create approval_requests table for workflow approvals
CREATE TABLE IF NOT EXISTS approval_requests (
    approval_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approval_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    entity_reference VARCHAR(100),
    requester_id UUID NOT NULL,
    requester_name VARCHAR(255),
    requester_role VARCHAR(100),
    current_level INT DEFAULT 1,
    required_level INT DEFAULT 1,
    status VARCHAR(50) DEFAULT 'pending',
    amount DECIMAL(15, 2),
    previous_amount DECIMAL(15, 2),
    variance DECIMAL(15, 2),
    variance_percent DECIMAL(5, 2),
    justification TEXT,
    request_notes TEXT,

    -- Level 1 approval
    level1_approver_id UUID,
    level1_approver_name VARCHAR(255),
    level1_approved_at TIMESTAMP,
    level1_remarks TEXT,

    -- Level 2 approval
    level2_approver_id UUID,
    level2_approver_name VARCHAR(255),
    level2_approved_at TIMESTAMP,
    level2_remarks TEXT,

    -- Level 3 approval
    level3_approver_id UUID,
    level3_approver_name VARCHAR(255),
    level3_approved_at TIMESTAMP,
    level3_remarks TEXT,

    -- Final approval
    final_approver_id UUID,
    final_approver_name VARCHAR(255),
    final_approved_at TIMESTAMP,
    final_remarks TEXT,

    -- Rejection
    rejected_by_id UUID,
    rejected_by_name VARCHAR(255),
    rejected_at TIMESTAMP,
    rejection_reason TEXT,

    -- Revision
    revision_notes TEXT,
    revision_requested_by_id UUID,
    revision_requested_by_name VARCHAR(255),
    revision_requested_at TIMESTAMP,

    -- Context
    context_data JSONB,
    priority VARCHAR(20) DEFAULT 'normal',
    is_override BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Indexes
    CONSTRAINT chk_approval_status CHECK (status IN ('pending', 'approved', 'rejected', 'revision_requested'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_approval_entity ON approval_requests(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_approval_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_type ON approval_requests(approval_type);
CREATE INDEX IF NOT EXISTS idx_approval_requester ON approval_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_approval_current_level ON approval_requests(current_level);

-- Add comment
COMMENT ON TABLE approval_requests IS 'Stores multi-level approval requests for purchase quotes, vendor selections, etc.';
