/**
 * KOI-ERP Sales Enquiry Module — Full Integration Test
 * Tests: Auth → Enquiry CRUD → Items → Status Transitions →
 *        Documents → Punching Logs → Reminders → Cross-module (masters)
 * Runs against live servers: API @ 3001
 */
const http = require('http');

const API = { host: 'localhost', port: 3001, prefix: '/api/v1' };
let TOKEN = null;
let passed = 0, failed = 0;

// ───── HTTP helpers ─────
function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
    const data = body ? JSON.stringify(body) : null;
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
    const r = http.request({ ...API, path: API.prefix + path, method, headers }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw), raw }); }
        catch { resolve({ status: res.statusCode, body: null, raw: raw.slice(0, 400) }); }
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}
const GET = p => req('GET', p);
const POST = (p, b) => req('POST', p, b);
const PATCH = (p, b) => req('PATCH', p, b);
const DELETE = p => req('DELETE', p);

function check(label, ok, detail = '') {
  if (ok) { passed++; console.log(`  ✅ ${label}`); }
  else { failed++; console.log(`  ❌ ${label}${detail ? ' → ' + detail : ''}`); }
}

function section(t) { console.log(`\n━━━ ${t} ━━━`); }

// ───── MAIN ─────
async function run() {
  console.log('🚀 KOI-ERP Sales Enquiry Module — Full Integration Test\n');

  // ─────────────────────────────────────────────
  // 1. AUTHENTICATION
  // ─────────────────────────────────────────────
  section('1. AUTHENTICATION');
  const lr = await POST('/auth-v2/login', { email: 'admin@erp.com', password: 'admin123' });
  TOKEN = lr.body?.accessToken;
  check('Login 201 + token', lr.status === 200 || lr.status === 201, `status=${lr.status}`);
  if (!TOKEN) { console.log('\n🛑 No token – aborting.'); process.exit(1); }

  // ─────────────────────────────────────────────
  // 2. MASTER DATA PRE-CHECKS (needed for enquiry)
  // ─────────────────────────────────────────────
  section('2. MASTER DATA PRE-CHECKS');

  // Customers
  const custRes = await GET('/masters/customers');
  check('GET /masters/customers 200', custRes.status === 200, `status=${custRes.status}`);
  const customers = custRes.body?.data || custRes.body || [];
  check('Has customers', customers.length > 0, `count=${customers.length}`);
  const customerId = customers[0]?.customerId;
  console.log(`  Sample customer: ${customers[0]?.customerName} (${customerId})`);

  // Products
  const prodRes = await GET('/masters/products');
  check('GET /masters/products 200', prodRes.status === 200, `status=${prodRes.status}`);
  const products = prodRes.body?.data || prodRes.body || [];
  check('Has products', products.length > 0, `count=${products.length}`);
  const product = products[0];
  console.log(`  Sample product: ${product?.productName} (${product?.productId})`);

  // Payment Terms
  const ptRes = await GET('/masters/payment-terms');
  check('GET /masters/payment-terms 200', ptRes.status === 200);
  const paymentTermsId = (ptRes.body?.data || ptRes.body || [])[0]?.id;

  // Currencies
  const curRes = await GET('/masters/currencies');
  check('GET /masters/currencies 200', curRes.status === 200);
  const currencyId = (curRes.body?.data || curRes.body || [])[0]?.id;

  // ─────────────────────────────────────────────
  // 3. CREATE SALES ENQUIRY (full payload)
  // ─────────────────────────────────────────────
  section('3. CREATE SALES ENQUIRY');

  const createPayload = {
    customerId,
    enquiryDate: new Date().toISOString().split('T')[0],
    buyerCode: 'BUY-TEST-001',
    buyerName: 'Integration Test Buyer',
    contactName: 'Test Contact',
    contactNumber: '9876543210',
    buyerEmail: 'test@buyer.com',
    country: 'India',
    state: 'Maharashtra',
    city: 'Mumbai',
    poNumber: 'PO-INT-001',
    pod: 'JNPT',
    paymentTermsId,
    currencyId,
    shipmentDetails: 'By Sea',
    portOfLoading: 'Mumbai',
    isExportEnquiry: false,
    isPoReceived: true,
    isPurchaseRequired: true,
    isRateCalculationRequired: true,
    isApprovalRequired: false,
    isEmailReminderRequired: false,
    remarks: 'Integration test enquiry - auto generated',
    isBillingSameAsDelivery: true,
    billingAddress: '123 Test Street, Mumbai',
    deliveryAddress: '123 Test Street, Mumbai',
    items: [
      {
        productId: product?.productId,
        productName: product?.productName,
        sku: product?.sku,
        quantity: 10,
        unitPerCarton: 24,
        cbmPerBox: product?.cbmPerBox ? Number(product.cbmPerBox) : 0.5,
        expectedRate: product?.mrp ? Number(product.mrp) : 100,
        unitSize: '30x20x10cm',
        remarks: 'Master product line item - integration test',
        isManualEntry: false,
        masterStatus: 'master_product',
      },
      {
        productName: 'Manual Test Product XYZ',
        quantity: 5,
        unitSize: '20x15x8cm',
        cbmPerBox: 0.24,
        expectedRate: 250,
        remarks: 'Manual entry line item - integration test',
        isManualEntry: true,
        manualProductName: 'Manual Test Product XYZ',
        masterStatus: 'not_in_master',
      }
    ],
  };

  const createRes = await POST('/sales-enquiries', createPayload);
  check('POST /sales-enquiries 201', [200, 201].includes(createRes.status), `status=${createRes.status} body=${JSON.stringify(createRes.body).slice(0,200)}`);
  const enquiry = createRes.body;
  const enquiryId = enquiry?.enquiryOrderId;
  const enquiryNo = enquiry?.enquiryOrderNo;
  check('Has enquiryOrderId', !!enquiryId, `id=${enquiryId}`);
  check('Has enquiryOrderNo', !!enquiryNo, `no=${enquiryNo}`);
  console.log(`  Created: ${enquiryNo} (${enquiryId})`);

  if (!enquiryId) { console.log('\n🛑 No enquiry ID – aborting item tests.'); process.exit(1); }

  // ─────────────────────────────────────────────
  // 4. GET ALL ENQUIRIES (pagination + search)
  // ─────────────────────────────────────────────
  section('4. GET ALL ENQUIRIES');

  const listRes = await GET('/sales-enquiries?page=1&limit=20');
  check('GET /sales-enquiries 200', listRes.status === 200, `status=${listRes.status}`);
  const enquiries = listRes.body?.data || listRes.body || [];
  check('Has enquiries', enquiries.length > 0, `count=${enquiries.length}`);
  console.log(`  Total enquiries: ${listRes.body?.total || enquiries.length}`);

  // Search by buyer name
  const searchRes = await GET(`/sales-enquiries?search=Integration`);
  check('GET /sales-enquiries?search works', searchRes.status === 200, `status=${searchRes.status}`);

  // Filter by status
  const draftRes = await GET('/sales-enquiries?status=draft');
  check('GET /sales-enquiries?status=draft 200', draftRes.status === 200, `status=${draftRes.status}`);

  // ─────────────────────────────────────────────
  // 5. GET ENQUIRY BY ID
  // ─────────────────────────────────────────────
  section('5. GET ENQUIRY BY ID');

  const getRes = await GET(`/sales-enquiries/${enquiryId}`);
  check('GET /sales-enquiries/:id 200', getRes.status === 200, `status=${getRes.status}`);
  check('Correct enquiryOrderNo', getRes.body?.enquiryOrderNo === enquiryNo, `got=${getRes.body?.enquiryOrderNo}`);
  check('Remarks preserved', getRes.body?.remarks === 'Integration test enquiry - auto generated', `got=${getRes.body?.remarks}`);
  check('customerId linked', getRes.body?.customerId === customerId, `got=${getRes.body?.customerId}`);

  // ─────────────────────────────────────────────
  // 6. GET ENQUIRY STATS
  // ─────────────────────────────────────────────
  section('6. GET ENQUIRY STATS');
  const statsRes = await GET('/sales-enquiries/stats');
  check('GET /sales-enquiries/stats 200', statsRes.status === 200, `status=${statsRes.status}`);
  console.log(`  Stats: ${JSON.stringify(statsRes.body).slice(0, 150)}`);

  // ─────────────────────────────────────────────
  // 7. GET ENQUIRY ITEMS
  // ─────────────────────────────────────────────
  section('7. GET ENQUIRY ITEMS');

  const itemsRes = await GET(`/sales-enquiries/${enquiryId}/items`);
  check('GET /sales-enquiries/:id/items 200', itemsRes.status === 200, `status=${itemsRes.status}`);
  const items = itemsRes.body || [];
  check('Has line items', items.length > 0, `count=${items.length}`);
  check('Has 2 items (master + manual)', items.length >= 2, `count=${items.length}`);

  const masterItem = items.find(i => !i.isManualEntry);
  const manualItem = items.find(i => i.isManualEntry);
  check('Master product item present', !!masterItem, `items=${items.map(i=>i.productName).join(',')}`);
  check('Manual entry item present', !!manualItem, `items=${items.map(i=>i.productName).join(',')}`);
  check('Manual item name correct', manualItem?.manualProductName === 'Manual Test Product XYZ');

  const itemId = masterItem?.itemId;
  console.log(`  Master item: ${masterItem?.productName} (${itemId})`);
  console.log(`  Manual item: ${manualItem?.manualProductName}`);

  // ─────────────────────────────────────────────
  // 8. ADD ITEM TO ENQUIRY
  // ─────────────────────────────────────────────
  section('8. ADD ITEM TO ENQUIRY');

  const addItemRes = await POST(`/sales-enquiries/${enquiryId}/items`, {
    productName: 'Additional Test Product',
    quantity: 3,
    unitSize: '10x10x5cm',
    cbmPerBox: 0.1,
    expectedRate: 75,
    remarks: 'Additional item added via test',
    isManualEntry: false,
  });
  check('POST /sales-enquiries/:id/items 201', [200, 201].includes(addItemRes.status), `status=${addItemRes.status}`);

  // Re-fetch items to confirm
  const items2Res = await GET(`/sales-enquiries/${enquiryId}/items`);
  const items2 = items2Res.body || [];
  check('Items count increased', items2.length >= 3, `count=${items2.length}`);

  // ─────────────────────────────────────────────
  // 9. UPDATE ENQUIRY ITEM
  // ─────────────────────────────────────────────
  section('9. UPDATE ENQUIRY ITEM');

  if (itemId) {
    const updateItemRes = await PATCH(`/sales-enquiries/items/${itemId}`, {
      quantity: 25,
      expectedRate: 150,
    });
    check('PATCH /sales-enquiries/items/:itemId 200', updateItemRes.status === 200, `status=${updateItemRes.status}`);

    // Verify updated
    const itemsAfterUpdate = await GET(`/sales-enquiries/${enquiryId}/items`);
    const updatedItem = (itemsAfterUpdate.body || []).find(i => i.itemId === itemId);
    check('Item quantity updated to 25', updatedItem?.quantity === 25, `got=${updatedItem?.quantity}`);
    check('Item rate updated to 150', parseFloat(updatedItem?.expectedRate) === 150, `got=${updatedItem?.expectedRate}`);
  }

  // ─────────────────────────────────────────────
  // 10. DELETE AN ITEM
  // ─────────────────────────────────────────────
  section('10. DELETE ENQUIRY ITEM');

  // Get a fresh items list and delete the last one (the additional item we added)
  const items3Res = await GET(`/sales-enquiries/${enquiryId}/items`);
  const items3 = items3Res.body || [];
  const lastItem = items3[items3.length - 1];
  if (lastItem?.itemId) {
    const delItemRes = await DELETE(`/sales-enquiries/items/${lastItem.itemId}`);
    check('DELETE /sales-enquiries/items/:itemId 200', delItemRes.status === 200, `status=${delItemRes.status}`);
  }

  // ─────────────────────────────────────────────
  // 11. UPDATE ENQUIRY (general fields)
  // ─────────────────────────────────────────────
  section('11. UPDATE ENQUIRY');

  const updateEnqRes = await PATCH(`/sales-enquiries/${enquiryId}`, {
    poNumber: 'PO-UPDATED-001',
    shipmentDetails: 'By Air',
    remarks: 'Enquiry updated via integration test',
  });
  check('PATCH /sales-enquiries/:id 200', updateEnqRes.status === 200, `status=${updateEnqRes.status}`);

  // Verify update persisted
  const afterUpdate = await GET(`/sales-enquiries/${enquiryId}`);
  check('poNumber updated', afterUpdate.body?.poNumber === 'PO-UPDATED-001', `got=${afterUpdate.body?.poNumber}`);
  check('remarks updated', afterUpdate.body?.remarks === 'Enquiry updated via integration test', `got=${afterUpdate.body?.remarks}`);

  // ─────────────────────────────────────────────
  // 12. STATUS TRANSITIONS
  // ─────────────────────────────────────────────
  section('12. STATUS TRANSITIONS');

  // Get available transitions
  const transRes = await GET(`/sales-enquiries/${enquiryId}/status-transitions`);
  check('GET /sales-enquiries/:id/status-transitions 200', transRes.status === 200, `status=${transRes.status}`);
  console.log(`  Available transitions from draft: ${JSON.stringify(transRes.body).slice(0, 100)}`);

  // Submit (draft → submitted)
  const submitRes = await PATCH(`/sales-enquiries/${enquiryId}/status`, {
    status: 'submitted',
    remarks: 'Submitted via integration test',
  });
  check('Status → submitted 200', submitRes.status === 200, `status=${submitRes.status} body=${JSON.stringify(submitRes.body).slice(0,150)}`);

  // Verify status changed
  const afterSubmit = await GET(`/sales-enquiries/${enquiryId}`);
  check('Status is now submitted', afterSubmit.body?.status === 'submitted', `got=${afterSubmit.body?.status}`);

  // Punch (submitted → punched)
  const punchRes = await PATCH(`/sales-enquiries/${enquiryId}/status`, {
    status: 'punched',
    remarks: 'Punched via integration test',
  });
  check('Status → punched 200', punchRes.status === 200, `status=${punchRes.status}`);

  const afterPunch = await GET(`/sales-enquiries/${enquiryId}`);
  check('Status is now punched', afterPunch.body?.status === 'punched', `got=${afterPunch.body?.status}`);

  // ─────────────────────────────────────────────
  // 13. PUNCHING LOGS
  // ─────────────────────────────────────────────
  section('13. PUNCHING LOGS');

  const logsRes = await GET(`/sales-enquiries/${enquiryId}/punching-logs`);
  check('GET /sales-enquiries/:id/punching-logs 200', logsRes.status === 200, `status=${logsRes.status}`);
  const logs = logsRes.body || [];
  check('Has punching logs', logs.length > 0, `count=${logs.length}`);
  check('Logs include submitted transition', logs.some(l => l.newStatus === 'submitted'));
  check('Logs include punched transition', logs.some(l => l.newStatus === 'punched'));
  console.log(`  Log count: ${logs.length}`);

  // ─────────────────────────────────────────────
  // 14. DOCUMENTS
  // ─────────────────────────────────────────────
  section('14. ENQUIRY DOCUMENTS');

  const addDocRes = await POST(`/sales-enquiries/${enquiryId}/documents`, {
    documentName: 'Test PO Document',
    documentType: 'purchase_order',
    fileUrl: 'https://test.com/po.pdf',
    notes: 'Uploaded via integration test',
  });
  check('POST /sales-enquiries/:id/documents 201', [200, 201].includes(addDocRes.status), `status=${addDocRes.status}`);

  const docsRes = await GET(`/sales-enquiries/${enquiryId}/documents`);
  check('GET /sales-enquiries/:id/documents 200', docsRes.status === 200, `status=${docsRes.status}`);
  const docs = docsRes.body || [];
  check('Has document', docs.length > 0, `count=${docs.length}`);

  // Delete document
  if (docs[0]?.documentId) {
    const delDocRes = await DELETE(`/sales-enquiries/documents/${docs[0].documentId}`);
    check('DELETE /sales-enquiries/documents/:id 200', delDocRes.status === 200, `status=${delDocRes.status}`);
  }

  // ─────────────────────────────────────────────
  // 15. REMINDERS
  // ─────────────────────────────────────────────
  section('15. ENQUIRY REMINDERS');

  const addRemRes = await POST(`/sales-enquiries/${enquiryId}/reminders`, {
    reminderDate: new Date(Date.now() + 86400000).toISOString(),
    reminderType: 'follow_up',
    message: 'Follow up with buyer - integration test',
  });
  check('POST /sales-enquiries/:id/reminders 201', [200, 201].includes(addRemRes.status), `status=${addRemRes.status}`);

  const remsRes = await GET(`/sales-enquiries/${enquiryId}/reminders`);
  check('GET /sales-enquiries/:id/reminders 200', remsRes.status === 200, `status=${remsRes.status}`);
  const rems = remsRes.body || [];
  check('Has reminder', rems.length > 0, `count=${rems.length}`);

  // Get pending reminders (global)
  const pendingRemsRes = await GET('/sales-enquiries/reminders/pending');
  check('GET /sales-enquiries/reminders/pending 200', pendingRemsRes.status === 200, `status=${pendingRemsRes.status}`);
  console.log(`  Pending reminders: ${(pendingRemsRes.body || []).length}`);

  // Mark reminder sent
  if (rems[0]?.reminderId) {
    const markSentRes = await PATCH(`/sales-enquiries/reminders/${rems[0].reminderId}/sent`, {});
    check('PATCH reminders/:id/sent 200', markSentRes.status === 200, `status=${markSentRes.status}`);
  }

  // ─────────────────────────────────────────────
  // 16. CROSS-MODULE: GET BY ENQUIRY NUMBER
  // ─────────────────────────────────────────────
  section('16. GET BY ENQUIRY NUMBER');

  const byNumRes = await GET(`/sales-enquiries/number/${enquiryNo}`);
  check('GET /sales-enquiries/number/:no 200', byNumRes.status === 200, `status=${byNumRes.status}`);
  check('Returns correct enquiry', byNumRes.body?.enquiryOrderId === enquiryId);

  // ─────────────────────────────────────────────
  // 17. CROSS-MODULE: RATE & PURCHASE LINKAGE
  // ─────────────────────────────────────────────
  section('17. CROSS-MODULE CONNECTIVITY');

  // Rate analysis
  const rateRes = await GET('/rate/analysis');
  check('GET /rate/analysis 200', rateRes.status === 200, `status=${rateRes.status}`);

  // Purchase quotes
  const poRes = await GET('/purchase/quotes');
  check('GET /purchase/quotes 200', poRes.status === 200, `status=${poRes.status}`);

  // FMS tasks
  const fmsRes = await GET('/fms/tasks');
  check('GET /fms/tasks 200', fmsRes.status === 200, `status=${fmsRes.status}`);

  // Reports
  const dashRes = await GET('/reports/dashboard');
  check('GET /reports/dashboard 200', dashRes.status === 200, `status=${dashRes.status}`);

  // ─────────────────────────────────────────────
  // 18. ADDITIONAL STATUS TRANSITIONS
  // ─────────────────────────────────────────────
  section('18. ADDITIONAL STATUS TRANSITIONS');

  // verified → rate_pending
  const verifyRes = await PATCH(`/sales-enquiries/${enquiryId}/status`, { status: 'verified', remarks: 'Verified by test' });
  check('Status → verified', verifyRes.status === 200, `status=${verifyRes.status}`);

  // ─────────────────────────────────────────────
  // 19. DELETE ENQUIRY (SOFT DELETE)
  // ─────────────────────────────────────────────
  section('19. DELETE ENQUIRY (CLEANUP)');

  const delRes = await DELETE(`/sales-enquiries/${enquiryId}`);
  check('DELETE /sales-enquiries/:id 200', delRes.status === 200, `status=${delRes.status}`);

  // Verify soft-deleted (should return 404 or empty)
  const afterDel = await GET(`/sales-enquiries/${enquiryId}`);
  // Soft delete: entity uses deletedAt (not isActive). After delete, GET still returns 200 but deletedAt should be set.
  check('Enquiry soft-deleted (deletedAt set)', afterDel.status === 404 || !!afterDel.body?.deletedAt, `status=${afterDel.status} deletedAt=${afterDel.body?.deletedAt}`);

  // ─────────────────────────────────────────────
  // FINAL RESULT
  // ─────────────────────────────────────────────
  console.log('\n' + '═'.repeat(55));
  console.log(`RESULT: ${passed + failed} tests | ✅ ${passed} PASSED | ❌ ${failed} FAILED`);
  console.log('═'.repeat(55) + '\n');
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error('Fatal error:', e); process.exit(1); });
