import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config({ path: '.env' });

async function run() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: false,
    synchronize: false,
    logging: true,
  });

  await ds.initialize();

  await ds.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS warehouse_id UUID NULL`);
  console.log('Added warehouse_id to users table.');

  await ds.query(`ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS planned_by VARCHAR NULL`);
  console.log('Added planned_by to purchase_orders table.');

  // Find the actual enum type name used by the status column
  const enumTypeResult = await ds.query(`
    SELECT udt_name FROM information_schema.columns
    WHERE table_name = 'purchase_orders' AND column_name = 'status'
  `);
  const enumTypeName = enumTypeResult[0]?.udt_name;
  console.log('PO status enum type:', enumTypeName);

  if (!enumTypeName) {
    console.log('Could not find enum type for purchase_orders.status — it may be a varchar column. Skipping enum update.');
  } else {
    const existing = await ds.query(`SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = $1)`, [enumTypeName]);
    const labels = existing.map((r: any) => r.enumlabel);
    console.log('Existing enum values:', labels);

    if (!labels.includes('partially_planned')) {
      await ds.query(`ALTER TYPE "${enumTypeName}" ADD VALUE 'partially_planned' AFTER 'approved'`);
      console.log('Added partially_planned to enum.');
    } else {
      console.log('partially_planned already exists in enum.');
    }

    if (!labels.includes('planned')) {
      await ds.query(`ALTER TYPE "${enumTypeName}" ADD VALUE 'planned' AFTER 'partially_planned'`);
      console.log('Added planned to enum.');
    } else {
      console.log('planned already exists in enum.');
    }
  }

  await ds.destroy();
  console.log('Migration complete.');
}

run().catch(console.error);
