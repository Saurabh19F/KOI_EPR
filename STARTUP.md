# ERP Platform - Complete Summary

## What's Been Built

### Backend (NestJS) - Complete

**Modules:**
1. **Auth Module** - JWT authentication, refresh tokens, guards
2. **Users Module** - User CRUD, roles, permissions, departments
3. **Masters Module** - Products, Customers, Vendors, Categories, Segments, Brands, UOM, GST, Zones, Locations, Currencies
4. **Sales Module** - Enquiry workflow with status transitions
5. **Purchase Module** - Quote management
6. **Rate Module** - Price analysis, currency rates, haulage, freight
7. **FMS Module** - Task workflow management
8. **Audit Module** - Logging and status history
9. **Files Module** - File upload (MinIO/S3)
10. **Notifications Module** - Email/WhatsApp queues
11. **Reports Module** - Various reports
12. **Admin Module** - Settings, number series

**Features:**
- Swagger API documentation at `/api/docs`
- Pagination on all list endpoints
- Number series auto-generation
- SKU generation (CCC-SS-GGG-NNN)
- Buyer code generation (ZONE-NNNNNN)
- Status workflow transitions
- Soft delete on all entities

### Frontend (Next.js) - Complete

**Pages:**
1. **Login** - Email/password authentication
2. **Dashboard** - Stats cards, recent enquiries, my tasks
3. **Masters** - Products, Customers, Vendors lists with CRUD
4. **Sales** - Enquiry list, new enquiry form
5. **Purchase** - Quote list
6. **Rate** - Analysis list
7. **FMS** - Task list with complete/escalate actions
8. **Reports** - Report overview
9. **Settings** - User settings
10. **Documents** - File management

**Components:**
- Data tables with pagination
- Forms with validation
- Dialogs/modals
- Status badges
- Navigation sidebar

### Database (PostgreSQL)

**Seed Data Includes:**
- 38 permissions
- 11 roles (ADMIN, MANAGEMENT, SALES_MANAGER, etc.)
- 6 departments
- 7 users
- 5 zones
- 4 locations
- 6 payment terms
- 6 currencies
- 7 UOMs
- 5 GST rates
- 4 product categories
- 4 segments
- 4 component groups
- 4 brands
- 4 ports
- 6 number series
- 6 sample customers
- 5 sample vendors
- 8 sample products
- 3 sample enquiries
- 2 FMS tasks

---

## How to Run

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- npm or yarn

### Step 1: Start Infrastructure

```bash
cd C:\Users\Krisc\Desktop\git projects\ERP
docker-compose up -d postgres redis minio
```

### Step 2: Wait for services to be ready

```bash
# Wait about 10 seconds for PostgreSQL to initialize
```

### Step 3: Seed the Database

The seed script runs automatically via init-scripts folder in docker-compose.

Or manually:
```bash
docker exec -i erp-postgres psql -U postgres -d erp < init-scripts/00-init-permissions.sql
```

### Step 4: Start API

```bash
cd apps/api
npm run dev
```

API runs at: http://localhost:3001

### Step 5: Start Web

```bash
cd apps/web
npm run dev
```

Web runs at: http://localhost:3000

---

## Login Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@erp.com | admin123 | Administrator |
| neha@erp.com | admin123 | Sales User |
| rahul@erp.com | admin123 | Sales Manager |
| priya@erp.com | admin123 | Purchase User |
| amit@erp.com | admin123 | Purchase Manager |
| sneha@erp.com | admin123 | Costing Manager |
| vikram@erp.com | admin123 | Management |

---

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get profile

### Masters
- `GET /api/v1/masters/products?page=1&limit=20&search=...`
- `POST /api/v1/masters/products`
- `GET/PATCH/DELETE /api/v1/masters/products/:id`
- `GET /api/v1/masters/customers`
- `POST /api/v1/masters/customers`
- `GET /api/v1/masters/vendors`
- `GET /api/v1/masters/categories`
- `GET /api/v1/masters/segments`
- `GET /api/v1/masters/groups`
- `GET /api/v1/masters/brands`
- `GET /api/v1/masters/uoms`
- `GET /api/v1/masters/gst-rates`
- `GET /api/v1/masters/zones`
- `GET /api/v1/masters/currencies`

### Sales
- `GET /api/v1/sales-enquiries?page=1&limit=20&status=...`
- `POST /api/v1/sales-enquiries`
- `GET/PATCH /api/v1/sales-enquiries/:id`
- `PATCH /api/v1/sales-enquiries/:id/status`
- `GET/POST /api/v1/sales-enquiries/:id/items`

### FMS
- `GET /api/v1/fms/tasks?page=1&limit=20&status=...`
- `GET /api/v1/fms/tasks/my`
- `GET /api/v1/fms/tasks/delayed`
- `PATCH /api/v1/fms/tasks/:id/complete`
- `PATCH /api/v1/fms/tasks/:id/escalate`
- `GET /api/v1/fms/dashboard/stats`

### Users
- `GET /api/v1/users?page=1&limit=20`
- `POST /api/v1/users`
- `GET/PATCH/DELETE /api/v1/users/:id`
- `GET /api/v1/users/roles`
- `GET /api/v1/users/departments`

---

## Swagger Documentation

API documentation with interactive testing:
http://localhost:3001/api/docs

---

## Project Structure

```
ERP/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/      # JWT Authentication
│   │       │   ├── users/     # User management
│   │       │   ├── masters/   # Master data
│   │       │   ├── sales/     # Sales enquiries
│   │       │   ├── purchase/  # Purchase quotes
│   │       │   ├── rate/      # Rate analysis
│   │       │   ├── fms/      # Task management
│   │       │   ├── audit/     # Audit logs
│   │       │   └── ...
│   │       └── main.ts
│   │
│   └── web/                   # Next.js Frontend
│       └── src/
│           ├── app/
│           │   ├── (auth)/login/
│           │   └── (dashboard)/
│           ├── components/
│           ├── lib/
│           └── store/
│
├── init-scripts/              # Database seeds
├── docker-compose.yml
├── package.json
└── turbo.json
```

---

## Status Workflows

### Sales Enquiry
```
draft → submitted → punched → verified → purchase_pending →
vendor_quote_pending → rate_pending → approval_pending →
quotation_created → quotation_sent → won/lost/cancelled
```

### FMS Task
```
pending → in_progress → completed/delayed/escalated
```

---

## SKU Format
```
{CategoryCode}-{SegmentCode}-{GroupCode}-{Serial}
Example: BRD-SS-GRP-001
```

## Buyer Code Format
```
{Zone}-{RunningNumber}
Example: USA-000001, DOM-000002
```

## Enquiry Number Format
```
ENQ-{UserCode}-{Year}-{Serial}
Example: ENQ-NEH-2026-0001
```

---

## Next Steps for UI (Stitch)

Once Stitch UI components are ready:

1. Replace existing UI components with Stitch components
2. Add real-time features (polling/WebSocket)
3. Implement file upload UI
4. Add chart visualizations for reports
5. Mobile responsive testing
6. Dark mode support

---

## Troubleshooting

### Database Connection Issues
```bash
docker logs erp-postgres
```

### API Not Starting
```bash
cd apps/api
npm run build
npm run dev
```

### Clear Docker Volumes
```bash
docker-compose down -v
docker-compose up -d
```

### Re-seed Database
```bash
docker exec -i erp-postgres psql -U postgres -d erp < init-scripts/00-init-permissions.sql
```
