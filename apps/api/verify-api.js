/**
 * ERP API Final Verification - Correct routes discovered from controllers
 */
const http = require('http');

function httpRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data), raw: data }); }
        catch { resolve({ status: res.statusCode, body: null, raw: data.slice(0, 250) }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const BASE = 'localhost';
const PORT = 3001;
const PREFIX = '/api/v1';

async function post(path, body, headers = {}) {
  return httpRequest({ hostname: BASE, port: PORT, path: PREFIX + path, method: 'POST', headers: { 'Content-Type': 'application/json', ...headers } }, body);
}
async function get(path, headers = {}) {
  return httpRequest({ hostname: BASE, port: PORT, path: PREFIX + path, method: 'GET', headers: { 'Content-Type': 'application/json', ...headers } });
}

function summarize(label, r) {
  const body = r.body;
  if (r.status < 300) {
    const count = Array.isArray(body) ? body.length : (body?.data?.length ?? body?.total ?? body?.count ?? '?');
    const sample = Array.isArray(body) ? body[0] : body?.data?.[0];
    console.log(`  ✅ ${r.status} ${label} — ${count} items`);
    if (sample) console.log(`     Sample: ${JSON.stringify(sample).slice(0, 120)}`);
  } else {
    console.log(`  ❌ ${r.status} ${label} — ${r.raw.slice(0, 130)}`);
  }
}

async function run() {
  console.log('🚀 ERP API Final Verification\n   Base: http://localhost:3001/api/v1\n');
  let auth = {};

  // Login via auth-v2
  console.log('1. LOGIN via /auth-v2/login');
  try {
    const r = await post('/auth-v2/login', { email: 'admin@erp.com', password: 'admin123' });
    const token = r.body?.accessToken || r.body?.data?.access_token || r.body?.access_token || r.body?.token;
    if ((r.status === 200 || r.status === 201) && token) {
      auth = { 'Authorization': `Bearer ${token}` };
      console.log(`   ✅ ${r.status} — Token: ${token.slice(0, 30)}...`);
    } else {
      console.log(`   ❌ ${r.status} — ${r.raw.slice(0, 200)}`);
      console.log('   Body keys:', Object.keys(r.body || {}));
    }
  } catch(e) { console.log(`   ❌ ${e.message}`); }

  console.log('\n2. MASTERS MODULE');
  summarize('Countries',     await get('/masters/countries', auth));
  summarize('Customers',     await get('/masters/customers', auth));
  summarize('Vendors',       await get('/masters/vendors', auth));
  summarize('Products',      await get('/masters/products', auth));
  summarize('Haulage',       await get('/masters/haulage', auth));
  summarize('Payment Terms', await get('/masters/payment-terms', auth));
  summarize('Ports',         await get('/masters/ports', auth));
  summarize('Zones',         await get('/masters/zones', auth));
  summarize('Locations',     await get('/masters/locations', auth));
  summarize('GST Rates',     await get('/masters/gst-rates', auth));
  summarize('Currencies',    await get('/masters/currencies', auth));
  summarize('Brands',        await get('/masters/brands', auth));
  summarize('UOMs',          await get('/masters/uoms', auth));

  console.log('\n3. SALES MODULE (controller: sales-enquiries)');
  summarize('Enquiry List',  await get('/sales-enquiries', auth));

  console.log('\n4. PURCHASE MODULE (controller: purchase)');
  summarize('Quote List',    await get('/purchase/quotes', auth));

  console.log('\n5. RATE MODULE (controller: rate)');
  summarize('Analysis List', await get('/rate/analysis', auth));

  console.log('\n6. FMS MODULE');
  summarize('FMS Tasks',     await get('/fms/tasks', auth));

  console.log('\n7. USERS MODULE');
  summarize('Users List',    await get('/users', auth));

  console.log('\n8. REPORTS MODULE');
  summarize('Sales Report',  await get('/reports/sales', auth));

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Verification complete');
}

run().catch(console.error);
