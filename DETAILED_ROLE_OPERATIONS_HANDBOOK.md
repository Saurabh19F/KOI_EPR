# KOI-ERP Detailed Role-Wise Operations Handbook

This handbook details the step-by-step, screen-by-screen, and button-by-button actions for each of the 7 user roles in **KOI-ERP (KOI-ERPP)**. Use this manual to understand exactly what each user experiences, what inputs they fill, and how tasks are handed off between roles.

---

## 1. System Administrator (Admin)

The Admin is responsible for initializing the organization, setting up user privileges, adjusting number series prefixes, and auditing logs.

### Step-by-Step Operational Checklist:

#### Phase A: Login & Sidebar Overview
1. Logs in at `/login` using `admin@erp.com`.
2. Accesses the master sidebar layout showing all system folders: **Dashboard**, **Masters**, **Sales**, **Purchase**, **Rate**, **Inventory**, **FMS**, **Reports**, and **Settings**.

#### Phase B: Organization Setup
1. Navigates to **Settings ➔ Company**.
2. Fills in the general organizational form:
   * **Legal Company Name** (e.g. `KOI Import Export Pvt Ltd`)
   * **GSTIN** (e.g. `09AAAAA0000A1Z5`)
   * **PAN** (e.g. `AAAAA0000A`)
   * **Address, City, State, Country, Pincode**
3. Clicks **"Save Company Settings"**:
   * *API Call*: `PUT /api/v1/platform/companies/:id`
   * *Database Impact*: Updates the row in the `companies` table.

#### Phase C: User Registration & Role Assignment
1. Navigates to **Settings ➔ Users**.
2. Clicks the **"Add User"** button (opens a slide-over form).
3. Inputs the employee's details:
   * **Email Address** (e.g. `vikram@erp.com`)
   * **Full Name** (e.g. `Vikram Singh`)
   * **Initial Password** (e.g. `Demo@1234`)
   * **Department Selection Dropdown** (linked to `departments` table)
   * **Role Selection Dropdown** (links the user account to `SALES_MANAGER`, `PURCHASE_MANAGER`, etc.)
4. Clicks **"Create User"**:
   * *API Call*: `POST /api/v1/users`
   * *Database Impact*: Inserts rows into the `users` and `user_roles` tables.
5. (Optional) Navigates to **Settings ➔ Roles ➔ Permissions** to adjust checkbox flags (e.g. checking/unchecking permission flags like `sales.enquiry.approve` for a manager role). Clicks **"Save Permissions"** (`POST /api/v1/users/roles`).

#### Phase D: Number Series Customization
1. Navigates to **Settings ➔ Integrations ➔ Number Series**.
2. Locates module rows (e.g. `SALES_ENQUIRY`, `PURCHASE_ORDER`).
3. Modifies prefix strings (e.g. changing `ENQ` to `KOI-ENQ`) or adjustments to the starting count.
4. Clicks **"Save Number Series"**:
   * *API Call*: `POST /api/v1/admin/settings`
   * *Database Impact*: Updates `number_series` configuration flags.

#### Phase E: Audit Trails Verification
1. Navigates to **Settings ➔ Audit Trails**.
2. Selects filters: **User** (dropdown) or **Target Table** (dropdown).
3. Reviews modification logs detailing old JSON values next to new JSON values.
   * *API Call*: `GET /api/v1/audit?page=1&limit=50`

---

## 2. Sales Executive

The Sales Executive logs customer inquiries, tracks label/design workflows, and follows up on customer quotations.

### Step-by-Step Operational Checklist:

#### Phase A: Client Logging & Customer Entry
1. Logs in using account credentials (e.g. `rahul@erp.com`). The sidebar renders only **Dashboard**, **Masters** (Customers/Products), **Sales**, and **Reports**.
2. Navigates to **Masters ➔ Customers**.
3. Clicks **"New Customer"** button.
4. Fills the customer card fields:
   * **Customer/Buyer Name** (e.g. `Apex Foods UK Ltd`)
   * **Buyer Code** (e.g. `APEX-UK`)
   * **Billing & Shipping Address**
   * **GSTIN** (if domestic)
   * **Default Payment Terms Selection** (linked to `payment_terms`)
5. Clicks **"Save Customer"**:
   * *API Call*: `POST /api/v1/masters/customers`
   * *Database Impact*: Inserts a new row in the `customers` table.

