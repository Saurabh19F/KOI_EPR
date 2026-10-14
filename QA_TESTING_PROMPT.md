# Senior QA Tester Prompt — ERP System Testing

## System Under Test

**ERP Platform** — Modular, workflow-driven enterprise resource planning system built with:
- **Backend**: NestJS + TypeORM + PostgreSQL (runs on port 3001)
- **Frontend**: Next.js + React + TypeScript
- **Database**: PostgreSQL (Supabase)
- **Auth**: JWT + Refresh Tokens with RBAC

---

## 1. Authentication & Authorization

### 1.1 Login Flow
- [ ] Test successful login with valid credentials (`admin@erp.com` / `admin123`)
- [ ] Test login failure with incorrect password — verify error message, no token issued
- [ ] Test login failure with non-existent email — verify error handling
- [ ] Test session timeout behavior after token expiration
- [ ] Test refresh token mechanism when access token expires
- [ ] Test logout invalidates current session/tokens
- [ ] Verify concurrent login from multiple devices — tokens handled correctly

### 1.2 Role-Based Access Control (RBAC)
Test that each role sees ONLY permitted modules/menus:

| Role | Expected Access |
|------|-----------------|
| Admin | Full access to all modules |
| Sales User | Sales Enquiry (own), Masters (view only), Reports (own) |
| Sales Manager | All Sales, Reports |
| Purchase User | Purchase (own), Masters (view), Reports (own) |
| Purchase Manager | All Purchase, Reports |
| Costing User | Price Analysis (full), Rate Masters, Reports |
| MIS User | All Reports, Masters (view) |
| Viewer | Read-only limited fields |

- [ ] Verify unauthorized route access redirects to appropriate page
- [ ] Verify API calls without token return 401 Unauthorized
- [ ] Verify API calls with invalid/expired token return 401
- [ ] Test that users cannot access records belonging to other users (own data restriction)
- [ ] Test that users cannot perform actions beyond their role (e.g., Sales User cannot approve)

### 1.3 Multi-Tenant Isolation
- [ ] Verify users can only see data from their own company (`company_id` filter)
- [ ] Test that cross-tenant data access attempts are blocked at API level

---

## 2. API Testing — All Endpoints

### 2.1 Response Format Verification
All endpoints must return consistent format:
```json
// Success
{ "success": true, "data": {...}, "meta": { "page": 1, "limit": 20, "total": 100 } }

// Error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }
```
- [ ] Verify all endpoints return consistent success/error format
- [ ] Verify HTTP status codes: 200, 201, 400, 401, 403, 404, 500 are correct

### 2.2 Authentication Endpoints
```
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```
- [ ] Test login with valid/invalid credentials
- [ ] Test refresh token with valid/expired token
- [ ] Test logout invalidates tokens
- [ ] Verify `/me` returns correct user data with role/permissions

### 2.3 Masters Module
```
GET  /api/v1/masters/categories
GET  /api/v1/masters/segments
GET  /api/v1/masters/groups
GET  /api/v1/masters/brands
GET  /api/v1/masters/products
GET  /api/v1/masters/products/:id
GET  /api/v1/masters/products/sku/:sku
POST /api/v1/masters/products/generate-sku
GET  /api/v1/masters/customers
GET  /api/v1/masters/vendors
GET  /api/v1/masters/uoms
GET  /api/v1/masters/gst-rates
```
- [ ] List endpoints return paginated data
- [ ] Search functionality works (`?search=term`)
- [ ] Sorting works (`?sort=name&order=asc`)
- [ ] Filtering by status works (`?status=active`)
- [ ] Date range filtering works (`?fromDate=&toDate=`)
- [ ] SKU generation follows format: `CCC-SS-GGG-NNN` (e.g., `BRD-00-SAU-000001`)
- [ ] Customer buyer code format: `ZONE-RUNNING` (e.g., `USA-000055`)
- [ ] Verify soft delete — deleted records not returned in list

