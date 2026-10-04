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

  // Add columns to sales_enquiry_orders
  const orderColumns = [
    { name: 'sales_person_name', type: 'varchar(255)' },
    { name: 'cube_size', type: 'varchar(50)' },
    { name: 'port_of_loading', type: 'varchar(255)' },
    { name: 'transporter_details', type: 'text' },
    { name: 'total_cbm', type: 'numeric(15,4)' },
  ];

  for (const col of orderColumns) {
    try {
      await ds.query(`ALTER TABLE sales_enquiry_orders ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
      console.log(`Added column ${col.name} to sales_enquiry_orders`);
    } catch (e: any) {
      console.log(`Error adding ${col.name} to sales_enquiry_orders:`, e.message);
    }
  }

  // Add columns to sales_enquiry_order_items
  const itemColumns = [
    { name: 'purchase_person_name', type: 'varchar(255)' },
    { name: 'product_purchase_person_name', type: 'varchar(255)' },
    { name: 'total_cbm', type: 'numeric(15,4)' },
    { name: 'brand_name', type: 'varchar(255)' },
    { name: 'category_name', type: 'varchar(255)' },
    { name: 'unit_per_carton', type: 'integer' },
    { name: 'product_description', type: 'text' },
    { name: 'unit_size', type: 'varchar(100)' },
  ];

  for (const col of itemColumns) {
    try {
      await ds.query(`ALTER TABLE sales_enquiry_order_items ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
      console.log(`Added column ${col.name} to sales_enquiry_order_items`);
    } catch (e: any) {
      console.log(`Error adding ${col.name} to sales_enquiry_order_items:`, e.message);
    }
  }

  await ds.destroy();
  console.log('Database columns patch completed.');
}

fix().catch(console.error);
