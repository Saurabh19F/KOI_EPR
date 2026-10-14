// ============================================================
// PURCHASE DEPARTMENT
// Extracted from original Code.gs without changing function names.
// ============================================================

function submitPurchaseRejectionAction(formData, user) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const actionSheet = SS.getSheetByName(SHEET_REJECT_ACTIONS);
    const data = actionSheet.getDataRange().getValues();
    const headers = data[0].map(h => h.toString().trim());

    const rIDCol = getHeaderIndex(headers, "Receipt_ID");
    let rowIdx = -1;

    for (let i = 1; i < data.length; i++) {
      if (getVal(data[i], rIDCol) === formData.receiptId) {
        rowIdx = i + 1;
        break;
      }
    }

    const etaDate = formData.replacementETA ? new Date(formData.replacementETA) : "";

    const rowDataObj = {
      "Receipt_ID": formData.receiptId,
      "PO_ID": formData.poId,
      "ProductID": formData.productId,
      "RejectedQty": formData.rejectedQty,
      "ActionType": formData.actionType,
      "ActionDate": getFormattedTimestamp(),
      "ReferenceNo": formData.referenceNo,
      "Status": formData.status,
      "PurchaseRemarks": formData.purchaseRemarks,
      "UpdatedBy": user.name,
      "IsReplacementExpected": formData.isReplacementExpected,
      "ReplacementVendor": formData.replacementVendor,
      "ReplacementETA": etaDate,
      "ResolutionPath": formData.resolutionPath
    };

    if (rowIdx > -1) {
      for (const key in rowDataObj) {
        const idx = getHeaderIndex(headers, key);
        if (idx !== -1) {
          actionSheet.getRange(rowIdx, idx + 1).setValue(cleanDataMarkerForStorage_(rowDataObj[key]));
        }
      }
      updateRowAuditStamp(actionSheet, rowIdx, user);
    } else {
      rowDataObj["Action_ID"] = "ACT-" + Math.floor(1000 + Math.random() * 9000);
      appendRowByHeaders(actionSheet, rowDataObj, user);
    }

    if (formData.isReplacementExpected === "No" && formData.poId !== "N/A (QC Fail)") {
      const planSheet = SS.getSheetByName(SHEET_RECEIVING_PLAN);
      if (planSheet) {
        const planData = planSheet.getDataRange().getValues();
        const planHeaders = planData[0].map(h => h.toString().trim());
        const planIdCol = getHeaderIndex(planHeaders, "Plan_ID");
        const statusCol = getHeaderIndex(planHeaders, "Status");

        for (let i = 1; i < planData.length; i++) {
          if (getVal(planData[i], planIdCol) === formData.planId) {
            planSheet.getRange(i + 1, statusCol + 1).setValue("Closed");
            updateRowAuditStamp(planSheet, i + 1, user);
            break;
          }
        }
      }
    } else if (formData.isReplacementExpected === "Yes" && formData.replacementETA && formData.poId !== "N/A (QC Fail)") {
      const poSheet = SS.getSheetByName(SHEET_PURCHASE_ORDERS);
      if (poSheet) {
        const poData = poSheet.getDataRange().getValues();
        const poHeaders = poData[0].map(h => h.toString().trim());
        const poNumCol = getHeaderIndex(poHeaders, "PO Number");
        const skuCol = getHeaderIndex(poHeaders, "Unique Code");
        const etaCol = getHeaderIndex(poHeaders, "Material Received Expected Date");

        for (let i = 1; i < poData.length; i++) {
          if (getVal(poData[i], poNumCol) === formData.poId && getVal(poData[i], skuCol) === formData.productId) {
            poSheet.getRange(i + 1, etaCol + 1).setValue(etaDate);
            updateRowAuditStamp(poSheet, i + 1, user);
            break;
          }
        }
      }
    }

    SpreadsheetApp.flush();
    return { status: 'success', message: 'Defect logging and subsequent operational variables updated successfully!' };
  } catch (e) {
    throw new Error("Defect tracking update failed: " + e.message);
  } finally {
    lock.releaseLock();
  }
}

// --- HELPER: UPLOAD IMAGE ---

