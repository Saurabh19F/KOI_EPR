/**
 * KOI-ERP Purchase User Assignment & Routing Test
 * Verifies that Sales Enquiry items automatically resolve and store assigned purchase users,
 * restricts the enquiry items visibility based on logged-in Purchase User,
 * and validates quotation creation to prevent unauthorized quoting of unassigned products.
 */
const http = require('http');

const API = { host: 'localhost', port: 3001, prefix: '/api/v1' };
let ADMIN_TOKEN = null;
let AMIT_TOKEN = null;
let SNEHA_TOKEN = null;
let passed = 0, failed = 0;

function req(token, method, path, body) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
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

const check = (label, ok, detail = '') => {
  if (ok) { passed++; console.log(`  \x1b[32m✅\x1b[0m ${label}`); }
  else { failed++; console.log(`  \x1b[31m❌\x1b[0m ${label}${detail ? ' → ' + detail : ''}`); }
};

const section = (t) => console.log(`\n\x1b[36m━━━ ${t} ━━━\x1b[0m`);

async function run() {
  console.log('🚀 Starting Purchase User Assignment & Routing Integration Tests...\n');

  // 1. AUTHENTICATION
  section('1. AUTHENTICATION');
  const adminLogin = await req(null, 'POST', '/auth-v2/login', { email: 'admin@erp.com', password: 'admin123' });
  ADMIN_TOKEN = adminLogin.body?.accessToken;
  check('Admin login successful', adminLogin.status === 201 && !!ADMIN_TOKEN);

  const rahulLogin = await req(null, 'POST', '/auth-v2/login', { email: 'amit@erp.com', password: 'admin123' });
  AMIT_TOKEN = rahulLogin.body?.accessToken;
  check('Amit (Purchase Manager) login successful', rahulLogin.status === 201 && !!AMIT_TOKEN);

  const snehaLogin = await req(null, 'POST', '/auth-v2/login', { email: 'rakhi@erp.com', password: 'admin123' });
  SNEHA_TOKEN = snehaLogin.body?.accessToken;
  check('Rakhi (Purchase User) login successful', snehaLogin.status === 201 && !!SNEHA_TOKEN);

  if (!ADMIN_TOKEN || !AMIT_TOKEN || !SNEHA_TOKEN) {
    console.log('❌ Auth failed. Make sure DB is seeded and server is running.');
    process.exit(1);
  }

  const amitUserId = rahulLogin.body.user.userId;
  const snehaUserId = snehaLogin.body.user.userId;

  // 2. PRODUCT MASTER ASSIGNMENT
  section('2. CONFIGURING PRODUCT OWNERSHIP IN MASTER');
  // Fetch existing products or categories to set up test products
  const productsRes = await req(ADMIN_TOKEN, 'GET', '/masters/products?limit=5');
  const products = productsRes.body?.data || [];
  if (products.length < 2) {
    console.log('❌ Need at least 2 products in DB to run test. Seed first.');
    process.exit(1);
  }

  const productA = products[0];
  const productB = products[1];

  // Assign Product A to Amit
  const updateARes = await req(ADMIN_TOKEN, 'PATCH', `/masters/products/${productA.productId}`, {
    purchasePersonId: amitUserId
  });
  check('Product A assigned to Amit in master', updateARes.status === 200 || updateARes.status === 204, `status=${updateARes.status} body=${JSON.stringify(updateARes.body)}`);

  // Assign Product B to Rakhi
  const updateBRes = await req(ADMIN_TOKEN, 'PATCH', `/masters/products/${productB.productId}`, {
    purchasePersonId: snehaUserId
  });
  check('Product B assigned to Rakhi in master', updateBRes.status === 200 || updateBRes.status === 204, `status=${updateBRes.status} body=${JSON.stringify(updateBRes.body)}`);

  // 3. SALES ENQUIRY FLOW & ROUTING RESOLUTION
  section('3. CREATING SALES ENQUIRY WITH AUTOMATIC ROUTING');
  const customersRes = await req(ADMIN_TOKEN, 'GET', '/masters/customers?limit=1');
  const customer = customersRes.body?.data?.[0];
  if (!customer) {
    console.log('❌ Need at least 1 customer to create Sales Enquiry.');
    process.exit(1);
  }

  const enquiryPayload = {
    customerId: customer.customerId,
    remarks: 'Purchase Routing Test',
    status: 'draft',
    items: [
      {
        productId: productA.productId,
        productName: productA.productName,
        sku: productA.sku,
        quantity: 5,
        expectedRate: 100,
      },
      {
        productId: productB.productId,
        productName: productB.productName,
        sku: productB.sku,
        quantity: 10,
        expectedRate: 200,
      }
    ]
  };

  const createEnquiryRes = await req(ADMIN_TOKEN, 'POST', '/sales-enquiries', enquiryPayload);
  const enquiry = createEnquiryRes.body;
  check('Sales Enquiry created successfully', createEnquiryRes.status === 201 && !!enquiry);
  const enquiryId = enquiry.enquiryOrderId;

  // Retrieve details as Admin to verify routing columns
  const getEnquiryRes = await req(ADMIN_TOKEN, 'GET', `/sales-enquiries/${enquiryId}/items`);
  const items = getEnquiryRes.body || [];
  check('Retrieved enquiry has 2 items', items.length === 2);

  const itemA = items.find(i => i.productId === productA.productId);
  const itemB = items.find(i => i.productId === productB.productId);

  check('Product A item automatically resolved Amit purchasePersonId', itemA?.purchasePersonId === amitUserId);
  check('Product B item automatically resolved Rakhi purchasePersonId', itemB?.purchasePersonId === snehaUserId);

  // 4. ROLE-BASED VISIBILITY RESTRICTION (PURCHASE LISTING API)
  section('4. ROLE-BASED VISIBILITY LIMITATION');
  // Amit gets the items of this enquiry
  const amitItemsRes = await req(AMIT_TOKEN, 'GET', `/sales-enquiries/${enquiryId}/items`);
  check('Amit only sees Product A item', amitItemsRes.body?.length === 1 && amitItemsRes.body[0].productId === productA.productId);

  // Rakhi gets the items of this enquiry
  const snehaItemsRes = await req(SNEHA_TOKEN, 'GET', `/sales-enquiries/${enquiryId}/items`);
  check('Rakhi only sees Product B item', snehaItemsRes.body?.length === 1 && snehaItemsRes.body[0].productId === productB.productId);

  // 5. VALIDATION ON PURCHASE QUOTE CREATION
  section('5. PURCHASE QUOTATION CREATION VALIDATION');

  // Let's use mock vendor details
  const vendor = {
    vendorId: '00000000-0000-0000-0000-000000000001',
    vendorCode: 'VND-001',
    vendorName: 'ABC Manufacturers'
  };

  // Amit attempts to create a quote containing Product B (assigned to Sneha) -> Should fail!
  const quoteFailPayload = {
    partyCode: vendor.vendorCode,
    partyName: vendor.vendorName,
    customerId: vendor.vendorId,
    remarks: 'Should fail validation',
    items: [
      {
        productId: productB.productId, // Product B (Sneha's)
        productName: productB.productName,
        sku: productB.sku,
        quantity: 10,
        buyingPrice: 150,
      }
    ]
  };

  const quoteFailRes = await req(AMIT_TOKEN, 'POST', '/purchase/quotes', quoteFailPayload);
  check('Amit creating quote for Product B receives 403 Forbidden ("Access Denied")', quoteFailRes.status === 403);

  // Amit attempts to create a quote containing Product A (assigned to Amit) -> Should succeed!
  const quoteSuccessPayload = {
    partyCode: vendor.vendorCode,
    partyName: vendor.vendorName,
    customerId: vendor.vendorId,
    remarks: 'Should pass validation',
    items: [
      {
        productId: productA.productId, // Product A (Amit's)
        productName: productA.productName,
        sku: productA.sku,
        quantity: 5,
        buyingPrice: 85,
      }
    ]
  };

  const quoteSuccessRes = await req(AMIT_TOKEN, 'POST', '/purchase/quotes', quoteSuccessPayload);
  check('Amit creating quote for Product A succeeds', quoteSuccessRes.status === 201);
  const quoteId = quoteSuccessRes.body?.quoteId;

  // Amit attempts to update the quote item to point to Product B -> Should fail!
  if (quoteId && quoteSuccessRes.body?.items?.[0]?.itemId) {
    const itemId = quoteSuccessRes.body.items[0].itemId;
    const updateItemFailRes = await req(AMIT_TOKEN, 'PATCH', `/purchase/items/${itemId}`, {
      productId: productB.productId
    });
    check('Amit updating quote item to Product B receives 403 Forbidden', updateItemFailRes.status === 403);
  }

  // Cleanup: Delete enquiry
  await req(ADMIN_TOKEN, 'DELETE', `/sales-enquiries/${enquiryId}`);
  if (quoteId) {
    await req(ADMIN_TOKEN, 'DELETE', `/purchase/quotes/${quoteId}`);
  }

  // Summary
  console.log('\n' + '═'.repeat(55));
  console.log(`INTEGRATION TESTS: ${passed + failed} run | ✅ ${passed} PASSED | ❌ ${failed} FAILED`);
  console.log('═'.repeat(55));

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run().catch(err => {
  console.error('\n💥 Integration test crashed:', err);
  process.exit(1);
});
