# KOI-ERPP - Complete Project Blueprint

## 📁 Project Structure

```
KOI-ERPP/
├── apps/
│   ├── api/                          # NestJS Backend API
│   │   ├── src/
│   │   │   ├── main.ts               # Application entry point
│   │   │   ├── app.module.ts         # Root module
│   │   │   │
│   │   │   ├── common/              # Shared utilities
│   │   │   │   ├── decorators/       # Custom decorators (@Company, @Transaction)
│   │   │   │   ├── dto/             # Common DTOs (pagination, validation)
│   │   │   │   ├── entities/         # Base entities
│   │   │   │   ├── filters/         # Exception filters
│   │   │   │   ├── guards/          # Custom guards
│   │   │   │   ├── interceptors/     # Request interceptors
│   │   │   │   ├── tenant/          # Multi-tenancy implementation
│   │   │   │   ├── typeorm/         # TypeORM configuration
│   │   │   │   ├── export/          # Export utilities (Excel, PDF)
│   │   │   │   └── utils/           # Helper utilities
│   │   │   │
│   │   │   ├── database/           # Database configuration
│   │   │   │   ├── data-source.ts   # TypeORM data source
│   │   │   │   ├── migrations/      # Database migrations
│   │   │   │   └── seed*.ts         # Seed scripts
│   │   │   │
│   │   │   └── modules/             # Feature modules (23 modules)
│   │   │       ├── auth/            # Authentication v1
│   │   │       ├── auth-v2/         # Authentication v2 (current)
│   │   │       ├── users/           # User management
│   │   │       ├── masters/         # Master data
│   │   │       ├── sales/           # Sales enquiries
│   │   │       ├── sales-order/     # Sales orders
│   │   │       ├── purchase/        # Purchase quotes
│   │   │       ├── purchase-order/  # Purchase orders
│   │   │       ├── rate/            # Rate analysis
│   │   │       ├── financial/       # Financial accounts
│   │   │       ├── inventory/       # Inventory management
│   │   │       ├── inventory-v2/    # Inventory tracking
│   │   │       ├── workflow/        # Workflow engine
│   │   │       ├── fms/             # FMS (Task Management)
│   │   │       ├── reports/         # Reports v1
│   │   │       ├── reports-v2/      # Reports v2
│   │   │       ├── notifications/   # Notifications
│   │   │       ├── files/           # File management
│   │   │       ├── audit/           # Audit logging
│   │   │       ├── admin/           # Admin settings
│   │   │       ├── platform/        # Multi-tenant platform
│   │   │       ├── search/          # Global search
│   │   │       └── events/          # Event bus
│   │   │
│   │   ├── test/                   # API tests
│   │   ├── .env                    # Environment variables
│   │   └── package.json
│   │
│   └── web/                        # Next.js Frontend
│       ├── src/
│       │   ├── app/               # App router pages
│       │   │   ├── (auth)/       # Auth pages (login, register)
│       │   │   ├── (dashboard)/   # Dashboard pages
│       │   │   │   ├── masters/   # Master data pages
│       │   │   │   ├── sales/     # Sales pages
│       │   │   │   ├── purchase/  # Purchase pages
│       │   │   │   ├── rate/      # Rate analysis pages
│       │   │   │   ├── inventory/ # Inventory pages
│       │   │   │   ├── financial/ # Financial pages
│       │   │   │   ├── reports/   # Reports pages
│       │   │   │   └── users/    # User management pages
│       │   │   ├── api/          # API routes (if needed)
│       │   │   └── layout.tsx    # Root layout
│       │   │
│       │   ├── components/       # React components
│       │   │   ├── ui/          # Base UI components
│       │   │   ├── forms/       # Form components
│       │   │   ├── tables/      # Table components
│       │   │   ├── sales/       # Sales components
│       │   │   ├── purchase/    # Purchase components
│       │   │   ├── rate/        # Rate components
│       │   │   └── layout/      # Layout components
│       │   │
│       │   ├── lib/             # Utilities
│       │   │   ├── api.ts      # API client
│       │   │   ├── auth.ts     # Auth utilities
│       │   │   └── utils.ts    # Helper functions
│       │   │
│       │   ├── hooks/           # Custom React hooks
│       │   ├── providers/       # Context providers
│       │   └── types/          # TypeScript types
│       │
│       └── package.json
│
├── packages/                       # Shared packages
│
├── docs/                          # Documentation
│
├── package.json                   # Root package.json
├── turbo.json                    # Turborepo config
├── nx.json                       # Nx config
└── README.md
```

