const http = require('http');

function httpGet(path) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: 'localhost', port: 3001, path, headers: { 'Accept': 'application/json' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data.slice(0, 150) }));
    }).on('error', reject);
  });
}

async function discoverRoutes() {
  const testPaths = [
    '/',
    '/health',
    '/api',
    '/api/health',
    '/api/v1',
    '/api/auth/login',
    '/auth/login',
    '/api/masters',
    '/masters',
    '/api/masters/countries',
    '/v1/masters',
  ];

  for (const p of testPaths) {
    try {
      const r = await httpGet(p);
      console.log(`[${r.status}] ${p} -> ${r.body}`);
    } catch(e) {
      console.log(`[ERR] ${p} -> ${e.message}`);
    }
  }
}

discoverRoutes();
