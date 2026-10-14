// ============================================================
// PDF / EMAIL SERVICES
// Extracted from original Code.gs without changing function names.
// ============================================================

function sendGrnEmailWithPdf(grnData, emailType) {
  try {
    const isRejectedType = (emailType === "Rejected");

    const purchaserName = cleanDisplayVal(grnData.purchasePersonName || grnData.purchaserName, "");
    const purchaserEmail = getPurchaserEmailByName(purchaserName);
    const accountsEmails = getAccountsEmails();
    const warehouseEmails = getWarehouseEmailsById(grnData.warehouseId);

    let recipientList = [...accountsEmails, ...warehouseEmails];
    if (purchaserEmail) {
      recipientList.push(purchaserEmail);
    }

    // Fallback if no role emails found
    if (typeof PURCHASE_EMAIL !== "undefined" && PURCHASE_EMAIL && PURCHASE_EMAIL.includes("@") && !PURCHASE_EMAIL.includes("example.com")) {
      recipientList.push(PURCHASE_EMAIL);
    }

    recipientList = [...new Set(recipientList.map(e => e ? e.toString().trim() : "").filter(e => e && e.includes("@")))];

    if (recipientList.length === 0) {
      Logger.log(`Email Warning (${emailType}): No valid recipient emails found.`);
      return;
    }

    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    const statusTag = isRejectedType ? "REJECTED" : "ACCEPTED";
    const poNum = cleanDisplayVal(grnData.poId, "");
    const whId = cleanDisplayVal(grnData.warehouseId, "");

    const cleanUomStr = cleanUom(grnData.uom);
    const uomDisplay = cleanUomStr ? " " + cleanUomStr : "";

    const subject = `GRN//${statusTag}//${dateStr}//${poNum}//${whId}`;

    const displayAcceptedQty = Number(grnData.receivedQty || 0);
    const displayRejectedQty = Number(grnData.rejectedQty || 0);

    let body = "";
    if (isRejectedType) {
      body = `Hi Team,\n\nALERT: Goods Received Note (GRN) with REJECTED material has been logged.\n\nSummary:\n- Vendor Name: ${cleanDisplayVal(grnData.vendorName)}\n- Invoice No: ${cleanDisplayVal(grnData.invoiceNo)}\n- Purchaser: ${purchaserName}\n- Warehouse: ${whId}\n- Rejected Qty: ${displayRejectedQty}${uomDisplay}\n- Rejection Reason: ${cleanDisplayVal(grnData.rejectionReason, "Rejection logged at dock")}\n\nPlease review the attached REJECTED GRN PDF.\n\nRegards,\nInventory Management System`;
    } else {
      body = `Hi Team,\n\nA new Goods Received Note (GRN) has been ACCEPTED in the system.\n\nSummary:\n- Vendor Name: ${cleanDisplayVal(grnData.vendorName)}\n- Invoice No: ${cleanDisplayVal(grnData.invoiceNo)}\n- Purchaser: ${purchaserName}\n- Warehouse: ${whId}\n- Accepted Qty: ${displayAcceptedQty}${uomDisplay}\n\nPlease find the ACCEPTED GRN PDF attached.\n\nRegards,\nInventory Management System`;
    }

    const htmlContent = generateUnifiedGrnHtml(grnData, statusTag);
    const blob = Utilities.newBlob(htmlContent, 'text/html', `GRN_${statusTag}_${grnData.invoiceNo || 'RECEIPT'}.html`);
    const pdfBlob = blob.getAs('application/pdf').setName(`GRN_${statusTag}_${grnData.invoiceNo || 'RECEIPT'}.pdf`);

    MailApp.sendEmail({
      to: recipientList.join(","),
      subject: subject,
      body: body,
      attachments: [pdfBlob]
    });

    Logger.log(`GRN ${statusTag} Email sent successfully to: ` + recipientList.join(", "));
  } catch (err) {
    Logger.log(`Failed to send GRN ${emailType} email: ` + err.message);
  }
}


// --- UNIFIED GRN PRINT/PREVIEW HTML ---
// Uses the exact same HTML template as the GRN PDF attached to email, so
// in-app preview and browser print stay visually consistent with the emailed PDF.
function getGrnPrintableHtml(receiptId, user) {
  if (!receiptId) throw new Error("Receipt ID is required for GRN preview.");

  // A bulk/multi GRN intentionally stores the SAME Receipt_ID on every line.
  // Reprint therefore gathers every visible row with that Receipt_ID and prints
  // one consolidated document. A normal single-line GRN continues to use the
  // existing single-GRN template.
  const warehouseData = getWarehouseData("ALL", user) || {};
  const wanted = String(receiptId || "").trim();
  const matchingRows = (warehouseData.completedReceipts || []).filter(function(row) {
    return String(row && row.receiptId || "").trim() === wanted;
  });

  if (!matchingRows.length) {
    throw new Error("Saved GRN details could not be loaded: " + receiptId);
  }

  if (matchingRows.length > 1) {
    const first = matchingRows[0] || {};
    return generateMultiGrnHtml({
      multiReceiptId: wanted,
      warehouseId: first.warehouseId || "",
      invoiceNo: first.invoiceNo || "",
      gstInvoice: first.gstInvoice || "",
      biltyNo: first.biltyNo || "",
      truckNo: first.truckNo || "",
      driverName: first.driverName || "",
      driverNo: first.driverNo || "",
      receivedBy: first.receivedBy || "",
      formattedTimestamp: first.date || "",
      items: matchingRows.map(function(row) {
        return {
          receiptId: wanted,
          planId: row.planId || "",
          poId: row.poId || "",
          orderNo: row.orderNo || "",
          buyerCode: row.buyerCode || "",
          vendorName: row.vendorName || "",
          vendorCode: row.vendorCode || "",
          purchaserName: row.purchaserName || "",
          plannerName: row.plannerName || "",
          productId: row.productId || "",
          productName: row.productName || row.itemDescription || row.productId || "",
          itemDescription: row.itemDescription || row.productName || row.productId || "",
          plannedQty: Number(row.plannedQty || 0),
          receivedQty: Number(row.receivedQty || 0),
          rejectedQty: Number(row.rejectedQty || 0),
          storageLocation: row.storageLocation || "",
          uom: cleanUom(row.uom || ""),
          rejectionReason: row.remarks || "",
          remarks: row.remarks || ""
        };
      })
    });
  }

  const grnData = matchingRows[0];
  const acceptedQty = Number(grnData.receivedQty || 0);
  const rejectedQty = Number(grnData.rejectedQty || 0);
  const statusTag = (rejectedQty > 0 && acceptedQty <= 0) ? "REJECTED" : "ACCEPTED";
  return generateUnifiedGrnHtml(grnData, statusTag);
}

