# ERP System - Complete Summary

## System Overview

**Centralized ERP Platform** - A modular, scalable, workflow-driven platform built with NestJS + PostgreSQL + Next.js.

### Architecture Decision
**Do not build as separate person-wise forms.**
Build as: Central database + modular backend + role-based workflows + configurable FMS + calculation engine.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js + React + TypeScript |
| Backend | NestJS + TypeScript |
| Database | PostgreSQL |
| Cache/Queue | Redis + BullMQ |
| File Storage | S3 / MinIO |
| Auth | JWT + Refresh Tokens |
| AuthZ | RBAC + Permission Matrix |

---

## Project Structure

```
ERP/
├── apps/api/                    # NestJS Backend
│   └── src/
│       └── modules/
│           ├── auth/           # JWT Authentication
│           ├── users/          # Users, Roles, Permissions
│           ├── masters/         # Products, Customers, Vendors
│           ├── sales/           # Sales Enquiry Orders
│           ├── purchase/        # Purchase Quotes
│           ├── rate/            # Price Analysis
│           ├── fms/             # Workflow Tracker
│           ├── files/           # File Storage
│           ├── notifications/    # Email, WhatsApp
│           ├── audit/           # Audit Logs
│           └── admin/           # Settings
├── apps/web/                    # Next.js Frontend
├── docker-compose.yml           # PostgreSQL, Redis, MinIO
├── init-scripts/                # Database seeds
└── docs/                        # Documentation
```

---

## Database Schema (30+ Entities)

### Admin Module
- `users` - User accounts with soft delete
- `roles` - ADMIN, SALES_MANAGER, PURCHASE_USER, etc.
- `permissions` - Granular permissions
- `user_roles` - Junction table
- `role_permissions` - Junction table
- `departments` - SALES, PURCHASE, COSTING, etc.
- `companies` - Multi-tenant support
- `approval_matrix` - Configurable approvals
- `number_series` - Auto-generated IDs
- `email_templates` - Email templates

### Masters Module
- `product_categories` - BRD, KRI, SNA, BVR
- `segments` - SS, BB, RB, FF
- `component_groups` - GRP, ORG
- `products` - SKU: CCC-SS-GGG-NNN
- `brands` - Brand management
- `uom_master` - Units of measure
- `gst_rates` - GST percentages
- `customers` - Buyer Code: ZONE-RUNNING
- `vendors` - Vendor management

### Sales Module
- `sales_enquiry_orders` - Enquiry: ENQ-{USER}-{YEAR}-{NO}
- `sales_enquiry_order_items` - Product items with CBM
- `sales_enquiry_documents` - File attachments
- `enquiry_punching_logs` - Status change logs
- `enquiry_email_reminders` - Scheduled reminders

### Purchase Module
- `purchase_quotes` - Quote: PUR-{YEAR}-{NO}
- `purchase_quote_items` - Items with vendor rates
- `vendor_quotes` - Vendor-wise quotes
- `purchase_landing_cost_by_location` - Delhi/Mumbai costs

### Rate Module
- `price_analysis_master` - Analysis: PA-{YEAR}-{NO}
- `price_analysis_items` - Product-wise calculations
- `currency_rate_master` - GBP, USD, CAD, AUD, EURO
- `haulage_master` - Delhi: 185000, Mumbai: 85000
- `freight_master` - Port-wise freight

### FMS Module
- `fms_master` - FMS configurations
- `fms_step_directory` - ACT01, ACT02 steps
- `fms_tasks` - Unique Key: RATEFMS-ENQ-...-ACT01
- `fms_mail_queue` - Email reminders
- `fms_escalations` - Escalation tracking

### Shared
- `attachments` - Centralized file storage
- `notifications` - In-app notifications
- `email_queue` - Email queue
- `status_history` - Status change audit
- `audit_logs` - Full audit trail

---

## Key Features

### 1. SKU Logic (CCC-SS-GGG-NNN)
```
Format: {CategoryCode}-{SegmentCode}-{GroupCode}-{Serial}
Example: BRD-SS-GRP-001
```

### 2. Customer Code (ZONE-RUNNING)
```
Format: {Zone}-{RunningNumber}
Example: USA-000055, DOM-000231
Zones: USA, UK, DOM, EU, etc.
```

### 3. Enquiry Number (ENQ-{USER}-{YEAR}-{RUNNING_NO})
```
Example: ENQ-NEH-2026-0234
```

### 4. FMS Unique Key
```
Format: RATEFMS-{EnquiryNo}-{SKU}-{AssignedUser}-{StepCode}
Example: RATEFMS-ENQ-NEH-2026-0149-SKU001-AMIT-ACT01
```

### 5. Status Workflows

**Sales Enquiry:**
```
draft → submitted → punched → verified → purchase_pending → 
vendor_quote_pending → rate_pending → approval_pending → 
quotation_created → quotation_sent → follow_up → won/lost/cancelled
```

**FMS Task:**
```
pending → in_progress → completed/delayed/escalated
```

**Price Analysis:**
```
draft → calculated → approval_pending → approved → locked
```

---

## Roles & Permissions

### 11 Roles
1. ADMIN - Full access
2. MANAGEMENT - High level access
3. SALES_MANAGER - Sales management
4. SALES_USER - Sales team
5. PURCHASE_MANAGER - Purchase management
6. PURCHASE_USER - Purchase team
7. COSTING_MANAGER - Costing management
8. COSTING_USER - Costing team
9. MIS_USER - Reports only
10. FINANCE_USER - Finance access
11. VIEWER - Read-only

