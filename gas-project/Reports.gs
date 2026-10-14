// ============================================================
// COMMON REPORTS
// Extracted from original Code.gs without changing function names.
// ============================================================

function getStockReport() {
  const stockSheet = SS.getSheetByName(SHEET_STOCK_MASTER);
  if (!stockSheet) return { warehouses: [], reportData: [] };
  const stockData = stockSheet.getDataRange().getValues();

  const whSheet = SS.getSheetByName(SHEET_WAREHOUSES);
  let warehousesList = [];
  if (whSheet) {
    const whLastRow = whSheet.getLastRow();
    if (whLastRow > 1) {
      warehousesList = whSheet.getRange(2, 1, whLastRow - 1, 1)
        .getValues()
        .flat()
        .map(wh => normalizeWarehouseId(wh))
        .filter(Boolean);
    }
  }
  warehousesList = [...new Set(warehousesList)];

  // Order No & UOM Lookup Maps (Multi-Key Support)
  const poUOMMap = {};
  const alphaUOMMap = {};
  const poOrderNoMap = {};
  const alphaOrderNoMap = {};
  const descOrderNoMap = {};

  // 1. Fetch Order No & UOM from PurchaseOrders Sheet using Dynamic Header Resolution
  const poInfo = getSheetDataAndHeaders(SHEET_PURCHASE_ORDERS);
  const poHeaders = poInfo.headers;
  const poRows = poInfo.dataRows;

  if (poHeaders.length > 0) {
    const prodIdCol = autoResolveHeaderIndex(poHeaders, ["Unique Code", "Product Code", "ProductID", "Product ID", "Item Code", "Code", "SKU"]);
    const descCol = autoResolveHeaderIndex(poHeaders, ["Item Description", "Description", "Item Name", "Product Name"]);
    const uomCol = autoResolveHeaderIndex(poHeaders, ["UOM", "Unit", "U.O.M"]);
    const orderNoCol = autoResolveHeaderIndex(poHeaders, ["Order no.", "Order No", "Sales Order No", "Order Number", "Job Card"]);

    for (let i = 0; i < poRows.length; i++) {
      const row = poRows[i];
      const rawPid = prodIdCol !== -1 ? String(getVal(row, prodIdCol, "") ?? "").trim() : "";
      const rawDesc = descCol !== -1 ? String(getVal(row, descCol, "") ?? "").trim() : "";
      const uomVal = uomCol !== -1 ? String(getVal(row, uomCol, "") ?? "").trim() : "";
      const orderNoVal = orderNoCol !== -1 ? String(getVal(row, orderNoCol, "") ?? "").trim() : "";

      const pKey = cleanSkuKey(rawPid);
      const alphaKey = rawPid ? rawPid.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : "";
      const descKey = rawDesc ? rawDesc.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : "";

      if (orderNoVal && orderNoVal.toUpperCase() !== "N/A" && orderNoVal.toUpperCase() !== "BULK") {
        if (pKey) poOrderNoMap[pKey] = orderNoVal;
        if (alphaKey) alphaOrderNoMap[alphaKey] = orderNoVal;
        if (descKey) descOrderNoMap[descKey] = orderNoVal;
      }

      if (uomVal && uomVal.toUpperCase() !== "N/A") {
        if (pKey) poUOMMap[pKey] = uomVal;
        if (alphaKey) alphaUOMMap[alphaKey] = uomVal;
      }
    }
  }

  // 2. Secondary Fallback: Check StockTransferRequest if Order No is missing
  const transferSheet = SS.getSheetByName(SHEET_STOCK_TRANSFER);
  if (transferSheet) {
    const tData = transferSheet.getDataRange().getValues();
    if (tData.length > 1) {
      const tHeaders = tData[0].map(h => h.toString().trim());
      const tProdCol = autoResolveHeaderIndex(tHeaders, ["ProductID", "Product ID", "Unique Code", "SKU"]);
      const tOrderCol = autoResolveHeaderIndex(tHeaders, ["OrderNo", "Order No", "Order Number"]);
      if (tProdCol !== -1 && tOrderCol !== -1) {
        for (let i = 1; i < tData.length; i++) {
          const rawP = String(getVal(tData[i], tProdCol, "") ?? "").trim();
          const ord = String(getVal(tData[i], tOrderCol, "") ?? "").trim();
          const pKey = cleanSkuKey(rawP);
          const alphaKey = rawP ? rawP.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : "";

          if (ord && ord.toUpperCase() !== "N/A") {
            if (pKey && !poOrderNoMap[pKey]) poOrderNoMap[pKey] = ord;
            if (alphaKey && !alphaOrderNoMap[alphaKey]) alphaOrderNoMap[alphaKey] = ord;
          }
        }
      }
    }
  }

  const headers = stockData[0].map(h => h.toString().trim());
  const whColIdx = autoResolveHeaderIndex(headers, ["WarehouseID", "Warehouse ID"]);
  const prodColIdx = autoResolveHeaderIndex(headers, ["ProductID", "Product ID", "Unique Code"]);
  const nameColIdx = autoResolveHeaderIndex(headers, ["ProductName", "Product Name", "Item Description"]);
  const catColIdx = autoResolveHeaderIndex(headers, ["Category"]);
  const binColIdx = autoResolveHeaderIndex(headers, ["BinLocation", "Bin Location", "Bin"]);
  const qtyColIdx = autoResolveHeaderIndex(headers, ["CurrentStock", "Current Stock", "Qty", "Quantity"]);

  const pivotedProducts = {};
  const productBinsMap = {};

  for (let i = 1; i < stockData.length; i++) {
    const row = stockData[i];
    if (whColIdx === -1 || prodColIdx === -1) continue;

    const whId = normalizeWarehouseId(row[whColIdx]);
    const pId = row[prodColIdx] ? row[prodColIdx].toString().trim() : "";
    if (!pId) continue;

    const pKey = cleanSkuKey(pId);
    const alphaKey = pId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const pNameRaw = nameColIdx !== -1 ? getVal(row, nameColIdx, pId) : pId;
    const pName = String(pNameRaw ?? "").trim() || pId;
    const descKey = pName ? pName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : "";

    const category = catColIdx !== -1 ? String(getVal(row, catColIdx, "Raw") ?? "").trim() || "Raw" : "Raw";
    const binLoc = binColIdx !== -1 ? String(getVal(row, binColIdx, "Inward-Staging") ?? "").trim() || "Inward-Staging" : "Inward-Staging";
    const qtyVal = qtyColIdx !== -1 ? Number(row[qtyColIdx]) || 0 : 0;

    if (qtyVal > 0) {
      if (!productBinsMap[pId]) productBinsMap[pId] = {};
      if (!productBinsMap[pId][whId]) productBinsMap[pId][whId] = [];
      productBinsMap[pId][whId].push(`${binLoc} (${qtyVal})`);
    }

    if (!pivotedProducts[pId]) {
      // 🟢 Multi-key fallback search for Order No & UOM
      const foundOrderNo = poOrderNoMap[pKey] || alphaOrderNoMap[alphaKey] || descOrderNoMap[descKey] || "";
      const foundUOM = poUOMMap[pKey] || alphaUOMMap[alphaKey] || "";

      pivotedProducts[pId] = {
        productId: pId,
        productName: pName,
        category: category,
        uom: cleanUom(foundUOM),
        orderNo: foundOrderNo, // Auto-fetched Order No
        stocks: {}
      };
    }
    pivotedProducts[pId].stocks[whId] = (pivotedProducts[pId].stocks[whId] || 0) + qtyVal;
  }

  const reportData = Object.keys(pivotedProducts).map(pId => {
    const p = pivotedProducts[pId];

    let totalStock = 0;
    const whStocks = {};
    warehousesList.forEach(wh => {
      const qty = p.stocks[wh] || 0;
      whStocks[wh] = qty;
      totalStock += qty;
    });

    const binStrings = [];
    if (productBinsMap[pId]) {
      Object.keys(productBinsMap[pId]).forEach(wh => {
        binStrings.push(`${wh}: [${productBinsMap[pId][wh].join(", ")}]`);
      });
    }
    const binLocationString = binStrings.length > 0 ? binStrings.join(" | ") : "Staging / Unassigned";
    const isLowStock = totalStock < LOW_STOCK_THRESHOLD;

    return {
      productId: p.productId,
      productName: p.productName,
      category: p.category,
      uom: p.uom,
      orderNo: p.orderNo, // 🟢 Guaranteed Auto-Fetched Order No
      warehouseStocks: whStocks,
      totalStock: totalStock,
      binLocation: binLocationString,
      isLowStock: isLowStock
    };
  });

  return {
    warehouses: warehousesList,
    reportData: reportData
  };
}

