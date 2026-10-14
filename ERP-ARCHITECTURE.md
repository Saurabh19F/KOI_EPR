# ERP System Architecture Blueprint

## Executive Summary

This document provides a comprehensive technical architecture for the ERP system, analyzes the current implementation, identifies gaps compared to industry competitors (SAP, Oracle, Zoho, Tally), and recommends improvements while ensuring all existing functionality is preserved.

---

## Part 1: Current Architecture Overview

### 1.1 Technology Stack

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (Next.js 14)                        │
│  React 18 + TypeScript + TailwindCSS + Shadcn/UI + TanStack Query        │
│  State: Zustand + React Query + Context API                              │
│  Real-time: Socket.IO Client                                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │ HTTP/REST + WebSocket
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            BACKEND (NestJS 10)                         │
│  TypeScript + TypeORM + PostgreSQL + BullMQ + Redis                     │
│  Auth: JWT + Passport + Supabase                                        │
│  Caching: Upstash Redis (REST API)                                    │
│  File Storage: S3/MinIO with Presigned URLs                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌───────────┐   ┌───────────┐   ┌───────────┐
            │ PostgreSQL│   │   Redis   │   │    S3     │
            │ (Supabase)│   │ (Upstash)│   │  (MinIO)  │
            └───────────┘   └───────────┘   └───────────┘