function getAccountsEmails() {
  const sheet = SS.getSheetByName(SHEET_USERS);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0].map(h => h.toString().trim().toLowerCase());
  const roleCol = getHeaderIndex(headers, "role", ["role"]);
  const emailCol = autoResolveHeaderIndex(data[0], ["email id", "email", "email_id", "email address"]);

  const targetEmailCol = emailCol !== -1 ? emailCol : 6; // Column G (Index 6)
  const targetRoleCol = roleCol !== -1 ? roleCol : 3;   // Column D (Index 3)

  const emails = [];
  for (let i = 1; i < data.length; i++) {
    const role = data[i][targetRoleCol] ? data[i][targetRoleCol].toString().trim().toLowerCase() : "";
    const email = data[i][targetEmailCol] ? data[i][targetEmailCol].toString().trim() : "";

    if ((role === "accounts" || role === "demo1" || role === "account") && email && email.includes("@")) {
      emails.push(email);
    }
  }
  return [...new Set(emails)];
}

// --- GET SPECIFIC PURCHASER EMAIL FROM COLUMN G ---

function getPurchaserEmailByName(purchaserName) {
  if (!purchaserName || purchaserName === "N/A" || purchaserName === "Unknown") return "";

  const userSheet = SS.getSheetByName(SHEET_USERS);
  if (!userSheet) return "";
  const data = userSheet.getDataRange().getValues();
  if (data.length <= 1) return "";

  const headers = data[0].map(h => h.toString().trim().toLowerCase());
  const nameCol = getHeaderIndex(headers, "displayname", ["display name", "name"]);
  const usernameCol = getHeaderIndex(headers, "username", ["user name"]);
  const emailCol = autoResolveHeaderIndex(data[0], ["email id", "email", "email_id", "email address"]);

  const targetEmailCol = emailCol !== -1 ? emailCol : 6; // Column G
  const normSearchName = purchaserName.toString().trim().toLowerCase();

  for (let i = 1; i < data.length; i++) {
    const dName = data[i][nameCol !== -1 ? nameCol : 2] ? data[i][nameCol !== -1 ? nameCol : 2].toString().trim().toLowerCase() : "";
    const uName = data[i][usernameCol !== -1 ? usernameCol : 0] ? data[i][usernameCol !== -1 ? usernameCol : 0].toString().trim().toLowerCase() : "";
    const email = data[i][targetEmailCol] ? data[i][targetEmailCol].toString().trim() : "";

    if ((dName === normSearchName || uName === normSearchName || dName.includes(normSearchName) || normSearchName.includes(dName)) && email && email.includes("@")) {
      return email;
    }
  }
  return "";
}

// --- GET SPECIFIC WAREHOUSE TEAM EMAILS FROM COLUMN G ---

