// ============================================================
// PRODUCTION DEPARTMENT
// Extracted from original Code.gs without changing function names.
// ============================================================

function getProductionData(warehouseId) {
  let data = { myStock: [], incomingTransfers: [], productionRuns: [] };
  const normUserWh = normalizeWarehouseId(warehouseId);

  if (!normUserWh) return data;

  const receivedRawSkusSet = new Set();
  const stockSumMap = {};
  const stockNameMap = {};
  const stockCatMap = {};
  const productMap = {};
  const returnWarehouseMap = {};

  // 1. Fetch Active Stock from StockMaster
  const stockSheet = SS.getSheetByName(SHEET_STOCK_MASTER);
  const stockData = stockSheet ? stockSheet.getDataRange().getValues() : [];

  if (stockData.length > 1) {
    const headers = stockData[0].map(h => h.toString().trim());
    let whColIdx = autoResolveHeaderIndex(headers, ["WarehouseID", "Warehouse ID", "Warehouse_ID", "Warehouse"]);
    let prodColIdx = autoResolveHeaderIndex(headers, ["ProductID", "Product ID", "Unique Code", "SKU"]);
    let nameColIdx = autoResolveHeaderIndex(headers, ["ProductName", "Product Name", "Item Description"]);
    let catColIdx = autoResolveHeaderIndex(headers, ["Category"]);
    let qtyColIdx = autoResolveHeaderIndex(headers, ["Qty", "CurrentStock", "Current Stock", "Quantity"]);
    let binColIdx = autoResolveHeaderIndex(headers, ["BinLocation", "Bin Location", "Bin"]);

    if (whColIdx === -1) whColIdx = 0;
    if (prodColIdx === -1) prodColIdx = 1;
    if (nameColIdx === -1) nameColIdx = 2;
    if (catColIdx === -1) catColIdx = 3;
    if (qtyColIdx === -1) qtyColIdx = stockData[0].length >= 6 ? 5 : stockData[0].length - 1;

    for (let i = 1; i < stockData.length; i++) {
      const row = stockData[i];
      const rowWh = normalizeWarehouseId(getVal(row, whColIdx, ""));
      const pId = getVal(row, prodColIdx, "").toString().trim();
      if (!pId) continue;

      const pName = nameColIdx !== -1 ? getVal(row, nameColIdx, pId) : pId;
      const pCat = catColIdx !== -1 ? getVal(row, catColIdx, "Raw") : "Raw";
      const qVal = Number(getVal(row, qtyColIdx, 0)) || 0;
      const rowBin = binColIdx !== -1 ? String(getVal(row, binColIdx, "Inward-Staging") || "").trim() : "Inward-Staging";

      productMap[pId] = pName;

      // Production working stock is the Inward-Staging bin only. Returned
      // material can live under the same WarehouseID in Returned-From-Production
      // without appearing again as available production stock.
      if (rowWh === normUserWh && rowBin.toLowerCase() === "inward-staging") {
        stockSumMap[pId] = (stockSumMap[pId] || 0) + qVal;
        stockNameMap[pId] = pName;
        stockCatMap[pId] = pCat;
        receivedRawSkusSet.add(pId.toUpperCase());
      }
    }
  }

  // Lookups from PurchaseOrders for UOM, PO Number, Product Name
  const poSheet = SS.getSheetByName(SHEET_PURCHASE_ORDERS);
  const poSkuLookup = {};
  if (poSheet) {
    const poData = poSheet.getDataRange().getValues();
    if (poData.length > 1) {
      const poHeaders = poData[0].map(h => h.toString().trim());
      const poNumCol = autoResolveHeaderIndex(poHeaders, ["PO Number", "PO_Number", "PO ID"]);
      const prodIdCol = autoResolveHeaderIndex(poHeaders, ["Unique Code", "Product Code", "ProductID", "SKU"]);
      const descCol = autoResolveHeaderIndex(poHeaders, ["Item Description", "Description", "Item Name"]);
      const uomCol = autoResolveHeaderIndex(poHeaders, ["UOM", "Unit"]);

      for (let i = 1; i < poData.length; i++) {
        const sku = getVal(poData[i], prodIdCol, "").toString().trim().toUpperCase();
        if (sku && !poSkuLookup[sku]) {
          poSkuLookup[sku] = {
            poNo: getVal(poData[i], poNumCol, ""),
            itemDescription: getVal(poData[i], descCol, ""),
            uom: cleanUom(getVal(poData[i], uomCol, ""))
          };
        }
      }
    }
  }

  // 2. Fetch Material Transfers (Shipped & Received Link)
  const transferSheet = SS.getSheetByName(SHEET_STOCK_TRANSFER);
  const transferData = transferSheet ? transferSheet.getDataRange().getValues() : [];
  if (transferData.length > 1) {
    const headers = transferData[0].map(h => h.toString().trim());
    const reqIdCol = getHeaderIndex(headers, "Request_ID");
    const reqWhCol = getHeaderIndex(headers, "RequestingWarehouse");
    const srcWhCol = getHeaderIndex(headers, "SourceWarehouse");
    const prodCol = getHeaderIndex(headers, "ProductID");
    const qtyCol = getHeaderIndex(headers, "RequestedQty");
    const dispQtyCol = getHeaderIndex(headers, "DispatchedQty");
    const recQtyCol = getHeaderIndex(headers, "ReceivedQty");
    const statusCol = getHeaderIndex(headers, "Status");
    const orderCol = getHeaderIndex(headers, "OrderNo");

    for (let i = 1; i < transferData.length; i++) {
      const row = transferData[i];
      if (!getVal(row, reqIdCol, "")) continue;

      const requestingWh = normalizeWarehouseId(getVal(row, reqWhCol, ""));
      const status = getVal(row, statusCol, "");
      const prodId = getVal(row, prodCol, "");
      const sourceWh = normalizeWarehouseId(getVal(row, srcWhCol, ""));

      if (requestingWh === normUserWh) {
        if (prodId && prodId !== "N/A") {
          receivedRawSkusSet.add(prodId.toString().trim().toUpperCase());
          if ((status === 'Received' || status === 'Shipped') && sourceWh) {
            returnWarehouseMap[prodId.toString().trim()] = sourceWh;
          }
        }

        if (status === 'Shipped') {
          const lookup = poSkuLookup[prodId.toString().trim().toUpperCase()] || {
            poNo: "",
            itemDescription: productMap[prodId] || "",
            uom: ""
          };

          data.incomingTransfers.push({
            transferId: getVal(row, reqIdCol, ""),
            orderNo: getVal(row, orderCol, ""),
            productId: prodId,
            productName: lookup.itemDescription || productMap[prodId] || prodId,
            qty: Number(getVal(row, dispQtyCol, getVal(row, qtyCol, 0))),
            uom: lookup.uom,
            poNo: lookup.poNo,
            fromWarehouse: sourceWh
          });
        }

        // 🟢 GUARANTEE: If status is 'Received', ensure it is ALWAYS included in Production Stock!
        if (status === 'Received' && prodId && prodId !== "N/A") {
          const recQty = Number(getVal(row, recQtyCol, getVal(row, dispQtyCol, 0)));
          if (!stockSumMap[prodId] || stockSumMap[prodId] === 0) {
            stockSumMap[prodId] = recQty > 0 ? recQty : 1;
            stockNameMap[prodId] = productMap[prodId] || (poSkuLookup[prodId.toUpperCase()] ? poSkuLookup[prodId.toUpperCase()].itemDescription : prodId);
            stockCatMap[prodId] = "Raw";
          }
        }
      }
    }
  }

  // Build data.myStock from stockSumMap
  Object.keys(stockSumMap).forEach(pId => {
    const totalStock = stockSumMap[pId];
    if (totalStock > 0) {
      data.myStock.push({
        productId: pId,
        productName: stockNameMap[pId] || pId,
        category: stockCatMap[pId] || "Raw",
        stock: totalStock,
        returnWarehouse: returnWarehouseMap[pId] || ""
      });
    }
  });

  // 3. Fetch Production Runs for Current Warehouse
  const prodSheet = SS.getSheetByName(SHEET_PRODUCTION_LOG);
  const prodData = prodSheet ? prodSheet.getDataRange().getValues() : [];
  if (prodData.length > 1) {
    const headers = prodData[0].map(h => h.toString().trim());
    const logIdCol = getHeaderIndex(headers, "Log_ID");
    const dateCol = getHeaderIndex(headers, "Date");
    const pWhCol = autoResolveHeaderIndex(headers, ["ProductionWarehouse", "Production Warehouse", "WarehouseID", "Warehouse"]);
    const rawProdCol = getHeaderIndex(headers, "ProductID_Raw");
    const rawQtyCol = getHeaderIndex(headers, "Qty_Consumed");
    const finProdCol = getHeaderIndex(headers, "ProductID_Finished");
    const finQtyCol = getHeaderIndex(headers, "Qty_Produced");
    const destWhCol = getHeaderIndex(headers, "DestinationWarehouse");
    const qcStatusCol = getHeaderIndex(headers, "QC_Status");
    const qcIdCol = getHeaderIndex(headers, "QC_ID");

    for (let i = 1; i < prodData.length; i++) {
      const row = prodData[i];
      const logId = getVal(row, logIdCol, "");
      if (!logId || logId === "N/A") continue;

      const pWh = normalizeWarehouseId(getVal(row, pWhCol, ""));
      const rawSku = getVal(row, rawProdCol, "").toString().trim().toUpperCase();

      if (pWh === normUserWh && (receivedRawSkusSet.has(rawSku) || rawSku === "N/A")) {
        data.productionRuns.push({
          logId: logId,
          date: getVal(row, dateCol, "") ? new Date(getVal(row, dateCol)).toLocaleDateString() : "",
          rawProductId: getVal(row, rawProdCol, ""),
          rawQtyConsumed: Number(getVal(row, rawQtyCol, 0)),
          finishedProductId: getVal(row, finProdCol, ""),
          finishedQtyProduced: Number(getVal(row, finQtyCol, 0)),
          destinationWarehouse: normalizeWarehouseId(getVal(row, destWhCol, "")),
          qcStatus: getVal(row, qcStatusCol, ""),
          qcId: getVal(row, qcIdCol, "")
        });
      }
    }
  }

  return data;
}