```

### 1.2 Backend Module Structure

```
apps/api/src/
├── main.ts                           # Application entry point
├── app.module.ts                     # Root module
│
├── modules/
│   ├── auth/                         # Authentication Module
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts       # Login, Register, Refresh Token, Logout
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts     # JWT authentication
│   │   │   └── local.strategy.ts   # Username/password login
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── api-key.guard.ts
│   │   └── decorators/
│   │       ├── roles.decorator.ts  # @Roles('admin')
│   │       └── current-user.decorator.ts # @CurrentUser()
│   │
│   ├── users/                       # User Management Module
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── entities/
│   │   │   ├── user.entity.ts
│   │   │   ├── role.entity.ts
│   │   │   └── permission.entity.ts
│   │   └── dto/
│   │
│   ├── masters/                     # Master Data Module (Core)
│   │   ├── masters.module.ts
│   │   ├── masters.controller.ts
│   │   ├── masters.service.ts
│   │   ├── entities/
│   │   │   ├── product.entity.ts          # Product catalog
│   │   │   ├── product-category.entity.ts   # Categories
│   │   │   ├── brand.entity.ts             # Brands
│   │   │   ├── customer.entity.ts         # Customers/Buyers
│   │   │   ├── vendor.entity.ts            # Suppliers
│   │   │   ├── uom.entity.ts              # Unit of Measure
│   │   │   ├── currency.entity.ts         # Currencies
│   │   │   ├── currency-rate.entity.ts    # Exchange rates
│   │   │   ├── country.entity.ts          # Countries
│   │   │   ├── location.entity.ts         # Locations/Warehouses
│   │   │   ├── zone.entity.ts             # Zones
│   │   │   ├── warehouse.entity.ts        # Warehouses
│   │   │   ├── port.entity.ts             # Ports
│   │   │   ├── payment-terms.entity.ts    # Payment terms
│   │   │   ├── freight.entity.ts          # Freight rates
│   │   │   ├── haulage.entity.ts          # Haulage charges
│   │   │   ├── gst.entity.ts              # GST rates
│   │   │   ├── inventory-stock.entity.ts   # Stock levels
│   │   │   ├── product-vendor-mapping.entity.ts
│   │   │   ├── product-image.entity.ts
│   │   │   ├── product-document.entity.ts
│   │   │   └── segment.entity.ts           # Business segments
│   │   └── dto/
│   │
│   ├── sales/                       # Sales & CRM Module
│   │   ├── sales.module.ts
│   │   ├── sales.controller.ts
│   │   ├── sales.service.ts
│   │   ├── entities/
│   │   │   ├── sales-enquiry.entity.ts     # Sales enquiry/quote requests
│   │   │   ├── sales-enquiry-item.entity.ts # Line items
│   │   │   ├── sales-enquiry-document.entity.ts
│   │   │   ├── enquiry-punching-log.entity.ts
│   │   │   └── enquiry-email-reminder.entity.ts
│   │   └── dto/
│   │
│   ├── purchase/                    # Purchase & Procurement Module
│   │   ├── purchase.module.ts
│   │   ├── purchase.controller.ts
│   │   ├── purchase.service.ts
│   │   ├── entities/
│   │   │   ├── purchase-quote.entity.ts
│   │   │   ├── purchase-quote-item.entity.ts
│   │   │   ├── vendor-quote.entity.ts
│   │   │   ├── vendor-quote-item.entity.ts
│   │   │   └── purchase-order.entity.ts
│   │   └── dto/
│   │
│   ├── rate/                        # Rate Analysis Module
│   │   ├── rate.module.ts
│   │   ├── rate.controller.ts
│   │   ├── rate.service.ts
│   │   └── entities/
│   │       ├── price-analysis.entity.ts
│   │       └── rate-matrix.entity.ts
│   │
│   ├── inventory/                   # Inventory Management Module
│   │   ├── inventory.module.ts
│   │   ├── inventory.controller.ts
│   │   ├── inventory.service.ts
│   │   └── entities/
│   │       ├── stock-movement.entity.ts
│   │       └── (reuses inventory-stock from masters)
│   │
│   ├── fms/                        # Field Management / Task System
│   │   ├── fms.module.ts
│   │   ├── fms.controller.ts
│   │   ├── fms.service.ts
│   │   └── entities/
│   │       ├── fms-task.entity.ts
│   │       ├── fms-step.entity.ts
│   │       ├── fms-master.entity.ts
│   │       ├── fms-task-step.entity.ts
│   │       ├── fms-mail-queue.entity.ts
│   │       ├── label-artwork.entity.ts
│   │       └── rate-fms-task.entity.ts
│   │
│   ├── workflow/                    # Workflow Engine
│   │   ├── workflow.module.ts
│   │   ├── workflow.controller.ts
│   │   ├── workflow.service.ts
│   │   ├── workflow.engine.ts        # Workflow execution engine
│   │   └── entities/
│   │       ├── workflow-definition.entity.ts
│   │       ├── workflow-step.entity.ts
│   │       ├── workflow-instance.entity.ts
│   │       └── workflow-transition.entity.ts
│   │
│   ├── notifications/               # Real-time Notifications
│   │   ├── notifications.module.ts
│   │   ├── notifications.controller.ts
│   │   ├── notifications.service.ts
│   │   ├── notifications.gateway.ts  # WebSocket gateway
│   │   ├── notifications.consumer.ts # Queue consumer
│   │   └── entities/
│   │       └── notification.entity.ts
│   │
│   ├── files/                       # File Management
│   │   ├── files.module.ts
│   │   ├── files.controller.ts
│   │   ├── files.service.ts
│   │   ├── s3.service.ts           # S3/MinIO operations
│   │   └── entities/
│   │       ├── file.entity.ts
│   │       └── attachment.entity.ts
│   │
│   ├── search/                      # Global Search
│   │   ├── search.module.ts
│   │   ├── search.controller.ts
│   │   └── search.service.ts
│   │
│   ├── audit/                       # Audit Logging
│   │   ├── audit.module.ts
│   │   ├── audit.controller.ts
│   │   ├── audit.service.ts
│   │   └── entities/
│   │       ├── audit-log.entity.ts
│   │       └── status-history.entity.ts
│   │
│   ├── reports/                      # Reporting & Analytics
│   │   ├── reports.module.ts
│   │   ├── reports.controller.ts
│   │   ├── reports.service.ts
│   │   └── dto/
│   │
│   ├── admin/                        # Admin & Settings
│   │   ├── admin.module.ts
│   │   ├── admin.controller.ts
│   │   ├── admin.service.ts
│   │   └── dto/
│   │
│   ├── platform/                    # Multi-tenant Platform
│   │   ├── platform.module.ts
│   │   ├── platform.controller.ts
│   │   ├── platform.service.ts
│   │   ├── onboarding.service.ts
│   │   └── entities/
│   │       ├── company.entity.ts
│   │       ├── domain.entity.ts
│   │       ├── subscription.entity.ts
│   │       └── platform-settings.entity.ts
│   │
│   └── events/                      # Event Bus (Internal Messaging)
│       ├── event-bus.module.ts
│       ├── event-bus.service.ts
│       └── listeners/
│           ├── fms-event.listener.ts
│           ├── notification-event.listener.ts
│           └── audit-event.listener.ts
│
├── common/
│   ├── types/
│   │   ├── paginated-result.ts
│   │   └── api-response.ts
│   ├── decorators/
│   │   └── (shared decorators)
│   ├── interceptors/
│   │   ├── logging.interceptor.ts
│   │   ├── transform.interceptor.ts
│   │   └── error.interceptor.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── guards/
│   │   └── (shared guards)
│   ├── queue.config.ts              # BullMQ configuration
│   └── typeorm/
│       └── snake-naming.strategy.ts
│
└── database/
    ├── data-source.ts               # TypeORM configuration
    └── migrations/                   # Database migrations