---

## 👥 Users & Roles

### Default Users (Seeded)

| Email | Password | Role | Permissions |
|-------|----------|------|-------------|
| admin@erp.com | Demo@1234 | ADMIN | All permissions |
| vikram@erp.com | Demo@1234 | SALES_MANAGER | Sales, Rate, FMS |
| priya@erp.com | Demo@1234 | PURCHASE_MANAGER | Purchase, Rate |
| sneha@erp.com | Demo@1234 | MIS | Reports, Audit |
| rahul@erp.com | Demo@1234 | SALES_EXECUTIVE | Sales only |
| amit@erp.com | Demo@1234 | PURCHASE_EXECUTIVE | Purchase only |
| neha@erp.com | Demo@1234 | WAREHOUSE | Inventory |

### Roles & Permissions

```
ADMIN
├── DASHBOARD_VIEW
├── MASTERS_VIEW, CREATE, EDIT, DELETE
├── SALES_VIEW, CREATE, EDIT, DELETE, APPROVE
├── PURCHASE_VIEW, CREATE, EDIT, DELETE, APPROVE
├── RATE_VIEW, CREATE, EDIT, APPROVE, LOCK
├── FMS_VIEW, CREATE, EDIT, ASSIGN
├── REPORTS_VIEW, EXPORT
├── ADMIN_USERS, ADMIN_ROLES, ADMIN_SETTINGS

SALES_MANAGER
├── DASHBOARD_VIEW
├── MASTERS_VIEW
├── SALES_VIEW, CREATE, EDIT, DELETE
├── RATE_VIEW, CREATE, EDIT
├── FMS_VIEW, CREATE, ASSIGN
├── REPORTS_VIEW

PURCHASE_MANAGER
├── DASHBOARD_VIEW
├── MASTERS_VIEW
├── PURCHASE_VIEW, CREATE, EDIT, DELETE
├── RATE_VIEW, CREATE, EDIT, APPROVE
├── REPORTS_VIEW

MIS
├── DASHBOARD_VIEW
├── MASTERS_VIEW
├── REPORTS_VIEW, EXPORT
├── AUDIT_VIEW

WAREHOUSE
├── DASHBOARD_VIEW
├── INVENTORY_VIEW, EDIT
```

---

## 🔌 API Endpoints

### Base URL: `http://localhost:3001/api/v1`

### Authentication (`/auth-v2`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /auth-v2/login | User login | ❌ |
| POST | /auth-v2/refresh | Refresh token | ❌ |
| GET | /auth-v2/me | Get current user | ✅ |
| POST | /auth-v2/logout | Logout | ✅ |
| POST | /auth-v2/change-password | Change password | ✅ |
| POST | /auth-v2/forgot-password | Forgot password | ❌ |
| POST | /auth-v2/reset-password | Reset password | ❌ |
| POST | /auth-v2/two-factor/setup | Setup 2FA | ✅ |
| GET | /auth-v2/sessions | List sessions | ✅ |
| POST | /auth-v2/sessions/revoke | Revoke session | ✅ |

### Users (`/users`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /users | List all users |
| POST | /users | Create user |
| GET | /users/:id | Get user by ID |
| PATCH | /users/:id | Update user |
| DELETE | /users/:id | Delete user |
| PATCH | /users/:id/change-password | Change password |
| PATCH | /users/:id/assign-roles | Assign roles |
| GET | /users/roles | List roles |
| POST | /users/roles | Create role |
| GET | /users/departments | List departments |
| POST | /users/departments | Create department |

