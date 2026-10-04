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
  console.log('Connected to database to alter purchase quote columns...');

  const pqQueries = [
    'ALTER TABLE purchase_quotes ADD COLUMN IF NOT EXISTS "deliveryDate" TIMESTAMP',
    'ALTER TABLE purchase_quotes ADD COLUMN IF NOT EXISTS "validUntil" TIMESTAMP',
    'ALTER TABLE purchase_quotes ADD COLUMN IF NOT EXISTS "shippingTerms" VARCHAR(255)',
    'ALTER TABLE purchase_quotes ADD COLUMN IF NOT EXISTS "notes" TEXT',
    'ALTER TABLE purchase_quotes ADD COLUMN IF NOT EXISTS "enquiryOrderNo" VARCHAR(255)'
  ];

  for (const q of pqQueries) {
    try {
      await ds.query(q);
      console.log(`Executed: ${q}`);
    } catch (e: any) {
      console.error(`Error executing: ${q} - ${e.message}`);
    }
  }

  const pqiQueries = [
    'ALTER TABLE purchase_quote_items ADD COLUMN IF NOT EXISTS "remarks" TEXT'
  ];

  for (const q of pqiQueries) {
    try {
      await ds.query(q);
      console.log(`Executed: ${q}`);
    } catch (e: any) {
      console.error(`Error executing: ${q} - ${e.message}`);
    }
  }

  await ds.destroy();
  console.log('Finished altering database columns.');
}

run().catch(console.error);