function getTransferHistoryData(user) {
  const transferSheet = SS.getSheetByName(SHEET_STOCK_TRANSFER);
  if (!transferSheet) return [];
  const tData = transferSheet.getDataRange().getValues();
  if (tData.length <= 1) return [];

  const headers = tData[0].map(h => h.toString().trim());
  const reqIdCol = getHeaderIndex(headers, "Request_ID");
  const reqWhCol = getHeaderIndex(headers, "RequestingWarehouse");
  const srcWhCol = getHeaderIndex(headers, "SourceWarehouse");
  const prodCol = getHeaderIndex(headers, "ProductID");
  const qtyCol = getHeaderIndex(headers, "RequestedQty");
  const statusCol = getHeaderIndex(headers, "Status");
  const orderCol = getHeaderIndex(headers, "OrderNo");
  const reqByCol = getHeaderIndex(headers, "RequestedBy");
  const reqByUsernameCol = getHeaderIndex(headers, "RequestedByUsername", ["Requested By Username"]);
  const dispQtyCol = getHeaderIndex(headers, "DispatchedQty");
  const recQtyCol = getHeaderIndex(headers, "ReceivedQty");
  const lastEditCol = getHeaderIndex(headers, "Last Edit Status");

  const stockSheet = SS.getSheetByName(SHEET_STOCK_MASTER);
  const stockRows = stockSheet ? stockSheet.getDataRange().getValues() : [];
  const productMap = {};
  stockRows.forEach((row, idx) => { if (idx > 0 && row[1]) productMap[row[1].toString().trim()] = row[2]; });

  const history = [];
  for (let i = tData.length - 1; i >= 1; i--) {
    const row = tData[i];
    const reqId = getVal(row, reqIdCol);
    if (!reqId) continue;

    const srcWh = normalizeWarehouseId(getVal(row, srcWhCol));
    const reqWh = normalizeWarehouseId(getVal(row, reqWhCol));

    // Warehouse history: show every transfer in which the logged-in warehouse
    // is either the source or the requesting/destination warehouse. Admin sees all.
    if (user && !transferRecordBelongsToWarehouse_(srcWh, reqWh, user)) {
      continue;
    }

    const pId = getVal(row, prodCol);
    const pDetails = getProductDetailsFromPO(pId);

    history.push({
      requestId: reqId,
      orderNo: getVal(row, orderCol, ""),
      productId: pId,
      productName: pDetails.name || productMap[pId] || pId,
      uom: cleanUom(pDetails.uom),
      sourceWarehouse: srcWh,
      requestingWarehouse: reqWh,
      requestedQty: Number(getVal(row, qtyCol, 0)),
      dispatchedQty: Number(getVal(row, dispQtyCol, 0)),
      receivedQty: Number(getVal(row, recQtyCol, 0)),
      status: getVal(row, statusCol, "Pending"),
      requestedBy: getVal(row, reqByCol, "System Requester"),
      lastEditStatus: getVal(row, lastEditCol, "")
    });
  }

  return history;
}