// --- RETURN UNUSED PRODUCTION MATERIAL TO WAREHOUSE ---
function returnProductionMaterial(formData, user) {
  verifyUserRole(user, ["Production", "Administrator"]);
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    const productId = (formData && formData.productId ? formData.productId : "").toString().trim();
    const sourceWh = normalizeWarehouseId(user && user.warehouseId);
    const targetWh = normalizeWarehouseId(formData && formData.targetWarehouse);
    const qty = Number(formData && formData.qty);

    if (!sourceWh) throw new Error("Production warehouse is not configured.");
    if (!productId) throw new Error("Product ID is required.");
    if (!targetWh) throw new Error("Return warehouse is required.");
    // Same WarehouseID is valid when Production and Warehouse share a code.
    // In that case stock is moved between bins, not blocked.
    if (!Number.isFinite(qty) || qty <= 0) throw new Error("Return quantity must be greater than zero.");

    const stockSheet = SS.getSheetByName(SHEET_STOCK_MASTER);
    if (!stockSheet) throw new Error("StockMaster sheet not found.");
    const stockData = stockSheet.getDataRange().getValues();
    if (stockData.length < 2) throw new Error("No production stock is available.");
    const stockHeaders = stockData[0].map(h => (h || "").toString().trim());
    const whCol = autoResolveHeaderIndex(stockHeaders, ["WarehouseID", "Warehouse ID", "Warehouse_ID"]);
    const prodCol = autoResolveHeaderIndex(stockHeaders, ["ProductID", "Product ID", "Unique Code", "SKU"]);
    const qtyCol = autoResolveHeaderIndex(stockHeaders, ["CurrentStock", "Current Stock", "Qty", "Quantity"]);
    if (whCol === -1 || prodCol === -1 || qtyCol === -1) throw new Error("StockMaster columns are not configured correctly.");

    const binCol = autoResolveHeaderIndex(stockHeaders, ["BinLocation", "Bin Location", "Bin"]);
    if (binCol === -1) throw new Error("StockMaster BinLocation column is not configured correctly.");

    let available = 0;
    const productionRows = [];
    for (let i = 1; i < stockData.length; i++) {
      const rowWh = normalizeWarehouseId(stockData[i][whCol]);
      const rowProduct = (stockData[i][prodCol] || "").toString().trim();
      const rowBin = (stockData[i][binCol] || "").toString().trim().toLowerCase();
      const rowQty = Number(stockData[i][qtyCol]) || 0;
      if (rowWh === sourceWh && rowProduct.toUpperCase() === productId.toUpperCase() && rowBin === "inward-staging") {
        available += rowQty;
        productionRows.push({ rowIndex: i + 1, qty: rowQty });
      }
    }
    if (available < qty) {
      throw new Error("Return quantity cannot exceed production stock. Available: " + available + ".");
    }

    const whSheet = SS.getSheetByName(SHEET_WAREHOUSES);
    if (whSheet && whSheet.getLastRow() > 1) {
      const known = whSheet.getRange(2, 1, whSheet.getLastRow() - 1, 1).getValues().flat().map(normalizeWarehouseId);
      if (known.indexOf(targetWh) === -1) throw new Error("Return warehouse does not exist: " + targetWh);
    }

    // Move stock atomically. Deduct ONLY from the Production Inward-Staging
    // rows. This is important when targetWh === sourceWh: the quantity must
    // move to a warehouse-return bin instead of cancelling itself out.
    let remainingToDeduct = qty;
    for (let r = 0; r < productionRows.length && remainingToDeduct > 0; r++) {
      const rowInfo = productionRows[r];
      if (rowInfo.qty <= 0) continue;
      const deduct = Math.min(rowInfo.qty, remainingToDeduct);
      stockSheet.getRange(rowInfo.rowIndex, qtyCol + 1).setValue(rowInfo.qty - deduct);
      updateRowAuditStamp(stockSheet, rowInfo.rowIndex, user);
      remainingToDeduct -= deduct;
    }
    if (remainingToDeduct > 0.0000001) {
      throw new Error("Unable to deduct the complete return quantity from Production Inward-Staging stock.");
    }

    const returnBin = "Returned-From-Production";
    updateStockAndBinQuantityInternal(targetWh, productId, returnBin, qty, user);

    // Keep a trace in the existing stock-transfer ledger without creating a new sheet or workflow.
    const transferSheet = SS.getSheetByName(SHEET_STOCK_TRANSFER);
    if (transferSheet) {
      const reqId = generateLegacyUniqueId_(SHEET_STOCK_TRANSFER, "Request_ID", "RET-", 5, ["Request ID"]);
      const requestedBy = cleanDisplayVal(user && (user.name || user.displayName || user.username || user.email), "Production");
      appendRowByHeaders(transferSheet, {
        "Request_ID": reqId,
        "RequestingWarehouse": targetWh,
        "SourceWarehouse": sourceWh,
        "ProductID": productId,
        "RequestedQty": qty,
        "Status": "Returned",
        "OrderNo": (formData && formData.orderNo ? formData.orderNo : ""),
        "RequestedBy": requestedBy,
        "DispatchedQty": qty,
        "ReceivedQty": qty,
        "Last Edit Status": getAuditStamp(user)
      }, user);
    }

    SpreadsheetApp.flush();
    return {
      status: "success",
      message: qty + " units of " + productId + " returned from " + sourceWh + " to " + targetWh + "."
    };
  } catch (e) {
    throw new Error("Material return failed: " + e.message);
  } finally {
    lock.releaseLock();
  }
}

// --- SUBMIT QC CHECK REQUEST FROM PRODUCTION ---

function requestQCCheck(productionLogId, user) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const prodSheet = SS.getSheetByName(SHEET_PRODUCTION_LOG);
    const prodData = prodSheet.getDataRange().getValues();
    const prodHeaders = prodData[0].map(h => h.toString().trim());

    const logIdCol = getHeaderIndex(prodHeaders, "Log_ID");
    const statusCol = getHeaderIndex(prodHeaders, "QC_Status");
    const qcIdCol = getHeaderIndex(prodHeaders, "QC_ID");
    const whCol = getHeaderIndex(prodHeaders, "ProductionWarehouse");
    const destWhCol = getHeaderIndex(prodHeaders, "DestinationWarehouse");
    const prodFinishedCol = getHeaderIndex(prodHeaders, "ProductID_Finished");
    const qtyProducedCol = getHeaderIndex(prodHeaders, "Qty_Produced");

    let rowIdx = -1;
    for (let i = 1; i < prodData.length; i++) {
      if (getVal(prodData[i], logIdCol) === productionLogId) {
        rowIdx = i + 1;
        break;
      }
    }

    if (rowIdx === -1) throw new Error("Production log run index not found.");

    const currentQCStatus = getVal(prodData[rowIdx - 1], statusCol);
    if (currentQCStatus && currentQCStatus !== "") {
      throw new Error("QC evaluation already requested or completed for this run.");
    }

    const qcId = "QC-" + Math.floor(10000 + Math.random() * 90000);
    const destinationWh = getVal(prodData[rowIdx - 1], destWhCol) || getVal(prodData[rowIdx - 1], whCol);
    const productId = getVal(prodData[rowIdx - 1], prodFinishedCol);
    const qtyToInspect = getVal(prodData[rowIdx - 1], qtyProducedCol);

    prodSheet.getRange(rowIdx, statusCol + 1).setValue("Pending QC");
    prodSheet.getRange(rowIdx, qcIdCol + 1).setValue(qcId);
    updateRowAuditStamp(prodSheet, rowIdx, user);

    const qcSheet = SS.getSheetByName(SHEET_QUALITY_LOG);
    appendRowByHeaders(qcSheet, {
      "QC_ID": qcId,
      "Production_Log_ID": productionLogId,
      "Date_Requested": getFormattedTimestamp(),
      "WarehouseID": normalizeWarehouseId(destinationWh),
      "ProductID": productId,
      "Qty_To_Inspect": qtyToInspect,
      "Status": "Pending",
      "CheckedBy": "",
      "InspectionDate": "",
      "Decision": "",
      "Reason": ""
    }, user);

    SpreadsheetApp.flush();
    return { status: 'success', message: 'Inspection requested. Batch marked for active quality review.' };
  } catch (e) {
    throw new Error("Quality request pipeline disrupted: " + e.message);
  } finally {
    lock.releaseLock();
  }
}