### Master Data (`/masters`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /masters/products | List products |
| POST | /masters/products | Create product |
| GET | /masters/products/:id | Get product |
| PATCH | /masters/products/:id | Update product |
| DELETE | /masters/products/:id | Delete product |
| POST | /masters/products/generate-sku | Generate SKU |
| GET | /masters/customers | List customers |
| POST | /masters/customers | Create customer |
| GET | /masters/customers/:id | Get customer |
| PATCH | /masters/customers/:id | Update customer |
| GET | /masters/vendors | List vendors |
| POST | /masters/vendors | Create vendor |
| GET | /masters/vendors/:id | Get vendor |
| PATCH | /masters/vendors/:id | Update vendor |
| GET | /masters/categories | List categories |
| GET | /masters/brands | List brands |
| GET | /masters/zones | List zones |
| GET | /masters/locations | List locations |
| GET | /masters/currencies | List currencies |
| GET | /masters/gst-rates | List GST rates |
| GET | /masters/payment-terms | List payment terms |

### Sales (`/sales-enquiries`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /sales-enquiries | List enquiries |
| POST | /sales-enquiries | Create enquiry |
| GET | /sales-enquiries/:id | Get enquiry |
| PATCH | /sales-enquiries/:id | Update enquiry |
| PATCH | /sales-enquiries/:id/status | Change status |
| DELETE | /sales-enquiries/:id | Delete enquiry |
| POST | /sales-enquiries/:id/items | Add item |
| GET | /sales-enquiries/:id/items | Get items |
| PATCH | /sales-enquiries/items/:itemId | Update item |
| DELETE | /sales-enquiries/items/:itemId | Delete item |
| POST | /sales-enquiries/:id/documents | Add document |
| GET | /sales-enquiries/:id/reminders | Get reminders |
| POST | /sales-enquiries/:id/reminders | Add reminder |

### Purchase (`/purchase`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /purchase/quotes | List quotes |
| POST | /purchase/quotes | Create quote |
| POST | /purchase/quotes/from-enquiry/:id | Create from enquiry |
| GET | /purchase/quotes/:id | Get quote |
| PATCH | /purchase/quotes/:id | Update quote |
| POST | /purchase/quotes/:id/submit | Submit quote |
| POST | /purchase/quotes/:id/approve | Approve quote |
| POST | /purchase/quotes/:id/items | Add item |
| GET | /purchase/quotes/:quoteId/compare | Compare vendors |
| POST | /purchase/quotes/:quoteId/auto-select | Auto-select vendor |
| GET | /purchase/labels | List labels |
| POST | /purchase/labels | Create label |
| GET | /purchase/labels/:id | Get label |

### Rate Analysis (`/rate`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /rate/analysis | List analyses |
| POST | /rate/analysis | Create analysis |
| POST | /rate/analysis/from-quote/:id | Create from quote |
| GET | /rate/analysis/:id | Get analysis |
| PATCH | /rate/analysis/:id | Update analysis |
| POST | /rate/analysis/:id/calculate | Calculate rates |
| POST | /rate/analysis/:id/submit | Submit |
| POST | /rate/analysis/:id/approve | Approve |
| POST | /rate/analysis/:id/lock | Lock rates |
| GET | /rate/haulage | List haulage rates |
| GET | /rate/currency | List currencies |
| GET | /rate/final-currency-rates | Final rates |

### Inventory (`/inventory`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /inventory/warehouses | List warehouses |
| POST | /inventory/warehouses | Create warehouse |
| GET | /inventory/stock | Get stock overview |
| GET | /inventory/stock/product/:id | Stock by product |
| GET | /inventory/stock/summary | Stock summary |
| POST | /inventory/adjust | Adjust stock |
| POST | /inventory/transfer | Transfer stock |
| GET | /inventory/movements | Stock movements |
| GET | /inventory/alerts/low-stock | Low stock alerts |

### Inventory Tracking (`/inventory-tracking`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /inventory-tracking/batches | Create batch |
| GET | /inventory-tracking/batches | List batches |
| GET | /inventory-tracking/batches/expiring | Expiring batches |
| POST | /inventory-tracking/serial-numbers | Add serial numbers |
| POST | /inventory-tracking/reservations | Create reservation |
| POST | /inventory-tracking/transfers | Create transfer |
| POST | /inventory-tracking/counts | Create stock count |
| GET | /inventory-tracking/valuation | Stock valuation |

