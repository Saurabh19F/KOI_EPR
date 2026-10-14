import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  await client.connect();
  console.log('Connected to database');

  const roleCodes = ['MIS', 'MIS_USER'];
  const permissions = [
    'MASTERS_CREATE', 'MASTERS_EDIT',
    'SALES_VIEW', 'SALES_CREATE', 'SALES_EDIT', 'SALES_APPROVE',
    'PURCHASE_VIEW', 'PURCHASE_CREATE', 'PURCHASE_EDIT', 'PURCHASE_APPROVE',
    'FMS_VIEW', 'FMS_CREATE', 'FMS_EDIT', 'FMS_ASSIGN',
    'REPORTS_VIEW', 'REPORTS_EXPORT'
  ];

  for (const roleCode of roleCodes) {
    // Find role ID
    const roleRes = await client.query("SELECT role_id FROM roles WHERE role_code = $1", [roleCode]);
    if (roleRes.rows.length === 0) {
      console.log(`Role ${roleCode} not found`);
      continue;
    }
    const roleId = roleRes.rows[0].role_id;
    console.log(`Found role ${roleCode} with ID:`, roleId);

    for (const permCode of permissions) {
      const permRes = await client.query("SELECT permission_id FROM permissions WHERE permission_code = $1", [permCode]);
      if (permRes.rows.length === 0) {
        console.log(`Permission ${permCode} not found in database, skipping`);
        continue;
      }
      const permissionId = permRes.rows[0].permission_id;
      await client.query(
        "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [roleId, permissionId]
      );
      console.log(`Assigned permission ${permCode} to ${roleCode}`);
    }
  }

  console.log('Permissions updated successfully!');
  await client.end();
}

main().catch(console.error);
