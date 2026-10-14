// ============================================================
// WAREHOUSE DEPARTMENT
// Extracted from original Code.gs without changing function names.
// ============================================================

function getWarehouseData(warehouseId, user, includeCompletedReceipts) {
  let tasks = { pendingReceipts: [], pendingDispatches: [], binStock: [], completedReceipts: [] };

  // SECURITY / HISTORY SCOPE: if the login has a warehouse assigned, the server
  // always uses that warehouse regardless of what the browser sends. Admin keeps ALL.
  const userHistoryScope = getHistoryWarehouseScope_(user);
  const requestedWarehouse = (!warehouseId || warehouseId.toString().trim().toUpperCase() === "ALL")
    ? "ALL"
    : normalizeWarehouseId(warehouseId);
  const effectiveWarehouseId = userHistoryScope !== "ALL" ? userHistoryScope : requestedWarehouse;
  const isAll = !effectiveWarehouseId || effectiveWarehouseId === "ALL";
  warehouseId = isAll ? "ALL" : effectiveWarehouseId;

  const stockSheet = SS.getSheetByName(SHEET_STOCK_MASTER);
  const stockRows = stockSheet ? stockSheet.getDataRange().getValues() : [];
  const stockHeaders = stockRows.length ? stockRows[0].map(h => h.toString().trim()) : [];
  const stockProductCol = getHeaderIndex(stockHeaders, "ProductID", ["Product ID", "Unique Code", "SKU"]);
  const stockNameCol = getHeaderIndex(stockHeaders, "ProductName", ["Product Name", "Item Description"]);
  const stockWarehouseCol = getHeaderIndex(stockHeaders, "WarehouseID", ["Warehouse ID", "Warehouse"]);
  const stockQtyCol = getHeaderIndex(stockHeaders, "CurrentStock", ["Qty", "Quantity", "Current Stock"]);
  const stockBinCol = getHeaderIndex(stockHeaders, "BinLocation", ["Bin Location", "Bin", "Rack Location"]);

  const productMap = {};
  stockRows.forEach((row, index) => {
    if (index > 0 && stockProductCol !== -1 && getVal(row, stockProductCol, "")) {
      const pId = getVal(row, stockProductCol, "").toString().trim();
      productMap[pId] = stockNameCol !== -1 ? getVal(row, stockNameCol, pId) : pId;
    }
  });

  const poInfo = getSheetDataAndHeaders(SHEET_PURCHASE_ORDERS);
  const poHeaders = poInfo.headers;
  const poRows = poInfo.dataRows;
  if (poHeaders.length === 0) return tasks;

  const poNumCol = autoResolveHeaderIndex(poHeaders, ["PO Number", "PO_Number", "PO ID"]),
    prodIdCol = autoResolveHeaderIndex(poHeaders, ["Unique Code", "ProductID", "SKU"]),
    descCol = autoResolveHeaderIndex(poHeaders, ["Item Description", "Description"]),
    vendorCol = autoResolveHeaderIndex(poHeaders, ["Vendor Name", "Vendor"]),
    vendorCodeCol = autoResolveHeaderIndex(poHeaders, ["VendorCode", "Vendor Code"]),
    uomCol = autoResolveHeaderIndex(poHeaders, ["UOM", "Unit"]),
    salesPersonCol = autoResolveHeaderIndex(poHeaders, ["Sales Person Name"]),
    buyerCodeCol = autoResolveHeaderIndex(poHeaders, ["Buyer Code"]),
    orderNoCol = autoResolveHeaderIndex(poHeaders, ["Order no.", "Order No"]),
    dateCol = autoResolveHeaderIndex(poHeaders, ["Material Received Expected Date", "ETA"]),
    purchasePersonCol = autoResolveHeaderIndex(poHeaders, ["Purchase Person Name"]);

  const poItemLookup = {};
  const poHeaderLookup = {};
  const poProductLookup = {};

  for (let i = 0; i < poRows.length; i++) {
    const row = poRows[i];
    if (!row[poNumCol]) continue;

    const poId = getVal(row, poNumCol, "").toString().trim();
    const sku = getVal(row, prodIdCol, "").toString().trim();

    const details = {
      sku: sku,
      itemDescription: getVal(row, descCol, ""),
      vendorName: getVal(row, vendorCol, ""),
      vendorCode: getVal(row, vendorCodeCol, ""),
      uom: cleanUom(getVal(row, uomCol, "")),
      salesPerson: getVal(row, salesPersonCol, ""),
      buyerCode: getVal(row, buyerCodeCol, ""),
      orderNo: getVal(row, orderNoCol, ""),
      expectedDate: getVal(row, dateCol) ? new Date(getVal(row, dateCol)).toLocaleDateString() : '',
      purchasePersonName: getVal(row, purchasePersonCol, "")
    };

    if (poId) {
      const cleanPo = poId.toUpperCase();
      if (!poHeaderLookup[cleanPo] || (details.orderNo && !poHeaderLookup[cleanPo].orderNo)) {
        poHeaderLookup[cleanPo] = details;
      }
      if (sku) {
        poItemLookup[cleanPo + "___" + sku.toUpperCase()] = details;
        if (!poProductLookup[sku.toUpperCase()]) poProductLookup[sku.toUpperCase()] = details;
      }
    }
  }

  const planInfo = getSheetDataAndHeaders(SHEET_RECEIVING_PLAN);
  const planHeaders = planInfo.headers;
  const planRows = planInfo.dataRows;
  if (planHeaders.length === 0) return tasks;

  const planIdCol = autoResolveHeaderIndex(planHeaders, ["Plan_ID"]),
    poIdCol = autoResolveHeaderIndex(planHeaders, ["PO_ID"]),
    productIdCol = autoResolveHeaderIndex(planHeaders, ["ProductID"]),
    whCol = autoResolveHeaderIndex(planHeaders, ["WarehouseID"]),
    plannedQtyCol = autoResolveHeaderIndex(planHeaders, ["PlannedQty"]),
    statusCol = autoResolveHeaderIndex(planHeaders, ["Status"]),
    plannedByCol = autoResolveHeaderIndex(planHeaders, ["PlannedBy"]),
    receivedQtyCol = autoResolveHeaderIndex(planHeaders, ["TotalReceivedQty"]),
    planLastEditCol = autoResolveHeaderIndex(planHeaders, ["Last Edit Status"]);

  const planMap = {};
  for (let k = 0; k < planRows.length; k++) {
    const row = planRows[k];
    if (!row[planIdCol]) continue;

    const planPOId = getVal(row, poIdCol, "").toString().trim();
    const planProdId = getVal(row, productIdCol, "").toString().trim();
    const plannedQty = Number(getVal(row, plannedQtyCol, 0));
    const totalReceivedQty = Number(getVal(row, receivedQtyCol, 0));
    const balanceQty = plannedQty - totalReceivedQty;

    const planWarehouseId = normalizeWarehouseId(getVal(row, whCol));
    const targetWarehouseId = isAll ? "" : normalizeWarehouseId(warehouseId);
    const planStatus = (getVal(row, statusCol) || "").toString().trim().toLowerCase();

    planMap[getVal(row, planIdCol)] = planProdId;

    if ((isAll || planWarehouseId === targetWarehouseId) && planStatus === 'pending' && balanceQty > 0) {
      const lookupKey = planPOId.toUpperCase() + "___" + planProdId.toUpperCase();

      const extraData = poItemLookup[lookupKey] || poHeaderLookup[planPOId.toUpperCase()] || {
        itemDescription: "", vendorName: "", vendorCode: "",
        uom: "", salesPerson: "", buyerCode: "", orderNo: "",
        expectedDate: "", purchasePersonName: ""
      };

      tasks.pendingReceipts.push({
        planId: getVal(row, planIdCol),
        poId: planPOId,
        productId: planProdId,
        warehouseId: planWarehouseId,
        plannedQty,
        totalReceivedQty,
        balanceQty,
        itemDescription: extraData.itemDescription,
        vendorName: extraData.vendorName,
        vendorCode: extraData.vendorCode,
        uom: extraData.uom,
        salesPerson: extraData.salesPerson,
        buyerCode: extraData.buyerCode,
        orderNo: extraData.orderNo,
        expectedDate: extraData.expectedDate,
        purchasePersonName: extraData.purchasePersonName,
        plannedBy: getVal(row, plannedByCol, "Planner"),
        lastEditStatus: getVal(row, planLastEditCol, "")
      });
    }
  }

  // Pending Dispatches
  const transferSheet = SS.getSheetByName(SHEET_STOCK_TRANSFER);
  if (transferSheet) {
    const transferData = transferSheet.getDataRange().getValues();
    if (transferData.length > 1) {
      const headers = transferData[0].map(h => h.toString().trim());
      const reqIdCol = getHeaderIndex(headers, "Request_ID");
      const reqWhCol = getHeaderIndex(headers, "RequestingWarehouse");
      const srcWhCol = getHeaderIndex(headers, "SourceWarehouse");
      const prodCol = getHeaderIndex(headers, "ProductID");
      const qtyCol = getHeaderIndex(headers, "RequestedQty");
      const statusCol = getHeaderIndex(headers, "Status");
      const orderCol = getHeaderIndex(headers, "OrderNo");
      const reqByCol = getHeaderIndex(headers, "RequestedBy");
      const dispQtyCol = getHeaderIndex(headers, "DispatchedQty");
      const requestTypeCol = getHeaderIndex(headers, "RequestType");
      const requestGroupCol = getHeaderIndex(headers, "RequestGroupID");
      const productionIdCol = getHeaderIndex(headers, "Production_ID");
      const finalProductIdCol = getHeaderIndex(headers, "FinalProductID");
      const finalProductNameCol = getHeaderIndex(headers, "FinalProductName");
      const requestRemarksCol = getHeaderIndex(headers, "RequestRemarks");
      const transferLastEditCol = getHeaderIndex(headers, "Last Edit Status");

      for (let i = 1; i < transferData.length; i++) {
        const row = transferData[i];
        if (!getVal(row, reqIdCol)) continue;
        const sourceWh = normalizeWarehouseId(getVal(row, srcWhCol));
        const targetWarehouseId = isAll ? "" : normalizeWarehouseId(warehouseId);
        const status = getVal(row, statusCol);

        if ((isAll || sourceWh === targetWarehouseId) && status === 'Approved') {
          const pId = getVal(row, prodCol);
          const pDetails = poProductLookup[String(pId || "").trim().toUpperCase()] || {};

          tasks.pendingDispatches.push({
            transferId: getVal(row, reqIdCol),
            productId: pId,
            productName: pDetails.itemDescription || pDetails.name || productMap[pId] || pId,
            uom: cleanUom(pDetails.uom || ""),
            qty: Number(getVal(row, qtyCol, 0)),
            dispatchedQty: Number(getVal(row, dispQtyCol, getVal(row, qtyCol, 0))),
            fromWarehouse: sourceWh,
            toWarehouse: normalizeWarehouseId(getVal(row, reqWhCol)),
            orderNo: getVal(row, orderCol, ""),
            requestedBy: getVal(row, reqByCol, "Requester"),
            requestType: getVal(row, requestTypeCol, ""),
            requestGroupId: getVal(row, requestGroupCol, ""),
            productionId: getVal(row, productionIdCol, ""),
            finalProductId: getVal(row, finalProductIdCol, ""),
            finalProductName: getVal(row, finalProductNameCol, ""),
            requestRemarks: getVal(row, requestRemarksCol, ""),
            lastEditStatus: getVal(row, transferLastEditCol, "")
          });
        }
      }
    }
  }

  // Bin Stock — resolve by header names so sheet column order can change safely.
  if (stockRows.length > 1 && stockProductCol !== -1 && stockWarehouseCol !== -1 && stockQtyCol !== -1) {
    for (let i = 1; i < stockRows.length; i++) {
      const row = stockRows[i];
      const productId = getVal(row, stockProductCol, "").toString().trim();
      if (!productId) continue;

      const itemWh = normalizeWarehouseId(getVal(row, stockWarehouseCol, ""));
      const targetWarehouseId = isAll ? "" : normalizeWarehouseId(warehouseId);
      const qty = Number(getVal(row, stockQtyCol, 0)) || 0;

      if ((isAll || itemWh === targetWarehouseId) && qty > 0) {
        const productName = stockNameCol !== -1 ? getVal(row, stockNameCol, productId) : productId;
        const binLocation = stockBinCol !== -1 ? getVal(row, stockBinCol, "Inward-Staging") : "Inward-Staging";
        tasks.binStock.push({
          productId: productId,
          productName: productName || productId,
          binLocation: binLocation || "Inward-Staging",
          qty: qty,
          warehouseId: itemWh
        });
      }
    }
  }

  // Completed GRN Receipts
  if (includeCompletedReceipts !== false) {
    const grnSheet = SS.getSheetByName(SHEET_GOODS_RECEIVED);
    if (grnSheet) {
      const grnRows = grnSheet.getDataRange().getValues();
      if (grnRows.length > 1) {
        const grnHeaders = grnRows[0].map(h => h.toString().trim());
        const rIDColIdx = getHeaderIndex(grnHeaders, "Receipt_ID"),
          planIdColIdx = getHeaderIndex(grnHeaders, "Plan_ID"),
          poIdColIdx = getHeaderIndex(grnHeaders, "PO_ID"),
          grnProductIdColIdx = getHeaderIndex(grnHeaders, "ProductID"),
          grnProductNameColIdx = getHeaderIndex(grnHeaders, "ProductName"),
          whColIdx = getHeaderIndex(grnHeaders, "WarehouseID"),
          recQtyColIdx = getHeaderIndex(grnHeaders, "ReceivedQty"),
          rejQtyColIdx = getHeaderIndex(grnHeaders, "RejectedQty"),
          dateColIdx = getHeaderIndex(grnHeaders, "Date"),
          invColIdx = getHeaderIndex(grnHeaders, "InvoiceNo"),
          gstColIdx = getHeaderIndex(grnHeaders, "GSTInvoiceNo"),
          biltyColIdx = getHeaderIndex(grnHeaders, "BiltyNo"),
          truckColIdx = getHeaderIndex(grnHeaders, "TruckNo"),
          drNameColIdx = getHeaderIndex(grnHeaders, "DriverName"),
          drNoColIdx = getHeaderIndex(grnHeaders, "DriverNo"),
          remColIdx = getHeaderIndex(grnHeaders, "Remarks"),
          userColIdx = getHeaderIndex(grnHeaders, "ReceivedBy"),
          userUsernameColIdx = getHeaderIndex(grnHeaders, "ReceivedByUsername", ["Received By Username"]),
          locColIdx = getHeaderIndex(grnHeaders, "StorageLocation"),
          purchaserNameColIdx = getHeaderIndex(grnHeaders, "PurchaserName"),
          plannerNameColIdx = getHeaderIndex(grnHeaders, "PlannerName"),
          grnLastEditColIdx = getHeaderIndex(grnHeaders, "Last Edit Status");

        const planInfo = getSheetDataAndHeaders(SHEET_RECEIVING_PLAN);
        const planHeaders = planInfo.headers;
        const planRows = planInfo.dataRows;
        const pPlanIdCol = autoResolveHeaderIndex(planHeaders, ["Plan_ID"]);
        const pPlannedQtyCol = autoResolveHeaderIndex(planHeaders, ["PlannedQty"]);
        const planQtyMap = {};

        for (let p = 0; p < planRows.length; p++) {
          const pId = getVal(planRows[p], pPlanIdCol).toString().trim();
          if (pId) {
            planQtyMap[pId] = Number(getVal(planRows[p], pPlannedQtyCol, 0));
          }
        }

        // Load the complete GRN history. User filtering happens before rows are returned,
        // so an operator sees every GRN created by that login, not only the latest 50.
        for (let i = grnRows.length - 1; i >= 1; i--) {
          const rWh = normalizeWarehouseId(getVal(grnRows[i], whColIdx));
          const targetWarehouseId = isAll ? "" : normalizeWarehouseId(warehouseId);

          // History is warehouse-scoped, not creator-scoped. ReceivedBy / Username
          // remain available for audit display but do not hide another operator's GRN
          // from users of the same warehouse.
          if (isAll || rWh === targetWarehouseId) {
            const planId = getVal(grnRows[i], planIdColIdx).toString().trim();
            const recQty = Number(getVal(grnRows[i], recQtyColIdx, 0));
            const rejQty = Number(getVal(grnRows[i], rejQtyColIdx, 0));

            let actualPlanned = planQtyMap[planId];
            if (!actualPlanned || actualPlanned <= 0) {
              actualPlanned = recQty + rejQty;
            }

            const rawDate = getVal(grnRows[i], dateColIdx);
            let formattedDate = rawDate;
            if (rawDate instanceof Date) {
              formattedDate = Utilities.formatDate(rawDate, Session.getScriptTimeZone() || "Asia/Kolkata", "dd/MM/yyyy HH:mm:ss");
            }

            const completedPoId = getVal(grnRows[i], poIdColIdx, "").toString().trim();
            const savedProductId = grnProductIdColIdx >= 0 ? getVal(grnRows[i], grnProductIdColIdx, "").toString().trim() : "";
            const savedProductName = grnProductNameColIdx >= 0 ? getVal(grnRows[i], grnProductNameColIdx, "").toString().trim() : "";
            const completedProductId = savedProductId || (planMap[planId] || "").toString().trim();
            const completedLookupKey = completedPoId.toUpperCase() + "___" + completedProductId.toUpperCase();
            const completedExtra = poItemLookup[completedLookupKey] || poHeaderLookup[completedPoId.toUpperCase()] || {};

            tasks.completedReceipts.push({
              receiptId: getVal(grnRows[i], rIDColIdx),
              planId: planId,
              poId: completedPoId,
              productId: completedProductId,
              productName: savedProductName || completedExtra.itemDescription || productMap[completedProductId] || completedProductId,
              itemDescription: savedProductName || completedExtra.itemDescription || productMap[completedProductId] || completedProductId,
              vendorName: completedExtra.vendorName || "",
              vendorCode: completedExtra.vendorCode || "",
              buyerCode: completedExtra.buyerCode || "",
              orderNo: completedExtra.orderNo || "",
              uom: cleanUom(completedExtra.uom || ""),
              plannedQty: actualPlanned,
              warehouseId: rWh,
              receivedQty: recQty,
              rejectedQty: rejQty,
              invoiceNo: getVal(grnRows[i], invColIdx),
              gstInvoice: getVal(grnRows[i], gstColIdx),
              biltyNo: getVal(grnRows[i], biltyColIdx),
              truckNo: getVal(grnRows[i], truckColIdx),
              driverName: getVal(grnRows[i], drNameColIdx),
              driverNo: getVal(grnRows[i], drNoColIdx),
              remarks: getVal(grnRows[i], remColIdx),
              receivedBy: getVal(grnRows[i], userColIdx, "Warehouse Operator"), // 🟢 Last Editor
              storageLocation: getVal(grnRows[i], locColIdx),
              date: formattedDate, // 🟢 Timestamp
              purchaserName: getVal(grnRows[i], purchaserNameColIdx, ""),
              plannerName: getVal(grnRows[i], plannerNameColIdx, ""),
              lastEditStatus: getVal(grnRows[i], grnLastEditColIdx, "")
            });
          }
        }
      }
    }

  }

  return tasks;
}

