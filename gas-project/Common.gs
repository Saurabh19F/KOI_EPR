// --- GLOBAL CONFIGURATION (UPDATED) ---
const SS = SpreadsheetApp.getActiveSpreadsheet();
const PURCHASE_EMAIL = "purchase.team@example.com";
const LOW_STOCK_THRESHOLD = 10;

// --- PERFORMANCE: request-scoped memoization (never persists business data) ---
// Apps Script may call the same lookup many times inside one server request.
// Keep read-only snapshots in memory for that request only to avoid repeated full-sheet scans.
var __IMS_RUNTIME_CACHE = { headers: {}, sheetData: {}, poProducts: null, stock: null };

function getSheetHeadersFast_(sheet) {
  if (!sheet) return [];
  const key = sheet.getSheetId ? String(sheet.getSheetId()) : sheet.getName();
  if (__IMS_RUNTIME_CACHE.headers[key]) return __IMS_RUNTIME_CACHE.headers[key].slice();
  const lastCol = sheet.getLastColumn();
  const headers = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h || "").trim(); }) : [];
  __IMS_RUNTIME_CACHE.headers[key] = headers.slice();
  return headers;
}

function invalidateSheetHeaderCache_(sheet) {
  if (!sheet) return;
  const key = sheet.getSheetId ? String(sheet.getSheetId()) : sheet.getName();
  delete __IMS_RUNTIME_CACHE.headers[key];
}

function invalidateSheetDataCache_(sheet) {
  if (!sheet) return;
  delete __IMS_RUNTIME_CACHE.sheetData[sheet.getName()];
  if (sheet.getName() === SHEET_PURCHASE_ORDERS) __IMS_RUNTIME_CACHE.poProducts = null;
  if (sheet.getName() === SHEET_STOCK_MASTER) __IMS_RUNTIME_CACHE.stock = null;
}

// --- SHEET NAMES ---
const SHEET_WAREHOUSES = "Warehouses";
const SHEET_USERS = "Users";
const SHEET_PURCHASE_ORDERS = "PurchaseOrders";
const SHEET_RECEIVING_PLAN = "ReceivingPlan";
const SHEET_STOCK_MASTER = "StockMaster";
const SHEET_GOODS_RECEIVED = "GoodsReceivedLog";
const SHEET_STOCK_TRANSFER = "StockTransferRequest";
const SHEET_PRODUCTION_LOG = "ProductionLog";
const SHEET_SALES_ORDER = "Sales Order";
const SHEET_PRODUCTION_JOBS = "ProductionJobs";
const SHEET_PRODUCTION_MERGE_DETAILS = "ProductionMergeDetails";
const SHEET_PRODUCTION_MATERIAL_CLOSURE = "ProductionMaterialClosure";
const SHEET_STOCK_ADJUSTMENTS = "StockAdjustmentsLog";
const SHEET_REJECT_ACTIONS = "RejectActionsLog";
const SHEET_QUALITY_LOG = "QualityLog";

// --- WEB APP ENTRY POINT ---
const IMS_SCHEMA_VERSION = "2026-09-02-no-na-blank-v14";