### 40+ Permissions
- MASTERS_VIEW/CREATE/EDIT/DELETE
- PRODUCTS_VIEW/CREATE/EDIT/DELETE
- CUSTOMERS_VIEW/CREATE/EDIT/DELETE
- SALES_VIEW/CREATE/EDIT/DELETE/APPROVE
- PURCHASE_VIEW/CREATE/EDIT/DELETE/APPROVE
- RATE_VIEW/CREATE/EDIT/DELETE/APPROVE/LOCK
- FMS_VIEW/CREATE/EDIT/UPDATE/ASSIGN
- REPORTS_VIEW/EXPORT
- ADMIN_FULL/SETTINGS/USERS

---

## API Routes

### Authentication
```
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

### Masters
```
GET  /api/v1/masters/categories
GET  /api/v1/masters/segments
GET  /api/v1/masters/groups
GET  /api/v1/masters/brands
GET  /api/v1/masters/products
GET  /api/v1/masters/products/sku/:sku
POST /api/v1/masters/products/generate-sku
GET  /api/v1/masters/customers
GET  /api/v1/masters/vendors
GET  /api/v1/masters/uoms
GET  /api/v1/masters/gst-rates
```

### Sales
```
GET    /api/v1/sales-enquiries
POST   /api/v1/sales-enquiries
GET    /api/v1/sales-enquiries/:id
PATCH  /api/v1/sales-enquiries/:id/status
POST   /api/v1/sales-enquiries/:id/items
GET    /api/v1/sales-enquiries/:id/documents
```

### Purchase
```
GET    /api/v1/purchase-quotes
POST   /api/v1/purchase-quotes
GET    /api/v1/purchase-quotes/items/:itemId/vendor-quotes
GET    /api/v1/purchase-quotes/items/:itemId/vendor-quotes/compare
GET    /api/v1/purchase-quotes/items/:itemId/landing-costs/best
```

### Rate
```
GET  /api/v1/rate/analysis
POST /api/v1/rate/analysis/:id/approve
GET  /api/v1/rate/currency-rates
GET  /api/v1/rate/haulage-rates
GET  /api/v1/rate/freight-rates
```

### FMS
```
GET  /api/v1/fms/tasks
GET  /api/v1/fms/tasks/my
GET  /api/v1/fms/tasks/delayed
PATCH /api/v1/fms/tasks/:id/complete
PATCH /api/v1/fms/tasks/:id/escalate
GET  /api/v1/fms/dashboard/stats
```

---

## Default Login

| Field | Value |
|-------|-------|
| Email | admin@erp.com |
| Password | admin123 |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start infrastructure
docker-compose up -d postgres redis minio

# 3. Run database migrations (automatic with TypeORM)

# 4. Run API
cd apps/api && npm run dev

# 5. Run Web
cd apps/web && npm run dev
```

---

## Future Modules (Phase 7+)

- Inventory Management
- Production / Project FMS
- Finance / Accounting
- Sales Quotation
- Purchase Order
- Invoice
- Customer Portal
- Vendor Portal
- Mobile App

---

## Documentation Files

1. README.md - This file
2. MODULE_MAP.md - 19 Modules
3. DESIGN_PRINCIPLES.md - Architecture decisions
4. MULTITENANT_RULES.md - Multi-tenant setup
5. PERMISSION_MATRIX.md - Roles & permissions
6. MASTER_DATA.md - Master entities
7. PRODUCT_MASTER.md - SKU logic
8. SKU_LOGIC.md - Format details
9. CUSTOMER_MASTER.md - Buyer code
10. SALES_ENQUIRY.md - Sales workflow
11. PURCHASE_QUOTE.md - Purchase workflow
12. RATE_ANALYSIS.md - Rate calculation
13. FMS_ARCHITECTURE.md - Workflow tracker
14. WORKFLOW.md - End-to-end flow
15. API_ARCHITECTURE.md - All routes
16. FRONTEND_UI.md - Next.js structure
17. MIGRATION_GUIDE.md - Apps Script → ERP
18. IMPLEMENTATION_ROADMAP.md - Phase 0-12
19. COMPLETE_ENTITIES.md - Full schema

---

## Implementation Phases

| Phase | Module | Duration |
|-------|--------|----------|
| Phase 0 | Foundation | 1 week |
| Phase 1 | Masters | 2 weeks |
| Phase 2 | Sales Enquiry | 2 weeks |
| Phase 3 | Purchase Quote | 1 week |
| Phase 4 | Rate FMS | 2 weeks |
| Phase 5 | Price Analysis | 2 weeks |
| Phase 6-9 | Label/Reports/Notifications/Dashboard | 4 weeks |
| Phase 10-11 | Integration & Migration | 4 weeks |
| Phase 12 | Go Live | 1 week |

**Total: ~19 weeks (~5 months)**

---

## Important Notes

1. **No Person-Wise Modules** - People are FK references, not separate modules
2. **Multi-Tenant** - company_id on every table
3. **Soft Delete** - deleted_at field for all transactional tables
4. **Status History** - Every status change logged
5. **Audit Logs** - Full action trail
6. **Auto-generated IDs** - Number series for enquiry, quote, analysis numbers
