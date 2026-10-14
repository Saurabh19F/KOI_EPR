-- Migration: Add missing columns to sales_enquiry_order_items
-- These columns are used by the Product Items Spreadsheet but were never added to the table

ALTER TABLE sales_enquiry_order_items ADD COLUMN IF NOT EXISTS freight DECIMAL(15, 2);
ALTER TABLE sales_enquiry_order_items ADD COLUMN IF NOT EXISTS landing_cost DECIMAL(15, 2);
ALTER TABLE sales_enquiry_order_items ADD COLUMN IF NOT EXISTS currency VARCHAR(50);
ALTER TABLE sales_enquiry_order_items ADD COLUMN IF NOT EXISTS haulage DECIMAL(15, 2);
ALTER TABLE sales_enquiry_order_items ADD COLUMN IF NOT EXISTS requote_status VARCHAR(50);
