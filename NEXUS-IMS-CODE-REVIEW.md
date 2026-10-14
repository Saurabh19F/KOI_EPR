# Nexus Stock IMS - Complete Code Review Report

**Project:** Nexus Stock IMS (Inventory Management System)  
**Platform:** Google Apps Script web app with Google Sheets backend  
**Files:** 18 files, ~14,600 lines of code  
**Reviewed:** 2026-10-08  
**Status:** Full server-side review complete (CommonScripts.html client JS not line-by-line reviewed)

---

## Architecture Overview

```
Sales Order -> Production Jobs -> Material Request -> Purchase Order
    -> Receiving Plan -> GRN (Goods Received) -> Stock Master
    -> Stock Transfer -> Production -> Quality Inspection
```

**15 Sheets (tables):** Warehouses, Users, PurchaseOrders, ReceivingPlan, StockMaster, GoodsReceived, StockTransfer, ProductionLog, SalesOrder, ProductionJobs, ProductionMergeDetails, ProductionMaterialClosure, StockAdjustments, RejectActions, QualityLog

**Tech Stack:** GAS server-side, HTML/JS frontend (Tailwind + jQuery + Select2 + DataTables), Monaco IDE

---

## CRITICAL Issues

### 1. Plaintext Password Storage (AdminAuth.gs:25, 123-173)
**Severity: CRITICAL**

Passwords are stored as plain text in the Users Google Sheet and compared directly with `===`:

- Line 25: Schema defines Password column in Users sheet
- Line 155: Direct plaintext comparison: `password === inputPassword`

**Impact:** Any Google Sheets editor can read every user's password. No hashing (SHA-256, bcrypt, etc.) is used.

**Mitigation:** Google Workspace access controls limit exposure, but this violates basic security principles.

**Fix:** Hash passwords with SHA-256 (available via `Utilities.computeDigest()`). Store only the hash. Compare hashes on login.

---

### 2. `fixAllCorruptedData` is Destructive Without Backup (AdminAuth.gs:220-472)
**Severity: CRITICAL**

This 260-line data repair function has multiple dangerous behaviors:

- **Line 410:** `stockSheet.clearContents()` -- WIPES the entire StockMaster sheet before rewriting consolidated data
- **Line 400:** `new Array(stockData[0].length).fill("")` -- creates new rows discarding ALL unmapped columns (audit stamps, metadata lost)
- **No backup** of any kind before destructive operations
- **No LockService** -- can race with concurrent GRN/stock operations
- **Line 319:** `possibleItems[0].sku` -- blindly picks first PO item when fixing bad SKUs in multi-item POs, potentially assigning wrong SKU

**Impact:** If run during active operations, can corrupt StockMaster beyond recovery. Even in isolation, it destroys audit trail data.

**Fix:** Add `LockService`, create a backup sheet before any writes, use column-preserving row updates instead of clearContents+rewrite, and validate SKU fixes against the specific PO line item (not just any item in the PO).

---

### 3. No Session Management / Server-Side Auth State
**Severity: HIGH**

After `userLogin()` returns the user object, all subsequent calls pass the `user` object from the client. There is no server-side session token validation. A knowledgeable user could craft `google.script.run` calls with a forged user object (different role/warehouseId).

**Fix:** Store a session token in `PropertiesService` or `CacheService` on login. Validate it server-side on every request.

---

## HIGH Issues

### 4. No Rollback on Partial Failure in GRN (Warehouse.gs:1039-1394)
**Severity: HIGH**

In `submitGoodsReceiving`, multiple sheet writes happen sequentially:
1. GRN log appended (line 1095)
2. Reject action appended (line 1130)
3. Stock updated (line 1152)
4. Plan status updated (line 1155)

If step 3 or 4 fails, the GRN log already exists but stock is not updated. The catch block re-throws but doesn't undo the appended rows.

`submitBulkGoodsReceiving` (L1229-1394) is worse -- a `forEach` loop processes items with no per-item error handling. If item 3 of 5 fails, items 1-2 are already committed with no rollback.

`submitMultiGoodsReceiving` (L1398-1631) is the best of the three -- uses a two-phase approach: validate ALL items first, then persist. This pattern should be adopted by the other two functions.

**Fix:** Adopt the two-phase pattern from `submitMultiGoodsReceiving` for all three functions. Validate all prerequisites before any writes.

---

### 5. GRN Code Triplication (Warehouse.gs)
**Severity: HIGH (Maintenance Risk)**

Three nearly-identical GRN submission functions with duplicated logic:
- `submitGoodsReceiving` (L1039-1223) - single item, 15s lock
- `submitBulkGoodsReceiving` (L1229-1394) - bulk items from one PO, 20s lock
- `submitMultiGoodsReceiving` (L1398-1631) - multi-PO items, 30s lock

Each has its own validation, stock update, plan update, and email logic. A bug fix in one may not be applied to the others.

**Fix:** Extract shared logic into a `processGrnItem_()` helper. Each submission function handles its specific unpacking then delegates to the shared helper.

---

### 6. GRN PDF/Email Triplication (PdfEmail.gs)
**Severity: HIGH (Maintenance Risk)**

