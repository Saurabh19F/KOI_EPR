-- Migration: Add composite indexes for query performance
-- Date: 2026-06-03

-- Sales Enquiry Orders: composite index for filtered list views (company + status)
CREATE INDEX IF NOT EXISTS idx_sales_enquiry_orders_company_status ON sales_enquiry_orders(company_id, status);

-- Sales Enquiry Orders: index on created_at for date range queries
CREATE INDEX IF NOT EXISTS idx_sales_enquiry_orders_created_at ON sales_enquiry_orders(created_at DESC);

-- Purchase Quotes: composite index for filtered list views
CREATE INDEX IF NOT EXISTS idx_purchase_quotes_company_status ON purchase_quotes(company_id, status);

-- FMS Tasks: composite indexes for dashboard and assignment queries
CREATE INDEX IF NOT EXISTS idx_fms_tasks_company_status ON fms_tasks(company_id, status);
CREATE INDEX IF NOT EXISTS idx_fms_tasks_assigned_status ON fms_tasks(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_fms_tasks_sla_deadline ON fms_tasks(sla_deadline, status) WHERE deleted_at IS NULL;

-- Products: composite indexes for master data queries
CREATE INDEX IF NOT EXISTS idx_products_company_category ON products(company_id, category_id);
CREATE INDEX IF NOT EXISTS idx_products_company_brand ON products(company_id, brand_id);
CREATE INDEX IF NOT EXISTS idx_products_source_status ON products(source, product_status);

-- Customers: composite index for search
CREATE INDEX IF NOT EXISTS idx_customers_company_status ON customers(company_id, status);

-- Notification: index for user notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Audit Logs: index for compliance queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_created ON audit_logs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module_name, created_at DESC);