```

### 1.3 Frontend Directory Structure

```
apps/web/src/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── forgot-password/
│   │       └── page.tsx
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Dashboard layout with sidebar
│   │   ├── page.tsx               # Dashboard home
│   │   │
│   │   ├── (masters)/
│   │   │   ├── products/
│   │   │   │   ├── page.tsx       # Product list
│   │   │   │   └── [id]/page.tsx  # Product detail/edit
│   │   │   ├── customers/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── vendors/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── categories/
│   │   │   │   └── page.tsx
│   │   │   ├── brands/
│   │   │   │   └── page.tsx
│   │   │   ├── uoms/
│   │   │   │   └── page.tsx
│   │   │   └── currencies/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (sales)/
│   │   │   ├── enquiries/
│   │   │   │   ├── page.tsx       # Enquiry list
│   │   │   │   ├── new/page.tsx   # Create enquiry
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx   # Enquiry detail
│   │   │   │       ├── edit/page.tsx
│   │   │   │       └── punch/page.tsx # Rate punching
│   │   │   ├── quotations/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   └── orders/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (purchase)/
│   │   │   ├── quotes/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── vendors/
│   │   │   │   └── [id]/page.tsx
│   │   │   └── purchase-orders/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (inventory)/
│   │   │   ├── stock/
│   │   │   │   ├── page.tsx       # Stock levels
│   │   │   │   ├── adjust/page.tsx
│   │   │   │   └── transfer/page.tsx
│   │   │   ├── movements/
│   │   │   │   └── page.tsx
│   │   │   └── warehouses/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (fms)/
│   │   │   ├── tasks/
│   │   │   │   ├── page.tsx       # Task list
│   │   │   │   └── [id]/page.tsx
│   │   │   └── dashboard/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (reports)/
│   │   │   ├── sales/
│   │   │   │   └── page.tsx
│   │   │   ├── inventory/
│   │   │   │   └── page.tsx
│   │   │   └── analytics/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (settings)/
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   ├── company/
│   │   │   │   └── page.tsx
│   │   │   ├── users/
│   │   │   │   └── page.tsx
│   │   │   ├── roles/
│   │   │   │   └── page.tsx
│   │   │   └── integrations/
│   │   │       └── page.tsx
│   │   │
│   │   └── (onboarding)/
│   │       └── page.tsx
│   │
│   ├── api/                         # API route handlers (if needed)
│   │
│   ├── layout.tsx                   # Root layout
│   └── globals.css
│
├── components/
│   ├── ui/                         # Shadcn/UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── badge.tsx
│   │   └── ...
│   │
│   ├── shared/                     # Shared components
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   ├── breadcrumb.tsx
│   │   ├── page-header.tsx
│   │   ├── data-table.tsx          # Reusable data table
│   │   ├── search-input.tsx
│   │   ├── pagination.tsx
│   │   ├── empty-state.tsx
│   │   ├── loading-spinner.tsx
│   │   ├── error-boundary.tsx
│   │   └── confirm-dialog.tsx
│   │
│   ├── forms/                      # Form components
│   │   ├── product-form.tsx
│   │   ├── customer-form.tsx
│   │   ├── enquiry-form.tsx
│   │   └── ...
│   │
│   └── features/                    # Feature-specific components
│       ├── sales/
│       │   ├── enquiry-table.tsx
│       │   ├── enquiry-detail.tsx
│       │   └── rate-punching.tsx
│       ├── inventory/
│       │   ├── stock-chart.tsx
│       │   └── movement-list.tsx
│       └── ...
│
├── hooks/
│   ├── useAuth.ts                  # Authentication hook
│   ├── useUser.ts                 # Current user hook
│   ├── useNotifications.ts         # Real-time notifications
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   └── (API hooks)
│       ├── useProducts.ts
│       ├── useCustomers.ts
│       ├── useEnquiries.ts
│       └── ...
│
├── lib/
│   ├── api.ts                      # API client configuration
│   ├── auth.ts                     # Auth utilities
│   ├── utils.ts                   # cn() and other utilities
│   ├── schemas.ts                  # Zod validation schemas
│   ├── validation.ts               # Validation utilities
│   └── constants.ts
│
├── store/
│   ├── auth-store.ts               # Zustand auth store
│   ├── ui-store.ts                # UI state
│   └── notification-store.ts
│
└── types/
    ├── api.ts                      # API types
    ├── product.ts
    ├── customer.ts
    └── ...
