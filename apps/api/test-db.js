const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  const res = await client.query(`
    ALTER TABLE sales_enquiry_orders ALTER COLUMN created_by TYPE UUID USING created_by::uuid;
  `);
  console.log('Altered successfully:', res);
  await client.end();
}
run().catch(console.error);
