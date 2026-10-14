const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_Up3HTVElA0DY@ep-crimson-wave-aow9s031.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
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