### 2.4 Sales Enquiry Module
```
GET    /api/v1/sales-enquiries
POST   /api/v1/sales-enquiries
GET    /api/v1/sales-enquiries/:id
PATCH  /api/v1/sales-enquiries/:id
DELETE /api/v1/sales-enquiries/:id
POST   /api/v1/sales-enquiries/:id/items
PATCH  /api/v1/sales-enquiries/:id/items/:itemId
DELETE /api/v1/sales-enquiries/:id/items/:itemId
POST   /api/v1/sales-enquiries/:id/submit
POST   /api/v1/sales-enquiries/:id/generate-pdf
POST   /api/v1/sales-enquiries/:id/generate-excel
POST   /api/v1/sales-enquiries/:id/send-reminder
POST   /api/v1/sales-enquiries/:id/clone
GET    /api/v1/sales-enquiries/:id/status-history
```
- [ ] Enquiry number format: `ENQ-{USER}-{YEAR}-{NO}` (e.g., `ENQ-NEH-2026-0234`)
- [ ] Create enquiry with valid data — returns 201
- [ ] Create enquiry with missing required fields — returns 400 with validation errors
- [ ] Update enquiry in draft status succeeds
- [ ] Update enquiry after submission blocked or restricted
- [ ] Submit transitions status correctly through workflow
- [ ] Add items calculates total CBM correctly
- [ ] Clone creates new enquiry with same items
- [ ] Status history logs every status change
- [ ] Document upload works (test file types, size limits)

**Status Workflow Verification:**
```
draft → submitted → punched → verified → purchase_pending → 
vendor_quote_pending → rate_pending → approval_pending → 
quotation_created → quotation_sent → follow_up → won/lost/cancelled
```
- [ ] Each status transition follows defined workflow
- [ ] Invalid transitions are blocked
- [ ] Status change triggers FMS task creation (if applicable)

### 2.5 Purchase Quote Module
```
GET    /api/v1/purchase-quotes
POST   /api/v1/purchase-quotes
GET    /api/v1/purchase-quotes/:id
PATCH  /api/v1/purchase-quotes/:id
DELETE /api/v1/purchase-quotes/:id
POST   /api/v1/purchase-quotes/from-enquiry/:enquiryId
POST   /api/v1/purchase-quotes/:id/items
POST   /api/v1/purchase-quotes/:id/vendor-quotes
POST   /api/v1/purchase-quotes/:id/submit
POST   /api/v1/purchase-quotes/:id/approve
POST   /api/v1/purchase-quotes/:id/reject
GET    /api/v1/purchase-quotes/:id/compare-vendors
```
- [ ] Purchase quote number format: `PUR-{YEAR}-{NO}`
- [ ] Create from enquiry pre-populates data correctly
- [ ] Vendor quote comparison shows all vendors side-by-side
- [ ] Best vendor selection logic works
- [ ] Landing cost calculation by location (Delhi/Mumbai) works
- [ ] Approve/reject transitions work correctly

**Status Workflow:**
```
draft → submitted → under_review → vendor_quote_pending → 
rate_finalized → sent_to_costing → approved/rejected/revised
```

### 2.6 Rate Calculation Module
```
GET  /api/v1/rate/analysis
POST /api/v1/rate/analysis
GET  /api/v1/rate/analysis/:id
PATCH /api/v1/rate/analysis/:id
DELETE /api/v1/rate/analysis/:id
POST /api/v1/rate/analysis/from-purchase/:purchaseQuoteId
POST /api/v1/rate/analysis/:id/calculate
POST /api/v1/rate/analysis/:id/submit-approval
POST /api/v1/rate/analysis/:id/approve
POST /api/v1/rate/analysis/:id/reject
POST /api/v1/rate/analysis/:id/lock
POST /api/v1/rate/analysis/:id/unlock
GET  /api/v1/rate/currency-rates
GET  /api/v1/rate/haulage-rates
GET  /api/v1/rate/freight-rates
```
- [ ] Price Analysis number format: `PA-{YEAR}-{NO}`
- [ ] Currency rate margin calculation: Final Rate = Rate + Margin
- [ ] Haulage rates: Delhi default 185000, Mumbai default 85000
- [ ] Product-wise calculation: Landing Cost + GST + Haulage → Final Rate
- [ ] Lock/unlock prevents further edits when locked
- [ ] Approval workflow transitions correctly

