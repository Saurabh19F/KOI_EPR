# ERP Application - Database Schema & Complete Flow

---

## 📌 SECTION 13: DATABASE RELATIONSHIPS (Continued)

### Core Tables

```
┌─────────────────────────────────────────────────────────────────────┐
│ COMPLETE ER DIAGRAM                                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                        USERS                                          │
│          ┌──────────────────────────────────────┐                   │
│          │ user_id (PK)                          │                   │
│          │ email                                 │                   │
│          │ password_hash                         │                   │
│          │ name                                  │                   │
│          │ role_id (FK) ───────────────────────┼──▶ ROLES          │
│          │ department_id (FK)                    │                   │
│          │ is_super_admin                        │                   │
│          └──────────────────────────────────────┘                   │
│                              │                                      │
│                              │ 1:N                                   │
│          ┌───────────────────┴───────────────────┐                   │
│          ▼                                      ▼                     │
│    SALES_ENQUIRY_ORDERS              PURCHASE_QUOTES               │
│    ┌─────────────────────┐          ┌─────────────────────┐        │
│    │ enquiry_id (PK)     │          │ quote_id (PK)       │        │
│    │ enquiry_no (UNIQUE) │          │ quote_no (UNIQUE)    │        │
│    │ customer_id (FK) ──┼──────────│ enquiry_order_id (FK)│        │
│    │ sales_person_id     │          │ party_name           │        │
│    │ status              │          │ status               │        │
│    │ po_number           │          │ grand_total          │        │
│    └─────────┬───────────┘          └─────────┬───────────┘        │
│              │                                │                     │
│              │ 1:N                             │ 1:N                │
│              ▼                                ▼                     │
│    SALES_ENQUIRY_ITEMS              PURCHASE_QUOTE_ITEMS          │
│    ┌─────────────────────┐          ┌─────────────────────┐        │
│    │ item_id (PK)        │          │ item_id (PK)        │        │
│    │ enquiry_order_id (FK)│          │ quote_id (FK)       │        │
│    │ product_id (FK)      │          │ product_name        │        │
│    │ quantity             │          │ quantity             │        │
│    │ expected_rate       │          │ vendor_quotes       │        │
│    └─────────────────────┘          └─────────────────────┘        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📌 SECTION 14: KEY DATABASE TABLES

### Users Table

```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255),
    user_code VARCHAR(50),
    phone VARCHAR(50),
    avatar TEXT,
    company_id UUID,
    department_id UUID,
    role_id UUID REFERENCES roles(role_id),
    is_active BOOLEAN DEFAULT true,
    is_super_admin BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    locked_until TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(50),
    email_verified BOOLEAN DEFAULT false,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```

### Roles Table

```sql
CREATE TABLE roles (
    role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID,
    role_code VARCHAR(50) UNIQUE NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    description TEXT,
    level INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Permissions Table

```sql
CREATE TABLE permissions (
    permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_code VARCHAR(100) UNIQUE NOT NULL,
    permission_name VARCHAR(100) NOT NULL,
    action VARCHAR(50),
    module VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Role-Permissions Junction

```sql
CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(role_id),
    permission_id UUID REFERENCES permissions(permission_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);
```

### Sales Enquiry Orders

```sql
CREATE TABLE sales_enquiry_orders (
    enquiry_order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID,
    enquiry_order_no VARCHAR(50) UNIQUE NOT NULL,
    enquiry_date DATE,
    crm_id VARCHAR(50),
    order_no VARCHAR(50),
    sales_person_id UUID,
    customer_id UUID,
    buyer_code VARCHAR(50),
    buyer_name VARCHAR(255),
    contact_name VARCHAR(255),
    contact_number VARCHAR(50),
    buyer_phone VARCHAR(50),
    buyer_email VARCHAR(255),
    country VARCHAR(100),
    state VARCHAR(100),
    city VARCHAR(100),
    po_number VARCHAR(100),
    po_date DATE,
    pod VARCHAR(100),
    pod_date DATE,
    payment_terms_id UUID,
    currency_id UUID,
    port_of_loading VARCHAR(100),
    port_of_discharge VARCHAR(100),
    status VARCHAR(50) DEFAULT 'draft',
    is_po_received BOOLEAN DEFAULT false,
    is_quotation_created BOOLEAN DEFAULT false,
    is_purchase_required BOOLEAN DEFAULT false,
    is_approval_required BOOLEAN DEFAULT false,
    total_cbm DECIMAL(10,2),
    total_value DECIMAL(15,2),
    remarks TEXT,
    approved_by UUID,
    approved_at TIMESTAMP,
    approval_remarks TEXT,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```

---

## 📌 SECTION 15: API RESPONSE FORMATS

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Paginated Response

```json
{
  "data": [ ... ],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

---

## 📌 SECTION 16: AUTHENTICATION FLOW DETAILED

### JWT Token Structure

```javascript
// Access Token Payload
{
  sub: "d9c73dfe-6d39-466d-90e6-bc75307d62f9",  // userId
  email: "admin@erp.com",
  companyId: null,
  isSuperAdmin: true,
  roles: ["ADMIN"],
  permissions: ["DASHBOARD_VIEW", "MASTERS_VIEW", ...],
  type: "access",
  iat: 1717849200,  // issued at
  exp: 1717850100    // expires in 15 min
}

// Refresh Token Payload
{
  sub: "d9c73dfe-6d39-466d-90e6-bc75307d62f9",
  email: "admin@erp.com",
  type: "refresh",
  iat: 1717849200,
  exp: 1718454000    // expires in 7 days
}
```

### Token Verification Flow

```
Request arrives
    │
    ▼
Extract Bearer token from Authorization header
    │
    ▼
jwtService.verify(token, { secret: JWT_SECRET })
    │
    ├── Valid → Continue to controller
    │
    └── Invalid → Return 401 Unauthorized
```

---

## 📌 SECTION 17: PERMISSION MATRIX

| Permission Code | Description | Modules |
|----------------|-------------|---------|
| DASHBOARD_VIEW | View dashboard | All |
| MASTERS_VIEW | View masters | Masters |
| MASTERS_CREATE | Create masters | Masters |
| MASTERS_EDIT | Edit masters | Masters |
| MASTERS_DELETE | Delete masters | Masters |
| SALES_VIEW | View sales | Sales |
| SALES_CREATE | Create enquiries | Sales |
| SALES_EDIT | Edit enquiries | Sales |
| SALES_DELETE | Delete enquiries | Sales |
| SALES_APPROVE | Approve enquiries | Sales |
| PURCHASE_VIEW | View purchase | Purchase |
| PURCHASE_CREATE | Create quotes | Purchase |
| PURCHASE_EDIT | Edit quotes | Purchase |
| PURCHASE_DELETE | Delete quotes | Purchase |
| PURCHASE_APPROVE | Approve quotes | Purchase |
| RATE_VIEW | View rate analysis | Rate |
| RATE_CREATE | Create analysis | Rate |
| RATE_EDIT | Edit analysis | Rate |
| RATE_APPROVE | Approve rates | Rate |
| RATE_LOCK | Lock rates | Rate |
| FMS_VIEW | View tasks | FMS |
| FMS_CREATE | Create tasks | FMS |
| FMS_EDIT | Edit tasks | FMS |
| FMS_ASSIGN | Assign tasks | FMS |
| REPORTS_VIEW | View reports | Reports |
| REPORTS_EXPORT | Export reports | Reports |
| ADMIN_USERS | Manage users | Admin |
| ADMIN_ROLES | Manage roles | Admin |
| ADMIN_SETTINGS | System settings | Admin |

---

## 📌 SECTION 18: ENQUIRY WORKFLOW STATES

```
┌─────────────────────────────────────────────────────────────────┐
│ ENQUIRY LIFECYCLE                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┐     ┌───────────┐     ┌─────────┐     ┌──────────┐│
│  │  DRAFT  │────▶│ SUBMITTED │────▶│ PUNCHED │────▶│ VERIFIED ││
│  └─────────┘     └───────────┘     └─────────┘     └──────────┘│
│      │               │               │               │            │
│      │               │               │               ▼            │
│      │               │               │        ┌─────────────┐    │
│      │               │               │        │ PURCHASE    │    │
│      │               │               │        │  PENDING    │    │
│      │               │               │        └─────────────┘    │
│      │               │               │               │            │
│      ▼               ▼               ▼               ▼            │
│  ┌────────┐     ┌─────────┐   ┌───────────┐  ┌────────────┐   │
│  │CANCELLED│    │  LOST   │   │QUOTATION │  │RATE_PENDING│  │
│  └────────┘     └─────────┘   │ CREATED   │  └────────────┘   │
│                                └───────────┘         │          │
│                                       │              ▼          │
│                                       │       ┌────────────┐    │
│                                       │       │APPROVAL    │    │
│                                       │       │ PENDING    │    │
│                                       │       └────────────┘    │
│                                       │              │           │
│                                       ▼              ▼           │
│                                  ┌─────────┐    ┌─────────┐    │
│                                  │   WON   │    │  LOST   │    │
│                                  └─────────┘    └─────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📌 SECTION 19: CURRENCY CONVERSION LOGIC

```javascript
// Rate Calculation Formula
const calculateLandedCost = (baseCost, freight, haulage, duty) => {
    return baseCost + freight + haulage + (baseCost * duty / 100);
};

const calculateSellingPrice = (landedCost, margin) => {
    return landedCost + (landedCost * margin / 100);
};

const convertToCurrency = (amount, exchangeRate) => {
    return amount / exchangeRate;
};

// Example
const baseCost = 48;
const freight = 5;
const haulage = 2;
const dutyPercent = 12;

const landedCost = 48 + 5 + 2 + (48 * 12 / 100); // 60.76
const sellingPrice = 60.76 + (60.76 * 15 / 100);  // 69.87

const gbpRate = 105.25;
const usdRate = 83.50;

const gbpPrice = 69.87 / 105.25; // £0.664
const usdPrice = 69.87 / 83.50;  // $0.837
```

---

## 📌 SECTION 20: COMMON ISSUES & SOLUTIONS

| Issue | Cause | Solution |
|-------|-------|----------|
| Login shows wrong user | JWT `sub` vs `userId` mismatch | Use `req.user?.sub \|\| req.user?.userId` |
| WebSocket `User: undefined` | Token not passed in handshake | Pass token in `auth: { token }` |
| Permissions empty | `role_permissions` table empty | Seed permissions from SQL |
| Logout fails | `blacklistToken` function missing | Remove call, just clear cookies |
| Refresh fails | Wrong endpoint | Use `/auth-v2/refresh` not `/auth/refresh` |
| Sidebar shows all menus | `isSuperAdmin` not checked | Check `user.isSuperAdmin` first |

---

## 📌 SECTION 21: QUICK COMMAND REFERENCE

### Development Commands

```bash
# Start API
cd apps/api && npm start

# Start Web
cd apps/web && npm run dev

# Build API
cd apps/api && npm run build

# Build Web
cd apps/web && npm run build

# Run migrations
cd apps/api && npm run migration:run

# Generate migration
cd apps/api && npm run migration:generate -- src/migrations/Name
```

### Database Commands

```sql
-- Check users
SELECT email, name, r.role_code FROM users u 
JOIN roles r ON u.role_id = r.role_id;

-- Check permissions
SELECT r.role_code, COUNT(rp.permission_id) 
FROM roles r LEFT JOIN role_permissions rp ON r.role_id = rp.role_id 
GROUP BY r.role_code;

-- Check enquiries
SELECT enquiry_no, status, customer_id FROM sales_enquiry_orders;

-- Check FMS tasks
SELECT task_id, status, step_code FROM fms_tasks WHERE is_active = true;
```

---

## 📌 SECTION 22: FILE STRUCTURE

```
apps/
├── api/
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── modules/
│       │   ├── auth-v2/
│       │   │   ├── auth-v2.controller.ts
│       │   │   ├── auth-v2.service.ts
│       │   │   └── dto/
│       │   ├── masters/
│       │   ├── sales/
│       │   ├── purchase/
│       │   ├── rate/
│       │   ├── fms/
│       │   ├── reports/
│       │   ├── notifications/
│       │   └── admin/
│       ├── common/
│       │   ├── decorators/
│       │   ├── dto/
│       │   ├── guards/
│       │   └── interceptors/
│       └── config/
│
└── web/
    └── src/
        ├── app/
        │   ├── (auth)/login/
        │   ├── (dashboard)/dashboard/
        │   │   ├── masters/
        │   │   ├── sales/
        │   │   ├── purchase/
        │   │   ├── rate/
        │   │   ├── fms/
        │   │   ├── reports/
        │   │   └── admin/
        │   └── layout.tsx
        ├── components/
        │   ├── ui/
        │   ├── sidebar.tsx
        │   ├── header.tsx
        │   └── global-search/
        ├── store/
        │   └── auth.ts
        ├── hooks/
        ├── lib/
        │   ├── api.ts
        │   └── utils.ts
        └── styles/
```

---

## 📌 SECTION 23: ENVIRONMENT VARIABLES

```env
# ========================
# DATABASE
# ========================
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
DATABASE_SSL=true

# ========================
# JWT
# ========================
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ========================
# PORTS
# ========================
PORT=3001
API_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000

# ========================
# NEXT.JS
# ========================
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

---

## 📌 SECTION 24: TESTING CHECKLIST

- [ ] Login with admin - check header shows "Admin User"
- [ ] Login with sales user - check no Purchase/Rate/FMS menus
- [ ] Create enquiry - check status = draft
- [ ] Submit enquiry - check status = submitted
- [ ] Check FMS tasks created
- [ ] Verify notifications appear
- [ ] Check currency dropdown has options
- [ ] Test report generation
- [ ] Test admin user management
- [ ] Test logout - verify redirect to login

---

## 📌 SECTION 25: ROLES & ACCESS SUMMARY

| User | Email | Dashboard | Masters | Sales | Purchase | Rate | FMS | Reports | Admin |
|------|-------|-----------|---------|-------|----------|------|-----|---------|-------|
| Admin | admin@erp.com | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Neha | neha@erp.com | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Amit | amit@erp.com | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Rahul | rahul@erp.com | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Sneha | sneha@erp.com | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Priya | priya@erp.com | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Vikram | vikram@erp.com | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

---

**END OF COMPLETE WORKING GUIDE**