// --- QC DASHBOARD DATA RETRIEVAL ---

function logProduction(formData, user) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    const logSheet = SS.getSheetByName(SHEET_PRODUCTION_LOG);
    const normalizedWh = normalizeWarehouseId(user.warehouseId);
    const normalizedDestWh = normalizeWarehouseId(formData.destinationWarehouse);

    appendRowByHeaders(logSheet, {
      "Log_ID": "PROD-" + Math.floor(1000 + Math.random() * 9000),
      "Date": getFormattedTimestamp(),
      "ProductionWarehouse": normalizedWh,
      "ProductID_Raw": formData.rawProductId,
      "Qty_Consumed": formData.rawQtyConsumed,
      "ProductID_Finished": formData.finishedProductId,
      "Qty_Produced": formData.finishedQtyProduced,
      "DestinationWarehouse": normalizedDestWh,
      "QC_Status": "",
      "QC_ID": "",
      "LoggedBy": user.name
    }, user);

    updateStockAndBinQuantityInternal(normalizedWh, formData.rawProductId, "Inward-Staging", -formData.rawQtyConsumed, user);
    updateStockAndBinQuantityInternal(normalizedDestWh, formData.finishedProductId, "Inward-Staging", formData.finishedQtyProduced, user);

    SpreadsheetApp.flush();
    return { status: 'success', message: 'Production logged. Stock updated and added.' };
  } catch (e) {
    throw new Error("Production run logging interrupted: " + e.message);
  } finally {
    lock.releaseLock();
  }
}

// --- VERIFY USER ROLE (SAFE FOR USER OBJECT OR USERNAME STRING) ---

// ============================================================================
// ORDER-WISE PRODUCTION TRACKING (V11)
// Source: "Sales Order" sheet. This workflow records work only; it does not
// deduct raw material or add finished-goods stock.
// ============================================================================

function requireProductionTrackingRole_(user) {
  verifyUserRole(user, ["Production", "Planner", "Administrator"]);
  if (!user || !(user.username || user.name)) {
    throw new Error("A valid signed-in user is required.");
  }
}

function makeProductionTrackingId_(prefix) {
  const tz = Session.getScriptTimeZone() || "Asia/Kolkata";
  const stamp = Utilities.formatDate(new Date(), tz, "yyyyMMdd-HHmmss");
  const token = Utilities.getUuid().replace(/-/g, "").substring(0, 6).toUpperCase();
  return prefix + "-" + stamp + "-" + token;
}

function getSalesOrderSource_() {
  const info = getSheetDataAndHeaders(SHEET_SALES_ORDER);
  if (!info.headers.length) {
    throw new Error('"Sales Order" sheet is missing or has no header row.');
  }

  const h = info.headers;
  const columns = {
    timestamp: autoResolveHeaderIndex(h, ["Time Stemp", "Time Stamp", "Timestamp"]),
    orderNo: autoResolveHeaderIndex(h, ["Order No", "Order No.", "Order Number", "Sales Order No"]),
    salesPerson: autoResolveHeaderIndex(h, ["Sales Person Name", "Sales Person"]),
    portOfLoading: autoResolveHeaderIndex(h, ["Port of Loading", "Loading Port"]),
    partyName: autoResolveHeaderIndex(h, ["Party Name", "Customer Name", "Client Name"]),
    // Sales Order buyer code is maintained in column AV (48th column).
    buyerCode: 47,
    productId: autoResolveHeaderIndex(h, ["Product Code", "Product ID", "ProductID", "Unique Code", "SKU"]),
    productName: autoResolveHeaderIndex(h, ["Product Name", "Item Name", "Item Description"]),
    description: autoResolveHeaderIndex(h, ["Product Description", "Description", "Item Description"]),
    brand: autoResolveHeaderIndex(h, ["Brand"]),
    quantity: autoResolveHeaderIndex(h, ["Quantity", "Qty", "Order Qty", "Ordered Quantity"]),
    unitSize: autoResolveHeaderIndex(h, ["Unit Size", "UOM", "Unit"]),
    unitPerCarton: autoResolveHeaderIndex(h, ["Unit Per Corton", "Unit Per Carton", "Units Per Carton"]),
    category: autoResolveHeaderIndex(h, ["Category"]),
    packing: autoResolveHeaderIndex(h, ["Packing"]),
    importedBy: autoResolveHeaderIndex(h, ["Imported By"]),
    poi: autoResolveHeaderIndex(h, ["Poi", "POI"]),
    nutrition: autoResolveHeaderIndex(h, ["Nutrition"]),
    ingredients: autoResolveHeaderIndex(h, ["Ingredients"]),
    barcode: autoResolveHeaderIndex(h, ["Barcode"]),
    batchNumber: autoResolveHeaderIndex(h, ["Batch Number", "Batch No"]),
    shelfLife: autoResolveHeaderIndex(h, ["Shelf Life"]),
    mfg: autoResolveHeaderIndex(h, ["Mfg", "Manufacturing"]),
    allergenAdvice: autoResolveHeaderIndex(h, ["Allergen Advice", "Allergen"]),
    netWeight: autoResolveHeaderIndex(h, ["Nt Wt", "Net Wt", "Net Weight"]),
    status: autoResolveHeaderIndex(h, ["Status", "Order Status"])
  };

  if (columns.orderNo === -1 || columns.productId === -1 || columns.productName === -1 || columns.quantity === -1) {
    throw new Error('Sales Order must contain Order No, Product Code, Product Name and Quantity columns.');
  }

  const rows = [];
  info.dataRows.forEach(function(row) {
    const orderNo = getVal(row, columns.orderNo, "").toString().trim();
    const productId = getVal(row, columns.productId, "").toString().trim();
    const productName = getVal(row, columns.productName, "").toString().trim();

    // The supplied workbook contains a numeric column-map row directly below
    // the headers (2, 18, 19...). It is metadata, not a real sales order.
    const isColumnMapRow = orderNo === String(columns.orderNo + 1) &&
      productId === String(columns.productId + 1) &&
      productName === String(columns.productName + 1);
    if (isColumnMapRow || !orderNo || !productId || !productName) return;

    const quantity = Number(getVal(row, columns.quantity, 0));
    if (!Number.isFinite(quantity) || quantity <= 0) return;

    rows.push({
      timestamp: getVal(row, columns.timestamp, ""),
      orderNo: orderNo,
      salesPerson: getVal(row, columns.salesPerson, ""),
      portOfLoading: getVal(row, columns.portOfLoading, ""),
      partyName: getVal(row, columns.partyName, ""),
      buyerCode: getVal(row, columns.buyerCode, ""),
      productId: productId,
      productName: productName,
      description: getVal(row, columns.description, ""),
      brand: getVal(row, columns.brand, ""),
      quantity: quantity,
      unitSize: getVal(row, columns.unitSize, ""),
      unitPerCarton: getVal(row, columns.unitPerCarton, ""),
      category: getVal(row, columns.category, ""),
      packing: getVal(row, columns.packing, ""),
      importedBy: getVal(row, columns.importedBy, ""),
      poi: getVal(row, columns.poi, ""),
      nutrition: getVal(row, columns.nutrition, ""),
      ingredients: getVal(row, columns.ingredients, ""),
      barcode: getVal(row, columns.barcode, ""),
      batchNumber: getVal(row, columns.batchNumber, ""),
      shelfLife: getVal(row, columns.shelfLife, ""),
      mfg: getVal(row, columns.mfg, ""),
      allergenAdvice: getVal(row, columns.allergenAdvice, ""),
      netWeight: getVal(row, columns.netWeight, ""),
      status: getVal(row, columns.status, "")
    });
  });

  // A product can appear on more than one line of the same sales order.
  // Combine those lines so the panel shows one production balance per product.
  const combined = {};
  rows.forEach(function(item) {
    const key = item.orderNo.toUpperCase() + "||" + item.productId.toUpperCase();
    if (!combined[key]) {
      combined[key] = Object.assign({}, item);
    } else {
      combined[key].quantity += item.quantity;
      Object.keys(item).forEach(function(field) {
        if (field !== "quantity" && !combined[key][field] && item[field]) {
          combined[key][field] = item[field];
        }
      });
    }
  });

  return Object.keys(combined).map(function(key) { return combined[key]; });
}

function ensureProductionJobAccess_(job, user) {
  const role = String(user && user.role || "").trim().toLowerCase();
  const userWarehouse = normalizeWarehouseId(user && user.warehouseId);
  if (role === "production" && userWarehouse && job.warehouseId && job.warehouseId !== userWarehouse) {
    throw new Error("Access Denied: This production job belongs to another warehouse.");
  }
}

