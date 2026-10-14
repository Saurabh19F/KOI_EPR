# ERP Application - Complete Test Checklist
## Senior QA Tester Document

---

## 📋 TEST EXECUTION TRACKER

| Test ID | Module | Test Case | Priority | Status | Notes |
|---------|--------|----------|----------|--------|-------|
| TC001 | Login | Admin Login | P0 | | |
| TC002 | Login | Sales Manager Login | P0 | | |
| TC003 | Login | Purchase User Login | P0 | | |
| TC004 | Sidebar | Admin sees all menus | P0 | | |
| TC005 | Sidebar | Sales User sees only Sales + Masters | P0 | | |
| TC006 | Dashboard | Dashboard loads with data | P1 | | |
| TC007 | Masters | Products list loads | P1 | | |
| TC008 | Masters | Create Product works | P1 | | |
| TC009 | Masters | Customers dropdown works | P1 | | |
| TC010 | Masters | Currency Rates show in dropdown | P1 | | |
| TC011 | Sales | Create Enquiry works | P0 | | |
| TC012 | Sales | Submit Enquiry works | P0 | | |
| TC013 | Purchase | Create Quote from Enquiry | P1 | | |
| TC014 | Purchase | Add Vendor Quote | P1 | | |
| TC015 | Rate | Currency conversion works | P1 | | |
| TC016 | FMS | Tasks visible | P2 | | |
| TC017 | Reports | Reports load | P2 | | |
| TC018 | Admin | User Management works | P2 | | |
| TC019 | Role-Based | Admin sees Admin menu | P0 | | |
| TC020 | Role-Based | Sales User cannot see Admin menu | P0 | | |

---

## 🔐 LOGIN TESTING

### Test Case 1: Admin Login
```
URL: http://localhost:3000
Step 1: Enter email: admin@erp.com
Step 2: Enter password: admin123
Step 3: Click "Sign in to Dashboard"

Expected Result:
✅ Login successful
✅ Redirect to Dashboard
✅ Sidebar shows ALL menus (Dashboard, Masters, Sales, Purchase, Rate, FMS, Reports, Admin)
✅ User name shows "Admin User"
```

### Test Case 2: Sales Manager Login
```
URL: http://localhost:3000
Step 1: Enter email: neha@erp.com
Step 2: Enter password: admin123
Step 3: Click "Sign in to Dashboard"

Expected Result:
✅ Login successful
✅ Sidebar shows: Dashboard, Masters, Sales, Reports
✅ Sidebar DOES NOT show: Purchase, Rate, FMS, Admin
```

### Test Case 3: Purchase User Login
```
URL: http://localhost:3000
Step 1: Enter email: sneha@erp.com
Step 2: Enter password: admin123
Step 3: Click "Sign in to Dashboard"

Expected Result:
✅ Login successful
✅ Sidebar shows: Dashboard, Masters, Purchase, Reports
✅ Sidebar DOES NOT show: Sales, Rate, FMS, Admin
```

### Test Case 4: Costing Manager Login
```
URL: http://localhost:3000
Step 1: Enter email: priya@erp.com
Step 2: Enter password: admin123
Step 3: Click "Sign in"

Expected Result:
✅ Sidebar shows: Dashboard, Masters, Purchase, Rate, FMS, Reports
✅ Sidebar DOES NOT show: Sales, Admin
```

---

## 📊 DASHBOARD TESTING

### Test Case 6: Dashboard Loads
```
Step 1: Login as admin
Step 2: Verify Dashboard page loads
Step 3: Check if stats cards visible:
  - Pending Enquiries count
  - Delayed Tasks count
  - Recent Activities
  - Quick Actions

Expected Result:
✅ Dashboard loads without errors
✅ All stat cards visible
✅ Data displays correctly
```

### Test Case 7: Dashboard Stats Update
```
Step 1: Create a Sales Enquiry
Step 2: Go to Dashboard
Step 3: Check "Pending Enquiries" count increased by 1

Expected Result:
✅ Count updates correctly
```

---

## 🏢 MASTERS MODULE TESTING

### Test Case 8: Products Page
```
Step 1: Go to Masters > Products
Step 2: Check if products list loads
Step 3: Click "Add Product"
Step 4: Fill form:
  - Product Name: "Test Product"
  - Category: Select any
  - Segment: Select any
  - Group: Select any
  - Brand: Select any
Step 5: Click Save

Expected Result:
✅ Products list loads
✅ Add form opens
✅ Save works
✅ Product appears in list
```

