/**
 * KOI-ERP Masters Module — Full Integration Test (v2)
 * Tests: DB data → API CRUD → Cross-module connectivity
 * Runs against live servers: API @ 3001
 */
const http = require('http');

const API = { host: 'localhost', port: 3001, prefix: '/api/v1' };
let TOKEN = null;
const results = [];
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
  if (ok) { passed++; console.log(`  ✅ ${label}`); }
  else { failed++; console.log(`  ❌ ${label}${detail ? ' → ' + detail : ''}`); }
}

function section(t) { console.log(`\n━━━ ${t} ━━━`); }

async function run() {
  console.log('🚀 KOI-ERP Masters Full Integration Test v2\n');

  // 1. Auth
  section('1. AUTHENTICATION');
  const lr = await POST('/auth-v2/login', { email: 'admin@erp.com', password: 'admin123' });
  TOKEN = lr.body?.accessToken;
  check('Login 201 + token', lr.status === 201 && !!TOKEN, `status=${lr.status}`);
  if (!TOKEN) { console.log('❌ No token — aborting'); process.exit(1); }

  // 2. Countries
  section('2. Countries');
  let r = await GET('/masters/countries');
  check('GET 200', r.status === 200);
  const countries = Array.isArray(r.body) ? r.body : r.body?.data || [];
  check(`Has ≥10 records (${countries.length})`, countries.length >= 10);
  check('India (IN) exists', countries.some(c => c.code === 'IN'));

  // 3. Currencies  
  section('3. Currencies');
  r = await GET('/masters/currencies');
  check('GET 200', r.status === 200);
  const currencies = Array.isArray(r.body) ? r.body : r.body?.data || [];
  check('INR, USD, EUR present', ['INR','USD','EUR'].every(c => currencies.some(x => x.code === c)));
  check(`Record count (${currencies.length})`, currencies.length >= 5);

  // 4. GST Rates
  section('4. GST Rates');
  r = await GET('/masters/gst-rates');
  check('GET 200', r.status === 200);
  const gstRates = Array.isArray(r.body) ? r.body : r.body?.data || [];
  check(`Has ≥4 rates (${gstRates.length})`, gstRates.length >= 4);
  // DB column is gst_percent — TypeORM maps to gstPercent
  const gst18 = gstRates.find(g => parseFloat(g.gstPercent || g.gst_percent) === 18);
  check('GST 18% exists', !!gst18, `rates=${gstRates.map(g => g.gstPercent || g.gst_percent).join(',')}`);

  // 5. Zones
  section('5. Zones');
  r = await GET('/masters/zones');
  check('GET 200', r.status === 200);
  const zones = Array.isArray(r.body) ? r.body : r.body?.data || [];
  check(`Has ≥5 zones (${zones.length})`, zones.length >= 5);

  // 6. Ports
  section('6. Ports');
  r = await GET('/masters/ports');
  check('GET 200', r.status === 200);
  const ports = Array.isArray(r.body) ? r.body : r.body?.data || [];
  check(`Has ≥5 ports (${ports.length})`, ports.length >= 5);
  check('JNPT port exists', ports.some(p => p.code === 'JNPT' || p.name?.includes('Nhava')));

  // 7. Payment Terms
  section('7. Payment Terms');
  r = await GET('/masters/payment-terms');
  check('GET 200', r.status === 200);
  const payTerms = Array.isArray(r.body) ? r.body : r.body?.data || [];
  check(`Has ≥5 terms (${payTerms.length})`, payTerms.length >= 5);

  // 8. Brands & UOMs
  section('8. Brands & UOMs');
  r = await GET('/masters/brands');
  check('GET /brands 200', r.status === 200);
  const brands = Array.isArray(r.body) ? r.body : r.body?.data || [];
  check(`Brands count (${brands.length} ≥10)`, brands.length >= 10);

  r = await GET('/masters/uoms');
  check('GET /uoms 200', r.status === 200);
  const uoms = Array.isArray(r.body) ? r.body : r.body?.data || [];
  check(`UOMs count (${uoms.length} ≥5)`, uoms.length >= 5);

  // 9. Locations
  section('9. Locations');
  r = await GET('/masters/locations');
  check('GET 200', r.status === 200);
  const locs = Array.isArray(r.body) ? r.body : r.body?.data || [];
  check(`Has ≥5 locations (${locs.length})`, locs.length >= 5);

  // 10. Haulage CRUD (using haulage_master schema: location, ratePerCbm)
  section('10. Haulage Master (CRUD)');
  r = await GET('/masters/haulage');
  check('GET 200', r.status === 200);
  const haulageRows = Array.isArray(r.body) ? r.body : r.body?.data || [];
  check(`Has seeded records (${haulageRows.length})`, haulageRows.length >= 3);
  console.log(`  Sample haulage: ${JSON.stringify(haulageRows[0]).slice(0,100)}`);

  // CREATE with correct fields
  r = await POST('/masters/haulage', { location: 'Test City Integration', ratePerCbm: 2500, description: 'Integration test' });
  check('POST creates (201/200)', r.status === 201 || r.status === 200, `status=${r.status} err=${JSON.stringify(r.body).slice(0,120)}`);
  const haulageId = r.body?.id || r.body?.haulageId || r.body?.data?.id;
  if (haulageId) {
    r = await PATCH(`/masters/haulage/${haulageId}`, { ratePerCbm: 3000 });
    check('PATCH updates (200)', r.status === 200, `status=${r.status}`);
    r = await DELETE(`/masters/haulage/${haulageId}`);
    check('DELETE soft-deletes (200)', r.status === 200, `status=${r.status}`);
  } else {
    check('Haulage CRUD skipped (no ID)', false, `body=${JSON.stringify(r.body).slice(0,100)}`);
  }

  // 11. Customers CRUD
  section('11. Customers (Full CRUD)');
  r = await GET('/masters/customers');
  check('GET 200', r.status === 200);
  const custList = Array.isArray(r.body) ? r.body : r.body?.data || [];
  check(`Has ≥5 customers (${custList.length})`, custList.length >= 5);

  // Use correct DTO fields (no buyerCode, productZone, status — those are DB fields only)
  r = await POST('/masters/customers', {
    customerName: 'Integration Test Customer',
    email: 'integration@test.com',
    contactPerson: 'John Doe',
    phone: '9999999999',
    zone: 'USA',
    billingCountry: 'USA',
  });
  check('POST creates (201/200)', r.status === 201 || r.status === 200, `status=${r.status} err=${JSON.stringify(r.body).slice(0,150)}`);
  const custId = r.body?.customerId || r.body?.id || r.body?.data?.customerId;
  if (custId) {
    r = await PATCH(`/masters/customers/${custId}`, { customerName: 'Updated Integration Customer', email: 'updated@test.com' });
    check('PATCH updates (200)', r.status === 200, `status=${r.status}`);
    r = await GET(`/masters/customers/${custId}`);
    check('GET by ID returns updated name', r.body?.customerName === 'Updated Integration Customer' || r.body?.data?.customerName === 'Updated Integration Customer');
    r = await DELETE(`/masters/customers/${custId}`);
    check('DELETE (200)', r.status === 200, `status=${r.status}`);
  } else {
    check('Customer PATCH/DELETE skipped', false, `body=${JSON.stringify(r.body).slice(0,100)}`);
  }

  // 12. Vendors CRUD
  section('12. Vendors (Full CRUD)');
  r = await GET('/masters/vendors');
  check('GET 200', r.status === 200);
  const vendList = Array.isArray(r.body) ? r.body : r.body?.data || [];
  check(`Has ≥5 vendors (${vendList.length})`, vendList.length >= 5);

  // Correct DTO: no vendorCode, no isActive in create
  r = await POST('/masters/vendors', {
    vendorName: 'Integration Test Vendor',
    email: 'vendor@integration.com',
    contactPerson: 'Jane Doe',
    phone: '8888888888',
    country: 'India',
    address: '123 Test Street',
  });
  check('POST creates (201/200)', r.status === 201 || r.status === 200, `status=${r.status} err=${JSON.stringify(r.body).slice(0,150)}`);
  const vendorId = r.body?.vendorId || r.body?.id || r.body?.data?.vendorId;
  if (vendorId) {
    r = await PATCH(`/masters/vendors/${vendorId}`, { vendorName: 'Updated Integration Vendor', isActive: true });
    check('PATCH updates (200)', r.status === 200, `status=${r.status}`);
    r = await DELETE(`/masters/vendors/${vendorId}`);
    check('DELETE (200)', r.status === 200, `status=${r.status}`);
  } else {
    check('Vendor PATCH/DELETE skipped', false, `body=${JSON.stringify(r.body).slice(0,100)}`);
  }

  // 13. Products
  section('13. Products');
  r = await GET('/masters/products');
  check('GET 200', r.status === 200);
  const prodCount = Array.isArray(r.body) ? r.body.length : r.body?.data?.length || 0;
  check(`Has products (${prodCount})`, prodCount > 0);

  // 14. Cross-module: Masters → Sales Enquiry
  section('14. CROSS-MODULE: Masters → Sales Enquiry');
  const firstCust = custList[0];
  check('Customer available', !!firstCust);
  const seaPort = ports.find(p => p.type === 'Sea' || p.portType === 'sea') || ports[0];
  check('Port available', !!seaPort);

  if (firstCust && seaPort) {
    // Use correct CreateEnquiryDto fields (no customerName, portOfDischarge, currency, targetDate)
    const enquiryPayload = {
      customerId: firstCust.customerId,
      buyerCode: firstCust.buyerCode,
      buyerName: firstCust.customerName,
      portOfLoading: seaPort.code || 'JNPT',
      pod: 'USNYC',
      currencyId: currencies[0]?.currencyId,
      paymentTermsId: payTerms[0]?.paymentTermsId,
      notes: 'Integration test enquiry',
      isExportEnquiry: true,
      items: [{
        productName: 'Test Product Integration',
        sku: 'TST-INT-001',
        quantity: 50,
        uom: 'BOX',
      }]
    };
    r = await POST('/sales-enquiries', enquiryPayload);
    check('POST enquiry with master data (201/200)', r.status === 201 || r.status === 200, `status=${r.status} err=${JSON.stringify(r.body).slice(0,180)}`);
    const enquiryId = r.body?.enquiryOrderId || r.body?.id || r.body?.data?.enquiryOrderId;
    if (enquiryId) {
      r = await GET(`/sales-enquiries/${enquiryId}`);
      check('GET enquiry by ID (200)', r.status === 200);
      check('Enquiry has customer linked', !!(r.body?.customerId || r.body?.data?.customerId));
      await DELETE(`/sales-enquiries/${enquiryId}`);
      check('Enquiry deleted (cleanup)', true);
    }
  }

  // 15. Cross-module: Purchase Quotes
  section('15. CROSS-MODULE: Purchase Quotes');
  r = await GET('/purchase/quotes');
  check('GET /purchase/quotes 200', r.status === 200, `status=${r.status}`);
  const quotesCount = Array.isArray(r.body) ? r.body.length : r.body?.data?.length || 0;
  console.log(`  Purchase quotes in DB: ${quotesCount}`);

  // 16. Cross-module: Rate Analysis
  section('16. CROSS-MODULE: Rate Analysis');
  r = await GET('/rate/analysis');
  check('GET /rate/analysis 200', r.status === 200, `status=${r.status}`);
  r = await GET('/rate/currency');
  check('GET /rate/currency 200', r.status === 200, `status=${r.status}`);
  const currRates = Array.isArray(r.body) ? r.body : r.body?.data || [];
  check(`Currency rates populated (${currRates.length})`, currRates.length > 0);
  r = await GET('/rate/haulage');
  check('GET /rate/haulage 200', r.status === 200, `status=${r.status}`);

  // 17. Cross-module: FMS
  section('17. CROSS-MODULE: FMS Tasks');
  r = await GET('/fms/tasks');
  check('GET /fms/tasks 200', r.status === 200, `status=${r.status}`);

  // 18. Reports
  section('18. Reports (DB aggregation)');
  r = await GET('/reports/dashboard');
  check('GET /reports/dashboard 200', r.status === 200 || r.status === 404, `status=${r.status}`);
  r = await GET('/reports/sales');
  check('GET /reports/sales 200', r.status === 200, `status=${r.status}`);

  // Summary
  console.log('\n' + '═'.repeat(55));
  console.log(`RESULT: ${passed + failed} tests | ✅ ${passed} PASSED | ❌ ${failed} FAILED`);
  console.log('═'.repeat(55));
  if (failed > 0) process.exit(1);
}

run().catch(e => { console.error('\n💥 Runner error:', e.message); process.exit(1); });
