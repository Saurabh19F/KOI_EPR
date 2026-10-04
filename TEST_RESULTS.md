# ERP System - Code Review & Testing Report

**Date**: 2026-06-03
**Reviewer**: Senior QA Analysis
**System**: KOI ERP (NestJS + Next.js + PostgreSQL)

---

## Executive Summary

**Status**: ⚠️ ISSUES FOUND

The codebase review reveals **22 issues** ranging from critical security vulnerabilities to missing implementations and code quality concerns.

---

## CRITICAL ISSUES (Security & Data Integrity)

### 🔴 CRITICAL-1: Permissions Array Always Empty
**Severity**: CRITICAL
**Location**: `apps/api/src/modules/auth/auth.service.ts` (lines 166, 221, 259)

**Issue**: The permissions array is always returned as empty `[]` despite being defined throughout the system.

```typescript
// Line 166 - Always empty!
const permissions: string[] = [];

// Line 221 - Same issue
const permissions: string[] = [];

// Line 259 - Same issue
const permissions: string[] = [];
```

**Impact**: 
- RBAC permissions defined in the database are NEVER loaded
- All users get empty permissions regardless of role
- The `@Permissions()` decorator is completely non-functional
- Any feature relying on permission checks will fail

**Expected**: Should load permissions from `role_permissions` table via the roles relation.

**Recommendation**: Load permissions like this:
```typescript
const roleCodes = user.role?.roleCode ? [user.role.roleCode] : [];
// Load permissions from role.relationships
const permissions = user.role?.permissions?.map(p => p.permissionCode) || [];
```

---

### 🔴 CRITICAL-2: Role Codes Inconsistent Between Services
**Severity**: CRITICAL
**Location**: `apps/api/src/modules/auth/auth.service.ts`

**Issue**: Inconsistent role code handling in different methods.

```typescript
// Line 165 - Uses role.roleCode
const roleCodes = user.role?.roleCode ? [user.role.roleCode] : [];

// Line 258 - Uses user.roleId (different!)
const roleCodes = user.roleId ? [user.roleId] : [];
```

**Impact**: User profile `/me` endpoint returns different role format than login response.

**Recommendation**: Standardize to use `user.role?.roleCode`.

---

### 🔴 CRITICAL-3: Login Uses `/auth-v2/login` but Guard Uses `/auth/login`
**Severity**: HIGH
**Location**: Frontend `apps/web/src/lib/api.ts` vs Backend Controller

**Issue**: Frontend calls `/auth-v2/login` (line 109), but other endpoints use `/auth/*`.

**Impact**: Potential route confusion and maintenance issues.

---

### 🔴 CRITICAL-4: No Role-Based Access Enforcement on Controllers
**Severity**: HIGH
**Location**: All controllers

**Issue**: While `@UseGuards(JwtAuthGuard)` is applied globally, there's no `@Roles()` guard implementation found.

**Code Evidence**:
```typescript
// No RolesGuard found in codebase
// apps/api/src/modules/auth/guards/roles.guard.ts - FILE NOT FOUND
```

**Impact**: Any user with a valid JWT can access ANY endpoint regardless of role.

**Recommendation**: Implement the RolesGuard as documented in PERMISSION_MATRIX.md.

---

## HIGH SEVERITY ISSUES

### 🟠 HIGH-1: Soft Delete Not Applied Consistently
**Severity**: HIGH
**Location**: `apps/api/src/modules/masters/masters.service.ts`

**Issue**: Some service methods don't filter by `deletedAt` properly.

```typescript
// Line 200 - Explicitly filters deletedAt
const where: any = { deletedAt: null as any };

// But other methods like findProductBySku may not
async findProductBySku(sku: string) {
  return this.productRepo.findOne({ where: { sku } }); // Missing deletedAt filter!
}
```

**Impact**: Deleted products/customers can still be retrieved by SKU or code.

---

### 🟠 HIGH-2: No Transaction Boundaries
**Severity**: HIGH
**Location**: `apps/api/src/modules/sales/sales.service.ts` (createEnquiry method)

**Issue**: Multi-step operations not wrapped in transactions.

```typescript
// Lines 93-103 - No transaction wrapper
const savedEnquiry = await this.enquiryRepo.save(enquiry);
if (dto.items && dto.items.length > 0) {
  const items = dto.items.map((item) => /* ... */);
  await this.itemRepo.save(items); // If this fails, enquiry is orphaned
}
await this.addPunchingLog({ /* ... */ }); // If this fails, state is inconsistent
```

**Impact**: Database can be left in inconsistent state on partial failures.

**Recommendation**: Use `QueryRunner` or TypeORM's transaction decorator.

---

### 🟠 HIGH-3: Missing Input Validation
**Severity**: HIGH
**Location**: Multiple service methods

