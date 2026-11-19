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
  
  const allNotificationsRes = await client.query(`
    SELECT notification_id, user_id, title, message, status, created_at 
    FROM notifications 
    ORDER BY created_at DESC
  `);
  console.log('--- ALL NOTIFICATIONS IN DB ---');
  console.log(JSON.stringify(allNotificationsRes.rows, null, 2));

  await client.end();
}
run().catch(console.error);