// --- HELPER: CLEAN DISPLAY VALUE (REMOVES N/A, NA, NULL, UNDEFINED) ---

function generateUnifiedGrnHtml(grnData, statusTag) {
  const isRejectedType = (statusTag === "REJECTED");
  const isAcceptedType = (statusTag === "ACCEPTED");

  // Clean Display Values
  const receiptId = cleanDisplayVal(grnData.receiptId, "RCPT-LOG");
  const dateStr = cleanDisplayVal(grnData.date, new Date().toLocaleDateString());
  const orderNo = cleanDisplayVal(grnData.orderNo, "Order No Pending");
  const buyerCode = cleanDisplayVal(grnData.buyerCode, "");
  const vendorName = cleanDisplayVal(grnData.vendorName, "");
  const vendorCode = cleanDisplayVal(grnData.vendorCode, "");
  const poNum = cleanDisplayVal(grnData.poId, "");
  const purchaserName = cleanDisplayVal(grnData.purchasePersonName || grnData.purchaserName, "");

  // Guaranteed Warehouse & Planner Info
  const whId = cleanDisplayVal(grnData.warehouseId || grnData.whId, "W1");
  const planId = cleanDisplayVal(grnData.planId, "");
  const plannerName = cleanDisplayVal(grnData.plannedBy || grnData.plannerName, "");

  // Transit Data
  const invoiceNo = cleanDisplayVal(grnData.invoiceNo, "");
  const gstInvoice = cleanDisplayVal(grnData.gstInvoice, "");
  const biltyNo = cleanDisplayVal(grnData.biltyNo, "");
  const truckNo = cleanDisplayVal(grnData.truckNo, "");
  const driverName = cleanDisplayVal(grnData.driverName, "");
  const driverNo = cleanDisplayVal(grnData.driverNo, "");

  // Product Data
  const productId = cleanDisplayVal(grnData.productId, "");
  const itemDesc = cleanDisplayVal(grnData.itemDescription, productId);
  const uom = cleanUom(grnData.uom) || "Pcs";

  // Quantities Logic & Total Planned Fetch
  let acceptedQty = Number(grnData.receivedQty || 0);
  let rejectedQty = Number(grnData.rejectedQty || 0);
  let plannedQty = Number(grnData.plannedQty || grnData.totalPlannedQty || 0);

  if (plannedQty <= 0) {
    plannedQty = acceptedQty + rejectedQty;
  }

  if (isRejectedType) {
    acceptedQty = 0;
  } else if (isAcceptedType) {
    rejectedQty = 0;
  }

  // Detect Partial Receiving
  const totalThisReceipt = acceptedQty + rejectedQty;
  const isPartialReceipt = plannedQty > totalThisReceipt && plannedQty > 0;
  const remainingPending = Math.max(0, plannedQty - totalThisReceipt);

  const rejectionReason = cleanDisplayVal(grnData.rejectionReason, "");
  const remarks = cleanDisplayVal(grnData.remarks, "OK");

  // Format operator name cleanly
  let rawUser = cleanDisplayVal(grnData.receivedBy, "Warehouse Staff");
  if (rawUser.includes(" - ")) {
    rawUser = rawUser.split(" - ").pop().trim();
  }
  const receivedBy = rawUser;

  // Title Status Tag Determination
  let titleStatusText = "";
  if (isPartialReceipt) {
    titleStatusText = " (PARTIAL RECEIVE)";
  } else if (statusTag && statusTag !== "SUMMARY") {
    titleStatusText = ` (${statusTag})`;
  }

  // Partial Receiving Banner
  let partialBlockHtml = "";
  if (isPartialReceipt) {
    partialBlockHtml = `
      <div style="margin-bottom: 12px; padding: 10px; background-color: #fefce8; border: 1px solid #fef08a; color: #854d0e; border-radius: 6px; font-size: 11px;">
        <strong>📦 PARTIAL RECEIPT NOTICE:</strong> This GRN covers a partial delivery of <strong>${acceptedQty} ${uom}</strong> out of total planned <strong>${plannedQty} ${uom}</strong>. Remaining balance of <strong>${remainingPending} ${uom}</strong> stays <strong>PENDING</strong> in the receiving plan queue.
      </div>
    `;
  }

  // Rejection Banner
  let rejectionBlockHtml = "";
  if (isRejectedType || (rejectedQty > 0 && !isAcceptedType)) {
    rejectionBlockHtml = `
      <div style="margin-bottom: 12px; padding: 10px; background-color: #fef2f2; border: 1px solid #fecaca; color: #991b1b; border-radius: 6px; font-size: 11px;">
        <strong>⚠️ Rejection / Discrepancy Note:</strong> ${rejectionReason || "Rejection logged at receiving dock."}
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; color: #1e293b; background-color: #ffffff; margin: 0; padding: 10px; }
        .slip-card { max-width: 780px; margin: 0 auto; padding: 20px; border: 1px solid #cbd5e1; border-radius: 8px; background: #ffffff; box-sizing: border-box; }
        table { width: 100%; border-collapse: collapse; }
        .label { color: #64748b; font-size: 11px; }
        .val { font-size: 11px; font-weight: bold; color: #0f172a; }
        .val-indigo { font-size: 11px; font-weight: bold; color: #4338ca; }
        .panel { border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; background-color: #f8fafc; }
        .panel-title { font-size: 11px; font-weight: bold; color: #4338ca; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <div class="slip-card">
        <!-- HEADER -->
        <table style="border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 15px;">
          <tr>
            <td>
              <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase;">WAREHOUSE MANAGEMENT OPERATIONS</div>
              <div style="font-size: 18px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-top: 2px;">GOODS RECEIPT NOTE${titleStatusText}</div>
              <div style="font-size: 11px; font-family: monospace; color: #475569; margin-top: 4px;">
                Ref ID: <strong>${receiptId}</strong> | Date: <strong>${dateStr}</strong>
              </div>
            </td>
            <td style="text-align: right; vertical-align: top;">
              <div style="font-size: 22px; font-weight: 900; color: #1e1b4b; letter-spacing: 2px;">KOI</div>
              <div style="font-size: 9px; font-family: monospace; color: #64748b; margin-top: 2px;">SYS.AUTH.VERIFIED</div>
            </td>
          </tr>
        </table>

        <!-- SOURCING & LOGISTICS -->
        <table style="margin-bottom: 12px;">
          <tr>
            <td style="width: 49%; vertical-align: top;" class="panel">
              <div class="panel-title">SOURCING PARTICULARS</div>
              <table style="line-height: 1.6;">
                <tr><td class="label" style="width: 40%;">Sales Order No:</td><td class="val-indigo">${orderNo}</td></tr>
                <tr><td class="label">Buyer Code:</td><td class="val">${buyerCode}</td></tr>
                <tr><td class="label">Vendor Name:</td><td class="val">${vendorName}</td></tr>
                <tr><td class="label">Vendor Code:</td><td class="val" style="font-family: monospace;">${vendorCode}</td></tr>
                <tr><td class="label">PO Number:</td><td class="val-indigo" style="font-family: monospace;">${poNum}</td></tr>
                <tr><td class="label">Purchaser Name:</td><td class="val">${purchaserName}</td></tr>
              </table>
            </td>
            <td style="width: 2%;"></td>
            <td style="width: 49%; vertical-align: top;" class="panel">
              <div class="panel-title">LOGISTICS & PLANNING</div>
              <table style="line-height: 1.6;">
                <tr><td class="label" style="width: 40%;">Warehouse ID:</td><td class="val">${whId}</td></tr>
                <tr><td class="label">Plan ID:</td><td class="val" style="font-family: monospace;">${planId}</td></tr>
                <tr><td class="label">Planner Name:</td><td class="val">${plannerName}</td></tr>
                <tr><td class="label">Date Received:</td><td class="val">${dateStr}</td></tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- TRANSIT PARAMETERS -->
        <div class="panel" style="margin-bottom: 12px;">
          <div class="panel-title">TRANSIT PARAMETERS</div>
          <table style="line-height: 1.6;">
            <tr>
              <td style="width: 33%;"><span class="label" style="display:block;">Invoice No:</span><span class="val">${invoiceNo}</span></td>
              <td style="width: 33%;"><span class="label" style="display:block;">GST Invoice No:</span><span class="val" style="font-family: monospace;">${gstInvoice}</span></td>
              <td style="width: 33%;"><span class="label" style="display:block;">Bilty (LR) No:</span><span class="val">${biltyNo}</span></td>
            </tr>
            <tr>
              <td style="padding-top: 6px;"><span class="label" style="display:block;">Truck Vehicle No:</span><span class="val" style="font-family: monospace;">${truckNo}</span></td>
              <td style="padding-top: 6px;"><span class="label" style="display:block;">Driver Name:</span><span class="val">${driverName}</span></td>
              <td style="padding-top: 6px;"><span class="label" style="display:block;">Driver Phone:</span><span class="val">${driverNo}</span></td>
            </tr>
          </table>
        </div>

        ${partialBlockHtml}

        <!-- PRODUCT TABLE WITH TOTAL PLANNED QTY -->
        <table style="border: 1px solid #cbd5e1; font-size: 11px; margin-bottom: 12px;">
          <thead>
            <tr style="background-color: #0f172a; color: #ffffff; text-align: left; font-size: 10px; text-transform: uppercase;">
              <th style="padding: 8px 10px; width: 22%;">PRODUCT ID</th>
              <th style="padding: 8px 10px; width: 34%;">PRODUCT DESCRIPTION</th>
              <th style="padding: 8px 10px; text-align: center; width: 12%;">TOTAL PLANNED</th>
              <th style="padding: 8px 10px; text-align: center; width: 11%;">ACCEPTED</th>
              <th style="padding: 8px 10px; text-align: center; width: 11%;">REJECTED</th>
              <th style="padding: 8px 10px; text-align: right; width: 10%;">UOM</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-family: monospace; font-weight: bold; color: #334155;">${productId}</td>
              <td style="padding: 10px; font-weight: bold; color: #0f172a;">${itemDesc}</td>
              <td style="padding: 10px; text-align: center; font-weight: bold; color: #4338ca; font-size: 12px; background-color: #e0e7ff;">${plannedQty}</td>
              <td style="padding: 10px; text-align: center; font-weight: bold; color: #15803d; font-size: 12px; background-color: #f0fdf4;">${acceptedQty}</td>
              <td style="padding: 10px; text-align: center; font-weight: bold; color: #b91c1c; font-size: 12px; background-color: #fef2f2;">${rejectedQty}</td>
              <td style="padding: 10px; text-align: right; font-weight: bold;">${uom}</td>
            </tr>
          </tbody>
        </table>

        ${rejectionBlockHtml}

        <!-- REMARKS -->
        <div class="panel" style="margin-bottom: 15px;">
          <strong class="label" style="display: block; margin-bottom: 2px;">Operational Remarks:</strong>
          <span style="font-size: 11px; color: #0f172a; font-style: italic;">${remarks}</span>
        </div>

        <!-- FOOTER & SIGNATURES -->
        <table style="margin-top: 15px; border-top: 1px solid #cbd5e1; padding-top: 10px;">
          <tr>
            <td style="vertical-align: top;">
              <span class="label">System Authorized & Checked By:</span>
              <div style="font-family: monospace; font-weight: bold; color: #4338ca; margin-top: 3px; font-size: 11px;">${receivedBy}</div>
            </td>
            <td style="text-align: right; vertical-align: top;">
              <table style="float: right; text-align: center; font-size: 10px; color: #64748b;">
                <tr>
                  <td style="width: 110px; border-top: 1px solid #94a3b8; padding-top: 4px;">Auditor Signature</td>
                  <td style="width: 15px;"></td>
                  <td style="width: 110px; border-top: 1px solid #94a3b8; padding-top: 4px;">Receiver / Driver</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <div style="text-align: center; margin-top: 15px; font-size: 9px; font-family: monospace; color: #94a3b8; text-transform: uppercase;">
          SYS-GEN-${receiptId}
        </div>
      </div>
    </body>
    </html>
  `;
}

// --- SUBMIT GOODS RECEIVING (FIXED: timestampNow ReferenceError Resolved) ---

function generateTransferRequestPdf(requestId, user) {
  const transferSheet = SS.getSheetByName(SHEET_STOCK_TRANSFER);
  if (!transferSheet) throw new Error("Transfer sheet not found.");
  const tData = transferSheet.getDataRange().getValues();
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

  let reqRow = null;
  for (let i = 1; i < tData.length; i++) {
    if (getVal(tData[i], reqIdCol) === requestId) {
      reqRow = tData[i];
      break;
    }
  }

  if (!reqRow) throw new Error("Transfer Request ID not found: " + requestId);

  const reqId = getVal(reqRow, reqIdCol);
  const orderNo = getVal(reqRow, orderCol, "");
  const prodId = getVal(reqRow, prodCol, "");
  const srcWh = normalizeWarehouseId(getVal(reqRow, srcWhCol));
  const reqWh = normalizeWarehouseId(getVal(reqRow, reqWhCol));

  if (user && !transferRecordBelongsToWarehouse_(srcWh, reqWh, user)) {
    throw new Error("Access Denied: This transfer record does not belong to your warehouse.");
  }
  const reqQty = Number(getVal(reqRow, qtyCol, 0));
  const dispQty = Number(getVal(reqRow, dispQtyCol, 0));
  const recQty = Number(getVal(reqRow, recQtyCol, 0));
  const status = getVal(reqRow, statusCol, "Pending");
  const reqBy = getVal(reqRow, reqByCol, "");

  // Fetch product name
  const prodDetails = getProductDetailsFromPO(prodId);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; color: #1e293b; background-color: #ffffff; margin: 0; padding: 15px; }
        .slip-card { max-width: 750px; margin: 0 auto; padding: 20px; border: 1px solid #cbd5e1; border-radius: 8px; background: #ffffff; }
        table { width: 100%; border-collapse: collapse; }
        .label { color: #64748b; font-size: 11px; }
        .val { font-size: 11px; font-weight: bold; color: #0f172a; }
        .val-indigo { font-size: 11px; font-weight: bold; color: #4338ca; }
        .panel { border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; background-color: #f8fafc; }
        .panel-title { font-size: 11px; font-weight: bold; color: #4338ca; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <div class="slip-card">
        <table style="border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 15px;">
          <tr>
            <td>
              <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase;">INTERNAL LOGISTICS & STOCK TRANSFER</div>
              <div style="font-size: 20px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-top: 2px;">MATERIAL TRANSFER NOTE</div>
              <div style="font-size: 11px; font-family: monospace; color: #475569; margin-top: 4px;">
                Request ID: <strong>${reqId}</strong> | Date: <strong>${new Date().toLocaleDateString()}</strong>
              </div>
            </td>
            <td style="text-align: right; vertical-align: top;">
              <div style="font-size: 22px; font-weight: 900; color: #1e1b4b; letter-spacing: 2px;">KOI</div>
              <div style="font-size: 9px; font-family: monospace; color: #64748b; margin-top: 2px;">STATUS: ${status.toUpperCase()}</div>
            </td>
          </tr>
        </table>

        <table style="margin-bottom: 15px;">
          <tr>
            <td style="width: 49%; vertical-align: top;" class="panel">
              <div class="panel-title">ORDER & ROUTING DETAILS</div>
              <table style="line-height: 1.6;">
                <tr><td class="label" style="width: 42%;">Order / Job Card:</td><td class="val-indigo">${orderNo}</td></tr>
                <tr><td class="label">Requested By:</td><td class="val">${reqBy}</td></tr>
                <tr><td class="label">Transfer Status:</td><td class="val-indigo">${status}</td></tr>
              </table>
            </td>
            <td style="width: 2%;"></td>
            <td style="width: 49%; vertical-align: top;" class="panel">
              <div class="panel-title">WAREHOUSE LOCATIONS</div>
              <table style="line-height: 1.6;">
                <tr><td class="label" style="width: 42%;">Source WH (From):</td><td class="val" style="color: #b91c1c;">${srcWh}</td></tr>
                <tr><td class="label">Requesting WH (To):</td><td class="val" style="color: #15803d;">${reqWh}</td></tr>
                <tr><td class="label">Transfer Type:</td><td class="val">${srcWh === reqWh ? "Internal WH Move" : "Cross-Warehouse"}</td></tr>
              </table>
            </td>
          </tr>
        </table>

        <table style="border: 1px solid #cbd5e1; font-size: 11px; margin-bottom: 15px;">
          <thead>
            <tr style="background-color: #0f172a; color: #ffffff; text-align: left; font-size: 10px; text-transform: uppercase;">
              <th style="padding: 8px 10px; width: 25%;">PRODUCT CODE</th>
              <th style="padding: 8px 10px; width: 45%;">PRODUCT DESCRIPTION</th>
              <th style="padding: 8px 10px; text-align: center; width: 10%;">REQUESTED</th>
              <th style="padding: 8px 10px; text-align: center; width: 10%;">DISPATCHED</th>
              <th style="padding: 8px 10px; text-align: center; width: 10%;">RECEIVED</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 10px; font-family: monospace; font-weight: bold; color: #334155;">${prodId}</td>
              <td style="padding: 10px; font-weight: bold; color: #0f172a;">${prodDetails.name}</td>
              <td style="padding: 10px; text-align: center; font-weight: bold; color: #4338ca;">${reqQty}</td>
              <td style="padding: 10px; text-align: center; font-weight: bold; color: #d97706;">${dispQty}</td>
              <td style="padding: 10px; text-align: center; font-weight: bold; color: #15803d; background-color: #f0fdf4;">${recQty}</td>
            </tr>
          </tbody>
        </table>

        <table style="margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 10px;">
          <tr>
            <td style="vertical-align: top;">
              <span class="label">Authorized Requester:</span>
              <div style="font-family: monospace; font-weight: bold; color: #4338ca; margin-top: 3px; font-size: 11px;">${reqBy}</div>
            </td>
            <td style="text-align: right; vertical-align: top;">
              <table style="float: right; text-align: center; font-size: 10px; color: #64748b;">
                <tr>
                  <td style="width: 110px; border-top: 1px solid #94a3b8; padding-top: 4px;">Source WH Sender</td>
                  <td style="width: 15px;"></td>
                  <td style="width: 110px; border-top: 1px solid #94a3b8; padding-top: 4px;">Target WH Receiver</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <div style="text-align: center; margin-top: 20px; font-size: 9px; font-family: monospace; color: #94a3b8; text-transform: uppercase;">
          SYS-GEN-TRANSFER-${reqId}
        </div>
      </div>
    </body>
    </html>
  `;

  const blob = Utilities.newBlob(htmlContent, 'text/html', 'Transfer_Note.html');
  const pdfBlob = blob.getAs('application/pdf').setName(`Transfer_${reqId}.pdf`);
  return Utilities.base64Encode(pdfBlob.getBytes());
}
// --- GENERATE APPROVED TRANSFER REQUESTS REPORT PDF ---

function generateApprovedTransfersPdf(warehouseId, user) {
  const normWh = normalizeWarehouseId(warehouseId || (user ? user.warehouseId : "All"));
  const data = getWarehouseData(normWh);
  const dispatches = data.pendingDispatches || [];

  let rowsHtml = dispatches.map((row, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
      <td style="padding: 7px 8px; font-family: monospace; font-size: 10px; font-weight: bold; color: #4338ca;">${row.transferId}</td>
      <td style="padding: 7px 8px; font-weight: bold; font-size: 10px; color: #0f172a;">${cleanDisplayVal(row.orderNo, '')}</td>
      <td style="padding: 7px 8px; font-family: monospace; font-size: 10px; font-weight: bold; color: #334155;">${row.productId}</td>
      <td style="padding: 7px 8px; font-size: 10px; font-weight: bold; color: #0f172a;">${row.productName || row.productId}</td>
      <td style="padding: 7px 8px; font-size: 10px; color: #475569;">${cleanDisplayVal(row.requestedBy, '')}</td>
      <td style="padding: 7px 8px; font-size: 10px; text-align: center; font-weight: bold; color: #4338ca; background-color: #e0e7ff;">${row.qty}</td>
      <td style="padding: 7px 8px; font-size: 10px; text-align: center; font-weight: bold; color: #16a34a;">${row.toWarehouse}</td>
      <td style="padding: 7px 8px; font-size: 10px; text-align: right; font-weight: bold; color: #d97706;">Approved (Pending Dispatch)</td>
    </tr>
  `).join('');

  if (dispatches.length === 0) {
    rowsHtml = `<tr><td colspan="8" style="padding: 20px; text-align: center; color: #64748b; font-size: 11px;">No approved transfer requests pending dispatch for Warehouse ${normWh}.</td></tr>`;
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
              <div style="font-size: 9px; font-weight: bold; color: #64748b; text-transform: uppercase;">OUTBOUND LOGISTICS MANAGEMENT</div>
              <div class="title">APPROVED TRANSFER REQUESTS REPORT (${normWh})</div>
              <div class="sub">Generated On: <strong>${dateToday} ${timeToday}</strong> | Source Warehouse: <strong>${normWh}</strong></div>
            </td>
            <td style="text-align: right; vertical-align: top; border: none;">
              <div style="font-size: 22px; font-weight: 900; color: #1e1b4b; letter-spacing: 2px;">KOI</div>
              <div style="font-size: 9px; font-family: monospace; color: #64748b;">SYS.AUTH.VERIFIED</div>
            </td>
          </tr>
        </table>
      </div>

      <div class="stats-bar">
        Total Pending Dispatches: <strong>${dispatches.length}</strong> | Source Warehouse (From): <strong>${normWh}</strong> | Status: <strong>Ready for Send Material</strong>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 12%;">REQ ID</th>
            <th style="width: 15%;">ORDER NO (JOB CARD)</th>
            <th style="width: 15%;">PRODUCT ID</th>
            <th style="width: 25%;">ITEM NAME</th>
            <th style="width: 13%;">REQUESTER</th>
            <th style="width: 7%; text-align: center;">REQ QTY</th>
            <th style="width: 8%; text-align: center;">TO WH</th>
            <th style="width: 15%; text-align: right;">STATUS</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div style="margin-top: 15px; font-size: 8px; font-family: monospace; color: #94a3b8; text-align: center; text-transform: uppercase;">
        CONFIDENTIAL - SYSTEM GENERATED MATERIAL DISPATCH REPORT - KOI IMS
      </div>
    </body>
    </html>
  `;

  const blob = Utilities.newBlob(htmlContent, 'text/html', 'Approved_Transfers.html');
  const pdfBlob = blob.getAs('application/pdf').setName(`Approved_Transfers_${normWh}_${new Date().toISOString().split('T')[0]}.pdf`);
  return Utilities.base64Encode(pdfBlob.getBytes());
}

// --- 1. BULK GOODS RECEIVING LOGIC ---

function sendBulkGrnEmailWithPdf(bulkData, statusType) {
  try {
    const accountsEmails = getAccountsEmails();
    const warehouseEmails = getWarehouseEmailsById(bulkData.items[0] ? bulkData.items[0].warehouseId : "W1");
    let recipientList = [...accountsEmails, ...warehouseEmails];

    if (typeof PURCHASE_EMAIL !== "undefined" && PURCHASE_EMAIL && PURCHASE_EMAIL.includes("@") && !PURCHASE_EMAIL.includes("example.com")) {
      recipientList.push(PURCHASE_EMAIL);
    }

    recipientList = [...new Set(recipientList.map(e => e ? e.toString().trim() : "").filter(e => e && e.includes("@")))];
    if (recipientList.length === 0) return;

    const subject = `BULK GRN//${statusType}//${bulkData.invoiceNo}//${bulkData.items.length} ITEMS`;
    const htmlContent = generateUnifiedBulkGrnHtml(bulkData, statusType);
    const blob = Utilities.newBlob(htmlContent, 'text/html', `BULK_GRN_${bulkData.invoiceNo}.html`);
    const pdfBlob = blob.getAs('application/pdf').setName(`BULK_GRN_${bulkData.invoiceNo}.pdf`);

    MailApp.sendEmail({
      to: recipientList.join(","),
      subject: subject,
      body: `Hi Team,\n\nA new BULK Goods Received Note (GRN) covering ${bulkData.items.length} items has been logged.\n\nInvoice No: ${bulkData.invoiceNo}\nVehicle No: ${bulkData.truckNo}\nDriver: ${bulkData.driverName}\n\nPlease find the master consolidated GRN PDF attached.\n\nRegards,\nInventory Management System`,
      attachments: [pdfBlob]
    });
  } catch (err) {
    Logger.log("Failed to send Bulk GRN PDF email: " + err.message);
  }
}

// --- UNIFIED BULK GRN HTML GENERATOR FOR EMAIL PDF ---

function generateUnifiedBulkGrnHtml(bulkData, statusTag) {
  const firstItem = bulkData.items[0] || {};

  const orderNo = cleanDisplayVal(bulkData.orderNo || firstItem.orderNo, "Bulk");
  const buyerCode = cleanDisplayVal(bulkData.buyerCode || firstItem.buyerCode, "");
  const vendorName = cleanDisplayVal(bulkData.vendorName || firstItem.vendorName, "");
  const vendorCode = cleanDisplayVal(bulkData.vendorCode || firstItem.vendorCode, "");
  const poNum = cleanDisplayVal(bulkData.poId || firstItem.poId, "");
  const purchaserName = cleanDisplayVal(bulkData.purchaserName || firstItem.purchasePersonName, "");
  const plannerName = cleanDisplayVal(bulkData.plannedBy || firstItem.plannedBy, "");

  let rowsHtml = bulkData.items.map((item, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
      <td style="padding: 7px; font-family: monospace; font-weight: bold; color: #334155;">${item.productId}</td>
      <td style="padding: 7px; font-weight: bold; color: #0f172a;">${cleanDisplayVal(item.itemDescription, item.productId)}</td>
      <td style="padding: 7px; font-weight: bold; color: #4338ca; text-align: center;">${item.plannedQty || (Number(item.receivedQty) + Number(item.rejectedQty))}</td>
      <td style="padding: 7px; font-weight: bold; color: #15803d; text-align: center; background-color: #f0fdf4;">${item.receivedQty}</td>
      <td style="padding: 7px; font-weight: bold; color: #b91c1c; text-align: center; background-color: #fef2f2;">${item.rejectedQty}</td>
      <td style="padding: 7px; text-align: center;">${item.storageLocation || 'Inward-Staging'}</td>
      <td style="padding: 7px; text-align: right;">${cleanUom(item.uom) || 'Pcs'}</td>
    </tr>
    ${item.rejectedQty > 0 ? `<tr style="background-color: #fff1f2;"><td colspan="7" style="padding: 6px; color: #9f1239; font-size: 10px;"><strong>⚠️ Rejection Reason:</strong> ${item.rejectionReason}</td></tr>` : ''}
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; color: #1e293b; margin: 0; padding: 10px; }
        .slip-card { max-width: 800px; margin: 0 auto; padding: 15px; border: 1px solid #cbd5e1; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; }
        .label { color: #64748b; font-size: 10px; }
        .val { font-size: 11px; font-weight: bold; color: #0f172a; }
        .panel { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; background-color: #f8fafc; margin-bottom: 10px; }
        .panel-title { font-size: 10px; font-weight: bold; color: #4338ca; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-bottom: 6px; }
      </style>
    </head>
    <body>
      <div class="slip-card">
        <table style="border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 10px;">
          <tr>
            <td>
              <div style="font-size: 9px; font-weight: bold; color: #64748b;">WAREHOUSE LOGISTICS OPERATIONS</div>
              <div style="font-size: 16px; font-weight: 800; color: #0f172a;">MASTER BULK GOODS RECEIPT NOTE</div>
              <div style="font-size: 10px; font-family: monospace; color: #475569;">Ref ID: <strong>${bulkData.masterReceiptId}</strong> | Date: <strong>${bulkData.formattedTimestamp}</strong></div>
            </td>
            <td style="text-align: right; vertical-align: top;">
              <div style="font-size: 20px; font-weight: 900; color: #1e1b4b;">KOI</div>
            </td>
          </tr>
        </table>

        <!-- SOURCING & LOGISTICS -->
        <table style="margin-bottom: 10px;">
          <tr>
            <td style="width: 49%; vertical-align: top;" class="panel">
              <div class="panel-title">SOURCING PARTICULARS</div>
              <table style="line-height: 1.5;">
                <tr><td class="label" style="width: 40%;">Sales Order No:</td><td class="val" style="color: #4338ca;">${orderNo}</td></tr>
                <tr><td class="label">Buyer Code:</td><td class="val">${buyerCode}</td></tr>
                <tr><td class="label">Vendor Name:</td><td class="val">${vendorName}</td></tr>
                <tr><td class="label">PO Number:</td><td class="val" style="color: #4338ca; font-family: monospace;">${poNum}</td></tr>
                <tr><td class="label">Purchaser Name:</td><td class="val">${purchaserName}</td></tr>
              </table>
            </td>
            <td style="width: 2%;"></td>
            <td style="width: 49%; vertical-align: top;" class="panel">
              <div class="panel-title">LOGISTICS & PLANNING</div>
              <table style="line-height: 1.5;">
                <tr><td class="label" style="width: 40%;">Warehouse ID:</td><td class="val">${bulkData.warehouseId || firstItem.warehouseId}</td></tr>
                <tr><td class="label">Planner Name:</td><td class="val">${plannerName}</td></tr>
                <tr><td class="label">Date Received:</td><td class="val">${bulkData.formattedTimestamp}</td></tr>
                <tr><td class="label">Total Lines:</td><td class="val" style="color: #4338ca;">${bulkData.items.length} Items</td></tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- TRANSIT PARAMETERS -->
        <div class="panel">
          <div class="panel-title">CARGO TRANSPORT PARAMETERS</div>
          <table>
            <tr>
              <td><span class="label">Invoice No:</span> <span class="val">${bulkData.invoiceNo}</span></td>
              <td><span class="label">GSTIN:</span> <span class="val" style="font-family: monospace;">${bulkData.gstInvoice}</span></td>
              <td><span class="label">Bilty No:</span> <span class="val">${bulkData.biltyNo}</span></td>
            </tr>
            <tr>
              <td style="padding-top:4px;"><span class="label">Truck Vehicle:</span> <span class="val">${bulkData.truckNo}</span></td>
              <td style="padding-top:4px;"><span class="label">Driver Name:</span> <span class="val">${bulkData.driverName}</span></td>
              <td style="padding-top:4px;"><span class="label">Driver Phone:</span> <span class="val">${bulkData.driverNo}</span></td>
            </tr>
          </table>
        </div>

        <table style="border: 1px solid #cbd5e1; font-size: 10px; margin-bottom: 10px;">
          <thead>
            <tr style="background-color: #0f172a; color: #ffffff; text-align: left; font-size: 9px; text-transform: uppercase;">
              <th style="padding: 6px; width: 20%;">PRODUCT CODE</th>
              <th style="padding: 6px; width: 30%;">DESCRIPTION</th>
              <th style="padding: 6px; text-align: center; width: 10%;">PLANNED</th>
              <th style="padding: 6px; text-align: center; width: 10%;">ACCEPTED</th>
              <th style="padding: 6px; text-align: center; width: 10%;">REJECTED</th>
              <th style="padding: 6px; text-align: center; width: 12%;">LOCATION</th>
              <th style="padding: 6px; text-align: right; width: 8%;">UOM</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div style="border-top: 1px solid #cbd5e1; padding-top: 8px; margin-top: 10px;">
          <span class="label">System Verified & Received By:</span>
          <div style="font-family: monospace; font-weight: bold; color: #4338ca; font-size: 10px; margin-top: 2px;">${bulkData.receivedBy}</div>
        </div>
      </div>
    </body>
    </html>
  `;
}
// ====================================================================
// 📌 SECTION 1: BACKEND MULTI-GRN TRANSACTION & PDF GENERATOR
// ====================================================================

function generateMultiGrnHtml(grnData) {
  const items = grnData.items || [];
  const firstItem = items[0] || {};

  let itemRowsHtml = items.map((item, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
      <td style="padding: 8px; font-family: monospace; font-weight: bold; color: #334155;">${item.productId}</td>
      <td style="padding: 8px; font-weight: bold; color: #0f172a;">${item.itemDescription}</td>
      <td style="padding: 8px; font-family: monospace; color: #4338ca;">${item.poId}</td>
      <td style="padding: 8px; text-align: center; font-weight: bold; background-color: #e0e7ff; color: #4338ca;">${item.plannedQty}</td>
      <td style="padding: 8px; text-align: center; font-weight: bold; color: #15803d; background-color: #f0fdf4;">${item.receivedQty}</td>
      <td style="padding: 8px; text-align: center; font-weight: bold; color: #b91c1c; background-color: #fef2f2;">${item.rejectedQty}</td>
      <td style="padding: 8px; text-align: right; font-weight: bold;">${item.uom}</td>
    </tr>
    ${item.rejectedQty > 0 ? `<tr style="background-color: #fff1f2;"><td colspan="7" style="padding: 6px; color: #9f1239; font-size: 10px;"><strong>⚠️ Discrepancy / Rejection Reason:</strong> ${item.rejectionReason}</td></tr>` : ''}
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; color: #1e293b; background-color: #ffffff; margin: 0; padding: 10px; }
        .slip-card { max-width: 780px; margin: 0 auto; padding: 20px; border: 1px solid #cbd5e1; border-radius: 8px; box-sizing: border-box; }
        table { width: 100%; border-collapse: collapse; }
        .label { color: #64748b; font-size: 11px; }
        .val { font-size: 11px; font-weight: bold; color: #0f172a; }
        .panel { border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; background-color: #f8fafc; }
        .panel-title { font-size: 11px; font-weight: bold; color: #4338ca; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <div class="slip-card">
        <!-- HEADER -->
        <table style="border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 15px;">
          <tr>
            <td>
              <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase;">WAREHOUSE MANAGEMENT OPERATIONS</div>
              <div style="font-size: 18px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-top: 2px;">BULK GOODS RECEIPT NOTE</div>
              <div style="font-size: 11px; font-family: monospace; color: #475569; margin-top: 4px;">
                GRN No: <strong>${grnData.multiReceiptId}</strong> | Date: <strong>${grnData.formattedTimestamp || new Date().toLocaleDateString()}</strong>
              </div>
            </td>
            <td style="text-align: right; vertical-align: top;">
              <div style="font-size: 22px; font-weight: 900; color: #1e1b4b; letter-spacing: 2px;">KOI</div>
              <div style="font-size: 9px; font-family: monospace; color: #64748b; margin-top: 2px;">SYS.AUTH.VERIFIED</div>
            </td>
          </tr>
        </table>

        <!-- SOURCING & LOGISTICS -->
        <table style="margin-bottom: 12px;">
          <tr>
            <td style="width: 49%; vertical-align: top;" class="panel">
              <div class="panel-title">SOURCING PARTICULARS</div>
              <table style="line-height: 1.6;">
                <tr><td class="label" style="width: 40%;">Vendor Name:</td><td class="val">${cleanDisplayVal(firstItem.vendorName, "Multiple")}</td></tr>
                <tr><td class="label">Vendor Code:</td><td class="val" style="font-family: monospace;">${cleanDisplayVal(firstItem.vendorCode, "")}</td></tr>
                <tr><td class="label">Purchaser Name:</td><td class="val">${cleanDisplayVal(firstItem.purchaserName, "")}</td></tr>
              </table>
            </td>
            <td style="width: 2%;"></td>
            <td style="width: 49%; vertical-align: top;" class="panel">
              <div class="panel-title">LOGISTICS & PLANNING</div>
              <table style="line-height: 1.6;">
                <tr><td class="label" style="width: 40%;">Warehouse ID:</td><td class="val">${grnData.warehouseId}</td></tr>
                <tr><td class="label">Planner Name:</td><td class="val">${cleanDisplayVal(firstItem.plannerName, "")}</td></tr>
                <tr><td class="label">Total Line Items:</td><td class="val" style="color: #4338ca;">${items.length} Items</td></tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- CARGO TRANSPORT PARAMETERS -->
        <div class="panel" style="margin-bottom: 12px;">
          <div class="panel-title">CARGO TRANSPORT PARAMETERS</div>
          <table style="line-height: 1.6;">
            <tr>
              <td style="width: 33%;"><span class="label" style="display:block;">Invoice No:</span><span class="val">${grnData.invoiceNo}</span></td>
              <td style="width: 33%;"><span class="label" style="display:block;">GST Invoice No:</span><span class="val" style="font-family: monospace;">${grnData.gstInvoice}</span></td>
              <td style="width: 33%;"><span class="label" style="display:block;">Bilty (LR) No:</span><span class="val">${grnData.biltyNo}</span></td>
            </tr>
            <tr>
              <td style="padding-top: 6px;"><span class="label" style="display:block;">Truck Vehicle No:</span><span class="val" style="font-family: monospace;">${grnData.truckNo}</span></td>
              <td style="padding-top: 6px;"><span class="label" style="display:block;">Driver Name:</span><span class="val">${grnData.driverName}</span></td>
              <td style="padding-top: 6px;"><span class="label" style="display:block;">Driver Phone:</span><span class="val">${grnData.driverNo}</span></td>
            </tr>
          </table>
        </div>

        <!-- PRODUCT TABLE -->
        <table style="border: 1px solid #cbd5e1; font-size: 11px; margin-bottom: 12px;">
          <thead>
            <tr style="background-color: #0f172a; color: #ffffff; text-align: left; font-size: 10px; text-transform: uppercase;">
              <th style="padding: 8px 10px; width: 18%;">PRODUCT ID</th>
              <th style="padding: 8px 10px; width: 32%;">DESCRIPTION</th>
              <th style="padding: 8px 10px; width: 16%;">PO NUMBER</th>
              <th style="padding: 8px 10px; text-align: center; width: 10%;">PLANNED</th>
              <th style="padding: 8px 10px; text-align: center; width: 10%;">ACCEPTED</th>
              <th style="padding: 8px 10px; text-align: center; width: 10%;">REJECTED</th>
              <th style="padding: 8px 10px; text-align: right; width: 8%;">UOM</th>
            </tr>
          </thead>
          <tbody>
            ${itemRowsHtml}
          </tbody>
        </table>

        <!-- FOOTER & SIGNATURES -->
        <table style="margin-top: 15px; border-top: 1px solid #cbd5e1; padding-top: 10px;">
          <tr>
            <td style="vertical-align: top;">
              <span class="label">System Authorized & Checked By:</span>
              <div style="font-family: monospace; font-weight: bold; color: #4338ca; margin-top: 3px; font-size: 11px;">${grnData.receivedBy}</div>
            </td>
            <td style="text-align: right; vertical-align: top;">
              <table style="float: right; text-align: center; font-size: 10px; color: #64748b;">
                <tr>
                  <td style="width: 110px; border-top: 1px solid #94a3b8; padding-top: 4px;">Auditor Signature</td>
                  <td style="width: 15px;"></td>
                  <td style="width: 110px; border-top: 1px solid #94a3b8; padding-top: 4px;">Receiver / Driver</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <div style="text-align: center; margin-top: 15px; font-size: 9px; font-family: monospace; color: #94a3b8; text-transform: uppercase;">
          SYS-GEN-MULTI-${grnData.multiReceiptId}
        </div>
      </div>
    </body>
    </html>
  `;
}

// --- SEND MULTI-GRN EMAIL WITH ATTACHED PDF ---

function sendMultiGrnEmailWithPdf(multiGrnData) {
  const accountsEmails = getAccountsEmails();
  const warehouseEmails = getWarehouseEmailsById(multiGrnData.warehouseId);
  let recipientList = [...new Set([...accountsEmails, ...warehouseEmails])].filter(e => e && e.includes("@"));

  if (recipientList.length === 0 && typeof PURCHASE_EMAIL !== "undefined") {
    recipientList.push(PURCHASE_EMAIL);
  }

  if (recipientList.length === 0) return;

  const subject = `MULTI-GRN//ACCEPTED//${new Date().toLocaleDateString()}//${multiGrnData.invoiceNo}//${multiGrnData.warehouseId}`;
  const body = `Hi Team,\n\nA Multi-Item Goods Received Note (GRN) has been processed for Warehouse ${multiGrnData.warehouseId}.\n\nInvoice No: ${multiGrnData.invoiceNo}\nTotal Items Processed: ${multiGrnData.items.length}\n\nPlease review the attached Multi-GRN PDF.\n\nRegards,\nInventory Management System`;

  const htmlContent = generateMultiGrnHtml(multiGrnData);
  const blob = Utilities.newBlob(htmlContent, 'text/html', `Multi_GRN_${multiGrnData.invoiceNo}.html`);
  const pdfBlob = blob.getAs('application/pdf').setName(`Multi_GRN_${multiGrnData.invoiceNo}.pdf`);

  MailApp.sendEmail({
    to: recipientList.join(","),
    subject: subject,
    body: body,
    attachments: [pdfBlob]
  });
}