// --- 2. GENERATE SINGLE TRANSFER REQUEST SLIP PDF ---


// ============================================================
// WAREHOUSE DOWNLOADS - STOCK SHEET / RECEIVED MATERIAL
// PDF + XLSX
// ============================================================

function resolveWarehouseDownloadScope_(warehouseId, user) {
  const requested = normalizeWarehouseId(warehouseId || "ALL") || "ALL";
  const role = user && user.role ? user.role.toString().trim().toLowerCase() : "";
  const userWh = user && user.warehouseId ? normalizeWarehouseId(user.warehouseId) : "";
  if ((role === "warehouse" || role === "warehouse manager" || role === "production") && userWh) {
    return userWh;
  }
  return requested;
}

function downloadStockSheet(warehouseId, format, user) {
  // IMPORTANT: Stock Report export must mirror the Centralized Stock Ledger UI,
  // not the raw warehouse-scoped StockMaster rows.
  const stockReport = getStockReport() || { warehouses: [], reportData: [] };
  const warehouses = stockReport.warehouses || [];
  const reportData = stockReport.reportData || [];

  const reportHeaders = ["Product ID", "Product Name", "Category", "UOM", "Locations / Bins"]
    .concat(warehouses.map(w => w + " Stock"))
    .concat(["Total Stock"]);

  const rows = reportData.map(r => {
    const base = [
      r.productId || "",
      r.productName || r.productId || "",
      r.category || "",
      cleanUom(r.uom || ""),
      r.binLocation || "Staging / Unassigned"
    ];
    warehouses.forEach(w => base.push(Number((r.warehouseStocks || {})[w] || 0)));
    base.push(Number(r.totalStock || 0));
    return base;
  });

  // The UI is a centralized ledger, so the export scope is also centralized.
  return buildWarehouseDownloadFile_("Centralized_Stock_Ledger", "ALL", reportHeaders, rows, format);
}

