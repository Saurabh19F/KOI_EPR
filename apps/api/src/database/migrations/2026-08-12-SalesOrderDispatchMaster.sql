-- Sales Order to Dispatch master columns from the KOI workbook.
-- Safe to run multiple times.

ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS category_name VARCHAR(255);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS brand_name VARCHAR(255);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS unit_size VARCHAR(100);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS unit_basis VARCHAR(50);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS packing_type VARCHAR(100);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS location VARCHAR(100);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS purchase_person_id UUID;
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS purchase_person_name VARCHAR(255);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS units_per_case DECIMAL(18, 3);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS buying_best_landing_rate DECIMAL(18, 2);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS landing_cost DECIMAL(18, 2);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS per_pc_rate_without_gst DECIMAL(18, 4);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS other_cost DECIMAL(18, 2);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS gst_cost DECIMAL(18, 2);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS total_rate_per_box DECIMAL(18, 2);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS rate_with_gst_cost DECIMAL(18, 2);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS final_price_in_foreign_currency DECIMAL(18, 4);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS rate_per_carton DECIMAL(18, 4);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS cbm_per_box DECIMAL(18, 4);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS cbm_cost_per_box_in_selected_currency DECIMAL(18, 4);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS haulage DECIMAL(18, 2);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS final_rate DECIMAL(18, 4);

ALTER TABLE sales_invoice_items ADD COLUMN IF NOT EXISTS invoice_id UUID;

CREATE INDEX IF NOT EXISTS idx_sales_order_items_purchase_person ON sales_order_items(purchase_person_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_location ON sales_order_items(location);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_items_invoice_id ON sales_invoice_items(invoice_id);
