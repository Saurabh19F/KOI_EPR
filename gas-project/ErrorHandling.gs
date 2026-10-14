// ============================================================
// CENTRAL ERROR LOGGING
// ============================================================
const SHEET_SYSTEM_ERRORS = "SystemErrorLog";

function ensureSystemErrorSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_SYSTEM_ERRORS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_SYSTEM_ERRORS);
    sheet.appendRow([
      "Timestamp", "Context", "Message", "Stack",
      "Username", "Role", "WarehouseID", "URL", "UserAgent"
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function logClientError(info) {
  try {
    info = info || {};
    const user = info.user || {};
    const sheet = ensureSystemErrorSheet_();

    sheet.appendRow([
      new Date(),
      String(info.context || "client").substring(0, 150),
      String(info.message || "Unknown error").substring(0, 2000),
      String(info.stack || "").substring(0, 5000),
      String(user.username || user.name || ""),
      String(user.role || ""),
      String(user.warehouseId || ""),
      String(info.url || "").substring(0, 1000),
      String(info.userAgent || "").substring(0, 1000)
    ]);

    return { status: "success" };
  } catch (e) {
    Logger.log("Error logger failed: " + e.message);
    return { status: "failed" };
  }
}

