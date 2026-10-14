// ============================================================
// ADMIN / AUTH / SCHEMA
// Extracted from original Code.gs without changing function names.
// ============================================================

function ensureSchemaReady() {
  const props = PropertiesService.getScriptProperties();
  const currentVersion = props.getProperty("IMS_SCHEMA_VERSION");

  if (currentVersion === IMS_SCHEMA_VERSION) return;

  setupNewSheets();
  props.setProperty("IMS_SCHEMA_VERSION", IMS_SCHEMA_VERSION);
}

function forceSchemaSetup() {
  setupNewSheets();
  PropertiesService.getScriptProperties().setProperty("IMS_SCHEMA_VERSION", IMS_SCHEMA_VERSION);
  return "Schema setup completed.";
}

function setupNewSheets() {
  const headersMap = {
    [SHEET_WAREHOUSES]: ["WarehouseID", "Location", "Type", "Last Edit Status"],
    [SHEET_USERS]: ["Username", "Password", "DisplayName", "Role", "WarehouseID", "Email ID", "Department", "Last Edit Status"],
    [SHEET_PURCHASE_ORDERS]: [
      "PO Number", "P.O Dated", "Vendor Name", "VendorCode", "Unique Code",
      "Item Description", "UOM", "Qty", "Purchase Person Name", "Order no.",
      "Material Received Expected Date", "Location", "Sales Person Name", "Buyer Code",
      "Status", "PlannedBy", "Last Edit Status"
    ],
    [SHEET_RECEIVING_PLAN]: ["Plan_ID", "PO_ID", "ProductID", "WarehouseID", "PlannedQty", "Status", "TotalReceivedQty", "PlannedBy", "Last Edit Status"],
    [SHEET_STOCK_MASTER]: ["WarehouseID", "ProductID", "ProductName", "Category", "CurrentStock", "BinLocation", "Last Edit Status"],
    [SHEET_GOODS_RECEIVED]: [
      "Receipt_ID", "Plan_ID", "PO_ID", "ProductID", "ProductName", "WarehouseID", "ReceivedQty", "RejectedQty",
      "Remarks", "ReceivedBy", "ReceivedByUsername", "Date", "StorageLocation",
      "InvoiceNo", "BiltyNo", "TruckNo", "DriverName", "DriverNo", "GSTInvoiceNo",
      "InvoiceImageURL", "ItemImageURL", "PurchaserName", "PlannerName", "Last Edit Status",
      "PlannedQtyAtGRN", "PreviousReceivedQty", "BalanceBeforeGRN", "ExtraReceivedQty", "TotalReceivedAfterGRN"
    ],
    [SHEET_STOCK_TRANSFER]: [
      "Request_ID", "RequestingWarehouse", "SourceWarehouse", "ProductID",
      "RequestedQty", "Status", "OrderNo", "RequestedBy", "RequestedByUsername", "DispatchedQty", "ReceivedQty",
      "RequestType", "RequestGroupID", "Production_ID", "FinalProductID", "FinalProductName", "RequestRemarks",
      "Last Edit Status"
    ],
    [SHEET_PRODUCTION_LOG]: ["Log_ID", "Date", "ProductionWarehouse", "ProductID_Raw", "Qty_Consumed", "ProductID_Finished", "Qty_Produced", "DestinationWarehouse", "QC_Status", "QC_ID", "LoggedBy", "Last Edit Status"],
    [SHEET_PRODUCTION_JOBS]: [
      "Production_ID", "Order_No", "Product_ID", "Product_Name", "Order_Qty",
      "Planned_Production_Qty", "Final_Produced_Qty", "UOM", "Unit_Per_Carton",
      "Party_Name", "Warehouse_ID", "Material_Request_Group_ID", "Status", "Start_Date", "Closing_Date", "Started_By", "Closed_By",
      "Process_Details", "Remarks", "Last Edit Status"
    ],
    [SHEET_PRODUCTION_MERGE_DETAILS]: [
      "Merge_ID", "Production_ID", "Order_No", "Final_Product_ID",
      "Merged_Item_ID", "Merged_Item_Name", "Merged_Qty", "UOM",
      "Work_Details", "Entered_By", "Entry_Date", "Remarks", "Last Edit Status"
    ],
    [SHEET_PRODUCTION_MATERIAL_CLOSURE]: [
      "Closure_ID", "Production_ID", "Request_ID", "Order_No", "Final_Product_ID",
      "Material_ID", "Material_Name", "Source_Warehouse", "Production_Warehouse",
      "Received_Qty", "Used_Qty", "Returned_Qty", "Closed_By", "Closing_Date",
      "Remarks", "Last Edit Status"
    ],
    [SHEET_STOCK_ADJUSTMENTS]: ["AdjustmentID", "Date", "ProductID", "WarehouseID", "AdjustedQty", "Reason", "AdjustedBy", "Last Edit Status"],
    [SHEET_REJECT_ACTIONS]: [
      "Action_ID", "Receipt_ID", "PO_ID", "ProductID", "RejectedQty",
      "ActionType", "ActionDate", "ReferenceNo", "Status", "PurchaseRemarks", "UpdatedBy",
      "IsReplacementExpected", "ReplacementVendor", "ReplacementETA", "ResolutionPath", "Last Edit Status"
    ],
    [SHEET_QUALITY_LOG]: ["QC_ID", "Production_Log_ID", "Date_Requested", "WarehouseID", "ProductID", "Qty_To_Inspect", "Status", "CheckedBy", "InspectionDate", "Decision", "Reason", "Last Edit Status"]
  };

  const sheetNames = Object.keys(headersMap);
  let updatedSheetsInfo = [];

  sheetNames.forEach(name => {
    let sheet = SS.getSheetByName(name);
    if (!sheet) {
      sheet = SS.insertSheet(name);
      sheet.getRange(1, 1, 1, headersMap[name].length).setValues([headersMap[name]]);
      updatedSheetsInfo.push(`${name} (Created New)`);
    } else {
      const lastCol = sheet.getLastColumn();
      let existingHeaders = [];
      if (lastCol > 0) {
        existingHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => h.toString().trim());
      }

      let missingHeaders = [];
      headersMap[name].forEach(expected => {
        const found = existingHeaders.some(ex => ex.toLowerCase() === expected.toLowerCase());
        if (!found) {
          missingHeaders.push(expected);
        }
      });

      if (missingHeaders.length > 0) {
        const startCol = lastCol + 1;
        sheet.getRange(1, startCol, 1, missingHeaders.length).setValues([missingHeaders]);
        updatedSheetsInfo.push(`${name} (Appended: ${missingHeaders.join(", ")})`);
      }
    }
  });

  // Final safety net: append Last Edit Status to every existing backend sheet without moving old data.
  ensureLastEditStatusOnAllSheets_();
  Logger.log("All sheet headers updated with 'Last Edit Status'.");
}
// --- RESOLVE & AUTOMATE PURCHASE REJECTION ACTION ---