// --- GET ONE COMPLETE GRN RECEIPT FOR REPRINT / PDF ---
function getReceivingHistoryDataFast(user) {
  const scope = getHistoryWarehouseScope_(user);
  const grnSheet = SS.getSheetByName(SHEET_GOODS_RECEIVED);
  if (!grnSheet || grnSheet.getLastRow() <= 1) return { completedReceipts: [] };

  const grnRows = grnSheet.getDataRange().getValues();
  const h = grnRows[0].map(function(x) { return String(x || "").trim(); });
  const c = {
    receipt: getHeaderIndex(h, "Receipt_ID"), plan: getHeaderIndex(h, "Plan_ID"), po: getHeaderIndex(h, "PO_ID"),
    product: getHeaderIndex(h, "ProductID", ["Product ID"]), productName: getHeaderIndex(h, "ProductName", ["Product Name"]),
    wh: getHeaderIndex(h, "WarehouseID", ["Warehouse ID"]), rec: getHeaderIndex(h, "ReceivedQty"), rej: getHeaderIndex(h, "RejectedQty"),
    inv: getHeaderIndex(h, "InvoiceNo"), gst: getHeaderIndex(h, "GSTInvoiceNo"), bilty: getHeaderIndex(h, "BiltyNo"),
    truck: getHeaderIndex(h, "TruckNo"), driver: getHeaderIndex(h, "DriverName"), driverNo: getHeaderIndex(h, "DriverNo"),
    remarks: getHeaderIndex(h, "Remarks"), by: getHeaderIndex(h, "ReceivedBy"), loc: getHeaderIndex(h, "StorageLocation"),
    date: getHeaderIndex(h, "Date"), purchaser: getHeaderIndex(h, "PurchaserName"), planner: getHeaderIndex(h, "PlannerName"),
    audit: getHeaderIndex(h, "Last Edit Status"), plannedAtGrn: getHeaderIndex(h, "PlannedQtyAtGRN")
  };

  // Exact PO + Product lookup built from the request-scoped PurchaseOrders snapshot.
  // This preserves the original PO/vendor/order mapping without rereading the sheet per GRN row.
  const poInfo = getSheetDataAndHeaders(SHEET_PURCHASE_ORDERS);
  const ph = poInfo.headers || [];
  const pr = poInfo.dataRows || [];
  const pPo = autoResolveHeaderIndex(ph, ["PO Number", "PO_Number", "PO ID"]);
  const pProd = autoResolveHeaderIndex(ph, ["Unique Code", "ProductID", "Product ID", "SKU"]);
  const pDesc = autoResolveHeaderIndex(ph, ["Item Description", "Description", "Product Name"]);
  const pVendor = autoResolveHeaderIndex(ph, ["Vendor Name", "Vendor", "Supplier"]);
  const pVendorCode = autoResolveHeaderIndex(ph, ["VendorCode", "Vendor Code"]);
  const pBuyer = autoResolveHeaderIndex(ph, ["Buyer Code", "Buyer", "BuyerCode", "Buyer_Code"]);
  const pOrder = autoResolveHeaderIndex(ph, ["Order no.", "Order No", "Order Number", "Sales Order No"]);
  const pUom = autoResolveHeaderIndex(ph, ["UOM", "Unit", "U.O.M"]);
  const poComposite = {};
  const poProductFallback = {};
  for (let p = 0; p < pr.length; p++) {
    const po = String(getVal(pr[p], pPo, "") || "").trim();
    const prod = String(getVal(pr[p], pProd, "") || "").trim();
    if (!prod) continue;
    const d = {
      name: String(getVal(pr[p], pDesc, prod) || prod).trim(),
      vendorName: String(getVal(pr[p], pVendor, "") || "").trim(),
      vendorCode: String(getVal(pr[p], pVendorCode, "") || "").trim(),
      buyerCode: String(getVal(pr[p], pBuyer, "") || "").trim(),
      orderNo: String(getVal(pr[p], pOrder, "") || "").trim(),
      uom: cleanUom(getVal(pr[p], pUom, ""))
    };
    const prodKey = prod.toUpperCase();
    if (!poProductFallback[prodKey]) poProductFallback[prodKey] = d;
    if (po) poComposite[po.toUpperCase() + "___" + prodKey] = d;
  }
  const rows = [];
  const tz = Session.getScriptTimeZone() || "Asia/Kolkata";
  for (let i = grnRows.length - 1; i >= 1; i--) {
    const r = grnRows[i];
    const wh = normalizeWarehouseId(getVal(r, c.wh, ""));
    if (scope !== "ALL" && wh !== scope) continue;
    const productId = String(getVal(r, c.product, "") || "").trim();
    const poId = String(getVal(r, c.po, "") || "").trim();
    const productKey = productId.toUpperCase();
    const pd = productId ? (poComposite[poId.toUpperCase() + "___" + productKey] || poProductFallback[productKey] || {}) : {};
    let rawDate = getVal(r, c.date, "");
    if (rawDate instanceof Date) rawDate = Utilities.formatDate(rawDate, tz, "dd/MM/yyyy HH:mm:ss");
    const rec = Number(getVal(r, c.rec, 0));
    const rej = Number(getVal(r, c.rej, 0));
    const planned = Number(getVal(r, c.plannedAtGrn, 0)) || (rec + rej);
    const savedName = String(getVal(r, c.productName, "") || "").trim();
    rows.push({
      receiptId: getVal(r, c.receipt, ""), planId: getVal(r, c.plan, ""), poId: poId,
      productId: productId, productName: savedName || pd.name || productId, itemDescription: savedName || pd.name || productId,
      vendorName: pd.vendorName || "", vendorCode: pd.vendorCode || "", buyerCode: pd.buyerCode || "", orderNo: pd.orderNo || "", uom: cleanUom(pd.uom || ""),
      plannedQty: planned, warehouseId: wh, receivedQty: rec, rejectedQty: rej, invoiceNo: getVal(r, c.inv, ""),
      gstInvoice: getVal(r, c.gst, ""), biltyNo: getVal(r, c.bilty, ""), truckNo: getVal(r, c.truck, ""),
      driverName: getVal(r, c.driver, ""), driverNo: getVal(r, c.driverNo, ""), remarks: getVal(r, c.remarks, ""),
      receivedBy: getVal(r, c.by, ""), storageLocation: getVal(r, c.loc, ""), date: rawDate,
      purchaserName: getVal(r, c.purchaser, ""), plannerName: getVal(r, c.planner, ""), lastEditStatus: getVal(r, c.audit, "")
    });
  }
  return { completedReceipts: rows };
}