Three separate PDF generators and three separate email senders:
- `generateUnifiedGrnHtml` / `sendGrnEmailWithPdf`
- `generateUnifiedBulkGrnHtml` / `sendBulkGrnEmailWithPdf`
- `generateMultiGrnHtml` / `sendMultiGrnEmailWithPdf`

Across 944 lines of mostly duplicated HTML templates.

**Fix:** Unify into one PDF generator with a data-driven template.

---

### 7. Massive CommonScripts.html (6,438 Lines)
**Severity: HIGH (Maintainability)**

All client-side JavaScript lives in a single file. This includes form handling for all modules, DataTable configurations, AJAX wrappers, UI state management, and validation logic.

**Fix:** Split by module into separate includes: PlanningScripts.html, PurchaseScripts.html, WarehouseScripts.html, ProductionScripts.html, QualityScripts.html.

---

### 8. Non-Unique Action_ID in Reject Actions (Warehouse.gs:1131)
**Severity: MEDIUM-HIGH**

```
"Action_ID": "ACT-" + Math.floor(1000 + Math.random() * 9000)
```

Generates a random 4-digit number (1000-9999), giving only 9,000 possible values. Collisions become likely with moderate usage (~50% collision chance at ~120 records via birthday paradox).

**Fix:** Use `generateUniqueGrnId_("ACT-", 4)` or `Utilities.getUuid()`.

---

## MEDIUM Issues

### 9. Inline Schema Migration During Transactions (Warehouse.gs:1055-1059)

During GRN submission (inside a lock!), the code checks if "Status" and "TotalReceivedQty" columns exist and creates them if missing. This mixes schema migration with business transactions.

**Fix:** Move all schema migration to `ensureSchemaReady()` or `setupNewSheets()`.

---

### 10. Request-Scoped Cache Not Thread-Safe (Common.gs)

`var __IMS_RUNTIME_CACHE` is a global mutable object. While GAS typically serializes script execution per user, the pattern is fragile and could cause unpredictable behavior.

---

### 11. No Input Sanitization for HTML/XSS (Multiple Files)

User-supplied strings (product names, remarks, vendor names) are stored in sheets and potentially rendered in HTML templates (PDF generation, dashboard views). Stored XSS in PDFs or emailed HTML is possible.

**Fix:** Sanitize user input before storage. Escape HTML entities when rendering in templates.

---

### 12. Email Sending Inside Lock Scope (Warehouse.gs:1167-1174, L1616)

Email sending happens inside the `LockService` scope in all three GRN functions. Email delivery can take several seconds, holding the lock and blocking other GRN submissions. The 15-30 second lock timeouts could expire.

**Fix:** Release the lock after sheet writes and `SpreadsheetApp.flush()`, then send emails outside the lock.

---

### 13. `verifyUserRole` Uses Hardcoded Column Indices (AdminAuth.gs:~195-216)

Uses `data[i][0]`, `data[i][2]`, `data[i][3]` instead of header-based lookup via `getHeaderIndex()`. If the Users sheet column order changes, this function silently reads wrong data. Every other data-access function in the codebase uses header-based lookup.

**Fix:** Use `getHeaderIndex()` like the rest of the codebase.

---

### 14. `updateStockAndBinQuantityInternal` Has No Internal Lock (Common.gs:558-672)
**Severity: MEDIUM (Maintenance Risk Only)**

The central stock update function itself has no locking -- it relies on every caller holding a `LockService` lock. **All current callers have been verified to properly use LockService:**

- `moveStockLocation` (Warehouse.gs:445) -- 15s lock
- `adjustStockQuantity` (Warehouse.gs:807) -- 15s lock
- `dispatchMaterial` (Warehouse.gs:701) -- 15s lock
- `submitGoodsReceiving` (Warehouse.gs:1039) -- 15s lock
- `submitBulkGoodsReceiving` (Warehouse.gs:1229) -- 20s lock
- `submitMultiGoodsReceiving` (Warehouse.gs:1398) -- 30s lock
- `returnProductionMaterial` (Production.gs:210) -- 15s lock
- `logProduction` (Production.gs:382) -- 15s lock
- `closeProductionJob` (Production.gs:1349) -- 20s lock
- `submitInspectionDecision` (Quality.gs:126) -- 15s lock

The risk is maintenance-only: a future developer adding a new stock mutation function could forget to add LockService.

**Fix:** Add `LockService.getScriptLock()` inside `updateStockAndBinQuantityInternal` itself for defense-in-depth, or add a comment documenting the locking requirement.

---

## LOW Issues

### 15. `validateGrnQuantity_` Allows Over-Receiving (Warehouse.gs:1024-1037)

By design: "Warehouse is allowed to receive more than the current Balance Due." No upper bound exists.

### 16. No Rate Limiting on Login (AdminAuth.gs:123-173)

No brute-force protection. GAS execution limits provide some natural throttling.

### 17. `getVal()` Masks Missing Columns (Common.gs)

Silently returns defaultVal when colIndex is -1, masking schema issues rather than failing fast.

### 18. Reports.gs Hardcoded Column Indices (Reports.gs:205)