function deriveDepartmentFromRoleServer(role) {
  const clean = String(role || "").trim().toLowerCase();
  if (clean === "planner") return "Planning";
  if (clean === "purchase" || clean === "purchaser") return "Purchase";
  if (clean === "warehouse" || clean === "warehouse manager" || clean === "warehousemanager") return "Warehouse";
  if (clean === "production") return "Production";
  if (clean === "quality" || clean === "qc") return "Quality";
  if (clean === "accounts" || clean === "account" || clean === "demo1" || clean === "finance") return "Accounts";
  return "Common";
}

function userLogin(formData) {
  if (!formData || formData.username === undefined || formData.password === undefined) {
    throw new Error('Username and password are required.');
  }

  const sheet = SS.getSheetByName(SHEET_USERS);
  if (!sheet) throw new Error('Users sheet not found. Please run setupNewSheets().');

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) throw new Error('No users are configured in the Users sheet.');

  const headers = data[0].map(h => String(h || "").trim());
  const usernameCol = getHeaderIndex(headers, "Username");
  const passwordCol = getHeaderIndex(headers, "Password");
  const nameCol = getHeaderIndex(headers, "DisplayName", ["Display Name", "Name"]);
  const roleCol = getHeaderIndex(headers, "Role");
  const warehouseCol = getHeaderIndex(headers, "WarehouseID", ["Warehouse ID"]);
  const departmentCol = getHeaderIndex(headers, "Department", ["Dept", "Department Name"]);

  if (usernameCol === -1 || passwordCol === -1) {
    throw new Error('Users sheet must contain Username and Password columns.');
  }

  const inputUsername = String(formData.username || '').trim();
  const inputPassword = String(formData.password || '').trim();
  if (!inputUsername || !inputPassword) throw new Error('Username and password are required.');

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const username = String(getVal(row, usernameCol, "") || '').trim();
    const password = String(getVal(row, passwordCol, "") || '').trim();

    if (username && password && username === inputUsername && password === inputPassword) {
      const role = String(getVal(row, roleCol, "") || '').trim();
      const explicitDepartment = departmentCol !== -1
        ? String(getVal(row, departmentCol, "") || '').trim()
        : "";

      return {
        status: 'success',
        username: username,
        name: String(getVal(row, nameCol, username) || username).trim(),
        role: role,
        department: explicitDepartment || deriveDepartmentFromRoleServer(role),
        warehouseId: normalizeWarehouseId(getVal(row, warehouseCol, ""))
      };
    }
  }

  throw new Error('Invalid username or password.');
}