function getGrnReceiptDetails(receiptId, user) {
  if (!receiptId) throw new Error("Receipt ID is required.");
  const data = getWarehouseData("ALL", user);
  const rows = (data && data.completedReceipts) ? data.completedReceipts : [];
  const wanted = receiptId.toString().trim();
  const found = rows.find(r => (r.receiptId || "").toString().trim() === wanted);
  if (!found) throw new Error("GRN receipt not found: " + wanted);
  return found;
}

// --- ROLE: PRODUCTION DATA (GUARANTEED DUAL-LINK FOR RECEIVED STOCK) ---

function moveStockLocation(formData, user) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    const { productId, currentBin, newBin, qtyToMove } = formData;
    const moveQty = Number(qtyToMove);
    if (moveQty <= 0) throw new Error("Quantity must be greater than 0.");
    if (currentBin === newBin) throw new Error("Source and Destination bins cannot be the same.");

    const normalizedWh = normalizeWarehouseId(user.warehouseId);

    updateStockAndBinQuantityInternal(normalizedWh, productId, currentBin, -moveQty, user);
    updateStockAndBinQuantityInternal(normalizedWh, productId, newBin, moveQty, user);

    // Persist a complete audit trail for every bin/location movement.
    let locationLogSheet = SS.getSheetByName('StockLocationTransferLog');
    const requiredHeaders = [
      'Transfer_ID', 'Date', 'WarehouseID', 'ProductID', 'SourceLocation',
      'DestinationLocation', 'TransferredQty', 'TransferredBy', 'Last Edit Status'
    ];
    if (!locationLogSheet) {
      locationLogSheet = SS.insertSheet('StockLocationTransferLog');
      locationLogSheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
    } else if (locationLogSheet.getLastColumn() === 0) {
      locationLogSheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
    } else {
      const existingHeaders = locationLogSheet.getRange(1, 1, 1, locationLogSheet.getLastColumn()).getValues()[0].map(String);
      requiredHeaders.forEach(function(header) {
        if (existingHeaders.indexOf(header) === -1) {
          locationLogSheet.getRange(1, locationLogSheet.getLastColumn() + 1).setValue(header);
          existingHeaders.push(header);
        }
      });
    }

    const transferId = 'LOC-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss') + '-' + Math.floor(100 + Math.random() * 900);
    const auditStamp = getAuditStamp(user);
    const transferredBy = cleanDisplayVal(user && (user.name || user.fullName || user.username || user.email), '');
    appendRowByHeaders(locationLogSheet, {
      'Transfer_ID': transferId,
      'Date': new Date(),
      'WarehouseID': normalizedWh,
      'ProductID': productId,
      'SourceLocation': currentBin,
      'DestinationLocation': newBin,
      'TransferredQty': moveQty,
      'TransferredBy': transferredBy,
      'Last Edit Status': auditStamp
    }, user);

    SpreadsheetApp.flush();
    return {
      status: 'success',
      transferId: transferId,
      message: `Moved ${moveQty} items from ${currentBin} to ${newBin}. Transfer logged successfully.`
    };
  } catch (e) {
    throw new Error("Unable to shift location stock safely: " + e.message);
  } finally {
    lock.releaseLock();
  }
}


