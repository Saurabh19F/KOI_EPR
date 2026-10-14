// ============================================================
// QUALITY CONTROL DEPARTMENT
// Extracted from original Code.gs without changing function names.
// ============================================================

function getQualityDashboardData() {
  const qcSheet = SS.getSheetByName(SHEET_QUALITY_LOG);
  const qcRows = qcSheet ? qcSheet.getDataRange().getValues() : [];
  const pendingInspections = [];
  const inspectionHistory = [];

  if (qcRows.length > 1) {
    const headers = qcRows[0].map(h => h.toString().trim());
    const qcIdCol = getHeaderIndex(headers, "QC_ID");
    const prodLogIdCol = getHeaderIndex(headers, "Production_Log_ID");
    const reqDateCol = getHeaderIndex(headers, "Date_Requested");
    const whCol = getHeaderIndex(headers, "WarehouseID");
    const prodCol = getHeaderIndex(headers, "ProductID");
    const qtyCol = getHeaderIndex(headers, "Qty_To_Inspect");
    const statusCol = getHeaderIndex(headers, "Status");
    const checkedByCol = getHeaderIndex(headers, "CheckedBy");
    const insDateCol = getHeaderIndex(headers, "InspectionDate");
    const decCol = getHeaderIndex(headers, "Decision");
    const reasonCol = getHeaderIndex(headers, "Reason");

    for (let i = 1; i < qcRows.length; i++) {
      const row = qcRows[i];
      const status = (getVal(row, statusCol, "") || "").toString().trim();
      const rawReqDate = getVal(row, reqDateCol);
      const rawInsDate = getVal(row, insDateCol);

      const item = {
        qcId: getVal(row, qcIdCol),
        productionLogId: getVal(row, prodLogIdCol),
        dateRequested: rawReqDate ? new Date(rawReqDate).toLocaleDateString() : "",
        warehouseId: getVal(row, whCol),
        productId: getVal(row, prodCol),
        qtyToInspect: Number(getVal(row, qtyCol, 0)),
        status: status,
        checkedBy: getVal(row, checkedByCol, ""),
        inspectionDate: rawInsDate ? new Date(rawInsDate).toLocaleDateString() : "",
        decision: getVal(row, decCol, ""),
        reason: (function(){ const r = getVal(row, reasonCol, ""); return r ? "[Production QC] " + r : ""; })()
      };

      if (status.toLowerCase() === "pending") {
        pendingInspections.push(item);
      } else {
        inspectionHistory.push(item);
      }
    }
  }

  const grnSheet = SS.getSheetByName(SHEET_GOODS_RECEIVED);
  const planSheet = SS.getSheetByName(SHEET_RECEIVING_PLAN);
  const grnRows = grnSheet ? grnSheet.getDataRange().getValues() : [];
  const planRows = planSheet ? planSheet.getDataRange().getValues() : [];

  const planMap = {};
  if (planRows.length > 1) {
    const planHeaders = planRows[0].map(h => h.toString().trim());
    const planIdCol = getHeaderIndex(planHeaders, "Plan_ID");
    const prodIdCol = getHeaderIndex(planHeaders, "ProductID");
    for (let i = 1; i < planRows.length; i++) {
      const planId = getVal(planRows[i], planIdCol);
      const prodId = getVal(planRows[i], prodIdCol);
      if (planId) {
        planMap[planId] = prodId;
      }
    }
  }

  if (grnRows.length > 1) {
    const grnHeaders = grnRows[0].map(h => h.toString().trim());
    const rIDCol = getHeaderIndex(grnHeaders, "Receipt_ID");
    const planIdCol = getHeaderIndex(grnHeaders, "Plan_ID");
    const poIdCol = getHeaderIndex(grnHeaders, "PO_ID");
    const whCol = getHeaderIndex(grnHeaders, "WarehouseID");
    const rejCol = getHeaderIndex(grnHeaders, "RejectedQty");
    const remCol = getHeaderIndex(grnHeaders, "Remarks");
    const dateCol = getHeaderIndex(grnHeaders, "Date");
    const userCol = getHeaderIndex(grnHeaders, "ReceivedBy");

    for (let i = 1; i < grnRows.length; i++) {
      const rQty = Number(getVal(grnRows[i], rejCol, 0));
      if (rQty > 0) {
        const rID = getVal(grnRows[i], rIDCol);
        const planId = getVal(grnRows[i], planIdCol);
        const whId = getVal(grnRows[i], whCol);
        const remarks = getVal(grnRows[i], remCol);
        const rawDate = getVal(grnRows[i], dateCol);
        const receivedBy = getVal(grnRows[i], userCol, "Warehouse Staff");

        let productId = planMap[planId];
        if (!productId || productId.toString().trim() === "") {
          productId = "Unknown SKU";
        }

        inspectionHistory.push({
          qcId: rID,
          productionLogId: (function(){ const po = getVal(grnRows[i], poIdCol, ""); return po ? "PO: " + po : ""; })(),
          dateRequested: "",
          warehouseId: whId,
          productId: productId,
          qtyToInspect: rQty,
          status: "Completed",
          checkedBy: receivedBy,
          inspectionDate: rawDate ? new Date(rawDate).toLocaleDateString() : "",
          decision: "Rejected",
          reason: "[Inbound Defect] " + (remarks || "Rejection logged at receiving dock.")
        });
      }
    }
  }

  inspectionHistory.sort((a, b) => new Date(b.inspectionDate) - new Date(a.inspectionDate));

  return {
    pendingInspections,
    inspectionHistory
  };
}

