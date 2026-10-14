# ERP System - Complete Test Execution Guide

## Status: Permissions Seeded ✅

Based on screenshots, permissions successfully seeded:
- ADMIN: 30 permissions
- SALES_MANAGER: 8 permissions
- SALES_USER: 6 permissions
- PURCHASE_MANAGER: 8 permissions
- PURCHASE_USER: 6 permissions
- COSTING_MANAGER: 11 permissions
- MIS_USER: 8 permissions

---

## 🚀 Quick Test Commands (Run in PowerShell)

### 1. Test Admin Login
```powershell
$body = @{
    email = "admin@erp.com"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Method Post -Uri "http://localhost:3001/api/v1/auth-v2/login" -ContentType "application/json" -Body $body
$response | ConvertTo-Json
```

### 2. Test Sales User Login
```powershell
$body = @{
    email = "amit@erp.com"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Method Post -Uri "http://localhost:3001/api/v1/auth-v2/login" -ContentType "application/json" -Body $body
$response.user | ConvertTo-Json
```

### 3. Test with Token - Get Dashboard
```powershell
# First login to get token
$login = Invoke-RestMethod -Method Post -Uri "http://localhost:3001/api/v1/auth-v2/login" -ContentType "application/json" -Body (@{email="admin@erp.com";password="admin123"} | ConvertTo-Json)

$token = $login.accessToken

# Get Dashboard
Invoke-RestMethod -Method Get -Uri "http://localhost:3001/api/v1/reports/dashboard" -Headers @{Authorization="Bearer $token"} | ConvertTo-Json
```

### 4. Test Currency Rates
```powershell
$login = Invoke-RestMethod -Method Post -Uri "http://localhost:3001/api/v1/auth-v2/login" -ContentType "application/json" -Body (@{email="admin@erp.com";password="admin123"} | ConvertTo-Json)

Invoke-RestMethod -Method Get -Uri "http://localhost:3001/api/v1/rate/currency" -Headers @{Authorization="Bearer $($login.accessToken)"} | ConvertTo-Json
```

### 5. Test Masters - Categories
```powershell
$login = Invoke-RestMethod -Method Post -Uri "http://localhost:3001/api/v1/auth-v2/login" -ContentType "application/json" -Body (@{email="admin@erp.com";password="admin123"} | ConvertTo-Json)

Invoke-RestMethod -Method Get -Uri "http://localhost:3001/api/v1/master/categories" -Headers @{Authorization="Bearer $($login.accessToken)"} | ConvertTo-Json
```

### 6. Test Sales - Create Enquiry
```powershell
$login = Invoke-RestMethod -Method Post -Uri "http://localhost:3001/api/v1/auth-v2/login" -ContentType "application/json" -Body (@{email="amit@erp.com";password="admin123"} | ConvertTo-Json)

$enquiry = @{
    customerId = "test-customer-id"
    referenceNo = "TEST-001"
    notes = "Test Enquiry"
    items = @(
        @{
            productName = "Test Product"
            quantity = 100
            expectedRate = 50
        }
    )
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:3001/api/v1/sales-enquiries" -ContentType "application/json" -Body $enquiry -Headers @{Authorization="Bearer $($login.accessToken)"} | ConvertTo-Json
```

---

## 📋 Expected RBAC Results

### Admin (admin@erp.com)
**Expected Permissions:** 30
```
✅ DASHBOARD_VIEW
✅ MASTERS_VIEW, MASTERS_CREATE, MASTERS_EDIT, MASTERS_DELETE
✅ SALES_VIEW, SALES_CREATE, SALES_EDIT, SALES_DELETE, SALES_APPROVE
✅ PURCHASE_VIEW, PURCHASE_CREATE, PURCHASE_EDIT, PURCHASE_DELETE, PURCHASE_APPROVE
✅ RATE_VIEW, RATE_CREATE, RATE_EDIT, RATE_APPROVE, RATE_LOCK
✅ FMS_VIEW, FMS_CREATE, FMS_EDIT, FMS_ASSIGN
✅ REPORTS_VIEW, REPORTS_EXPORT
✅ ADMIN_USERS, ADMIN_ROLES, ADMIN_SETTINGS
```

**Sidebar Menus:**
- Dashboard ✅
- Masters (all) ✅
- Sales ✅
- Purchase ✅
- Rate Calculation ✅
- FMS ✅
- Reports ✅
- Admin (Users, Roles, Settings) ✅

---

### Sales User (amit@erp.com)
**Expected Permissions:** 6
```
✅ DASHBOARD_VIEW
✅ MASTERS_VIEW
✅ SALES_VIEW, SALES_CREATE, SALES_EDIT
✅ REPORTS_VIEW
```

