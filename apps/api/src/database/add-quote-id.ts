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
    await ds.query(`ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS quote_id UUID`);
    console.log('Added quote_id column to purchase_quote_items');
  } catch (e: any) {
    console.log('Error:', e.message.substring(0, 100));
  }

  await ds.destroy();
}

fix().catch(console.error);
