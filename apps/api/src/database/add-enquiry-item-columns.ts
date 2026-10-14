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
    { name: 'freight', type: 'numeric(15,2)' },
    { name: 'landing_cost', type: 'numeric(15,2)' },
    { name: 'currency', type: 'varchar(50)' },
    { name: 'haulage', type: 'numeric(15,2)' },
    { name: 'requote_status', type: 'varchar(50)' },
  ];

  for (const col of columns) {
    try {
      await ds.query(`ALTER TABLE sales_enquiry_order_items ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
      console.log(`Added column ${col.name} to sales_enquiry_order_items`);
    } catch (e: any) {
      console.log(`Error adding ${col.name}:`, e.message);
    }
  }

  await ds.destroy();
  console.log('Done. Missing columns added to sales_enquiry_order_items.');
}

fix().catch(console.error);