**Supported Currencies:** GBP, USD, CAD, AUD, EURO

### 2.7 FMS (Workflow) Module
```
GET  /api/v1/fms/tasks
GET  /api/v1/fms/tasks/my
GET  /api/v1/fms/tasks/delayed
GET  /api/v1/fms/tasks/:id
PATCH /api/v1/fms/tasks/:id
POST /api/v1/fms/tasks/generate-from-enquiry/:enquiryId
POST /api/v1/fms/tasks/:id/complete
POST /api/v1/fms/tasks/:id/send-reminder
POST /api/v1/fms/tasks/:id/escalate
GET  /api/v1/fms/dashboard/stats
GET  /api/v1/fms/dashboard/by-person
GET  /api/v1/fms/dashboard/by-enquiry
GET  /api/v1/fms/dashboard/delayed
```
- [ ] FMS Task unique key format: `RATEFMS-{EnquiryNo}-{SKU}-{AssignedUser}-{StepCode}`
- [ ] Example: `RATEFMS-ENQ-NEH-2026-0149-SKU001-AMIT-ACT01`
- [ ] Tasks auto-generate when enquiry reaches certain status
- [ ] Task assignment works correctly
- [ ] Complete/escalate transitions work
- [ ] Delayed tasks identified correctly (past due date)
- [ ] Dashboard stats accurate
- [ ] Email reminders queue correctly

**Task Status:**
```
pending → in_progress → completed/delayed/escalated
```

### 2.8 File/Attachment Testing
```
POST /files/upload
GET  /files/:id
GET  /files/:id/download
DELETE /files/:id
GET  /files/by-module/:module/:recordId
```
- [ ] Upload file size limits enforced
- [ ] Allowed file types accepted, disallowed types rejected
- [ ] Download returns correct file
- [ ] Files associated with correct module/record
- [ ] Delete removes file correctly

### 2.9 Reports
```
GET /reports/sales-enquiries
GET /reports/purchase-quotes
GET /reports/price-analysis
GET /reports/fms-tasks
GET /reports/pending-tasks
GET /reports/delayed-tasks
GET /reports/user-performance
```
- [ ] Reports return correct data matching filters
- [ ] Export functionality works (if applicable)
- [ ] Role-based report access enforced

### 2.10 Audit & Notifications
```
GET /audit/logs
GET /audit/logs/:module/:recordId
GET /audit/status-history/:module/:recordId
GET /notifications
PATCH /notifications/:id/read
GET /notifications/unread-count
```
- [ ] All CRUD operations logged in audit
- [ ] Status changes logged with timestamp and user
- [ ] Notifications created for relevant events
- [ ] Mark as read works
- [ ] Unread count accurate

---

## 3. Data Validation & Business Logic

### 3.1 SKU Validation
- [ ] SKU format enforced: `CCC-SS-GGG-NNN`
- [ ] Category code must exist in `product_categories`
- [ ] Segment code must exist in `segments`
- [ ] Group code must exist in `component_groups`
- [ ] Serial number auto-increments from `number_series`

### 3.2 Customer Code Validation
- [ ] Format: `ZONE-RUNNING` (e.g., `USA-000055`)
- [ ] Zone must be valid
- [ ] Running number auto-increments

### 3.3 Enquiry Number Validation
- [ ] Format: `ENQ-{USER}-{YEAR}-{RUNNING_NO}`
- [ ] Year matches current year
- [ ] Running number from number_series

### 3.4 Calculation Validation
- [ ] Currency conversion uses correct rates
- [ ] Margin added correctly to final currency rate
- [ ] Haulage added per location
- [ ] GST calculated correctly
- [ ] Landing cost formula: `LC + (LC * GST%) + Haulage`

### 3.5 Workflow Validation
- [ ] Cannot skip workflow steps
- [ ] Cannot revert to previous status without reason
- [ ] Approval required at correct stages

