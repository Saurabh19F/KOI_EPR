import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config({ path: '.env' });

async function addRequoteChainColumns() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: false,
    synchronize: false,
    logging: false,
  });

  await ds.initialize();

  const columns = [
    { name: 'parent_analysis_id', type: 'uuid' },
    { name: 'root_analysis_id', type: 'uuid' },
    { name: 'requote_version', type: 'integer DEFAULT 1' },
    { name: 'requote_reason', type: 'varchar(500)' },
  ];

  for (const col of columns) {
    try {
      await ds.query(`ALTER TABLE price_analysis_master ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
      console.log(`Added column ${col.name} to price_analysis_master`);
    } catch (e: any) {
      console.log(`Error adding ${col.name}:`, e.message);
    }
  }

  console.log('Done! Requote chain columns added.');
  await ds.destroy();
}

addRequoteChainColumns().catch(console.error);