function downloadReceivedMaterial(warehouseId, format, user) {
  const scope = resolveWarehouseDownloadScope_(warehouseId, user);
  const grnSheet = SS.getSheetByName(SHEET_GOODS_RECEIVED);
  if (!grnSheet) throw new Error("GoodsReceivedLog sheet not found.");
  const data = grnSheet.getDataRange().getValues();
  if (data.length === 0) throw new Error("GoodsReceivedLog has no data.");

  const h = data[0].map(x => x.toString().trim());
  const col = {
    receipt: autoResolveHeaderIndex(h, ["Receipt_ID", "Receipt ID"]),
    plan: autoResolveHeaderIndex(h, ["Plan_ID", "Plan ID"]),
    po: autoResolveHeaderIndex(h, ["PO_ID", "PO ID", "PO Number"]),
    wh: autoResolveHeaderIndex(h, ["WarehouseID", "Warehouse ID"]),
    rec: autoResolveHeaderIndex(h, ["ReceivedQty", "Received Qty"]),
    rej: autoResolveHeaderIndex(h, ["RejectedQty", "Rejected Qty"]),
    date: autoResolveHeaderIndex(h, ["Date", "Received Date"]),
    invoice: autoResolveHeaderIndex(h, ["InvoiceNo", "Invoice No"]),
    location: autoResolveHeaderIndex(h, ["StorageLocation", "Storage Location"]),
    user: autoResolveHeaderIndex(h, ["ReceivedBy", "Received By"]),
    userUsername: autoResolveHeaderIndex(h, ["ReceivedByUsername", "Received By Username"]),
    product: autoResolveHeaderIndex(h, ["ProductID", "Product ID"]),
    remarks: autoResolveHeaderIndex(h, ["Remarks"])
  };

  // Plan -> Product lookup
  const planInfo = getSheetDataAndHeaders(SHEET_RECEIVING_PLAN);
  const pHeaders = planInfo.headers;
  const pPlanCol = autoResolveHeaderIndex(pHeaders, ["Plan_ID", "Plan ID"]);
  const pProdCol = autoResolveHeaderIndex(pHeaders, ["ProductID", "Product ID", "Unique Code"]);
  const planProduct = {};
  planInfo.dataRows.forEach(r => {
    const planId = getVal(r, pPlanCol, "").toString().trim();
    if (planId) planProduct[planId] = getVal(r, pProdCol, "").toString().trim();
  });

  // PO + Product -> business details
  const poInfo = getSheetDataAndHeaders(SHEET_PURCHASE_ORDERS);
  const ph = poInfo.headers;
  const pPo = autoResolveHeaderIndex(ph, ["PO Number", "PO_Number", "PO ID"]);
  const pProd = autoResolveHeaderIndex(ph, ["Unique Code", "ProductID", "Product ID", "SKU"]);
  const pDesc = autoResolveHeaderIndex(ph, ["Item Description", "Description", "Product Name"]);
  const pVendor = autoResolveHeaderIndex(ph, ["Vendor Name", "Vendor", "Supplier"]);
  const pVendorCode = autoResolveHeaderIndex(ph, ["VendorCode", "Vendor Code"]);
  const pBuyer = autoResolveHeaderIndex(ph, ["Buyer Code", "Buyer", "Buyer_Code", "BuyerCode"]);
  const pOrder = autoResolveHeaderIndex(ph, ["Order no.", "Order No", "Order Number", "Sales Order No"]);
  const pUom = autoResolveHeaderIndex(ph, ["UOM", "Unit", "U.O.M"]);
  const poLookup = {};
  const poHeaderLookup = {};
  poInfo.dataRows.forEach(r => {
    const po = getVal(r, pPo, "").toString().trim();
    if (!po) return;
    const product = getVal(r, pProd, "").toString().trim();
    const d = {
      productName: getVal(r, pDesc, ""), vendorName: getVal(r, pVendor, ""),
      vendorCode: getVal(r, pVendorCode, ""), buyerCode: getVal(r, pBuyer, ""),
      orderNo: getVal(r, pOrder, ""), uom: cleanUom(getVal(r, pUom, ""))
    };
    const poKey = po.toUpperCase();
    if (!poHeaderLookup[poKey] || (d.orderNo && !poHeaderLookup[poKey].orderNo)) poHeaderLookup[poKey] = d;
    if (product) poLookup[poKey + "___" + product.toUpperCase()] = d;
  });

  const reportHeaders = ["Receipt ID", "Date", "Warehouse", "PO Number", "Order No", "Buyer Code", "Product ID", "Product Name", "UOM", "Vendor Name", "Vendor Code", "Invoice No", "Accepted Qty", "Rejected Qty", "Storage Location", "Received By", "Remarks"];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    const rowWh = normalizeWarehouseId(getVal(r, col.wh, ""));
    if (!rowWh || (scope !== "ALL" && rowWh !== scope)) continue;
    // Scope is warehouse-based. All GRNs from this warehouse are exported,
    // regardless of which operator received them.
    const planId = getVal(r, col.plan, "").toString().trim();
    const poId = getVal(r, col.po, "").toString().trim();
    const savedProductId = col.product >= 0 ? getVal(r, col.product, "").toString().trim() : "";
    const productId = savedProductId || planProduct[planId] || "";
    const details = poLookup[poId.toUpperCase() + "___" + productId.toUpperCase()] || poHeaderLookup[poId.toUpperCase()] || {};
    let dateVal = getVal(r, col.date, "");
    if (dateVal instanceof Date) dateVal = Utilities.formatDate(dateVal, Session.getScriptTimeZone() || "Asia/Kolkata", "dd/MM/yyyy HH:mm:ss");

    rows.push([
      getVal(r, col.receipt, ""), dateVal, rowWh, poId, details.orderNo || "Order No Pending",
      cleanDataMarkerForStorage_(details.buyerCode), productId, details.productName || productId, details.uom || "",
      cleanDataMarkerForStorage_(details.vendorName), details.vendorCode || "", getVal(r, col.invoice, ""),
      Number(getVal(r, col.rec, 0)) || 0, Number(getVal(r, col.rej, 0)) || 0,
      getVal(r, col.location, ""), getVal(r, col.user, ""), getVal(r, col.remarks, "")
    ]);
  }

  return buildWarehouseDownloadFile_("Received_Material", scope, reportHeaders, rows, format);
}


