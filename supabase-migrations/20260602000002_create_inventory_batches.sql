-- Create inventory_batches table for batch tracking
CREATE TABLE IF NOT EXISTS inventory_batches (
    batch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID,
    product_id UUID NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    warehouse_id UUID,
    location_id UUID,
    quantity DECIMAL(15, 3) DEFAULT 0,
    reserved_quantity DECIMAL(15, 3) DEFAULT 0,
    available_quantity DECIMAL(15, 3) DEFAULT 0,
    unit_cost DECIMAL(15, 2) DEFAULT 0,
    total_value DECIMAL(15, 2) DEFAULT 0,
    mfg_date DATE,
    expiry_date DATE,
    grn_id UUID,
    grn_number VARCHAR(50),
    vendor_id UUID,
    vendor_name VARCHAR(255),
    purchase_invoice_id UUID,
    invoice_number VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'quarantine', 'cleared', 'rejected')),
    remarks TEXT,
    last_movement_date TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    CONSTRAINT uk_product_batch UNIQUE (product_id, batch_number)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_batch_product ON inventory_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_batch_warehouse ON inventory_batches(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_batch_expiry ON inventory_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_batch_status ON inventory_batches(status);
CREATE INDEX IF NOT EXISTS idx_batch_grn ON inventory_batches(grn_id);

-- Add comments
COMMENT ON TABLE inventory_batches IS 'Tracks inventory batches with batch numbers, expiry dates, and FIFO tracking';
COMMENT ON COLUMN inventory_batches.batch_number IS 'Unique batch number for the product';
COMMENT ON COLUMN inventory_batches.available_quantity IS 'quantity - reserved_quantity';
COMMENT ON COLUMN inventory_batches.status IS 'active=available, expired=date passed, quarantine=under inspection, cleared=approved, rejected=QC failed';

-- Add stock_movement columns for batch tracking
ALTER TABLE stock_movements
ADD COLUMN IF NOT EXISTS batch_id UUID,
ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_movement_batch ON stock_movements(batch_id);
