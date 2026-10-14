// ============================================================
// PLANNING DEPARTMENT
// Extracted from original Code.gs without changing function names.
// ============================================================

// Receiving Plan ID: preserve original legacy format PLAN-####.
// Existing IDs are checked so the same PLAN number is not reused.
function generateReceivingPlanId_() {
  return generateLegacyUniqueId_(
    SHEET_RECEIVING_PLAN,
    "Plan_ID",
    "PLAN-",
    4,
    ["Plan ID"]
  );
}

function createReceivingPlan(planData, user) {
  const planSheet = SS.getSheetByName(SHEET_RECEIVING_PLAN);
  const poSheet = SS.getSheetByName(SHEET_PURCHASE_ORDERS);

  const resolvedSku = planData && planData.productId ? String(planData.productId).trim() : "";
  if (!resolvedSku || resolvedSku.toUpperCase() === "UNKNOWN SKU" || resolvedSku.toUpperCase() === "N/A") {
    throw new Error("Product ID is required. Planning will not auto-select another SKU.");
  }
  planData.productId = resolvedSku;

  const plannerName = planData.plannedBy || (user && (user.name || user.username)) || "";
  const auditStamp = getAuditStamp(user || { name: plannerName, warehouseId: (planData.allocations && planData.allocations[0] ? planData.allocations[0].warehouseId : "") });

  planData.allocations.forEach(alloc => {
    if (alloc.qty > 0) {
      appendRowByHeaders(planSheet, {
        "Plan_ID": generateReceivingPlanId_(),
        "PO_ID": planData.poId,
        "ProductID": planData.productId,
        "WarehouseID": normalizeWarehouseId(alloc.warehouseId),
        "PlannedQty": alloc.qty,
        "Status": "Pending",
        "TotalReceivedQty": 0,
        "PlannedBy": plannerName,
        "Last Edit Status": auditStamp
      }, user);
    }
  });

  const poData = poSheet.getDataRange().getValues();
  const poHeaders = poData[0].map(h => h.toString().trim());
  const poNumberCol = getHeaderIndex(poHeaders, "PO Number", ["PO_Number", "PO ID", "PO_ID", "Purchase Order", "PO"]),
    prodIdCol = getHeaderIndex(poHeaders, "Unique Code", ["Unique Code", "Product Code", "ProductID", "Product ID", "Item Code", "Code", "SKU"]),
    totalQtyCol = getHeaderIndex(poHeaders, "Qty", ["Quantity", "Quantity Ordered", "Qty Ordered"]),
    statusCol = getHeaderIndex(poHeaders, "Status", ["Order Status", "PO Status"]),
    plannedByCol = getHeaderIndex(poHeaders, "PlannedBy", ["Planned By", "Planner Name"]);

  let poRowIndex = -1;
  let poTotalQty = 0;
  for (let i = 1; i < poData.length; i++) {
    if (getVal(poData[i], poNumberCol).toString().trim() === planData.poId.toString().trim() &&
      getVal(poData[i], prodIdCol).toString().trim().toUpperCase() === planData.productId.toUpperCase()) {
      poRowIndex = i + 1;
      poTotalQty = Number(getVal(poData[i], totalQtyCol, 0));
      break;
    }
  }

  if (poRowIndex > -1) {
    const planRows = planSheet.getDataRange().getValues();
    const planHeaders = planRows[0].map(h => h.toString().trim());
    const planPoIdCol = getHeaderIndex(planHeaders, "PO_ID", ["PO ID", "PO Number"]);
    const planProdIdCol = getHeaderIndex(planHeaders, "ProductID", ["ProductID", "Product ID", "Unique Code"]);
    const planPlannedQtyCol = getHeaderIndex(planHeaders, "PlannedQty", ["Planned Qty"]);

    let alreadyPlannedQty = 0;
    for (let k = 1; k < planRows.length; k++) {
      const row = planRows[k];
      if (getVal(row, planPoIdCol).toString().trim() === planData.poId.toString().trim() &&
        getVal(row, planProdIdCol).toString().trim().toUpperCase() === planData.productId.toUpperCase()) {
        alreadyPlannedQty += Number(getVal(row, planPlannedQtyCol, 0));
      }
    }

    if (statusCol > -1) {
      if (alreadyPlannedQty >= poTotalQty) {
        poSheet.getRange(poRowIndex, statusCol + 1).setValue("Planned");
      } else {
        poSheet.getRange(poRowIndex, statusCol + 1).setValue("Partially Planned");
      }
    }

    // 🟢 Save PlannedBy name into PurchaseOrders sheet
    if (plannedByCol > -1 && plannerName) {
      poSheet.getRange(poRowIndex, plannedByCol + 1).setValue(plannerName);
    }
    updateRowAuditStamp(poSheet, poRowIndex, user || { name: plannerName, warehouseId: "" });
  }

  SpreadsheetApp.flush();
  return { status: 'success', message: 'Plan created and assigned successfully!' };
}

