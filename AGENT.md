# ERP Project - Claude Code Instructions

## Project Overview
This is a comprehensive ERP (Enterprise Resource Planning) system built with:
- **Backend**: NestJS + TypeORM + PostgreSQL
- **Frontend**: Vue.js (assumed)
- **Location**: `c:\Users\Krisc\Desktop\git projects\ERP`

## Project Structure
```
ERP/
├── apps/
│   ├── api/                 # NestJS backend
│   │   └── src/
│   │       ├── modules/     # Feature modules
│   │       │   ├── masters/     # Master data (categories, products, etc.)
│   │       │   ├── sales/       # Sales enquiry orders
│   │       │   ├── purchase/    # Purchase quotes, vendor quotes
│   │       │   ├── rate/       # Rate calculation, price analysis
│   │       │   ├── fms/        # Task management
│   │       │   └── auth-v2/    # Authentication
│   │       ├── database/    # DB scripts & seeds
│   │       └── common/      # Shared DTOs
│   └── ...
└── supabase-migrations/    # Database migrations
```

## Key Database Tables
- `product_categories` - Category master
- `segments` - Segment master (codes: 00=Common, 01=Kids, 02=Adult)
- `component_groups` - Component group master
- `brands` - Brand master
- `uom_master` - Unit of measure
- `gst_rates` - GST rates
- `products` - Product master with SKU
- `customers` - Customer master
- `vendors` - Vendor master
- `sales_enquiry_orders` - Sales enquiry header
- `purchase_quotes` - Purchase quote header
- `vendor_quotes` - Vendor quotes
- `haulage_master` - Haulage rates by location
- `currency_rate_master` - Currency rates
- `final_currency_rate_master` - Final currency with margin

## Key API Routes
| Module | Base Path | Description |
|--------|-----------|-------------|
| Masters | `/api/v1/masters` | Categories, Products, Customers, etc. |
| Sales | `/api/v1/sales-enquiries` | Sales enquiry orders |
| Purchase | `/api/v1/purchase` | Purchase quotes |
| Rate | `/api/v1/rate` | Price analysis, currency, haulage |
| FMS | `/api/v1/fms` | Task management |
| Auth | `/api/v1/auth-v2` | Authentication v2 |

## SKU Format
**Format**: `CCC-SS-GGG-NNN` (Category-Segment-Group-Number)
**Example**: `BR-00-SAU-000001`

## Status Flows

### Sales Enquiry Status
```
draft → submitted → punched → verified → purchase_pending → rate_pending → approval_pending → quotation_created → quotation_sent → follow_up → won/lost/cancelled
```

### Purchase Quote Status
```
draft → submitted → under_review → vendor_quote_pending → rate_finalized → sent_to_costing → approved/rejected/revised
```

### Product Status
```
pending_review → pending_mis_review → active
```

## Seed Scripts
Run these to populate master data:
```bash
cd apps/api
npx ts-node -r tsconfig-paths/register src/database/seed-master-data.ts
npx ts-node -r tsconfig-paths/register src/database/seed-rate-master-data.ts
```

## Server Commands
```bash
cd apps/api
npm run start:dev  # Development with watch
npm run start       # Production
```

## Auth
- Login: `POST /api/v1/auth-v2/login`
- Test user: `admin@erp.com` / `Demo@1234`
- All protected routes require `Authorization: Bearer <token>`

## Important Notes
1. **Port**: Server runs on port 3001
2. **Database**: PostgreSQL via Supabase connection
3. **SKU Generation**: Auto-increments using number_series table
4. **CustomerId**: Optional for sales enquiries (can use buyer details directly)
5. **Column Names**: Always verify DB column names vs entity properties
