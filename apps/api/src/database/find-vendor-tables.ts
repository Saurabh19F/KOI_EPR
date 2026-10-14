import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config({ path: '.env' });

async function check() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: false,
    synchronize: false,
    logging: false,
  });

  await ds.initialize();

  const tables = await ds.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name LIKE '%vendor%'
    ORDER BY table_name
  `);
  console.log('Tables containing \"vendor\":', tables.map((t: any) => t.table_name));

  await ds.destroy();
}

check().catch(console.error);