function createBulkReceivingPlans(payload, user) {
  const plans = payload && Array.isArray(payload.plans) ? payload.plans : [];
  if (!plans.length) throw new Error('No items selected for bulk allocation.');

  let completed = 0;
  plans.forEach(function(planData) {
    if (!planData || !planData.poId || !Array.isArray(planData.allocations) || !planData.allocations.length) {
      throw new Error('Invalid bulk allocation row found.');
    }
    createReceivingPlan(planData, user);
    completed++;
  });

  return {
    status: 'success',
    message: completed + ' item' + (completed === 1 ? '' : 's') + ' allocated successfully.',
    completed: completed
  };
}

// --- DISTRIBUTION (BINS) ---

function approveTransferRequest(requestId, user) {
  verifyUserRole(user, ["Planner", "Administrator"]);
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const transferSheet = SS.getSheetByName(SHEET_STOCK_TRANSFER);
    const data = transferSheet.getDataRange().getValues();
    const headers = data[0].map(h => h.toString().trim());
    const reqIdCol = getHeaderIndex(headers, "Request_ID");
    const statusCol = getHeaderIndex(headers, "Status");

    for (let i = 1; i < data.length; i++) {
      if (getVal(data[i], reqIdCol) === requestId && getVal(data[i], statusCol) === 'Pending Approval') {
        transferSheet.getRange(i + 1, statusCol + 1).setValue("Approved");
        updateRowAuditStamp(transferSheet, i + 1, user);
        SpreadsheetApp.flush();
        return { status: 'success', message: `Request ${requestId} approved by Planner!` };
      }
    }
    throw new Error("Could not find pending approval request.");
  } catch (e) {
    throw new Error("Approval failed: " + e.message);
  } finally {
    lock.releaseLock();
  }
}

function rejectTransferRequest(requestId, user) {
  verifyUserRole(user, ["Planner", "Administrator"]);
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const transferSheet = SS.getSheetByName(SHEET_STOCK_TRANSFER);
    const data = transferSheet.getDataRange().getValues();
    const headers = data[0].map(h => h.toString().trim());
    const reqIdCol = getHeaderIndex(headers, "Request_ID");
    const statusCol = getHeaderIndex(headers, "Status");

    for (let i = 1; i < data.length; i++) {
      if (getVal(data[i], reqIdCol) === requestId && getVal(data[i], statusCol) === 'Pending Approval') {
        transferSheet.getRange(i + 1, statusCol + 1).setValue("Rejected");
        updateRowAuditStamp(transferSheet, i + 1, user);
        SpreadsheetApp.flush();
        return { status: 'success', message: `Request ${requestId} rejected.` };
      }
    }
    throw new Error("Could not find pending request.");
  } catch (e) {
    throw new Error("Rejection failed: " + e.message);
  } finally {
    lock.releaseLock();
  }
}
// --- SEND MATERIAL (FORM-BASED DISPATCH WITH ACTUAL QUANTITY) ---

