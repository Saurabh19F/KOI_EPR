/**
 * KOI-ERP Rate Calculation Module — Full Integration Test
 * Tests: DB data → Rate API CRUD → Calculations → Status Transitions
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
  console.log('🚀 KOI-ERP Rate Calculation Full Integration Test\n');

  // 1. Auth
  section('1. AUTHENTICATION');
  const lr = await POST('/auth-v2/login', { email: 'admin@erp.com', password: 'admin123' });
  TOKEN = lr.body?.accessToken;
  check('Login 201 + token', lr.status === 201 && !!TOKEN, `status=${lr.status}`);
  if (!TOKEN) { console.log('❌ No token — aborting'); process.exit(1); }

  // 2. Fetch Reference Data & Purchase Quotes
  section('2. FETCH REFERENCE PURCHASE QUOTE');
  const pqRes = await GET('/purchase/quotes');
  check('GET purchase quotes 200', pqRes.status === 200);
  const quotes = Array.isArray(pqRes.body) ? pqRes.body : pqRes.body?.data || [];
  
  let targetQuote = quotes.find(q => q.status === 'approved' || q.status === 'rate_finalized') || quotes[0];
  
  // Fetch a valid customer to avoid FK constraint violations
  const customerRes = await GET('/masters/customers');
  const customers = Array.isArray(customerRes.body) ? customerRes.body : customerRes.body?.data || [];
  const validCustomerId = customers[0]?.customerId || customers[0]?.id || null;
  check('Fetched valid customer for constraint bypass', !!validCustomerId, `customerId=${validCustomerId}`);

  if (!targetQuote) {
    // If no quote exists, let's create a temporary one for rate analysis creation test
    const vendorRes = await GET('/masters/vendors');
    const vendors = Array.isArray(vendorRes.body) ? vendorRes.body : vendorRes.body?.data || [];
    const productRes = await GET('/masters/products');
    const products = Array.isArray(productRes.body) ? productRes.body : productRes.body?.data || [];
    
    if (vendors.length > 0 && products.length > 0) {
      const testVendor = vendors[0];
      const testProduct = products[0];
      const pqCreate = await POST('/purchase/quotes', {
        partyCode: testVendor.vendorCode,
        partyName: testVendor.vendorName,
        customerId: validCustomerId || testVendor.vendorId, // use valid customer if found
        remarks: 'Temp quote for rate analysis integration tests',
        items: [{
          productId: testProduct.productId,
          productName: testProduct.productName,
          sku: testProduct.sku,
          quantity: 10,
          buyingPrice: 1500,
          gstPercent: 18,
        }]
      });
      targetQuote = pqCreate.body;
    }
  }
  
  check('Purchase Quote available', !!targetQuote, `details=${JSON.stringify(targetQuote)}`);

  if (!targetQuote) {
    console.log('❌ Cannot proceed without a Purchase Quote. Aborting.');
    process.exit(1);
  }

  // 3. Price Analysis CRUD
  section('3. PRICE ANALYSIS CRUD');

  // Create Analysis from Purchase Quote
  const analysisPayload = {
    usePurchaseRate: true,
    usePreviousYearData: false,
    remarks: 'Integration test rate calculation remarks',
    customerId: validCustomerId || undefined, // supply valid customer ID
    items: [
      {
        productName: targetQuote.items?.[0]?.productName || 'Test Product Integration',
        sku: targetQuote.items?.[0]?.sku || 'TST-INT-001',
        orderQuantity: 20,
        landingCost: 1200,
        buyingPrice: 1000,
        gstPercent: 18,
      }
    ]
  };

  let r = await POST(`/rate/analysis/from-quote/${targetQuote.quoteId}`, analysisPayload);
  check('POST Create Analysis from Quote 201', r.status === 201, `status=${r.status} body=${JSON.stringify(r.body)}`);
  const analysisId = r.body?.analysisId;
  check('Analysis ID returned', !!analysisId);

  if (!analysisId) {
    console.log('❌ Failed to create Price Analysis. Aborting.');
    process.exit(1);
  }

  // GET Analysis details
  r = await GET(`/rate/analysis/${analysisId}`);
  check('GET Price Analysis by ID 200', r.status === 200);
  check('Analysis has 1 item', r.body?.items?.length === 1);

  // PATCH Update Analysis values
  const updatePayload = {
    usdMargin: 5.0,
    usdRate: 85.5,
    remarks: 'Updated integration test remarks for analysis',
  };
  r = await PATCH(`/rate/analysis/${analysisId}`, updatePayload);
  check('PATCH Update Analysis 200', r.status === 200);

  // Re-fetch to verify updates
  r = await GET(`/rate/analysis/${analysisId}`);
  check('Verify updated usdMargin', Number(r.body?.usdMargin) === 5);
  check('Verify updated usdFinalRate', Number(r.body?.usdFinalRate) === 90.5, `usdFinalRate=${r.body?.usdFinalRate}`);

  // 4. Calculations & Calculations API
  section('4. CALCULATIONS AND EVALUATIONS');

  // Trigger calculate action
  r = await POST(`/rate/analysis/${analysisId}/calculate`);
  check('POST Calculate Analysis 201', r.status === 201, `status=${r.status}`);
  check('Status updated to calculated', r.body?.status === 'calculated');

  // 5. Status Transitions
  section('5. STATUS TRANSITIONS');

  // Submit Analysis (calculated -> submitted)
  r = await POST(`/rate/analysis/${analysisId}/submit`);
  check('POST Submit Analysis 201', r.status === 201);
  r = await GET(`/rate/analysis/${analysisId}`);
  check('Status updated to submitted', r.body?.status === 'submitted');

  // transition submitted -> approval_pending
  r = await PATCH(`/rate/analysis/${analysisId}/status`, { status: 'approval_pending', remarks: 'Awaiting approval' });
  check('PATCH Status (Submitted -> Approval Pending) 200', r.status === 200);
  r = await GET(`/rate/analysis/${analysisId}`);
  check('Status updated to approval_pending', r.body?.status === 'approval_pending');

  // Approve Analysis (approval_pending -> approved)
  r = await POST(`/rate/analysis/${analysisId}/approve`, { remarks: 'Calculations look solid' });
  check('POST Approve Analysis 201', r.status === 201);
  r = await GET(`/rate/analysis/${analysisId}`);
  check('Status updated to approved', r.body?.status === 'approved');

  // Lock Analysis (approved -> locked)
  r = await POST(`/rate/analysis/${analysisId}/lock`);
  check('POST Lock Analysis 201', r.status === 201);
  r = await GET(`/rate/analysis/${analysisId}`);
  check('Status updated to locked', r.body?.status === 'locked');

  // 6. Cleanup
  section('6. CLEANUP');
  r = await DELETE(`/rate/analysis/${analysisId}`);
  check('DELETE Price Analysis 200', r.status === 200);

  r = await GET(`/rate/analysis/${analysisId}`);
  check('Verify Price Analysis soft-deleted (404)', r.status === 404);

  // Clean up the temp purchase quote if we created one
  if (targetQuote && targetQuote.quoteNo && targetQuote.quoteNo.includes('Temp quote')) {
    await DELETE(`/purchase/quotes/${targetQuote.quoteId}`);
  }

  // Summary
  console.log('\n' + '═'.repeat(55));
  console.log(`RESULT: ${passed + failed} tests | ✅ ${passed} PASSED | ❌ ${failed} FAILED`);
  console.log('═'.repeat(55));
  if (failed > 0) process.exit(1);
}

run().catch(e => { console.error('\n💥 Runner error:', e); process.exit(1); });