### Test Case 9: Customers Dropdown
```
Step 1: Go to Masters > Customers
Step 2: Click "Add Customer"
Step 3: Check Zone dropdown
Step 4: Select zone (USA, UK, EU, etc.)
Step 5: Fill customer details
Step 6: Save

Expected Result:
✅ Zone dropdown shows options: USA, UK, EU, DOM, ME, APAC
✅ Customer Code auto-generates
✅ Save works
```

### Test Case 10: Currency Rates in Dropdown
```
Step 1: Go to Masters > Currency Rates
Step 2: Check if currency list shows:
  - USD - US Dollar - 83.50
  - GBP - British Pound - 105.25
  - EUR - Euro - 90.75
  - AED - UAE Dirham - 22.75
  - INR - Indian Rupee - 1.00

Expected Result:
✅ All currencies visible
✅ Rates display correctly
```

### Test Case 11: All Master Dropdowns
```
Step 1: Go to Sales > New Enquiry
Step 2: Check each dropdown:

Customer Dropdown:
Expected: Shows customers from customers table

Port Dropdown:
Expected: Shows ports (JNPT, Mundra, Chennai, etc.)

Currency Dropdown:
Expected: Shows USD, GBP, EUR, AED, INR

Payment Terms Dropdown:
Expected: Shows Net 30, Net 60, Advance, etc.

Expected Result:
✅ All dropdowns populate with data from database
✅ No empty dropdowns
```

---

## 💼 SALES MODULE TESTING

### Test Case 12: Create Sales Enquiry
```
Step 1: Go to Sales > Sales Enquiry Order
Step 2: Click "+ New Enquiry"
Step 3: Fill form:
  - Customer: Select from dropdown
  - PO Number: "PO-TEST-001"
  - Port of Loading: Mumbai
  - Contact Person: Test Person
  - Contact Number: 9876543210
Step 4: Add Item:
  - Click "Add Item"
  - Product Name: "Test Biscuit"
  - Quantity: 100
  - CBM: 0.5
  - Target Price: 50
Step 5: Click "Save Draft"

Expected Result:
✅ Enquiry creates successfully
✅ Enquiry number auto-generates (ENQ-AMT-2026-XXXX)
✅ Status = Draft
```

### Test Case 13: Submit Enquiry
```
Step 1: Open Draft Enquiry
Step 2: Review details
Step 3: Click "Submit"

Expected Result:
✅ Status changes to "Submitted"
✅ Success message shows
✅ Enquiry moves to Submitted tab
```

### Test Case 14: Enquiry Workflow
```
Step 1: Create and Submit Enquiry
Step 2: Login as Sales Manager (neha@erp.com)
Step 3: Find the enquiry in Pending Approvals
Step 4: Click Approve

Expected Result:
✅ Status → Punching → Verified → Purchase Pending
```

---

## 🛒 PURCHASE MODULE TESTING

### Test Case 15: Create Purchase Quote
```
Step 1: Login as Purchase User (sneha@erp.com)
Step 2: Go to Purchase > Purchase Quote
Step 3: Click "+ From Enquiry" or "+ New Quote"
Step 4: Select an Enquiry
Step 5: Items auto-populate
Step 6: Add Vendor Quote:
  - Select Vendor
  - Unit Price: 45
  - Lead Time: 7 days
Step 7: Click Save Draft

Expected Result:
✅ Quote creates successfully
✅ Items from enquiry populate
✅ Vendor quote saves
```

### Test Case 16: Vendor Comparison
```
Step 1: Open Purchase Quote
Step 2: Add 2-3 vendor quotes for same item
Step 3: Check comparison view

Expected Result:
✅ System shows comparison table
✅ Highlights best vendor (lowest rate)
```

---

## 📈 RATE MODULE TESTING

### Test Case 17: Currency Rate Conversion
```
Step 1: Login as Costing Manager (priya@erp.com)
Step 2: Go to Rate > Price Analysis
Step 3: Click "+ New Analysis"
Step 4: Select a Purchase Quote
Step 5: Check currency rates applied:
  - USD × 83.50
  - GBP × 105.25
  - EUR × 90.75

Expected Result:
✅ Currency conversion works
✅ Final price calculates correctly
```

