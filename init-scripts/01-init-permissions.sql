-- Initialize default departments (NOT modules - people are attributes)
INSERT INTO departments (id, code, name, description, is_active) VALUES
(gen_random_uuid(), 'ADMIN', 'Administration', 'System administration and settings', true),
(gen_random_uuid(), 'SALES', 'Sales Department', 'Sales and marketing activities', true),
(gen_random_uuid(), 'PURCHASE', 'Purchase Department', 'Procurement and vendor management', true),
(gen_random_uuid(), 'ACCOUNTS', 'Accounts Department', 'Finance and accounting', true),
(gen_random_uuid(), 'PRODUCTION', 'Production Department', 'Manufacturing and production', true),
(gen_random_uuid(), 'WAREHOUSE', 'Warehouse Department', 'Inventory and warehouse management', true),
(gen_random_uuid(), 'HR', 'Human Resources', 'Employee management', true);

-- Initialize default permissions for ERP modules
INSERT INTO permissions (id, module, action, code, description) VALUES
-- Users module
(gen_random_uuid(), 'users', 'create', 'users.create', 'Create users'),
(gen_random_uuid(), 'users', 'read', 'users.read', 'View users'),
(gen_random_uuid(), 'users', 'update', 'users.update', 'Update users'),
(gen_random_uuid(), 'users', 'delete', 'users.delete', 'Delete users'),

-- Departments module
(gen_random_uuid(), 'departments', 'create', 'departments.create', 'Create departments'),
(gen_random_uuid(), 'departments', 'read', 'departments.read', 'View departments'),
(gen_random_uuid(), 'departments', 'update', 'departments.update', 'Update departments'),

-- Masters module
(gen_random_uuid(), 'masters', 'create', 'masters.create', 'Create master data'),
(gen_random_uuid(), 'masters', 'read', 'masters.read', 'View master data'),
(gen_random_uuid(), 'masters', 'update', 'masters.update', 'Update master data'),
(gen_random_uuid(), 'masters', 'delete', 'masters.delete', 'Delete master data'),

-- Sales module (ONE module, people tracked by sales_person_id)
(gen_random_uuid(), 'sales', 'create', 'sales.create', 'Create sales'),
(gen_random_uuid(), 'sales', 'read', 'sales.read', 'View sales'),
(gen_random_uuid(), 'sales', 'update', 'sales.update', 'Update sales'),
(gen_random_uuid(), 'sales', 'approve', 'sales.approve', 'Approve sales'),
(gen_random_uuid(), 'sales', 'delete', 'sales.delete', 'Delete sales'),

-- Purchase module (ONE module, people tracked by purchase_person_id)
(gen_random_uuid(), 'purchase', 'create', 'purchase.create', 'Create purchase'),
(gen_random_uuid(), 'purchase', 'read', 'purchase.read', 'View purchase'),
(gen_random_uuid(), 'purchase', 'update', 'purchase.update', 'Update purchase'),
(gen_random_uuid(), 'purchase', 'approve', 'purchase.approve', 'Approve purchase'),
(gen_random_uuid(), 'purchase', 'delete', 'purchase.delete', 'Delete purchase'),

-- Workflows module
(gen_random_uuid(), 'workflows', 'create', 'workflows.create', 'Create workflows'),
(gen_random_uuid(), 'workflows', 'read', 'workflows.read', 'View workflows'),
(gen_random_uuid(), 'workflows', 'approve', 'workflows.approve', 'Approve workflow steps'),

-- Reports module
(gen_random_uuid(), 'reports', 'read', 'reports.read', 'View reports'),
(gen_random_uuid(), 'reports', 'export', 'reports.export', 'Export reports');

-- Create 11 roles
INSERT INTO roles (id, name, code, description, type) VALUES
(gen_random_uuid(), 'Admin', 'admin', 'System Administrator - Full access', 'system'),
(gen_random_uuid(), 'Management', 'management', 'Management - View all, approve high value', 'system'),
(gen_random_uuid(), 'Sales User', 'sales_user', 'Create/Edit own sales enquiries', 'system'),
(gen_random_uuid(), 'Sales Manager', 'sales_manager', 'Approve sales enquiries', 'system'),
(gen_random_uuid(), 'Purchase User', 'purchase_user', 'Create/Edit own purchase quotes', 'system'),
(gen_random_uuid(), 'Purchase Manager', 'purchase_manager', 'Approve purchase quotes', 'system'),
(gen_random_uuid(), 'MIS User', 'mis_user', 'View and export reports', 'system'),
(gen_random_uuid(), 'Costing User', 'costing_user', 'Price analysis and rate management', 'system'),
(gen_random_uuid(), 'Designer', 'designer', 'Artwork and label management', 'system'),
(gen_random_uuid(), 'Finance User', 'finance_user', 'Invoice and payment management', 'system'),
(gen_random_uuid(), 'Viewer', 'viewer', 'Read-only access', 'system');

