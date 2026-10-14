import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config({ path: '.env' });

async function addAccountantReviewColumns() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: false,
    synchronize: false,
    logging: false,
  });

  await ds.initialize();

  const columns = [
    // Activity-01: Accountant fields
    { name: 'act1_planned_date', type: 'timestamp' },
    { name: 'act1_actual_date', type: 'timestamp' },
    { name: 'act1_po_link', type: 'varchar(255)' },
    { name: 'act1_po_num', type: 'varchar(255)' },
    { name: 'act1_po_date', type: 'timestamp' },
    { name: 'act1_remarks', type: 'text' },
    { name: 'act1_updated_by', type: 'varchar(255)' },
    { name: 'act1_updated_at', type: 'timestamp' },
    // Activity-02: Chief Accountant fields
    { name: 'act2_planned_date', type: 'timestamp' },
    { name: 'act2_actual_date', type: 'timestamp' },
    { name: 'act2_approval', type: 'varchar(255)' },
    { name: 'act2_remarks', type: 'text' },
    { name: 'act2_updated_by', type: 'varchar(255)' },
    { name: 'act2_updated_at', type: 'timestamp' },
  ];

  for (const col of columns) {
    try {
      await ds.query(`ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type}`);
      console.log(`Added column ${col.name}`);
    } catch (e: any) {
      console.log(`Error adding ${col.name}:`, e.message);
    }
  }

  // Verify
  const result = await ds.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'purchase_orders' AND (column_name LIKE 'act1_%' OR column_name LIKE 'act2_%')
    ORDER BY column_name
  `);
  console.log('Verified columns:', result.map((r: any) => r.column_name));

  await ds.destroy();
  console.log('Done.');
}

addAccountantReviewColumns().catch(console.error);