// --- HTML PARTIAL INCLUDE HELPER ---
function include(filename) {
  const allowedHtmlPartials = [
    "CommonViews", "PlanningViews", "PurchaseViews", "WarehouseViews",
    "ProductionViews", "QualityViews", "CommonScripts"
  ];
  const safeName = String(filename || "").trim();
  if (allowedHtmlPartials.indexOf(safeName) === -1) {
    Logger.log("Blocked non-whitelisted HTML include: " + safeName);
    return "<!-- Blocked invalid HTML include -->";
  }

  const content = HtmlService.createHtmlOutputFromFile(safeName).getContent();
  const trimmed = String(content || "").trim();
  const looksLikeServerCode =
    (/^\/\//.test(trimmed) || /^(const|let|var)\s+[A-Z_]+\s*=/.test(trimmed)) &&
    /\bfunction\s+[A-Za-z_$][\w$]*\s*\(/.test(trimmed) &&
    !/<(?:script|div|section|form|table|style)\b/i.test(trimmed);

  // Prevent accidental .gs content pasted into an HTML partial from leaking
  // into the page as plain text and destroying the dashboard layout.
  if (looksLikeServerCode) {
    Logger.log("Suppressed server-code content found in HTML partial: " + safeName);
    return "<!-- Invalid partial content suppressed: " + safeName + " -->";
  }
  return content;
}

// --- WEB APP ENTRY POINT (MODULAR TEMPLATE) ---
function doGet(e) {
  try {
    ensureSchemaReady();
  } catch (err) {
    Logger.log("Silent setup failed: " + err.message);
  }

  const template = HtmlService.createTemplateFromFile('index');
  return template.evaluate()
    .setTitle("Multi-Warehouse IMS")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getFormattedTimestamp() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "Asia/Kolkata", "dd/MM/yyyy HH:mm:ss");
}
// --- HELPER: NORMALIZED HEADER STRING ---

function normalizeHeaderString(str) {
  if (str === null || str === undefined) return "";
  return str.toString()
    .replace(/\u00A0/g, ' ')  // Remove hidden non-breaking spaces
    .replace(/[\r\n]+/g, ' ') // Remove line breaks
    .replace(/\s+/g, ' ')     // Collapse multiple spaces
    .trim()
    .toLowerCase();
}
// --- HELPER: ROBUST HEADER INDEX FINDER ---

function getHeaderIndex(headers, targetName, fallbacks = []) {
  if (!headers || headers.length === 0) return -1;

  const normHeaders = headers.map(h => normalizeHeaderString(h));
  const normTarget = normalizeHeaderString(targetName);

  // Exact Match First
  let index = normHeaders.indexOf(normTarget);
  if (index !== -1) return index;

  // Exact Fallback Matches
  for (const fb of fallbacks) {
    const normFb = normalizeHeaderString(fb);
    index = normHeaders.indexOf(normFb);
    if (index !== -1) return index;
  }

  // Strict word boundary match
  for (let i = 0; i < normHeaders.length; i++) {
    if (normHeaders[i] === normTarget) return i;
  }

  return -1;
}

// --- AUTO-RESOLVE HEADER INDEX ---

function autoResolveHeaderIndex(headers, possibleNames) {
  for (const name of possibleNames) {
    const idx = getHeaderIndex(headers, name);
    if (idx !== -1) return idx;
  }

  const lowerHeaders = headers.map(h => normalizeHeaderString(h));
  for (const name of possibleNames) {
    const lowerName = normalizeHeaderString(name);
    const foundIdx = lowerHeaders.findIndex(h => h === lowerName);
    if (foundIdx !== -1) return foundIdx;
  }
  return -1;
}


// --- DYNAMIC HEADER FINDER ---

function getSheetDataAndHeaders(sheetName) {
  if (__IMS_RUNTIME_CACHE.sheetData[sheetName]) return __IMS_RUNTIME_CACHE.sheetData[sheetName];

  const sheet = SS.getSheetByName(sheetName);
  if (!sheet) return { headers: [], dataRows: [], headerRowIdx: -1 };

  const allValues = sheet.getDataRange().getValues();
  if (allValues.length === 0) return { headers: [], dataRows: [], headerRowIdx: -1 };

  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(10, allValues.length); i++) {
    const rowLower = allValues[i].map(cell => normalizeHeaderString(cell));
    if (sheetName === SHEET_PURCHASE_ORDERS) {
      if (rowLower.includes("po number") || rowLower.includes("po_number") || rowLower.includes("unique code") || rowLower.includes("buyer code")) {
        headerRowIdx = i;
        break;
      }
    } else if (sheetName === SHEET_RECEIVING_PLAN) {
      if (rowLower.includes("plan_id") || rowLower.includes("plan id") || rowLower.includes("plannedqty") || rowLower.includes("planned qty")) {
        headerRowIdx = i;
        break;
      }
    }
  }

  const result = {
    headers: allValues[headerRowIdx].map(h => normalizeHeaderString(h)),
    dataRows: allValues.slice(headerRowIdx + 1),
    headerRowIdx: headerRowIdx
  };
  __IMS_RUNTIME_CACHE.sheetData[sheetName] = result;
  return result;
}
// --- HELPER: OVERWRITE LAST EDIT STATUS ON ANY ROW ACTION ---

function ensureLastEditStatusHeader_(sheet) {
  if (!sheet) return -1;
  let lastCol = sheet.getLastColumn();
  if (lastCol < 1) {
    sheet.getRange(1, 1).setValue("Last Edit Status");
    return 0;
  }
  const headers = getSheetHeadersFast_(sheet);
  let idx = getHeaderIndex(headers, "Last Edit Status");
  if (idx === -1) {
    sheet.getRange(1, lastCol + 1).setValue("Last Edit Status");
    invalidateSheetHeaderCache_(sheet);
    idx = lastCol;
  }
  return idx;
}