function getPurchaseRejectionData(user) {
  const grnSheet = SS.getSheetByName(SHEET_GOODS_RECEIVED);
  const planSheet = SS.getSheetByName(SHEET_RECEIVING_PLAN);
  const actionsSheet = SS.getSheetByName(SHEET_REJECT_ACTIONS);
  const qcSheet = SS.getSheetByName(SHEET_QUALITY_LOG);
  const poSheet = SS.getSheetByName(SHEET_PURCHASE_ORDERS);

  // Map PO Number to Order No & Purchaser Name
  const poOrderMap = {};
  const poPurchaserMap = {};
  if (poSheet) {
    const poData = poSheet.getDataRange().getValues();
    if (poData.length > 1) {
      const poHeaders = poData[0].map(h => h.toString().trim());
      const poNumCol = getHeaderIndex(poHeaders, "PO Number");
      const orderNoCol = autoResolveHeaderIndex(poHeaders, ["Order no.", "Order No", "Sales Order No"]);
      const personCol = getHeaderIndex(poHeaders, "Purchase Person Name", ["Purchase Person", "Purchaser", "Purchaser Name"]);

      for (let i = 1; i < poData.length; i++) {
        const poNum = getVal(poData[i], poNumCol);
        if (poNum) {
          if (orderNoCol !== -1) poOrderMap[poNum] = getVal(poData[i], orderNoCol, "");
          if (personCol !== -1) poPurchaserMap[poNum] = getVal(poData[i], personCol, "");
        }
      }
    }
  }

  const grnRows = grnSheet ? grnSheet.getDataRange().getValues() : [];
  const planRows = planSheet ? planSheet.getDataRange().getValues() : [];
  const actionRows = actionsSheet ? actionsSheet.getDataRange().getValues() : [];
  const qcRows = qcSheet ? qcSheet.getDataRange().getValues() : [];

  const planMap = {};
  if (planRows.length > 1) {
    const planHeaders = planRows[0].map(h => h.toString().trim());
    const planIdCol = getHeaderIndex(planHeaders, "Plan_ID");
    const prodIdCol = getHeaderIndex(planHeaders, "ProductID");
    for (let i = 1; i < planRows.length; i++) {
      const planId = getVal(planRows[i], planIdCol);
      const prodId = getVal(planRows[i], prodIdCol);
      if (planId) planMap[planId] = prodId;
    }
  }

  const actionMap = {};
  if (actionRows.length > 1) {
    const actHeaders = actionRows[0].map(h => h.toString().trim());
    const rIDCol = getHeaderIndex(actHeaders, "Receipt_ID");
    const typeCol = getHeaderIndex(actHeaders, "ActionType");
    const refCol = getHeaderIndex(actHeaders, "ReferenceNo");
    const statusCol = getHeaderIndex(actHeaders, "Status");
    const remCol = getHeaderIndex(actHeaders, "PurchaseRemarks");
    const userCol = getHeaderIndex(actHeaders, "UpdatedBy");
    const isRepCol = getHeaderIndex(actHeaders, "IsReplacementExpected");
    const repVenCol = getHeaderIndex(actHeaders, "ReplacementVendor");
    const repEtaCol = getHeaderIndex(actHeaders, "ReplacementETA");
    const resPathCol = getHeaderIndex(actHeaders, "ResolutionPath");

    for (let i = 1; i < actionRows.length; i++) {
      const rID = getVal(actionRows[i], rIDCol);
      if (rID) {
        let etaVal = getVal(actionRows[i], repEtaCol, "");
        if (etaVal && etaVal instanceof Date) {
          etaVal = etaVal.toISOString().split('T')[0];
        }
        actionMap[rID] = {
          actionType: getVal(actionRows[i], typeCol, "Pending Decision"),
          referenceNo: getVal(actionRows[i], refCol, ""),
          status: getVal(actionRows[i], statusCol, "Pending Purchase Action"),
          purchaseRemarks: getVal(actionRows[i], remCol, "None"),
          updatedBy: getVal(actionRows[i], userCol, ""),
          isReplacementExpected: getVal(actionRows[i], isRepCol, "No"),
          replacementVendor: getVal(actionRows[i], repVenCol, "None"),
          replacementETA: etaVal,
          resolutionPath: getVal(actionRows[i], resPathCol, "Awaiting Input")
        };
      }
    }
  }

  let rejections = [];

  if (grnRows.length > 1) {
    const grnHeaders = grnRows[0].map(h => h.toString().trim());
    const rIDCol = getHeaderIndex(grnHeaders, "Receipt_ID");
    const planIdCol = getHeaderIndex(grnHeaders, "Plan_ID");
    const poIdCol = getHeaderIndex(grnHeaders, "PO_ID");
    const whCol = getHeaderIndex(grnHeaders, "WarehouseID");
    const rejCol = getHeaderIndex(grnHeaders, "RejectedQty");
    const remCol = getHeaderIndex(grnHeaders, "Remarks");
    const dateCol = getHeaderIndex(grnHeaders, "Date");
    const purchaserCol = getHeaderIndex(grnHeaders, "PurchaserName");

    for (let i = 1; i < grnRows.length; i++) {
      const rQty = Number(getVal(grnRows[i], rejCol, 0));
      if (rQty > 0) {
        const rID = getVal(grnRows[i], rIDCol);
        const planId = getVal(grnRows[i], planIdCol);
        const poId = getVal(grnRows[i], poIdCol);
        const whId = getVal(grnRows[i], whCol);
        const remarks = getVal(grnRows[i], remCol);
        const rawDate = getVal(grnRows[i], dateCol);

        let productId = planMap[planId] || "Unknown SKU";
        let purchaserName = getVal(grnRows[i], purchaserCol, poPurchaserMap[poId] || "");

        const act = actionMap[rID] || {
          actionType: "Pending",
          referenceNo: "",
          status: "Pending Purchase Action",
          purchaseRemarks: remarks || "None",
          updatedBy: "",
          isReplacementExpected: "No",
          replacementVendor: "None",
          replacementETA: "",
          resolutionPath: "Awaiting Action"
        };

        rejections.push({
          receiptId: rID,
          planId,
          poId,
          orderNo: poOrderMap[poId] || "",
          purchaserName: purchaserName,
          warehouseId: whId,
          productId,
          rejectedQty: rQty,
          stage: "Inbound Receiving",
          rejectionReason: remarks || "Rejection at receiving stage",
          date: rawDate ? new Date(rawDate).toLocaleDateString() : "",
          actionType: act.actionType,
          referenceNo: act.referenceNo,
          status: act.status,
          purchaseRemarks: act.purchaseRemarks,
          updatedBy: act.updatedBy,
          isReplacementExpected: act.isReplacementExpected,
          replacementVendor: act.replacementVendor,
          replacementETA: act.replacementETA,
          resolutionPath: act.resolutionPath
        });
      }
    }
  }

  // SELF-FILTER FOR PURCHASER ROLE
  if (user && user.role) {
    const cleanRole = user.role.toString().trim().toLowerCase();
    if (cleanRole === 'purchase' || cleanRole === 'purchaser') {
      const normUserName = user.name ? user.name.toString().trim().toLowerCase() : "";
      if (normUserName) {
        rejections = rejections.filter(r => {
          const pName = (r.purchaserName || "").toString().trim().toLowerCase();
          return pName === normUserName || pName.includes(normUserName) || normUserName.includes(pName);
        });
      }
    }
  }

  return rejections;
}