function getWarehouses() {
  try {
    const sheet = SS.getSheetByName(SHEET_WAREHOUSES);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];
    const data = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
    return data.map(row => [normalizeWarehouseId(row[0]), row[1], row[2]]);
  } catch (e) {
    throw new Error("Failed to get warehouses: " + e.message);
  }
}

function addWarehouse(formData, user) {
  try {
    const { warehouseId, location, type } = formData;
    if (!warehouseId || !location || !type) throw new Error("All fields required.");
    const sheet = SS.getSheetByName(SHEET_WAREHOUSES);
    const data = sheet.getDataRange().getValues();
    const normWhInput = normalizeWarehouseId(warehouseId);
    for (let i = 1; i < data.length; i++) {
      if (normalizeWarehouseId(data[i][0]) === normWhInput)
        throw new Error("Warehouse ID exists.");
    }

    appendRowByHeaders(sheet, {
      "WarehouseID": normWhInput,
      "Location": location,
      "Type": type
    }, user);

    SpreadsheetApp.flush();
    return { status: 'success', message: `Warehouse "${normWhInput}" added successfully.` };
  } catch (e) {
    throw new Error("Failed to add warehouse: " + e.message);
  }
}

function deleteWarehouse(warehouseId, user) {
  try {
    if (!warehouseId) throw new Error("ID required.");
    const sheet = SS.getSheetByName(SHEET_WAREHOUSES);
    const data = sheet.getDataRange().getValues();
    let rowToDelete = -1;
    const normWhInput = normalizeWarehouseId(warehouseId);
    for (let i = 1; i < data.length; i++) {
      if (normalizeWarehouseId(data[i][0]) === normWhInput) {
        rowToDelete = i + 1;
        break;
      }
    }
    if (rowToDelete > -1) {
      sheet.deleteRow(rowToDelete);
      SpreadsheetApp.flush();
      return { status: 'success', message: `Warehouse "${warehouseId}" deleted.` };
    } else {
      throw new Error(`Warehouse ID "${warehouseId}" not found.`);
    }
  } catch (e) {
    throw new Error("Failed to delete: " + e.message);
  }
}

// --- GET ACCOUNTS TEAM EMAILS FROM COLUMN G (ROLE IN COL D) ---