// --- DIRECT STOCK REPORT: CREATE WAREHOUSE-TO-WAREHOUSE TRANSFER REQUEST ---
function createWarehouseStockTransferRequest(formData, user) {
  verifyUserRole(user, ["Warehouse", "Warehouse Manager", "WarehouseManager", "Planner", "Administrator"]);
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    const productId = (formData && formData.productId ? formData.productId : "").toString().trim();
    let sourceWh = normalizeWarehouseId(formData && formData.sourceWarehouse);
    const destinationWh = normalizeWarehouseId(formData && formData.destinationWarehouse);
    const qty = Number(formData && formData.qty);

    if (!productId) throw new Error("Product ID is required.");
    if (!sourceWh) throw new Error("Source warehouse is required.");
    if (!destinationWh) throw new Error("Destination warehouse is required.");
    if (sourceWh === destinationWh) throw new Error("Source and destination warehouses must be different.");
    if (!Number.isFinite(qty) || qty <= 0) throw new Error("Transfer quantity must be greater than zero.");

    // Warehouse users can only initiate stock from their own warehouse.
    const role = (user && user.role ? user.role : "").toString().trim().toLowerCase();
    if (role.indexOf("warehouse") !== -1) {
      const ownWh = normalizeWarehouseId(user && user.warehouseId);
      if (!ownWh) throw new Error("Your warehouse is not configured.");
      sourceWh = ownWh;
    }
    if (sourceWh === destinationWh) throw new Error("Source and destination warehouses must be different.");

    // Validate destination warehouse exists.
    const whSheet = SS.getSheetByName(SHEET_WAREHOUSES);
    if (whSheet && whSheet.getLastRow() > 1) {
      const known = whSheet.getRange(2, 1, whSheet.getLastRow() - 1, 1).getValues().flat().map(normalizeWarehouseId);
      if (known.indexOf(destinationWh) === -1) throw new Error("Destination warehouse does not exist: " + destinationWh);
    }

    // Validate live source stock from StockMaster (sum across all bins).
    const stockSheet = SS.getSheetByName(SHEET_STOCK_MASTER);
    if (!stockSheet) throw new Error("StockMaster sheet not found.");
    const stockData = stockSheet.getDataRange().getValues();
    if (stockData.length < 2) throw new Error("No stock data available.");
    const headers = stockData[0].map(h => h.toString().trim());
    const whCol = autoResolveHeaderIndex(headers, ["WarehouseID", "Warehouse ID"]);
    const prodCol = autoResolveHeaderIndex(headers, ["ProductID", "Product ID", "Unique Code"]);
    const qtyCol = autoResolveHeaderIndex(headers, ["CurrentStock", "Current Stock", "Qty", "Quantity"]);
    if (whCol === -1 || prodCol === -1 || qtyCol === -1) throw new Error("StockMaster columns are not configured correctly.");

    let available = 0;
    for (let i = 1; i < stockData.length; i++) {
      if (normalizeWarehouseId(stockData[i][whCol]) === sourceWh &&
          (stockData[i][prodCol] || "").toString().trim() === productId) {
        available += Number(stockData[i][qtyCol]) || 0;
      }
    }
    if (available < qty) {
      throw new Error("Insufficient stock in " + sourceWh + ". Available: " + available + ", requested: " + qty + ".");
    }

    const transferSheet = SS.getSheetByName(SHEET_STOCK_TRANSFER);
    if (!transferSheet) throw new Error("StockTransferRequest sheet not found.");

    const reqId = "REQ-" + Math.floor(10000 + Math.random() * 90000);
    const requestedBy = cleanDisplayVal(user && (user.name || user.displayName || user.username || user.email), "");
    appendRowByHeaders(transferSheet, {
      "Request_ID": reqId,
      "RequestingWarehouse": destinationWh,
      "SourceWarehouse": sourceWh,
      "ProductID": productId,
      "RequestedQty": qty,
      "Status": "Pending Approval",
      "OrderNo": "",
      "RequestedBy": requestedBy,
      "RequestedByUsername": String(user && user.username || "").trim(),
      "DispatchedQty": 0,
      "ReceivedQty": 0,
      "Last Edit Status": getAuditStamp(user)
    }, user);

    SpreadsheetApp.flush();
    return {
      status: "success",
      requestId: reqId,
      message: "Warehouse transfer request " + reqId + " created: " + qty + " units, " + sourceWh + " → " + destinationWh + ". Sent for Planner approval."
    };
  } catch (e) {
    throw new Error("Warehouse transfer request failed: " + e.message);
  } finally {
    lock.releaseLock();
  }
}

// --- REQUEST MATERIAL (UPDATED: SAME-WH AUTO-APPROVED, CROSS-WH PENDING PLANNER APPROVAL) ---

function requestMaterial(formData, user) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const transferSheet = SS.getSheetByName(SHEET_STOCK_TRANSFER);
    if (!transferSheet) throw new Error("StockTransferRequest sheet not found.");
    if (!formData.items || !Array.isArray(formData.items) || formData.items.length === 0) throw new Error("No items provided in the request.");
    if (!formData.orderNo) throw new Error("Order No is required.");
    if (!formData.sourceWarehouse) throw new Error("Source Warehouse is required.");
    if (!formData.requestedBy) throw new Error("Requester Name is required.");

    const requestingWh = normalizeWarehouseId(user && user.warehouseId);
    const sourceWh = normalizeWarehouseId(formData.sourceWarehouse);
    if (!requestingWh) throw new Error("Requesting warehouse is not configured for this user.");

    // Validate against live StockMaster while holding the lock. Duplicate item
    // rows are combined so their total can never exceed available stock.
    const stockSheet = SS.getSheetByName(SHEET_STOCK_MASTER);
    if (!stockSheet) throw new Error("StockMaster sheet not found.");
    const stockData = stockSheet.getDataRange().getValues();
    const stockHeaders = stockData.length ? stockData[0].map(h => String(h || "").trim()) : [];
    const whCol = autoResolveHeaderIndex(stockHeaders, ["WarehouseID", "Warehouse ID"]);
    const prodCol = autoResolveHeaderIndex(stockHeaders, ["ProductID", "Product ID", "Unique Code", "SKU"]);
    const qtyCol = autoResolveHeaderIndex(stockHeaders, ["CurrentStock", "Current Stock", "Qty", "Quantity"]);
    if (whCol === -1 || prodCol === -1 || qtyCol === -1) throw new Error("StockMaster columns are not configured correctly.");

    const availableByProduct = {};
    for (let i = 1; i < stockData.length; i++) {
      if (normalizeWarehouseId(stockData[i][whCol]) !== sourceWh) continue;
      const productId = String(stockData[i][prodCol] || "").trim();
      if (productId) availableByProduct[productId] = (availableByProduct[productId] || 0) + (Number(stockData[i][qtyCol]) || 0);
    }

    const requestedByProduct = {};
    formData.items.forEach((item, index) => {
      const productId = String(item && item.productId || "").trim();
      const qty = Number(item && item.qty);
      if (!productId) throw new Error("Product is required in request row " + (index + 1) + ".");
      if (!Number.isFinite(qty) || qty <= 0) throw new Error("Quantity must be greater than zero in request row " + (index + 1) + ".");
      requestedByProduct[productId] = (requestedByProduct[productId] || 0) + qty;
    });

    // Treat existing approved/pending requests as reserved stock so several
    // requests cannot collectively overbook the same physical quantity.
    const reservedByProduct = {};
    const transferData = transferSheet.getDataRange().getValues();
    if (transferData.length > 1) {
      const th = transferData[0].map(h => String(h || "").trim());
      const tSource = autoResolveHeaderIndex(th, ["SourceWarehouse", "Source Warehouse"]);
      const tProduct = autoResolveHeaderIndex(th, ["ProductID", "Product ID", "Unique Code"]);
      const tRequested = autoResolveHeaderIndex(th, ["RequestedQty", "Requested Qty"]);
      const tDispatched = autoResolveHeaderIndex(th, ["DispatchedQty", "Dispatched Qty"]);
      const tStatus = autoResolveHeaderIndex(th, ["Status"]);
      for (let i = 1; i < transferData.length; i++) {
        if (normalizeWarehouseId(getVal(transferData[i], tSource, "")) !== sourceWh) continue;
        const status = String(getVal(transferData[i], tStatus, "")).trim().toLowerCase();
        if (["rejected", "cancelled", "canceled", "completed", "received"].indexOf(status) !== -1) continue;
        const productId = String(getVal(transferData[i], tProduct, "")).trim();
        const outstanding = Math.max(0, Number(getVal(transferData[i], tRequested, 0)) - Number(getVal(transferData[i], tDispatched, 0)));
        if (productId && outstanding > 0) reservedByProduct[productId] = (reservedByProduct[productId] || 0) + outstanding;
      }
    }
    Object.keys(requestedByProduct).forEach(productId => {
      const physical = Number(availableByProduct[productId] || 0);
      const reserved = Number(reservedByProduct[productId] || 0);
      const available = Math.max(0, physical - reserved);
      const requested = requestedByProduct[productId];
      if (requested > available) throw new Error("Insufficient unreserved stock for " + productId + " in " + sourceWh + ". Physical: " + physical + ", already reserved: " + reserved + ", available: " + available + ", requested: " + requested + ".");
    });

    const isCrossWarehouse = requestingWh !== sourceWh;
    const initialStatus = isCrossWarehouse ? "Pending Approval" : "Approved";
    const auditStamp = getAuditStamp(user);
    formData.items.forEach(item => {
      appendRowByHeaders(transferSheet, {
        "Request_ID": "REQ-" + Math.floor(10000 + Math.random() * 90000),
        "RequestingWarehouse": requestingWh,
        "SourceWarehouse": sourceWh,
        "ProductID": String(item.productId).trim(),
        "RequestedQty": Number(item.qty),
        "Status": initialStatus,
        "OrderNo": formData.orderNo,
        "RequestedBy": formData.requestedBy,
        "RequestedByUsername": String(user && user.username || "").trim(),
        "DispatchedQty": 0,
        "ReceivedQty": 0,
        "Last Edit Status": auditStamp
      }, user);
    });
    SpreadsheetApp.flush();
    return isCrossWarehouse
      ? { status: 'success', message: 'Cross-warehouse request logged. Sent to Head Planner (Sunil Sir) for approval!' }
      : { status: 'success', message: 'Internal material request created for ' + sourceWh + ' for Order ' + formData.orderNo + '.' };
  } finally {
    lock.releaseLock();
  }
}

// --- PLANNER APPROVE / REJECT CROSS-WAREHOUSE REQUEST ---

function dispatchMaterial(transferData, user) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    const transferId = transferData.transferId;
    const dispatchedQty = Number(transferData.dispatchedQty);

    if (isNaN(dispatchedQty) || dispatchedQty <= 0) {
      throw new Error("Dispatched quantity must be greater than zero.");
    }

    const transferSheet = SS.getSheetByName(SHEET_STOCK_TRANSFER);
    const data = transferSheet.getDataRange().getValues();
    const headers = data[0].map(h => h.toString().trim());

    const reqIdCol = getHeaderIndex(headers, "Request_ID");
    const srcWhCol = getHeaderIndex(headers, "SourceWarehouse");
    const prodCol = getHeaderIndex(headers, "ProductID");
    const statusCol = getHeaderIndex(headers, "Status");
    const dispQtyCol = getHeaderIndex(headers, "DispatchedQty");

    for (let i = 1; i < data.length; i++) {
      if (getVal(data[i], reqIdCol) === transferId && getVal(data[i], statusCol) === 'Approved') {
        const sourceWh = normalizeWarehouseId(getVal(data[i], srcWhCol));
        const productId = getVal(data[i], prodCol);

        updateStockAndBinQuantityInternal(sourceWh, productId, "Inward-Staging", -dispatchedQty, user);

        transferSheet.getRange(i + 1, statusCol + 1).setValue("Shipped");
        if (dispQtyCol !== -1) {
          transferSheet.getRange(i + 1, dispQtyCol + 1).setValue(dispatchedQty);
        }
        updateRowAuditStamp(transferSheet, i + 1, user);

        SpreadsheetApp.flush();
        return { status: 'success', message: `Material Sent! ${dispatchedQty} units dispatched from ${sourceWh}.` };
      }
    }
    throw new Error("Could not find approved request to send material.");
  } catch (e) {
    throw new Error("Material dispatch failed: " + e.message);
  } finally {
    lock.releaseLock();
  }
}

