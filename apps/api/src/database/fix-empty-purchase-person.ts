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
  console.log('Database connected.');

  // Fix empty strings to NULL in sales_enquiry_order_items
  const itemResult = await ds.query(`
    UPDATE sales_enquiry_order_items
    SET
      purchase_person_id = CASE WHEN TRIM(COALESCE(purchase_person_id, '')) = '' THEN NULL ELSE purchase_person_id END,
      purchase_person_name = CASE WHEN TRIM(COALESCE(purchase_person_name, '')) = '' THEN NULL ELSE purchase_person_name END,
      assigned_purchase_user_id = CASE WHEN TRIM(COALESCE(assigned_purchase_user_id, '')) = '' THEN NULL ELSE assigned_purchase_user_id END,
      product_purchase_person_name = CASE WHEN TRIM(COALESCE(product_purchase_person_name, '')) = '' THEN NULL ELSE product_purchase_person_name END
    WHERE
      TRIM(COALESCE(purchase_person_id, '')) = ''
      OR TRIM(COALESCE(assigned_purchase_user_id, '')) = ''
      OR TRIM(COALESCE(purchase_person_name, '')) = ''
      OR TRIM(COALESCE(product_purchase_person_name, '')) = ''
  `);
  console.log(`Fixed ${itemResult[1]} enquiry item rows with empty-string purchase person fields.`);

  // Fix empty strings to NULL in products table too
  const productResult = await ds.query(`
    UPDATE products
    SET
      purchase_person_id = CASE WHEN TRIM(COALESCE(purchase_person_id, '')) = '' THEN NULL ELSE purchase_person_id END,
      purchase_person_name = CASE WHEN TRIM(COALESCE(purchase_person_name, '')) = '' THEN NULL ELSE purchase_person_name END
    WHERE
      TRIM(COALESCE(purchase_person_id, '')) = ''
      OR TRIM(COALESCE(purchase_person_name, '')) = ''
  `);
  console.log(`Fixed ${productResult[1]} product rows with empty-string purchase person fields.`);

  await ds.destroy();
  console.log('Done.');
}

run().catch(console.error);
