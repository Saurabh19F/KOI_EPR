# KOI-ERP Developer Onboarding & Business Flow Guide

Welcome to the **KOI-ERP System (KOI-ERPP)**! This guide is designed for developers, architects, and product managers to quickly grasp how this system is structured, how the front-end and back-end communicate, and how the core business workflows operate step-by-step.

---

## 1. What is KOI-ERP?

KOI-ERP is a cloud-native, multi-tenant Enterprise Resource Planning (ERP) application. It is primarily built to manage:
1. **Sales Enquiries & Customer Relations**: Logging lead/enquiry requests and generating customer quotes.
2. **Logistics & Rate Analysis**: Calculating complex landed costs based on origins, destinations, container sizes, ocean freight, custom duties, and local haulage rates.
3. **Purchase & Procurement**: Directing quotation requests (RFQs) to vendors, comparing pricing tables, and generating purchase orders (POs).
4. **Inventory & Warehouse Tracking**: Tracking physical stock by location, warehouse zones, and batch numbers.
5. **Workflows & Task Approvals**: Setting step-by-step checklist validation steps (FMS) and multi-level manager approvals for pricing sheets and purchases.

---

## 2. Tech Stack at a Glance

The application is configured as a Monorepo containing a separate React-based client and a Node.js-based server:

```
KOI-ERPP/ (Monorepo)
├── apps/
│   ├── web/        <-- Frontend (Next.js 14, React 18, Zustand, TailwindCSS)
│   └── api/        <-- Backend (NestJS 10, TypeORM, Postgres, Redis, BullMQ)
```

- **Frontend**: Next.js 14 utilizing the new App Router structure, Styled with TailwindCSS and pre-built interactive UI blocks from Shadcn/UI. Client data-fetching and caching is done via TanStack React Query, while local user states are stored in Zustand.
- **Backend**: NestJS 10, a modular Node.js framework. Database access is handled via TypeORM. Redis acts as a fast cache and manages background job processing via BullMQ.
- **Database**: PostgreSQL (accessible via Supabase or Neon). Features Row Level Security (RLS) to keep company data strictly separate.
- **Object Storage**: S3-compatible file upload system (MinIO for local development, AWS S3 for production).

---

## 3. The Core Business Lifecycle

The strength of KOI-ERP lies in how different modules connect to carry out business operations. Below is a detailed walkthrough of the three primary lifecycles in the system.

### Lifecycle A: Sales Enquiry to Quotation (The Selling Cycle)

When a customer makes an enquiry, the system processes it as follows:

```
[Customer Enquiry] ➔ [FMS Task Checklist] ➔ [Rate Analysis Worksheet] ➔ [Customer Quotation]
```

1. **Creating the Enquiry**: A sales executive logs a customer's inquiry under **Sales ➔ Enquiries ➔ New**. The system automatically issues a tracking number (e.g. `ENQ-2026-00001`) using SQL number series generation.
2. **Automated FMS Workflows**: Once submitted, the internal Event Bus broadcasts an event. The **FMS Module** listens to this event and automatically builds checklist tasks (e.g., "Verify label compliance," "Approve artwork dimensions") assigned to designers and specialists.
3. **Pricing Calculations**: The sales team cannot quote a final price until the landing costs are compiled. The system transitions the enquiry status to `RATE_PENDING`, signaling the purchase department to source pricing sheets.
4. **Generating the Quotation**: Once costs are locked in the **Rate Analysis** module, a formal customer quotation is generated and sent to the client.

---

### Lifecycle B: Sourcing & Procurement (The Purchase Cycle)

The purchase department works parallelly to obtain cost estimates:

```
[Sales items] ➔ [RFQ (Purchase Quote)] ➔ [Vendor Quotes Input] ➔ [Price Analysis & Selection]
```

1. **Generating the RFQ**: Under **Purchase ➔ Quotes**, a manager generates an RFQ (`PUR-2026-00001`) from an active sales enquiry.
2. **Recording Vendor Estimates**: Suppliers provide quotes containing:
   - Base cost of the product.
   - Freight charges (Air/Sea/Road).
   - Minimum Order Quantity (MOQ).
3. **Compare & Select**: The system lists all vendor responses side-by-side, auto-calculates local landed rates (converting currencies if necessary), and suggests the most economical supplier.
4. **Issuing the Purchase Order**: Once a vendor is selected and approved via the workflow engine, the system generates a Purchase Order (`PO-2026-00001`).

---

### Lifecycle C: Fulfillment & Inventory Tracing (The Stock Cycle)

This lifecycle governs warehouse transactions and delivery:

```
[Purchase Order] ➔ [GRN Receipt] ➔ [Stock Inventory] ➔ [Delivery Challan] ➔ [Invoice & Payment]
```

