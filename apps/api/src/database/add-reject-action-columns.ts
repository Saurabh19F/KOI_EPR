import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config({ path: '.env' });

async function run() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('sslmode=')
      ? { rejectUnauthorized: false }
      : false,
    synchronize: false,
    logging: true,
  });

  await ds.initialize();

  // Add new columns to reject_action_logs
  const columns = [
    { name: 'vendor_id', type: 'VARCHAR', nullable: true },
    { name: 'vendor_name', type: 'VARCHAR', nullable: true },
    { name: 'replacement_vendor_id', type: 'VARCHAR', nullable: true },
    { name: 'supplier_option', type: 'VARCHAR', nullable: true },
    { name: 'document_note_type', type: 'VARCHAR', nullable: true },
    { name: 'freight_charges', type: 'VARCHAR', nullable: true },
  ];

  for (const col of columns) {
    await ds.query(
      `ALTER TABLE reject_action_logs ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type} ${col.nullable ? 'NULL' : 'NOT NULL'}`,
    );
    console.log(`Added ${col.name} to reject_action_logs.`);
  }

  // Backfill vendor info from purchase_orders for existing reject actions
  const backfilled = await ds.query(`
    UPDATE reject_action_logs ra
    SET vendor_id = po.vendor_id::text, vendor_name = po.vendor_name
    FROM purchase_orders po
    WHERE ra.purchase_order_id::text = po.order_id::text
      AND (ra.vendor_name IS NULL OR ra.vendor_name = '')
      AND po.vendor_name IS NOT NULL AND po.vendor_name != '' AND po.vendor_name != 'TBD'
  `);
  console.log('Backfilled vendor info from purchase_orders:', backfilled);

  // Add REJECT_ACTION_VIEW and REJECT_ACTION_EDIT to PURCHASE_USER role
  const purchaseUserRole = await ds.query(
    `SELECT role_id FROM roles WHERE role_code = 'PURCHASE_USER' LIMIT 1`,
  );
  if (purchaseUserRole.length > 0) {
    const roleId = purchaseUserRole[0].role_id;
    const perms = ['REJECT_ACTION_VIEW', 'REJECT_ACTION_EDIT'];

    for (const permCode of perms) {
      const perm = await ds.query(
        `SELECT permission_id FROM permissions WHERE permission_code = $1 LIMIT 1`,
        [permCode],
      );
      if (perm.length > 0) {
        await ds.query(
          `INSERT INTO role_permissions (role_id, permission_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [roleId, perm[0].permission_id],
        );
        console.log(`Added ${permCode} to PURCHASE_USER role.`);
      }
    }
  }

  await ds.destroy();
  console.log('Done.');
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