### Financial (`/financial`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /financial/accounts | List accounts |
| POST | /financial/accounts | Create account |
| GET | /financial/accounts/:id | Get account |
| GET | /financial/accounts/:id/balance | Account balance |
| GET | /financial/journal-entries | List journal entries |
| POST | /financial/journal-entries | Create journal entry |
| PATCH | /financial/journal-entries/:id/post | Post entry |
| GET | /financial/payments | List payments |
| POST | /financial/payments | Create payment |
| GET | /financial/accounts-payable | Payables |
| GET | /financial/accounts-receivable | Receivables |
| GET | /financial/reports/trial-balance | Trial balance |
| GET | /financial/reports/balance-sheet | Balance sheet |
| GET | /financial/reports/profit-loss | P&L report |

### Sales Orders (`/sales-orders`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /sales-orders | List orders |
| POST | /sales-orders | Create order |
| GET | /sales-orders/:id | Get order |
| PATCH | /sales-orders/:id/confirm | Confirm order |
| PATCH | /sales-orders/:id/cancel | Cancel order |
| POST | /sales-orders/delivery-notes | Create delivery note |
| GET | /sales-orders/delivery-notes | List delivery notes |
| POST | /sales-orders/invoices | Create invoice |
| GET | /sales-orders/invoices | List invoices |
| GET | /sales-orders/invoices/:id/pdf | Download PDF |

### Purchase Orders (`/purchase-orders`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /purchase-orders | List orders |
| POST | /purchase-orders | Create order |
| GET | /purchase-orders/:id | Get order |
| PATCH | /purchase-orders/:id/approve | Approve order |
| PATCH | /purchase-orders/:id/cancel | Cancel order |
| POST | /purchase-orders/grns | Create GRN |
| GET | /purchase-orders/grns | List GRNs |
| POST | /purchase-orders/invoices | Create invoice |
| GET | /purchase-orders/invoices | List invoices |

### Workflow (`/workflows`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /workflows/definitions | List definitions |
| POST | /workflows/definitions | Create definition |
| GET | /workflows/instances | List instances |
| POST | /workflows/start | Start workflow |
| GET | /workflows/instances/:id | Get instance |
| POST | /workflows/instances/:id/transition | Transition |

### Approvals (`/approvals`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /approvals | List approvals |
| GET | /approvals/pending | Pending approvals |
| GET | /approvals/summary | Approval summary |
| GET | /approvals/:id | Get approval |
| POST | /approvals/:id/approve | Approve |
| POST | /approvals/:id/reject | Reject |
| POST | /approvals/:id/revision | Request revision |
| POST | /approvals/:id/delegate | Delegate |

### FMS (`/fms`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /fms/tasks | List tasks |
| POST | /fms/tasks | Create task |
| GET | /fms/tasks/my | My tasks |
| GET | /fms/tasks/delayed | Delayed tasks |
| GET | /fms/tasks/:id | Get task |
| PATCH | /fms/tasks/:id/assign | Assign task |
| PATCH | /fms/tasks/:id/start | Start task |
| PATCH | /fms/tasks/:id/complete | Complete task |
| GET | /fms/dashboard/stats | Dashboard stats |

### Reports (`/reports`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /reports/dashboard | Dashboard data |
| GET | /reports/sales | Sales report |
| GET | /reports/sales/summary | Sales summary |
| GET | /reports/purchase | Purchase report |
| GET | /reports/vendor-comparison | Vendor comparison |
| GET | /reports/rate-analysis | Rate analysis report |
| GET | /reports/fms | FMS report |
| GET | /reports/products | Products report |
| GET | /reports/products/low-stock | Low stock report |
| GET | /reports/export/excel/:type | Export Excel |
| GET | /reports/export/pdf/:type | Export PDF |

### Admin (`/admin`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /admin/settings | Get settings |
| POST | /admin/settings | Update settings |
| GET | /admin/number-series/next | Next number |
| GET | /admin/approval-matrix | Approval matrix |
| GET | /admin/tickets | List tickets |
| POST | /admin/tickets | Create ticket |