---

## 4. Frontend Testing

### 4.1 Navigation & Routing
- [ ] Sidebar menu items match user's role permissions
- [ ] Clicking menu item navigates to correct page
- [ ] Breadcrumb navigation works correctly
- [ ] Direct URL access restricted for unauthorized pages
- [ ] Browser back/forward navigation works
- [ ] Page refresh maintains state (where applicable)

### 4.2 Dashboard
```
- Quick Stats (Pending, Delayed, Won, Lost counts)
- Recent Activities
- My Pending Tasks
- Notifications
```
- [ ] Stats display correct counts
- [ ] Recent activities show latest records
- [ ] Pending tasks show assigned tasks
- [ ] Notifications bell shows unread count
- [ ] Clicking notification navigates to relevant record

### 4.3 Form Validation
- [ ] Required fields show validation error on empty submit
- [ ] Invalid field formats show specific error messages
- [ ] Save button disabled when form invalid
- [ ] Success/error toasts display correctly
- [ ] Form resets after successful submission (where applicable)

### 4.4 Data Tables
- [ ] Pagination works correctly
- [ ] Page size selection works
- [ ] Sort by column works
- [ ] Search/filter works
- [ ] Loading state displayed during fetch
- [ ] Empty state displayed when no data
- [ ] Row click navigates to detail view

### 4.5 Status Workflow UI
- [ ] Status badge shows correct color (Draft=Gray, Submitted=Blue, Pending=Amber, etc.)
- [ ] Status change buttons appear for valid next actions
- [ ] Confirmation dialog for destructive actions
- [ ] Status update shows success feedback

**Status Colors:**
```
Draft: Gray
Submitted: Blue
Pending: Amber
In Progress: Blue
Completed: Green
Approved: Green
Rejected: Red
Delayed: Red
Escalated: Orange
Locked: Purple
Cancelled: Gray
```

### 4.6 Modal/Dialog Testing
- [ ] Modal opens on action
- [ ] Modal closes on cancel/close
- [ ] Modal closes on backdrop click
- [ ] ESC key closes modal
- [ ] Form in modal validates correctly

### 4.7 File Upload UI
- [ ] Drag and drop works
- [ ] File type validation feedback
- [ ] Upload progress shown
- [ ] Upload success/error feedback
- [ ] Uploaded file appears in list

### 4.8 Color Scheme Verification
```
Primary: #2563EB (Blue)
Success: #22C55E (Green)
Warning: #F59E0B (Amber)
Danger: #EF4444 (Red)
Background: #F8FAFC
```

---

## 5. Connectivity & Integration Testing

### 5.1 API Connectivity
- [ ] API responds within acceptable time (< 2s for most endpoints)
- [ ] Network failure shows appropriate error message
- [ ] Retry mechanism works on transient failures
- [ ] API timeout handled gracefully

### 5.2 Database Connectivity
- [ ] Connection pool exhaustion handled
- [ ] Database unavailable shows user-friendly error
- [ ] Transaction rollback on failure

### 5.3 Real-time Features
- [ ] Notifications update without page refresh
- [ ] Status changes reflect immediately
- [ ] WebSocket connection stable (if applicable)

### 5.4 Error Handling
- [ ] 400 Bad Request — validation errors shown to user
- [ ] 401 Unauthorized — redirect to login
- [ ] 403 Forbidden — access denied message
- [ ] 404 Not Found — appropriate page/message
- [ ] 500 Internal Server Error — generic error message (no stack trace shown to user)

### 5.5 Rate Limiting
- [ ] 100 requests/minute/user enforced
- [ ] 1000 requests/minute/company enforced
- [ ] Rate limit exceeded returns 429 with retry-after header

---

## 6. Performance Testing

### 6.1 Response Times
- [ ] Login: < 1 second
- [ ] List pages: < 2 seconds
- [ ] Detail page: < 1 second
- [ ] Create/Update: < 2 seconds
- [ ] Report generation: < 5 seconds (depending on data)