function downloadReceivingPlanExcel(warehouseId, user) {
  const scope = resolveWarehouseDownloadScope_(warehouseId, user);
  const data = getWarehouseData(scope);
  const receipts = data.pendingReceipts || [];
  const headers = ["Plan ID", "PO ID", "Order No", "Product ID", "Item Description", "Vendor", "Expected Date", "Planned Qty", "Received Qty", "Balance Qty", "UOM", "Last Edit Status"];
  const rows = receipts.map(r => [
    r.planId || "", r.poId || "", r.orderNo || "Order No Pending", r.productId || "",
    r.itemDescription || r.productId || "", r.vendorName || "", r.expectedDate || "",
    Number(r.plannedQty || 0), Number(r.totalReceivedQty || 0), Number(r.balanceQty || 0),
    cleanUom(r.uom || ""), r.lastEditStatus || ""
  ]);
  return buildWarehouseDownloadFile_("Receiving_Plan", scope, headers, rows, "xlsx");
}

function downloadApprovedTransfersExcel(warehouseId, user) {
  const scope = resolveWarehouseDownloadScope_(warehouseId, user);
  const data = getWarehouseData(scope);
  const dispatches = data.pendingDispatches || [];
  const headers = ["Request ID", "Order No", "Product ID", "Product Name", "UOM", "Requester", "Requested Qty", "Dispatched Qty", "From Warehouse", "To Warehouse", "Last Edit Status"];
  const rows = dispatches.map(r => [
    r.transferId || "", r.orderNo || "", r.productId || "", r.productName || r.productId || "",
    cleanUom(r.uom || ""), r.requestedBy || "", Number(r.qty || 0), Number(r.dispatchedQty || 0),
    r.fromWarehouse || "", r.toWarehouse || "", r.lastEditStatus || ""
  ]);
  return buildWarehouseDownloadFile_("Approved_Transfers", scope, headers, rows, "xlsx");
}

