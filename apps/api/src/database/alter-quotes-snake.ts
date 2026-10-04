import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config({ path: '.env' });

async function run() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    synchronize: false,
    logging: false,
  });

  await ds.initialize();
  console.log('Connected to database to add snake_case columns...');

  const queries = [
    'ALTER TABLE purchase_quotes ADD COLUMN IF NOT EXISTS delivery_date TIMESTAMP',
    'ALTER TABLE purchase_quotes ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP',
    'ALTER TABLE purchase_quotes ADD COLUMN IF NOT EXISTS shipping_terms VARCHAR(255)',
    'ALTER TABLE purchase_quotes ADD COLUMN IF NOT EXISTS notes TEXT',
    'ALTER TABLE purchase_quotes ADD COLUMN IF NOT EXISTS enquiry_order_no VARCHAR(255)'
  ];

  for (const q of queries) {
    try {
      await ds.query(q);
      console.log(`Executed: ${q}`);
    } catch (e: any) {
      console.error(`Error executing: ${q} - ${e.message}`);
    }
  }

  await ds.destroy();
  console.log('Finished altering database.');
}

run().catch(console.error);