// --- 🟢 UPDATED WAREHOUSE DATA RETRIEVAL (WITH TIMESTAMPS & EDITORS) ---

function verifyUserRole(user, allowedRoles) {
  if (!user) throw new Error("Access Denied: User session invalid.");

  let username = "";
  if (typeof user === "string") {
    username = user;
  } else if (typeof user === "object") {
    username = user.username || user.name || "";
  }

  const normalizedAllowed = allowedRoles.map(r => r.trim().toLowerCase());

  // Direct Role Check on user object
  if (typeof user === "object" && user.role) {
    const uRole = user.role.toString().trim().toLowerCase();
    if (normalizedAllowed.includes(uRole) || (uRole === 'warehouse' && normalizedAllowed.includes('warehouse manager'))) {
      return true;
    }
  }

  const sheet = SS.getSheetByName(SHEET_USERS);
  if (!sheet) return true;
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return true;

  const normSearchUser = username.toString().trim().toLowerCase();

  for (let i = 1; i < data.length; i++) {
    const uName = data[i][0] ? data[i][0].toString().trim().toLowerCase() : "";
    const dName = data[i][2] ? data[i][2].toString().trim().toLowerCase() : "";
    const userRole = data[i][3] ? data[i][3].toString().trim().toLowerCase() : "";

    if ((uName === normSearchUser || dName === normSearchUser) &&
      (normalizedAllowed.includes(userRole) || (userRole === 'warehouse' && normalizedAllowed.includes('warehouse manager')))) {
      return true;
    }
  }

  throw new Error("Access Denied: Is action ke liye aapke paas permissions nahi hain.");
}

// --- SECURE STOCK ADJUSTMENT / MATERIAL REJECTION FOR PRODUCTION ---

