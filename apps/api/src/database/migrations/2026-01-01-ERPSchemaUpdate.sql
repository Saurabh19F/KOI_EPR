-- ERP Schema Update Migration
-- Run this migration to add new columns and tables for the complete ERP system

-- ============================================
-- PRODUCTS TABLE UPDATES
-- ============================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_basis VARCHAR(50) DEFAULT 'per_pc';
ALTER TABLE products ADD COLUMN IF NOT EXISTS packing_size DECIMAL(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS mrp DECIMAL(15, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS buying_price DECIMAL(15, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS landing_cost DECIMAL(15, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS purchase_person_id UUID;
ALTER TABLE products ADD COLUMN IF NOT EXISTS conversion_ratio DECIMAL(10, 4);
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_status VARCHAR(50) DEFAULT 'normal';
ALTER TABLE products ADD COLUMN IF NOT EXISTS current_stock DECIMAL(15, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_level DECIMAL(15, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS max_stock_level DECIMAL(15, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS slow_moving_days INT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS dead_stock_days INT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS damaged_qty DECIMAL(15, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS last_movement_date TIMESTAMP;
ALTER TABLE products ADD COLUMN IF NOT EXISTS location_id UUID;
ALTER TABLE products ADD COLUMN IF NOT EXISTS form_edit_url VARCHAR(500);
ALTER TABLE products ADD COLUMN IF NOT EXISTS template1_send_status VARCHAR(100);

-- ============================================
-- CUSTOMERS TABLE UPDATES
-- ============================================
ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_number VARCHAR(50);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS alternate_contact VARCHAR(50);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS alternate_email VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(50);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_type VARCHAR(50);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_category VARCHAR(50);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_billing_same_as_delivery BOOLEAN DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS product_zone VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS credit_days INT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS opening_balance DECIMAL(15, 2);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS sales_person_id UUID;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS shipping_terms TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS incoterms VARCHAR(50);

-- ============================================
-- SALES ENQUIRY ORDERS TABLE UPDATES
-- ============================================
ALTER TABLE sales_enquiry_orders ADD COLUMN IF NOT EXISTS enquiry_date TIMESTAMP;
ALTER TABLE sales_enquiry_orders ADD COLUMN IF NOT EXISTS crm_id VARCHAR(100);
ALTER TABLE sales_enquiry_orders ADD COLUMN IF NOT EXISTS order_no VARCHAR(100);
ALTER TABLE sales_enquiry_orders ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255);
ALTER TABLE sales_enquiry_orders ADD COLUMN IF NOT EXISTS contact_number VARCHAR(50);
ALTER TABLE sales_enquiry_orders ADD COLUMN IF NOT EXISTS pod VARCHAR(255);
ALTER TABLE sales_enquiry_orders ADD COLUMN IF NOT EXISTS pod_date TIMESTAMP;
ALTER TABLE sales_enquiry_orders ADD COLUMN IF NOT EXISTS currency_id UUID;
ALTER TABLE sales_enquiry_orders ADD COLUMN IF NOT EXISTS cube_size VARCHAR(50);
ALTER TABLE sales_enquiry_orders ADD COLUMN IF NOT EXISTS transporter_details TEXT;
ALTER TABLE sales_enquiry_orders ADD COLUMN IF NOT EXISTS is_billing_same_as_delivery BOOLEAN DEFAULT FALSE;
ALTER TABLE sales_enquiry_orders ADD COLUMN IF NOT EXISTS billing_country VARCHAR(100);
ALTER TABLE sales_enquiry_orders ADD COLUMN IF NOT EXISTS billing_state VARCHAR(100);
ALTER TABLE sales_enquiry_orders ADD COLUMN IF NOT EXISTS billing_city VARCHAR(100);
ALTER TABLE sales_enquiry_orders ADD COLUMN IF NOT EXISTS billing_pincode VARCHAR(20);
ALTER TABLE sales_enquiry_orders ADD COLUMN IF NOT EXISTS delivery_country VARCHAR(100);
ALTER TABLE sales_enquiry_orders ADD COLUMN IF NOT EXISTS delivery_state VARCHAR(100);
ALTER TABLE sales_enquiry_orders ADD COLUMN IF NOT EXISTS delivery_city VARCHAR(100);
ALTER TABLE sales_enquiry_orders ADD COLUMN IF NOT EXISTS delivery_pincode VARCHAR(20);
ALTER TABLE sales_enquiry_orders ADD COLUMN IF NOT EXISTS is_export_enquiry BOOLEAN DEFAULT FALSE;
ALTER TABLE sales_enquiry_orders ADD COLUMN IF NOT EXISTS is_pdf_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE sales_enquiry_orders ADD COLUMN IF NOT EXISTS is_excel_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE sales_enquiry_orders ADD COLUMN IF NOT EXISTS is_email_reminder_required BOOLEAN DEFAULT FALSE;
ALTER TABLE sales_enquiry_orders ADD COLUMN IF NOT EXISTS is_email_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE sales_enquiry_orders ADD COLUMN IF NOT EXISTS is_quotation_created BOOLEAN DEFAULT FALSE;
ALTER TABLE sales_enquiry_orders ADD COLUMN IF NOT EXISTS is_purchase_required BOOLEAN DEFAULT FALSE;
ALTER TABLE sales_enquiry_orders ADD COLUMN IF NOT EXISTS is_rate_calculation_required BOOLEAN DEFAULT FALSE;
ALTER TABLE sales_enquiry_orders ADD COLUMN IF NOT EXISTS is_approval_required BOOLEAN DEFAULT FALSE;
ALTER TABLE sales_enquiry_orders ADD COLUMN IF NOT EXISTS approval_remarks TEXT;
ALTER TABLE sales_enquiry_orders ADD COLUMN IF NOT EXISTS total_cbm DECIMAL(15, 4);
ALTER TABLE sales_enquiry_orders ADD COLUMN IF NOT EXISTS total_value DECIMAL(15, 2);

-- ============================================
-- SALES ENQUIRY ORDER ITEMS TABLE UPDATES
-- ============================================
ALTER TABLE sales_enquiry_order_items ADD COLUMN IF NOT EXISTS line_no INT;
ALTER TABLE sales_enquiry_order_items ADD COLUMN IF NOT EXISTS product_code VARCHAR(100);
ALTER TABLE sales_enquiry_order_items ADD COLUMN IF NOT EXISTS product_description TEXT;
ALTER TABLE sales_enquiry_order_items ADD COLUMN IF NOT EXISTS category_id UUID;
ALTER TABLE sales_enquiry_order_items ADD COLUMN IF NOT EXISTS category_name VARCHAR(255);
ALTER TABLE sales_enquiry_order_items ADD COLUMN IF NOT EXISTS brand_id UUID;
ALTER TABLE sales_enquiry_order_items ADD COLUMN IF NOT EXISTS brand_name VARCHAR(255);
ALTER TABLE sales_enquiry_order_items ADD COLUMN IF NOT EXISTS unit_size VARCHAR(100);
ALTER TABLE sales_enquiry_order_items ADD COLUMN IF NOT EXISTS unit_per_carton INT;
ALTER TABLE sales_enquiry_order_items ADD COLUMN IF NOT EXISTS unit_basis VARCHAR(50);
ALTER TABLE sales_enquiry_order_items ADD COLUMN IF NOT EXISTS packing_size DECIMAL(10, 2);
ALTER TABLE sales_enquiry_order_items ADD COLUMN IF NOT EXISTS packing_type VARCHAR(100);
ALTER TABLE sales_enquiry_order_items ADD COLUMN IF NOT EXISTS purchase_person_id UUID;
ALTER TABLE sales_enquiry_order_items ADD COLUMN IF NOT EXISTS mrp DECIMAL(15, 2);
ALTER TABLE sales_enquiry_order_items ADD COLUMN IF NOT EXISTS gst_percent DECIMAL(5, 2);
ALTER TABLE sales_enquiry_order_items ADD COLUMN IF NOT EXISTS special_requirement TEXT;
ALTER TABLE sales_enquiry_order_items ADD COLUMN IF NOT EXISTS line_status VARCHAR(50) DEFAULT 'pending';

-- ============================================
-- PURCHASE QUOTES TABLE UPDATES
-- ============================================
ALTER TABLE purchase_quotes ADD COLUMN IF NOT EXISTS quote_date TIMESTAMP;
ALTER TABLE purchase_quotes ADD COLUMN IF NOT EXISTS sales_enquiry_order_no VARCHAR(100);
ALTER TABLE purchase_quotes ADD COLUMN IF NOT EXISTS crm_id VARCHAR(100);
ALTER TABLE purchase_quotes ADD COLUMN IF NOT EXISTS party_code VARCHAR(100);
ALTER TABLE purchase_quotes ADD COLUMN IF NOT EXISTS party_name VARCHAR(255);
ALTER TABLE purchase_quotes ADD COLUMN IF NOT EXISTS contact_person_no VARCHAR(50);
ALTER TABLE purchase_quotes ADD COLUMN IF NOT EXISTS email_address VARCHAR(255);
ALTER TABLE purchase_quotes ADD COLUMN IF NOT EXISTS shipment_details TEXT;
ALTER TABLE purchase_quotes ADD COLUMN IF NOT EXISTS transporter_details TEXT;
ALTER TABLE purchase_quotes ADD COLUMN IF NOT EXISTS sales_person_id UUID;
ALTER TABLE purchase_quotes ADD COLUMN IF NOT EXISTS use_sales_enquiry_data BOOLEAN DEFAULT FALSE;
ALTER TABLE purchase_quotes ADD COLUMN IF NOT EXISTS is_rate_finalized BOOLEAN DEFAULT FALSE;
ALTER TABLE purchase_quotes ADD COLUMN IF NOT EXISTS is_label_required BOOLEAN DEFAULT FALSE;
ALTER TABLE purchase_quotes ADD COLUMN IF NOT EXISTS is_image_available BOOLEAN DEFAULT FALSE;
ALTER TABLE purchase_quotes ADD COLUMN IF NOT EXISTS is_sample_required BOOLEAN DEFAULT FALSE;
ALTER TABLE purchase_quotes ADD COLUMN IF NOT EXISTS is_designer_required BOOLEAN DEFAULT FALSE;
ALTER TABLE purchase_quotes ADD COLUMN IF NOT EXISTS is_sent_to_costing BOOLEAN DEFAULT FALSE;
ALTER TABLE purchase_quotes ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE purchase_quotes ADD COLUMN IF NOT EXISTS grand_total DECIMAL(15, 2);
ALTER TABLE purchase_quotes ADD COLUMN IF NOT EXISTS currency VARCHAR(50);
ALTER TABLE purchase_quotes ADD COLUMN IF NOT EXISTS approval_remarks TEXT;

-- ============================================
-- PURCHASE QUOTE ITEMS TABLE UPDATES
-- ============================================
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS line_no INT;
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS product_id UUID;
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS product_code VARCHAR(100);
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS category_id UUID;
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS category_name VARCHAR(255);
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS brand_id UUID;
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS brand_name VARCHAR(255);
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS product_description TEXT;
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS unit_size VARCHAR(100);
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS unit_per_carton INT;
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS unit_basis VARCHAR(50);
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS packing_type VARCHAR(100);
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS packing_size DECIMAL(10, 2);
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS units_per_case INT;
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS moq INT;
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS mrp DECIMAL(15, 2);
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS buying_price DECIMAL(15, 2);
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS gst_percent DECIMAL(5, 2);
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS freight DECIMAL(15, 2);
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS other_cost DECIMAL(15, 2);
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS gst_cost DECIMAL(15, 2);
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS landing_cost DECIMAL(15, 2);
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS landing_cost_delhi DECIMAL(15, 2);
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS rate_per_carton DECIMAL(15, 2);
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS final_price_in_foreign_currency DECIMAL(15, 2);
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS vendor_quote_no VARCHAR(100);
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS vendor_quote_date TIMESTAMP;
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS lead_time_days INT;
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS rate_validity TIMESTAMP;
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS vendor_currency VARCHAR(50);
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS vendor_attachment_url VARCHAR(500);
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS location VARCHAR(100);
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS best_landing_location VARCHAR(100);
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS best_landing_cost DECIMAL(15, 2);
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS remark TEXT;

-- ============================================
-- VENDOR QUOTES TABLE UPDATES (NEW)
-- ============================================
CREATE TABLE IF NOT EXISTS vendor_quotes (
    vendor_quote_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID,
    quote_id UUID,
    quote_item_id UUID,
    product_id UUID,
    sku VARCHAR(100),
    product_name VARCHAR(255),
    vendor_id UUID,
    vendor_name VARCHAR(255),
    vendor_quote_no VARCHAR(100),
    quote_date TIMESTAMP,
    quoted_rate DECIMAL(15, 2),
    quoted_currency VARCHAR(50),
    gst_percent DECIMAL(5, 2),
    freight DECIMAL(15, 2),
    landing_cost DECIMAL(15, 2),
    total_amount DECIMAL(15, 2),
    quantity INT,
    moq INT,
    lead_time_days INT,
    delivery_date TIMESTAMP,
    rate_validity TIMESTAMP,
    delivery_terms TEXT,
    payment_terms_id UUID,
    currency_rate DECIMAL(15, 4),
    discount_percent DECIMAL(5, 2),
    other_charges DECIMAL(15, 2),
    notes TEXT,
    terms_conditions TEXT,
    attachment_url VARCHAR(500),
    attachment_name VARCHAR(255),
    rate_rank DECIMAL(5, 2),
    vs_best_rate_percent DECIMAL(5, 2),
    status VARCHAR(50) DEFAULT 'pending',
    is_best_quote BOOLEAN DEFAULT FALSE,
    is_selected BOOLEAN DEFAULT FALSE,
    approved_by UUID,
    approved_at TIMESTAMP,
    approval_remarks TEXT,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- ============================================
-- PURCHASE LABELS TABLE (NEW)
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_labels (
    label_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID,
    label_code VARCHAR(100) UNIQUE NOT NULL,
    label_date TIMESTAMP,
    quote_id UUID,
    quote_item_id UUID,
    sales_enquiry_order_no VARCHAR(100),
    order_no VARCHAR(100),
    party_name VARCHAR(255),
    country VARCHAR(100),
    product_name VARCHAR(255),
    product_description TEXT,
    sku VARCHAR(100),
    category_id UUID,
    category_name VARCHAR(255),
    brand_id UUID,
    brand_name VARCHAR(255),
    unit_size VARCHAR(100),
    unit_per_carton INT,
    total_value DECIMAL(15, 2),
    imported_by VARCHAR(255),
    poi TEXT,
    nutrition TEXT,
    ingredients TEXT,
    barcode VARCHAR(100),
    batch_number VARCHAR(100),
    shelf_life VARCHAR(100),
    mfg_details TEXT,
    allergen_advice TEXT,
    dimensions VARCHAR(100),
    other_information TEXT,
    item_selection VARCHAR(255),
    designer_id UUID,
    designer_name VARCHAR(255),
    planned_date TIMESTAMP,
    actual_date TIMESTAMP,
    delay_days INT,
    sample_status VARCHAR(100),
    sample_description TEXT,
    design_file_url VARCHAR(500),
    final_file_url VARCHAR(500),
    sample_image_url VARCHAR(500),
    file_name VARCHAR(255),
    approved_by UUID,
    approved_at TIMESTAMP,
    approval_remarks TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    remark TEXT,
    remarks_if_any TEXT,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- ============================================
-- PRICE ANALYSIS MASTER TABLE UPDATES
-- ============================================
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS analysis_date TIMESTAMP;
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS purchase_quote_id UUID;
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS purchase_quote_no VARCHAR(100);
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS buyer_code VARCHAR(100);
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS pod VARCHAR(255);
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS port_of_loading VARCHAR(255);
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS costing_person_id UUID;
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS sales_person_id UUID;
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS purchase_team_status VARCHAR(100);
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS use_purchase_rate BOOLEAN DEFAULT FALSE;
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS use_previous_year_data BOOLEAN DEFAULT FALSE;
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS is_freight_applicable BOOLEAN DEFAULT TRUE;
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS is_haulage_applicable BOOLEAN DEFAULT TRUE;
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS is_margin_applicable BOOLEAN DEFAULT TRUE;
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS is_currency_conversion_required BOOLEAN DEFAULT FALSE;
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS is_rate_rounded BOOLEAN DEFAULT FALSE;
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS gbp_margin DECIMAL(10, 4);
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS gbp_final_rate DECIMAL(10, 4);
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS usd_margin DECIMAL(10, 4);
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS usd_final_rate DECIMAL(10, 4);
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS cad_margin DECIMAL(10, 4);
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS cad_final_rate DECIMAL(10, 4);
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS aud_margin DECIMAL(10, 4);
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS aud_final_rate DECIMAL(10, 4);
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS euro_margin DECIMAL(10, 4);
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS euro_final_rate DECIMAL(10, 4);
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS excel_file_url VARCHAR(500);
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS pdf_file_url VARCHAR(500);
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS total_purchase_value DECIMAL(15, 2);
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS total_selling_value DECIMAL(15, 2);
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS total_margin DECIMAL(10, 2);
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS approval_remarks TEXT;

-- ============================================
-- PRICE ANALYSIS ITEMS TABLE UPDATES
-- ============================================
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS quote_id UUID;
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS quote_item_id UUID;
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS line_no INT;
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS product_code VARCHAR(100);
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS category_id UUID;
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS category_name VARCHAR(255);
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS product_description TEXT;
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS brand_id UUID;
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS brand_name VARCHAR(255);
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS unit_size VARCHAR(100);
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS packing_type VARCHAR(100);
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS packing_size DECIMAL(10, 2);
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS purchase_person_id UUID;
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS purchase_person_name VARCHAR(255);
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS order_quantity INT;
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS mrp DECIMAL(15, 2);
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS buying_price DECIMAL(15, 2);
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS purchase_currency VARCHAR(50);
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS buying_best_landing_rate DECIMAL(15, 2);
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS per_pc_rate_without_gst DECIMAL(15, 4);
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS tax DECIMAL(15, 2);
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS other_cost DECIMAL(15, 2);
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS gst_cost DECIMAL(15, 2);
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS total_rate_per_box DECIMAL(15, 2);
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS rate_with_gst_cost DECIMAL(15, 2);
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS location VARCHAR(100);
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS haulage_delhi DECIMAL(15, 2);
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS haulage_mumbai DECIMAL(15, 2);
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS selected_haulage_location VARCHAR(50);
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS selected_haulage DECIMAL(15, 2);
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS target_currency VARCHAR(50);
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS currency_margin DECIMAL(5, 2);
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS final_currency_rate DECIMAL(15, 4);
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS final_price_in_foreign_currency DECIMAL(15, 4);
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS cbm_cost_per_box_in_selected_currency DECIMAL(15, 4);
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS final_currency VARCHAR(50);
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS margin_percent DECIMAL(5, 2);
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS final_selling_rate DECIMAL(15, 4);
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS remark TEXT;
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
-- CRITICAL: analysis_id links items to their parent price analysis record
ALTER TABLE price_analysis_items ADD COLUMN IF NOT EXISTS analysis_id UUID;
CREATE INDEX IF NOT EXISTS idx_price_analysis_items_analysis_id ON price_analysis_items(analysis_id);

-- ============================================
-- CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_sales_enquiry_status ON sales_enquiry_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_enquiry_customer ON sales_enquiry_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_enquiry_date ON sales_enquiry_orders(enquiry_date);
CREATE INDEX IF NOT EXISTS idx_purchase_quotes_status ON purchase_quotes(status);
CREATE INDEX IF NOT EXISTS idx_purchase_quotes_enquiry ON purchase_quotes(enquiry_order_id);
CREATE INDEX IF NOT EXISTS idx_price_analysis_status ON price_analysis_master(status);
CREATE INDEX IF NOT EXISTS idx_price_analysis_enquiry ON price_analysis_master(enquiry_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_labels_status ON purchase_labels(status);
CREATE INDEX IF NOT EXISTS idx_purchase_labels_designer ON purchase_labels(designer_id);
CREATE INDEX IF NOT EXISTS idx_vendor_quotes_quote ON vendor_quotes(quote_id);
CREATE INDEX IF NOT EXISTS idx_vendor_quotes_vendor ON vendor_quotes(vendor_id);

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Insert default currency rates
INSERT INTO currency_rates (currency_code, currency_name, actual_rate, margin_buffer, final_rate, is_active, created_at)
VALUES
    ('INR', 'Indian Rupee', 1.0000, 0, 1.0000, true, NOW())
ON CONFLICT DO NOTHING;

INSERT INTO currency_rates (currency_code, currency_name, actual_rate, margin_buffer, final_rate, is_active, created_at)
VALUES
    ('GBP', 'British Pound', 127.25, 0, 127.25, true, NOW())
ON CONFLICT DO NOTHING;

INSERT INTO currency_rates (currency_code, currency_name, actual_rate, margin_buffer, final_rate, is_active, created_at)
VALUES
    ('USD', 'US Dollar', 90.75, 0, 90.75, true, NOW())
ON CONFLICT DO NOTHING;

INSERT INTO currency_rates (currency_code, currency_name, actual_rate, margin_buffer, final_rate, is_active, created_at)
VALUES
    ('EUR', 'Euro', 105.75, 0, 105.75, true, NOW())
ON CONFLICT DO NOTHING;

INSERT INTO currency_rates (currency_code, currency_name, actual_rate, margin_buffer, final_rate, is_active, created_at)
VALUES
    ('CAD', 'Canadian Dollar', 60.75, 0, 60.75, true, NOW())
ON CONFLICT DO NOTHING;

INSERT INTO currency_rates (currency_code, currency_name, actual_rate, margin_buffer, final_rate, is_active, created_at)
VALUES
    ('AUD', 'Australian Dollar', 61.50, 0, 61.50, true, NOW())
ON CONFLICT DO NOTHING;

-- Insert default haulage rates
INSERT INTO haulage_rates (location, container_size, amount, currency, effective_from, is_active, created_at)
VALUES
    ('DELHI', '40HC', 185000, 'INR', NOW(), true, NOW()),
    ('MUMBAI', '40HC', 85000, 'INR', NOW(), true, NOW())
ON CONFLICT DO NOTHING;

COMMIT;