function downloadTransferHistory(format, user) {
  const history = getTransferHistoryData(user) || [];
  const scope = (user && user.warehouseId) ? normalizeWarehouseId(user.warehouseId) : "ALL";
  const headers = ["Request ID", "Order No", "Product ID", "Product Name", "UOM", "From Warehouse", "To Warehouse", "Requested Qty", "Dispatched Qty", "Received Qty", "Status", "Requested By", "Last Edit Status"];
  const rows = history.map(r => [
    r.requestId || "", r.orderNo || "", r.productId || "", r.productName || r.productId || "",
    cleanUom(r.uom || ""), r.sourceWarehouse || "", r.requestingWarehouse || "",
    Number(r.requestedQty || 0), Number(r.dispatchedQty || 0), Number(r.receivedQty || 0),
    r.status || "", r.requestedBy || "", r.lastEditStatus || ""
  ]);
  return buildWarehouseDownloadFile_("Transfer_History", scope, headers, rows, format);
}

function buildWarehouseDownloadFile_(reportName, scope, headers, rows, format) {
  const fmt = (format || "pdf").toString().toLowerCase();
  const tz = Session.getScriptTimeZone() || "Asia/Kolkata";
  const dateToken = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
  const safeScope = scope || "ALL";
  const baseName = reportName + "_" + safeScope + "_" + dateToken;

  if (fmt === "xlsx" || fmt === "excel") {
    const blob = createXlsxBlob_(baseName, headers, rows);
    return {
      base64: Utilities.base64Encode(blob.getBytes()),
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      fileName: baseName + ".xlsx"
    };
  }

  const htmlEscape = function(value) {
    return (value === null || value === undefined ? "" : value.toString())
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
  };
  const headHtml = headers.map(x => '<th>' + htmlEscape(x) + '</th>').join('');
  const bodyHtml = rows.length ? rows.map(row => '<tr>' + row.map(x => '<td>' + htmlEscape(x) + '</td>').join('') + '</tr>').join('') : '<tr><td colspan="' + headers.length + '">No records found.</td></tr>';
  const html = '<html><head><meta charset="UTF-8"><style>@page{size:landscape;margin:8mm}body{font-family:Arial,sans-serif;color:#1e293b}h1{font-size:18px;margin-bottom:4px}.meta{font-size:10px;color:#64748b;margin-bottom:12px}table{border-collapse:collapse;width:100%;font-size:8px}th{background:#e2e8f0;text-align:left;padding:5px;border:1px solid #cbd5e1}td{padding:4px;border:1px solid #e2e8f0;vertical-align:top}tr:nth-child(even){background:#f8fafc}</style></head><body><h1>' + htmlEscape(reportName.replace(/_/g, ' ')) + '</h1><div class="meta">Warehouse: ' + htmlEscape(safeScope) + ' | Generated: ' + htmlEscape(getFormattedTimestamp()) + ' | Rows: ' + rows.length + '</div><table><thead><tr>' + headHtml + '</tr></thead><tbody>' + bodyHtml + '</tbody></table></body></html>';
  const pdf = Utilities.newBlob(html, "text/html", baseName + ".html").getAs("application/pdf").setName(baseName + ".pdf");
  return { base64: Utilities.base64Encode(pdf.getBytes()), mimeType: "application/pdf", fileName: baseName + ".pdf" };
}