function fixAllCorruptedData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Declaring counters at the top of function scope to prevent ReferenceError
  var fixCount = 0;
  var planFixes = 0;
  var stockFixes = 0;
  var stockMerges = 0;
  var fixLog = [];

  Logger.log("=== STARTING DATA CLEANUP PROCESS ===");

  // 1. MASTER DATA EXTRACTION FROM PurchaseOrders
  const poSheet = ss.getSheetByName("PurchaseOrders");
  if (!poSheet) {
    SpreadsheetApp.getUi().alert("Error: PurchaseOrders sheet not found!");
    return;
  }

  const poData = poSheet.getDataRange().getValues();
  if (poData.length <= 1) {
    SpreadsheetApp.getUi().alert("PurchaseOrders sheet is empty!");
    return;
  }

  const poHeaders = poData[0].map(h => normalizeHeaderString(h));
  const poNumCol = getHeaderIndex(poHeaders, "PO Number", ["PO_Number", "PO ID"]);
  const skuCol = getHeaderIndex(poHeaders, "Unique Code", ["Product Code", "ProductID", "Item Code", "SKU"]);
  const descCol = getHeaderIndex(poHeaders, "Item Description", ["Description", "Item Name"]);
  const vCodeCol = getHeaderIndex(poHeaders, "VendorCode", ["Vendor Code"]);

  if (poNumCol === -1 || skuCol === -1) {
    SpreadsheetApp.getUi().alert("Critical headers (PO Number / Unique Code) missing in PurchaseOrders sheet!");
    return;
  }

  // Master Data Dictionaries
  const poToItemsMap = {};
  const skuToDescMaster = {};
  const descToSkuMaster = {};
  const vendorCodesSet = new Set();

  for (let i = 1; i < poData.length; i++) {
    const poId = getVal(poData[i], poNumCol, "").toString().trim();
    const sku = getVal(poData[i], skuCol, "").toString().trim();
    const desc = getVal(poData[i], descCol, "").toString().trim();
    const vCode = getVal(poData[i], vCodeCol, "").toString().trim();

    if (!poId || !sku) continue;

    if (vCode) vendorCodesSet.add(vCode.toUpperCase());
    if (desc) {
      skuToDescMaster[sku.toUpperCase()] = desc;
      descToSkuMaster[desc.toUpperCase()] = sku;
    }

    if (!poToItemsMap[poId.toUpperCase()]) {
      poToItemsMap[poId.toUpperCase()] = [];
    }

    poToItemsMap[poId.toUpperCase()].push({
      sku: sku,
      desc: desc,
      vCode: vCode
    });
  }

  // Helper Function to Detect Bad/Corrupted SKU (e.g. VC34 or Vendor Code)
  function isBadSku(skuStr, poIdStr) {
    if (!skuStr || skuStr === "N/A" || skuStr === "Unknown SKU") return true;
    const norm = skuStr.toString().trim().toUpperCase();
    if (vendorCodesSet.has(norm) || norm.startsWith("VC")) return true;

    if (poIdStr && poToItemsMap[poIdStr.toUpperCase()]) {
      const validSkus = poToItemsMap[poIdStr.toUpperCase()].map(x => x.sku.toUpperCase());
      if (!validSkus.includes(norm)) return true;
    }
    return false;
  }

  // -------------------------------------------------------------------
  // 2. FIX ReceivingPlan SHEET
  // -------------------------------------------------------------------
  const planSheet = ss.getSheetByName("ReceivingPlan");
  if (planSheet) {
    const planData = planSheet.getDataRange().getValues();
    if (planData.length > 1) {
      const pHeaders = planData[0].map(h => normalizeHeaderString(h));
      const pPoCol = getHeaderIndex(pHeaders, "PO_ID", ["PO ID", "PO Number"]);
      const pSkuCol = getHeaderIndex(pHeaders, "ProductID", ["Product ID", "Unique Code"]);

      if (pPoCol !== -1 && pSkuCol !== -1) {
        for (let i = 1; i < planData.length; i++) {
          const poId = getVal(planData[i], pPoCol, "").toString().trim();
          const currentSku = getVal(planData[i], pSkuCol, "").toString().trim();

          if (isBadSku(currentSku, poId) && poToItemsMap[poId.toUpperCase()]) {
            const possibleItems = poToItemsMap[poId.toUpperCase()];
            if (possibleItems.length > 0) {
              const correctSku = possibleItems[0].sku;
              planSheet.getRange(i + 1, pSkuCol + 1).setValue(correctSku);

              fixCount++;
              planFixes++;
              fixLog.push(`📌 <b>[ReceivingPlan] Row ${i + 1}:</b> Replaced Bad Code <code>'${currentSku}'</code> ➔ Correct SKU <code>'${correctSku}'</code> (PO: ${poId})`);
            }
          }
        }
      }
    }
  }

  // -------------------------------------------------------------------
  // 3. FIX & MERGE StockMaster SHEET
  // -------------------------------------------------------------------
  const stockSheet = ss.getSheetByName("StockMaster");
  if (stockSheet) {
    const stockData = stockSheet.getDataRange().getValues();
    if (stockData.length > 1) {
      const sHeaders = stockData[0].map(h => normalizeHeaderString(h));
      const sWhCol = getHeaderIndex(sHeaders, "WarehouseID", ["Warehouse ID"]);
      const sSkuCol = getHeaderIndex(sHeaders, "ProductID", ["Product ID", "Unique Code"]);
      const sNameCol = getHeaderIndex(sHeaders, "ProductName", ["Product Name", "Item Description"]);
      const sCatCol = getHeaderIndex(sHeaders, "Category");
      const sBinCol = getHeaderIndex(sHeaders, "BinLocation", ["Bin Location", "Bin"]);
      const sQtyCol = getHeaderIndex(sHeaders, "Qty", ["CurrentStock", "Quantity"]);

      if (sWhCol !== -1 && sSkuCol !== -1 && sQtyCol !== -1) {
        const consolidatedMap = {};

        for (let i = 1; i < stockData.length; i++) {
          let wh = getVal(stockData[i], sWhCol, "").toString().trim().toUpperCase();
          let sku = getVal(stockData[i], sSkuCol, "").toString().trim();
          let name = getVal(stockData[i], sNameCol, "").toString().trim();
          let cat = sCatCol !== -1 ? getVal(stockData[i], sCatCol, "Raw").toString().trim() : "Raw";
          let bin = sBinCol !== -1 ? getVal(stockData[i], sBinCol, "Inward-Staging").toString().trim() : "Inward-Staging";
          let qty = Number(getVal(stockData[i], sQtyCol, 0)) || 0;

          if (!wh || !sku) continue;

          // If ProductID is a VendorCode (e.g., VC34), match Product Name to find actual SKU
          if (vendorCodesSet.has(sku.toUpperCase()) || sku.toUpperCase().startsWith("VC")) {
            if (descToSkuMaster[name.toUpperCase()]) {
              const oldSku = sku;
              sku = descToSkuMaster[name.toUpperCase()];
              stockFixes++;
              fixCount++;
              fixLog.push(`📌 <b>[StockMaster] Row ${i + 1}:</b> Replaced Vendor Code <code>'${oldSku}'</code> ➔ Correct Unique Code <code>'${sku}'</code>`);
            }
          }

          // Ensure Product Name is exact Master Description
          if (skuToDescMaster[sku.toUpperCase()]) {
            name = skuToDescMaster[sku.toUpperCase()];
          }

          const uniqueKey = wh + "___" + sku.toUpperCase() + "___" + bin.toUpperCase();

          if (!consolidatedMap[uniqueKey]) {
            consolidatedMap[uniqueKey] = {
              wh: wh,
              sku: sku,
              name: name,
              cat: cat,
              bin: bin,
              qty: qty
            };
          } else {
            // Merge duplicate stock entries created by wrong codes!
            consolidatedMap[uniqueKey].qty += qty;
            stockMerges++;
            fixCount++;
            fixLog.push(`🔄 <b>[StockMaster] Merged Duplicate Stock Row:</b> Combined duplicate entries for SKU <code>'${sku}'</code> in Warehouse <b>${wh}</b> (${bin}). New Merged Quantity: <b>${consolidatedMap[uniqueKey].qty}</b>`);
          }
        }

        // Re-write Cleaned StockMaster
        const cleanRows = [stockData[0]];
        Object.keys(consolidatedMap).forEach(key => {
          const item = consolidatedMap[key];
          const row = new Array(stockData[0].length).fill("");
          row[sWhCol] = item.wh;
          row[sSkuCol] = item.sku;
          if (sNameCol !== -1) row[sNameCol] = item.name;
          if (sCatCol !== -1) row[sCatCol] = item.cat;
          if (sBinCol !== -1) row[sBinCol] = item.bin;
          row[sQtyCol] = item.qty;
          cleanRows.push(row);
        });

        stockSheet.clearContents();
        stockSheet.getRange(1, 1, cleanRows.length, cleanRows[0].length).setValues(cleanRows);
      }
    }
  }

  SpreadsheetApp.flush();

  // -------------------------------------------------------------------
  // 5. SHOW BEAUTIFUL POPUP REPORT WITH DETAILED BREAKDOWN
  // -------------------------------------------------------------------
  const logItemsHtml = fixLog.length > 0 ?
    fixLog.map(l => `<li style="margin-bottom:8px; border-bottom:1px solid #f1f5f9; padding-bottom:6px;">${l}</li>`).join("") :
    "<li>No corrupted records found! All sheets are clean.</li>";

  const htmlReport = `
    <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 15px; color: #1e293b; background-color: #f8fafc; }
          .card { background: white; padding: 15px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 15px; }
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center; margin-bottom: 15px; }
          .stat-box { background: #f1f5f9; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1; }
          .stat-number { font-size: 20px; font-weight: bold; color: #4f46e5; }
          .stat-label { font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase; }
          .log-box { background: white; border: 1px solid #cbd5e1; border-radius: 8px; max-height: 250px; overflow-y: auto; padding: 12px; font-size: 12px; }
          ul { list-style-type: none; padding-left: 0; margin: 0; }
          code { background: #e0e7ff; color: #3730a3; padding: 2px 5px; border-radius: 4px; font-family: monospace; font-weight: bold; }
        </style>
      </head>
      <body>
        <h2 style="margin-top:0; color:#0f172a;">🛠️ Data Repair & Verification Report</h2>
        
        <div class="summary-grid">
          <div class="stat-box">
            <div class="stat-number">${planFixes}</div>
            <div class="stat-label">ReceivingPlan Fixed</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${stockFixes}</div>
            <div class="stat-label">StockMaster Codes Fixed</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${stockMerges}</div>
            <div class="stat-label">Duplicate Rows Merged</div>
          </div>
        </div>

        <div class="card" style="padding:10px;">
          <strong style="font-size:13px; color:#334155;">Detailed Sheet-by-Sheet Audit Log:</strong>
          <div class="log-box" style="margin-top:8px;">
            <ul>${logItemsHtml}</ul>
          </div>
        </div>
      </body>
    </html>
  `;

  const userInterface = HtmlService.createHtmlOutput(htmlReport)
    .setWidth(600)
    .setHeight(480);
  SpreadsheetApp.getUi().showModalDialog(userInterface, "System Auto-Repair Complete");
}