function readProductionJobs_() {
  const sheet = SS.getSheetByName(SHEET_PRODUCTION_JOBS);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const data = sheet.getDataRange().getValues();
  const h = data[0].map(function(x) { return x.toString().trim(); });
  const c = {
    id: autoResolveHeaderIndex(h, ["Production_ID", "Production ID"]),
    orderNo: autoResolveHeaderIndex(h, ["Order_No", "Order No"]),
    productId: autoResolveHeaderIndex(h, ["Product_ID", "Product ID"]),
    productName: autoResolveHeaderIndex(h, ["Product_Name", "Product Name"]),
    orderQty: autoResolveHeaderIndex(h, ["Order_Qty", "Order Qty"]),
    plannedQty: autoResolveHeaderIndex(h, ["Planned_Production_Qty", "Planned Production Qty"]),
    finalQty: autoResolveHeaderIndex(h, ["Final_Produced_Qty", "Final Produced Qty"]),
    uom: autoResolveHeaderIndex(h, ["UOM", "Unit Size"]),
    unitPerCarton: autoResolveHeaderIndex(h, ["Unit_Per_Carton", "Unit Per Carton"]),
    partyName: autoResolveHeaderIndex(h, ["Party_Name", "Party Name"]),
    warehouseId: autoResolveHeaderIndex(h, ["Warehouse_ID", "Warehouse ID"]),
    materialRequestGroupId: autoResolveHeaderIndex(h, ["Material_Request_Group_ID", "Material Request Group ID"]),
    status: autoResolveHeaderIndex(h, ["Status"]),
    startDate: autoResolveHeaderIndex(h, ["Start_Date", "Start Date"]),
    closingDate: autoResolveHeaderIndex(h, ["Closing_Date", "Closing Date"]),
    startedBy: autoResolveHeaderIndex(h, ["Started_By", "Started By"]),
    closedBy: autoResolveHeaderIndex(h, ["Closed_By", "Closed By"]),
    processDetails: autoResolveHeaderIndex(h, ["Process_Details", "Process Details"]),
    remarks: autoResolveHeaderIndex(h, ["Remarks"]),
    lastEdit: autoResolveHeaderIndex(h, ["Last Edit Status", "Last_Edit_Status"])
  };

  return data.slice(1).map(function(row, index) {
    return {
      rowNumber: index + 2,
      productionId: getVal(row, c.id, ""),
      orderNo: getVal(row, c.orderNo, ""),
      productId: getVal(row, c.productId, ""),
      productName: getVal(row, c.productName, ""),
      orderQty: Number(getVal(row, c.orderQty, 0)) || 0,
      plannedQty: Number(getVal(row, c.plannedQty, 0)) || 0,
      finalQty: Number(getVal(row, c.finalQty, 0)) || 0,
      uom: getVal(row, c.uom, ""),
      unitPerCarton: getVal(row, c.unitPerCarton, ""),
      partyName: getVal(row, c.partyName, ""),
      warehouseId: normalizeWarehouseId(getVal(row, c.warehouseId, "")),
      materialRequestGroupId: getVal(row, c.materialRequestGroupId, ""),
      status: getVal(row, c.status, ""),
      startDate: getVal(row, c.startDate, ""),
      closingDate: getVal(row, c.closingDate, ""),
      startedBy: getVal(row, c.startedBy, ""),
      closedBy: getVal(row, c.closedBy, ""),
      processDetails: getVal(row, c.processDetails, ""),
      remarks: getVal(row, c.remarks, ""),
      lastEditStatus: getVal(row, c.lastEdit, "")
    };
  }).filter(function(job) { return job.productionId; });
}

function readProductionMaterialRequests_(user) {
  const sheet = SS.getSheetByName(SHEET_STOCK_TRANSFER);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const data = sheet.getDataRange().getValues();
  const h = data[0].map(function(value) { return value.toString().trim(); });
  const c = {
    requestId: getHeaderIndex(h, "Request_ID"),
    requestingWarehouse: getHeaderIndex(h, "RequestingWarehouse"),
    sourceWarehouse: getHeaderIndex(h, "SourceWarehouse"),
    productId: getHeaderIndex(h, "ProductID"),
    requestedQty: getHeaderIndex(h, "RequestedQty"),
    dispatchedQty: getHeaderIndex(h, "DispatchedQty"),
    receivedQty: getHeaderIndex(h, "ReceivedQty"),
    status: getHeaderIndex(h, "Status"),
    orderNo: getHeaderIndex(h, "OrderNo"),
    requestedBy: getHeaderIndex(h, "RequestedBy"),
    requestType: getHeaderIndex(h, "RequestType"),
    requestGroupId: getHeaderIndex(h, "RequestGroupID"),
    productionId: getHeaderIndex(h, "Production_ID"),
    finalProductId: getHeaderIndex(h, "FinalProductID"),
    finalProductName: getHeaderIndex(h, "FinalProductName"),
    requestRemarks: getHeaderIndex(h, "RequestRemarks"),
    lastEditStatus: getHeaderIndex(h, "Last Edit Status")
  };
  const role = String(user && user.role || "").trim().toLowerCase();
  const userWarehouse = normalizeWarehouseId(user && user.warehouseId);

  return data.slice(1).map(function(row) {
    return {
      requestId: getVal(row, c.requestId, ""),
      requestingWarehouse: normalizeWarehouseId(getVal(row, c.requestingWarehouse, "")),
      sourceWarehouse: normalizeWarehouseId(getVal(row, c.sourceWarehouse, "")),
      productId: getVal(row, c.productId, ""),
      requestedQty: Number(getVal(row, c.requestedQty, 0)) || 0,
      dispatchedQty: Number(getVal(row, c.dispatchedQty, 0)) || 0,
      receivedQty: Number(getVal(row, c.receivedQty, 0)) || 0,
      status: getVal(row, c.status, ""),
      orderNo: getVal(row, c.orderNo, ""),
      requestedBy: getVal(row, c.requestedBy, ""),
      requestType: getVal(row, c.requestType, ""),
      requestGroupId: getVal(row, c.requestGroupId, ""),
      productionId: getVal(row, c.productionId, ""),
      finalProductId: getVal(row, c.finalProductId, ""),
      finalProductName: getVal(row, c.finalProductName, ""),
      requestRemarks: getVal(row, c.requestRemarks, ""),
      lastEditStatus: getVal(row, c.lastEditStatus, "")
    };
  }).filter(function(request) {
    if (!request.requestId || request.requestType.toLowerCase() !== "production material") return false;
    return role !== "production" || !userWarehouse || request.requestingWarehouse === userWarehouse;
  });
}

function getProductionMaterialGate_(productionId) {
  const id = cleanDisplayVal(productionId, "");
  if (!id) return { hasRequests: false, allReceived: true, pendingStatuses: [], requests: [] };

  const sheet = SS.getSheetByName(SHEET_STOCK_TRANSFER);
  if (!sheet || sheet.getLastRow() < 2) {
    return { hasRequests: false, allReceived: true, pendingStatuses: [], requests: [] };
  }

  const data = sheet.getDataRange().getValues();
  const h = data[0].map(function(value) { return value.toString().trim(); });
  const productionIdCol = getHeaderIndex(h, "Production_ID");
  const requestIdCol = getHeaderIndex(h, "Request_ID");
  const requestTypeCol = getHeaderIndex(h, "RequestType");
  const statusCol = getHeaderIndex(h, "Status");
  const productIdCol = getHeaderIndex(h, "ProductID");
  if (productionIdCol === -1) {
    return { hasRequests: false, allReceived: true, pendingStatuses: [], requests: [] };
  }

  const requests = data.slice(1).filter(function(row) {
    return getVal(row, productionIdCol, "") === id &&
      String(getVal(row, requestTypeCol, "")).toLowerCase() === "production material";
  }).map(function(row) {
    return {
      requestId: getVal(row, requestIdCol, ""),
      productId: getVal(row, productIdCol, ""),
      status: cleanDisplayVal(getVal(row, statusCol, ""), "Pending")
    };
  });

  const pendingStatuses = requests.filter(function(request) {
    return request.status.toLowerCase() !== "received";
  }).map(function(request) {
    return (request.productId || request.requestId || "Material") + ": " + request.status;
  });

  return {
    hasRequests: requests.length > 0,
    allReceived: requests.length > 0 && pendingStatuses.length === 0,
    pendingStatuses: pendingStatuses,
    requests: requests
  };
}

function syncProductionJobMaterialStatus_(productionId, user) {
  const id = cleanDisplayVal(productionId, "");
  if (!id) return;
  const gate = getProductionMaterialGate_(id);
  if (!gate.hasRequests) return;

  const jobsSheet = SS.getSheetByName(SHEET_PRODUCTION_JOBS);
  if (!jobsSheet || jobsSheet.getLastRow() < 2) return;
  const data = jobsSheet.getDataRange().getValues();
  const h = data[0].map(function(value) { return value.toString().trim(); });
  const idCol = autoResolveHeaderIndex(h, ["Production_ID", "Production ID"]);
  const statusCol = autoResolveHeaderIndex(h, ["Status"]);
  const auditCol = autoResolveHeaderIndex(h, ["Last Edit Status", "Last_Edit_Status"]);

  for (let i = 1; i < data.length; i++) {
    if (getVal(data[i], idCol, "") !== id) continue;
    const currentStatus = String(getVal(data[i], statusCol, "")).toLowerCase();
    if (currentStatus === "completed" || currentStatus === "cancelled") return;
    jobsSheet.getRange(i + 1, statusCol + 1).setValue(gate.allReceived ? "Ready for Production" : "Waiting for Material");
    if (auditCol !== -1) jobsSheet.getRange(i + 1, auditCol + 1).setValue(getAuditStamp(user));
    return;
  }
}

