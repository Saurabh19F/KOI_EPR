-- ============================================
-- SUPABASE ERP DATABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PRIORITY 1: COMPANIES TABLE (Foundational)
-- ============================================
CREATE TABLE IF NOT EXISTS companies (
    company_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_code VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    gst_number VARCHAR(20),
    pan_number VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    pincode VARCHAR(20),
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PRIORITY 2: CORE TABLES (with proper FK constraints)
-- ============================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255),
    phone VARCHAR(50),
    department_id UUID,
    company_id UUID REFERENCES companies(company_id) ON DELETE SET NULL,
    role_id UUID,
    is_active BOOLEAN DEFAULT true,
    is_super_admin BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(50),
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
    department_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(company_id) ON DELETE SET NULL,
    department_code VARCHAR(50) UNIQUE NOT NULL,
    department_name VARCHAR(255) NOT NULL,
    head_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add FK for users.department_id after departments exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_department;
ALTER TABLE users ADD CONSTRAINT fk_users_department
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL;

-- Add FK for users.role_id after roles exists (defined below)
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_role;
ALTER TABLE users ADD CONSTRAINT fk_users_role
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE SET NULL;

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
    role_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(company_id) ON DELETE SET NULL,
    role_code VARCHAR(50) UNIQUE NOT NULL,
    role_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User Roles Junction Table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(role_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
    permission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permission_code VARCHAR(100) UNIQUE NOT NULL,
    permission_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Role Permissions Junction Table
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID REFERENCES roles(role_id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(permission_id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Number Series Table
CREATE TABLE IF NOT EXISTS number_series (
    series_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_name VARCHAR(100) NOT NULL,
    prefix VARCHAR(20) NOT NULL,
    current_number INTEGER DEFAULT 0,
    year INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(module_name)
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(255),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT false,
    data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Files Table
CREATE TABLE IF NOT EXISTS files (
    file_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_name VARCHAR(255),
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    file_size INTEGER,
    mime_type VARCHAR(100),
    entity_type VARCHAR(100),
    entity_id VARCHAR(255),
    uploaded_by UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User Sessions Table (for security tracking)
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash VARCHAR(255),
    ip_address VARCHAR(50),
    user_agent TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PRIORITY 8: MASTERS TABLES (with proper FK)
-- ============================================

-- Product Categories
CREATE TABLE IF NOT EXISTS product_categories (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(company_id) ON DELETE SET NULL,
    category_code VARCHAR(50) UNIQUE NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_category_id UUID REFERENCES product_categories(category_id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Segments
CREATE TABLE IF NOT EXISTS segments (
    segment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(company_id) ON DELETE SET NULL,
    segment_code VARCHAR(50) UNIQUE NOT NULL,
    segment_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Component Groups
CREATE TABLE IF NOT EXISTS component_groups (
    group_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(company_id) ON DELETE SET NULL,
    group_code VARCHAR(50) UNIQUE NOT NULL,
    group_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Brands
CREATE TABLE IF NOT EXISTS brands (
    brand_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(company_id) ON DELETE SET NULL,
    brand_code VARCHAR(50) UNIQUE NOT NULL,
    brand_name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- UOM (Units of Measurement)
CREATE TABLE IF NOT EXISTS uom (
    uom_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uom_code VARCHAR(20) UNIQUE NOT NULL,
    uom_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
    product_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(company_id) ON DELETE SET NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    product_code VARCHAR(100),
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES product_categories(category_id) ON DELETE SET NULL,
    segment_id UUID REFERENCES segments(segment_id) ON DELETE SET NULL,
    group_id UUID REFERENCES component_groups(group_id) ON DELETE SET NULL,
    brand_id UUID REFERENCES brands(brand_id) ON DELETE SET NULL,
    hsn_code VARCHAR(20),
    gst_percent DECIMAL(5,2),
    uom_id UUID REFERENCES uom(uom_id) ON DELETE SET NULL,
    unit_price DECIMAL(15,2),
    reorder_level INTEGER,
    min_stock_level INTEGER,
    max_stock_level INTEGER,
    weight DECIMAL(10,3),
    dimensions VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- GST Rates
CREATE TABLE IF NOT EXISTS gst_rates (
    gst_rate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gst_code VARCHAR(20) UNIQUE NOT NULL,
    gst_name VARCHAR(100),
    rate DECIMAL(5,2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
    customer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(company_id) ON DELETE SET NULL,
    buyer_code VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    billing_address TEXT,
    shipping_address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    pincode VARCHAR(20),
    gst_number VARCHAR(20),
    payment_terms_id UUID,
    credit_limit DECIMAL(15,2),
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Vendors
CREATE TABLE IF NOT EXISTS vendors (
    vendor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(company_id) ON DELETE SET NULL,
    vendor_code VARCHAR(50) UNIQUE NOT NULL,
    vendor_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    pincode VARCHAR(20),
    gst_number VARCHAR(20),
    payment_terms_id UUID,
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add FK for payment_terms after it exists (defined below)

-- Zones
CREATE TABLE IF NOT EXISTS zones (
    zone_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_code VARCHAR(50) UNIQUE NOT NULL,
    zone_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Locations
CREATE TABLE IF NOT EXISTS locations (
    location_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_code VARCHAR(50) UNIQUE NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    zone_id UUID REFERENCES zones(zone_id) ON DELETE SET NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Payment Terms
CREATE TABLE IF NOT EXISTS payment_terms (
    payment_terms_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    terms_code VARCHAR(50) UNIQUE NOT NULL,
    terms_name VARCHAR(255) NOT NULL,
    days INTEGER,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add FK constraints for customers and vendors payment_terms_id
ALTER TABLE customers DROP CONSTRAINT IF EXISTS fk_customers_payment_terms;
ALTER TABLE customers ADD CONSTRAINT fk_customers_payment_terms
    FOREIGN KEY (payment_terms_id) REFERENCES payment_terms(payment_terms_id) ON DELETE SET NULL;

ALTER TABLE vendors DROP CONSTRAINT IF EXISTS fk_vendors_payment_terms;
ALTER TABLE vendors ADD CONSTRAINT fk_vendors_payment_terms
    FOREIGN KEY (payment_terms_id) REFERENCES payment_terms(payment_terms_id) ON DELETE SET NULL;

-- Currency
CREATE TABLE IF NOT EXISTS currencies (
    currency_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    currency_code VARCHAR(10) UNIQUE NOT NULL,
    currency_name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10),
    exchange_rate DECIMAL(15,4),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Currency Rates
CREATE TABLE IF NOT EXISTS currency_rate_master (
    rate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(company_id) ON DELETE SET NULL,
    currency_code VARCHAR(10) NOT NULL,
    currency_name VARCHAR(100),
    rate DECIMAL(10,4) NOT NULL,
    rate_date DATE NOT NULL,
    source VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(company_id, currency_code, rate_date)
);

-- ============================================
-- PRIORITY 8: SALES TABLES (with proper FK)
-- ============================================

-- Sales Enquiry Orders
CREATE TABLE IF NOT EXISTS sales_enquiry_orders (
    enquiry_order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(company_id) ON DELETE SET NULL,
    enquiry_order_no VARCHAR(50) UNIQUE NOT NULL,
    enquiry_date DATE,
    crm_id VARCHAR(50),
    order_no VARCHAR(50),
    sales_person_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(customer_id) ON DELETE SET NULL,
    buyer_code VARCHAR(50),
    buyer_name VARCHAR(255),
    contact_name VARCHAR(255),
    contact_number VARCHAR(50),
    buyer_phone VARCHAR(50),
    buyer_email VARCHAR(255),
    country VARCHAR(100),
    state VARCHAR(100),
    city VARCHAR(100),
    po_number VARCHAR(100),
    po_date DATE,
    status VARCHAR(50) DEFAULT 'draft',
    total_amount DECIMAL(15,2),
    remarks TEXT,
    deleted_at TIMESTAMP,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Sales Enquiry Order Items
CREATE TABLE IF NOT EXISTS sales_enquiry_order_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enquiry_order_id UUID REFERENCES sales_enquiry_orders(enquiry_order_id) ON DELETE CASCADE,
    line_no INTEGER,
    sku VARCHAR(100),
    product_id UUID REFERENCES products(product_id) ON DELETE SET NULL,
    product_name VARCHAR(255),
    description TEXT,
    category_id UUID REFERENCES product_categories(category_id) ON DELETE SET NULL,
    brand_id UUID REFERENCES brands(brand_id) ON DELETE SET NULL,
    quantity DECIMAL(15,3),
    unit VARCHAR(50),
    target_rate DECIMAL(15,2),
    target_amount DECIMAL(15,2),
    quoted_rate DECIMAL(15,2),
    quoted_amount DECIMAL(15,2),
    status VARCHAR(50),
    remarks TEXT,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(enquiry_order_id, line_no)
);

-- Sales Enquiry Documents
CREATE TABLE IF NOT EXISTS sales_enquiry_documents (
    document_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enquiry_order_id UUID REFERENCES sales_enquiry_orders(enquiry_order_id) ON DELETE CASCADE,
    document_type VARCHAR(50),
    file_id UUID REFERENCES files(file_id) ON DELETE SET NULL,
    file_name VARCHAR(255),
    file_url VARCHAR(500),
    uploaded_by UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enquiry Punching Logs
CREATE TABLE IF NOT EXISTS enquiry_punching_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enquiry_order_id UUID REFERENCES sales_enquiry_orders(enquiry_order_id) ON DELETE SET NULL,
    item_id UUID REFERENCES sales_enquiry_order_items(item_id) ON DELETE SET NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    punched_at TIMESTAMP DEFAULT NOW(),
    sku VARCHAR(100),
    product_name VARCHAR(255),
    quantity DECIMAL(15,3),
    status VARCHAR(50),
    remarks TEXT
);

-- Enquiry Email Reminders
CREATE TABLE IF NOT EXISTS enquiry_email_reminders (
    reminder_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enquiry_order_id UUID REFERENCES sales_enquiry_orders(enquiry_order_id) ON DELETE CASCADE,
    reminder_type VARCHAR(50),
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    subject VARCHAR(255),
    body TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sales Orders (converted from enquiries)
CREATE TABLE IF NOT EXISTS sales_orders (
    sales_order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(company_id) ON DELETE SET NULL,
    sales_order_no VARCHAR(50) UNIQUE NOT NULL,
    sales_order_date DATE,
    enquiry_order_id UUID REFERENCES sales_enquiry_orders(enquiry_order_id) ON DELETE SET NULL,
    sales_person_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(customer_id) ON DELETE SET NULL,
    buyer_code VARCHAR(50),
    buyer_name VARCHAR(255),
    contact_name VARCHAR(255),
    contact_phone VARCHAR(50),
    buyer_email VARCHAR(255),
    billing_address TEXT,
    shipping_address TEXT,
    country VARCHAR(100),
    state VARCHAR(100),
    city VARCHAR(100),
    po_number VARCHAR(100),
    po_date DATE,
    currency VARCHAR(10),
    exchange_rate DECIMAL(10,4),
    status VARCHAR(50) DEFAULT 'draft',
    subtotal DECIMAL(15,2),
    tax_amount DECIMAL(15,2),
    total_amount DECIMAL(15,2),
    remarks TEXT,
    deleted_at TIMESTAMP,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Sales Order Items
CREATE TABLE IF NOT EXISTS sales_order_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_order_id UUID REFERENCES sales_orders(sales_order_id) ON DELETE CASCADE,
    enquiry_item_id UUID REFERENCES sales_enquiry_order_items(item_id) ON DELETE SET NULL,
    line_no INTEGER,
    sku VARCHAR(100),
    product_id UUID REFERENCES products(product_id) ON DELETE SET NULL,
    product_name VARCHAR(255),
    description TEXT,
    category_id UUID REFERENCES product_categories(category_id) ON DELETE SET NULL,
    brand_id UUID REFERENCES brands(brand_id) ON DELETE SET NULL,
    quantity DECIMAL(15,3),
    unit VARCHAR(50),
    unit_price DECIMAL(15,2),
    discount_percent DECIMAL(5,2),
    discount_amount DECIMAL(15,2),
    tax_percent DECIMAL(5,2),
    tax_amount DECIMAL(15,2),
    total_amount DECIMAL(15,2),
    status VARCHAR(50),
    remarks TEXT,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(sales_order_id, line_no)
);

-- ============================================
-- PRIORITY 8: PURCHASE TABLES (with proper FK)
-- ============================================

-- Purchase Quotes
CREATE TABLE IF NOT EXISTS purchase_quotes (
    quote_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(company_id) ON DELETE SET NULL,
    quote_no VARCHAR(50) UNIQUE NOT NULL,
    quote_date DATE,
    vendor_id UUID REFERENCES vendors(vendor_id) ON DELETE SET NULL,
    vendor_code VARCHAR(50),
    vendor_name VARCHAR(255),
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    country VARCHAR(100),
    state VARCHAR(100),
    city VARCHAR(100),
    currency VARCHAR(10),
    exchange_rate DECIMAL(10,4),
    status VARCHAR(50) DEFAULT 'draft',
    total_amount DECIMAL(15,2),
    remarks TEXT,
    deleted_at TIMESTAMP,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Purchase Quote Items
CREATE TABLE IF NOT EXISTS purchase_quote_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID REFERENCES purchase_quotes(quote_id) ON DELETE CASCADE,
    line_no INTEGER,
    sku VARCHAR(100),
    product_id UUID REFERENCES products(product_id) ON DELETE SET NULL,
    product_name VARCHAR(255),
    description TEXT,
    category_id UUID REFERENCES product_categories(category_id) ON DELETE SET NULL,
    brand_id UUID REFERENCES brands(brand_id) ON DELETE SET NULL,
    quantity DECIMAL(15,3),
    unit VARCHAR(50),
    target_rate DECIMAL(15,2),
    target_amount DECIMAL(15,2),
    status VARCHAR(50),
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(quote_id, line_no)
);

-- Vendor Quotes
CREATE TABLE IF NOT EXISTS vendor_quotes (
    vendor_quote_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID REFERENCES purchase_quote_items(quote_id) ON DELETE CASCADE,
    quote_item_id UUID REFERENCES purchase_quote_items(item_id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(vendor_id) ON DELETE SET NULL,
    vendor_name VARCHAR(255),
    vendor_quote_no VARCHAR(100),
    quote_date DATE,
    quoted_rate DECIMAL(15,4),
    quoted_currency VARCHAR(10),
    gst_percent DECIMAL(5,2),
    freight DECIMAL(15,2),
    landing_cost DECIMAL(15,2),
    total_amount DECIMAL(15,2),
    quantity DECIMAL(15,3),
    moq DECIMAL(15,3),
    lead_time_days INTEGER,
    currency_rate DECIMAL(10,4),
    discount_percent DECIMAL(5,2),
    other_charges DECIMAL(15,2),
    notes TEXT,
    attachment_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'pending',
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Purchase Landing Cost
CREATE TABLE IF NOT EXISTS purchase_landing_cost_by_location (
    landing_cost_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID REFERENCES purchase_quote_items(quote_id) ON DELETE CASCADE,
    quote_item_id UUID REFERENCES purchase_quote_items(item_id) ON DELETE CASCADE,
    location VARCHAR(50) NOT NULL,
    freight_cost DECIMAL(15,2),
    freight_per_cbm DECIMAL(15,2),
    freight_currency VARCHAR(10),
    gst_percent DECIMAL(5,2),
    gst_amount DECIMAL(15,2),
    insurance_cost DECIMAL(15,2),
    handling_cost DECIMAL(15,2),
    other_charges DECIMAL(15,2),
    other_charges_description TEXT,
    total_landing_cost DECIMAL(15,2),
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Purchase Labels
CREATE TABLE IF NOT EXISTS purchase_labels (
    label_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label_code VARCHAR(50) UNIQUE NOT NULL,
    label_date DATE,
    quote_id UUID REFERENCES purchase_quotes(quote_id) ON DELETE SET NULL,
    quote_item_id UUID REFERENCES purchase_quote_items(item_id) ON DELETE SET NULL,
    sales_enquiry_order_no VARCHAR(50),
    order_no VARCHAR(50),
    party_name VARCHAR(255),
    country VARCHAR(100),
    product_name VARCHAR(255),
    product_description TEXT,
    sku VARCHAR(100),
    category_id UUID REFERENCES product_categories(category_id) ON DELETE SET NULL,
    category_name VARCHAR(255),
    brand_id UUID REFERENCES brands(brand_id) ON DELETE SET NULL,
    brand_name VARCHAR(255),
    unit_size VARCHAR(50),
    unit_per_carton INTEGER,
    total_value DECIMAL(15,2),
    imported_by VARCHAR(255),
    poi VARCHAR(255),
    shelf_life VARCHAR(100),
    mfg_details TEXT,
    allergen_advice TEXT,
    dimensions VARCHAR(100),
    other_information TEXT,
    item_selection VARCHAR(100),
    designer_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    planned_date DATE,
    actual_date DATE,
    delay_days INTEGER,
    sample_status VARCHAR(50),
    sample_description TEXT,
    label_status VARCHAR(50) DEFAULT 'pending',
    deleted_at TIMESTAMP,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
    purchase_order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(company_id) ON DELETE SET NULL,
    purchase_order_no VARCHAR(50) UNIQUE NOT NULL,
    purchase_order_date DATE,
    vendor_id UUID REFERENCES vendors(vendor_id) ON DELETE SET NULL,
    vendor_name VARCHAR(255),
    vendor_code VARCHAR(50),
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    currency VARCHAR(10),
    exchange_rate DECIMAL(10,4),
    payment_terms_id UUID REFERENCES payment_terms(payment_terms_id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'draft',
    subtotal DECIMAL(15,2),
    tax_amount DECIMAL(15,2),
    total_amount DECIMAL(15,2),
    remarks TEXT,
    deleted_at TIMESTAMP,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Purchase Order Items
CREATE TABLE IF NOT EXISTS purchase_order_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID REFERENCES purchase_orders(purchase_order_id) ON DELETE CASCADE,
    vendor_quote_id UUID REFERENCES vendor_quotes(vendor_quote_id) ON DELETE SET NULL,
    line_no INTEGER,
    sku VARCHAR(100),
    product_id UUID REFERENCES products(product_id) ON DELETE SET NULL,
    product_name VARCHAR(255),
    description TEXT,
    category_id UUID REFERENCES product_categories(category_id) ON DELETE SET NULL,
    brand_id UUID REFERENCES brands(brand_id) ON DELETE SET NULL,
    quantity DECIMAL(15,3),
    unit VARCHAR(50),
    unit_price DECIMAL(15,4),
    discount_percent DECIMAL(5,2),
    discount_amount DECIMAL(15,2),
    gst_percent DECIMAL(5,2),
    gst_amount DECIMAL(15,2),
    total_amount DECIMAL(15,2),
    expected_delivery_date DATE,
    status VARCHAR(50),
    remarks TEXT,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(purchase_order_id, line_no)
);

-- ============================================
-- PRIORITY 8: INVENTORY TABLES
-- ============================================

-- Inventory (Current Stock)
CREATE TABLE IF NOT EXISTS inventory (
    inventory_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(company_id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(product_id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(location_id) ON DELETE SET NULL,
    batch_number VARCHAR(100),
    expiry_date DATE,
    quantity DECIMAL(15,3) DEFAULT 0,
    reserved_quantity DECIMAL(15,3) DEFAULT 0,
    available_quantity DECIMAL(15,3) DEFAULT 0,
    unit_cost DECIMAL(15,4),
    total_value DECIMAL(15,2),
    last_received_at TIMESTAMP,
    last_delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(company_id, product_id, location_id, batch_number)
);

-- Inventory Transactions
CREATE TABLE IF NOT EXISTS inventory_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(company_id) ON DELETE SET NULL,
    transaction_type VARCHAR(50) NOT NULL,
    reference_type VARCHAR(100),
    reference_id VARCHAR(255),
    reference_line_id VARCHAR(255),
    product_id UUID REFERENCES products(product_id) ON DELETE SET NULL,
    location_id UUID REFERENCES locations(location_id) ON DELETE SET NULL,
    batch_number VARCHAR(100),
    expiry_date DATE,
    quantity DECIMAL(15,3),
    unit_cost DECIMAL(15,4),
    total_cost DECIMAL(15,2),
    remarks TEXT,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Goods Receipt Notes (GRN)
CREATE TABLE IF NOT EXISTS goods_receipt_notes (
    grn_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(company_id) ON DELETE SET NULL,
    grn_no VARCHAR(50) UNIQUE NOT NULL,
    grn_date DATE,
    purchase_order_id UUID REFERENCES purchase_orders(purchase_order_id) ON DELETE SET NULL,
    vendor_id UUID REFERENCES vendors(vendor_id) ON DELETE SET NULL,
    vendor_name VARCHAR(255),
    location_id UUID REFERENCES locations(location_id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending',
    total_quantity DECIMAL(15,3),
    accepted_quantity DECIMAL(15,3),
    rejected_quantity DECIMAL(15,3),
    remarks TEXT,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Goods Receipt Note Items
CREATE TABLE IF NOT EXISTS goods_receipt_note_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grn_id UUID REFERENCES goods_receipt_notes(grn_id) ON DELETE CASCADE,
    purchase_order_item_id UUID REFERENCES purchase_order_items(item_id) ON DELETE SET NULL,
    line_no INTEGER,
    sku VARCHAR(100),
    product_id UUID REFERENCES products(product_id) ON DELETE SET NULL,
    product_name VARCHAR(255),
    description TEXT,
    batch_number VARCHAR(100),
    expiry_date DATE,
    ordered_quantity DECIMAL(15,3),
    received_quantity DECIMAL(15,3),
    accepted_quantity DECIMAL(15,3),
    rejected_quantity DECIMAL(15,3),
    unit_cost DECIMAL(15,4),
    total_cost DECIMAL(15,2),
    status VARCHAR(50),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(grn_id, line_no)
);

-- Delivery Challans
CREATE TABLE IF NOT EXISTS delivery_challans (
    challan_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(company_id) ON DELETE SET NULL,
    challan_no VARCHAR(50) UNIQUE NOT NULL,
    challan_date DATE,
    sales_order_id UUID REFERENCES sales_orders(sales_order_id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(customer_id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    shipping_address TEXT,
    location_id UUID REFERENCES locations(location_id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'draft',
    total_quantity DECIMAL(15,3),
    remarks TEXT,
    vehicle_number VARCHAR(50),
    transporter_name VARCHAR(255),
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Delivery Challan Items
CREATE TABLE IF NOT EXISTS delivery_challan_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challan_id UUID REFERENCES delivery_challans(challan_id) ON DELETE CASCADE,
    sales_order_item_id UUID REFERENCES sales_order_items(item_id) ON DELETE SET NULL,
    line_no INTEGER,
    sku VARCHAR(100),
    product_id UUID REFERENCES products(product_id) ON DELETE SET NULL,
    product_name VARCHAR(255),
    batch_number VARCHAR(100),
    quantity DECIMAL(15,3),
    unit VARCHAR(50),
    status VARCHAR(50),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(challan_id, line_no)
);

-- Stock Adjustments
CREATE TABLE IF NOT EXISTS stock_adjustments (
    adjustment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(company_id) ON DELETE SET NULL,
    adjustment_no VARCHAR(50) UNIQUE NOT NULL,
    adjustment_date DATE,
    adjustment_type VARCHAR(50),
    location_id UUID REFERENCES locations(location_id) ON DELETE SET NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    total_items INTEGER,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Stock Adjustment Items
CREATE TABLE IF NOT EXISTS stock_adjustment_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    adjustment_id UUID REFERENCES stock_adjustments(adjustment_id) ON DELETE CASCADE,
    line_no INTEGER,
    product_id UUID REFERENCES products(product_id) ON DELETE SET NULL,
    batch_number VARCHAR(100),
    expiry_date DATE,
    current_quantity DECIMAL(15,3),
    adjusted_quantity DECIMAL(15,3),
    new_quantity DECIMAL(15,3),
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(adjustment_id, line_no)
);

-- ============================================
-- PRIORITY 8: INVOICING TABLES
-- ============================================

-- Sales Invoices
CREATE TABLE IF NOT EXISTS sales_invoices (
    invoice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(company_id) ON DELETE SET NULL,
    invoice_no VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE,
    sales_order_id UUID REFERENCES sales_orders(sales_order_id) ON DELETE SET NULL,
    delivery_challan_id UUID REFERENCES delivery_challans(challan_id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(customer_id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    buyer_gst_number VARCHAR(20),
    billing_address TEXT,
    shipping_address TEXT,
    place_of_supply VARCHAR(100),
    reverse_charge BOOLEAN DEFAULT false,
    currency VARCHAR(10),
    exchange_rate DECIMAL(10,4),
    payment_terms_id UUID REFERENCES payment_terms(payment_terms_id) ON DELETE SET NULL,
    due_date DATE,
    subtotal DECIMAL(15,2),
    discount_percent DECIMAL(5,2),
    discount_amount DECIMAL(15,2),
    tax_amount DECIMAL(15,2),
    total_amount DECIMAL(15,2),
    amount_in_words VARCHAR(255),
    status VARCHAR(50) DEFAULT 'draft',
    remarks TEXT,
    deleted_at TIMESTAMP,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Sales Invoice Items
CREATE TABLE IF NOT EXISTS sales_invoice_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES sales_invoices(invoice_id) ON DELETE CASCADE,
    line_no INTEGER,
    sales_order_item_id UUID REFERENCES sales_order_items(item_id) ON DELETE SET NULL,
    sku VARCHAR(100),
    product_id UUID REFERENCES products(product_id) ON DELETE SET NULL,
    product_name VARCHAR(255),
    description TEXT,
    hsn_code VARCHAR(20),
    batch_number VARCHAR(100),
    expiry_date DATE,
    quantity DECIMAL(15,3),
    unit VARCHAR(50),
    unit_price DECIMAL(15,2),
    discount_percent DECIMAL(5,2),
    discount_amount DECIMAL(15,2),
    taxable_amount DECIMAL(15,2),
    gst_percent DECIMAL(5,2),
    igst_percent DECIMAL(5,2),
    cgst_percent DECIMAL(5,2),
    sgst_percent DECIMAL(5,2),
    tax_amount DECIMAL(15,2),
    total_amount DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(invoice_id, line_no)
);

-- Purchase Invoices
CREATE TABLE IF NOT EXISTS purchase_invoices (
    invoice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(company_id) ON DELETE SET NULL,
    invoice_no VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE,
    vendor_id UUID REFERENCES vendors(vendor_id) ON DELETE SET NULL,
    vendor_name VARCHAR(255),
    vendor_gst_number VARCHAR(20),
    vendor_address TEXT,
    purchase_order_id UUID REFERENCES purchase_orders(purchase_order_id) ON DELETE SET NULL,
    grn_id UUID REFERENCES goods_receipt_notes(grn_id) ON DELETE SET NULL,
    location_id UUID REFERENCES locations(location_id) ON DELETE SET NULL,
    payment_terms_id UUID REFERENCES payment_terms(payment_terms_id) ON DELETE SET NULL,
    due_date DATE,
    subtotal DECIMAL(15,2),
    discount_percent DECIMAL(5,2),
    discount_amount DECIMAL(15,2),
    tax_amount DECIMAL(15,2),
    total_amount DECIMAL(15,2),
    tds_percent DECIMAL(5,2),
    tds_amount DECIMAL(15,2),
    net_amount DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'draft',
    remarks TEXT,
    deleted_at TIMESTAMP,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Purchase Invoice Items
CREATE TABLE IF NOT EXISTS purchase_invoice_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES purchase_invoices(invoice_id) ON DELETE CASCADE,
    line_no INTEGER,
    purchase_order_item_id UUID REFERENCES purchase_order_items(item_id) ON DELETE SET NULL,
    grn_item_id UUID REFERENCES goods_receipt_note_items(item_id) ON DELETE SET NULL,
    sku VARCHAR(100),
    product_id UUID REFERENCES products(product_id) ON DELETE SET NULL,
    product_name VARCHAR(255),
    description TEXT,
    hsn_code VARCHAR(20),
    quantity DECIMAL(15,3),
    unit VARCHAR(50),
    unit_price DECIMAL(15,4),
    discount_percent DECIMAL(5,2),
    discount_amount DECIMAL(15,2),
    taxable_amount DECIMAL(15,2),
    gst_percent DECIMAL(5,2),
    igst_percent DECIMAL(5,2),
    cgst_percent DECIMAL(5,2),
    sgst_percent DECIMAL(5,2),
    tax_amount DECIMAL(15,2),
    total_amount DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(invoice_id, line_no)
);

-- ============================================
-- PRIORITY 8: PAYMENT TABLES
-- ============================================

-- Payments Received
CREATE TABLE IF NOT EXISTS payments_received (
    payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(company_id) ON DELETE SET NULL,
    payment_no VARCHAR(50) UNIQUE NOT NULL,
    payment_date DATE,
    customer_id UUID REFERENCES customers(customer_id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    invoice_id UUID REFERENCES sales_invoices(invoice_id) ON DELETE SET NULL,
    payment_mode VARCHAR(50),
    bank_name VARCHAR(100),
    cheque_number VARCHAR(50),
    cheque_date DATE,
    transaction_ref VARCHAR(100),
    amount DECIMAL(15,2),
    currency VARCHAR(10),
    exchange_rate DECIMAL(10,4),
    tds_percent DECIMAL(5,2),
    tds_amount DECIMAL(15,2),
    net_amount DECIMAL(15,2),
    remarks TEXT,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Payments Made
CREATE TABLE IF NOT EXISTS payments_made (
    payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(company_id) ON DELETE SET NULL,
    payment_no VARCHAR(50) UNIQUE NOT NULL,
    payment_date DATE,
    vendor_id UUID REFERENCES vendors(vendor_id) ON DELETE SET NULL,
    vendor_name VARCHAR(255),
    invoice_id UUID REFERENCES purchase_invoices(invoice_id) ON DELETE SET NULL,
    payment_mode VARCHAR(50),
    bank_name VARCHAR(100),
    cheque_number VARCHAR(50),
    cheque_date DATE,
    transaction_ref VARCHAR(100),
    amount DECIMAL(15,2),
    currency VARCHAR(10),
    exchange_rate DECIMAL(10,4),
    tds_percent DECIMAL(5,2),
    tds_amount DECIMAL(15,2),
    net_amount DECIMAL(15,2),
    remarks TEXT,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- RATE ANALYSIS TABLES (with proper FK)
-- ============================================

-- Price Analysis Master
CREATE TABLE IF NOT EXISTS price_analysis_master (
    analysis_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(company_id) ON DELETE SET NULL,
    analysis_no VARCHAR(50) UNIQUE NOT NULL,
    analysis_date DATE,
    enquiry_order_id UUID REFERENCES sales_enquiry_orders(enquiry_order_id) ON DELETE SET NULL,
    enquiry_order_no VARCHAR(50),
    status VARCHAR(50) DEFAULT 'draft',
    total_buying_price DECIMAL(15,2),
    total_selling_price DECIMAL(15,2),
    margin_percent DECIMAL(5,2),
    is_rate_rounded BOOLEAN DEFAULT false,
    remarks TEXT,
    approved_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    approval_remarks TEXT,
    deleted_at TIMESTAMP,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Price Analysis Items
CREATE TABLE IF NOT EXISTS price_analysis_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID REFERENCES price_analysis_master(analysis_id) ON DELETE CASCADE,
    quote_id UUID REFERENCES purchase_quotes(quote_id) ON DELETE SET NULL,
    quote_item_id UUID REFERENCES purchase_quote_items(item_id) ON DELETE SET NULL,
    enquiry_item_id UUID REFERENCES sales_enquiry_order_items(item_id) ON DELETE SET NULL,
    line_no INTEGER,
    sku VARCHAR(100),
    product_code VARCHAR(100),
    category_id UUID REFERENCES product_categories(category_id) ON DELETE SET NULL,
    product_name VARCHAR(255),
    description TEXT,
    order_quantity DECIMAL(15,3),
    cbm_per_box DECIMAL(10,4),
    total_cbm DECIMAL(15,4),
    buying_price DECIMAL(15,4),
    buying_best_landing_rate DECIMAL(15,4),
    gst_percent DECIMAL(5,2),
    gst_amount DECIMAL(15,2),
    landing_cost DECIMAL(15,2),
    other_cost DECIMAL(15,2),
    freight_cost DECIMAL(15,2),
    selected_haulage_location VARCHAR(50),
    selected_haulage DECIMAL(15,2),
    currency_rate DECIMAL(10,4),
    final_product_cost DECIMAL(15,4),
    margin_percent DECIMAL(5,2),
    margin_amount DECIMAL(15,2),
    final_selling_rate DECIMAL(15,4),
    final_selling_amount DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'pending',
    deleted_at TIMESTAMP,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Haulage Master
CREATE TABLE IF NOT EXISTS haulage_master (
    haulage_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(company_id) ON DELETE SET NULL,
    location VARCHAR(50) NOT NULL,
    rate_per_cbm DECIMAL(15,2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(company_id, location)
);

-- Final Currency Rate Master
CREATE TABLE IF NOT EXISTS final_currency_rate_master (
    final_currency_rate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(company_id) ON DELETE SET NULL,
    currency_code VARCHAR(10) NOT NULL,
    actual_rate DECIMAL(15,4) NOT NULL,
    margin_buffer DECIMAL(10,4),
    final_rate DECIMAL(15,4),
    rounding_rule VARCHAR(50),
    rate_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(company_id, currency_code, rate_date)
);

-- Freight Master
CREATE TABLE IF NOT EXISTS freight_master (
    freight_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    origin VARCHAR(100),
    destination VARCHAR(100),
    port_type VARCHAR(50),
    route VARCHAR(100),
    freight_type VARCHAR(50) NOT NULL,
    rate_per_cbm DECIMAL(15,2),
    rate_per_kg DECIMAL(15,2),
    transit_days INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(origin, destination, freight_type)
);

-- ============================================
-- WORKFLOW TABLES (with proper FK)
-- ============================================

-- Workflow Definitions
CREATE TABLE IF NOT EXISTS workflow_definitions (
    workflow_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_code VARCHAR(50) UNIQUE NOT NULL,
    workflow_name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Workflow Steps
CREATE TABLE IF NOT EXISTS workflow_steps (
    step_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES workflow_definitions(workflow_id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    step_name VARCHAR(255) NOT NULL,
    approver_role_id UUID REFERENCES roles(role_id) ON DELETE SET NULL,
    approver_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    approval_level INTEGER,
    is_escalation BOOLEAN DEFAULT false,
    escalation_days INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Workflow Instances
CREATE TABLE IF NOT EXISTS workflow_instances (
    instance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES workflow_definitions(workflow_id) ON DELETE SET NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(255),
    current_step_id UUID REFERENCES workflow_steps(step_id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending',
    initiated_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    initiated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Workflow Transitions
CREATE TABLE IF NOT EXISTS workflow_transitions (
    transition_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instance_id UUID REFERENCES workflow_instances(instance_id) ON DELETE CASCADE,
    from_step_id UUID REFERENCES workflow_steps(step_id) ON DELETE SET NULL,
    to_step_id UUID REFERENCES workflow_steps(step_id) ON DELETE SET NULL,
    action VARCHAR(50),
    action_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    action_at TIMESTAMP DEFAULT NOW(),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- APPROVAL CHAIN TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS approval_chains (
    chain_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chain_code VARCHAR(50) UNIQUE NOT NULL,
    chain_name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    approval_levels JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- EMAIL TEMPLATES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS email_templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_code VARCHAR(50) UNIQUE NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    body TEXT,
    variables JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Email Queue for processing
CREATE TABLE IF NOT EXISTS email_queue (
    queue_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES email_templates(template_id) ON DELETE SET NULL,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    subject VARCHAR(255),
    body TEXT,
    variables JSONB,
    priority INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    retry_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PRICE LISTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS price_lists (
    price_list_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(company_id) ON DELETE SET NULL,
    price_list_code VARCHAR(50) UNIQUE NOT NULL,
    price_list_name VARCHAR(255) NOT NULL,
    description TEXT,
    currency VARCHAR(10),
    valid_from DATE,
    valid_to DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS price_list_items (
    price_list_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    price_list_id UUID REFERENCES price_lists(price_list_id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(product_id) ON DELETE CASCADE,
    min_quantity DECIMAL(15,3),
    max_quantity DECIMAL(15,3),
    unit_price DECIMAL(15,4),
    discount_percent DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(price_list_id, product_id, min_quantity)
);

-- ============================================
-- TAX INVOICE NUMBER SERIES
-- ============================================

CREATE TABLE IF NOT EXISTS tax_invoice_series (
    series_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
    series_code VARCHAR(20) NOT NULL,
    prefix VARCHAR(20) NOT NULL,
    start_number INTEGER DEFAULT 1,
    current_number INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(company_id, series_code)
);

-- ============================================
-- COMPANY SETTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS company_settings (
    setting_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(company_id, setting_key)
);

-- ============================================
-- PRIORITY 4: NUMBER GENERATION FUNCTIONS
-- ============================================

-- Function to get next number from series
CREATE OR REPLACE FUNCTION fn_get_next_number(p_module_name VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    v_prefix VARCHAR(20);
    v_current INTEGER;
    v_year INTEGER;
    v_next VARCHAR(50);
BEGIN
    SELECT prefix, current_number, COALESCE(year, EXTRACT(YEAR FROM CURRENT_DATE))
    INTO v_prefix, v_current, v_year
    FROM number_series
    WHERE module_name = p_module_name AND is_active = true
    FOR UPDATE;

    IF v_prefix IS NULL THEN
        RAISE EXCEPTION 'Number series not found for module: %', p_module_name;
    END IF;

    v_current := v_current + 1;
    v_next := v_prefix || '-' || v_year || '-' || LPAD(v_current::TEXT, 5, '0');

    UPDATE number_series
    SET current_number = v_current,
        year = v_year,
        updated_at = NOW()
    WHERE module_name = p_module_name;

    RETURN v_next;
END;
$$ LANGUAGE plpgsql;

-- Function to get next enquiry number
CREATE OR REPLACE FUNCTION fn_get_next_enquiry_number()
RETURNS VARCHAR AS $$
BEGIN
    RETURN fn_get_next_number('SALES_ENQUIRY');
END;
$$ LANGUAGE plpgsql;

-- Function to get next purchase quote number
CREATE OR REPLACE FUNCTION fn_get_next_quote_number()
RETURNS VARCHAR AS $$
BEGIN
    RETURN fn_get_next_number('PURCHASE_QUOTE');
END;
$$ LANGUAGE plpgsql;

-- Function to get next purchase label number
CREATE OR REPLACE FUNCTION fn_get_next_label_number()
RETURNS VARCHAR AS $$
BEGIN
    RETURN fn_get_next_number('PURCHASE_LABEL');
END;
$$ LANGUAGE plpgsql;

-- Function to get next price analysis number
CREATE OR REPLACE FUNCTION fn_get_next_analysis_number()
RETURNS VARCHAR AS $$
BEGIN
    RETURN fn_get_next_number('PRICE_ANALYSIS');
END;
$$ LANGUAGE plpgsql;

-- Function to get next tax invoice number
CREATE OR REPLACE FUNCTION fn_get_next_tax_invoice_number(p_company_id UUID, p_series_code VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    v_prefix VARCHAR(20);
    v_current INTEGER;
    v_next VARCHAR(50);
BEGIN
    SELECT prefix, current_number
    INTO v_prefix, v_current
    FROM tax_invoice_series
    WHERE company_id = p_company_id AND series_code = p_series_code AND is_active = true
    FOR UPDATE;

    IF v_prefix IS NULL THEN
        RAISE EXCEPTION 'Tax invoice series not found: %', p_series_code;
    END IF;

    v_current := v_current + 1;
    v_next := v_prefix || LPAD(v_current::TEXT, 6, '0');

    UPDATE tax_invoice_series
    SET current_number = v_current,
        updated_at = NOW()
    WHERE company_id = p_company_id AND series_code = p_series_code;

    RETURN v_next;
END;
$$ LANGUAGE plpgsql;

-- Function to get next purchase order number
CREATE OR REPLACE FUNCTION fn_get_next_purchase_order_number()
RETURNS VARCHAR AS $$
BEGIN
    RETURN fn_get_next_number('PURCHASE_ORDER');
END;
$$ LANGUAGE plpgsql;

-- Function to get next sales order number
CREATE OR REPLACE FUNCTION fn_get_next_sales_order_number()
RETURNS VARCHAR AS $$
BEGIN
    RETURN fn_get_next_number('SALES_ORDER');
END;
$$ LANGUAGE plpgsql;

-- Function to get next GRN number
CREATE OR REPLACE FUNCTION fn_get_next_grn_number()
RETURNS VARCHAR AS $$
BEGIN
    RETURN fn_get_next_number('GOODS_RECEIPT');
END;
$$ LANGUAGE plpgsql;

-- Function to get next delivery challan number
CREATE OR REPLACE FUNCTION fn_get_next_challan_number()
RETURNS VARCHAR AS $$
BEGIN
    RETURN fn_get_next_number('DELIVERY_CHALLAN');
END;
$$ LANGUAGE plpgsql;

-- Function to get next sales invoice number
CREATE OR REPLACE FUNCTION fn_get_next_sales_invoice_number()
RETURNS VARCHAR AS $$
BEGIN
    RETURN fn_get_next_number('SALES_INVOICE');
END;
$$ LANGUAGE plpgsql;

-- Function to get next purchase invoice number
CREATE OR REPLACE FUNCTION fn_get_next_purchase_invoice_number()
RETURNS VARCHAR AS $$
BEGIN
    RETURN fn_get_next_number('PURCHASE_INVOICE');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PRIORITY 6: AUDIT TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION fn_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_old_values JSONB;
    v_new_values JSONB;
    v_action VARCHAR(100);
BEGIN
    -- Get current user
    v_user_id := NULLIF(CURRENT_SETTING('request.jwt_claim_user_id', true), '')::UUID;

    IF TG_OP = 'INSERT' THEN
        v_action := 'INSERT';
        v_new_values := to_jsonb(NEW);
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
        VALUES (v_user_id, v_action, TG_TABLE_NAME, NEW.*, v_new_values);
        RETURN NEW;

    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'UPDATE';
        v_old_values := to_jsonb(OLD);
        v_new_values := to_jsonb(NEW);
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
        VALUES (v_user_id, v_action, TG_TABLE_NAME, NEW.*, v_old_values, v_new_values);
        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'DELETE';
        v_old_values := to_jsonb(OLD);
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values)
        VALUES (v_user_id, v_action, TG_TABLE_NAME, OLD.*, v_old_values);
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PRIORITY 6: UPDATED_AT TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION fn_updated_at_trigger()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PRIORITY 6: SOFT DELETE TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION fn_soft_delete_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        NEW.deleted_at := NOW();
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PRIORITY 6: APPLY TRIGGERS
-- ============================================

-- Tables with updated_at triggers
CREATE TRIGGER trg_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_zones_updated_at
    BEFORE UPDATE ON zones
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_uom_updated_at
    BEFORE UPDATE ON uom
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_gst_rates_updated_at
    BEFORE UPDATE ON gst_rates
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_currencies_updated_at
    BEFORE UPDATE ON currencies
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_payment_terms_updated_at
    BEFORE UPDATE ON payment_terms
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_number_series_updated_at
    BEFORE UPDATE ON number_series
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_approval_chains_updated_at
    BEFORE UPDATE ON approval_chains
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_price_lists_updated_at
    BEFORE UPDATE ON price_lists
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_tax_invoice_series_updated_at
    BEFORE UPDATE ON tax_invoice_series
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_company_settings_updated_at
    BEFORE UPDATE ON company_settings
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_product_categories_updated_at
    BEFORE UPDATE ON product_categories
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_segments_updated_at
    BEFORE UPDATE ON segments
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_component_groups_updated_at
    BEFORE UPDATE ON component_groups
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_brands_updated_at
    BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_vendors_updated_at
    BEFORE UPDATE ON vendors
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_locations_updated_at
    BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_sales_enquiry_orders_updated_at
    BEFORE UPDATE ON sales_enquiry_orders
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_sales_enquiry_order_items_updated_at
    BEFORE UPDATE ON sales_enquiry_order_items
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_purchase_quotes_updated_at
    BEFORE UPDATE ON purchase_quotes
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_purchase_quote_items_updated_at
    BEFORE UPDATE ON purchase_quote_items
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_vendor_quotes_updated_at
    BEFORE UPDATE ON vendor_quotes
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_purchase_landing_cost_updated_at
    BEFORE UPDATE ON purchase_landing_cost_by_location
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_purchase_labels_updated_at
    BEFORE UPDATE ON purchase_labels
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_price_analysis_master_updated_at
    BEFORE UPDATE ON price_analysis_master
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_price_analysis_items_updated_at
    BEFORE UPDATE ON price_analysis_items
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_haulage_master_updated_at
    BEFORE UPDATE ON haulage_master
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_freight_master_updated_at
    BEFORE UPDATE ON freight_master
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_sales_orders_updated_at
    BEFORE UPDATE ON sales_orders
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_sales_order_items_updated_at
    BEFORE UPDATE ON sales_order_items
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_purchase_orders_updated_at
    BEFORE UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_purchase_order_items_updated_at
    BEFORE UPDATE ON purchase_order_items
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_goods_receipt_notes_updated_at
    BEFORE UPDATE ON goods_receipt_notes
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_delivery_challans_updated_at
    BEFORE UPDATE ON delivery_challans
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_stock_adjustments_updated_at
    BEFORE UPDATE ON stock_adjustments
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_sales_invoices_updated_at
    BEFORE UPDATE ON sales_invoices
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_purchase_invoices_updated_at
    BEFORE UPDATE ON purchase_invoices
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

-- Additional updated_at triggers for child tables
CREATE TRIGGER trg_sales_enquiry_documents_updated_at
    BEFORE UPDATE ON sales_enquiry_documents
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_enquiry_punching_logs_updated_at
    BEFORE UPDATE ON enquiry_punching_logs
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_enquiry_email_reminders_updated_at
    BEFORE UPDATE ON enquiry_email_reminders
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_inventory_transactions_updated_at
    BEFORE UPDATE ON inventory_transactions
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_goods_receipt_note_items_updated_at
    BEFORE UPDATE ON goods_receipt_note_items
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_delivery_challan_items_updated_at
    BEFORE UPDATE ON delivery_challan_items
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_stock_adjustment_items_updated_at
    BEFORE UPDATE ON stock_adjustment_items
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_sales_invoice_items_updated_at
    BEFORE UPDATE ON sales_invoice_items
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_purchase_invoice_items_updated_at
    BEFORE UPDATE ON purchase_invoice_items
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_payments_received_updated_at
    BEFORE UPDATE ON payments_received
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_payments_made_updated_at
    BEFORE UPDATE ON payments_made
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_email_queue_updated_at
    BEFORE UPDATE ON email_queue
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_price_list_items_updated_at
    BEFORE UPDATE ON price_list_items
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_workflow_definitions_updated_at
    BEFORE UPDATE ON workflow_definitions
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_workflow_steps_updated_at
    BEFORE UPDATE ON workflow_steps
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_workflow_instances_updated_at
    BEFORE UPDATE ON workflow_instances
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

CREATE TRIGGER trg_workflow_transitions_updated_at
    BEFORE UPDATE ON workflow_transitions
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at_trigger();

-- ============================================
-- PRIORITY 7: CREATE INDEXES
-- ============================================

-- Core tables indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_departments_company ON departments(company_id);
CREATE INDEX IF NOT EXISTS idx_roles_company ON roles(company_id);
CREATE INDEX IF NOT EXISTS idx_roles_active ON roles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Master tables indexes
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_segment ON products(segment_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_product_categories_parent ON product_categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_customers_buyer_code ON customers(buyer_code);
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_vendors_vendor_code ON vendors(vendor_code);
CREATE INDEX IF NOT EXISTS idx_vendors_company ON vendors(company_id);
CREATE INDEX IF NOT EXISTS idx_vendors_active ON vendors(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_zones_active ON zones(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_locations_zone ON locations(zone_id);
CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(is_active) WHERE is_active = true;

-- Sales tables indexes
CREATE INDEX IF NOT EXISTS idx_sales_enquiry_no ON sales_enquiry_orders(enquiry_order_no);
CREATE INDEX IF NOT EXISTS idx_sales_enquiry_status ON sales_enquiry_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_enquiry_customer ON sales_enquiry_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_enquiry_salesperson ON sales_enquiry_orders(sales_person_id);
CREATE INDEX IF NOT EXISTS idx_sales_enquiry_date ON sales_enquiry_orders(enquiry_date);
CREATE INDEX IF NOT EXISTS idx_sales_enquiry_items_order ON sales_enquiry_order_items(enquiry_order_id);
CREATE INDEX IF NOT EXISTS idx_sales_enquiry_items_product ON sales_enquiry_order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_no ON sales_orders(sales_order_no);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_enquiry ON sales_orders(enquiry_order_id);

-- Purchase tables indexes
CREATE INDEX IF NOT EXISTS idx_purchase_quotes_no ON purchase_quotes(quote_no);
CREATE INDEX IF NOT EXISTS idx_purchase_quotes_status ON purchase_quotes(status);
CREATE INDEX IF NOT EXISTS idx_purchase_quotes_vendor ON purchase_quotes(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_quote_items_quote ON purchase_quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_vendor_quotes_vendor ON vendor_quotes(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_quotes_status ON vendor_quotes(status);
CREATE INDEX IF NOT EXISTS idx_vendor_quotes_quote_item ON vendor_quotes(quote_item_id);
CREATE INDEX IF NOT EXISTS idx_purchase_landing_cost_quote ON purchase_landing_cost_by_location(quote_id);
CREATE INDEX IF NOT EXISTS idx_purchase_labels_code ON purchase_labels(label_code);
CREATE INDEX IF NOT EXISTS idx_purchase_labels_status ON purchase_labels(label_status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_no ON purchase_orders(purchase_order_no);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor ON purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_order ON purchase_order_items(purchase_order_id);

-- Rate analysis indexes
CREATE INDEX IF NOT EXISTS idx_price_analysis_no ON price_analysis_master(analysis_no);
CREATE INDEX IF NOT EXISTS idx_price_analysis_status ON price_analysis_master(status);
CREATE INDEX IF NOT EXISTS idx_price_analysis_order ON price_analysis_master(enquiry_order_id);
CREATE INDEX IF NOT EXISTS idx_price_analysis_items_analysis ON price_analysis_items(analysis_id);
CREATE INDEX IF NOT EXISTS idx_price_analysis_items_quote ON price_analysis_items(quote_id);

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_company ON inventory(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_trans_product ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_trans_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inventory_trans_ref ON inventory_transactions(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_inventory_trans_location ON inventory_transactions(location_id);
CREATE INDEX IF NOT EXISTS idx_grn_no ON goods_receipt_notes(grn_no);
CREATE INDEX IF NOT EXISTS idx_grn_status ON goods_receipt_notes(status);
CREATE INDEX IF NOT EXISTS idx_grn_vendor ON goods_receipt_notes(vendor_id);
CREATE INDEX IF NOT EXISTS idx_grn_order ON goods_receipt_notes(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_grn_items_grn ON goods_receipt_note_items(grn_id);
CREATE INDEX IF NOT EXISTS idx_grn_items_product ON goods_receipt_note_items(product_id);
CREATE INDEX IF NOT EXISTS idx_challan_no ON delivery_challans(challan_no);
CREATE INDEX IF NOT EXISTS idx_challan_status ON delivery_challans(status);
CREATE INDEX IF NOT EXISTS idx_challan_customer ON delivery_challans(customer_id);
CREATE INDEX IF NOT EXISTS idx_challan_order ON delivery_challans(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_challan_items_challan ON delivery_challan_items(challan_id);
CREATE INDEX IF NOT EXISTS idx_challan_items_product ON delivery_challan_items(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_adj_no ON stock_adjustments(adjustment_no);
CREATE INDEX IF NOT EXISTS idx_stock_adj_status ON stock_adjustments(status);
CREATE INDEX IF NOT EXISTS idx_stock_adj_items_adj ON stock_adjustment_items(adjustment_id);
CREATE INDEX IF NOT EXISTS idx_stock_adj_items_product ON stock_adjustment_items(product_id);

-- Invoice indexes
CREATE INDEX IF NOT EXISTS idx_sales_invoices_no ON sales_invoices(invoice_no);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_status ON sales_invoices(status);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer ON sales_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_order ON sales_invoices(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_items_invoice ON sales_invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_items_product ON sales_invoice_items(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_no ON purchase_invoices(invoice_no);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_status ON purchase_invoices(status);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_vendor ON purchase_invoices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_order ON purchase_invoices(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_invoice ON purchase_invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_product ON purchase_invoice_items(product_id);

-- Payment indexes
CREATE INDEX IF NOT EXISTS idx_payments_received_customer ON payments_received(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_received_invoice ON payments_received(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_made_vendor ON payments_made(vendor_id);
CREATE INDEX IF NOT EXISTS idx_payments_made_invoice ON payments_made(invoice_id);

-- Workflow indexes
CREATE INDEX IF NOT EXISTS idx_workflow_instances_entity ON workflow_instances(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_status ON workflow_instances(status);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow ON workflow_steps(workflow_id);

-- Audit and notifications indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status, scheduled_at);

-- Document and child table indexes
CREATE INDEX IF NOT EXISTS idx_enquiry_docs_order ON sales_enquiry_documents(enquiry_order_id);
CREATE INDEX IF NOT EXISTS idx_punching_logs_order ON enquiry_punching_logs(enquiry_order_id);
CREATE INDEX IF NOT EXISTS idx_email_reminders_order ON enquiry_email_reminders(enquiry_order_id);
CREATE INDEX IF NOT EXISTS idx_price_list_items_list ON price_list_items(price_list_id);
CREATE INDEX IF NOT EXISTS idx_price_list_items_product ON price_list_items(product_id);
CREATE INDEX IF NOT EXISTS idx_currency_rates_company ON currency_rate_master(company_id);
CREATE INDEX IF NOT EXISTS idx_final_currency_rates_company ON final_currency_rate_master(company_id);
CREATE INDEX IF NOT EXISTS idx_haulage_company ON haulage_master(company_id);

-- Currency rate indexes
CREATE INDEX IF NOT EXISTS idx_currency_rates_code_date ON currency_rate_master(currency_code, rate_date);
CREATE INDEX IF NOT EXISTS idx_final_currency_rates_code_date ON final_currency_rate_master(currency_code, rate_date);

-- ============================================
-- PRIORITY 9: STORAGE BUCKETS CONFIGURATION
-- ============================================

-- Note: Run this in Supabase Dashboard or via supabase CLI
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES
--     ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'image/png', 'image/jpeg', 'application/msword', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
--     ('images', 'images', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
--     ('exports', 'exports', false, 104857600, NULL);

-- ============================================
-- PRIORITY 5: ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE number_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE uom ENABLE ROW LEVEL SECURITY;
ALTER TABLE gst_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE currency_rate_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_enquiry_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_enquiry_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_enquiry_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiry_punching_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiry_email_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_landing_cost_by_location ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_analysis_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_analysis_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE haulage_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE final_currency_rate_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE freight_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_invoice_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipt_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipt_note_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_challan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments_received ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments_made ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user company
CREATE OR REPLACE FUNCTION auth.user_company_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(CURRENT_SETTING('request.jwt_claim_company_id', true), '')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION auth.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NULLIF(CURRENT_SETTING('request.jwt_claim_is_super_admin', true), '')::BOOLEAN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user ID
CREATE OR REPLACE FUNCTION auth.current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(CURRENT_SETTING('request.jwt_claim_user_id', true), '')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policy: Users can only see data from their company (except super admins)
-- For companies table
CREATE POLICY "Users can view own company" ON companies
    FOR SELECT USING (
        is_super_admin() = true OR company_id = auth.user_company_id()
    );

CREATE POLICY "Only super admins can insert companies" ON companies
    FOR INSERT WITH CHECK (is_super_admin() = true);

CREATE POLICY "Only super admins can update companies" ON companies
    FOR UPDATE USING (is_super_admin() = true);

CREATE POLICY "Only super admins can delete companies" ON companies
    FOR DELETE USING (is_super_admin() = true);

-- RLS Policy: Users can only see users from their company
CREATE POLICY "Users can view company users" ON users
    FOR SELECT USING (
        is_super_admin() = true OR company_id = auth.user_company_id()
    );

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (
        user_id = NULLIF(CURRENT_SETTING('request.jwt_claim_user_id', true), '')::UUID
    );

-- RLS Policy: Master data is filtered by company
CREATE POLICY "Master data filtered by company" ON product_categories
    FOR ALL USING (
        is_super_admin() = true OR company_id = auth.user_company_id()
    );

CREATE POLICY "Master data filtered by company" ON segments
    FOR ALL USING (
        is_super_admin() = true OR company_id = auth.user_company_id()
    );

CREATE POLICY "Master data filtered by company" ON component_groups
    FOR ALL USING (
        is_super_admin() = true OR company_id = auth.user_company_id()
    );

CREATE POLICY "Master data filtered by company" ON brands
    FOR ALL USING (
        is_super_admin() = true OR company_id = auth.user_company_id()
    );

CREATE POLICY "Master data filtered by company" ON products
    FOR ALL USING (
        is_super_admin() = true OR company_id = auth.user_company_id()
    );

CREATE POLICY "Master data filtered by company" ON customers
    FOR ALL USING (
        is_super_admin() = true OR company_id = auth.user_company_id()
    );

CREATE POLICY "Master data filtered by company" ON vendors
    FOR ALL USING (
        is_super_admin() = true OR company_id = auth.user_company_id()
    );

CREATE POLICY "Master data filtered by company" ON locations
    FOR ALL USING (
        is_super_admin() = true OR company_id = auth.user_company_id()
    );

-- RLS Policy: Global lookup tables (accessible to all authenticated users)
CREATE POLICY "All authenticated users can view uom" ON uom
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can manage uom" ON uom
    FOR ALL USING (is_super_admin() = true);

CREATE POLICY "All authenticated users can view gst_rates" ON gst_rates
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can manage gst_rates" ON gst_rates
    FOR ALL USING (is_super_admin() = true);

CREATE POLICY "All authenticated users can view currencies" ON currencies
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can manage currencies" ON currencies
    FOR ALL USING (is_super_admin() = true);

CREATE POLICY "All authenticated users can view zones" ON zones
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can manage zones" ON zones
    FOR ALL USING (is_super_admin() = true);

CREATE POLICY "All authenticated users can view payment_terms" ON payment_terms
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can manage payment_terms" ON payment_terms
    FOR ALL USING (is_super_admin() = true);

CREATE POLICY "Only admins can manage number_series" ON number_series
    FOR ALL USING (is_super_admin() = true);

CREATE POLICY "Only admins can manage permissions" ON permissions
    FOR ALL USING (is_super_admin() = true);

CREATE POLICY "Only admins can manage role_permissions" ON role_permissions
    FOR ALL USING (is_super_admin() = true);

-- RLS Policy: Sales data filtered by company
CREATE POLICY "Sales data filtered by company" ON sales_enquiry_orders
    FOR ALL USING (
        is_super_admin() = true OR company_id = auth.user_company_id()
    );

CREATE POLICY "Sales data filtered by company" ON sales_enquiry_order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sales_enquiry_orders seo
            WHERE seo.enquiry_order_id = sales_enquiry_order_items.enquiry_order_id
            AND (is_super_admin() = true OR seo.company_id = auth.user_company_id())
        )
    );

-- RLS Policy: Purchase data filtered by company
CREATE POLICY "Purchase data filtered by company" ON purchase_quotes
    FOR ALL USING (
        is_super_admin() = true OR company_id = auth.user_company_id()
    );

CREATE POLICY "Purchase data filtered by company" ON purchase_quote_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM purchase_quotes pq
            WHERE pq.quote_id = purchase_quote_items.quote_id
            AND (is_super_admin() = true OR pq.company_id = auth.user_company_id())
        )
    );

CREATE POLICY "Purchase data filtered by company" ON vendor_quotes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM purchase_quote_items pqi
            JOIN purchase_quotes pq ON pq.quote_id = pqi.quote_id
            WHERE pqi.item_id = vendor_quotes.quote_item_id
            AND (is_super_admin() = true OR pq.company_id = auth.user_company_id())
        )
    );

CREATE POLICY "Purchase data filtered by company" ON purchase_landing_cost_by_location
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM purchase_quote_items pqi
            JOIN purchase_quotes pq ON pq.quote_id = pqi.quote_id
            WHERE pqi.item_id = purchase_landing_cost_by_location.quote_item_id
            AND (is_super_admin() = true OR pq.company_id = auth.user_company_id())
        )
    );

-- RLS Policy: Price analysis filtered by company
CREATE POLICY "Price analysis filtered by company" ON price_analysis_master
    FOR ALL USING (
        is_super_admin() = true OR company_id = auth.user_company_id()
    );

CREATE POLICY "Price analysis items filtered by company" ON price_analysis_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM price_analysis_master pam
            WHERE pam.analysis_id = price_analysis_items.analysis_id
            AND (is_super_admin() = true OR pam.company_id = auth.user_company_id())
        )
    );

-- RLS Policy: Notifications are user-specific
CREATE POLICY "Users see own notifications" ON notifications
    FOR ALL USING (
        user_id = NULLIF(CURRENT_SETTING('request.jwt_claim_user_id', true), '')::UUID
    );

-- RLS Policy: Audit logs visible only to admins
CREATE POLICY "Only admins see audit logs" ON audit_logs
    FOR SELECT USING (is_super_admin() = true);

-- RLS Policy: Departments filtered by company
CREATE POLICY "Departments filtered by company" ON departments
    FOR ALL USING (
        is_super_admin() = true OR company_id = auth.user_company_id()
    );

-- RLS Policy: Roles filtered by company
CREATE POLICY "Roles filtered by company" ON roles
    FOR ALL USING (
        is_super_admin() = true OR company_id = auth.user_company_id()
    );

-- RLS Policy: User roles filtered by user
CREATE POLICY "User roles filtered by user" ON user_roles
    FOR ALL USING (
        is_super_admin() = true OR
        user_id = NULLIF(CURRENT_SETTING('request.jwt_claim_user_id', true), '')::UUID
    );

-- RLS Policy: Inventory filtered by company
CREATE POLICY "Inventory filtered by company" ON inventory
    FOR ALL USING (
        is_super_admin() = true OR company_id = auth.user_company_id()
    );

CREATE POLICY "Inventory transactions filtered by company" ON inventory_transactions
    FOR ALL USING (
        is_super_admin() = true OR company_id = auth.user_company_id()
    );

-- RLS Policy: Sales orders filtered by company
CREATE POLICY "Sales orders filtered by company" ON sales_orders
    FOR ALL USING (
        is_super_admin() = true OR company_id = auth.user_company_id()
    );

CREATE POLICY "Sales order items filtered by company" ON sales_order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sales_orders so
            WHERE so.sales_order_id = sales_order_items.sales_order_id
            AND (is_super_admin() = true OR so.company_id = auth.user_company_id())
        )
    );

-- RLS Policy: Purchase orders filtered by company
CREATE POLICY "Purchase orders filtered by company" ON purchase_orders
    FOR ALL USING (
        is_super_admin() = true OR company_id = auth.user_company_id()
    );

CREATE POLICY "Purchase order items filtered by company" ON purchase_order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM purchase_orders po
            WHERE po.purchase_order_id = purchase_order_items.purchase_order_id
            AND (is_super_admin() = true OR po.company_id = auth.user_company_id())
        )
    );

-- RLS Policy: Invoices filtered by company
CREATE POLICY "Sales invoices filtered by company" ON sales_invoices
    FOR ALL USING (
        is_super_admin() = true OR company_id = auth.user_company_id()
    );

CREATE POLICY "Purchase invoices filtered by company" ON purchase_invoices
    FOR ALL USING (
        is_super_admin() = true OR company_id = auth.user_company_id()
    );

-- RLS Policy: Payments filtered by company
CREATE POLICY "Payments received filtered by company" ON payments_received
    FOR ALL USING (
        is_super_admin() = true OR company_id = auth.user_company_id()
    );

CREATE POLICY "Payments made filtered by company" ON payments_made
    FOR ALL USING (
        is_super_admin() = true OR company_id = auth.user_company_id()
    );

-- RLS Policy: Sales enquiry documents
CREATE POLICY "Sales enquiry docs filtered by company" ON sales_enquiry_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sales_enquiry_orders seo
            WHERE seo.enquiry_order_id = sales_enquiry_documents.enquiry_order_id
            AND (is_super_admin() = true OR seo.company_id = auth.user_company_id())
        )
    );

-- RLS Policy: Enquiry punching logs
CREATE POLICY "Enquiry punching logs filtered by company" ON enquiry_punching_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sales_enquiry_orders seo
            WHERE seo.enquiry_order_id = enquiry_punching_logs.enquiry_order_id
            AND (is_super_admin() = true OR seo.company_id = auth.user_company_id())
        )
    );

-- RLS Policy: Email reminders
CREATE POLICY "Email reminders filtered by company" ON enquiry_email_reminders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sales_enquiry_orders seo
            WHERE seo.enquiry_order_id = enquiry_email_reminders.enquiry_order_id
            AND (is_super_admin() = true OR seo.company_id = auth.user_company_id())
        )
    );

-- RLS Policy: Workflow tables
CREATE POLICY "Workflow definitions all access" ON workflow_definitions
    FOR ALL USING (true);

CREATE POLICY "Workflow steps all access" ON workflow_steps
    FOR ALL USING (true);

CREATE POLICY "Workflow instances filtered" ON workflow_instances
    FOR ALL USING (
        is_super_admin() = true OR
        initiated_by = NULLIF(CURRENT_SETTING('request.jwt_claim_user_id', true), '')::UUID
    );

CREATE POLICY "Workflow transitions filtered" ON workflow_transitions
    FOR ALL USING (true);

-- RLS Policy: Approval chains
CREATE POLICY "Approval chains all access" ON approval_chains
    FOR ALL USING (true);

-- RLS Policy: Email templates
CREATE POLICY "Email templates all access" ON email_templates
    FOR ALL USING (true);

-- RLS Policy: Email queue
CREATE POLICY "Email queue all access" ON email_queue
    FOR ALL USING (true);

-- RLS Policy: Price lists
CREATE POLICY "Price lists filtered by company" ON price_lists
    FOR ALL USING (
        is_super_admin() = true OR company_id = auth.user_company_id()
    );

CREATE POLICY "Price list items filtered" ON price_list_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM price_lists pl
            WHERE pl.price_list_id = price_list_items.price_list_id
            AND (is_super_admin() = true OR pl.company_id = auth.user_company_id())
        )
    );

-- RLS Policy: Tax invoice series
CREATE POLICY "Tax invoice series filtered by company" ON tax_invoice_series
    FOR ALL USING (
        is_super_admin() = true OR company_id = auth.user_company_id()
    );

-- RLS Policy: Company settings
CREATE POLICY "Company settings filtered" ON company_settings
    FOR ALL USING (
        is_super_admin() = true OR company_id = auth.user_company_id()
    );

-- RLS Policy: GRN tables
CREATE POLICY "GRN filtered by company" ON goods_receipt_notes
    FOR ALL USING (
        is_super_admin() = true OR company_id = auth.user_company_id()
    );

CREATE POLICY "GRN items filtered" ON goods_receipt_note_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM goods_receipt_notes grn
            WHERE grn.grn_id = goods_receipt_note_items.grn_id
            AND (is_super_admin() = true OR grn.company_id = auth.user_company_id())
        )
    );

-- RLS Policy: Delivery challan tables
CREATE POLICY "Delivery challans filtered by company" ON delivery_challans
    FOR ALL USING (
        is_super_admin() = true OR company_id = auth.user_company_id()
    );

CREATE POLICY "Delivery challan items filtered" ON delivery_challan_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM delivery_challans dc
            WHERE dc.challan_id = delivery_challan_items.challan_id
            AND (is_super_admin() = true OR dc.company_id = auth.user_company_id())
        )
    );

-- RLS Policy: Stock adjustment tables
CREATE POLICY "Stock adjustments filtered by company" ON stock_adjustments
    FOR ALL USING (
        is_super_admin() = true OR company_id = auth.user_company_id()
    );

CREATE POLICY "Stock adjustment items filtered" ON stock_adjustment_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM stock_adjustments sa
            WHERE sa.adjustment_id = stock_adjustment_items.adjustment_id
            AND (is_super_admin() = true OR sa.company_id = auth.user_company_id())
        )
    );

-- RLS Policy: Invoice items tables
CREATE POLICY "Sales invoice items filtered" ON sales_invoice_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sales_invoices si
            WHERE si.invoice_id = sales_invoice_items.invoice_id
            AND (is_super_admin() = true OR si.company_id = auth.user_company_id())
        )
    );

CREATE POLICY "Purchase invoice items filtered" ON purchase_invoice_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM purchase_invoices pi
            WHERE pi.invoice_id = purchase_invoice_items.invoice_id
            AND (is_super_admin() = true OR pi.company_id = auth.user_company_id())
        )
    );

-- RLS Policy: Haulage master
CREATE POLICY "Haulage master filtered by company" ON haulage_master
    FOR ALL USING (
        is_super_admin() = true OR company_id = auth.user_company_id()
    );

-- RLS Policy: Freight master
CREATE POLICY "Freight master all access" ON freight_master
    FOR ALL USING (true);

-- RLS Policy: Currency rate master
CREATE POLICY "Currency rate master filtered by company" ON currency_rate_master
    FOR ALL USING (
        is_super_admin() = true OR company_id = auth.user_company_id()
    );

-- RLS Policy: Final currency rate master
CREATE POLICY "Final currency rate filtered by company" ON final_currency_rate_master
    FOR ALL USING (
        is_super_admin() = true OR company_id = auth.user_company_id()
    );

-- RLS Policy: Purchase labels
CREATE POLICY "Purchase labels filtered by company" ON purchase_labels
    FOR ALL USING (
        is_super_admin() = true OR
        EXISTS (
            SELECT 1 FROM purchase_quotes pq
            WHERE pq.quote_id = purchase_labels.quote_id
            AND pq.company_id = auth.user_company_id()
        )
    );

-- RLS Policy: User sessions
CREATE POLICY "User sessions own access" ON user_sessions
    FOR ALL USING (
        is_super_admin() = true OR
        user_id = NULLIF(CURRENT_SETTING('request.jwt_claim_user_id', true), '')::UUID
    );

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Insert Default Company (sample)
INSERT INTO companies (company_code, company_name, legal_name, gst_number, address, city, state, country, phone, email)
VALUES
    ('DEFAULT', 'Default Organization', 'Default Organization Pvt. Ltd.', '09AAAAA0000A1Z5', '123 Business Park, Sector 62', 'Noida', 'Uttar Pradesh', 'India', '+91-120-1234567', 'info@default.com')
ON CONFLICT (company_code) DO NOTHING;

-- Insert Default Roles (not company-specific)
INSERT INTO roles (role_code, role_name, description, level) VALUES
('ADMIN', 'Administrator', 'Full system access', 1),
('MANAGER', 'Manager', 'Manager level access', 2),
('USER', 'User', 'Standard user access', 3),
('VIEWER', 'Viewer', 'Read-only access', 4)
ON CONFLICT (role_code) DO NOTHING;

-- Insert Default Admin User
INSERT INTO users (email, password_hash, name, is_active, is_super_admin, company_id)
SELECT 'admin@erp.com', '$2b$10$YourHashedPasswordHere', 'System Admin', true, true, company_id
FROM companies WHERE company_code = 'DEFAULT'
ON CONFLICT (email) DO NOTHING;

-- Insert Number Series
INSERT INTO number_series (module_name, prefix, current_number) VALUES
('SALES_ENQUIRY', 'ENQ', 0),
('PURCHASE_QUOTE', 'PUR', 0),
('PURCHASE_LABEL', 'LBL', 0),
('PRICE_ANALYSIS', 'ANL', 0),
('PURCHASE_ORDER', 'PO', 0),
('SALES_ORDER', 'SO', 0),
('GOODS_RECEIPT', 'GRN', 0),
('DELIVERY_CHALLAN', 'DC', 0),
('SALES_INVOICE', 'INV', 0),
('PURCHASE_INVOICE', 'PI', 0)
ON CONFLICT (module_name) DO NOTHING;

-- Insert Default Payment Terms
INSERT INTO payment_terms (terms_code, terms_name, days) VALUES
('NET15', 'Net 15 Days', 15),
('NET30', 'Net 30 Days', 30),
('NET45', 'Net 45 Days', 45),
('NET60', 'Net 60 Days', 60),
('COD', 'Cash on Delivery', 0),
('ADVANCE', 'Advance Payment', 0)
ON CONFLICT (terms_code) DO NOTHING;

-- Insert Default UOM
INSERT INTO uom (uom_code, uom_name) VALUES
('PCS', 'Pieces'),
('KG', 'Kilograms'),
('GMS', 'Grams'),
('LTR', 'Litres'),
('ML', 'Millilitres'),
('BOX', 'Boxes'),
('CTN', 'Cartons'),
('DOZ', 'Dozens'),
('SET', 'Sets'),
('MTR', 'Meters'),
('SQM', 'Square Meters'),
('SQFT', 'Square Feet')
ON CONFLICT (uom_code) DO NOTHING;

-- Insert Default GST Rates
INSERT INTO gst_rates (gst_code, gst_name, rate) VALUES
('GST0', 'Exempt', 0),
('GST5', '5% GST', 5),
('GST12', '12% GST', 12),
('GST18', '18% GST', 18),
('GST28', '28% GST', 28)
ON CONFLICT (gst_code) DO NOTHING;

-- Insert Default Currencies
INSERT INTO currencies (currency_code, currency_name, symbol) VALUES
('INR', 'Indian Rupee', '₹'),
('USD', 'US Dollar', '$'),
('GBP', 'British Pound', '£'),
('EUR', 'Euro', '€'),
('AUD', 'Australian Dollar', 'A$'),
('CAD', 'Canadian Dollar', 'C$'),
('SGD', 'Singapore Dollar', 'S$')
ON CONFLICT (currency_code) DO NOTHING;

-- Insert Default Zones
INSERT INTO zones (zone_code, zone_name, description) VALUES
('NORTH', 'North Zone', 'Northern region'),
('SOUTH', 'South Zone', 'Southern region'),
('EAST', 'East Zone', 'Eastern region'),
('WEST', 'West Zone', 'Western region'),
('CENTRAL', 'Central Zone', 'Central region')
ON CONFLICT (zone_code) DO NOTHING;

-- Insert Default Locations
INSERT INTO locations (location_code, location_name, zone_id) VALUES
('WH-DELHI', 'Delhi Warehouse', (SELECT zone_id FROM zones WHERE zone_code = 'NORTH')),
('WH-MUMBAI', 'Mumbai Warehouse', (SELECT zone_id FROM zones WHERE zone_code = 'WEST')),
('WH-BANGALORE', 'Bangalore Warehouse', (SELECT zone_id FROM zones WHERE zone_code = 'SOUTH'))
ON CONFLICT (location_code) DO NOTHING;

-- Insert Default Haulage Rates (with company context)
INSERT INTO haulage_master (location, rate_per_cbm, description)
SELECT 'DELHI', 185000, 'Delhi warehouse rate'
WHERE EXISTS (SELECT 1 FROM companies WHERE company_code = 'DEFAULT')
ON CONFLICT (company_id, location) DO NOTHING;

INSERT INTO haulage_master (location, rate_per_cbm, description)
SELECT 'MUMBAI', 85000, 'Mumbai warehouse rate'
WHERE EXISTS (SELECT 1 FROM companies WHERE company_code = 'DEFAULT')
ON CONFLICT (company_id, location) DO NOTHING;

-- Insert Default Freight Types
INSERT INTO freight_master (origin, destination, freight_type, rate_per_cbm, description) VALUES
(NULL, NULL, 'AIR', 150, 'Air freight rate per CBM'),
(NULL, NULL, 'SEA', 50, 'Sea freight rate per CBM'),
(NULL, NULL, 'ROAD', 80, 'Road freight rate per CBM'),
(NULL, NULL, 'RAIL', 40, 'Rail freight rate per CBM')
ON CONFLICT (origin, destination, freight_type) DO NOTHING;

-- Insert Default Workflow Definitions
INSERT INTO workflow_definitions (workflow_code, workflow_name, entity_type, description) VALUES
('ENQUIRY_APPROVAL', 'Enquiry Approval Workflow', 'sales_enquiry_orders', 'Approval workflow for sales enquiries'),
('QUOTE_APPROVAL', 'Quote Approval Workflow', 'purchase_quotes', 'Approval workflow for purchase quotes'),
('PRICE_APPROVAL', 'Price Analysis Approval Workflow', 'price_analysis_master', 'Approval workflow for price analysis')
ON CONFLICT (workflow_code) DO NOTHING;

-- Insert Default Email Templates
INSERT INTO email_templates (template_code, template_name, subject, body, variables) VALUES
('ENQUIRY_CONFIRMATION', 'Enquiry Confirmation', 'Your enquiry {{enquiry_no}} has been received', 'Dear {{customer_name}},<br><br>Thank you for your enquiry {{enquiry_no}}. We will process it shortly.<br><br>Regards,<br>Team', '["enquiry_no", "customer_name"]'),
('ENQUIRY_APPROVED', 'Enquiry Approved', 'Your enquiry {{enquiry_no}} has been approved', 'Dear {{customer_name}},<br><br>Your enquiry {{enquiry_no}} has been approved.<br><br>Regards,<br>Team', '["enquiry_no", "customer_name"]'),
('QUOTE_READY', 'Quote Ready', 'Your quote {{quote_no}} is ready', 'Dear {{vendor_name}},<br><br>Quote {{quote_no}} has been created for your review.<br><br>Regards,<br>Team', '["quote_no", "vendor_name"]'),
('ORDER_CONFIRMATION', 'Order Confirmation', 'Order {{order_no}} Confirmed', 'Dear {{customer_name}},<br><br>Your order {{order_no}} has been confirmed.<br><br>Regards,<br>Team', '["order_no", "customer_name"]')
ON CONFLICT (template_code) DO NOTHING;

-- Insert Default Permissions
INSERT INTO permissions (permission_code, permission_name, description) VALUES
-- Users & Auth
('users.view', 'View Users', 'View user list'),
('users.create', 'Create Users', 'Create new users'),
('users.edit', 'Edit Users', 'Edit existing users'),
('users.delete', 'Delete Users', 'Delete users'),
-- Products
('products.view', 'View Products', 'View product list'),
('products.create', 'Create Products', 'Create new products'),
('products.edit', 'Edit Products', 'Edit products'),
('products.delete', 'Delete Products', 'Delete products'),
-- Customers
('customers.view', 'View Customers', 'View customer list'),
('customers.create', 'Create Customers', 'Create new customers'),
('customers.edit', 'Edit Customers', 'Edit customers'),
('customers.delete', 'Delete Customers', 'Delete customers'),
-- Vendors
('vendors.view', 'View Vendors', 'View vendor list'),
('vendors.create', 'Create Vendors', 'Create new vendors'),
('vendors.edit', 'Edit Vendors', 'Edit vendors'),
('vendors.delete', 'Delete Vendors', 'Delete vendors'),
-- Sales
('sales.enquiry.view', 'View Sales Enquiries', 'View sales enquiries'),
('sales.enquiry.create', 'Create Sales Enquiries', 'Create new sales enquiries'),
('sales.enquiry.edit', 'Edit Sales Enquiries', 'Edit sales enquiries'),
('sales.enquiry.approve', 'Approve Sales Enquiries', 'Approve sales enquiries'),
('sales.order.view', 'View Sales Orders', 'View sales orders'),
('sales.order.create', 'Create Sales Orders', 'Create sales orders'),
('sales.order.edit', 'Edit Sales Orders', 'Edit sales orders'),
-- Purchase
('purchase.quote.view', 'View Purchase Quotes', 'View purchase quotes'),
('purchase.quote.create', 'Create Purchase Quotes', 'Create purchase quotes'),
('purchase.quote.edit', 'Edit Purchase Quotes', 'Edit purchase quotes'),
('purchase.quote.approve', 'Approve Purchase Quotes', 'Approve purchase quotes'),
('purchase.order.view', 'View Purchase Orders', 'View purchase orders'),
('purchase.order.create', 'Create Purchase Orders', 'Create purchase orders'),
('purchase.order.edit', 'Edit Purchase Orders', 'Edit purchase orders'),
-- Price Analysis
('price.analysis.view', 'View Price Analysis', 'View price analysis'),
('price.analysis.create', 'Create Price Analysis', 'Create price analysis'),
('price.analysis.edit', 'Edit Price Analysis', 'Edit price analysis'),
('price.analysis.approve', 'Approve Price Analysis', 'Approve price analysis'),
-- Inventory
('inventory.view', 'View Inventory', 'View inventory'),
('inventory.adjust', 'Adjust Inventory', 'Adjust inventory levels'),
('inventory.transfer', 'Transfer Inventory', 'Transfer inventory'),
-- Invoices
('invoices.sales.view', 'View Sales Invoices', 'View sales invoices'),
('invoices.sales.create', 'Create Sales Invoices', 'Create sales invoices'),
('invoices.purchase.view', 'View Purchase Invoices', 'View purchase invoices'),
('invoices.purchase.create', 'Create Purchase Invoices', 'Create purchase invoices'),
-- Reports
('reports.view', 'View Reports', 'View reports'),
('reports.export', 'Export Reports', 'Export reports'),
-- Settings
('settings.view', 'View Settings', 'View system settings'),
('settings.edit', 'Edit Settings', 'Edit system settings')
ON CONFLICT (permission_code) DO NOTHING;

-- Assign all permissions to ADMIN role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'ADMIN'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================
-- ADDITIONAL HELPER FUNCTIONS
-- ============================================

-- Function to calculate landing cost
CREATE OR REPLACE FUNCTION fn_calculate_landing_cost(
    p_product_cost DECIMAL,
    p_freight DECIMAL,
    p_gst_percent DECIMAL,
    p_other_charges DECIMAL DEFAULT 0
)
RETURNS DECIMAL AS $$
DECLARE
    v_gst_amount DECIMAL;
    v_total DECIMAL;
BEGIN
    v_gst_amount := (p_product_cost + p_freight + p_other_charges) * (p_gst_percent / 100);
    v_total := p_product_cost + p_freight + p_other_charges + v_gst_amount;
    RETURN ROUND(v_total, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate margin
CREATE OR REPLACE FUNCTION fn_calculate_margin(
    p_selling_price DECIMAL,
    p_buying_price DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
    v_margin DECIMAL;
BEGIN
    IF p_buying_price = 0 THEN
        RETURN 0;
    END IF;
    v_margin := ((p_selling_price - p_buying_price) / p_buying_price) * 100;
    RETURN ROUND(v_margin, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update inventory quantity
CREATE OR REPLACE FUNCTION fn_update_inventory(
    p_product_id UUID,
    p_location_id UUID,
    p_quantity DECIMAL(15,3),
    p_transaction_type VARCHAR,
    p_reference_type VARCHAR DEFAULT NULL,
    p_reference_id VARCHAR DEFAULT NULL,
    p_batch_number VARCHAR DEFAULT NULL,
    p_unit_cost DECIMAL(15,4) DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_company_id UUID;
    v_inventory_id UUID;
    v_available DECIMAL;
    v_new_quantity DECIMAL;
    v_new_unit_cost DECIMAL;
BEGIN
    v_company_id := NULLIF(CURRENT_SETTING('request.jwt_claim_company_id', true), '')::UUID;

    -- Calculate new values
    v_new_quantity := p_quantity;
    v_new_unit_cost := COALESCE(p_unit_cost, 0);

    -- Update or insert inventory record
    INSERT INTO inventory (company_id, product_id, location_id, batch_number, quantity, available_quantity, unit_cost, total_value)
    VALUES (
        v_company_id,
        p_product_id,
        p_location_id,
        p_batch_number,
        v_new_quantity,
        v_new_quantity,
        v_new_unit_cost,
        v_new_quantity * v_new_unit_cost
    )
    ON CONFLICT (company_id, product_id, location_id, batch_number)
    DO UPDATE SET
        quantity = inventory.quantity + EXCLUDED.quantity,
        available_quantity = inventory.available_quantity + EXCLUDED.quantity,
        unit_cost = CASE
            WHEN EXCLUDED.unit_cost > 0 THEN EXCLUDED.unit_cost
            ELSE inventory.unit_cost
        END,
        total_value = (inventory.quantity + EXCLUDED.quantity) * CASE
            WHEN EXCLUDED.unit_cost > 0 THEN EXCLUDED.unit_cost
            ELSE inventory.unit_cost
        END,
        updated_at = NOW()
    RETURNING inventory_id INTO v_inventory_id;

    -- Record transaction
    INSERT INTO inventory_transactions (
        company_id, transaction_type, reference_type, reference_id,
        product_id, location_id, batch_number, quantity, unit_cost, total_cost, created_by
    ) VALUES (
        v_company_id,
        p_transaction_type, p_reference_type, p_reference_id,
        p_product_id, p_location_id, p_batch_number, p_quantity, p_unit_cost,
        p_quantity * COALESCE(p_unit_cost, 0), p_user_id
    );

    RETURN v_inventory_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get customer balance
CREATE OR REPLACE FUNCTION fn_get_customer_balance(p_customer_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    v_invoiced DECIMAL := 0;
    v_paid DECIMAL := 0;
BEGIN
    SELECT COALESCE(SUM(total_amount), 0) INTO v_invoiced
    FROM sales_invoices
    WHERE customer_id = p_customer_id AND deleted_at IS NULL;

    SELECT COALESCE(SUM(net_amount), 0) INTO v_paid
    FROM payments_received
    WHERE customer_id = p_customer_id;

    RETURN v_invoiced - v_paid;
END;
$$ LANGUAGE plpgsql;

-- Function to get vendor balance
CREATE OR REPLACE FUNCTION fn_get_vendor_balance(p_vendor_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    v_invoiced DECIMAL := 0;
    v_paid DECIMAL := 0;
BEGIN
    SELECT COALESCE(SUM(net_amount), 0) INTO v_invoiced
    FROM purchase_invoices
    WHERE vendor_id = p_vendor_id AND deleted_at IS NULL;

    SELECT COALESCE(SUM(net_amount), 0) INTO v_paid
    FROM payments_made
    WHERE vendor_id = p_vendor_id;

    RETURN v_invoiced - v_paid;
END;
$$ LANGUAGE plpgsql;
