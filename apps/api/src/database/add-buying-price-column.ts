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

  try {
    await ds.query(`ALTER TABLE sales_enquiry_order_items ADD COLUMN IF NOT EXISTS buying_price numeric(15,2)`);
    console.log('Added column buying_price to sales_enquiry_order_items');
  } catch (e: any) {
    console.log('Error adding buying_price:', e.message);
  }

  await ds.destroy();
  console.log('Done');
}

fix();