```

---

## Part 2: API Endpoints Reference

### 2.1 Authentication Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/login` | User login | Public |
| POST | `/api/v1/auth/register` | User registration | Public |
| POST | `/api/v1/auth/refresh` | Refresh JWT token | Public |
| POST | `/api/v1/auth/logout` | Logout | JWT |
| GET | `/api/v1/auth/me` | Get current user | JWT |
| PUT | `/api/v1/auth/password` | Change password | JWT |

### 2.2 Masters Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/masters/products` | List products |
| POST | `/api/v1/masters/products` | Create product |
| GET | `/api/v1/masters/products/:id` | Get product |
| PATCH | `/api/v1/masters/products/:id` | Update product |
| DELETE | `/api/v1/masters/products/:id` | Delete product |
| GET | `/api/v1/masters/customers` | List customers |
| POST | `/api/v1/masters/customers` | Create customer |
| GET | `/api/v1/masters/customers/:id` | Get customer |
| PATCH | `/api/v1/masters/customers/:id` | Update customer |
| DELETE | `/api/v1/masters/customers/:id` | Delete customer |
| GET | `/api/v1/masters/vendors` | List vendors |
| POST | `/api/v1/masters/vendors` | Create vendor |
| GET | `/api/v1/masters/categories` | List categories |
| GET | `/api/v1/masters/brands` | List brands |
| GET | `/api/v1/masters/uoms` | List UOMs |
| GET | `/api/v1/masters/currencies` | List currencies |

### 2.3 Sales Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/sales/enquiries` | List enquiries |
| POST | `/api/v1/sales/enquiries` | Create enquiry |
| GET | `/api/v1/sales/enquiries/:id` | Get enquiry |
| PATCH | `/api/v1/sales/enquiries/:id` | Update enquiry |
| POST | `/api/v1/sales/enquiries/:id/submit` | Submit enquiry |
| POST | `/api/v1/sales/enquiries/:id/punch` | Punch rates |
| GET | `/api/v1/sales/enquiries/:id/quotation` | Generate quotation |

