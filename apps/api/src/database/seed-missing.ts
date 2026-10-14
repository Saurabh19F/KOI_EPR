import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config({ path: '.env' });

async function seedRemainingData() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: false,
    synchronize: false,
    logging: false,
  });

  await dataSource.initialize();
  console.log('Connected to database...\n');

  const now = new Date().toISOString();
  const uuid = () => require('crypto').randomUUID();

  // ========== SEED GST RATES ==========
  console.log('Seeding GST Rates...');
  const gstRates = [
    { gst_percent: 0, gst_name: 'Exempt', gst_code: 'EXEMPT', description: 'Exempt from GST' },
    { gst_percent: 5, gst_name: 'GST 5%', gst_code: 'GST5', description: '5% GST rate' },
    { gst_percent: 12, gst_name: 'GST 12%', gst_code: 'GST12', description: '12% GST rate' },
    { gst_percent: 18, gst_name: 'GST 18%', gst_code: 'GST18', description: '18% GST rate' },
    { gst_percent: 28, gst_name: 'GST 28%', gst_code: 'GST28', description: '28% GST rate (highest)' },
  ];

  for (const gst of gstRates) {
    try {
      await dataSource.query(
        `INSERT INTO gst_rates (gst_rate_id, gst_percent, gst_name, gst_code, description, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, true, $6)`,
        [uuid(), gst.gst_percent, gst.gst_name, gst.gst_code, gst.description, now]
      );
      console.log(`  ✓ ${gst.gst_name}`);
    } catch (e: any) {
      console.log(`  GST error: ${e.message.substring(0, 60)}`);
    }
  }

  // ========== SEED LOCATIONS ==========
  console.log('\nSeeding Locations...');
  const locations = [
    { name: 'Main Warehouse', code: 'WH001', city: 'Mumbai', state: 'Maharashtra', type: 'Warehouse' },
    { name: 'Secondary Warehouse', code: 'WH002', city: 'Delhi', state: 'Delhi', type: 'Warehouse' },
    { name: 'Store Room A', code: 'SRA', city: 'Mumbai', state: 'Maharashtra', type: 'Storage' },
    { name: 'Store Room B', code: 'SRB', city: 'Bangalore', state: 'Karnataka', type: 'Storage' },
    { name: 'Cold Storage', code: 'CS01', city: 'Chennai', state: 'Tamil Nadu', type: 'Cold Storage' },
  ];

  for (const loc of locations) {
    try {
      await dataSource.query(
        `INSERT INTO locations (id, name, code, city, state, type, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, $7)`,
        [uuid(), loc.name, loc.code, loc.city, loc.state, loc.type, now]
      );
      console.log(`  ✓ ${loc.name}`);
    } catch (e: any) {
      console.log(`  Loc error: ${e.message.substring(0, 60)}`);
    }
  }

  // ========== SEED CUSTOMERS ==========
  console.log('\nSeeding Customers...');
  const customers = [
    { customer_name: 'Metro SuperMart', buyer_code: 'CUST001', contact_person: 'Rajesh Kumar', email: 'rajesh@metrosupermart.com', mobile: '+91 9876543210', product_zone: 'North' },
    { customer_name: 'City Hypermarket', buyer_code: 'CUST002', contact_person: 'Priya Sharma', email: 'priya@cityhyper.com', mobile: '+91 9876543211', product_zone: 'South' },
    { customer_name: 'Fresh Grocers', buyer_code: 'CUST003', contact_person: 'Amit Patel', email: 'amit@freshgrocers.com', mobile: '+91 9876543212', product_zone: 'West' },
    { customer_name: 'Value Mart', buyer_code: 'CUST004', contact_person: 'Sunita Devi', email: 'sunita@valuemart.com', mobile: '+91 9876543213', product_zone: 'East' },
    { customer_name: 'Premium Foods', buyer_code: 'CUST005', contact_person: 'Vikram Singh', email: 'vikram@premiumfoods.com', mobile: '+91 9876543214', product_zone: 'Central' },
  ];

  for (const cust of customers) {
    try {
      await dataSource.query(
        `INSERT INTO customers (customer_id, customer_name, buyer_code, contact_person, email, mobile, product_zone, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)`,
        [uuid(), cust.customer_name, cust.buyer_code, cust.contact_person, cust.email, cust.mobile, cust.product_zone, now]
      );
      console.log(`  ✓ ${cust.customer_name}`);
    } catch (e: any) {
      console.log(`  Cust error: ${e.message.substring(0, 60)}`);
    }
  }

  // ========== SEED VENDORS ==========
  console.log('\nSeeding Vendors...');
  const vendors = [
    { vendor_code: 'VND001', vendor_name: 'ABC Suppliers', contact_person: 'Ravi Kumar', email: 'ravi@abcsuppliers.com', phone: '+91 9988776655' },
    { vendor_code: 'VND002', vendor_name: 'XYZ Trading Co', contact_person: 'Meera Joshi', email: 'meera@xyztrading.com', phone: '+91 9988776656' },
    { vendor_code: 'VND003', vendor_name: 'Global Imports', contact_person: 'Suresh Nair', email: 'suresh@globalimports.com', phone: '+91 9988776657' },
    { vendor_code: 'VND004', vendor_name: 'Prime Distributors', contact_person: 'Anita Gupta', email: 'anita@primedist.com', phone: '+91 9988776658' },
    { vendor_code: 'VND005', vendor_name: 'Nature Harvest', contact_person: 'Kiran Rao', email: 'kiran@natureharvest.com', phone: '+91 9988776659' },
  ];

  for (const vend of vendors) {
    try {
      await dataSource.query(
        `INSERT INTO vendors (vendor_id, vendor_code, vendor_name, contact_person, email, phone, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, $7)`,
        [uuid(), vend.vendor_code, vend.vendor_name, vend.contact_person, vend.email, vend.phone, now]
      );
      console.log(`  ✓ ${vend.vendor_name}`);
    } catch (e: any) {
      console.log(`  Vend error: ${e.message.substring(0, 60)}`);
    }
  }

  console.log('\n=== REMAINING DATA SEEDING COMPLETE ===');
  await dataSource.destroy();
}

seedRemainingData().catch(console.error);