function ensureLastEditStatusOnAllSheets_() {
  SS.getSheets().forEach(function(sheet) {
    try { ensureLastEditStatusHeader_(sheet); } catch (e) { Logger.log("Audit header warning on " + sheet.getName() + ": " + e.message); }
  });
}

function updateRowAuditStamp(sheet, rowIdx, user) {
  try {
    if (!sheet || rowIdx <= 1) return;
    const lastEditCol = ensureLastEditStatusHeader_(sheet);
    if (lastEditCol >= 0) sheet.getRange(rowIdx, lastEditCol + 1).setValue(getAuditStamp(user));
    invalidateSheetDataCache_(sheet);
  } catch (e) {
    Logger.log("Silent Audit Stamp Error: " + e.message);
  }
}

// --- HELPER: ROBUST ROW APPEND BY HEADER ---

function cleanDataMarkerForStorage_(value) {
  if (value === null || value === undefined) return "";
  if (typeof value !== "string") return value;

  const str = value.replace(/\u00A0/g, " ").trim();
  const upper = str.toUpperCase();
  if (str === "" || upper === "N/A" || upper === "NA" || upper === "N.A." ||
      upper === "NULL" || upper === "UNDEFINED" || upper === "NONE" ||
      upper === "NOT AVAILABLE") {
    return "";
  }
  return str;
}

function appendRowByHeaders(sheet, rowDataObj, user) {
  if (!sheet) throw new Error("Target sheet not found for append.");
  ensureLastEditStatusHeader_(sheet);
  const headers = getSheetHeadersFast_(sheet);
  const newRow = new Array(headers.length).fill("");

  for (const key in (rowDataObj || {})) {
    const idx = getHeaderIndex(headers, key);
    if (idx !== -1) newRow[idx] = cleanDataMarkerForStorage_(rowDataObj[key]);
  }

  const auditIdx = getHeaderIndex(headers, "Last Edit Status");
  if (auditIdx !== -1) {
    const supplied = rowDataObj && rowDataObj["Last Edit Status"];
    newRow[auditIdx] = cleanDataMarkerForStorage_(supplied) || getAuditStamp(user);
  }

  const rowNumber = Math.max(sheet.getLastRow() + 1, 2);
  sheet.getRange(rowNumber, 1, 1, newRow.length).setValues([newRow]);
  invalidateSheetDataCache_(sheet);
  return rowNumber;
}

// --- HELPER: WAREHOUSE ID NORMALIZATION ---

function normalizeWarehouseId(id) {
  if (!id) return "";
  let val = id.toString().trim().toUpperCase();
  return val.replace(/^(WH|W)0*(\d+)/, "W$2");
}


// --- USER-SCOPED HISTORY HELPERS ---
// Normal users only see history rows that belong to their own login.
// Administrator keeps full audit visibility.
function isHistoryAdministrator_(user) {
  const role = String(user && user.role || "").trim().toLowerCase();
  return role === "administrator" || role === "admin";
}

function normalizeHistoryIdentity_(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getHistoryUserIdentityCandidates_(user) {
  const out = {};
  function add(v) {
    const n = normalizeHistoryIdentity_(v);
    if (n) out[n] = true;
  }

  if (!user) return out;
  add(user.username);
  add(user.name);
  add(user.displayName);
  add(user.email);

  const username = String(user.username || "").trim();
  const name = String(user.name || user.displayName || "").trim();
  if (name && username) {
    add(name + " (" + username + ")");
    add(username + " (" + name + ")");
  }
  return out;
}

function historyRecordBelongsToUser_(usernameValue, displayValue, user) {
  if (!user) return false;
  if (isHistoryAdministrator_(user)) return true;

  const candidates = getHistoryUserIdentityCandidates_(user);
  const storedUsername = normalizeHistoryIdentity_(usernameValue);
  if (storedUsername) return !!candidates[storedUsername];

  // Backward compatibility for old rows created before Username audit columns.
  let storedDisplay = normalizeHistoryIdentity_(displayValue);
  if (!storedDisplay) return false;
  if (candidates[storedDisplay]) return true;

  // Old GRNs may contain "Display Name (username)".
  const beforeParen = normalizeHistoryIdentity_(storedDisplay.replace(/\s*\([^)]*\)\s*$/, ""));
  if (beforeParen && candidates[beforeParen]) return true;

  // Audit-style values can contain "Name//Warehouse//Date//Time".
  const beforeAudit = normalizeHistoryIdentity_(storedDisplay.split("//")[0]);
  return !!(beforeAudit && candidates[beforeAudit]);
}

