-- Convert column types to UUID to resolve datatype mismatch (character varying vs uuid)
-- We use NULLIF to handle any empty strings safely before casting to uuid

-- 1. sales_enquiry_orders.customer_id
ALTER TABLE sales_enquiry_orders 
  ALTER COLUMN customer_id TYPE uuid USING NULLIF(customer_id, '')::uuid;

-- 2. sales_enquiry_order_items.enquiry_order_id
ALTER TABLE sales_enquiry_order_items 
  ALTER COLUMN enquiry_order_id TYPE uuid USING NULLIF(enquiry_order_id, '')::uuid;

-- 3. purchase_quotes.enquiry_order_id
ALTER TABLE purchase_quotes 
  ALTER COLUMN enquiry_order_id TYPE uuid USING NULLIF(enquiry_order_id, '')::uuid;

-- 4. price_analysis_master.enquiry_order_id and customer_id
ALTER TABLE price_analysis_master 
  ALTER COLUMN enquiry_order_id TYPE uuid USING NULLIF(enquiry_order_id, '')::uuid,
  ALTER COLUMN customer_id TYPE uuid USING NULLIF(customer_id, '')::uuid;

-- Clean up orphaned records to ensure migration runs without constraint violations
DELETE FROM sales_enquiry_order_items WHERE enquiry_order_id NOT IN (SELECT enquiry_order_id FROM sales_enquiry_orders);
DELETE FROM fms_tasks WHERE enquiry_order_id NOT IN (SELECT enquiry_order_id FROM sales_enquiry_orders);
UPDATE sales_enquiry_orders SET customer_id = NULL WHERE customer_id NOT IN (SELECT customer_id FROM customers);
UPDATE purchase_quotes SET enquiry_order_id = NULL WHERE enquiry_order_id IS NOT NULL AND enquiry_order_id NOT IN (SELECT enquiry_order_id FROM sales_enquiry_orders);
UPDATE price_analysis_master SET enquiry_order_id = NULL WHERE enquiry_order_id IS NOT NULL AND enquiry_order_id NOT IN (SELECT enquiry_order_id FROM sales_enquiry_orders);
UPDATE price_analysis_master SET customer_id = NULL WHERE customer_id IS NOT NULL AND customer_id NOT IN (SELECT customer_id FROM customers);

-- Enforce Foreign Key Constraints

-- 1. Link Sales Enquiry Orders to Customers
ALTER TABLE sales_enquiry_orders DROP CONSTRAINT IF EXISTS fk_sales_enquiry_orders_customer;
ALTER TABLE sales_enquiry_orders
  ADD CONSTRAINT fk_sales_enquiry_orders_customer
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL;

-- 2. Link Sales Enquiry Items to Sales Enquiry Orders
ALTER TABLE sales_enquiry_order_items DROP CONSTRAINT IF EXISTS fk_sales_enquiry_order_items_enquiry;
ALTER TABLE sales_enquiry_order_items
  ADD CONSTRAINT fk_sales_enquiry_order_items_enquiry
  FOREIGN KEY (enquiry_order_id) REFERENCES sales_enquiry_orders(enquiry_order_id) ON DELETE CASCADE;

-- 3. Link FMS Tasks to Sales Enquiry Orders
ALTER TABLE fms_tasks DROP CONSTRAINT IF EXISTS fk_fms_tasks_enquiry;
ALTER TABLE fms_tasks
  ADD CONSTRAINT fk_fms_tasks_enquiry
  FOREIGN KEY (enquiry_order_id) REFERENCES sales_enquiry_orders(enquiry_order_id) ON DELETE CASCADE;

-- 4. Link Purchase Quotes to Sales Enquiry Orders
ALTER TABLE purchase_quotes DROP CONSTRAINT IF EXISTS fk_purchase_quotes_enquiry;
ALTER TABLE purchase_quotes
  ADD CONSTRAINT fk_purchase_quotes_enquiry
  FOREIGN KEY (enquiry_order_id) REFERENCES sales_enquiry_orders(enquiry_order_id) ON DELETE SET NULL;

-- 5. Link Price Analysis Master to Sales Enquiry Orders
ALTER TABLE price_analysis_master DROP CONSTRAINT IF EXISTS fk_price_analysis_master_enquiry;
ALTER TABLE price_analysis_master
  ADD CONSTRAINT fk_price_analysis_master_enquiry
  FOREIGN KEY (enquiry_order_id) REFERENCES sales_enquiry_orders(enquiry_order_id) ON DELETE SET NULL;

-- 6. Link Price Analysis Master to Customers
ALTER TABLE price_analysis_master DROP CONSTRAINT IF EXISTS fk_price_analysis_master_customer;
ALTER TABLE price_analysis_master
  ADD CONSTRAINT fk_price_analysis_master_customer
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL;
