const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_Up3HTVElA0DY@ep-crimson-wave-aow9s031.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
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