// ==========================================
// 🛡️ GST VERIFICATION API INTEGRATION
// ==========================================
const APPYFLOW_GST_API_KEY = 'o76jHUnBsZTOQMdBO1ZkURg3LfO2';

/**
 * Server function to verify GSTIN via AppyFlow API
 */

function verifyGSTIN(gstin) {
  if (!gstin) throw new Error("Kripya GSTIN number enter karein.");

  gstin = gstin.toString().trim().toUpperCase();

  // Basic 15-character GSTIN format check
  const pattern = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/;
  if (!pattern.test(gstin)) {
    throw new Error("Invalid GSTIN Format! GSTIN 15 characters ka hona chahiye (e.g. 27AAAAA0000A1Z5).");
  }

  try {
    const url = 'https://appyflow.in/api/verifyGST?gstNo=' + encodeURIComponent(gstin) +
      '&key_secret=' + encodeURIComponent(APPYFLOW_GST_API_KEY);

    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      muteHttpExceptions: true
    });

    const data = JSON.parse(response.getContentText());

    if (data.error || !data.taxpayerInfo) {
      return {
        status: 'error',
        message: data.message || 'GSTIN details nahi mili ya API error hai.'
      };
    }

    const info = data.taxpayerInfo;
    const addr = (info.pradr && info.pradr.addr) || {};

    // Address formatting
    const addressParts = [
      addr.bno, addr.bnm, addr.flno, addr.st, addr.loc, addr.dst, addr.stcd, addr.pncd
    ].filter(function (p) { return p && p.toString().trim() !== ''; });

    return {
      status: 'success',
      gstin: gstin,
      legalName: info.lgnm || '',
      tradeName: info.tradeNam || info.lgnm || '',
      gstStatus: info.sts || 'UNKNOWN',
      address: addressParts.join(', '),
      state: addr.stcd || '',
      district: addr.dst || '',
      pincode: addr.pncd || '',
      regDate: info.rgdt || ''
    };
  } catch (e) {
    throw new Error("GST API Request Failed: " + e.message);
  }
}
// 🟢 PERMISSION FORCE AUTHORIZATION HELPER