1. **Receiving Stock (GRN)**: When the vendor ships the goods to a warehouse, a warehouse worker generates a Goods Receipt Note (`GRN-2026-00001`). 
2. **Stock Update**: The GRN calls a database trigger function (`fn_update_inventory`) which creates a transaction log and updates the physical balance in the `inventory` table (adjusting available vs. reserved quantities).
3. **Shipment (Delivery Challan)**: When the sales order is ready to dispatch to the customer, a Delivery Challan (`DC-2026-00001`) is issued, deducting goods from the warehouse inventory.
4. **Billing (Invoice & Payments)**: A Sales Invoice (`INV-2026-00001`) is generated. Finally, customer payments are registered under Payments Received, updating the customer's outstanding balance ledger.

---

## 4. Understanding the Database

KOI-ERP uses a relational PostgreSQL schema. Every tenant organization is isolated using Row Level Security (RLS) rules.

### 4.1 Tenant Isolation (RLS) in Action
We do **not** run separate databases for different companies. Instead, we use a single database where almost every table has a `company_id` column.

When a user logs in, their JWT token contains their `company_id`. The backend database connection executes a lightweight session setter:
```sql
SET LOCAL request.jwt_claim_company_id = 'your-company-uuid-here';
```
PostgreSQL automatically filters every select, update, and delete query using RLS policies, ensuring a user never sees data belonging to another company:
```sql
CREATE POLICY "Tenant isolation on products" ON products
    FOR ALL USING (company_id = auth.user_company_id());
```

### 4.2 Automated Functions & Triggers
The database utilizes custom triggers to maintain data integrity and automate indexing:
- **`fn_get_next_number(module)`**: Increments and returns serial numbers (e.g. `ENQ-2026-00045`) preventing race conditions during simultaneous entry creation.
- **`fn_audit_trigger()`**: Automatically runs on every modification. It captures the user's ID, the table name, the action (INSERT/UPDATE/DELETE), and dumps a JSON diff of the changed columns into the `audit_logs` table.
- **`fn_update_inventory(...)`**: Automatically updates stock tables and records historical transaction lines when goods are moved, adjusted, or received.

---

## 5. Development Code Map

Here is a quick guide on where files live and how they work.

### 5.1 Frontend (`apps/web/`)

- **`/src/app/` (Next.js App Router)**: Layout structures and routing pages.
- **`/src/components/ui/` (Shadcn/UI)**: Basic inputs, dialog popups, date pickers, dropdown selectors, and buttons.
- **`/src/components/forms/`**: Reusable form setups (e.g. `enquiry-form.tsx`) using Zod schemas to validate fields before shipping requests to the API.
- **`/src/hooks/`**: Handles server queries. For example, `useProducts.ts` calls `TanStack React Query` to trigger fetching from `/api/v1/masters/products` and cache the resulting array.
- **`/src/lib/api.ts`**: Axios wrapper instance preconfigured to automatically attach JWT tokens to Request Headers and handle HTTP 401 token refresh loops seamlessly.

### 5.2 Backend (`apps/api/`)

- **`/src/main.ts`**: Bootstraps the application, registers global filters, sets CORS rules, and configures cookie parsers.
- **`/src/modules/`**: Contains the 24 modules. Each module has a specific structure:
  - **`*.entity.ts`**: The TypeORM model mapping database tables.
  - **`*.controller.ts`**: The routing controller mapping path variables and HTTP verbs (`@Get()`, `@Post()`).
  - **`*.service.ts`**: The business logic provider processing entities and calculations.
  - **`dto/`**: Data Transfer Objects specifying input payload properties and validation rules (using `class-validator`).
- **`/src/common/`**: Houses global guards (`JwtAuthGuard`, `RolesGuard`), decorators (`@CurrentUser()`), and custom middleware interceptors.

---

## 6. How-To Guides for Developers

### How to Add a New REST Endpoint
1. Open the relevant backend module folder (e.g. `apps/api/src/modules/sales/`).
2. Add a method in the controller:
   ```typescript
   @Get(':id/summary')
   @UseGuards(JwtAuthGuard)
   async getSummary(@Param('id') id: string) {
       return this.salesService.getSummary(id);
   }
   ```
3. Implement `getSummary(id)` inside the module's service class, utilizing TypeORM repositories to fetch and format the database rows.

### How to Create a New Table & Run Migrations
1. Add a new Entity file `*.entity.ts` in the appropriate NestJS module.
2. Register the entity in the module configuration metadata `imports: [TypeOrmModule.forFeature([NewEntity])]`.
3. Generate the database migration:
   ```bash
   npm run migration:generate --workspace=apps/api -- src/database/migrations/AddCustomTable
   ```
4. Apply the schema change:
   ```bash
   npm run migration:run --workspace=apps/api
   ```

### Troubleshooting: Database Connection Timeouts
If the console displays `Connection terminated due to connection timeout`:
1. This is usually due to firewall restrictions blocking the Supabase/Neon PostgreSQL endpoints.
2. In local development environments, switch database URL configs to query a local database instance. Run a Postgres instance inside Docker using:
   ```bash
   docker run -d --name erp-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=erp -p 5432:5432 postgres:15
   ```
3. Update `apps/api/.env` database strings to target `localhost:5432`.

---
*Document compiled for the KOI-ERPP monorepo. Keep this updated as you scale.*