### Test Case 18: Lock Rates
```
Step 1: Create Price Analysis
Step 2: Calculate all rates
Step 3: Click "Lock"

Expected Result:
✅ Rates lock
✅ Cannot edit locked rates
```

---

## ✅ FMS MODULE TESTING

### Test Case 19: View Tasks
```
Step 1: Login as any user
Step 2: Go to FMS > Tasks
Step 3: Check if tasks list loads

Expected Result:
✅ Tasks visible
✅ My Tasks shows assigned tasks
✅ Status badges show correct colors
```

---

## 📋 REPORTS MODULE TESTING

### Test Case 20: Generate Report
```
Step 1: Login as Admin or MIS User
Step 2: Go to Reports
Step 3: Select "Sales Enquiry Status"
Step 4: Set date range
Step 5: Click Generate

Expected Result:
✅ Report generates
✅ Data matches actual records
```

---

## ⚙️ ADMIN MODULE TESTING

### Test Case 21: User Management (Admin Only)
```
Step 1: Login as Admin (admin@erp.com)
Step 2: Go to Admin > Users
Step 3: Check user list shows all users with roles:
  - admin@erp.com - ADMIN
  - neha@erp.com - SALES_MANAGER
  - amit@erp.com - SALES_USER
  - rahul@erp.com - PURCHASE_MANAGER
  - sneha@erp.com - PURCHASE_USER
  - priya@erp.com - COSTING_MANAGER
  - vikram@erp.com - MIS_USER

Expected Result:
✅ All users visible
✅ Role column shows correct roles
```

---

## 🔒 ROLE-BASED ACCESS CONTROL TESTING

### Test Case 22: Admin Sees Everything
```
Login: admin@erp.com / admin123

Expected Menus:
✅ Dashboard
✅ Masters (Products, Customers, Vendors, etc.)
✅ Sales
✅ Purchase
✅ Rate Calculation
✅ FMS
✅ Reports
✅ Admin (Users, Roles, Settings)
```

### Test Case 23: Sales User - Limited Access
```
Login: amit@erp.com / admin123

Expected Menus:
✅ Dashboard
✅ Masters
✅ Sales
❌ Purchase (should NOT see)
❌ Rate Calculation (should NOT see)
❌ FMS (should NOT see)
❌ Admin (should NOT see)

Expected: Can only see Dashboard, Masters, Sales, Reports
```

### Test Case 24: Purchase User - Limited Access
```
Login: sneha@erp.com / admin123

Expected Menus:
✅ Dashboard
✅ Masters
❌ Sales (should NOT see)
✅ Purchase
❌ Rate Calculation (should NOT see)
❌ FMS (should NOT see)
❌ Admin (should NOT see)

Expected: Can only see Dashboard, Masters, Purchase, Reports
```

### Test Case 25: Costing Manager - Specific Access
```
Login: priya@erp.com / admin123

Expected Menus:
✅ Dashboard
✅ Masters
❌ Sales (should NOT see)
✅ Purchase
✅ Rate Calculation
✅ FMS
❌ Admin (should NOT see)
```

---

## 🐛 BUG REPORT TEMPLATE

| Field | Value |
|-------|-------|
| Bug ID | |
| Module | |
| Page/Feature | |
| Test Case ID | |
| Severity | P0/P1/P2/P3 |
| Priority | High/Medium/Low |
| Environment | |
| Browser | Chrome/Firefox/Edge |
| Steps to Reproduce | 1. 2. 3. |
| Expected Behavior | |
| Actual Behavior | |
| Screenshots | Attach |
| Console Errors | Paste error log |

---

## ✅ TEST SIGN-OFF

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tester | | | |
| Developer | | | |
| QA Lead | | | |

---

## 📝 DAILY TEST NOTES

Use this section for daily testing notes:

```
Date: _________

Issues Found:
1.
2.
3.

Working Features:
1.
2.
3.

Blockers:
1.
```

---

## 🎯 CRITICAL TEST SCENARIOS (Must Pass)

1. ☐ Login works for all users
2. ☐ Sidebar shows correct menus per role
3. ☐ Admin cannot be accessed by non-admin
4. ☐ Sales Enquiry creates without error
5. ☐ All dropdowns populate from database
6. ☐ Currency rates show in dropdowns
7. ☐ Create/Edit/Update works in all modules
8. ☐ Logout works
9. ☐ Session timeout works
10. ☐ No console errors in production