-- Create permissions for each module
INSERT INTO permissions (id, module, action, code, description) VALUES
-- Sales Enquiry permissions
(gen_random_uuid(), 'sales_enquiry', 'view', 'sales_enquiry.view', 'View sales enquiries'),
(gen_random_uuid(), 'sales_enquiry', 'create', 'sales_enquiry.create', 'Create sales enquiries'),
(gen_random_uuid(), 'sales_enquiry', 'edit', 'sales_enquiry.edit', 'Edit sales enquiries'),
(gen_random_uuid(), 'sales_enquiry', 'delete', 'sales_enquiry.delete', 'Delete sales enquiries'),
(gen_random_uuid(), 'sales_enquiry', 'approve', 'sales_enquiry.approve', 'Approve sales enquiries'),
(gen_random_uuid(), 'sales_enquiry', 'export', 'sales_enquiry.export', 'Export sales enquiries'),

-- Purchase Quote permissions
(gen_random_uuid(), 'purchase_quote', 'view', 'purchase_quote.view', 'View purchase quotes'),
(gen_random_uuid(), 'purchase_quote', 'create', 'purchase_quote.create', 'Create purchase quotes'),
(gen_random_uuid(), 'purchase_quote', 'edit', 'purchase_quote.edit', 'Edit purchase quotes'),
(gen_random_uuid(), 'purchase_quote', 'delete', 'purchase_quote.delete', 'Delete purchase quotes'),
(gen_random_uuid(), 'purchase_quote', 'approve', 'purchase_quote.approve', 'Approve purchase quotes'),
(gen_random_uuid(), 'purchase_quote', 'export', 'purchase_quote.export', 'Export purchase quotes'),

-- Vendor Quote permissions
(gen_random_uuid(), 'vendor_quote', 'view', 'vendor_quote.view', 'View vendor quotes'),
(gen_random_uuid(), 'vendor_quote', 'create', 'vendor_quote.create', 'Create vendor quotes'),
(gen_random_uuid(), 'vendor_quote', 'edit', 'vendor_quote.edit', 'Edit vendor quotes'),
(gen_random_uuid(), 'vendor_quote', 'compare', 'vendor_quote.compare', 'Compare vendor quotes'),
(gen_random_uuid(), 'vendor_quote', 'approve', 'vendor_quote.approve', 'Approve vendor quotes'),

-- Price Analysis permissions
(gen_random_uuid(), 'price_analysis', 'view', 'price_analysis.view', 'View price analysis'),
(gen_random_uuid(), 'price_analysis', 'create', 'price_analysis.create', 'Create price analysis'),
(gen_random_uuid(), 'price_analysis', 'edit', 'price_analysis.edit', 'Edit price analysis'),
(gen_random_uuid(), 'price_analysis', 'lock', 'price_analysis.lock', 'Lock price analysis'),
(gen_random_uuid(), 'price_analysis', 'unlock', 'price_analysis.unlock', 'Unlock price analysis'),

-- Rate FMS permissions
(gen_random_uuid(), 'rate_fms', 'view', 'rate_fms.view', 'View rate FMS'),
(gen_random_uuid(), 'rate_fms', 'create', 'rate_fms.create', 'Create rate FMS'),
(gen_random_uuid(), 'rate_fms', 'edit', 'rate_fms.edit', 'Edit rate FMS'),
(gen_random_uuid(), 'rate_fms', 'approve', 'rate_fms.approve', 'Approve rate FMS'),
(gen_random_uuid(), 'rate_fms', 'monitor', 'rate_fms.monitor', 'Monitor rate FMS'),

-- Masters permissions
(gen_random_uuid(), 'masters', 'view', 'masters.view', 'View master data'),
(gen_random_uuid(), 'masters', 'create', 'masters.create', 'Create master data'),
(gen_random_uuid(), 'masters', 'edit', 'masters.edit', 'Edit master data'),
(gen_random_uuid(), 'masters', 'delete', 'masters.delete', 'Delete master data'),

-- Artwork permissions
(gen_random_uuid(), 'artwork', 'view', 'artwork.view', 'View artwork'),
(gen_random_uuid(), 'artwork', 'create', 'artwork.create', 'Create artwork'),
(gen_random_uuid(), 'artwork', 'edit', 'artwork.edit', 'Edit artwork'),
(gen_random_uuid(), 'artwork', 'approve', 'artwork.approve', 'Approve artwork'),

-- Reports permissions
(gen_random_uuid(), 'reports', 'view', 'reports.view', 'View reports'),
(gen_random_uuid(), 'reports', 'export', 'reports.export', 'Export reports'),
(gen_random_uuid(), 'reports', 'schedule', 'reports.schedule', 'Schedule reports'),

-- Help Ticket permissions
(gen_random_uuid(), 'help_ticket', 'create', 'help_ticket.create', 'Create help tickets'),
(gen_random_uuid(), 'help_ticket', 'view', 'help_ticket.view', 'View help tickets'),
(gen_random_uuid(), 'help_ticket', 'assign', 'help_ticket.assign', 'Assign help tickets'),
(gen_random_uuid(), 'help_ticket', 'resolve', 'help_ticket.resolve', 'Resolve help tickets'),

-- Users permissions
(gen_random_uuid(), 'users', 'view', 'users.view', 'View users'),
(gen_random_uuid(), 'users', 'create', 'users.create', 'Create users'),
(gen_random_uuid(), 'users', 'edit', 'users.edit', 'Edit users'),
(gen_random_uuid(), 'users', 'delete', 'users.delete', 'Delete users'),
(gen_random_uuid(), 'users', 'assign_role', 'users.assign_role', 'Assign roles');