### Platform (`/platform`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /platform/signup | Company signup |
| GET | /platform/plans | Subscription plans |
| GET | /platform/companies | List companies |
| GET | /platform/companies/:id | Get company |
| PUT | /platform/companies/:id | Update company |
| PATCH | /platform/companies/:id/suspend | Suspend |
| PATCH | /platform/companies/:id/activate | Activate |
| GET | /platform/subscription | Get subscription |
| GET | /platform/usage | Usage stats |
| GET | /platform/branding | Get branding |
| PUT | /platform/branding | Update branding |

### Files (`/files`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /files/presigned-upload | Get upload URL |
| POST | /files/confirm-upload | Confirm upload |
| POST | /files/upload | Direct upload |
| GET | /files/entity/:type/:id | Files for entity |
| GET | /files/presigned-download/:id | Get download URL |
| DELETE | /files/:id | Delete file |

### Notifications (`/notifications`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /notifications | List notifications |
| GET | /notifications/unread-count | Unread count |
| POST | /notifications/mark-all-read | Mark all read |
| PATCH | /notifications/:id/read | Mark as read |
| DELETE | /notifications/:id | Delete |

### Audit (`/audit`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /audit | List audit logs |
| GET | /audit/trail/:module/:id | Get audit trail |
| GET | /audit/user/:userId | User's actions |
| GET | /audit/status-history/:module/:id | Status history |

### Search (`/search`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /search | Global search |
| GET | /search/suggestions | Search suggestions |

---

## 🗄️ Database Schema

### Main Tables

```
users
├── user_id (UUID, PK)
├── email (VARCHAR, UNIQUE)
├── password_hash (VARCHAR)
├── name (VARCHAR)
├── phone (VARCHAR)
├── role_id (UUID, FK)
├── department_id (UUID, FK)
├── company_id (UUID, FK)
├── is_super_admin (BOOLEAN)
├── is_active (BOOLEAN)
├── failed_login_attempts (INT)
├── locked_until (TIMESTAMP)
├── last_login_at (TIMESTAMP)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

roles
├── role_id (UUID, PK)
├── role_name (VARCHAR, UNIQUE)
├── description (TEXT)
├── permissions (JSONB)
├── is_system (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

departments
├── department_id (UUID, PK)
├── department_name (VARCHAR)
├── department_code (VARCHAR)
├── parent_id (UUID, FK, self)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

products
├── product_id (UUID, PK)
├── company_id (UUID, FK)
├── sku (VARCHAR, UNIQUE)
├── product_code (VARCHAR)
├── product_name (VARCHAR)
├── category_id (UUID, FK)
├── brand_id (UUID, FK)
├── uom_id (UUID, FK)
├── mrp (DECIMAL)
├── standard_cost (DECIMAL)
├── is_active (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

customers
├── customer_id (UUID, PK)
├── company_id (UUID, FK)
├── buyer_code (VARCHAR, UNIQUE)
├── customer_name (VARCHAR)
├── email (VARCHAR)
├── phone (VARCHAR)
├── address (TEXT)
├── city (VARCHAR)
├── state (VARCHAR)
├── country (VARCHAR)
├── gstin (VARCHAR)
├── is_active (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

vendors
├── vendor_id (UUID, PK)
├── company_id (UUID, FK)
├── vendor_code (VARCHAR, UNIQUE)
├── vendor_name (VARCHAR)
├── email (VARCHAR)
├── phone (VARCHAR)
├── address (TEXT)
├── city (VARCHAR)
├── state (VARCHAR)
├── country (VARCHAR)
├── gstin (VARCHAR)
├── is_active (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

sales_enquiries
├── enquiry_id (UUID, PK)
├── company_id (UUID, FK)
├── enquiry_no (VARCHAR, UNIQUE)
├── customer_id (UUID, FK)
├── status (ENUM)
├── total_value (DECIMAL)
├── created_by (UUID, FK)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

purchase_quotes
├── quote_id (UUID, PK)
├── company_id (UUID, FK)
├── quote_no (VARCHAR, UNIQUE)
├── vendor_id (UUID, FK)
├── status (ENUM)
├── grand_total (DECIMAL)
├── created_by (UUID, FK)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

accounts
├── account_id (UUID, PK)
├── company_id (UUID, FK)
├── account_code (VARCHAR, UNIQUE)
├── account_name (VARCHAR)
├── account_type (ENUM: ASSET, LIABILITY, REVENUE, EXPENSE, EQUITY)
├── account_nature (ENUM: DEBIT, CREDIT)
├── opening_balance (DECIMAL)
├── is_active (BOOLEAN)
├── is_system (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

journal_entries
├── journal_entry_id (UUID, PK)
├── company_id (UUID, FK)
├── voucher_type (VARCHAR)
├── voucher_number (VARCHAR, UNIQUE)
├── voucher_date (DATE)
├── description (TEXT)
├── is_posted (BOOLEAN)
├── created_by (UUID, FK)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

inventory_stock
├── stock_id (UUID, PK)
├── company_id (UUID, FK)
├── product_id (UUID, FK)
├── location_id (UUID, FK)
├── current_stock (DECIMAL)
├── reorder_level (DECIMAL)
├── max_stock_level (DECIMAL)
├── last_movement_date (TIMESTAMP)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

---

## 🔐 Authentication Flow

```
┌─────────┐                    ┌──────────────┐                    ┌─────────────┐
│ Client  │                    │   Frontend   │                    │    API      │
└────┬────┘                    └──────┬───────┘                    └──────┬──────┘
     │                                  │                                 │
     │ 1. POST /auth-v2/login          │                                 │
     │    {email, password}            │                                 │
     │────────────────────────────────>│                                 │
     │                                  │                                 │
     │                                  │ 2. Validate credentials         │
     │                                  │ 3. Generate JWT + Refresh token │
     │                                  │ 4. Store in cookies             │
     │<─────────────────────────────────│                                 │
     │    {accessToken, refreshToken}  │                                 │
     │                                  │                                 │
     │ 5. GET /masters/products        │                                 │
     │    Authorization: Bearer <token>│                                 │
     │────────────────────────────────────────────────────────>│
     │                                  │                                 │
     │                                  │ 6. Verify JWT                   │
     │                                  │ 7. Check permissions            │
     │                                  │ 8. Return data                 │
     │<─────────────────────────────────────────────────────────│
     │    {data: [...]}                │                                 │
     │                                  │                                 │
     │ 9. JWT expires (15 min)         │                                 │
     │                                  │                                 │
     │ 10. POST /auth-v2/refresh        │                                 │
     │     {refreshToken}              │                                 │
     │────────────────────────────────────────────────────────>│
     │                                  │                                 │
     │                                  │ 11. Verify refresh token        │
     │                                  │ 12. Generate new JWT           │
     │<─────────────────────────────────────────────────────────│
     │     {accessToken}               │                                 │
