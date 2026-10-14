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

  const newStatuses = [
    'purchase_in_progress',
    'purchase_completed',
    'accountant_review',
  ];

  for (const status of newStatuses) {
    try {
      await ds.query(`ALTER TYPE sales_orders_status_enum ADD VALUE IF NOT EXISTS '${status}'`);
      console.log(`Added enum value '${status}' to sales_orders_status_enum`);
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        console.log(`Enum value '${status}' already exists`);
      } else {
        console.log(`Error adding '${status}':`, e.message);
      }
    }
  }

  await ds.destroy();
  console.log('Done');
}

fix().catch(console.error);