### 6.2 Load Testing
- [ ] System handles 50 concurrent users
- [ ] System handles 100 concurrent users
- [ ] Performance degrades gracefully above threshold

### 6.3 Pagination
- [ ] Default page size: 20
- [ ] Large datasets load progressively
- [ ] No memory issues with large result sets

---

## 7. Security Testing

### 7.1 Authentication
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF token validation (if applicable)
- [ ] Session management secure

### 7.2 Authorization
- [ ] Direct object reference access blocked
- [ ] Privilege escalation prevented
- [ ] Role downgrade not possible

### 7.3 Data Security
- [ ] Sensitive data not logged
- [ ] Passwords not returned in responses
- [ ] File paths not exposed

---

## 8. Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Android)

---

## 9. Edge Cases & Negative Testing

### 9.1 Input Validation
- [ ] Special characters in text fields handled
- [ ] Very long text input handled
- [ ] Unicode/emoji input handled
- [ ] Empty strings handled
- [ ] Leading/trailing whitespace trimmed

### 9.2 Workflow Edge Cases
- [ ] Submit with no items blocked
- [ ] Submit with incomplete required fields blocked
- [ ] Approve already approved item blocked
- [ ] Delete item with dependent records blocked

### 9.3 Concurrent Operations
- [ ] Two users editing same record — last save wins or conflict detected
- [ ] Status changed while editing — warning shown

### 9.4 Data Integrity
- [ ] Delete parent record with children — cascade or block
- [ ] Update record referenced elsewhere — handled correctly
- [ ] Orphaned records cleaned up

---

## 10. Test Data Setup

### Default Test Accounts
| Email | Password | Role |
|-------|----------|------|
| admin@erp.com | admin123 | Admin |

### Master Data Required
- Product Categories: BRD, KRI, SNA, BVR
- Segments: SS, BB, RB, FF
- Component Groups: GRP, ORG
- Brands
- UOM
- GST Rates
- Customers
- Vendors
- Currency Rates (GBP, USD, CAD, AUD, EURO)
- Haulage (Delhi: 185000, Mumbai: 85000)

---

## 11. Reporting

Document all findings with:
- **Test Case ID**: TC-{MODULE}-{NUMBER}
- **Test Description**: What is being tested
- **Pre-conditions**: Required setup
- **Test Steps**: Clear numbered steps
- **Expected Result**: What should happen
- **Actual Result**: What actually happened
- **Status**: Pass / Fail / Blocked / Skipped
- **Severity**: Critical / High / Medium / Low
- **Screenshots/Logs**: Attach evidence

---

## 12. Test Environments

| Environment | Purpose |
|-------------|---------|
| Local Dev | Initial testing |
| Development | Integration testing |
| Staging | Pre-production validation |
| Production | Final validation (read-only) |

---

## Key Workflows to Test End-to-End

### Workflow 1: Complete Sales Enquiry Flow
1. Login as Sales User
2. Create new Sales Enquiry with customer and items
3. Submit enquiry
4. Verify status transitions
5. Generate PDF
6. Close enquiry

### Workflow 2: Purchase Quote with Vendor Comparison
1. Login as Purchase User
2. Create Purchase Quote from Sales Enquiry
3. Add vendor quotes
4. Compare vendors
5. Select best vendor
6. Submit for approval
7. Approve as Purchase Manager

### Workflow 3: Price Analysis
1. Login as Costing User
2. Create Price Analysis from Purchase Quote
3. Update currency rates
4. Run calculation
5. Submit for approval
6. Approve as Manager
7. Lock rates

### Workflow 4: FMS Task Management
1. Create enquiry → FMS task auto-generated
2. Login as assigned user
3. View assigned tasks
4. Complete task
5. Verify task marked complete
6. Check escalation if overdue

---

## Acceptance Criteria Summary

All features must:
- Return correct HTTP status codes
- Return consistent response format
- Enforce role-based permissions
- Validate all inputs
- Handle errors gracefully
- Log actions for audit
- Update status correctly
- Send notifications when required
- Display correct UI state
- Work across all supported browsers
- Meet performance requirements