### 2.4 Purchase Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/purchase/quotes` | List vendor quotes |
| POST | `/api/v1/purchase/quotes` | Create quote request |
| GET | `/api/v1/purchase/quotes/:id` | Get quote |
| PATCH | `/api/v1/purchase/quotes/:id` | Update quote |

### 2.5 Inventory Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/inventory/stock` | Get stock levels |
| GET | `/api/v1/inventory/stock/summary` | Stock summary |
| POST | `/api/v1/inventory/adjust` | Stock adjustment |
| POST | `/api/v1/inventory/transfer` | Stock transfer |
| GET | `/api/v1/inventory/movements` | Movement history |
| GET | `/api/v1/inventory/warehouses` | List warehouses |

### 2.6 FMS Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/fms/tasks` | List tasks |
| POST | `/api/v1/fms/tasks` | Create task |
| GET | `/api/v1/fms/tasks/:id` | Get task |
| PATCH | `/api/v1/fms/tasks/:id` | Update task |
| POST | `/api/v1/fms/tasks/:id/assign` | Assign task |
| POST | `/api/v1/fms/tasks/:id/complete` | Complete task |
| GET | `/api/v1/fms/tasks/stats` | Task statistics |
| GET | `/api/v1/fms/steps` | List FMS steps |
| POST | `/api/v1/fms/steps` | Create step |

### 2.7 Other Endpoints

