/**
 * KOI-ERP Purchase Quote Module — Full Integration Test
 * Tests: DB data → Purchase API CRUD → Status Transitions → Cross-module connectivity
 * Runs against live servers: API @ 3001
 */
const http = require('http');

const API = { host: 'localhost', port: 3001, prefix: '/api/v1' };
let TOKEN = null;
let passed = 0, failed = 0;

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
        catch { resolve({ status: res.statusCode, body: null, raw: raw.slice(0, 300) }); }
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
  if (ok) { passed++; console.log(`  \x1b[32m✅\x1b[0m ${label}`); }
  else { failed++; console.log(`  \x1b[31m❌\x1b[0m ${label}${detail ? ' → ' + detail : ''}`); }
}

function section(t) { console.log(`\n\x1b[36m━━━ ${t} ━━━\x1b[0m`); }

async function run() {
  console.log('🚀 KOI-ERP Purchase Quote Full Integration Test\n');

  // 1. Auth
  section('1. AUTHENTICATION');
  const lr = await POST('/auth-v2/login', { email: 'admin@erp.com', password: 'admin123' });
  TOKEN = lr.body?.accessToken;
  check('Login 201 + token', lr.status === 201 && !!TOKEN, `status=${lr.status}`);
  if (!TOKEN) { console.log('❌ No token — aborting'); process.exit(1); }

  // 2. Fetch Reference Masters
  section('2. FETCH REFERENCE MASTERS');
  const vendorRes = await GET('/masters/vendors');
  check('GET vendors 200', vendorRes.status === 200);
  const vendors = Array.isArray(vendorRes.body) ? vendorRes.body : vendorRes.body?.data || [];
  check(`Has ≥1 vendor (${vendors.length})`, vendors.length > 0);

  const productRes = await GET('/masters/products');
  check('GET products 200', productRes.status === 200);
  const products = Array.isArray(productRes.body) ? productRes.body : productRes.body?.data || [];
  check(`Has ≥1 product (${products.length})`, products.length > 0);

  const currencyRes = await GET('/masters/currencies');
  check('GET currencies 200', currencyRes.status === 200);
  const currencies = Array.isArray(currencyRes.body) ? currencyRes.body : currencyRes.body?.data || [];

  const payTermsRes = await GET('/masters/payment-terms');
  check('GET payment-terms 200', payTermsRes.status === 200);
  const payTerms = Array.isArray(payTermsRes.body) ? payTermsRes.body : payTermsRes.body?.data || [];

  if (vendors.length === 0 || products.length === 0) {
    console.log('❌ Missing required vendors or products. Please seed them first.');
    process.exit(1);
  }

  const testVendor = vendors[0];
  const testProduct = products[0];

  // 3. Purchase Quote CRUD
  section('3. PURCHASE QUOTE CRUD');
  
  // POST create quote
  const quotePayload = {
    partyCode: testVendor.vendorCode,
    partyName: testVendor.vendorName,
    customerId: testVendor.vendorId, // using vendorId as customerId/party identifier
    currencyId: currencies[0]?.currencyId || currencies[0]?.id,
    paymentTermsId: payTerms[0]?.paymentTermsId || payTerms[0]?.id,
    pod: 'Singapore Port',
    remarks: 'Integration test quote remarks',
    items: [
      {
        productId: testProduct.productId,
        productName: testProduct.productName,
        sku: testProduct.sku,
        quantity: 10,
        buyingPrice: 1500,
        gstPercent: 18,
      }
    ]
  };

  let r = await POST('/purchase/quotes', quotePayload);
  check('POST Create Quote 201', r.status === 201, `status=${r.status} body=${JSON.stringify(r.body)}`);
  const quoteId = r.body?.quoteId;
  check('Quote ID returned', !!quoteId);

  if (!quoteId) {
    console.log('❌ Failed to create quote. Aborting test.');
    process.exit(1);
  }

  // GET quote by ID
  r = await GET(`/purchase/quotes/${quoteId}`);
  check('GET Quote by ID 200', r.status === 200);
  check('Quote has 1 item', r.body?.items?.length === 1);
  check('Grand total calculated correctly (1500 * 1.18 * 10 = 17700)', Number(r.body?.grandTotal) === 17700, `grandTotal=${r.body?.grandTotal}`);

  // PATCH update quote details and items
  const updatePayload = {
    contactName: 'Jane Manager',
    emailAddress: 'jane@manager.com',
    remarks: 'Updated integration test remarks',
    items: [
      {
        productId: testProduct.productId,
        productName: testProduct.productName,
        sku: testProduct.sku,
        quantity: 20,
        buyingPrice: 1000,
        gstPercent: 12,
      }
    ]
  };

  r = await PATCH(`/purchase/quotes/${quoteId}`, updatePayload);
  check('PATCH Update Quote 200', r.status === 200, `status=${r.status}`);

  // Re-fetch to verify updates
  r = await GET(`/purchase/quotes/${quoteId}`);
  check('Verify updated contactName', r.body?.contactName === 'Jane Manager');
  check('Verify updated items count', r.body?.items?.length === 1);
  check('Verify updated grand total (1000 * 1.12 * 20 = 22400)', Number(r.body?.grandTotal) === 22400, `grandTotal=${r.body?.grandTotal}`);

  // 4. Status Transitions
  section('4. STATUS TRANSITIONS');
  
  // Submit Quote (draft -> submitted)
  r = await POST(`/purchase/quotes/${quoteId}/submit`);
  check('POST Submit Quote (Draft -> Submitted) 201', r.status === 201, `status=${r.status}`);
  r = await GET(`/purchase/quotes/${quoteId}`);
  check('Status updated to submitted', r.body?.status === 'submitted');

  // Submit quote status transition via status endpoint (submitted -> under_review)
  r = await PATCH(`/purchase/quotes/${quoteId}/status`, { status: 'under_review', remarks: 'Reviewing quote items' });
  check('PATCH Status (Submitted -> Under Review) 200', r.status === 200, `status=${r.status} body=${JSON.stringify(r.body)}`);
  r = await GET(`/purchase/quotes/${quoteId}`);
  check('Status updated to under_review', r.body?.status === 'under_review');

  // transition under_review -> vendor_quote_pending
  r = await PATCH(`/purchase/quotes/${quoteId}/status`, { status: 'vendor_quote_pending', remarks: 'Awaiting vendor quote rates' });
  check('PATCH Status (Under Review -> Vendor Quote Pending) 200', r.status === 200, `status=${r.status}`);
  r = await GET(`/purchase/quotes/${quoteId}`);
  check('Status updated to vendor_quote_pending', r.body?.status === 'vendor_quote_pending');

  // transition vendor_quote_pending -> rate_finalized
  r = await PATCH(`/purchase/quotes/${quoteId}/status`, { status: 'rate_finalized', remarks: 'Vendor rate finalized' });
  check('PATCH Status (Vendor Quote Pending -> Rate Finalized) 200', r.status === 200, `status=${r.status}`);
  r = await GET(`/purchase/quotes/${quoteId}`);
  check('Status updated to rate_finalized', r.body?.status === 'rate_finalized');

  // Approve Quote (rate_finalized -> approved)
  r = await POST(`/purchase/quotes/${quoteId}/approve`, { remarks: 'Quote looks solid' });
  check('POST Approve Quote (Rate Finalized -> Approved) 201', r.status === 201, `status=${r.status}`);
  r = await GET(`/purchase/quotes/${quoteId}`);
  check('Status updated to approved', r.body?.status === 'approved');

  // 5. Cleanup
  section('5. CLEANUP');
  r = await DELETE(`/purchase/quotes/${quoteId}`);
  check('DELETE Quote 200', r.status === 200);

  r = await GET(`/purchase/quotes/${quoteId}`);
  check('Verify Quote soft-deleted (404)', r.status === 404);

  // Summary
  console.log('\n' + '═'.repeat(55));
  console.log(`RESULT: ${passed + failed} tests | ✅ ${passed} PASSED | ❌ ${failed} FAILED`);
  console.log('═'.repeat(55));
  if (failed > 0) process.exit(1);
}

run().catch(e => { console.error('\n💥 Runner error:', e.message); process.exit(1); });