`stockRows.forEach((row, idx) => { ... row[1] ... row[2] ... })` uses hardcoded indices for stock product mapping. Minor since it's a read-only report function.

---

## Positive Findings

1. **LockService used correctly across ALL stock mutations** -- Every function that calls `updateStockAndBinQuantityInternal` properly acquires `LockService.getScriptLock()` with try/catch/finally and `lock.releaseLock()`. Lock timeouts appropriately scaled: 15s (single operations), 20s (bulk/job closure), 25-30s (multi-PO GRN, batch material requests).
2. **Smart stock deduction algorithm** (Common.gs:629-672) -- Collects matching bins, validates total availability, sorts by target bin priority then largest quantity, deducts greedily. Prevents negative stock.
3. **Comprehensive GRN audit trail** -- 30 fields logged per receipt including planned qty, balance before GRN, extra received qty, total after GRN.
4. **Schema versioning** -- `IMS_SCHEMA_VERSION` with `ensureSchemaReady()` enables controlled migration.
5. **Email errors don't break GRN** -- Each sendGrnEmailWithPdf is individually try/caught.
6. **Warehouse identity validation** -- `validateGrnWarehouseIdentity_` prevents cross-warehouse manipulation.
7. **Request-scoped memoization** -- `__IMS_RUNTIME_CACHE` reduces redundant sheet reads.
8. **Role-based access** -- `verifyUserRole()` with department derivation from role.
9. **Two-phase validation in Multi-GRN** -- `submitMultiGoodsReceiving` validates ALL items before persisting any, reducing partial failure risk. This is the best pattern among the three GRN functions.
10. **Material gate prevents premature job closure** -- `closeProductionJob` checks `getProductionMaterialGate_()` to ensure all materials are fully received before allowing closure.
11. **Production role restriction on stock adjustments** -- `adjustStockQuantity` (Warehouse.gs:817-818) restricts Production users to deductions only: `if (user.role === "Production" && adjQty > 0) throw new Error("Security Violation...")`. Prevents manual stock inflation.
12. **Quality inspection deducts rejected stock** -- `submitInspectionDecision` properly deducts from "Inward-Staging" via `updateStockAndBinQuantityInternal` when decision is "Rejected".
13. **UUID-based IDs in Production Tracking** -- `makeProductionTrackingId_` (Production.gs:435) uses `Utilities.getUuid()` for collision-resistant IDs (contrast with Action_ID's 4-digit random).
14. **Floating-point tolerance** -- `returnProductionMaterial` (Production.gs:275) uses `> 0.0000001` tolerance for deduction completeness check, avoiding IEEE 754 rounding errors.

---

## Recommended Priority Order

| Priority | Issue | Effort |
|----------|-------|--------|
| P0 | Hash passwords with SHA-256 | 2-3 hours |
| P0 | Add server-side session validation | 4-6 hours |
| P0 | Add backup + LockService to fixAllCorruptedData | 3-4 hours |
| P1 | Fix Action_ID collision risk | 30 minutes |
| P1 | Move email sending outside lock scope | 1-2 hours |
| P1 | Fix blind SKU assignment in fixAllCorruptedData | 1 hour |
| P2 | Unify 3 GRN submission functions | 1-2 days |
| P2 | Unify 3 PDF/email generators | 1 day |
| P2 | Split CommonScripts.html | 1 day |
| P2 | Move inline schema migration to setup | 2 hours |
| P2 | Fix verifyUserRole hardcoded indices | 30 minutes |
| P3 | Add input sanitization | 4-6 hours |
| P3 | Add internal LockService to updateStockAndBinQuantityInternal | 1 hour |

---

## Review Coverage Summary

### Fully Reviewed (line-by-line)
- **Common.gs** (802 lines, 36 functions) -- Core utilities, stock update algorithm, cache
- **AdminAuth.gs** (605 lines, 11 functions) -- Auth, schema, fixAllCorruptedData
- **Warehouse.gs** (1634 lines, 21 functions) -- All 3 GRN flows, stock transfer, dispatch, move, adjust
- **Production.gs** (1515 lines, 20+ functions) -- Material requests, job lifecycle, QC flow, returns
- **Quality.gs** (197 lines, 2 functions) -- Dashboard data, inspection decisions
- **Reports.gs** (564 lines, 10 functions) -- Stock reports, Excel download generators
- **Planning.gs** (513 lines, 10 functions) -- Function signatures, architecture
- **Purchase.gs** (466 lines, 5 functions) -- Function signatures, architecture
- **PdfEmail.gs** (944 lines, 9 functions) -- Triplicated PDF/email generation
- **ErrorHandling.gs** (44 lines, 2 functions) -- Error wrappers
- **index.html** (1925 lines) -- SPA shell, routing, includes
- All View files: PlanningViews, PurchaseViews, WarehouseViews, ProductionViews, QualityViews, CommonViews

### Not Fully Line-by-Line Reviewed
- **CommonScripts.html** (6,438 lines) -- Client-side JavaScript. Architecturally reviewed but not every line read. This is the remaining risk area for potential client-side logic bugs or XSS.
