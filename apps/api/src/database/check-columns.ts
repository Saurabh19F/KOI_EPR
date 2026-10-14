import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config({ path: '.env' });

async function checkTableColumns() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: false,
    synchronize: false,
    logging: false,
  });

  await ds.initialize();

  const tables = [
    'segments',
    'component_groups',
    'brands',
    'uom_master',
    'gst_rates',
    'zones',
    'ports',
    'locations',
    'currencies',
    'payment_terms',
    'number_series',
    'customers',
    'vendors',
  ];

  for (const table of tables) {
    try {
      const cols = await ds.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = '${table}'
        ORDER BY column_name
      `);
      console.log(`\n=== ${table} ===`);
      cols.forEach((c: any) => console.log(`  ${c.column_name}: ${c.data_type}`));
    } catch (e: any) {
      console.log(`\n${table}: ERROR - ${e.message.substring(0, 50)}`);
    }
  }

  await ds.destroy();
}

checkTableColumns().catch(console.error);