function createXlsxBlob_(baseName, headers, rows) {
  // Build a valid XLSX package locally with Utilities.zip().
  // This intentionally avoids UrlFetchApp so web-app users do not need the
  // script.external_request OAuth scope just to download Excel reports.
  const xmlEscape = function(value) {
    return (value === null || value === undefined ? "" : String(value))
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&apos;");
  };

  const colName = function(n) {
    let name = "";
    while (n > 0) {
      const rem = (n - 1) % 26;
      name = String.fromCharCode(65 + rem) + name;
      n = Math.floor((n - 1) / 26);
    }
    return name;
  };

  const allRows = [headers].concat(rows || []);
  const sheetRows = allRows.map(function(row, rIdx) {
    const cells = (row || []).map(function(value, cIdx) {
      const ref = colName(cIdx + 1) + (rIdx + 1);
      const style = rIdx === 0 ? ' s="1"' : '';
      // Use inline strings for maximum compatibility and to preserve IDs,
      // leading zeroes, dates and mixed business values exactly as displayed.
      return '<c r="' + ref + '" t="inlineStr"' + style + '><is><t xml:space="preserve">' +
        xmlEscape(value) + '</t></is></c>';
    }).join('');
    return '<row r="' + (rIdx + 1) + '">' + cells + '</row>';
  }).join('');

  const lastCol = colName(Math.max(1, headers.length));
  const lastRow = Math.max(1, allRows.length);
  const dimension = 'A1:' + lastCol + lastRow;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Report" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;

  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="${dimension}"/>
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  <sheetData>${sheetRows}</sheetData>
  <autoFilter ref="A1:${lastCol}${lastRow}"/>
</worksheet>`;

  const nowIso = new Date().toISOString();
  const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>Nexus Stock</dc:creator><cp:lastModifiedBy>Nexus Stock</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${nowIso}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${nowIso}</dcterms:modified>
</cp:coreProperties>`;

  const app = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Nexus Stock</Application></Properties>`;

  const parts = [
    Utilities.newBlob(contentTypes, 'application/xml', '[Content_Types].xml'),
    Utilities.newBlob(rootRels, 'application/xml', '_rels/.rels'),
    Utilities.newBlob(workbook, 'application/xml', 'xl/workbook.xml'),
    Utilities.newBlob(workbookRels, 'application/xml', 'xl/_rels/workbook.xml.rels'),
    Utilities.newBlob(styles, 'application/xml', 'xl/styles.xml'),
    Utilities.newBlob(sheet, 'application/xml', 'xl/worksheets/sheet1.xml'),
    Utilities.newBlob(core, 'application/xml', 'docProps/core.xml'),
    Utilities.newBlob(app, 'application/xml', 'docProps/app.xml')
  ];

  return Utilities.zip(parts, baseName + '.xlsx')
    .setContentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    .setName(baseName + '.xlsx');
}