function getProductionTrackingData(user) {
  requireProductionTrackingRole_(user);
  ensureSchemaReady();

  const sourceRows = getSalesOrderSource_();
  const orderMap = {};
  sourceRows.forEach(function(item) {
    if (!orderMap[item.orderNo]) {
      orderMap[item.orderNo] = {
        orderNo: item.orderNo,
        partyName: item.partyName,
        buyerCode: item.buyerCode,
        salesPerson: item.salesPerson,
        productCount: 0,
        totalOrderQty: 0
      };
    }
    orderMap[item.orderNo].productCount++;
    orderMap[item.orderNo].totalOrderQty += item.quantity;
  });

  let jobs = readProductionJobs_();
  const userWh = normalizeWarehouseId(user && user.warehouseId);
  const role = String(user && user.role || "").toLowerCase();
  if (role === "production" && userWh) {
    jobs = jobs.filter(function(job) { return !job.warehouseId || job.warehouseId === userWh; });
  }

  return {
    orders: Object.keys(orderMap).sort().map(function(key) { return orderMap[key]; }),
    jobs: jobs,
    materialRequests: readProductionMaterialRequests_(user)
  };
}

function getSalesOrderProducts(orderNo, user) {
  requireProductionTrackingRole_(user);
  const wanted = cleanDisplayVal(orderNo, "");
  if (!wanted) throw new Error("Order No is required.");

  const jobs = readProductionJobs_();
  const plannedMap = {};
  jobs.forEach(function(job) {
    if (job.orderNo === wanted && String(job.status).toLowerCase() !== "cancelled") {
      const key = job.productId.toUpperCase();
      plannedMap[key] = (plannedMap[key] || 0) + Number(job.plannedQty || 0);
    }
  });

  const products = getSalesOrderSource_().filter(function(item) {
    return item.orderNo === wanted;
  }).map(function(item) {
    const alreadyGeneratedQty = plannedMap[item.productId.toUpperCase()] || 0;
    return Object.assign({}, item, {
      alreadyGeneratedQty: alreadyGeneratedQty,
      balanceQty: Math.max(0, item.quantity - alreadyGeneratedQty)
    });
  });

  if (!products.length) throw new Error("No products found for Order No " + wanted + ".");
  return products;
}

function getProductionMaterialRequestOptions(user) {
  requireProductionTrackingRole_(user);
  const report = getStockReport() || { warehouses: [], reportData: [] };
  const productionWarehouse = normalizeWarehouseId(user && user.warehouseId);
  const items = (report.reportData || []).map(function(item) {
    const stocks = {};
    Object.keys(item.warehouseStocks || {}).forEach(function(warehouseId) {
      const normalizedWarehouse = normalizeWarehouseId(warehouseId);
      const qty = Number(item.warehouseStocks[warehouseId]) || 0;
      if (normalizedWarehouse && qty > 0) stocks[normalizedWarehouse] = qty;
    });
    return {
      productId: cleanDisplayVal(item.productId, ""),
      productName: cleanDisplayVal(item.productName, ""),
      uom: cleanDisplayVal(item.uom, ""),
      warehouseStocks: stocks
    };
  }).filter(function(item) { return item.productId && Object.keys(item.warehouseStocks).length; });

  const warehouses = (report.warehouses || []).map(normalizeWarehouseId).filter(function(warehouseId, index, all) {
    return warehouseId && warehouseId !== productionWarehouse && all.indexOf(warehouseId) === index &&
      items.some(function(item) { return Number(item.warehouseStocks[warehouseId] || 0) > 0; });
  });

  return {
    productionWarehouse: productionWarehouse,
    warehouses: warehouses,
    items: items
  };
}

function createProductionMaterialRequest(payload, user) {
  requireProductionTrackingRole_(user);
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    ensureSchemaReady();

    const orderNo = cleanDisplayVal(payload && payload.orderNo, "");
    const finalProductId = cleanDisplayVal(payload && payload.finalProductId, "");
    const sourceWarehouse = normalizeWarehouseId(payload && payload.sourceWarehouse);
    const requestingWarehouse = normalizeWarehouseId(user && user.warehouseId);
    const remarks = cleanDisplayVal(payload && payload.remarks, "");
    const materials = payload && Array.isArray(payload.materials) ? payload.materials : [];

    if (!orderNo) throw new Error("Order No is required.");
    if (!finalProductId) throw new Error("Selected production product is required.");
    if (!requestingWarehouse) throw new Error("Production warehouse is not configured for this user.");
    if (!sourceWarehouse) throw new Error("Source warehouse is required.");
    if (sourceWarehouse === requestingWarehouse) {
      throw new Error("Source warehouse and production warehouse must be different.");
    }
    if (!materials.length || materials.length > 50) throw new Error("Select between 1 and 50 required production items.");

    const salesProduct = getSalesOrderSource_().find(function(item) {
      return item.orderNo === orderNo && item.productId.toUpperCase() === finalProductId.toUpperCase();
    });
    if (!salesProduct) throw new Error("Selected product does not belong to Sales Order " + orderNo + ".");

    const report = getStockReport() || { reportData: [] };
    const sourceStock = {};
    (report.reportData || []).forEach(function(item) {
      const key = cleanDisplayVal(item.productId, "").toUpperCase();
      if (!key) return;
      sourceStock[key] = {
        productId: cleanDisplayVal(item.productId, ""),
        productName: cleanDisplayVal(item.productName, ""),
        availableQty: Number((item.warehouseStocks || {})[sourceWarehouse]) || 0
      };
    });

    const seen = {};
    const validated = materials.map(function(material, index) {
      const requestedProductId = cleanDisplayVal(material && material.productId, "");
      const requestedQty = Number(material && material.qty);
      const key = requestedProductId.toUpperCase();
      if (!requestedProductId || !sourceStock[key]) {
        throw new Error("Required item " + (index + 1) + " is invalid.");
      }
      if (seen[key]) throw new Error("Duplicate required item selected: " + requestedProductId + ".");
      if (!Number.isFinite(requestedQty) || requestedQty <= 0) {
        throw new Error("Valid quantity is required for item " + (index + 1) + ".");
      }
      if (requestedQty > sourceStock[key].availableQty) {
        throw new Error(sourceStock[key].productName + " request exceeds available stock " + sourceStock[key].availableQty + " in " + sourceWarehouse + ".");
      }
      seen[key] = true;
      return {
        productId: sourceStock[key].productId,
        productName: sourceStock[key].productName,
        qty: requestedQty
      };
    });

    const transferSheet = SS.getSheetByName(SHEET_STOCK_TRANSFER);
    if (!transferSheet) throw new Error("StockTransferRequest sheet is missing.");
    const requestGroupId = makeProductionTrackingId_("PMR");
    const requestedBy = cleanDisplayVal(user && (user.name || user.username), "Production");
    const audit = getAuditStamp(user);
    const requestIds = [];

    validated.forEach(function(material) {
      const requestId = makeProductionTrackingId_("REQ");
      appendRowByHeaders(transferSheet, {
        "Request_ID": requestId,
        "RequestingWarehouse": requestingWarehouse,
        "SourceWarehouse": sourceWarehouse,
        "ProductID": material.productId,
        "RequestedQty": material.qty,
        "Status": "Approved",
        "OrderNo": orderNo,
        "RequestedBy": requestedBy,
        "DispatchedQty": 0,
        "ReceivedQty": 0,
        "RequestType": "Production Material",
        "RequestGroupID": requestGroupId,
        "FinalProductID": salesProduct.productId,
        "FinalProductName": salesProduct.productName,
        "RequestRemarks": remarks,
        "Last Edit Status": audit
      }, user);
      requestIds.push(requestId);
    });

    SpreadsheetApp.flush();
    return {
      status: "success",
      requestGroupId: requestGroupId,
      requestIds: requestIds,
      message: validated.length + " production material request(s) sent to warehouse " + sourceWarehouse + " for Order " + orderNo + "."
    };
  } catch (e) {
    throw new Error("Production material request failed: " + e.message);
  } finally {
    lock.releaseLock();
  }
}

