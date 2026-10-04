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

  const tables = ['gst_rates', 'zones', 'ports', 'locations', 'currencies', 'payment_terms', 'number_series'];
  for (const t of tables) {
    const cols = await ds.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${t}' ORDER BY column_name`);
    console.log(t + ': ' + cols.map((c: any) => c.column_name).join(', '));
  }

  await ds.destroy();
}

check().catch(console.error);