// --- RECEIVE MATERIAL (HANDLES FULL & PARTIAL RECEIVING) ---

function receiveTransferredMaterial(transferData, user) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    const transferId = transferData.transferId;
    const receivedQty = Number(transferData.receivedQty);
    const storageBin = transferData.targetBin || "Inward-Staging";

    if (isNaN(receivedQty) || receivedQty <= 0) {
      throw new Error("Received quantity must be greater than zero.");
    }

    const transferSheet = SS.getSheetByName(SHEET_STOCK_TRANSFER);
    const data = transferSheet.getDataRange().getValues();
    const headers = data[0].map(h => h.toString().trim());

    const reqIdCol = getHeaderIndex(headers, "Request_ID");
    const reqWhCol = getHeaderIndex(headers, "RequestingWarehouse");
    const prodCol = getHeaderIndex(headers, "ProductID");
    const statusCol = getHeaderIndex(headers, "Status");
    const dispQtyCol = getHeaderIndex(headers, "DispatchedQty");
    const recQtyCol = getHeaderIndex(headers, "ReceivedQty");
    const productionIdCol = getHeaderIndex(headers, "Production_ID");

    for (let i = 1; i < data.length; i++) {
      if (getVal(data[i], reqIdCol) === transferId && getVal(data[i], statusCol) === 'Shipped') {
        const destWh = normalizeWarehouseId(getVal(data[i], reqWhCol));
        const productId = getVal(data[i], prodCol);
        const dispatchedQty = Number(getVal(data[i], dispQtyCol, 0));

        // Add received stock to Target Warehouse
        updateStockAndBinQuantityInternal(destWh, productId, storageBin, receivedQty, user);

        // Determine status (Full or Partial)
        const finalStatus = (receivedQty >= dispatchedQty) ? "Received" : "Partially Received";

        transferSheet.getRange(i + 1, statusCol + 1).setValue(finalStatus);
        if (recQtyCol !== -1) {
          transferSheet.getRange(i + 1, recQtyCol + 1).setValue(receivedQty);
        }
        updateRowAuditStamp(transferSheet, i + 1, user);
        const productionId = getVal(data[i], productionIdCol, "");
        if (productionId) syncProductionJobMaterialStatus_(productionId, user);

        SpreadsheetApp.flush();
        return { status: 'success', message: `Material Received (${finalStatus})! ${receivedQty} units added to ${destWh} (${storageBin}).` };
      }
    }
    throw new Error("Could not find shipped transfer request.");
  } catch (e) {
    throw new Error("Material receiving failed: " + e.message);
  } finally {
    lock.releaseLock();
  }
}

function adjustStockQuantity(formData, user) {
  verifyUserRole(user, ["Planner", "Warehouse", "Warehouse Manager", "Production", "Administrator"]);

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    const adjQty = Number(formData.adjustmentQty);
    if (isNaN(adjQty) || adjQty === 0) throw new Error("Adjustment qty must be non-zero.");

    if (user && user.role === "Production" && adjQty > 0) {
      throw new Error("Security Violation: Production users are only authorized to deduct/reject stock, not add stock manually.");
    }

    if (!formData.reason || formData.reason.trim() === "") throw new Error("Provide reason.");
    const logSheet = SS.getSheetByName(SHEET_STOCK_ADJUSTMENTS);
    const normalizedWh = normalizeWarehouseId(formData.warehouseId);
    const userName = (user && (user.name || user.username)) ? (user.name || user.username) : "System";

    appendRowByHeaders(logSheet, {
      "AdjustmentID": "ADJ-" + Math.floor(1000 + Math.random() * 9000),
      "Date": getFormattedTimestamp(),
      "ProductID": formData.productId,
      "WarehouseID": normalizedWh,
      "AdjustedQty": adjQty,
      "Reason": formData.reason,
      "AdjustedBy": userName
    }, user);

    updateStockAndBinQuantityInternal(normalizedWh, formData.productId, "Inward-Staging", adjQty, user);

    SpreadsheetApp.flush();
    return { status: 'success', message: `Stock rejected and deducted by ${Math.abs(adjQty)} units successfully.` };
  } catch (e) {
    Logger.log("Stock Adjustment Error: " + e.message);
    throw new Error("Failed to adjust stock: " + e.message);
  } finally {
    lock.releaseLock();
  }
}

function getWarehouseStockMap(warehouseId) {
  try {
    if (!warehouseId) return {};

    const sheet = SS.getSheetByName(SHEET_STOCK_MASTER);
    const data = sheet.getDataRange().getValues();
    const stockMap = {};
    if (data.length <= 1) return stockMap;

    const headers = data[0].map(h => (h || "").toString().trim());
    const whCol = autoResolveHeaderIndex(headers, ["WarehouseID", "Warehouse ID"]);
    const prodCol = autoResolveHeaderIndex(headers, ["ProductID", "Product ID", "Unique Code"]);
    const qtyCol = autoResolveHeaderIndex(headers, ["CurrentStock", "Current Stock", "Qty", "Quantity"]);

    const normWh = normalizeWarehouseId(warehouseId);

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowProd = row[prodCol !== -1 ? prodCol : 1];
      if (!rowProd) continue;

      const rowWh = normalizeWarehouseId(row[whCol !== -1 ? whCol : 0]);
      if (rowWh === normWh) {
        const prodId = rowProd.toString().trim();
        const qty = Number(row[qtyCol !== -1 ? qtyCol : 4]) || 0;
        stockMap[prodId] = (stockMap[prodId] || 0) + qty;
      }
    }
    const transferSheet = SS.getSheetByName(SHEET_STOCK_TRANSFER);
    if (transferSheet && transferSheet.getLastRow() > 1) {
      const transfers = transferSheet.getDataRange().getValues();
      const th = transfers[0].map(h => String(h || "").trim());
      const sourceCol = autoResolveHeaderIndex(th, ["SourceWarehouse", "Source Warehouse"]);
      const productCol = autoResolveHeaderIndex(th, ["ProductID", "Product ID", "Unique Code"]);
      const requestedCol = autoResolveHeaderIndex(th, ["RequestedQty", "Requested Qty"]);
      const dispatchedCol = autoResolveHeaderIndex(th, ["DispatchedQty", "Dispatched Qty"]);
      const statusCol = autoResolveHeaderIndex(th, ["Status"]);
      for (let i = 1; i < transfers.length; i++) {
        if (normalizeWarehouseId(getVal(transfers[i], sourceCol, "")) !== normWh) continue;
        const status = String(getVal(transfers[i], statusCol, "")).trim().toLowerCase();
        if (["rejected", "cancelled", "canceled", "completed", "received"].indexOf(status) !== -1) continue;
        const productId = String(getVal(transfers[i], productCol, "")).trim();
        const outstanding = Math.max(0, Number(getVal(transfers[i], requestedCol, 0)) - Number(getVal(transfers[i], dispatchedCol, 0)));
        if (productId && outstanding > 0) stockMap[productId] = Math.max(0, Number(stockMap[productId] || 0) - outstanding);
      }
    }
    return stockMap;
  } catch (e) {
    throw new Error("Failed to fetch warehouse stock map: " + e.message);
  }
}

function getWarehouseEmailsById(warehouseId) {
  if (!warehouseId) return [];
  const userSheet = SS.getSheetByName(SHEET_USERS);
  if (!userSheet) return [];
  const data = userSheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const normWh = normalizeWarehouseId(warehouseId);
  const emailCol = autoResolveHeaderIndex(data[0], ["email id", "email", "email_id", "email address"]);
  const whCol = autoResolveHeaderIndex(data[0], ["warehouseid", "warehouse id", "warehouse"]);

  const targetEmailCol = emailCol !== -1 ? emailCol : 6; // Column G
  const targetWhCol = whCol !== -1 ? whCol : 4;         // Column E

  const emails = [];
  for (let i = 1; i < data.length; i++) {
    const rowWh = normalizeWarehouseId(data[i][targetWhCol]);
    const email = data[i][targetEmailCol] ? data[i][targetEmailCol].toString().trim() : "";

    if (rowWh === normWh && email && email.includes("@")) {
      emails.push(email);
    }
  }
  return [...new Set(emails)];
}
// --- PURCHASER SELF-FILTERED REJECTION DATA RETRIEVAL ---


// ============================================================
// GRN ITEM IDENTITY SAFETY HELPERS
// ============================================================
function normalizeGrnIdentity_(value) {
  return String(value == null ? "" : value).trim().toUpperCase();
}

function findReceivingPlanRowForGrn_(planRows, columns, item) {
  const wantedPlanId = normalizeGrnIdentity_(item && item.planId);
  const wantedPoId = normalizeGrnIdentity_(item && item.poId);
  const wantedProductId = normalizeGrnIdentity_(item && item.productId);

  // STRICT MODE: frontend selection must carry the complete item identity.
  if (!wantedPlanId || !wantedPoId || !wantedProductId) {
    throw new Error(
      "GRN blocked: Plan ID, PO ID and Product ID are mandatory. Refresh Warehouse and select the item again."
    );
  }

  const exact = [];
  for (let i = 1; i < planRows.length; i++) {
    const rowPlanId = normalizeGrnIdentity_(getVal(planRows[i], columns.planIdCol));
    const rowPoId = normalizeGrnIdentity_(getVal(planRows[i], columns.poIdCol));
    const rowProductId = normalizeGrnIdentity_(getVal(planRows[i], columns.productIdCol));

    if (rowPlanId === wantedPlanId && rowPoId === wantedPoId && rowProductId === wantedProductId) {
      exact.push(i);
    }
  }

  if (exact.length === 1) return exact[0];

  if (exact.length > 1) {
    throw new Error(
      "GRN blocked: duplicate ReceivingPlan identity found for Plan=" + item.planId +
      ", PO=" + item.poId + ", Product=" + item.productId + "."
    );
  }

  throw new Error(
    "GRN item mismatch blocked. Frontend selected Plan=" + item.planId +
    ", PO=" + item.poId + ", Product=" + item.productId +
    ", but no exact backend ReceivingPlan row exists."
  );
}