function createProductionMaterialRequestsBatch(payload, user) {
  requireProductionTrackingRole_(user);
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(25000);
    ensureSchemaReady();

    const requests = payload && Array.isArray(payload.requests) ? payload.requests : [];
    if (!requests.length) throw new Error("No selected production items were provided.");
    if (requests.length > 20) throw new Error("Maximum 20 production items can be requested in one batch.");

    const requestingWarehouse = normalizeWarehouseId(user && user.warehouseId);
    if (!requestingWarehouse) throw new Error("Production warehouse is not configured for this user.");

    const salesProducts = getSalesOrderSource_();
    const salesMap = {};
    salesProducts.forEach(function(item) {
      salesMap[item.orderNo.toUpperCase() + "||" + item.productId.toUpperCase()] = item;
    });

    const report = getStockReport() || { reportData: [] };
    const stockMap = {};
    (report.reportData || []).forEach(function(item) {
      const productKey = cleanDisplayVal(item.productId, "").toUpperCase();
      if (!productKey) return;
      Object.keys(item.warehouseStocks || {}).forEach(function(warehouseId) {
        const warehouseKey = normalizeWarehouseId(warehouseId);
        if (!warehouseKey) return;
        if (!stockMap[warehouseKey]) stockMap[warehouseKey] = {};
        stockMap[warehouseKey][productKey] = {
          productId: cleanDisplayVal(item.productId, ""),
          productName: cleanDisplayVal(item.productName, ""),
          availableQty: Number(item.warehouseStocks[warehouseId]) || 0
        };
      });
    });

    const cumulativeRequested = {};
    const selectedFinalProducts = {};
    const appendPlans = [];
    const jobPlans = [];
    const requestGroupIds = [];
    const existingPlanned = {};
    readProductionJobs_().forEach(function(job) {
      if (String(job.status || "").toLowerCase() === "cancelled") return;
      const key = String(job.orderNo || "").toUpperCase() + "||" + String(job.productId || "").toUpperCase();
      existingPlanned[key] = (existingPlanned[key] || 0) + Number(job.plannedQty || 0);
    });
    const batchPlanned = {};

    requests.forEach(function(request, requestIndex) {
      const orderNo = cleanDisplayVal(request && request.orderNo, "");
      const finalProductId = cleanDisplayVal(request && request.finalProductId, "");
      const sourceWarehouse = normalizeWarehouseId(request && request.sourceWarehouse);
      const remarks = cleanDisplayVal(request && request.remarks, "");
      const jobRemarks = cleanDisplayVal(request && request.jobRemarks, "");
      const plannedQty = Number(request && request.plannedQty);
      const materials = request && Array.isArray(request.materials) ? request.materials : [];

      if (!orderNo || !finalProductId) throw new Error("Row " + (requestIndex + 1) + " has invalid order/product details.");
      if (!sourceWarehouse) throw new Error("Row " + (requestIndex + 1) + ": Source Warehouse is required.");
      if (sourceWarehouse === requestingWarehouse) throw new Error("Row " + (requestIndex + 1) + ": Source and production warehouse must be different.");
      if (!materials.length || materials.length > 50) throw new Error("Row " + (requestIndex + 1) + " must contain between 1 and 50 required items.");

      const finalKey = orderNo.toUpperCase() + "||" + finalProductId.toUpperCase();
      const salesProduct = salesMap[finalKey];
      if (!salesProduct) throw new Error("Row " + (requestIndex + 1) + ": Selected item does not belong to Order " + orderNo + ".");
      if (selectedFinalProducts[finalKey]) throw new Error("Duplicate selected production item: " + finalProductId + ".");
      if (!Number.isFinite(plannedQty) || plannedQty <= 0) throw new Error("Row " + (requestIndex + 1) + ": Production Qty must be greater than zero.");
      const availableProductionQty = Math.max(0, salesProduct.quantity - (existingPlanned[finalKey] || 0) - (batchPlanned[finalKey] || 0));
      if (plannedQty > availableProductionQty) {
        throw new Error("Row " + (requestIndex + 1) + ": Production Qty exceeds remaining order quantity " + availableProductionQty + ".");
      }
      batchPlanned[finalKey] = (batchPlanned[finalKey] || 0) + plannedQty;
      selectedFinalProducts[finalKey] = true;

      const sourceItems = stockMap[sourceWarehouse] || {};
      const rowMaterialSeen = {};
      const requestGroupId = makeProductionTrackingId_("PMR");
      const productionId = makeProductionTrackingId_("PJOB");
      requestGroupIds.push(requestGroupId);
      jobPlans.push({
        productionId: productionId,
        requestGroupId: requestGroupId,
        salesProduct: salesProduct,
        plannedQty: plannedQty,
        remarks: jobRemarks
      });

      materials.forEach(function(material, materialIndex) {
        const requestedProductId = cleanDisplayVal(material && material.productId, "");
        const requestedQty = Number(material && material.qty);
        const materialKey = requestedProductId.toUpperCase();
        const stockItem = sourceItems[materialKey];
        if (!requestedProductId || !stockItem || stockItem.availableQty <= 0) {
          throw new Error("Row " + (requestIndex + 1) + ", Required Item " + (materialIndex + 1) + " is not available in " + sourceWarehouse + ".");
        }
        if (rowMaterialSeen[materialKey]) throw new Error("Row " + (requestIndex + 1) + " contains duplicate item " + requestedProductId + ".");
        if (!Number.isFinite(requestedQty) || requestedQty <= 0) {
          throw new Error("Row " + (requestIndex + 1) + ", Qty " + (materialIndex + 1) + " must be greater than zero.");
        }

        const cumulativeKey = sourceWarehouse + "||" + materialKey;
        cumulativeRequested[cumulativeKey] = (cumulativeRequested[cumulativeKey] || 0) + requestedQty;
        if (cumulativeRequested[cumulativeKey] > stockItem.availableQty) {
          throw new Error(stockItem.productName + " total requested quantity exceeds available stock " + stockItem.availableQty + " in " + sourceWarehouse + ".");
        }
        rowMaterialSeen[materialKey] = true;
        appendPlans.push({
          requestGroupId: requestGroupId,
          productionId: productionId,
          orderNo: orderNo,
          sourceWarehouse: sourceWarehouse,
          finalProductId: salesProduct.productId,
          finalProductName: salesProduct.productName,
          requestedProductId: stockItem.productId,
          requestedQty: requestedQty,
          remarks: remarks
        });
      });
    });

    const transferSheet = SS.getSheetByName(SHEET_STOCK_TRANSFER);
    if (!transferSheet) throw new Error("StockTransferRequest sheet is missing.");
    const jobsSheet = SS.getSheetByName(SHEET_PRODUCTION_JOBS);
    if (!jobsSheet) throw new Error("ProductionJobs sheet is missing.");
    const requestedBy = cleanDisplayVal(user && (user.name || user.username), "Production");
    const audit = getAuditStamp(user);
    const now = getFormattedTimestamp();

    appendPlans.forEach(function(plan) {
      appendRowByHeaders(transferSheet, {
        "Request_ID": makeProductionTrackingId_("REQ"),
        "RequestingWarehouse": requestingWarehouse,
        "SourceWarehouse": plan.sourceWarehouse,
        "ProductID": plan.requestedProductId,
        "RequestedQty": plan.requestedQty,
        "Status": "Approved",
        "OrderNo": plan.orderNo,
        "RequestedBy": requestedBy,
        "DispatchedQty": 0,
        "ReceivedQty": 0,
        "RequestType": "Production Material",
        "RequestGroupID": plan.requestGroupId,
        "Production_ID": plan.productionId,
        "FinalProductID": plan.finalProductId,
        "FinalProductName": plan.finalProductName,
        "RequestRemarks": plan.remarks,
        "Last Edit Status": audit
      }, user);
    });

    jobPlans.forEach(function(jobPlan) {
      const source = jobPlan.salesProduct;
      appendRowByHeaders(jobsSheet, {
        "Production_ID": jobPlan.productionId,
        "Order_No": source.orderNo,
        "Product_ID": source.productId,
        "Product_Name": source.productName,
        "Order_Qty": source.quantity,
        "Planned_Production_Qty": jobPlan.plannedQty,
        "Final_Produced_Qty": "",
        "UOM": source.unitSize,
        "Unit_Per_Carton": source.unitPerCarton,
        "Party_Name": source.partyName,
        "Warehouse_ID": requestingWarehouse,
        "Material_Request_Group_ID": jobPlan.requestGroupId,
        "Status": "Waiting for Material",
        "Start_Date": now,
        "Closing_Date": "",
        "Started_By": requestedBy,
        "Closed_By": "",
        "Process_Details": "",
        "Remarks": jobPlan.remarks,
        "Last Edit Status": audit
      }, user);
    });

    SpreadsheetApp.flush();
    return {
      status: "success",
      requestGroupIds: requestGroupIds,
      requestCount: appendPlans.length,
      productionIds: jobPlans.map(function(jobPlan) { return jobPlan.productionId; }),
      message: appendPlans.length + " material request(s) warehouse ko bhej diye gaye aur " + jobPlans.length + " Production Job(s) Waiting for Material status mein generate ho gaye."
    };
  } catch (e) {
    throw new Error("Production material request batch failed: " + e.message);
  } finally {
    lock.releaseLock();
  }
}

