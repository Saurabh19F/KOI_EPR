# ERP System - Complete User Guide
## Role-by-Role Breakdown

---

# Table of Contents
1. [Admin](#1-admin)
2. [Sales Manager](#2-sales-manager)
3. [Sales User](#3-sales-user)
4. [Purchase Manager](#4-purchase-manager)
5. [Purchase User](#5-purchase-user)
6. [Costing Manager](#6-costing-manager)
7. [MIS User](#7-mis-user)
8. [Viewer](#8-viewer)

---

## 1. ADMIN

### Overview
The Admin has **full system access**. Can manage everything.

### What Admin Can Do

#### Dashboard
- View all stats (enquiries, quotes, tasks)
- View all company activities
- View all pending tasks

#### Masters (Full CRUD)
| Module | Create | View | Edit | Delete |
|--------|--------|------|------|--------|
| Products | ✅ | ✅ | ✅ | ✅ |
| Customers | ✅ | ✅ | ✅ | ✅ |
| Vendors | ✅ | ✅ | ✅ | ✅ |
| Categories | ✅ | ✅ | ✅ | ✅ |
| Brands | ✅ | ✅ | ✅ | ✅ |
| GST Rates | ✅ | ✅ | ✅ | ✅ |
| Currency Rates | ✅ | ✅ | ✅ | ✅ |
| Haulage Charges | ✅ | ✅ | ✅ | ✅ |
| Payment Terms | ✅ | ✅ | ✅ | ✅ |
| Ports | ✅ | ✅ | ✅ | ✅ |

#### Sales (Full Access)
- Create, edit, submit enquiries
- Approve/reject enquiries
- Generate PDF/Excel
- Clone enquiries

#### Purchase (Full Access)
- Create purchase quotes
- Compare vendor quotes
- Approve/reject quotes
- Generate reports

#### Rate Calculation (Full Access)
- Create price analysis
- Calculate rates with currency conversion
- Lock/unlock rates
- Approve/reject rates

#### FMS (Full Access)
- Create/edit/view tasks
- Assign tasks
- Complete/escalate tasks
- View all company tasks

#### Admin Panel
- **Users**: Create, edit, delete users
- **Roles**: Manage roles and permissions
- **Permissions**: Assign permissions to roles
- **Settings**: System configuration
- **Number Series**: Auto-generated codes
- **Email Templates**: Email configurations
- **Help Tickets**: Support tickets

#### Reports
- View all reports
- Export all reports

---

## 2. SALES MANAGER

### Overview
Manages the sales team. Can approve sales and view all sales data.

### Step-by-Step Workflow

#### Daily Tasks
1. **Check Dashboard**
   - See pending enquiries
   - Check delayed tasks
   - Review recent activities

2. **Manage Enquiries**
   - View all team enquiries
   - Review submitted enquiries
   - Approve or send back for revision

3. **Approve Enquiries**
   - Review submitted enquiries
   - Check pricing and details
   - Click **Approve** or **Reject**
   - Add comments if rejecting

4. **Monitor Team Performance**
   - View reports
   - Check pending tasks
   - Track enquiry status

### Permissions
| Action | Allowed |
|--------|---------|
| View all sales | ✅ |
| Create enquiries | ✅ |
| Edit own/team's enquiries | ✅ |
| Approve enquiries | ✅ |
| Reject enquiries | ✅ |
| View all reports | ✅ |
| Export reports | ✅ |
| Manage users | ❌ |
| Manage settings | ❌ |

---

## 3. SALES USER

### Overview
Creates and manages sales enquiries. Limited to own data.

### Step-by-Step Workflow

#### Step 1: Login
```
Email: amit@erp.com
Password: admin123
```

#### Step 2: Create Enquiry
1. Go to **Sales** → **Sales Enquiry Order**
2. Click **+ New Enquiry**
3. Fill form:
   - Select Customer
   - Select Port of Loading
   - Add items (products with quantities)
4. Click **Save Draft**

#### Step 3: Add Items
1. In enquiry, click **Add Item**
2. Select Product (or enter new product name)
3. Enter:
   - Quantity
   - CBM (Cubic Meters)
   - Target Price
4. System auto-calculates total CBM

#### Step 4: Submit Enquiry
1. Review all details
2. Click **Submit**
3. Enquiry status changes: `Draft` → `Submitted`

#### Step 5: Track Status
Status changes:
```
Draft → Submitted → Punching → Verified → Purchase Pending
→ Vendor Quote Pending → Rate Pending → Approval Pending
→ Quotation Created → Quotation Sent → Won/Lost/Cancelled
```

### Permissions
| Action | Allowed |
|--------|---------|
| View own enquiries | ✅ |
| Create enquiries | ✅ |
| Edit own (draft) enquiries | ✅ |
| Submit enquiries | ✅ |
| Approve enquiries | ❌ |
| Delete enquiries | ❌ |
| View all reports | ✅ (own only) |

---

## 4. PURCHASE MANAGER

### Overview
Manages vendor quotes and purchase decisions. Can approve quotes.

### Step-by-Step Workflow

#### Step 1: Check Dashboard
- Pending purchase quotes
- Vendor comparison ready
- Delayed tasks

#### Step 2: Review Purchase Quotes
1. Go to **Purchase** → **Purchase Quote**
2. Select a quote
3. View vendor quotes side-by-side

#### Step 3: Compare Vendors
1. Open a quote with multiple vendor quotes
2. System shows comparison table:
   | Vendor | Rate | Lead Time | Quality Score |
   |--------|------|----------|---------------|
   | Vendor A | ₹50 | 7 days | 95% |
   | Vendor B | ₹48 | 10 days | 90% |
   | Vendor C | ₹52 | 5 days | 98% |

3. System highlights **Best Vendor** (lowest rate)

#### Step 4: Select Vendor
1. Review vendor details
2. Click **Select Vendor**
3. Confirm selection
4. System locks the choice

#### Step 5: Approve Quote
1. Review final pricing
2. Click **Approve** or **Reject**
3. Add comments

#### Step 6: Forward to Costing
1. Approved quotes auto-send to Rate Calculation
2. Costing team calculates final prices

### Permissions
| Action | Allowed |
|--------|---------|
| View all purchase quotes | ✅ |
| Create quotes | ✅ |
| Edit quotes | ✅ |
| Compare vendors | ✅ |
| Approve quotes | ✅ |
| View all reports | ✅ |

---

## 5. PURCHASE USER

### Overview
Creates and manages purchase quotes from enquiries.

### Step-by-Step Workflow

#### Step 1: Create Quote from Enquiry
1. Go to **Purchase** → **Purchase Quote**
2. Click **+ From Enquiry**
3. Select existing Sales Enquiry
4. System auto-populates:
   - Customer details
   - Items
   - Quantities

#### Step 2: Add Vendor Quotes
1. Click **Add Vendor Quote**
2. Select Vendor
3. Enter:
   - Unit Price
   - Lead Time
   - Payment Terms
   - Quality Score

#### Step 3: Get Multiple Quotes
1. Add 2-3 vendor quotes per item
2. System calculates:
   - Best rate
   - Total cost
   - Best vendor

#### Step 4: Submit for Approval
1. Review all details
2. Click **Submit**
3. Purchase Manager reviews

### Permissions
| Action | Allowed |
|--------|---------|
| View own quotes | ✅ |
| Create quotes | ✅ |
| Edit own (draft) quotes | ✅ |
| Add vendor quotes | ✅ |
| Submit for approval | ✅ |
| Approve quotes | ❌ |

---

## 6. COSTING MANAGER

### Overview
Manages pricing calculations and currency conversions.

### Step-by-Step Workflow

#### Step 1: Check Dashboard
- Pending price analysis
- Currency rate updates needed
- Locked rates

#### Step 2: Create Price Analysis
1. Go to **Rate Calculation** → **Price Analysis**
2. Click **+ New Analysis**
3. Select Purchase Quote (or create fresh)
4. Add items from purchase quote

#### Step 3: Set Currency Rates
1. Go to **Currency Rate Master**
2. Update rates for:
   - USD, GBP, EUR, AED, SGD, AUD
3. System applies margin automatically

#### Step 4: Set Haulage Charges
1. Go to **Haulage/Freight**
2. Update charges per location:
   - Delhi: ₹185,000
   - Mumbai: ₹85,000

#### Step 5: Calculate Final Rates
1. Open Price Analysis
2. Click **Calculate**
3. System calculates:
   ```
   Landing Cost = Purchase Price + Currency Conversion + Margin
   Final Rate = Landing Cost + GST + Haulage + Freight
   ```

#### Step 6: Approve and Lock
1. Review calculated rates
2. Click **Approve**
3. Click **Lock** (prevents further edits)

### Rate Calculation Formula
```
Landing Cost (LC) = Vendor Price × Currency Rate × Margin
GST Amount = LC × GST%
Haulage = Location Rate
Final Price = LC + GST + Haulage + Freight
```

### Permissions
| Action | Allowed |
|--------|---------|
| View all price analysis | ✅ |
| Create analysis | ✅ |
| Edit analysis | ✅ |
| Calculate rates | ✅ |
| Approve rates | ✅ |
| Lock/unlock rates | ✅ |
| Update currency rates | ✅ |

---

## 7. MIS USER

### Overview
Reports and analytics. View-only access to most modules.

### Step-by-Step Workflow

#### Step 1: Access Reports
1. Go to **Reports**
2. Select report type:
   - Sales Reports
   - Purchase Reports
   - Rate Reports
   - FMS Reports
   - Delay Reports
   - User-wise Reports

#### Step 2: Generate Report
1. Select filters:
   - Date Range
   - Customer
   - Status
   - User
2. Click **Generate**
3. View results in table/chart

#### Step 3: Export
1. Click **Export**
2. Choose format:
   - Excel (.xlsx)
   - PDF
3. File downloads automatically

#### Step 4: Dashboard Monitoring
- View company-wide stats
- Track KPIs
- Monitor team performance

### Available Reports
| Report | Description |
|--------|-------------|
| Sales Enquiry Status | All enquiries by status |
| Sales Performance | By user, customer, product |
| Purchase Summary | Quotes by vendor, status |
| Rate Analysis | Price trends |
| FMS Task Status | Tasks by user, overdue tasks |
| Delay Report | All delayed items |
| User Performance | Activity by user |

### Permissions
| Action | Allowed |
|--------|---------|
| View all masters | ✅ |
| View all reports | ✅ |
| Export reports | ✅ |
| Create/Edit data | ❌ |
| Approve anything | ❌ |

---

## 8. VIEWER

### Overview
Read-only access to view data only.

### What Viewer Can See
- Dashboard (view stats)
- Masters (read)
- Reports (view only)
- FMS Tasks (view assigned tasks)

### What Viewer Cannot Do
- Create anything
- Edit anything
- Delete anything
- Approve anything
- Export reports

---

# Common Workflows

## Complete Sales-to-Payment Flow

```
1. SALES USER creates enquiry
   ↓
2. SALES MANAGER approves
   ↓
3. PURCHASE USER creates purchase quote
   ↓
4. PURCHASE USER adds vendor quotes
   ↓
5. PURCHASE MANAGER compares & approves
   ↓
6. COSTING MANAGER calculates rates
   ↓
7. COSTING MANAGER locks rates
   ↓
8. SALES sends quotation to customer
   ↓
9. FMS tracks follow-up tasks
```

## User Flow Diagram

```
[Login]
    ↓
[Dashboard] ← Shows role-specific widgets
    ↓
[Role-Based Menu]
    ↓
┌─────────┬─────────┬──────────┬─────────┬─────────┐
│Sales    │Purchase │Rate      │Masters  │Reports  │
│Enquiry  │Quote    │Analysis  │Products │Sales    │
│Create   │Create   │Calculate │View     │Purchase │
│Submit   │Compare  │Lock      │         │Rate     │
│         │Approve  │          │         │FMS      │
└─────────┴─────────┴──────────┴─────────┴─────────┘
    ↓
[Notifications] (bell icon)
    ↓
[Logout]
```

---

# Master Data Reference

## Product Categories
| Code | Name |
|------|------|
| BRD | Biscuits & Bakery |
| KRI | Chocolates & Confectionery |
| SNA | Snacks & Savories |
| BVR | Beverages |
| DRY | Dry Fruits |
| FRZ | Frozen Foods |

## Segments
| Code | Name |
|------|------|
| SS | Small Size |
| BB | Big Box |
| RB | Regular |
| FF | Family Pack |

## GST Rates
| Percentage | Name |
|------------|------|
| 0% | Exempt |
| 5% | GST 5% |
| 12% | GST 12% |
| 18% | GST 18% |
| 28% | GST 28% |

## Currency Rates
| Currency | Rate (₹) | Margin |
|----------|----------|--------|
| USD | 83.50 | 0.25 |
| GBP | 105.25 | 0.25 |
| EUR | 90.75 | 0.25 |

## Haulage Charges
| Location | Amount (₹) |
|----------|-------------|
| Delhi | 185,000 |
| Mumbai | 85,000 |
| Chennai | 95,000 |
| Kolkata | 120,000 |

---

# Auto-Generated Codes

| Code Type | Format | Example |
|----------|--------|---------|
| SKU | CCC-SS-GGG-NNNNNN | BRD-SS-GRP-000001 |
| Buyer Code | ZONE-NNNNNN | USA-000055 |
| Enquiry No | ENQ-USER-YYYY-NNNN | ENQ-AMT-2026-0001 |
| Purchase Quote | PUR-YYYY-NNNN | PUR-2026-0001 |
| Price Analysis | PA-YYYY-NNNN | PA-2026-0001 |
| FMS Task | RATEFMS-ENQ*-SKU-USER-STEP | RATEFMS-ENQ-AMT-2026-0149-SKU001-AMT-ACT01 |

---

# Status Codes

## Enquiry Status
| Status | Color | Description |
|--------|-------|-------------|
| draft | Gray | Not submitted |
| submitted | Blue | Awaiting review |
| punched | Blue | Items punched |
| verified | Blue | Verified |
| purchase_pending | Amber | Waiting for purchase |
| vendor_quote_pending | Amber | Waiting for quotes |
| rate_pending | Amber | Awaiting rate calc |
| approval_pending | Amber | Awaiting approval |
| quotation_created | Green | Quotation ready |
| quotation_sent | Green | Sent to customer |
| won | Green | Deal closed |
| lost | Red | Deal lost |
| cancelled | Gray | Cancelled |

## Task Status
| Status | Color |
|--------|-------|
| pending | Gray |
| in_progress | Blue |
| completed | Green |
| delayed | Red |
| escalated | Orange |

---

# Quick Reference Card

| Role | Best For | Cannot Do |
|------|---------|-----------|
| Admin | Everything | - |
| Sales Manager | Approve sales | Manage users |
| Sales User | Create enquiries | Approve |
| Purchase Manager | Vendor decisions | - |
| Purchase User | Create quotes | Approve |
| Costing Manager | Price calculations | - |
| MIS User | Reports | Create/Edit |
| Viewer | View data | Everything |