function generateUniqueGrnId_(prefix, digits) {
  const requestedPrefix = String(prefix || "RCPT-").trim().toUpperCase();

  // Receipt IDs keep the OLD visible format:
  // Single GRN  -> RCPT-1234
  // Bulk/Multi  -> RCPT-12345 (one common Receipt_ID for the complete batch)
  if (requestedPrefix === "RCPT-") {
    return generateLegacyUniqueId_(
      SHEET_GOODS_RECEIVED,
      "Receipt_ID",
      "RCPT-",
      Number(digits || 4),
      ["Receipt ID", "GRN No", "GRN_No"]
    );
  }

  // Keep historical master-reference formats too, if any legacy caller uses them.
  if (requestedPrefix === "BULK-GRN-") {
    return "BULK-GRN-" + Math.floor(10000 + Math.random() * 90000);
  }
  if (requestedPrefix === "M-RCPT-") {
    return "M-RCPT-" + Math.floor(10000 + Math.random() * 90000);
  }

  return requestedPrefix + Math.floor(1000 + Math.random() * 9000);
}

function validateGrnWarehouseIdentity_(submittedWarehouseId, backendWarehouseId, label) {
  const submitted = normalizeWarehouseId(submittedWarehouseId || "");
  const backend = normalizeWarehouseId(backendWarehouseId || "");
  if (submitted && backend && submitted !== backend) {
    throw new Error(
      "GRN warehouse mismatch blocked for " + (label || "item") +
      ". Frontend=" + submitted + ", Backend=" + backend + "."
    );
  }
}

function grnIdentityKey_(planId, poId, productId) {
  return [planId, poId, productId].map(normalizeGrnIdentity_).join("||");
}


function exactSubmittedNumber_(value, fieldLabel) {
  if (value === null || value === undefined || value === "") return 0;
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error((fieldLabel || "Quantity") + " must be a valid number.");
  return n;
}
function validateGrnQuantity_(plannedQty, alreadyReceivedQty, receivedQty, rejectedQty, label) {
  // Warehouse is allowed to receive more than the current Balance Due.
  // Planned / balance quantity is informational only; it is NOT a GRN ceiling.
  // Item identity, PO identity and warehouse identity are still validated separately.
  const accepted = Number(receivedQty || 0);
  const rejected = Number(rejectedQty || 0);

  if (!isFinite(accepted) || accepted < 0 || !isFinite(rejected) || rejected < 0) {
    throw new Error("Invalid GRN quantity for " + label + ".");
  }
  if (accepted <= 0 && rejected <= 0) {
    throw new Error("Accepted or Rejected Qty must be greater than 0 for " + label + ".");
  }
}

function submitGoodsReceiving(formData, user) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    const planSheet = SS.getSheetByName(SHEET_RECEIVING_PLAN);
    const logSheet = SS.getSheetByName(SHEET_GOODS_RECEIVED);
    const planRows = planSheet.getDataRange().getValues();
    const planHeaders = planRows[0].map(h => h.toString().trim());

    const planIdCol = getHeaderIndex(planHeaders, "Plan_ID"),
      poIdCol = getHeaderIndex(planHeaders, "PO_ID"),
      productIdCol = getHeaderIndex(planHeaders, "ProductID"),
      whCol = getHeaderIndex(planHeaders, "WarehouseID"),
      plannedQtyCol = getHeaderIndex(planHeaders, "PlannedQty");

    let planStatusColIndex = getHeaderIndex(planHeaders, "Status");
    if (planStatusColIndex === -1) { planSheet.getRange(1, 6).setValue("Status"); planStatusColIndex = 5; }

    let receivedQtyCol = getHeaderIndex(planHeaders, "TotalReceivedQty");
    if (receivedQtyCol === -1) { planSheet.getRange(1, 7).setValue("TotalReceivedQty"); receivedQtyCol = 6; }

    const matchedIndex = findReceivingPlanRowForGrn_(planRows, {
      planIdCol: planIdCol, poIdCol: poIdCol, productIdCol: productIdCol
    }, formData);

    const matchedRow = planRows[matchedIndex];
    const planRow = matchedIndex + 1;
    const planInfo = {
      poId: getVal(matchedRow, poIdCol),
      productId: getVal(matchedRow, productIdCol),
      warehouseId: normalizeWarehouseId(getVal(matchedRow, whCol))
    };
    const currentPlannedQty = Number(getVal(matchedRow, plannedQtyCol, 0));
    const currentTotalReceived = Number(getVal(matchedRow, receivedQtyCol, 0));
    validateGrnWarehouseIdentity_(formData.warehouseId, planInfo.warehouseId, formData.planId);

    const invoiceImgUrl = uploadImageToDrive(formData.invoiceImage, `Invoice_${formData.invoiceNo}_${new Date().getTime()}.png`);
    const itemImgUrl = uploadImageToDrive(formData.itemImage, `Item_${planInfo.productId}_${new Date().getTime()}.png`);

    const newlyReceivedQty = exactSubmittedNumber_(formData.receivedQty, "Accepted Qty");
    const newlyRejectedQty = exactSubmittedNumber_(formData.rejectedQty, "Rejected Qty");
    validateGrnQuantity_(currentPlannedQty, currentTotalReceived, newlyReceivedQty, newlyRejectedQty, formData.planId);
    const initialLocation = formData.storageLocation || "Inward-Staging";

    const balanceBeforeGrn = Math.max(0, currentPlannedQty - currentTotalReceived);
    const extraReceivedQty = Math.max(0, newlyReceivedQty - balanceBeforeGrn);
    const newTotalReceivedQty = currentTotalReceived + newlyReceivedQty;
    let newStatus = "Pending";
    if (newTotalReceivedQty >= currentPlannedQty) newStatus = "Received";

    const receiptId = generateUniqueGrnId_("RCPT-", 4);
    const finalRemarks = newlyRejectedQty > 0 ? "Reject Reason: " + formData.rejectionReason : formData.remarks;
    const formattedTimestamp = getFormattedTimestamp(); // 🟢 Fixed Timestamp
    const auditStamp = getAuditStamp(user);

    appendRowByHeaders(logSheet, {
      "Receipt_ID": receiptId,
      "Plan_ID": formData.planId,
      "PO_ID": planInfo.poId,
      "ProductID": planInfo.productId,
      "ProductName": formData.itemDescription || planInfo.productId,
      "WarehouseID": planInfo.warehouseId,
      "ReceivedQty": newlyReceivedQty,
      "RejectedQty": newlyRejectedQty,
      "Remarks": finalRemarks,
      "ReceivedBy": user.name,
      "ReceivedByUsername": String(user && user.username || "").trim(),
      "Date": formattedTimestamp,
      "StorageLocation": initialLocation,
      "InvoiceNo": (formData.invoiceNo === null || formData.invoiceNo === undefined) ? "" : String(formData.invoiceNo),
      "BiltyNo": formData.biltyNo,
      "TruckNo": formData.truckNo,
      "DriverName": formData.driverName,
      "DriverNo": formData.driverNo,
      "GSTInvoiceNo": formData.gstInvoice,
      "InvoiceImageURL": invoiceImgUrl,
      "ItemImageURL": itemImgUrl,
      "PurchaserName": cleanDataMarkerForStorage_(formData.purchasePersonName),
      "PlannerName": cleanDataMarkerForStorage_(formData.plannedBy),
      "Last Edit Status": auditStamp,
      "PlannedQtyAtGRN": currentPlannedQty,
      "PreviousReceivedQty": currentTotalReceived,
      "BalanceBeforeGRN": balanceBeforeGrn,
      "ExtraReceivedQty": extraReceivedQty,
      "TotalReceivedAfterGRN": newTotalReceivedQty
    }, user);

    if (newlyRejectedQty > 0) {
      const actionSheet = SS.getSheetByName(SHEET_REJECT_ACTIONS);
      if (actionSheet) {
        appendRowByHeaders(actionSheet, {
          "Action_ID": "ACT-" + Math.floor(1000 + Math.random() * 9000),
          "Receipt_ID": receiptId,
          "PO_ID": planInfo.poId,
          "ProductID": planInfo.productId || "Unknown SKU",
          "RejectedQty": newlyRejectedQty,
          "ActionType": "Pending",
          "ActionDate": formattedTimestamp,
          "ReferenceNo": "",
          "Status": "Pending Purchase Action",
          "PurchaseRemarks": formData.rejectionReason,
          "UpdatedBy": user.name,
          "IsReplacementExpected": "No",
          "ReplacementVendor": "None",
          "ReplacementETA": "",
          "ResolutionPath": "Awaiting Action",
          "Last Edit Status": auditStamp
        }, user);
      }
    }

    if (newlyReceivedQty > 0) {
      updateStockAndBinQuantityInternal(planInfo.warehouseId, planInfo.productId, initialLocation, newlyReceivedQty, user);
    }

    if (planStatusColIndex >= 0) planSheet.getRange(planRow, planStatusColIndex + 1).setValue(newStatus);
    if (receivedQtyCol >= 0) planSheet.getRange(planRow, receivedQtyCol + 1).setValue(newTotalReceivedQty);
    updateRowAuditStamp(planSheet, planRow, user);

    SpreadsheetApp.flush();

    // DUAL EMAIL TRIGGER SYSTEM
    formData.warehouseId = planInfo.warehouseId;
    formData.receivedBy = user.name;
    formData.receiptId = receiptId;
    formData.plannedQty = currentPlannedQty;

    if (newlyReceivedQty > 0 && newlyRejectedQty > 0) {
      try { sendGrnEmailWithPdf(formData, "Accepted"); } catch (e1) { Logger.log("Accepted Email Error: " + e1.message); }
      try { sendGrnEmailWithPdf(formData, "Rejected"); } catch (e2) { Logger.log("Rejected Email Error: " + e2.message); }
    } else if (newlyRejectedQty > 0) {
      try { sendGrnEmailWithPdf(formData, "Rejected"); } catch (e2) { Logger.log("Rejected Email Error: " + e2.message); }
    } else {
      try { sendGrnEmailWithPdf(formData, "Accepted"); } catch (e1) { Logger.log("Accepted Email Error: " + e1.message); }
    }

    return {
      status: 'success',
      message: `GRN Created! ${newlyReceivedQty} accepted, ${newlyRejectedQty} rejected.`,
      // Top-level ID makes the client print flow independent of nested object
      // serialization and always points to the persisted GoodsReceivedLog row.
      receiptId: receiptId,
      grnData: {
        receiptId: receiptId,
        planId: formData.planId,
        poId: planInfo.poId,
        orderNo: formData.orderNo || "",
        productId: planInfo.productId || formData.productId || "",
        productName: formData.itemDescription || planInfo.productId || "",
        itemDescription: formData.itemDescription || "",
        vendorName: formData.vendorName || "",
        vendorCode: formData.vendorCode || "",
        buyerCode: formData.buyerCode || "",
        uom: cleanUom(formData.uom || ""),
        warehouseId: planInfo.warehouseId,
        plannedQty: currentPlannedQty,
        previousReceivedQty: currentTotalReceived,
        balanceBeforeGrn: balanceBeforeGrn,
        extraReceivedQty: extraReceivedQty,
        totalReceivedAfterGrn: newTotalReceivedQty,
        receivedQty: newlyReceivedQty,
        rejectedQty: newlyRejectedQty,
        invoiceNo: formData.invoiceNo || "",
        gstInvoice: formData.gstInvoice || "",
        biltyNo: formData.biltyNo || "",
        truckNo: formData.truckNo || "",
        driverName: formData.driverName || "",
        driverNo: formData.driverNo || "",
        storageLocation: initialLocation,
        remarks: finalRemarks || "",
        receivedBy: user.name || "",
        purchaserName: cleanDataMarkerForStorage_(formData.purchasePersonName),
        plannerName: cleanDataMarkerForStorage_(formData.plannedBy),
        date: formattedTimestamp,
        lastEditStatus: auditStamp
      }
    };

  } catch (e) {
    throw new Error("Failed to write GRN transaction safely: " + e.message);
  } finally {
    lock.releaseLock();
  }
}
// ====================================================================
// 🛠️ AUTOMATED DATA CLEANUP & DETAILED REPORTING UTILITY
// चलाएं: Extensions > Apps Script > Select 'fixAllCorruptedData' > Click RUN
// ====================================================================