function createProductionJobs(payload, user) {
  requireProductionTrackingRole_(user);
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    ensureSchemaReady();

    const orderNo = cleanDisplayVal(payload && payload.orderNo, "");
    const items = payload && Array.isArray(payload.items) ? payload.items : [];
    if (!orderNo) throw new Error("Order No is required.");
    if (!items.length) throw new Error("Select at least one product.");

    const sourceProducts = getSalesOrderSource_().filter(function(item) { return item.orderNo === orderNo; });
    const sourceMap = {};
    sourceProducts.forEach(function(item) { sourceMap[item.productId.toUpperCase()] = item; });

    const existingJobs = readProductionJobs_();
    const existingPlanned = {};
    existingJobs.forEach(function(job) {
      if (job.orderNo === orderNo && String(job.status).toLowerCase() !== "cancelled") {
        const key = job.productId.toUpperCase();
        existingPlanned[key] = (existingPlanned[key] || 0) + Number(job.plannedQty || 0);
      }
    });

    const seen = {};
    const validated = items.map(function(item) {
      const productId = cleanDisplayVal(item && item.productId, "");
      const plannedQty = Number(item && item.plannedQty);
      const key = productId.toUpperCase();
      if (!productId || !sourceMap[key]) throw new Error("Invalid product selected: " + productId);
      if (seen[key]) throw new Error("Duplicate product selected: " + productId);
      if (!Number.isFinite(plannedQty) || plannedQty <= 0) throw new Error("Production quantity must be greater than zero for " + productId + ".");

      const source = sourceMap[key];
      const available = Math.max(0, source.quantity - (existingPlanned[key] || 0));
      if (plannedQty > available) {
        throw new Error("Production quantity for " + source.productName + " exceeds remaining order quantity " + available + ".");
      }
      seen[key] = true;
      return { source: source, plannedQty: plannedQty };
    });

    const sheet = SS.getSheetByName(SHEET_PRODUCTION_JOBS);
    const startedBy = cleanDisplayVal(user.name || user.username, "");
    const warehouseId = normalizeWarehouseId(user.warehouseId);
    const now = getFormattedTimestamp();
    const audit = getAuditStamp(user);
    const createdIds = [];

    validated.forEach(function(entry) {
      const productionId = makeProductionTrackingId_("PJOB");
      const source = entry.source;
      appendRowByHeaders(sheet, {
        "Production_ID": productionId,
        "Order_No": orderNo,
        "Product_ID": source.productId,
        "Product_Name": source.productName,
        "Order_Qty": source.quantity,
        "Planned_Production_Qty": entry.plannedQty,
        "Final_Produced_Qty": "",
        "UOM": source.unitSize,
        "Unit_Per_Carton": source.unitPerCarton,
        "Party_Name": source.partyName,
        "Warehouse_ID": warehouseId,
        "Status": "In Progress",
        "Start_Date": now,
        "Closing_Date": "",
        "Started_By": startedBy,
        "Closed_By": "",
        "Process_Details": "",
        "Remarks": cleanDisplayVal(payload.remarks, ""),
        "Last Edit Status": audit
      }, user);
      createdIds.push(productionId);
    });

    SpreadsheetApp.flush();
    return {
      status: "success",
      message: createdIds.length + " production job" + (createdIds.length === 1 ? "" : "s") + " generated successfully.",
      productionIds: createdIds
    };
  } catch (e) {
    throw new Error("Production job generation failed: " + e.message);
  } finally {
    lock.releaseLock();
  }
}

function readProductionMergeDetails_(productionId) {
  const sheet = SS.getSheetByName(SHEET_PRODUCTION_MERGE_DETAILS);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const data = sheet.getDataRange().getValues();
  const h = data[0].map(function(x) { return x.toString().trim(); });
  const c = {
    mergeId: autoResolveHeaderIndex(h, ["Merge_ID", "Merge ID"]),
    productionId: autoResolveHeaderIndex(h, ["Production_ID", "Production ID"]),
    itemId: autoResolveHeaderIndex(h, ["Merged_Item_ID", "Merged Item ID"]),
    itemName: autoResolveHeaderIndex(h, ["Merged_Item_Name", "Merged Item Name"]),
    qty: autoResolveHeaderIndex(h, ["Merged_Qty", "Merged Qty"]),
    uom: autoResolveHeaderIndex(h, ["UOM"]),
    work: autoResolveHeaderIndex(h, ["Work_Details", "Work Details"]),
    enteredBy: autoResolveHeaderIndex(h, ["Entered_By", "Entered By"]),
    entryDate: autoResolveHeaderIndex(h, ["Entry_Date", "Entry Date"]),
    remarks: autoResolveHeaderIndex(h, ["Remarks"])
  };

  return data.slice(1).filter(function(row) {
    return getVal(row, c.productionId, "") === productionId;
  }).map(function(row) {
    return {
      mergeId: getVal(row, c.mergeId, ""),
      itemId: getVal(row, c.itemId, ""),
      itemName: getVal(row, c.itemName, ""),
      qty: Number(getVal(row, c.qty, 0)) || 0,
      uom: getVal(row, c.uom, ""),
      workDetails: getVal(row, c.work, ""),
      enteredBy: getVal(row, c.enteredBy, ""),
      entryDate: getVal(row, c.entryDate, ""),
      remarks: getVal(row, c.remarks, "")
    };
  });
}

function readProductionReceivedMaterials_(productionId) {
  const sheet = SS.getSheetByName(SHEET_STOCK_TRANSFER);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const data = sheet.getDataRange().getValues();
  const h = data[0].map(function(value) { return value.toString().trim(); });
  const c = {
    requestId: getHeaderIndex(h, "Request_ID"),
    productionId: getHeaderIndex(h, "Production_ID"),
    requestType: getHeaderIndex(h, "RequestType"),
    productId: getHeaderIndex(h, "ProductID"),
    sourceWarehouse: getHeaderIndex(h, "SourceWarehouse"),
    receivedQty: getHeaderIndex(h, "ReceivedQty"),
    status: getHeaderIndex(h, "Status")
  };

  return data.slice(1).filter(function(row) {
    return getVal(row, c.productionId, "") === productionId &&
      String(getVal(row, c.requestType, "")).toLowerCase() === "production material";
  }).map(function(row) {
    const productId = cleanDisplayVal(getVal(row, c.productId, ""), "");
    const details = getProductDetailsFromPO(productId) || {};
    return {
      requestId: getVal(row, c.requestId, ""),
      productId: productId,
      productName: cleanDisplayVal(details.name, productId),
      sourceWarehouse: normalizeWarehouseId(getVal(row, c.sourceWarehouse, "")),
      receivedQty: Number(getVal(row, c.receivedQty, 0)) || 0,
      status: cleanDisplayVal(getVal(row, c.status, ""), "")
    };
  });
}

function readProductionMaterialClosureDetails_(productionId) {
  const sheet = SS.getSheetByName(SHEET_PRODUCTION_MATERIAL_CLOSURE);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const data = sheet.getDataRange().getValues();
  const h = data[0].map(function(value) { return value.toString().trim(); });
  const c = {
    productionId: getHeaderIndex(h, "Production_ID"),
    requestId: getHeaderIndex(h, "Request_ID"),
    materialId: getHeaderIndex(h, "Material_ID"),
    materialName: getHeaderIndex(h, "Material_Name"),
    sourceWarehouse: getHeaderIndex(h, "Source_Warehouse"),
    productionWarehouse: getHeaderIndex(h, "Production_Warehouse"),
    receivedQty: getHeaderIndex(h, "Received_Qty"),
    usedQty: getHeaderIndex(h, "Used_Qty"),
    returnedQty: getHeaderIndex(h, "Returned_Qty"),
    closingDate: getHeaderIndex(h, "Closing_Date")
  };
  return data.slice(1).filter(function(row) {
    return getVal(row, c.productionId, "") === productionId;
  }).map(function(row) {
    return {
      requestId: getVal(row, c.requestId, ""),
      materialId: getVal(row, c.materialId, ""),
      materialName: getVal(row, c.materialName, ""),
      sourceWarehouse: getVal(row, c.sourceWarehouse, ""),
      productionWarehouse: getVal(row, c.productionWarehouse, ""),
      receivedQty: Number(getVal(row, c.receivedQty, 0)) || 0,
      usedQty: Number(getVal(row, c.usedQty, 0)) || 0,
      returnedQty: Number(getVal(row, c.returnedQty, 0)) || 0,
      closingDate: getVal(row, c.closingDate, "")
    };
  });
}

function getWarehouseMaterialStockTotals_(warehouseId) {
  const sheet = SS.getSheetByName(SHEET_STOCK_MASTER);
  if (!sheet || sheet.getLastRow() < 2) return {};
  const data = sheet.getDataRange().getValues();
  const h = data[0].map(function(value) { return value.toString().trim(); });
  const warehouseCol = autoResolveHeaderIndex(h, ["WarehouseID", "Warehouse ID", "Warehouse_ID"]);
  const productCol = autoResolveHeaderIndex(h, ["ProductID", "Product ID", "Unique Code", "SKU"]);
  const qtyCol = autoResolveHeaderIndex(h, ["CurrentStock", "Current Stock", "Qty", "Quantity"]);
  const targetWarehouse = normalizeWarehouseId(warehouseId);
  const totals = {};
  data.slice(1).forEach(function(row) {
    if (normalizeWarehouseId(getVal(row, warehouseCol, "")) !== targetWarehouse) return;
    const productKey = cleanDisplayVal(getVal(row, productCol, ""), "").toUpperCase();
    if (!productKey) return;
    totals[productKey] = (totals[productKey] || 0) + (Number(getVal(row, qtyCol, 0)) || 0);
  });
  return totals;
}

function getProductionJobDetails(productionId, user) {
  requireProductionTrackingRole_(user);
  const id = cleanDisplayVal(productionId, "");
  const job = readProductionJobs_().find(function(x) { return x.productionId === id; });
  if (!job) throw new Error("Production job not found: " + id);
  ensureProductionJobAccess_(job, user);
  return {
    job: job,
    materials: readProductionReceivedMaterials_(id),
    materialClosureDetails: readProductionMaterialClosureDetails_(id),
    mergeDetails: readProductionMergeDetails_(id)
  };
}