// --- COMMIT INSPECTOR ASSESSMENT DECISION ---

function submitInspectionDecision(formData, user) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const qcSheet = SS.getSheetByName(SHEET_QUALITY_LOG);
    const qcData = qcSheet.getDataRange().getValues();
    const headers = qcData[0].map(h => h.toString().trim());

    const qcIdCol = getHeaderIndex(headers, "QC_ID");
    const statusCol = getHeaderIndex(headers, "Status");
    const checkedByCol = getHeaderIndex(headers, "CheckedBy");
    const insDateCol = getHeaderIndex(headers, "InspectionDate");
    const decCol = getHeaderIndex(headers, "Decision");
    const reasonCol = getHeaderIndex(headers, "Reason");
    const prodLogIdCol = getHeaderIndex(headers, "Production_Log_ID");
    const whCol = getHeaderIndex(headers, "WarehouseID");
    const prodCol = getHeaderIndex(headers, "ProductID");
    const qtyCol = getHeaderIndex(headers, "Qty_To_Inspect");

    let rowIdx = -1;
    for (let i = 1; i < qcData.length; i++) {
      if (getVal(qcData[i], qcIdCol) === formData.qcId) {
        rowIdx = i + 1;
        break;
      }
    }

    if (rowIdx === -1) throw new Error("Inspection record index not found.");

    const decision = formData.decision;
    const reason = formData.reason || "Evaluated by inline quality assurance";
    const productionLogId = getVal(qcData[rowIdx - 1], prodLogIdCol);
    const warehouseId = normalizeWarehouseId(getVal(qcData[rowIdx - 1], whCol));
    const productId = getVal(qcData[rowIdx - 1], prodCol);
    const qtyInspected = Number(getVal(qcData[rowIdx - 1], qtyCol, 0));

    qcSheet.getRange(rowIdx, statusCol + 1).setValue("Completed");
    qcSheet.getRange(rowIdx, checkedByCol + 1).setValue(user.name);
    qcSheet.getRange(rowIdx, insDateCol + 1).setValue(getFormattedTimestamp());
    qcSheet.getRange(rowIdx, decCol + 1).setValue(decision);
    qcSheet.getRange(rowIdx, reasonCol + 1).setValue(reason);
    updateRowAuditStamp(qcSheet, rowIdx, user);

    const prodSheet = SS.getSheetByName(SHEET_PRODUCTION_LOG);
    if (prodSheet) {
      const prodData = prodSheet.getDataRange().getValues();
      const prodHeaders = prodData[0].map(h => h.toString().trim());
      const logIdCol = getHeaderIndex(prodHeaders, "Log_ID");
      const prodStatusCol = getHeaderIndex(prodHeaders, "QC_Status");

      for (let i = 1; i < prodData.length; i++) {
        if (getVal(prodData[i], logIdCol) === productionLogId) {
          prodSheet.getRange(i + 1, prodStatusCol + 1).setValue(decision);
          updateRowAuditStamp(prodSheet, i + 1, user);
          break;
        }
      }
    }

    if (decision === "Rejected") {
      updateStockAndBinQuantityInternal(warehouseId, productId, "Inward-Staging", -qtyInspected, user);
    }

    SpreadsheetApp.flush();
    return { status: 'success', message: `Batch ${formData.qcId} finished verification. Outcome declared: ${decision}` };
  } catch (e) {
    throw new Error("Audit declaration interrupted: " + e.message);
  } finally {
    lock.releaseLock();
  }
}