| Method | Endpoint | Module | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/search` | Search | Global search |
| GET | `/api/v1/notifications` | Notifications | List notifications |
| PATCH | `/api/v1/notifications/:id/read` | Notifications | Mark as read |
| GET | `/api/v1/audit/logs` | Audit | Audit logs |
| GET | `/api/v1/reports/sales` | Reports | Sales report |
| POST | `/api/v1/files/upload` | Files | File upload |
| GET | `/api/v1/platform/companies/:id` | Platform | Company settings |

---

## Part 3: Competitive Analysis & Gap Analysis

### 3.1 Comparison with Industry Leaders

| Feature | SAP S/4HANA | Oracle NetSuite | Zoho ERP | TallyPrime | Current System |
|---------|-------------|----------------|----------|------------|----------------|
| **Sales & CRM** |
| Lead Management | ✅ Advanced | ✅ Advanced | ✅ Good | ❌ Basic | ⚠️ Basic enquiry only |
| Opportunity Pipeline | ✅ Kanban + Charts | ✅ Visual | ✅ Visual | ❌ None | ⚠️ Basic list view |
| Quotation Management | ✅ Full | ✅ Full | ✅ Good | ✅ Basic | ✅ Good |
| Order Processing | ✅ Full | ✅ Full | ✅ Good | ✅ Good | ⚠️ Limited |
| **Procurement** |
| Vendor Management | ✅ Full | ✅ Full | ✅ Good | ⚠️ Basic | ✅ Good |
| Purchase Orders | ✅ Full | ✅ Full | ✅ Good | ✅ Good | ⚠️ Limited |
| Goods Receipt | ✅ Full | ✅ Full | ✅ Good | ✅ Good | ⚠️ Limited |
| **Inventory** |
| Stock Tracking | ✅ Real-time | ✅ Real-time | ✅ Good | ✅ Basic | ✅ Good |
| Multi-warehouse | ✅ Full | ✅ Full | ✅ Good | ⚠️ Single | ✅ Good |
| Stock Valuation | ✅ Multiple Methods | ✅ Full | ✅ Good | ✅ Basic | ⚠️ Limited |
| Batch/Serial | ✅ Full | ✅ Full | ✅ Good | ⚠️ Basic | ❌ Not implemented |
| **Finance** |
| Accounting | ✅ Full | ✅ Full | ✅ Good | ✅ Good | ❌ Not implemented |
| GST Filing | ✅ Full | ✅ Full | ✅ Good | ✅ Good | ⚠️ Basic GST data |
| Multi-currency | ✅ Full | ✅ Full | ✅ Good | ⚠️ Limited | ⚠️ Basic |
| **Business Intelligence** |
| Dashboards | ✅ Advanced | ✅ Advanced | ✅ Good | ❌ None | ⚠️ Basic |
| Custom Reports | ✅ Full | ✅ Full | ✅ Good | ❌ None | ⚠️ Limited |
| Data Export | ✅ Full | ✅ Full | ✅ Full | ✅ CSV | ✅ CSV/Excel |
| **Integration** |
| REST API | ✅ Full | ✅ Full | ✅ Good | ⚠️ Limited | ✅ Good |
| Webhooks | ✅ Full | ✅ Full | ✅ Good | ❌ None | ⚠️ Limited |
| Third-party EDI | ✅ Full | ✅ Full | ⚠️ Limited | ❌ None | ❌ Not implemented |
| **Multi-tenancy** |
| Multi-company | ✅ Full | ✅ Full | ✅ Good | ⚠️ Manual | ✅ Good |
| Role-based Access | ✅ Full | ✅ Full | ✅ Good | ⚠️ Basic | ✅ Good |
| **Technology** |
| Cloud-native | ✅ Yes | ✅ Yes | ✅ Yes | ❌ Desktop-first | ✅ Yes |
| Mobile App | ✅ Yes | ✅ Yes | ✅ Yes | ⚠️ Limited | ❌ Not implemented |
| Offline Mode | ✅ Yes | ✅ Yes | ⚠️ Limited | ✅ Yes | ❌ Not implemented |

### 3.2 Critical Gaps Identified

#### Gap 1: Finance/Accounting Module (CRITICAL)
- **Status**: Not implemented
- **Impact**: Core ERP functionality missing
- **Required For**: Complete business operations
- **Recommendation**: Implement accounting module with:
  - Chart of Accounts
  - Journal Entries
  - Voucher Management
  - GST TDS TCS
  - Payment tracking

#### Gap 2: Batch/Serial Number Tracking (HIGH)
- **Status**: Not implemented
- **Impact**: Cannot track individual items
- **Required For**: Pharmaceutical, electronics, food industry compliance
- **Recommendation**: Add batch/serial tracking to inventory

#### Gap 3: Mobile Application (HIGH)
- **Status**: Not implemented
- **Impact**: No field access to system
- **Required For**: Field sales, warehouse operations
- **Recommendation**: React Native or PWA

#### Gap 4: Advanced Reporting/BI (MEDIUM)
- **Status**: Basic reports only
- **Impact**: Limited analytics capability
- **Recommendation**: Integrate with:
  - Metabase
  - Apache Superset
  - Custom dashboard builder

#### Gap 5: Workflow Automation (MEDIUM)
- **Status**: Basic workflow engine exists
- **Impact**: Limited automation
- **Recommendation**: Add:
  - Visual workflow designer
  - Approval chains
  - Conditional routing

#### Gap 6: Offline Mode (MEDIUM)
- **Status**: Not implemented
- **Impact**: Cannot work without internet
- **Recommendation**: PWA with IndexedDB caching

#### Gap 7: E-Invoicing/eway-bill Integration (MEDIUM)
- **Status**: Not implemented
- **Impact**: Mandatory for Indian businesses > 50L turnover
- **Recommendation**: Integrate with:
  - NIC e-Invoice portal
  - IRP (Invoice Registration Portal)

---

## Part 4: Recommended Architecture Improvements

### 4.1 Database Schema Improvements

#### Current Issues:
1. Circular dependencies between entities across modules
2. Missing proper indexing for performance
3. No soft-delete cascade
4. Incomplete audit trail

#### Recommended Changes:

```sql
-- Add missing tables for accounting
CREATE TABLE account_groups (
    id UUID PRIMARY KEY,
    company_id UUID,
    parent_id UUID REFERENCES account_groups(id),
    group_name VARCHAR(255) NOT NULL,
    nature VARCHAR(50), -- ASSET, LIABILITY, INCOME, EXPENSE
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ledger_accounts (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    group_id UUID REFERENCES account_groups(id),
    account_name VARCHAR(255) NOT NULL,
    account_code VARCHAR(50) UNIQUE,
    opening_balance DECIMAL(15,2) DEFAULT 0,
    opening_balance_type VARCHAR(1) DEFAULT 'DR', -- DR or CR
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false, -- For default accounts
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE voucher_header (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    voucher_type VARCHAR(50) NOT NULL, -- SALES, PURCHASE, PAYMENT, RECEIPT, JOURNAL
    voucher_number VARCHAR(50) NOT NULL,
    voucher_date DATE NOT NULL,
    reference_number VARCHAR(100),
    reference_date DATE,
    narration TEXT,
    party_name VARCHAR(255),
    party_gstin VARCHAR(15),
    total_amount DECIMAL(15,2) DEFAULT 0,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approval_status VARCHAR(20) DEFAULT 'DRAFT',
    is_cancelled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE voucher_details (
    id UUID PRIMARY KEY,
    voucher_id UUID REFERENCES voucher_header(id),
    ledger_id UUID REFERENCES ledger_accounts(id),
    debit DECIMAL(15,2) DEFAULT 0,
    credit DECIMAL(15,2) DEFAULT 0,
    cost_center_id UUID,
    narration VARCHAR(500),
    balance_fc DECIMAL(15,2), -- Foreign currency balance
    currency_code VARCHAR(3)
);

-- Add batch tracking to inventory
CREATE TABLE inventory_batches (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    product_id UUID NOT NULL,
    batch_number VARCHAR(100),
    manufacturing_date DATE,
    expiry_date DATE,
    quantity DECIMAL(15,3) DEFAULT 0,
    rate DECIMAL(15,2) DEFAULT 0,
    warehouse_id UUID,
    location_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add document sequencing
CREATE TABLE document_sequences (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    module VARCHAR(50) NOT NULL, -- SALES, PURCHASE, VOUCHER
    prefix VARCHAR(20),
    suffix VARCHAR(20),
    current_number INTEGER DEFAULT 0,
    reset_period VARCHAR(20) DEFAULT 'YEARLY', -- DAILY, MONTHLY, YEARLY, NEVER
    padding INTEGER DEFAULT 4,
    is_active BOOLEAN DEFAULT true
);
```

### 4.2 Module Dependency Diagram

```
                    ┌─────────────────┐
                    │   Platform      │
                    │   (Multi-tenant)│
                    └────────┬────────┘
                             │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│     Masters     │ │     Sales       │ │    Purchase     │
│ (Products, etc)│ │ (Enquiries)     │ │   (Quotes)      │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                  │                  │
         │         ┌────────┴────────┐         │
         │         │                 │         │
         ▼         ▼                 ▼         ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Inventory     │ │      FMS        │ │     Rate       │
│   (Stock)       │ │   (Tasks)       │ │  (Analysis)    │
└────────┬────────┘ └─────────────────┘ └────────┬────────┘
         │                                        │
         │                         ┌───────────────┘
         │                         │
         ▼                         ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Accounting    │ │    Workflow     │ │  Notifications │
│   (Ledger)      │ │   (Engine)      │ │   (Events)      │
└────────┬────────┘ └─────────────────┘ └─────────────────┘
         │
         ▼
┌─────────────────┐
│   GST/TDS       │
│   (Compliance)  │
└─────────────────┘
```

### 4.3 Recommended Service Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway                               │
│                   (Kong / AWS API Gateway)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Auth Service │     │  Core API     │     │  Real-time   │
│  (OAuth2)     │     │  (NestJS)      │     │  (WebSocket)  │
└───────────────┘     └───────────────┘     └───────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  PostgreSQL   │     │    Redis      │     │     S3        │
│  (Primary)    │     │  (Cache/Q)    │     │  (Files)      │
└───────────────┘     └───────────────┘     └───────────────┘
```

---

## Part 5: Implementation Roadmap

### Phase 1: Stabilization (Current)
- [x] Fix circular dependencies
- [ ] Ensure database connectivity
- [ ] Complete all CRUD operations
- [ ] Add input validation
- [ ] Add audit logging

### Phase 2: Core Completeness
- [ ] Implement Accounting module
- [ ] Add batch/serial tracking
- [ ] Complete GST compliance
- [ ] Add document sequencing

### Phase 3: Automation
- [ ] Visual workflow designer
- [ ] Approval chains
- [ ] Auto task creation
- [ ] Email/SMS notifications

### Phase 4: Intelligence
- [ ] Dashboard builder
- [ ] Custom reports
- [ ] Data export (Excel/PDF)
- [ ] Analytics integration

### Phase 5: Enterprise Features
- [ ] Mobile app (PWA)
- [ ] Offline mode
- [ ] Multi-currency
- [ ] E-invoicing integration

---

## Part 6: Database Connection Issue Resolution

### Current Problem
```
Connection terminated due to connection timeout
```

### Root Cause
Supabase PostgreSQL connection not reachable from current network.

### Solutions

#### Option 1: Local Development Database
```bash
# Start local PostgreSQL with Docker
docker run -d \
  --name erp-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=erp \
  -p 5432:5432 \
  postgres:15
```

Update `.env`:
```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=erp
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_SSL=false
```

#### Option 2: Fix Supabase Connection
1. Check Supabase project status
2. Verify connection string
3. Update firewall rules
4. Check IP whitelist

#### Option 3: Use Prisma with different database
Consider migrating from TypeORM to Prisma for better DX and schema management.

---

## Appendix A: Entity Relationship Summary

### Core Entities and Relationships

```
Company (1) ─── (N) Users
Company (1) ─── (N) Customers
Company (1) ─── (N) Vendors
Company (1) ─── (N) Products
Company (1) ─── (N) Enquiries
Company (1) ─── (N) Quotes
Company (1) ─── (N) Purchase Orders
Company (1) ─── (N) Warehouse
Warehouse (1) ─── (N) Inventory Stock
Product (1) ─── (N) Inventory Stock
Enquiry (1) ─── (N) Enquiry Items
Product (1) ─── (N) Enquiry Items
Customer (1) ─── (N) Enquiries
Vendor (1) ─── (N) Quotes
```

### Key Business Flows

1. **Sales Flow**:
   Enquiry → Items Added → Rates Punching → Quotation Generated → Order Confirmed

2. **Purchase Flow**:
   Quote Request → Vendor Quotes → Purchase Order → Goods Receipt → Payment

3. **Inventory Flow**:
   Purchase → Goods Receipt → Stock Update → Sale → Stock Deducted

---

## Appendix B: Security Checklist

- [x] JWT authentication
- [x] Password hashing (bcrypt)
- [x] Rate limiting
- [x] CORS configuration
- [ ] Input sanitization (XSS prevention)
- [ ] SQL injection prevention (TypeORM parameterized queries)
- [ ] CSRF protection
- [ ] Content Security Policy headers
- [ ] Audit logging for sensitive operations
- [ ] API key rotation
- [ ] Secret rotation policy

---

## Appendix C: Performance Benchmarks

| Operation | Current Target | Industry Standard |
|----------|---------------|-------------------|
| API Response (p95) | < 200ms | < 100ms |
| List Query (1000 rows) | < 500ms | < 300ms |
| File Upload (10MB) | < 5s | < 3s |
| Dashboard Load | < 2s | < 1s |
| Search Results | < 300ms | < 200ms |

---

## Summary

This ERP system has a solid foundation with NestJS backend and Next.js frontend. The core functionality for sales enquiry management is in place. Key gaps are:

1. **Accounting module** - Most critical missing piece
2. **Mobile access** - Important for field operations
3. **Advanced workflows** - For automation
4. **Business intelligence** - For decision making

The architectural decisions made (TypeScript, PostgreSQL, Redis caching, S3 storage) are industry-standard and support enterprise scalability.

**Database connectivity must be resolved first** before any functionality testing can proceed.