#### Phase B: Logging a New Enquiry
1. Navigates to **Sales ➔ Enquiries ➔ New**.
2. Fills in header parameters:
   * **Select Customer**: Clicks search input, selects `Apex Foods UK Ltd` (auto-populates billing coordinates, country, and city).
   * **Port of Loading / Discharge**: Enter shipping points.
   * **Logistics Flags**: Checks "Export Enquiry" box if international.
   * **Payment Terms / Currency**: Dropdown selections.
3. Adds line items in the product grid:
   * Clicks **"Add Product Row"**.
   * Under **SKU/Product**, selects from dropdown. If it is a new custom product not yet in the catalog, checks "Manual Entry" and inputs *Manual Product Name* and *Product Description*.
   * Fills in **Quantity** (e.g. `10,000 PCS`) and **Expected Rate** (customer's target buy price).
4. Clicks **"Save Enquiry"**:
   * *API Call*: `POST /api/v1/sales-enquiries`
   * *Database Impact*: The DB trigger `fn_get_next_enquiry_number()` runs, generating a number like `ENQ-2026-00045`. Rows are written to `sales_enquiry_orders` and `sales_enquiry_order_items` with status set to `draft`.

#### Phase C: Submitting the Enquiry (Workflow Handoff)
1. Opens `/dashboard/sales/[id]` for the saved enquiry.
2. Clicks the green **"Submit Enquiry"** action button.
3. In the remarks dialog pop-up, enters: *"Client requests 30-day delivery timeline"* and clicks **"Confirm"**:
   * *API Call*: `PATCH /api/v1/sales-enquiries/:id/status` (nextStatus = `submitted`).
   * *Event Bus Cascade*: The Event Bus listener (`fms-event.listener.ts`) intercepts the transition. It automatically writes design approval tasks into the `fms_tasks` database table, assigned to default designers.

#### Phase D: Passing to Purchase (RFQ Sourcing)
1. Monitors status. Once the FMS team checks off packaging requirements, the Sales Executive opens the enquiry detail view.
2. Clicks the **"Send to Purchase"** button:
   * *API Call*: `PATCH /api/v1/sales-enquiries/:id/status` (nextStatus = `purchase_pending`).
   * *Handoff*: Alerts the Purchase team to obtain pricing from vendors.

#### Phase E: Dispatching Quotation to Customer
1. Receives notification that costing has been approved (status = `rate_pending` or `approved`).
2. Clicks **"Create Quotation"** button:
   * *API Call*: `GET /api/v1/sales-enquiries/:id/quotation`
   * *Action*: Downloads / views the PDF quote sheet.
3. Clicks **"Mark Sent"** button:
   * *API Call*: `PATCH /api/v1/sales-enquiries/:id/status` (nextStatus = `quotation_sent`).
4. If the customer accepts the price, clicks **"Mark Won"**:
   * *API Call*: `PATCH /api/v1/sales-enquiries/:id/status` (nextStatus = `won`).
   * *Handoff*: The backend automatically calls `POST /api/v1/sales-orders` to generate a Sales Order, reserving inventory levels.

---

## 3. Purchase Executive

The Purchase Executive maps supplier prices, registers vendor quotes, and inputs logistics freight costs.

### Step-by-Step Operational Checklist:

#### Phase A: Creating the RFQ Folder
1. Logs in using credentials (e.g. `amit@erp.com`). The sidebar displays **Dashboard**, **Masters**, **Purchase**, and **Reports**.
2. Checks notifications for new alerts labeled `purchase_pending`.
3. Navigates to **Purchase ➔ Quotes ➔ New**.
4. Clicks the **"Select Enquiry"** search button (opens dialog list).
5. Types the enquiry number (e.g. `ENQ-2026-00045`), selects it, and clicks **"Confirm"**:
   * *Auto-population*: The system fetches enquiry item parameters, quantities, target rates, buyer destination, country, and populates the RFQ layout.
6. Clicks **"Select Vendor"** search button, queries suppliers, and selects a vendor (e.g. `Sunrise Foods`).
7. Maps **Currency** (USD/INR) and **Payment Terms**.
8. Clicks **"Save Quote Request"**:
   * *API Call*: `POST /api/v1/purchase/quotes`
   * *Database Impact*: Generates number sequence `PUR-2026-00012` and writes rows to `purchase_quotes` and `purchase_quote_items`.

#### Phase B: Entering Vendor Pricing Responses
1. When Sunrise Foods emails their price sheet, the Executive opens `/dashboard/purchase/[id]` for the quote.
2. Clicks the **"Edit"** button (turns table rows into input boxes).
3. For each product line in the grid:
   * Inputs the supplier's **Buying Price** (e.g. `$2.50`).
   * Inputs **GST %** (e.g. `12%`).
   * Inputs **Freight** (e.g. `$0.30` ocean freight per unit).
   * *Auto-calculation*: The frontend grid calculates Landed Cost: `Buying Price * (1 + GST) + Freight`.
   * Inputs vendor parameters: **MOQ**, **Lead Time Days**, and pastes design **Image URLs**.
4. Clicks **"Save Changes"**:
   * *API Call*: `PATCH /api/v1/purchase/quotes/:id`
   * *Database Impact*: Updates lines in the `purchase_quote_items` table.

#### Phase C: Sourcing Handoff (Submission)
1. Clicks **"Submit Quote"** button:
   * *API Call*: `POST /api/v1/purchase/quotes/:id/submit`
   * *Database Impact*: Transitions status from `draft` to `submitted`. Locks input cells.
   * *Handoff*: Places quote in the Purchase Manager's approval queue.

---

## 4. Purchase Manager

The Purchase Manager reviews vendor bids, authorizes vendor selection, and approves landed costing sheets.

### Step-by-Step Operational Checklist:

#### Phase A: Vendor Bids Comparison
1. Logs in using credentials (e.g. `priya@erp.com`).
2. Navigates to **Purchase ➔ Quotes** and filters by status `submitted`.
3. Opens `/dashboard/purchase/[id]`.
4. Reviews the comparative grids evaluating Sunrise Foods quotes side-by-side with other vendor listings.
5. Verifies lead times, shipping MOQs, and landed costs.

#### Phase B: Costing Approval
1. Checks calculated figures.
2. Clicks the green **"Approve Costing"** button:
   * *API Call*: `POST /api/v1/purchase/quotes/:id/approve`
   * *Database Impact*: Shuts down further modifications, transitions quote status to `approved`, and passes rates data to the **Rate Analysis** module.

#### Phase C: Issuing Purchase Orders
1. Navigates to **Purchase ➔ Purchase Orders ➔ New**.
2. Selects the approved purchase quote.
3. Verifies warehouse delivery coordinates.
4. Clicks **"Generate PO"**:
   * *API Call*: `POST /api/v1/purchase-orders`
   * *Database Impact*: The trigger `fn_get_next_number` generates a number like `PO-2026-00018`. Writes records to `purchase_orders` and `purchase_order_items`.

---

## 5. Sales Manager

The Sales Manager verifies incoming customer enquiries, conducts rate audits, configures margins, and approves client quotes.

### Step-by-Step Operational Checklist:

#### Phase A: Enquiry Verification
1. Logs in using credentials (e.g. `vikram@erp.com`).
2. Navigates to **Sales ➔ Enquiries** and filters by status `submitted` or `punched`.
3. Opens `/dashboard/sales/[id]`.
4. Inspects items details and checks for formatting errors.
5. Clicks the **"Verify"** button:
   * *API Call*: `PATCH /api/v1/sales-enquiries/:id/status` (nextStatus = `verified`).
   * *Handoff*: Sends task to purchase executives.

#### Phase B: Rate Sheet Auditing & Customizations
1. Once costing is submitted, navigates to **Rate ➔ Analysis** and opens `/dashboard/rate/[id]`.
2. Evaluates the costing calculator grid.
3. Adjusts parameters if necessary:
   * Clicks **"Edit Rates & Margins"** button.
   * Adjusts base exchange rates (GBP, USD, CAD, AUD) or edits target margin values.
   * Selects local destination port in the **Haulage location** dropdown (Delhi/Mumbai/Bangalore).
   * Clicks **"Save Parameters"** (`PATCH /api/v1/rate/analysis/:id`).
   * Clicks the **"Calculate"** button (`POST /api/v1/rate/analysis/:id/calculate`).
4. Evaluates the resulting margins grid:
   * If margins are healthy, clicks the green **"Approve"** button.
   * If margins are low, clicks **"Reject"** (prompts remarks modal). Inputs remarks: *"Renegotiate vendor quote, freight is too high"* and clicks **"Confirm"** (`POST /api/v1/rate/analysis/:id/reject`).

#### Phase C: Pricing Lock
1. After approving the pricing parameters, accesses the analysis page.
2. Clicks the green **"Lock Rates"** button:
   * *API Call*: `POST /api/v1/rate/analysis/:id/lock`
   * *Database Impact*: Sets status to `locked`. Sets the status of the linked Sales Enquiry to `quotation_created` and populates the `quoted_rate` fields in `sales_enquiry_order_items`.

---

## 6. Warehouse & Inventory Operator

The Warehouse Operator is responsible for receiving stock from suppliers, managing warehouse locations, and loading cargo dispatch boxes.

### Step-by-Step Operational Checklist:

#### Phase A: Goods Receipt Verification (GRN)
1. Logs in (e.g. `neha@erp.com`). Sidebar displays **Dashboard**, **Masters**, and **Inventory**.
2. Navigates to **Inventory ➔ Goods Receipt Notes (GRN) ➔ New**.
3. Selects the supplier **Purchase Order** number from the lookup list.
4. On the loaded details table:
   * Fills in **Accepted Qty** (e.g. `10,000`) and **Rejected Qty** (e.g. `50` broken packaging units).
   * Assigns **Batch Numbers** (e.g. `BT-COF-012`) and **Expiry Dates** (e.g. `2027-12-31`).
   * Maps destination **Warehouse Location** (e.g. `WH-MUMBAI`).
5. Clicks the **"Verify GRN"** button:
   * *API Call*: `POST /api/v1/purchase-orders/grns`
   * *Database Impact*: Creates a `goods_receipt_notes` row. Triggers SQL function `fn_update_inventory` which increments counts in the `inventory` table and logs lines in `inventory_transactions`.

#### Phase B: Internal Warehouse Relocation
1. Navigates to **Inventory ➔ Transfers ➔ New**.
2. Maps relocation details:
   * **Source Warehouse Location** (e.g. `WH-MUMBAI`)
   * **Destination Warehouse Location** (e.g. `WH-BANGALORE`)
   * **Select SKU** (e.g. `SKU-PROD-001`) and **Batch Number**
   * **Transfer Quantity**
3. Clicks **"Confirm Transfer"**:
   * *API Call*: `POST /api/v1/inventory/transfer`
   * *Database Impact*: Updates `inventory` counts across both locations and records transfer history.

#### Phase C: Shipping Orders (Delivery Challans)
1. Navigates to **Inventory ➔ Delivery Challans ➔ New**.
2. Selects the confirmed customer **Sales Order** reference.
3. Maps shipping batches from the inventory picker.
4. Inputs **Vehicle Number** (e.g. `UP-16-AT-9988`) and **Transporter Name** (e.g. `DHL Logistics`).
5. Clicks **"Verify Dispatch"** button:
   * *API Call*: `POST /api/v1/sales-orders/delivery-notes`
   * *Database Impact*: Creates a delivery note. Invokes `fn_update_inventory` to deduct the quantity from inventory.

---

## 7. MIS & Reports Specialist

The MIS Specialist extracts reports, checks audit trails, and audits warehouse stock counts.

### Step-by-Step Operational Checklist:

#### Phase A: Performance Reporting
1. Logs in using credentials (e.g. `sneha@erp.com`). Sidebar shows **Dashboard**, **Reports**, and **Audit Logs**.
2. Navigates to **Reports ➔ Sales Summary**.
3. Selects parameters: **Start Date**, **End Date**, and **Sales Person**.
4. Reviews charts displaying sales volumes and margins.
5. Clicks the **"Export Excel"** button:
   * *API Call*: `GET /api/v1/reports/export/excel/sales`
   * *Action*: Downloads the `.xlsx` file.

#### Phase B: Warehouse Stock Monitoring
1. Navigates to **Reports ➔ Low Stock Alerts**.
2. Reviews the list of products falling below minimum stock parameters.
3. Clicks **"Export PDF"** to create a purchase requisition sheet for the procurement department.
   * *API Call*: `GET /api/v1/reports/export/pdf/low-stock`

#### Phase C: System Audit Check
1. Navigates to **Audit Logs**.
2. Checks status transitions and user history lists to trace modifications.
   * *API Call*: `GET /api/v1/audit/logs`