function getPlannerData(user) {
  const poInfo = getSheetDataAndHeaders(SHEET_PURCHASE_ORDERS);
  const poHeaders = poInfo.headers;
  const poRows = poInfo.dataRows;

  const planInfo = getSheetDataAndHeaders(SHEET_RECEIVING_PLAN);
  const planHeaders = planInfo.headers;
  const planRows = planInfo.dataRows;

  const poCol = autoResolveHeaderIndex(poHeaders, ["PO Number", "PO_Number", "PO ID", "PO_ID", "Purchase Order", "PO"]),
    prodIdCol = autoResolveHeaderIndex(poHeaders, ["Unique Code", "Product Code", "ProductID", "Product ID", "Item Code", "Code", "SKU"]),
    descCol = autoResolveHeaderIndex(poHeaders, ["Item Description", "Description", "Item Name", "Product Name"]),
    vendorCol = autoResolveHeaderIndex(poHeaders, ["Vendor Name", "Vendor", "Supplier"]),
    qtyCol = autoResolveHeaderIndex(poHeaders, ["Qty", "Quantity", "Quantity Ordered", "Qty Ordered"]),
    uomCol = autoResolveHeaderIndex(poHeaders, ["UOM", "Unit", "U.O.M"]),
    personCol = autoResolveHeaderIndex(poHeaders, ["Purchase Person Name", "Purchase Person", "Purchaser", "Purchaser Name"]),
    dateCol = autoResolveHeaderIndex(poHeaders, ["Material Received Expected Date", "Expected Date", "ETA", "Delivery Date", "Due Date"]),
    salesPersonCol = autoResolveHeaderIndex(poHeaders, ["Sales Person Name", "Sales Person", "SalesPerson", "Sales_Person_Name"]),
    buyerCodeCol = autoResolveHeaderIndex(poHeaders, ["Buyer Code", "Buyer", "Buyer_Code", "BuyerCode"]),
    locationCol = autoResolveHeaderIndex(poHeaders, ["Location", "Warehouse Location", "Loc"]),
    statusCol = autoResolveHeaderIndex(poHeaders, ["Status", "Order Status", "PO Status"]),
    orderNoCol = autoResolveHeaderIndex(poHeaders, ["Order no.", "Order No", "Order Number", "Sales Order No", "Sales Order"]);

  const planIdCol = autoResolveHeaderIndex(planHeaders, ["Plan_ID", "Plan ID"]),
    planPoCol = autoResolveHeaderIndex(planHeaders, ["PO_ID", "PO ID", "PO Number", "PO_Number"]),
    planProdCol = autoResolveHeaderIndex(planHeaders, ["ProductID", "Product ID", "Unique Code", "SKU"]),
    planQtyCol = autoResolveHeaderIndex(planHeaders, ["PlannedQty", "Planned Qty"]);

  function cleanKeyStr(val) {
    if (!val) return "";
    return val.toString().replace(/\u00A0/g, ' ').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
  }

  function makeKey(po, sku) {
    return cleanKeyStr(po) + "___" + cleanKeyStr(sku);
  }

  // 1. Calculate Planned Quantities
  let actualPlanRowsCount = 0;
  const plannedQtyMap = {};

  for (let j = 0; j < planRows.length; j++) {
    const row = planRows[j];
    const planPoId = getVal(row, planPoCol, "").toString().trim();
    if (!planPoId) continue;

    const plannedQty = Number(getVal(row, planQtyCol, 0)) || 0;
    if (plannedQty <= 0) continue;

    actualPlanRowsCount++;
    const planProdId = getVal(row, planProdCol, "").toString().trim();
    const key = makeKey(planPoId, planProdId);
    plannedQtyMap[key] = (plannedQtyMap[key] || 0) + plannedQty;
  }

  // Identify Head Planner (Sunil Kumar / No Warehouse restriction / Delhi Head)
  const userWh = (user && user.warehouseId) ? normalizeWarehouseId(user.warehouseId) : "";
  const userName = (user && (user.name || user.username)) ? (user.name || user.username).toLowerCase() : "";

  // Head Planner check: Sunil Sir or Planner with empty/HQ/ALL warehouse
  const isHeadPlanner = !userWh || userWh === "ALL" || userWh === "HQ" || userName.includes("sunil");

  // 2. Loop PO Rows with Strict Location Filter for non-head planners (e.g. Mumbai / M1)
  let pendingPOs = [];
  let totalOrderCount = 0;
  let unplannedOrderCount = 0;

  for (let i = 0; i < poRows.length; i++) {
    const row = poRows[i];
    const poId = getVal(row, poCol, "");
    if (!poId) continue;

    const rawLoc = getVal(row, locationCol, "");
    const poLocation = normalizeWarehouseId(rawLoc);

    // Strict location isolation. Delhi Head Planner (Sunil) must NOT see Mumbai purchasing rows.
    const rawLocUpper = (rawLoc || "").toString().toUpperCase();
    const isDelhiHeadPlanner = userName.includes("sunil");

    if (isDelhiHeadPlanner) {
      const isMumbaiRow = poLocation === "M1" || rawLocUpper.includes("MUMBAI");
      if (isMumbaiRow) continue;
    } else if (!isHeadPlanner) {
      const matchWh = userWh;
      const isMumbaiMatch = (userWh === "M1" || userName.includes("mumbai")) &&
        (poLocation === "M1" || rawLocUpper.includes("MUMBAI"));

      if (poLocation !== matchWh && !isMumbaiMatch) {
        continue; // Keep each planner restricted to their own location.
      }
    }

    totalOrderCount++;

    const prodId = getVal(row, prodIdCol, "");
    const totalQty = Number(getVal(row, qtyCol, 0)) || 0;

    const exactKey = makeKey(poId, prodId);
    const totalPlanned = plannedQtyMap[exactKey] || 0;
    const unplannedQty = Math.max(0, totalQty - totalPlanned);

    if (unplannedQty > 0) {
      unplannedOrderCount++;
    }

    pendingPOs.push({
      poId: poId,
      productId: prodId,
      itemDescription: getVal(row, descCol, ""),
      vendorName: getVal(row, vendorCol, ""),
      qty: totalQty,
      plannedQty: totalPlanned,
      unplannedQty: unplannedQty,
      uom: cleanUom(getVal(row, uomCol, "")),
      date: getVal(row, dateCol, "") ? new Date(getVal(row, dateCol)).toLocaleDateString() : '',
      purchasePerson: getVal(row, personCol, ""),
      salesPerson: getVal(row, salesPersonCol, ""),
      buyerCode: getVal(row, buyerCodeCol, ""),
      location: rawLoc || poLocation || "",
      orderNo: getVal(row, orderNoCol, "")
    });
  }

  // 3. Cross-Warehouse Approvals (ONLY SENT TO HEAD PLANNER - SUNIL SIR)
  const pendingApprovals = [];
  if (isHeadPlanner) {
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

        for (let i = 1; i < transferData.length; i++) {
          const row = transferData[i];
          if (!getVal(row, reqIdCol, "")) continue;
          const status = getVal(row, statusCol, "");
          if (status === 'Pending Approval') {
            pendingApprovals.push({
              requestId: getVal(row, reqIdCol, ""),
              requestingWarehouse: normalizeWarehouseId(getVal(row, reqWhCol, "")),
              sourceWarehouse: normalizeWarehouseId(getVal(row, srcWhCol, "")),
              productId: getVal(row, prodCol, ""),
              requestedQty: Number(getVal(row, qtyCol, 0)),
              orderNo: getVal(row, orderCol, ""),
              requestedBy: getVal(row, reqByCol, "")
            });
          }
        }
      }
    }
  }

  return {
    pendingPOs: pendingPOs,
    pendingApprovals: pendingApprovals,
    totalOrderCount: totalOrderCount,
    unplannedOrderCount: unplannedOrderCount,
    plannedAllocationCount: actualPlanRowsCount
  };
}