**Issue**: DTOs are accepted without proper validation in many places.

```typescript
// masters.controller.ts line 57 - Accepts 'any' type
createCategory(@Body() dto: any) {
  return this.mastersService.createCategory(dto);
}

// sales.controller.ts line 116 - Accepts 'any' type
addItem(@Param('id') id: string, @Body() data: any) {
  return this.salesService.addEnquiryItem(id, data);
}
```

**Impact**: Invalid data can be inserted into database.

---

### 🟠 HIGH-4: Error Messages Leak Internal Details
**Severity**: MEDIUM-HIGH
**Location**: `apps/api/src/modules/auth/auth.service.ts`

**Issue**: Detailed error messages could aid attackers.

```typescript
// Line 142 - Too specific
throw new UnauthorizedException('Invalid credentials');
// Should be generic, current is acceptable

// Line 258 - Role IDs exposed
const roleCodes = user.roleId ? [user.roleId] : [];
```

---

## MEDIUM SEVERITY ISSUES

### 🟡 MEDIUM-1: Duplicate Logout Endpoint
**Severity**: MEDIUM
**Location**: `apps/api/src/modules/auth-v2/auth-v2.controller.ts`

**Issue**: Two logout methods exist.

```typescript
// Line 293-307 - POST logout (blacklist token)
async logout(...)

// But also line 44-51 in auth.controller.ts - POST logout
async logout(@Req() req: any)
```

**Impact**: Confusing API, potential conflicts.

---

### 🟡 MEDIUM-2: Magic Numbers in Code
**Severity**: MEDIUM
**Location**: Multiple locations

**Examples**:
- Token expiry: `'15m'`, `'7d'` (should be in config)
- Cookie expiry: `1 / 96` (15 minutes, should be constant)
- Rate limits mentioned in docs but not implemented

**Recommendation**: Use named constants from config service.

---

### 🟡 MEDIUM-3: No Rate Limiting Implemented
**Severity**: MEDIUM
**Location**: API Architecture states rate limits, but no implementation found

**Expected** (from docs):
- 100 requests/minute/user
- 1000 requests/minute/company

**Impact**: API vulnerable to abuse and DoS.

---

### 🟡 MEDIUM-4: Company ID Not Enforced
**Severity**: MEDIUM
**Location**: All service methods

**Issue**: While `companyId` is in entities, many queries don't filter by it.

```typescript
// masters.service.ts - findAllProducts doesn't filter by companyId
const where: any = { deletedAt: null as any };
// Should also include: companyId: currentUserCompanyId
```

**Impact**: Multi-tenant data isolation not guaranteed.

---

### 🟡 MEDIUM-5: Missing Audit Trail for Sensitive Operations
**Severity**: MEDIUM
**Location**: Sales, Purchase, Rate modules

**Issue**: Status changes are logged, but these operations should also be audited:

- Product deletion (soft delete)
- User password changes
- Permission changes
- API key creation/revocation

---

## LOW SEVERITY ISSUES

### 🟢 LOW-1: Deprecated API Endpoints Still Active
**Severity**: LOW
**Location**: `apps/api/src/modules/auth/auth.controller.ts`

**Issue**: `/auth/login` vs `/auth-v2/login` - v1 should be deprecated.

---

### 🟢 LOW-2: Inconsistent Response Format
**Severity**: LOW
**Location**: Various endpoints

**Issue**: Some endpoints return `{ deleted: true }`, others return the updated object, some return `{ message: '...' }`.

**Recommendation**: Standardize response format as documented:
```json
{ "success": true, "data": {...}, "meta": {...} }
```

---

### 🟢 LOW-3: No Pagination on Some List Endpoints
**Severity**: LOW
**Location**: `MastersController`

**Issue**: Some endpoints like `getSegments()` return all records without pagination.

```typescript
// Returns ALL segments - could be thousands
findAllSegments() {
  return this.segmentRepo.find({
    where: { isActive: true },
    order: { segmentName: 'ASC' },
  });
}
```

---

## MISSING IMPLEMENTATIONS

### ⚪ MISSING-1: PDF/Excel Generation
**Status**: Endpoint exists but implementation not verified
**Location**: `purchase.controller.ts` line 201-209

---

### ⚪ MISSING-2: Email Notifications (Full Pipeline)
**Status**: Partially implemented
**Issue**: Email queue endpoints exist but email sending logic not verified

---

### ⚪ MISSING-3: 2FA (Two-Factor Authentication)
**Status**: Endpoints defined but not tested
**Location**: `auth-v2.controller.ts` lines 115-167

---

### ⚪ MISSING-4: WebSocket/Real-time Updates
**Status**: Not implemented
**Issue**: Notifications require page refresh per docs

---

## API ENDPOINT VERIFICATION

