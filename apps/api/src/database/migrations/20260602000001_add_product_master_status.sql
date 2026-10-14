-- Migration: Add product_master_status to sales_enquiry_order_items
-- Date: 2026-06-02

-- Add masterStatus enum column (default: master_product)
ALTER TABLE "sales_enquiry_order_items"
ADD COLUMN IF NOT EXISTS "master_status" VARCHAR(50) DEFAULT 'master_product';

-- Set existing manual entries to 'not_in_master'
UPDATE "sales_enquiry_order_items"
SET "master_status" = 'not_in_master'
WHERE "is_manual_entry" = true;

-- Add master_product_id column for future mapping
ALTER TABLE "sales_enquiry_order_items"
ADD COLUMN IF NOT EXISTS "master_product_id" UUID;

-- Add product_source column
ALTER TABLE "sales_enquiry_order_items"
ADD COLUMN IF NOT EXISTS "product_source" VARCHAR(20) DEFAULT 'master';

UPDATE "sales_enquiry_order_items"
SET "product_source" = 'manual'
WHERE "is_manual_entry" = true;