function submitBulkGoodsReceiving(bulkData, user) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);

    const planSheet = SS.getSheetByName(SHEET_RECEIVING_PLAN);
    const logSheet = SS.getSheetByName(SHEET_GOODS_RECEIVED);
    const actionSheet = SS.getSheetByName(SHEET_REJECT_ACTIONS);

    const planRows = planSheet.getDataRange().getValues();
    const planHeaders = planRows[0].map(h => h.toString().trim());

    const planIdCol = getHeaderIndex(planHeaders, "Plan_ID"),
      poIdCol = getHeaderIndex(planHeaders, "PO_ID"),
      productIdCol = getHeaderIndex(planHeaders, "ProductID"),
      whCol = getHeaderIndex(planHeaders, "WarehouseID"),
      plannedQtyCol = getHeaderIndex(planHeaders, "PlannedQty");

    let planStatusColIndex = getHeaderIndex(planHeaders, "Status");
    if (planStatusColIndex === -1) planStatusColIndex = 5;

    let receivedQtyCol = getHeaderIndex(planHeaders, "TotalReceivedQty");
    if (receivedQtyCol === -1) receivedQtyCol = 6;

    const invoiceImgUrl = bulkData.invoiceImage ?
      uploadImageToDrive(bulkData.invoiceImage, `Invoice_${bulkData.invoiceNo}_${new Date().getTime()}.png`) : "";

    const timestampNow = new Date();
    const formattedTimestamp = Utilities.formatDate(timestampNow, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
    const auditStamp = getAuditStamp(user);

    let processedCount = 0;
    let totalReceivedSum = 0;
    let totalRejectedSum = 0;

    const masterReceiptId = generateUniqueGrnId_("RCPT-", 5);
    bulkData.masterReceiptId = masterReceiptId;
    bulkData.receivedBy = user.name + " (" + user.username + ")";
    bulkData.formattedTimestamp = formattedTimestamp;

    bulkData.items.forEach(item => {
      const matchedIndex = findReceivingPlanRowForGrn_(planRows, {
        planIdCol: planIdCol, poIdCol: poIdCol, productIdCol: productIdCol
      }, item);
      const row = planRows[matchedIndex];
      const planRow = matchedIndex + 1;
      const planInfo = {
        poId: getVal(row, poIdCol),
        productId: getVal(row, productIdCol),
        warehouseId: normalizeWarehouseId(getVal(row, whCol))
      };
      const currentPlannedQty = Number(getVal(row, plannedQtyCol, 0));
      const currentTotalReceived = Number(getVal(row, receivedQtyCol, 0));

      {
        const newlyReceivedQty = exactSubmittedNumber_(item.receivedQty, "Accepted Qty");
        const newlyRejectedQty = exactSubmittedNumber_(item.rejectedQty, "Rejected Qty");
        validateGrnQuantity_(currentPlannedQty, currentTotalReceived, newlyReceivedQty, newlyRejectedQty, item.planId);
        const initialLocation = item.storageLocation || "Inward-Staging";

        const balanceBeforeGrn = Math.max(0, currentPlannedQty - currentTotalReceived);
        const extraReceivedQty = Math.max(0, newlyReceivedQty - balanceBeforeGrn);
        const newTotalReceivedQty = currentTotalReceived + newlyReceivedQty;
        let newStatus = "Pending";
        if (newTotalReceivedQty >= currentPlannedQty) newStatus = "Received";

        const lineReceiptId = masterReceiptId;
        item.receiptId = lineReceiptId;
        item.poId = planInfo.poId;
        item.warehouseId = planInfo.warehouseId;
        item.plannedQtyAtGrn = currentPlannedQty;
        item.previousReceivedQty = currentTotalReceived;
        item.balanceBeforeGrn = balanceBeforeGrn;
        item.extraReceivedQty = extraReceivedQty;
        item.totalReceivedAfterGrn = newTotalReceivedQty;

        const finalRemarks = newlyRejectedQty > 0 ? "Reject Reason: " + item.rejectionReason : (bulkData.remarks || "OK");

        appendRowByHeaders(logSheet, {
          "Receipt_ID": lineReceiptId,
          "Plan_ID": item.planId,
          "PO_ID": planInfo.poId,
          "ProductID": planInfo.productId,
          "ProductName": item.itemDescription || planInfo.productId,
          "WarehouseID": planInfo.warehouseId,
          "ReceivedQty": newlyReceivedQty,
          "RejectedQty": newlyRejectedQty,
          "Remarks": finalRemarks,
          "ReceivedBy": bulkData.receivedBy,
          "ReceivedByUsername": String(user && user.username || "").trim(),
          "Date": formattedTimestamp,
          "StorageLocation": initialLocation,
          "InvoiceNo": (bulkData.invoiceNo === null || bulkData.invoiceNo === undefined) ? "" : String(bulkData.invoiceNo),
          "BiltyNo": bulkData.biltyNo,
          "TruckNo": bulkData.truckNo,
          "DriverName": bulkData.driverName,
          "DriverNo": bulkData.driverNo,
          "GSTInvoiceNo": bulkData.gstInvoice,
          "InvoiceImageURL": invoiceImgUrl,
          "ItemImageURL": "",
          "PurchaserName": cleanDataMarkerForStorage_(item.purchasePersonName),
          "PlannerName": cleanDataMarkerForStorage_(item.plannedBy),
          "Last Edit Status": auditStamp,
          "PlannedQtyAtGRN": currentPlannedQty,
          "PreviousReceivedQty": currentTotalReceived,
          "BalanceBeforeGRN": balanceBeforeGrn,
          "ExtraReceivedQty": extraReceivedQty,
          "TotalReceivedAfterGRN": newTotalReceivedQty
        }, user);

        if (newlyRejectedQty > 0 && actionSheet) {
          appendRowByHeaders(actionSheet, {
            "Action_ID": "ACT-" + Math.floor(1000 + Math.random() * 9000),
            "Receipt_ID": lineReceiptId,
            "PO_ID": planInfo.poId,
            "ProductID": planInfo.productId || "Unknown SKU",
            "RejectedQty": newlyRejectedQty,
            "ActionType": "Pending",
            "ActionDate": formattedTimestamp,
            "ReferenceNo": "",
            "Status": "Pending Purchase Action",
            "PurchaseRemarks": item.rejectionReason,
            "UpdatedBy": user.name,
            "IsReplacementExpected": "No",
            "ReplacementVendor": "None",
            "ReplacementETA": "",
            "ResolutionPath": "Awaiting Action",
            "Last Edit Status": auditStamp
          }, user);
        }

        if (newlyReceivedQty > 0) {
          updateStockAndBinQuantityInternal(planInfo.warehouseId, planInfo.productId, initialLocation, newlyReceivedQty, user);
        }

        if (planStatusColIndex >= 0) planSheet.getRange(planRow, planStatusColIndex + 1).setValue(newStatus);
        if (receivedQtyCol >= 0) planSheet.getRange(planRow, receivedQtyCol + 1).setValue(newTotalReceivedQty);
        updateRowAuditStamp(planSheet, planRow, user);

        processedCount++;
        totalReceivedSum += newlyReceivedQty;
        totalRejectedSum += newlyRejectedQty;
      }
    });

    SpreadsheetApp.flush();

    // EMAIL BULK GRN PDF ATTACHMENT
    try {
      sendBulkGrnEmailWithPdf(bulkData, totalRejectedSum > 0 ? "PARTIAL_REJECT" : "ACCEPTED");
    } catch (eMailErr) {
      Logger.log("Bulk GRN Email Alert Error: " + eMailErr.message);
    }

    return {
      status: 'success',
      message: `Bulk GRN Successful! Processed ${processedCount} line items. Total Accepted: ${totalReceivedSum}, Total Rejected: ${totalRejectedSum}.`,
      bulkData: bulkData
    };

  } catch (e) {
    throw new Error("Bulk GRN failed: " + e.message);
  } finally {
    lock.releaseLock();
  }
}

// --- 2. AUTOMATED BULK GRN EMAIL SENDER ---