function forceAuthPermissions() {
  UrlFetchApp.fetch("https://appyflow.in", { muteHttpExceptions: true });
  Logger.log("Permission Granted Successfully!");
}
// --- GENERATE RECEIVING PLAN PDF REPORT (LANDSCAPE FORMAT) ---


// --- SAFE LEGACY NO-DATA MARKER CLEANUP ---
// Clears only literal text markers. It does NOT move/delete rows or columns and
// it does NOT clear formula cells. Run manually once if you want old N/A/NA
// values in the backend workbook converted to blank cells.
function cleanupLegacyNoDataMarkersSafe() {
  const markers = ["N/A", "NA", "N.A.", "NULL", "UNDEFINED", "NONE", "NOT AVAILABLE"];
  const result = [];

  SS.getSheets().forEach(function(sheet) {
    let cleared = 0;
    markers.forEach(function(marker) {
      const finder = sheet.createTextFinder(marker).matchEntireCell(true).matchCase(false);
      const cells = finder.findAll();
      cells.forEach(function(cell) {
        // Never destroy formulas; only clear literal placeholder text.
        if (!cell.getFormula()) {
          cell.clearContent();
          cleared++;
        }
      });
    });
    if (cleared > 0) result.push(sheet.getName() + ": " + cleared);
  });

  SpreadsheetApp.flush();
  return result.length ? result.join("\n") : "No legacy no-data markers found.";
}