// --- WAREHOUSE-SCOPED HISTORY HELPERS ---
// Administrator can see the complete audit archive. A user with an assigned
// warehouse can only see history that belongs to / involves that warehouse.
function getHistoryWarehouseScope_(user) {
  if (!user || isHistoryAdministrator_(user)) return "ALL";
  const wh = normalizeWarehouseId(user.warehouseId || "");
  return wh || "ALL";
}

function historyRecordBelongsToWarehouse_(recordWarehouse, user) {
  const scope = getHistoryWarehouseScope_(user);
  if (scope === "ALL") return true;
  return normalizeWarehouseId(recordWarehouse || "") === scope;
}

function transferRecordBelongsToWarehouse_(sourceWarehouse, requestingWarehouse, user) {
  const scope = getHistoryWarehouseScope_(user);
  if (scope === "ALL") return true;
  const src = normalizeWarehouseId(sourceWarehouse || "");
  const req = normalizeWarehouseId(requestingWarehouse || "");
  return src === scope || req === scope;
}

// --- COMPACT AUDIT STAMP GENERATOR (kiranpal//W1//07/Aug/2026//16:39) ---

function getAuditStamp(user) {
  const now = new Date();
  const tz = Session.getScriptTimeZone() || "Asia/Kolkata";
  const dateFormatted = Utilities.formatDate(now, tz, "dd/MMM/yyyy//HH:mm:ss");

  var userName = "System";
  var userWh = "ALL";

  if (user) {
    userWh = user.warehouseId ? normalizeWarehouseId(user.warehouseId) : "ALL";
    var rawName = (user.name || user.displayName || user.username || "System").toString().trim();
    rawName = rawName.replace(/\/\//g, "/");

    // Keep warehouse only once in the audit stamp. User display names such as
    // "W1 - Kiranpal W1 (Delhi)" or "Kiranpal W1 (Delhi)" become
    // "Kiranpal (Delhi)//W1//date//time".
    if (userWh && userWh !== "ALL") {
      var whEsc = userWh.replace(/[.*+?^${}()|[\]\\]/g, "\$&");
      rawName = rawName.replace(new RegExp("^" + whEsc + "\\s*[-:]\\s*", "i"), "");
      rawName = rawName.replace(new RegExp("\\s+" + whEsc + "(?=\\s*\\(|\\s*$)", "i"), "");
    }
    userName = rawName.replace(/\s{2,}/g, " ").trim() || "System";
  }

  return userName + "//" + userWh + "//" + dateFormatted;
}

// --- UPDATED INITIAL SETUP (WITH 'Last Edit Status' IN ALL SHEETS) ---

function uploadImageToDrive(base64Data, fileName, folderName = "IMS_Uploads") {
  try {
    if (!base64Data) return "";
    const contentType = base64Data.split(',')[0].split(':')[1].split(';')[0];
    const decoded = Utilities.base64Decode(base64Data.split(',')[1]);
    const blob = Utilities.newBlob(decoded, contentType, fileName);
    const folders = DriveApp.getFoldersByName(folderName);
    let folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) {
    return "Error: " + e.message;
  }
}


// --- PERFORMANCE V22: LIGHTWEIGHT WAREHOUSE LIST ---
// Used by screens that only need warehouse IDs. Avoids loading the 15k+ Setting catalog.
function getWarehouseListForForms() {
  const whSheet = SS.getSheetByName(SHEET_WAREHOUSES);
  if (!whSheet) return [];
  const lastRow = whSheet.getLastRow();
  if (lastRow <= 1) return [];
  return whSheet.getRange(2, 1, lastRow - 1, 1).getValues().flat()
    .map(function(v) { return normalizeWarehouseId(v); })
    .filter(Boolean)
    .filter(function(v, i, a) { return a.indexOf(v) === i; });
}

function getListsForForms(forceRefresh) {
  const cache = CacheService.getScriptCache();
  const cacheKey = "IMS_FORM_LISTS_V1";

  if (!forceRefresh) {
    try {
      const cached = cache.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      Logger.log("Form list cache read skipped: " + e.message);
    }
  }

  const whSheet = SS.getSheetByName(SHEET_WAREHOUSES);
  const lastRow = whSheet ? whSheet.getLastRow() : 0;
  const whData = lastRow > 1 ? whSheet.getRange(2, 1, lastRow - 1, 1).getValues().flat().map(wh => normalizeWarehouseId(wh)) : [];

  const poSheet = SS.getSheetByName(SHEET_PURCHASE_ORDERS);
  const poData = poSheet ? poSheet.getDataRange().getValues() : [];
  const vendorNames = [];
  if (poData.length > 1) {
    for (let i = 1; i < poData.length; i++) {
      const val = poData[i][2];
      if (val && val.toString().trim() !== "") {
        vendorNames.push(val.toString().trim());
      }
    }
  }
  const uniqueVendorNames = [...new Set(vendorNames)].sort();

  const settingSheet = SS.getSheetByName("Setting");
  let products = [];
  let rejectReasons = [];

  if (settingSheet) {
    const settingLastRow = settingSheet.getLastRow();
    if (settingLastRow > 1) {
      // Column A: Products / SKU
      const skuData = settingSheet.getRange(2, 1, settingLastRow - 1, 1).getValues().flat();
      products = skuData
        .filter(sku => sku && sku.toString().trim() !== "")
        .map(sku => {
          const skuStr = sku.toString().trim();
          return {
            id: skuStr,
            name: skuStr,
            category: skuStr.startsWith("KOI-PVT-FOOD") ? "Raw" : "Finished"
          };
        });

      // Column B: Reject Reasons (Setting Sheet Col B)
      const reasonData = settingSheet.getRange(2, 2, settingLastRow - 1, 1).getValues().flat();
      rejectReasons = reasonData
        .filter(r => r && r.toString().trim() !== "")
        .map(r => r.toString().trim());
      rejectReasons = [...new Set(rejectReasons)];
    }
  } else {
    const prodSheet = SS.getSheetByName(SHEET_STOCK_MASTER);
    const prodLastRow = prodSheet ? prodSheet.getLastRow() : 0;
    const prodData = prodLastRow > 1 ? prodSheet.getRange(2, 1, prodLastRow - 1, 3).getValues() : [];
    const productsMap = {};
    prodData.forEach(row => { if (row[0]) productsMap[row[0]] = { name: row[1], category: row[2] }; });
    products = Object.keys(productsMap).map(key => ({
      id: key,
      name: productsMap[key].name,
      category: productsMap[key].category
    }));
  }

  const result = {
    warehouses: whData,
    products: products,
    vendorCodes: uniqueVendorNames,
    rejectReasons: rejectReasons
  };

  try {
    cache.put(cacheKey, JSON.stringify(result), 300);
  } catch (e) {
    Logger.log("Form list cache write skipped: " + e.message);
  }

  return result;
}

// --- PLANNING ---

function getPurchaseProductLookup_() {
  if (__IMS_RUNTIME_CACHE.poProducts) return __IMS_RUNTIME_CACHE.poProducts;
  const lookup = {};
  const poInfo = getSheetDataAndHeaders(SHEET_PURCHASE_ORDERS);
  const headers = poInfo.headers || [];
  const rows = poInfo.dataRows || [];
  if (!headers.length || !rows.length) {
    __IMS_RUNTIME_CACHE.poProducts = lookup;
    return lookup;
  }
  const prodIdCol = getHeaderIndex(headers, "Unique Code", ["Product Code", "ProductID", "Product ID", "Item Code", "Code", "SKU"]);
  const descCol = getHeaderIndex(headers, "Item Description", ["Description", "Item Name", "Product Name"]);
  const uomCol = getHeaderIndex(headers, "UOM", ["Unit", "U.O.M"]);
  const orderCol = getHeaderIndex(headers, "Order no.", ["Order No", "Order Number", "Sales Order No"]);
  const vendorCol = getHeaderIndex(headers, "Vendor Name", ["Vendor", "Supplier"]);
  const vendorCodeCol = getHeaderIndex(headers, "VendorCode", ["Vendor Code"]);
  const buyerCol = getHeaderIndex(headers, "Buyer Code", ["Buyer", "BuyerCode", "Buyer_Code"]);
  if (prodIdCol !== -1) {
    for (let i = 0; i < rows.length; i++) {
      const pid = String(getVal(rows[i], prodIdCol, "") || "").trim();
      if (!pid) continue;
      const key = pid.toUpperCase();
      if (!lookup[key]) {
        lookup[key] = {
          name: descCol !== -1 ? String(getVal(rows[i], descCol, pid) || pid).trim() : pid,
          category: pid.indexOf("F-") === 0 ? "Finished" : "Raw",
          uom: uomCol !== -1 ? cleanUom(getVal(rows[i], uomCol, "")) : "",
          orderNo: orderCol !== -1 ? String(getVal(rows[i], orderCol, "") || "").trim() : "",
          vendorName: vendorCol !== -1 ? String(getVal(rows[i], vendorCol, "") || "").trim() : "",
          vendorCode: vendorCodeCol !== -1 ? String(getVal(rows[i], vendorCodeCol, "") || "").trim() : "",
          buyerCode: buyerCol !== -1 ? String(getVal(rows[i], buyerCol, "") || "").trim() : ""
        };
      }
    }
  }
  __IMS_RUNTIME_CACHE.poProducts = lookup;
  return lookup;
}

function getProductDetailsFromPO(productId) {
  const pid = String(productId || "").trim();
  if (!pid) return { name: "", category: "Raw", uom: "", orderNo: "" };
  try {
    const lookup = getPurchaseProductLookup_();
    return lookup[pid.toUpperCase()] || { name: pid, category: pid.indexOf("F-") === 0 ? "Finished" : "Raw", uom: "", orderNo: "" };
  } catch (e) {
    Logger.log("Error looking up PO product details: " + e.message);
    return { name: pid, category: pid.indexOf("F-") === 0 ? "Finished" : "Raw", uom: "", orderNo: "" };
  }
}

// --- DYNAMIC CENTRAL STOCK MASTER UPDATE (SMART ALL-BIN DEDUCTION) ---

function updateStockAndBinQuantityInternal(warehouseId, productId, binLocation, qtyChange, user) {
  const sheet = SS.getSheetByName(SHEET_STOCK_MASTER);
  if (!sheet) return;

  let stockRuntime = __IMS_RUNTIME_CACHE.stock;
  if (!stockRuntime || stockRuntime.sheetId !== String(sheet.getSheetId())) {
    const snapshot = sheet.getDataRange().getValues();
    stockRuntime = { sheetId: String(sheet.getSheetId()), data: snapshot };
    __IMS_RUNTIME_CACHE.stock = stockRuntime;
  }
  const data = stockRuntime.data;
  if (data.length <= 1) return;

  const headers = data[0].map(h => (h || "").toString().trim());

  const whColIdx = autoResolveHeaderIndex(headers, ["WarehouseID", "Warehouse ID", "Warehouse_ID"]);
  const prodColIdx = autoResolveHeaderIndex(headers, ["ProductID", "Product ID", "Unique Code", "SKU"]);
  const nameColIdx = autoResolveHeaderIndex(headers, ["ProductName", "Product Name", "Item Description"]);
  const catColIdx = autoResolveHeaderIndex(headers, ["Category"]);
  const binColIdx = autoResolveHeaderIndex(headers, ["BinLocation", "Bin Location", "Bin"]);
  const qtyColIdx = autoResolveHeaderIndex(headers, ["CurrentStock", "Current Stock", "Qty", "Quantity"]);

  if (whColIdx === -1 || prodColIdx === -1 || binColIdx === -1 || qtyColIdx === -1) {
    throw new Error("Critical columns missing in StockMaster sheet. Check sheet headers.");
  }

  const normWh = normalizeWarehouseId(warehouseId);
  const normSku = (productId || "").toString().trim().toUpperCase();
  const targetBin = (binLocation || "Inward-Staging").toString().trim();
  const targetBinLower = targetBin.toLowerCase();
  const change = Number(qtyChange);

  if (!normSku || normSku === "UNKNOWN SKU") return;

  // --- CASE A: ADDING STOCK (change > 0) ---
  if (change > 0) {
    let found = false;
    for (let i = 1; i < data.length; i++) {
      const rWh = normalizeWarehouseId(data[i][whColIdx]);
      const rSku = data[i][prodColIdx] ? data[i][prodColIdx].toString().trim().toUpperCase() : "";
      const rBin = data[i][binColIdx] ? data[i][binColIdx].toString().trim().toLowerCase() : "";

      if (rWh === normWh && rSku === normSku && rBin === targetBinLower) {
        const currentQty = Number(data[i][qtyColIdx]) || 0;
        sheet.getRange(i + 1, qtyColIdx + 1).setValue(currentQty + change);
        data[i][qtyColIdx] = currentQty + change;
        updateRowAuditStamp(sheet, i + 1, user);
        found = true;
        break;
      }
    }

    if (!found) {
      const details = getProductDetailsFromPO(productId);
      const rowDataObj = {};
      rowDataObj[headers[whColIdx]] = normWh;
      rowDataObj[headers[prodColIdx]] = productId;
      if (nameColIdx !== -1) rowDataObj[headers[nameColIdx]] = details.name;
      if (catColIdx !== -1) rowDataObj[headers[catColIdx]] = details.category;
      rowDataObj[headers[binColIdx]] = targetBin;
      rowDataObj[headers[qtyColIdx]] = change;

      const appendedRow = appendRowByHeaders(sheet, rowDataObj, user);
      // Keep the request-scoped stock snapshot synchronized without rereading the full sheet.
      if (appendedRow > 1) {
        data.push(sheet.getRange(appendedRow, 1, 1, headers.length).getValues()[0]);
      }
    }
    return;
  }

  // --- CASE B: DEDUCTING / REJECTING STOCK (change < 0) ---
  let neededToDeduct = Math.abs(change);

  let totalAvailable = 0;
  const matchingRows = [];

  for (let i = 1; i < data.length; i++) {
    const rWh = normalizeWarehouseId(data[i][whColIdx]);
    const rSku = data[i][prodColIdx] ? data[i][prodColIdx].toString().trim().toUpperCase() : "";
    const rQty = Number(data[i][qtyColIdx]) || 0;
    const rBin = data[i][binColIdx] ? data[i][binColIdx].toString().trim() : "Inward-Staging";

    if (rWh === normWh && rSku === normSku) {
      totalAvailable += rQty;
      matchingRows.push({
        rowIndex: i + 1,
        bin: rBin,
        binLower: rBin.toLowerCase(),
        qty: rQty
      });
    }
  }

  if (totalAvailable < neededToDeduct) {
    throw new Error(`Insufficient stock in ${normWh} for ${productId}. Available: ${totalAvailable}, Requested: ${neededToDeduct}`);
  }

  matchingRows.sort((a, b) => {
    if (a.binLower === targetBinLower && b.binLower !== targetBinLower) return -1;
    if (b.binLower === targetBinLower && a.binLower !== targetBinLower) return 1;
    return b.qty - a.qty;
  });

  for (const rowObj of matchingRows) {
    if (neededToDeduct <= 0) break;
    if (rowObj.qty <= 0) continue;

    const deductAmount = Math.min(rowObj.qty, neededToDeduct);
    const newQty = rowObj.qty - deductAmount;
    sheet.getRange(rowObj.rowIndex, qtyColIdx + 1).setValue(newQty);
    data[rowObj.rowIndex - 1][qtyColIdx] = newQty;
    updateRowAuditStamp(sheet, rowObj.rowIndex, user);
    neededToDeduct -= deductAmount;
  }
}
// --- HELPER: CLEAN SKU KEY FOR PERFECT ORDER NO MATCHING ---

function cleanSkuKey(str) {
  if (!str) return "";
  return str.toString().replace(/[\s\u00A0]+/g, '').toUpperCase();
}

// --- DYNAMIC CENTRAL STOCK REPORT (WITH 100% ACCURATE MULTI-KEY ORDER NO FETCH) ---

function cleanUom(uomVal) {
  if (!uomVal) return "";
  const str = uomVal.toString().trim();
  const upper = str.toUpperCase();
  if (upper === "N/A" || upper === "NULL" || upper === "UNDEFINED" || upper === "NONE") {
    return "";
  }
  return str;
}

// --- UPDATED DASHBOARD ROUTER ---

function getDashboardData(user) {
  try {
    if (!user || !user.role) {
      throw new Error('User role is undefined.');
    }
    const role = String(user.role || '').trim().toLowerCase();
    const department = String(user.department || '').trim().toLowerCase();

    // The Department Dashboard follows the explicit department assignment.
    // A user can retain a Planner role for permissions while being assigned
    // to Accounts; do not load Planner data for that Accounts dashboard.
    if (department.indexOf('account') !== -1 || department.indexOf('finance') !== -1) {
      return { role: 'Accounts', department: 'Accounts' };
    }

    if (role === 'planner') {
      const plannerData = getPlannerData(user); // Pass user to isolate location
      const whId = user.warehouseId ? user.warehouseId : "All";
      plannerData.warehouseTasks = getWarehouseData(whId, user, false);
      return plannerData;
    }

    if (role === 'purchase' || role === 'purchaser') return getPurchaseDashboardData(user);
    if (role === 'warehouse' || role === 'warehouse manager' || role === 'warehousemanager') {
      return getWarehouseData(user.warehouseId, user, false);
    }
    if (role === 'production') return getProductionData(user.warehouseId);
    if (role === 'quality' || role === 'qc') return getQualityDashboardData();
    if (role === 'accounts' || role === 'account' || role === 'demo1' || role === 'finance') {
      return { role: 'Accounts' };
    }

    throw new Error('Unsupported user role: ' + user.role);
  } catch (e) {
    throw new Error('Failed to load dashboard: ' + e.message);
  }
}

// --- HELPER: SAFE ROW VALUE EXTRACTOR (CLEANS NA / N/A / UNDEFINED / NULL) ---

function getVal(row, colIndex, defaultValue = "") {
  const safeDefault = cleanDataMarkerForStorage_(defaultValue);
  if (colIndex === -1 || colIndex === undefined || colIndex >= row.length) return safeDefault;
  const val = row[colIndex];
  if (val === undefined || val === null) return safeDefault;
  const cleaned = cleanDataMarkerForStorage_(val);
  return cleaned === "" ? safeDefault : cleaned;
}

// --- ROLE: PLANNER DATA (LOCATION ISOLATED FOR MUMBAI & HEAD PLANNER APPROVALS) ---

function cleanDisplayVal(val, defaultFallback = "") {
  const cleanFallback = (() => {
    if (defaultFallback === null || defaultFallback === undefined) return "";
    const fb = defaultFallback.toString().trim();
    const up = fb.toUpperCase();
    return (up === "N/A" || up === "NA" || up === "N.A." || up === "NULL" || up === "UNDEFINED" || up === "NONE" || up === "NOT AVAILABLE") ? "" : fb;
  })();
  if (val === null || val === undefined) return cleanFallback;
  let str = val.toString().trim();
  let upper = str.toUpperCase();
  if (str === "" || upper === "N/A" || upper === "NA" || upper === "N.A." || upper === "NULL" || upper === "UNDEFINED" || upper === "NONE" || upper === "NOT AVAILABLE") {
    return cleanFallback;
  }
  return str;
}

// --- UNIFIED MASTER GRN HTML GENERATOR (WITH TOTAL QTY & PARTIAL RECEIVE NOTICE) ---


// ============================================================================
// LEGACY ID FORMAT SAFE GENERATOR
// Keeps the ORIGINAL visible ID format (PREFIX + fixed random digits) while
// preventing a value already present in the target backend column from being
// generated again. It does not rewrite any existing ID.
// ============================================================================
function generateLegacyUniqueId_(sheetName, headerName, prefix, digits, aliases) {
  const sheet = SS.getSheetByName(sheetName);
  const safePrefix = String(prefix || "");
  const digitCount = Math.max(1, Number(digits || 4));
  const min = Math.pow(10, digitCount - 1);
  const range = 9 * min;
  const existing = new Set();

  if (sheet && sheet.getLastRow() >= 1 && sheet.getLastColumn() >= 1) {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0]
      .map(function(h) { return String(h || "").trim(); });
    const col = getHeaderIndex(headers, headerName, aliases || []);
    if (col >= 0 && sheet.getLastRow() > 1) {
      sheet.getRange(2, col + 1, sheet.getLastRow() - 1, 1).getDisplayValues()
        .forEach(function(row) {
          const id = String(row[0] || "").trim().toUpperCase();
          if (id) existing.add(id);
        });
    }
  }

  // Preserve the legacy random-number style. Retry only to avoid duplicates.
  // The loop limit is intentionally high but bounded.
  for (let attempt = 0; attempt < 20000; attempt++) {
    const n = Math.floor(min + Math.random() * range);
    const candidate = safePrefix + n;
    if (!existing.has(candidate.toUpperCase())) return candidate;
  }

  throw new Error("Unable to generate an unused " + safePrefix + " ID in the legacy format.");
}