function submitMultiGoodsReceiving(multiFormData, user) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);

    if (!multiFormData || !Array.isArray(multiFormData.items) || !multiFormData.items.length) {
      throw new Error("No GRN items were selected.");
    }

    const planSheet = SS.getSheetByName(SHEET_RECEIVING_PLAN);
    const logSheet = SS.getSheetByName(SHEET_GOODS_RECEIVED);
    const actionSheet = SS.getSheetByName(SHEET_REJECT_ACTIONS);
    if (!planSheet || !logSheet) throw new Error("GRN sheets are not configured correctly.");

    const planRows = planSheet.getDataRange().getValues();
    const planHeaders = planRows[0].map(h => h.toString().trim());

    const planIdCol = getHeaderIndex(planHeaders, "Plan_ID");
    const poIdCol = getHeaderIndex(planHeaders, "PO_ID");
    const productIdCol = getHeaderIndex(planHeaders, "ProductID");
    const whCol = getHeaderIndex(planHeaders, "WarehouseID");
    const plannedQtyCol = getHeaderIndex(planHeaders, "PlannedQty");
    const planStatusColIndex = getHeaderIndex(planHeaders, "Status");
    const receivedQtyCol = getHeaderIndex(planHeaders, "TotalReceivedQty");

    if ([planIdCol, poIdCol, productIdCol, whCol, plannedQtyCol, receivedQtyCol].some(c => c < 0)) {
      throw new Error("ReceivingPlan required GRN columns are missing.");
    }

    const auditStamp = getAuditStamp(user);
    const formattedTimestamp = getFormattedTimestamp();
    const multiMasterId = generateUniqueGrnId_("RCPT-", 5);

    // PHASE 1: validate EVERY selected frontend item before any GRN/stock write.
    const seen = {};
    const validatedItems = [];
    let totalReceivedSum = 0;
    let totalRejectedSum = 0;

    multiFormData.items.forEach(function(item, itemIndex) {
      const identityKey = grnIdentityKey_(item.planId, item.poId, item.productId);
      if (seen[identityKey]) {
        throw new Error(
          "Duplicate GRN selection blocked at line " + (itemIndex + 1) +
          ": " + item.planId + " / " + item.poId + " / " + item.productId + "."
        );
      }
      seen[identityKey] = true;

      const matchedIndex = findReceivingPlanRowForGrn_(planRows, {
        planIdCol: planIdCol,
        poIdCol: poIdCol,
        productIdCol: productIdCol
      }, item);

      const matchedRow = planRows[matchedIndex];
      const backendPlanId = String(getVal(matchedRow, planIdCol, "")).trim();
      const backendPoId = String(getVal(matchedRow, poIdCol, "")).trim();
      const backendProductId = String(getVal(matchedRow, productIdCol, "")).trim();
      const targetWh = normalizeWarehouseId(getVal(matchedRow, whCol));
      const currentPlannedQty = Number(getVal(matchedRow, plannedQtyCol, 0));
      const currentTotalReceived = Number(getVal(matchedRow, receivedQtyCol, 0));
      const recQty = exactSubmittedNumber_(item.receivedQty, "Accepted Qty");
      const rejQty = exactSubmittedNumber_(item.rejectedQty, "Rejected Qty");

      validateGrnWarehouseIdentity_(multiFormData.warehouseId, targetWh, backendPlanId);
      validateGrnQuantity_(currentPlannedQty, currentTotalReceived, recQty, rejQty, backendPlanId + " / " + backendProductId);

      const balanceBeforeGrn = Math.max(0, currentPlannedQty - currentTotalReceived);
      const extraReceivedQty = Math.max(0, recQty - balanceBeforeGrn);
      const totalReceivedAfterGrn = currentTotalReceived + recQty;

      validatedItems.push({
        source: item,
        matchedIndex: matchedIndex,
        planRowIdx: matchedIndex + 1,
        planId: backendPlanId,
        poId: backendPoId,
        productId: backendProductId,
        warehouseId: targetWh,
        plannedQty: currentPlannedQty,
        currentTotalReceived: currentTotalReceived,
        balanceBeforeGrn: balanceBeforeGrn,
        extraReceivedQty: extraReceivedQty,
        totalReceivedAfterGrn: totalReceivedAfterGrn,
        receivedQty: recQty,
        rejectedQty: rejQty
      });

      totalReceivedSum += recQty;
      totalRejectedSum += rejQty;
    });

    // Upload only after all identities/quantities have passed validation.
    const invoiceImgUrl = multiFormData.invoiceImage ?
      uploadImageToDrive(multiFormData.invoiceImage, `Invoice_${multiFormData.invoiceNo}_${new Date().getTime()}.png`) : "";

    // PHASE 2: persist exactly the backend-validated identities.
    const processedItems = [];

    validatedItems.forEach(function(v) {
      const item = v.source;
      const newTotalReceived = v.totalReceivedAfterGrn;
      const newStatus = (newTotalReceived >= v.plannedQty) ? "Received" : "Pending";
      const lineReceiptId = multiMasterId;
      const itemImgUrl = item.itemImage ?
        uploadImageToDrive(item.itemImage, `Item_${v.productId}_${new Date().getTime()}.png`) : "";
      const finalRemarks = v.rejectedQty > 0 ?
        "Reject Reason: " + item.rejectionReason : (item.remarks || "OK");
      const storageLocation = item.storageLocation || "Inward-Staging";
      const persistedProductName = item.itemDescription || v.productId;

      appendRowByHeaders(logSheet, {
        "Receipt_ID": lineReceiptId,
        "Plan_ID": v.planId,
        "PO_ID": v.poId,
        "ProductID": v.productId,
        "ProductName": persistedProductName,
        "WarehouseID": v.warehouseId,
        "ReceivedQty": v.receivedQty,
        "RejectedQty": v.rejectedQty,
        "Remarks": finalRemarks,
        "ReceivedBy": user.name,
        "ReceivedByUsername": String(user && user.username || "").trim(),
        "Date": formattedTimestamp,
        "StorageLocation": storageLocation,
        "InvoiceNo": (multiFormData.invoiceNo === null || multiFormData.invoiceNo === undefined) ? "" : String(multiFormData.invoiceNo),
        "BiltyNo": multiFormData.biltyNo,
        "TruckNo": multiFormData.truckNo,
        "DriverName": multiFormData.driverName,
        "DriverNo": multiFormData.driverNo,
        "GSTInvoiceNo": multiFormData.gstInvoice,
        "InvoiceImageURL": invoiceImgUrl,
        "ItemImageURL": itemImgUrl,
        "PurchaserName": item.purchaserName || cleanDataMarkerForStorage_(item.purchasePersonName),
        "PlannerName": item.plannerName || cleanDataMarkerForStorage_(item.plannedBy),
        "Last Edit Status": auditStamp,
        "PlannedQtyAtGRN": v.plannedQty,
        "PreviousReceivedQty": v.currentTotalReceived,
        "BalanceBeforeGRN": v.balanceBeforeGrn,
        "ExtraReceivedQty": v.extraReceivedQty,
        "TotalReceivedAfterGRN": v.totalReceivedAfterGrn
      }, user);

      if (v.rejectedQty > 0 && actionSheet) {
        appendRowByHeaders(actionSheet, {
          "Action_ID": generateLegacyUniqueId_(SHEET_REJECT_ACTIONS, "Action_ID", "ACT-", 4, ["Action ID"]),
          "Receipt_ID": lineReceiptId,
          "PO_ID": v.poId,
          "ProductID": v.productId,
          "RejectedQty": v.rejectedQty,
          "ActionType": "Pending",
          "ActionDate": formattedTimestamp,
          "ReferenceNo": "",
          "Status": "Pending Purchase Action",
          "PurchaseRemarks": item.rejectionReason,
          "UpdatedBy": user.name,
          "IsReplacementExpected": "No",
          "ReplacementVendor": "None",
          "ReplacementETA": "",
          "ResolutionPath": "Awaiting Action",
          "Last Edit Status": auditStamp
        }, user);
      }

      if (v.receivedQty > 0) {
        updateStockAndBinQuantityInternal(v.warehouseId, v.productId, storageLocation, v.receivedQty, user);
      }

      if (planStatusColIndex >= 0) planSheet.getRange(v.planRowIdx, planStatusColIndex + 1).setValue(newStatus);
      planSheet.getRange(v.planRowIdx, receivedQtyCol + 1).setValue(newTotalReceived);
      updateRowAuditStamp(planSheet, v.planRowIdx, user);

      processedItems.push({
        receiptId: lineReceiptId,
        planId: v.planId,
        poId: v.poId,
        orderNo: item.orderNo || "",
        buyerCode: cleanDataMarkerForStorage_(item.buyerCode),
        vendorName: cleanDataMarkerForStorage_(item.vendorName),
        vendorCode: cleanDataMarkerForStorage_(item.vendorCode),
        purchaserName: item.purchaserName || cleanDataMarkerForStorage_(item.purchasePersonName),
        plannerName: item.plannerName || cleanDataMarkerForStorage_(item.plannedBy),
        productId: v.productId,
        productName: persistedProductName,
        itemDescription: persistedProductName,
        plannedQtyAtGrn: v.plannedQty,
        previousReceivedQty: v.currentTotalReceived,
        balanceBeforeGrn: v.balanceBeforeGrn,
        extraReceivedQty: v.extraReceivedQty,
        totalReceivedAfterGrn: v.totalReceivedAfterGrn,
        warehouseId: v.warehouseId,
        plannedQty: v.plannedQty,
        receivedQty: v.receivedQty,
        rejectedQty: v.rejectedQty,
        storageLocation: storageLocation,
        uom: cleanUom(item.uom) || "Pcs",
        rejectionReason: item.rejectionReason || "",
        remarks: item.remarks || "OK"
      });
    });

    SpreadsheetApp.flush();

    const emailPayload = {
      multiReceiptId: multiMasterId,
      warehouseId: normalizeWarehouseId(multiFormData.warehouseId),
      invoiceNo: multiFormData.invoiceNo,
      gstInvoice: multiFormData.gstInvoice,
      biltyNo: multiFormData.biltyNo,
      truckNo: multiFormData.truckNo,
      driverName: multiFormData.driverName,
      driverNo: multiFormData.driverNo,
      receivedBy: user.name,
      formattedTimestamp: formattedTimestamp,
      items: processedItems
    };

    try { sendMultiGrnEmailWithPdf(emailPayload); } catch (e) { Logger.log("Multi-GRN Email Error: " + e.message); }

    return {
      status: "success",
      message: `Multi-GRN Authorized! Processed ${processedItems.length} line items (${totalReceivedSum} Accepted, ${totalRejectedSum} Rejected).`,
      multiReceiptId: multiMasterId,
      receiptIds: [multiMasterId],
      multiData: emailPayload
    };

  } catch (e) {
    throw new Error("Multi-GRN transaction failed: " + e.message);
  } finally {
    lock.releaseLock();
  }
}

// --- GENERATE UNIFIED MULTI-GRN HTML FOR PDF & EMAIL ---