// --- PURCHASER DASHBOARD DATA (COMPOSITE PO + SKU MATCHING FIX) ---

function getPurchaseDashboardData(user) {
  const isPurchaserOnly = (user && user.role && (user.role.toString().trim().toLowerCase() === 'purchase' || user.role.toString().trim().toLowerCase() === 'purchaser'));
  const normUserName = (user && user.name) ? user.name.toString().trim().toLowerCase() : "";

  const rejections = getPurchaseRejectionData(user);
  const pendingRejections = rejections.filter(r => r.status.toLowerCase().includes("pending"));

  const poSheet = SS.getSheetByName(SHEET_PURCHASE_ORDERS);
  const poRows = poSheet ? poSheet.getDataRange().getValues() : [];
  const poHeaders = poRows.length > 0 ? poRows[0].map(h => h.toString().trim()) : [];

  const poCol = autoResolveHeaderIndex(poHeaders, ["PO Number", "PO_Number", "PO ID"]),
    skuColIdx = autoResolveHeaderIndex(poHeaders, ["Unique Code", "Product Code", "ProductID", "Item Code", "SKU"]),
    descCol = autoResolveHeaderIndex(poHeaders, ["Item Description", "Description", "Item Name"]),
    vendorCol = autoResolveHeaderIndex(poHeaders, ["Vendor Name", "Vendor"]),
    qtyCol = autoResolveHeaderIndex(poHeaders, ["Qty", "Quantity"]),
    uomCol = autoResolveHeaderIndex(poHeaders, ["UOM", "Unit"]),
    dateCol = autoResolveHeaderIndex(poHeaders, ["Material Received Expected Date", "Expected Date", "ETA"]),
    statusCol = autoResolveHeaderIndex(poHeaders, ["Status", "Order Status"]),
    orderNoColIdx = autoResolveHeaderIndex(poHeaders, ["Order no.", "Order No", "Sales Order No"]),
    purchaserColIdx = autoResolveHeaderIndex(poHeaders, ["Purchase Person Name", "Purchaser"]);

  const poItemMap = {};
  const activePOs = [];

  if (poRows.length > 1) {
    for (let i = 1; i < poRows.length; i++) {
      const poId = getVal(poRows[i], poCol);
      if (!poId) continue;

      const sku = getVal(poRows[i], skuColIdx, "");
      const itemDesc = getVal(poRows[i], descCol, "");
      const vName = getVal(poRows[i], vendorCol, "");
      const orderNo = getVal(poRows[i], orderNoColIdx, "");
      const uom = getVal(poRows[i], uomCol, "");
      const purchaser = getVal(poRows[i], purchaserColIdx, "");

      // Composite Key (PO_ID + ___ + SKU)
      const compositeKey = poId.toString().trim().toUpperCase() + "___" + sku.toString().trim().toUpperCase();

      poItemMap[compositeKey] = {
        sku: sku,
        itemDescription: itemDesc,
        vendorName: vName,
        orderNo: orderNo,
        uom: uom,
        purchaser: purchaser
      };

      activePOs.push({
        poId: poId,
        productId: sku,
        itemDescription: itemDesc,
        vendorName: vName,
        qty: Number(getVal(poRows[i], qtyCol, 0)),
        uom: uom,
        purchaser: purchaser,
        expectedDate: getVal(poRows[i], dateCol) ? new Date(getVal(poRows[i], dateCol)).toLocaleDateString() : "",
        status: getVal(poRows[i], statusCol) || "Pending"
      });
    }
  }

  const grnSheet = SS.getSheetByName(SHEET_GOODS_RECEIVED);
  const grnRows = grnSheet ? grnSheet.getDataRange().getValues() : [];
  const planSheet = SS.getSheetByName(SHEET_RECEIVING_PLAN);
  const planRows = planSheet ? planSheet.getDataRange().getValues() : [];

  const planSkuMap = {};
  if (planRows.length > 1) {
    const planHeaders = planRows[0].map(h => h.toString().trim());
    const pIdCol = getHeaderIndex(planHeaders, "Plan_ID");
    const pProdCol = getHeaderIndex(planHeaders, "ProductID");
    for (let p = 1; p < planRows.length; p++) {
      planSkuMap[getVal(planRows[p], pIdCol)] = getVal(planRows[p], pProdCol);
    }
  }

  const recentReceipts = [];
  if (grnRows.length > 1) {
    const headers = grnRows[0].map(h => h.toString().trim());
    const rIDColIdx = getHeaderIndex(headers, "Receipt_ID"),
      planIdColIdx = getHeaderIndex(headers, "Plan_ID"),
      poIdColIdx = getHeaderIndex(headers, "PO_ID"),
      whColIdx = getHeaderIndex(headers, "WarehouseID"),
      recQtyColIdx = getHeaderIndex(headers, "ReceivedQty"),
      rejQtyColIdx = getHeaderIndex(headers, "RejectedQty"),
      dateColIdx = getHeaderIndex(headers, "Date"),
      invColIdx = getHeaderIndex(headers, "InvoiceNo"),
      purchaserNameColIdx = getHeaderIndex(headers, "PurchaserName");

    const startIdx = Math.max(1, grnRows.length - 30);
    for (let i = grnRows.length - 1; i >= startIdx; i--) {
      const poId = getVal(grnRows[i], poIdColIdx);
      const planId = getVal(grnRows[i], planIdColIdx);
      const actualSku = cleanDataMarkerForStorage_(planSkuMap[planId]);

      const lookupKey = poId.toString().trim().toUpperCase() + "___" + actualSku.toString().trim().toUpperCase();
      const poDetails = poItemMap[lookupKey] || { itemDescription: "", vendorName: "", orderNo: "", sku: actualSku, uom: "", purchaser: "" };
      const purchaserName = getVal(grnRows[i], purchaserNameColIdx, poDetails.purchaser || "");

      recentReceipts.push({
        receiptId: getVal(grnRows[i], rIDColIdx, "RCPT-LOG"),
        poId: poId,
        productId: actualSku || poDetails.sku || "",
        itemDescription: poDetails.itemDescription,
        vendorName: poDetails.vendorName,
        orderNo: poDetails.orderNo,
        uom: poDetails.uom,
        warehouseId: normalizeWarehouseId(getVal(grnRows[i], whColIdx)),
        receivedQty: Number(getVal(grnRows[i], recQtyColIdx, 0)),
        rejectedQty: Number(getVal(grnRows[i], rejQtyColIdx, 0)),
        invoiceNo: getVal(grnRows[i], invColIdx, ""),
        purchaserName: purchaserName,
        date: getVal(grnRows[i], dateColIdx) ? new Date(getVal(grnRows[i], dateColIdx)).toLocaleDateString() : ""
      });
    }
  }

  // Self Filter Purchaser Dashboard
  let filteredActivePOs = activePOs;
  let filteredRecentReceipts = recentReceipts;

  if (isPurchaserOnly && normUserName) {
    filteredActivePOs = activePOs.filter(po => {
      const pName = (po.purchaser || "").toString().trim().toLowerCase();
      return pName === normUserName || pName.includes(normUserName) || normUserName.includes(pName);
    });

    filteredRecentReceipts = recentReceipts.filter(rcpt => {
      const pName = (rcpt.purchaserName || "").toString().trim().toLowerCase();
      return pName === normUserName || pName.includes(normUserName) || normUserName.includes(pName);
    });
  }

  return {
    pendingRejections: pendingRejections,
    activePOs: filteredActivePOs,
    recentReceipts: filteredRecentReceipts
  };
}

// --- HELPER: CLEAN UOM STRING (PREVENTS '50 N/A' BUG) ---