```

---

## 🏢 Multi-Tenant Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Platform Level                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Company   │  │ Subscription │  │   Usage     │         │
│  │   Admin     │  │   Plans      │  │  Tracking   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ has_many
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Tenant Level (Company)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Users     │  │   Roles     │  │ Department  │         │
│  │             │  │             │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Products   │  │  Customers  │  │   Vendors    │         │
│  │             │  │             │  │              │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Sales     │  │  Purchase   │  │   Rate      │         │
│  │  Enquiries  │  │   Quotes   │  │  Analysis   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Company Isolation

Every entity has `company_id`:
- All queries filter by `company_id` from JWT
- Super Admin can see all companies
- Regular users see only their company data

---

## 📊 Workflow Engine

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Draft   │────>│ Pending  │────>│ In Review│────>│ Approved │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                      │                                   │
                      │         ┌──────────┐               │
                      └────────>│ Rejected │<──────────────┘
                                └──────────┘
```

### Workflow Definition
```typescript
{
  name: "Purchase Quote Approval",
  entityType: "purchase_quote",
  steps: [
    { order: 1, name: "Manager Review", approverRole: "PURCHASE_MANAGER" },
    { order: 2, name: "Finance Review", approverRole: "ADMIN" }
  ],
  conditions: [
    { field: "grandTotal", operator: ">=", value: 100000, requireApproval: true }
  ]
}
```

---

## 🔄 Business Flow