// Non-destructive backend header check. Returns missing/blank/duplicate headers
// without changing any sheet data.
function validateBackendSchemaNoChanges() {
  const required = {
    Warehouses: ["WarehouseID", "Location", "Type", "Last Edit Status"],
    Users: ["Username", "Password", "DisplayName", "Role", "WarehouseID", "Email ID", "Department", "Last Edit Status"],
    PurchaseOrders: ["PO Number", "P.O Dated", "Vendor Name", "VendorCode", "Unique Code", "Item Description", "UOM", "Qty", "Purchase Person Name", "Order no.", "Material Received Expected Date", "Location", "Sales Person Name", "Buyer Code", "Status", "PlannedBy", "Last Edit Status"],
    ReceivingPlan: ["Plan_ID", "PO_ID", "ProductID", "WarehouseID", "PlannedQty", "Status", "TotalReceivedQty", "PlannedBy", "Last Edit Status"],
    GoodsReceivedLog: ["Receipt_ID", "Plan_ID", "PO_ID", "ProductID", "ProductName", "WarehouseID", "ReceivedQty", "RejectedQty", "Remarks", "ReceivedBy", "ReceivedByUsername", "Date", "StorageLocation", "InvoiceNo", "BiltyNo", "TruckNo", "DriverName", "DriverNo", "GSTInvoiceNo", "InvoiceImageURL", "ItemImageURL", "PurchaserName", "PlannerName", "Last Edit Status", "PlannedQtyAtGRN", "PreviousReceivedQty", "BalanceBeforeGRN", "ExtraReceivedQty", "TotalReceivedAfterGRN"],
    StockMaster: ["ProductID", "ProductName", "Category", "WarehouseID", "CurrentStock", "BinLocation", "Last Edit Status"],
    StockTransferRequest: ["Request_ID", "RequestingWarehouse", "SourceWarehouse", "ProductID", "RequestedQty", "Status", "OrderNo", "RequestedBy", "RequestedByUsername", "DispatchedQty", "ReceivedQty", "RequestType", "RequestGroupID", "Production_ID", "FinalProductID", "FinalProductName", "RequestRemarks", "Last Edit Status"]
  };

  const out = [];
  Object.keys(required).forEach(function(name) {
    const sh = SS.getSheetByName(name);
    if (!sh) { out.push(name + ": SHEET MISSING"); return; }
    const lastCol = Math.max(sh.getLastColumn(), 1);
    const headers = sh.getRange(1, 1, 1, lastCol).getDisplayValues()[0].map(function(v){ return String(v || "").trim(); });
    const normalized = headers.map(function(v){ return normalizeHeaderString(v); });
    const missing = required[name].filter(function(h){ return normalized.indexOf(normalizeHeaderString(h)) === -1; });
    const blanks = [];
    headers.forEach(function(h, i){ if (!h) blanks.push(i + 1); });
    const seen = {}; const dups = [];
    normalized.forEach(function(h){ if (!h) return; seen[h] = (seen[h] || 0) + 1; });
    Object.keys(seen).forEach(function(h){ if (seen[h] > 1) dups.push(h); });
    out.push(name + ": missing=" + (missing.join(", ") || "none") +
      "; blankHeaderColumns=" + (blanks.join(",") || "none") +
      "; duplicateHeaders=" + (dups.join(", ") || "none"));
  });
  return out.join("\n");
}

