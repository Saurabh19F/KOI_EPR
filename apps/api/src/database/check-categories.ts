import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config({ path: '.env' });

async function checkCategories() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: false,
    synchronize: false,
    logging: false,
  });

  await ds.initialize();

  // Check categories directly
  const cats = await ds.query('SELECT category_id, category_name, is_active FROM product_categories LIMIT 5');
  console.log('Categories in DB:', JSON.stringify(cats, null, 2));

  const count = await ds.query('SELECT COUNT(*) FROM product_categories');
  console.log('Total categories:', count);

  // Check table columns
  const cols = await ds.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'product_categories'
    ORDER BY column_name
  `);
  console.log('\nCategory table columns:');
  cols.forEach((c: any) => console.log(`  ${c.column_name}: ${c.data_type}`));

  await ds.destroy();
}

checkCategories().catch(console.error);
