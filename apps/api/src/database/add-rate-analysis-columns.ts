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
    { name: 'total_purchase_value', type: 'numeric(15,2)' },
    { name: 'total_selling_value', type: 'numeric(15,2)' },
    { name: 'total_margin', type: 'numeric(10,2)' },
    { name: 'total_cbm', type: 'numeric(15,4)' },
    { name: 'total_haulage', type: 'numeric(15,2)' },
    { name: 'haulage_location', type: 'varchar(255)' },
    { name: 'container_size', type: 'integer' },
  ];

  for (const col of columns) {
    try {
      await ds.query(`ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
      console.log(`Added column ${col.name} to price_analysis_master`);
    } catch (e: any) {
      console.log(`Error adding ${col.name}:`, e.message);
    }
  }

  await ds.destroy();
}

fix().catch(console.error);