### Sales Order Flow
```
Sales Enquiry → Rate Analysis → Purchase Quote → Purchase Order
     │               │              │
     └───────────────┴──────────────┴──> Approval Workflow
                                           │
     ┌─────────────────────────────────────┘
     │
     ▼
Sales Order ──> Delivery Note ──> Invoice ──> Payment
     │
     └────────> FMS Task (if label/artwork required)
```

### Purchase Flow
```
Sales Enquiry
     │
     ▼
Rate Analysis ──> Vendor Quote ──> Vendor Selection
     │                              │
     └──────────────────────────────┘
                   │
                   ▼
           Purchase Order ──> GRN ──> Invoice ──> Payment
```

---

## 🧩 Module Dependencies

```
app.module.ts
│
├── CommonModule (shared utilities)
│   └── TenantModule (multi-tenancy)
│
├── AuthModule (authentication)
│   └── UsersModule (user management)
│       └── PlatformModule (companies)
│
├── MastersModule (master data)
│   └── (standalone - no dependencies)
│
├── SalesModule (sales enquiries)
│   ├── MastersModule (customers)
│   └── UsersModule (sales persons)
│
├── PurchaseModule (purchase quotes)
│   ├── MastersModule (vendors)
│   ├── SalesModule (linked enquiries)
│   └── UsersModule (purchase persons)
│
├── RateModule (rate analysis)
│   ├── MastersModule (products)
│   └── PurchaseModule (quotes)
│
├── InventoryModule (inventory)
│   ├── MastersModule (products, warehouses)
│   └── InventoryV2Module (tracking)
│
├── FinancialModule (accounts)
│   ├── SalesModule (receivables)
│   └── PurchaseModule (payables)
│
├── WorkflowModule (approvals)
│   └── UsersModule (approvers)
│
├── SalesOrderModule (orders)
│   ├── SalesModule (enquiries)
│   └── InventoryModule (stock)
│
├── PurchaseOrderModule (orders)
│   ├── PurchaseModule (quotes)
│   └── InventoryModule (GRN)
│
├── FmsModule (task management)
│   ├── SalesModule (enquiries)
│   └── UsersModule (assignees)
│
├── ReportsModule (reporting)
│   ├── SalesModule
│   ├── PurchaseModule
│   ├── InventoryModule
│   └── FinancialModule
│
├── AuditModule (logging)
│   └── (intercepts all modules)
│
├── NotificationsModule (alerts)
│   └── EventBusModule
│
├── FilesModule (attachments)
│   └── (attached to all modules)
│
├── AdminModule (settings)
│   └── PlatformModule
│
└── SearchModule (global search)
    └── MastersModule
    └── SalesModule
    └── PurchaseModule
```

---

## 📝 Environment Variables

### API (.env)
```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
DATABASE_SSL=true

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# App
PORT=3001
API_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000

# Redis (BullMQ)
REDIS_URL=redis://host:6379

# S3/MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=xxx
MINIO_SECRET_KEY=xxx
MINIO_BUCKET=erp-documents

# Demo Password (for seeding)
DEMO_USER_PASSWORD=Demo@1234
```

### Web (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

---

## 🚀 Starting the Application

### Start API
```bash
cd apps/api
npm run start:dev    # Development with hot reload
npm run start:prod   # Production
```

### Start Web
```bash
cd apps/web
npm run dev          # Development
npm start            # Production
```

### Test Login
- **URL:** http://localhost:3000
- **Email:** admin@erp.com
- **Password:** Demo@1234

---

## 📈 Statistics

| Metric | Count |
|--------|-------|
| Total Source Files | 459 |
| API Modules | 23 |
| Controllers | 28 |
| Services | 37+ |
| Entities | 105+ |
| API Endpoints | 200+ |
| Frontend Pages | 30+ |

---

## ✅ Checklist Before Production

1. [ ] Change JWT_SECRET
2. [ ] Set up production database
3. [ ] Configure Redis
4. [ ] Set up S3/MinIO
5. [ ] Enable HTTPS
6. [ ] Configure rate limiting
7. [ ] Set up logging (Elasticsearch/Sentry)
8. [ ] Configure backup strategy
9. [ ] Set up monitoring
10. [ ] Security audit