function closeProductionJob(payload, user) {
  requireProductionTrackingRole_(user);
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    ensureSchemaReady();

    const productionId = cleanDisplayVal(payload && payload.productionId, "");
    const finalQty = Number(payload && payload.finalProducedQty);
    const remarks = cleanDisplayVal(payload && payload.remarks, "");
    const returnItems = payload && Array.isArray(payload.returnItems) ? payload.returnItems : [];

    if (!productionId) throw new Error("Production ID is required.");
    if (!Number.isFinite(finalQty) || finalQty <= 0) throw new Error("Final produced quantity must be greater than zero.");

    const jobsSheet = SS.getSheetByName(SHEET_PRODUCTION_JOBS);
    const data = jobsSheet.getDataRange().getValues();
    const h = data[0].map(function(x) { return x.toString().trim(); });
    const idCol = autoResolveHeaderIndex(h, ["Production_ID", "Production ID"]);
    const statusCol = autoResolveHeaderIndex(h, ["Status"]);
    const finalCol = autoResolveHeaderIndex(h, ["Final_Produced_Qty", "Final Produced Qty"]);
    const closeDateCol = autoResolveHeaderIndex(h, ["Closing_Date", "Closing Date"]);
    const closedByCol = autoResolveHeaderIndex(h, ["Closed_By", "Closed By"]);
    const processCol = autoResolveHeaderIndex(h, ["Process_Details", "Process Details"]);
    const remarksCol = autoResolveHeaderIndex(h, ["Remarks"]);
    const auditCol = autoResolveHeaderIndex(h, ["Last Edit Status", "Last_Edit_Status"]);

    let rowNumber = -1;
    let jobRow = null;
    for (let i = 1; i < data.length; i++) {
      if (getVal(data[i], idCol, "") === productionId) {
        rowNumber = i + 1;
        jobRow = data[i];
        break;
      }
    }
    if (rowNumber === -1) throw new Error("Production job not found: " + productionId);
    const warehouseCol = autoResolveHeaderIndex(h, ["Warehouse_ID", "Warehouse ID"]);
    const productionWarehouse = normalizeWarehouseId(getVal(jobRow, warehouseCol, ""));
    ensureProductionJobAccess_({ warehouseId: productionWarehouse }, user);
    if (String(getVal(jobRow, statusCol, "")).toLowerCase() === "completed") {
      throw new Error("This production job is already closed.");
    }

    const materialGate = getProductionMaterialGate_(productionId);
    if (materialGate.hasRequests && !materialGate.allReceived) {
      throw new Error("Production cannot be closed until all requested materials are fully received. Pending: " + materialGate.pendingStatuses.join(", "));
    }

    const receivedMaterials = readProductionReceivedMaterials_(productionId);
    const returnQtyByRequest = {};
    returnItems.forEach(function(item) {
      const requestId = cleanDisplayVal(item && item.requestId, "");
      const returnedQty = Number(item && item.returnedQty);
      if (!requestId) throw new Error("Invalid returned material row.");
      if (!Number.isFinite(returnedQty) || returnedQty < 0) throw new Error("Returned quantity cannot be negative.");
      if (Object.prototype.hasOwnProperty.call(returnQtyByRequest, requestId)) throw new Error("Duplicate returned material row: " + requestId);
      returnQtyByRequest[requestId] = returnedQty;
    });

    const receivedRequestMap = {};
    const materialClosures = receivedMaterials.map(function(material) {
      receivedRequestMap[material.requestId] = true;
      const returnedQty = Object.prototype.hasOwnProperty.call(returnQtyByRequest, material.requestId) ? returnQtyByRequest[material.requestId] : 0;
      if (String(material.status).toLowerCase() !== "received") throw new Error("Material " + material.productId + " is not fully received.");
      if (material.receivedQty <= 0) throw new Error("Received quantity is missing for material " + material.productId + ".");
      if (returnedQty > material.receivedQty) throw new Error("Returned quantity for " + material.productId + " cannot exceed received quantity " + material.receivedQty + ".");
      return {
        requestId: material.requestId,
        productId: material.productId,
        productName: material.productName,
        sourceWarehouse: material.sourceWarehouse,
        receivedQty: material.receivedQty,
        returnedQty: returnedQty,
        usedQty: material.receivedQty - returnedQty
      };
    });
    Object.keys(returnQtyByRequest).forEach(function(requestId) {
      if (!receivedRequestMap[requestId]) throw new Error("Returned material does not belong to this production job: " + requestId);
    });

    const requiredByProduct = {};
    materialClosures.forEach(function(material) {
      const key = material.productId.toUpperCase();
      requiredByProduct[key] = (requiredByProduct[key] || 0) + material.receivedQty;
    });
    const productionStock = getWarehouseMaterialStockTotals_(productionWarehouse);
    Object.keys(requiredByProduct).forEach(function(productKey) {
      const available = Number(productionStock[productKey] || 0);
      if (available < requiredByProduct[productKey]) {
        throw new Error("Insufficient production stock for " + productKey + ". Available: " + available + ", required for closing: " + requiredByProduct[productKey] + ".");
      }
    });

    const closedBy = cleanDisplayVal(user.name || user.username, "");
    const now = getFormattedTimestamp();
    const audit = getAuditStamp(user);
    const orderNoCol = autoResolveHeaderIndex(h, ["Order_No", "Order No"]);
    const productIdCol = autoResolveHeaderIndex(h, ["Product_ID", "Product ID"]);
    const orderNo = getVal(jobRow, orderNoCol, "");
    const finalProductId = getVal(jobRow, productIdCol, "");

    const closureSheet = SS.getSheetByName(SHEET_PRODUCTION_MATERIAL_CLOSURE);
    const adjustmentSheet = SS.getSheetByName(SHEET_STOCK_ADJUSTMENTS);
    materialClosures.forEach(function(item) {
      if (item.usedQty > 0) {
        updateStockAndBinQuantityInternal(productionWarehouse, item.productId, "Inward-Staging", -item.usedQty, user);
        appendRowByHeaders(adjustmentSheet, {
          "AdjustmentID": makeProductionTrackingId_("PADJ"), "Date": now, "ProductID": item.productId,
          "WarehouseID": productionWarehouse, "AdjustedQty": -item.usedQty,
          "Reason": "Consumed in production " + productionId, "AdjustedBy": closedBy, "Last Edit Status": audit
        }, user);
      }
      if (item.returnedQty > 0) {
        updateStockAndBinQuantityInternal(productionWarehouse, item.productId, "Inward-Staging", -item.returnedQty, user);
        updateStockAndBinQuantityInternal(item.sourceWarehouse, item.productId, "Returned-From-Production", item.returnedQty, user);
        appendRowByHeaders(adjustmentSheet, {
          "AdjustmentID": makeProductionTrackingId_("PADJ"), "Date": now, "ProductID": item.productId,
          "WarehouseID": productionWarehouse, "AdjustedQty": -item.returnedQty,
          "Reason": "Returned from production " + productionId + " to " + item.sourceWarehouse, "AdjustedBy": closedBy, "Last Edit Status": audit
        }, user);
        appendRowByHeaders(adjustmentSheet, {
          "AdjustmentID": makeProductionTrackingId_("PADJ"), "Date": now, "ProductID": item.productId,
          "WarehouseID": item.sourceWarehouse, "AdjustedQty": item.returnedQty,
          "Reason": "Received back from production " + productionId, "AdjustedBy": closedBy, "Last Edit Status": audit
        }, user);
      }
      appendRowByHeaders(closureSheet, {
        "Closure_ID": makeProductionTrackingId_("PMC"),
        "Production_ID": productionId,
        "Request_ID": item.requestId,
        "Order_No": orderNo,
        "Final_Product_ID": finalProductId,
        "Material_ID": item.productId,
        "Material_Name": item.productName,
        "Source_Warehouse": item.sourceWarehouse,
        "Production_Warehouse": productionWarehouse,
        "Received_Qty": item.receivedQty,
        "Used_Qty": item.usedQty,
        "Returned_Qty": item.returnedQty,
        "Closed_By": closedBy,
        "Closing_Date": now,
        "Remarks": remarks,
        "Last Edit Status": audit
      }, user);
    });

    jobsSheet.getRange(rowNumber, statusCol + 1).setValue("Completed");
    jobsSheet.getRange(rowNumber, finalCol + 1).setValue(finalQty);
    jobsSheet.getRange(rowNumber, closeDateCol + 1).setValue(now);
    jobsSheet.getRange(rowNumber, closedByCol + 1).setValue(closedBy);
    if (processCol !== -1) jobsSheet.getRange(rowNumber, processCol + 1).setValue("Material stock reconciled automatically at production closing.");
    jobsSheet.getRange(rowNumber, remarksCol + 1).setValue(remarks);
    jobsSheet.getRange(rowNumber, auditCol + 1).setValue(audit);

    SpreadsheetApp.flush();
    return {
      status: "success",
      message: "Production job " + productionId + " closed. Used material stock deducted and returned material stock moved back to the source warehouse."
    };
  } catch (e) {
    throw new Error("Production closing failed: " + e.message);
  } finally {
    lock.releaseLock();
  }
}

