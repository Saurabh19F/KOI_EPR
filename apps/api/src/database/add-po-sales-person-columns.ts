import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config({ path: '.env' });

async function fix() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: false,
    synchronize: false,
    logging: false,
  });

  await ds.initialize();

  const columns = [
    { name: 'sales_person_id', type: 'varchar(255)' },
    { name: 'sales_person_name', type: 'varchar(255)' },
  ];

  for (const col of columns) {
    try {
      await ds.query(`ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type}`);
      console.log(`Added column ${col.name} to purchase_orders`);
    } catch (e: any) {
      console.log(`Error adding ${col.name}:`, e.message);
    }
  }

  // Verify
  const result = await ds.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'purchase_orders' AND column_name IN ('sales_person_id', 'sales_person_name')
  `);
  console.log('Verified columns:', result.map((r: any) => r.column_name));

  await ds.destroy();
  console.log('Done.');
}

fix().catch(console.error);
