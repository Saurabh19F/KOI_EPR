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

  const cols = await ds.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'purchase_quote_items' ORDER BY column_name`);
  console.log('purchase_quote_items:', cols.map((c: any) => c.column_name).join(', '));

  await ds.destroy();
}

check().catch(console.error);