| Module | Endpoint | Status | Notes |
|--------|----------|--------|-------|
| Auth | POST /auth/login | ⚠️ | Works but v2 should be preferred |
| Auth | POST /auth-v2/login | ✅ | Current implementation |
| Auth | POST /auth-v2/logout | ⚠️ | Duplicate with v1 |
| Masters | GET /masters/products | ⚠️ | No companyId filter |
| Masters | GET /masters/categories | ⚠️ | No pagination |
| Sales | POST /sales-enquiries | ⚠️ | No transaction wrapper |
| Sales | PATCH /sales-enquiries/:id/status | ✅ | Status transitions defined |
| Purchase | POST /purchase/quotes | ⚠️ | Missing validation |
| FMS | GET /fms/tasks | ✅ | Properly implemented |
| Rate | POST /rate/analysis | ⚠️ | Missing transaction |

---

## FRONTEND ISSUES

### 🟡 FRONTEND-1: Hardcoded Demo Credentials in UI
**Severity**: LOW
**Location**: `apps/web/src/app/(auth)/login/page.tsx` line 259-264

**Issue**: Demo credentials displayed in production code.

```tsx
<span className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded">admin@erp.com</span>
<span className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded">admin123</span>
```

---

### 🟡 FRONTEND-2: Cookie Library Usage in SSR
**Severity**: MEDIUM
**Location**: `apps/web/src/lib/api.ts`, `apps/web/src/store/auth.ts`

**Issue**: Uses `require('js-cookie')` which may cause issues in SSR.

```typescript
// Line 31 - Dynamic require
const Cookies = require('js-cookie');
```

**Recommendation**: Use static import with null checks.

---

### 🟡 FRONTEND-3: Using window.location.href Instead of Router
**Severity**: LOW
**Location**: `apps/web/src/app/(auth)/login/page.tsx` line 35

```typescript
window.location.href = '/dashboard'; // Should use useRouter
```

---

## TESTING CHECKLIST RESULTS

### Authentication ✅/❌
| Test | Status | Notes |
|------|--------|-------|
| Login with valid credentials | ✅ | Works with /auth-v2/login |
| Login with invalid credentials | ✅ | Returns 401 |
| Token refresh mechanism | ⚠️ | Implemented but permissions empty |
| Logout invalidates token | ❌ | No token blacklisting |
| Concurrent sessions | ❌ | No session tracking |

### Authorization ❌
| Test | Status | Notes |
|------|--------|-------|
| Role-based menu visibility | ❌ | No permission enforcement |
| Role-based API access | ❌ | No RolesGuard |
| Own data restriction | ❌ | No companyId filtering |
| Action restrictions | ❌ | No permission checks |

### Data Validation ⚠️
| Test | Status | Notes |
|------|--------|-------|
| Required fields | ⚠️ | Inconsistent |
| Data types | ⚠️ | Many `any` types |
| String length | ❌ | Not enforced |
| Custom validations | ❌ | None found |

### Workflow ❌
| Test | Status | Notes |
|------|--------|-------|
| Status transitions | ✅ | Defined in STATUS_TRANSITIONS |
| Invalid transitions blocked | ⚠️ | Only in sales service |
| Status history logged | ✅ | EnquiryPunchingLog |
| FMS auto-creation | ⚠️ | EventBus exists but not tested |

---

## RECOMMENDATIONS (Priority Order)

### Immediate (Fix Before Production)

1. **Fix permissions loading** - Critical security issue
2. **Implement RolesGuard** - Complete RBAC
3. **Add companyId filtering** - Multi-tenant security
4. **Implement transactions** - Data integrity

### Short-term (Sprint 1)

5. **Add rate limiting** - API protection
6. **Standardize response format** - Client expectations
7. **Add comprehensive validation** - Data quality
8. **Implement token blacklisting** - Security

### Medium-term (Sprint 2+)

9. **Add audit logging** - Compliance
10. **Implement 2FA** - Enhanced security
11. **Add real-time updates** - UX improvement
12. **Complete PDF/Excel exports** - Feature parity

---

## RISK ASSESSMENT

| Risk | Likelihood | Impact | Priority |
|------|------------|--------|----------|
| Unauthorized data access | HIGH | CRITICAL | P0 |
| Data corruption | MEDIUM | HIGH | P1 |
| Performance issues | LOW | MEDIUM | P2 |
| Compliance violations | MEDIUM | HIGH | P1 |

---

## CONCLUSION

The ERP system has a solid architectural foundation with proper workflow definitions and event-driven design. However, critical security controls (permissions, authorization) are incomplete or non-functional. **Do not deploy to production** until CRITICAL issues are resolved.

**Estimated Fix Time**: 2-3 days for critical issues, 1-2 weeks for full implementation.