// --- SAFE EMAIL SENDER WITH FALLBACK RECIPIENTS ---

function generateReceivingPlanPdf(warehouseId, user) {
  const normWh = normalizeWarehouseId(warehouseId || (user ? user.warehouseId : "All"));
  const data = getWarehouseData(normWh);
  const receipts = data.pendingReceipts || [];

  let rowsHtml = receipts.map((row, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
      <td style="padding: 7px 8px; font-family: monospace; font-size: 10px; font-weight: bold; color: #334155;">${row.planId}</td>
      <td style="padding: 7px 8px; font-family: monospace; font-size: 10px; font-weight: bold; color: #4338ca;">${row.poId}</td>
      <td style="padding: 7px 8px; font-weight: bold; font-size: 10px; color: #0f172a;">${row.orderNo || 'Order No Pending'}</td>
      <td style="padding: 7px 8px; font-size: 10px; font-weight: bold; color: #0f172a;">${row.itemDescription || row.productId}</td>
      <td style="padding: 7px 8px; font-family: monospace; font-size: 10px; color: #475569;">${row.productId}</td>
      <td style="padding: 7px 8px; font-size: 10px; color: #334155;">${row.vendorName || ''}</td>
      <td style="padding: 7px 8px; font-size: 10px; color: #64748b;">${row.expectedDate || ''}</td>
      <td style="padding: 7px 8px; font-size: 10px; text-align: center; font-weight: bold;">${row.plannedQty}</td>
      <td style="padding: 7px 8px; font-size: 10px; text-align: center; color: #16a34a; font-weight: bold; background-color: #f0fdf4;">${row.totalReceivedQty}</td>
      <td style="padding: 7px 8px; font-size: 10px; text-align: center; color: #dc2626; font-weight: bold; background-color: #fef2f2;">${row.balanceQty}</td>
      <td style="padding: 7px 8px; font-size: 10px; text-align: right; font-weight: bold;">${cleanUom(row.uom) || 'Pcs'}</td>
    </tr>
  `).join('');

  if (receipts.length === 0) {
    rowsHtml = `<tr><td colspan="11" style="padding: 20px; text-align: center; color: #64748b; font-size: 11px;">No pending receiving plans found for Warehouse ${normWh}.</td></tr>`;
  }

  const dateToday = new Date().toLocaleDateString();
  const timeToday = new Date().toLocaleTimeString();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @page { size: landscape; margin: 10mm; }
        body { font-family: Arial, sans-serif; color: #1e293b; background-color: #ffffff; margin: 0; padding: 10px; }
        .header { border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 12px; }
        .title { font-size: 18px; font-weight: 800; color: #0f172a; text-transform: uppercase; }
        .sub { font-size: 10px; color: #64748b; margin-top: 3px; }
        .stats-bar { background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; font-size: 10px; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; font-size: 10px; }
        th { background-color: #0f172a; color: #ffffff; font-size: 9px; text-transform: uppercase; padding: 8px 8px; text-align: left; letter-spacing: 0.5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <table style="width: 100%; border: none;">
          <tr>
            <td style="border: none;">
              <div style="font-size: 9px; font-weight: bold; color: #64748b; text-transform: uppercase;">INBOUND LOGISTICS MANAGEMENT</div>
              <div class="title">INBOUND RECEIVING PLAN REPORT (${normWh})</div>
              <div class="sub">Generated On: <strong>${dateToday} ${timeToday}</strong> | Active Target Domain: <strong>${normWh}</strong></div>
            </td>
            <td style="text-align: right; vertical-align: top; border: none;">
              <div style="font-size: 22px; font-weight: 900; color: #1e1b4b; letter-spacing: 2px;">KOI</div>
              <div style="font-size: 9px; font-family: monospace; color: #64748b;">SYS.AUTH.VERIFIED</div>
            </td>
          </tr>
        </table>
      </div>

      <div class="stats-bar">
        Total Pending Receiving Lines: <strong>${receipts.length}</strong> | Target Warehouse: <strong>${normWh}</strong> | Status: <strong>Pending Material Receiving</strong>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 9%;">PLAN ID</th>
            <th style="width: 12%;">PO ID</th>
            <th style="width: 10%;">ORDER NO</th>
            <th style="width: 25%;">ITEM DESCRIPTION</th>
            <th style="width: 12%;">PRODUCT CODE</th>
            <th style="width: 12%;">VENDOR</th>
            <th style="width: 8%;">EXPECTED</th>
            <th style="width: 4%; text-align: center;">PLAN</th>
            <th style="width: 4%; text-align: center;">RECD</th>
            <th style="width: 4%; text-align: center;">BAL</th>
            <th style="width: 5%; text-align: right;">UOM</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div style="margin-top: 15px; font-size: 8px; font-family: monospace; color: #94a3b8; text-align: center; text-transform: uppercase;">
        CONFIDENTIAL - SYSTEM GENERATED LOGISTICS RECEIVING PLAN - KOI IMS
      </div>
    </body>
    </html>
  `;

  const blob = Utilities.newBlob(htmlContent, 'text/html', 'Receiving_Plan.html');
  const pdfBlob = blob.getAs('application/pdf').setName(`Receiving_Plan_${normWh}_${new Date().toISOString().split('T')[0]}.pdf`);
  return Utilities.base64Encode(pdfBlob.getBytes());
}
// --- 🟢 UPDATED TRANSFER HISTORY DATA (WITH EDITORS & TIMESTAMPS) ---

