import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config({ path: '.env' });

async function run() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: false,
    synchronize: false,
    logging: false,
  });

  await ds.initialize();
  await ds.query('ALTER TABLE vendors ADD COLUMN IF NOT EXISTS "companyId" VARCHAR(100)');
  console.log('Column companyId added to vendors table.');
  await ds.destroy();
}

run().catch(console.error);
