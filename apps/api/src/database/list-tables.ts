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

  // List all tables in public schema
  const tables = await ds.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `);
  console.log('Tables in database:', tables.map((t: any) => t.table_name));

  // Check structure of vendors if it exists
  try {
    const cols = await ds.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'vendors'
    `);
    console.log('Vendors columns:', cols);
  } catch (e: any) {
    console.error('Error querying vendors table:', e.message);
  }

  await ds.destroy();
}

check().catch(console.error);