**Sidebar Menus:**
- Dashboard ✅
- Masters (view only) ✅
- Sales ✅
- Purchase ❌
- Rate Calculation ❌
- FMS ❌
- Reports ✅
- Admin ❌

---

### Purchase Manager (rahul@erp.com)
**Expected Permissions:** 8
```
✅ DASHBOARD_VIEW
✅ MASTERS_VIEW
✅ PURCHASE_VIEW, PURCHASE_CREATE, PURCHASE_EDIT, PURCHASE_APPROVE
✅ REPORTS_VIEW, REPORTS_EXPORT
```

**Sidebar Menus:**
- Dashboard ✅
- Masters (view only) ✅
- Sales ❌
- Purchase ✅
- Rate Calculation ❌
- FMS ❌
- Reports ✅
- Admin ❌

---

### Costing Manager (priya@erp.com)
**Expected Permissions:** 11
```
✅ DASHBOARD_VIEW
✅ MASTERS_VIEW
✅ PURCHASE_VIEW
✅ RATE_VIEW, RATE_CREATE, RATE_EDIT, RATE_APPROVE, RATE_LOCK
✅ FMS_VIEW, FMS_CREATE, FMS_EDIT
✅ REPORTS_VIEW, REPORTS_EXPORT
```

**Sidebar Menus:**
- Dashboard ✅
- Masters (view only) ✅
- Sales ❌
- Purchase ✅
- Rate Calculation ✅
- FMS ✅
- Reports ✅
- Admin ❌

---

## 🧪 Test Scenarios

### TC-01: Login Flow
| Step | Action | Expected |
|------|--------|---------|
| 1 | Open http://localhost:3000 | Login page loads |
| 2 | Enter admin@erp.com / admin123 | Login success |
| 3 | Check user profile | Shows "Admin User" |
| 4 | Check sidebar | All menus visible |

### TC-02: RBAC - Admin
| Step | Action | Expected |
|------|--------|---------|
| 1 | Login as admin@erp.com | Success |
| 2 | Check Admin menu | Visible |
| 3 | Click Admin > Users | Page loads |
| 4 | Check all 7 users listed | All users visible |

### TC-03: RBAC - Sales User
| Step | Action | Expected |
|------|--------|---------|
| 1 | Logout | Redirect to login |
| 2 | Login as amit@erp.com | Success |
| 3 | Check Admin menu | NOT visible |
| 4 | Check Sales menu | Visible |
| 5 | Check Purchase menu | NOT visible |

### TC-04: Dashboard
| Step | Action | Expected |
|------|--------|---------|
| 1 | Login as any user | Dashboard loads |
| 2 | Check stats cards | Cards visible |
| 3 | Check recent activity | Activity shows |

### TC-05: Masters - Dropdowns
| Step | Action | Expected |
|------|--------|---------|
| 1 | Go to Sales > New Enquiry | Form loads |
| 2 | Check Customer dropdown | Shows customers |
| 3 | Check Port dropdown | Shows ports |
| 4 | Check Currency dropdown | Shows USD, GBP, EUR, etc. |

### TC-06: Create Sales Enquiry
| Step | Action | Expected |
|------|--------|---------|
| 1 | Go to Sales > New Enquiry | Form opens |
| 2 | Fill customer, PO number | Fields accept input |
| 3 | Add item with product, qty | Item added |
| 4 | Save Draft | Enquiry created |
| 5 | Submit | Status changes |

---

## 🔴 Issues to Check

### Issue 1: Sidebar not filtering
**If Sales User sees all menus:**
- Check console for errors
- Check network tab for permissions in response
- Verify auth store has permissions

### Issue 2: Currency dropdown empty
**If dropdown shows "-":**
- Check /api/v1/rate/currency endpoint
- Verify currency_rate_master table has data

### Issue 3: Login failing
**If "Invalid credentials":**
- Verify password_hash in database
- Check bcrypt comparison works

---

## ✅ Test Completion Checklist

| Test | Status | Notes |
|------|--------|-------|
| Admin Login | ☐ | |
| Sales User Login | ☐ | |
| Purchase User Login | ☐ | |
| Admin sees all menus | ☐ | |
| Sales User limited menus | ☐ | |
| Dashboard loads | ☐ | |
| Currency dropdown works | ☐ | |
| Create enquiry works | ☐ | |
| No console errors | ☐ | |

---

## 📝 Report Format

```
Test Result: [PASS/FAIL]
User: [email]
Browser: [Chrome/Firefox]
Screenshot: [attach]

Issues Found:
1. [Issue description]
2. [Issue description]

Console Errors:
[paste errors]
```
