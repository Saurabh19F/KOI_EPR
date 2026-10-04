import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config({ path: '.env' });

async function seedMasterData() {
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

  // ========== SEED PRODUCT CATEGORIES ==========
  console.log('Seeding Product Categories...');
  const categories = [
    { category_code: 'BR', category_name: 'Beverages', description: 'All types of beverages and drinks' },
    { category_code: 'FD', category_name: 'Food Products', description: 'Food items and consumables' },
    { category_code: 'SN', category_name: 'Snacks', description: 'Snacks and munchies' },
    { category_code: 'DA', category_name: 'Dairy', description: 'Dairy products' },
    { category_code: 'CN', category_name: 'Confectionery', description: 'Candies and sweets' },
    { category_code: 'CL', category_name: 'Cleaning', description: 'Cleaning supplies and detergents' },
    { category_code: 'PC', category_name: 'Personal Care', description: 'Personal hygiene and care products' },
    { category_code: 'HM', category_name: 'Home Care', description: 'Home care and household items' },
  ];

  for (const cat of categories) {
    try {
      await dataSource.query(
        `INSERT INTO product_categories (category_id, category_code, category_name, description, is_active, created_at)
         VALUES ($1, $2, $3, $4, true, $5)`,
        [uuid(), cat.category_code, cat.category_name, cat.description, now]
      );
    } catch (e: any) { console.log(`  Cat error: ${e.message.substring(0, 40)}`); }
  }
  console.log(`  ✓ ${categories.length} categories seeded`);

  // ========== SEED SEGMENTS ==========
  console.log('Seeding Segments...');
  const segments = [
    { segment_code: 'PRE', segment_name: 'Premium', description: 'Premium/Luxury segment' },
    { segment_code: 'STD', segment_name: 'Standard', description: 'Standard/Mid-range segment' },
    { segment_code: 'ECO', segment_name: 'Economy', description: 'Economy/Budget segment' },
    { segment_code: 'NAT', segment_name: 'Natural/Organic', description: 'Natural and organic products' },
  ];

  for (const seg of segments) {
    try {
      await dataSource.query(
        `INSERT INTO segments (segment_id, segment_code, segment_name, description, is_active, created_at)
         VALUES ($1, $2, $3, $4, true, $5)`,
        [uuid(), seg.segment_code, seg.segment_name, seg.description, now]
      );
    } catch (e: any) { console.log(`  Seg error: ${e.message.substring(0, 40)}`); }
  }
  console.log(`  ✓ ${segments.length} segments seeded`);

  // ========== SEED COMPONENT GROUPS ==========
  console.log('Seeding Component Groups...');
  const groups = [
    { group_code: 'SAU', group_name: 'Sauces', description: 'Sauces and condiments' },
    { group_code: 'CHP', group_name: 'Chips', description: 'Chips and crisps' },
    { group_code: 'BIS', group_name: 'Biscuits', description: 'Biscuits and cookies' },
    { group_code: 'CHC', group_name: 'Chocolate', description: 'Chocolate products' },
    { group_code: 'BEV', group_name: 'Beverages', description: 'Beverage products' },
    { group_code: 'DRY', group_name: 'Dry Fruits', description: 'Dry fruits and nuts' },
    { group_code: 'SPO', group_name: 'Spreads', description: 'Spreads and jams' },
    { group_code: 'NOD', group_name: 'Noodles', description: 'Noodles and pasta' },
  ];

  for (const grp of groups) {
    try {
      await dataSource.query(
        `INSERT INTO component_groups (group_id, group_code, group_name, description, is_active, created_at)
         VALUES ($1, $2, $3, $4, true, $5)`,
        [uuid(), grp.group_code, grp.group_name, grp.description, now]
      );
    } catch (e: any) { console.log(`  Grp error: ${e.message.substring(0, 40)}`); }
  }
  console.log(`  ✓ ${groups.length} component groups seeded`);

  // ========== SEED BRANDS ==========
  console.log('Seeding Brands...');
  const brands = [
    { brand_name: 'Crispeez', brand_code: 'CPZ', description: 'Premium snack brand' },
    { brand_name: 'Tasty Bites', brand_code: 'TB', description: 'Quality food products' },
    { brand_name: 'Fresh Drink Co', brand_code: 'FDC', description: 'Beverage company' },
    { brand_name: 'Clean Pro', brand_code: 'CLP', description: 'Cleaning solutions' },
    { brand_name: 'Nature Best', brand_code: 'NB', description: 'Natural and organic products' },
    { brand_name: 'Sweet Treats', brand_code: 'ST', description: 'Confectionery brand' },
    { brand_name: 'Daily Needs', brand_code: 'DN', description: 'Everyday household products' },
    { brand_name: 'Pure Care', brand_code: 'PC', description: 'Personal care products' },
  ];

  for (const brand of brands) {
    try {
      await dataSource.query(
        `INSERT INTO brands (brand_id, brand_name, brand_code, description, is_active, created_at)
         VALUES ($1, $2, $3, $4, true, $5)`,
        [uuid(), brand.brand_name, brand.brand_code, brand.description, now]
      );
    } catch (e: any) { console.log(`  Brand error: ${e.message.substring(0, 40)}`); }
  }
  console.log(`  ✓ ${brands.length} brands seeded`);

  // ========== SEED UOM (Unit of Measure) ==========
  console.log('Seeding UOM Master...');
  const uoms = [
    { uom_code: 'PC', uom_name: 'Piece', description: 'Per piece' },
    { uom_code: 'KG', uom_name: 'Kilogram', description: 'Per kilogram' },
    { uom_code: 'G', uom_name: 'Gram', description: 'Per gram' },
    { uom_code: 'L', uom_name: 'Litre', description: 'Per litre' },
    { uom_code: 'ML', uom_name: 'Millilitre', description: 'Per millilitre' },
    { uom_code: 'CTN', uom_name: 'Carton', description: 'Per carton' },
    { uom_code: 'BOX', uom_name: 'Box', description: 'Per box' },
    { uom_code: 'DOZ', uom_name: 'Dozen', description: 'Per dozen' },
  ];

  for (const uom of uoms) {
    try {
      await dataSource.query(
        `INSERT INTO uom_master (uom_id, uom_code, uom_name, description, is_active, created_at)
         VALUES ($1, $2, $3, $4, true, $5)`,
        [uuid(), uom.uom_code, uom.uom_name, uom.description, now]
      );
    } catch (e: any) { console.log(`  UOM error: ${e.message.substring(0, 40)}`); }
  }
  console.log(`  ✓ ${uoms.length} UOMs seeded`);

  // ========== SEED GST RATES ==========
  console.log('Seeding GST Rates...');
  const gstRates = [
    { gst_percent: 0, gst_name: 'Exempt', description: 'Exempt from GST' },
    { gst_percent: 5, gst_name: 'GST 5%', description: '5% GST rate' },
    { gst_percent: 12, gst_name: 'GST 12%', description: '12% GST rate' },
    { gst_percent: 18, gst_name: 'GST 18%', description: '18% GST rate' },
    { gst_percent: 28, gst_name: 'GST 28%', description: '28% GST rate (highest)' },
  ];

  for (const gst of gstRates) {
    try {
      await dataSource.query(
        `INSERT INTO gst_rates (gst_rate_id, gst_percent, gst_name, description, is_active, created_at)
         VALUES ($1, $2, $3, $4, true, $5)`,
        [uuid(), gst.gst_percent, gst.gst_name, gst.description, now]
      );
    } catch (e: any) { console.log(`  GST error: ${e.message.substring(0, 40)}`); }
  }
  console.log(`  ✓ ${gstRates.length} GST rates seeded`);

  // ========== SEED ZONES ==========
  console.log('Seeding Zones...');
  const zones = [
    { name: 'North', code: 'N', description: 'Northern region' },
    { name: 'South', code: 'S', description: 'Southern region' },
    { name: 'East', code: 'E', description: 'Eastern region' },
    { name: 'West', code: 'W', description: 'Western region' },
    { name: 'Central', code: 'C', description: 'Central region' },
  ];

  for (const zone of zones) {
    try {
      await dataSource.query(
        `INSERT INTO zones (id, name, code, description, is_active, created_at)
         VALUES ($1, $2, $3, $4, true, $5)`,
        [uuid(), zone.name, zone.code, zone.description, now]
      );
    } catch (e: any) { console.log(`  Zone error: ${e.message.substring(0, 40)}`); }
  }
  console.log(`  ✓ ${zones.length} zones seeded`);

  // ========== SEED PORTS ==========
  console.log('Seeding Ports...');
  const ports = [
    { name: 'Mumbai', code: 'BOM', type: 'Sea', city: 'Mumbai', state: 'Maharashtra' },
    { name: 'Chennai', code: 'MAA', type: 'Sea', city: 'Chennai', state: 'Tamil Nadu' },
    { name: 'Kolkata', code: 'CCU', type: 'Sea', city: 'Kolkata', state: 'West Bengal' },
    { name: 'Delhi', code: 'DEL', type: 'Air', city: 'New Delhi', state: 'Delhi' },
    { name: 'Bangalore', code: 'BLR', type: 'Air', city: 'Bangalore', state: 'Karnataka' },
  ];

  for (const port of ports) {
    try {
      await dataSource.query(
        `INSERT INTO ports (id, name, code, type, city, state, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, $7)`,
        [uuid(), port.name, port.code, port.type, port.city, port.state, now]
      );
    } catch (e: any) { console.log(`  Port error: ${e.message.substring(0, 40)}`); }
  }
  console.log(`  ✓ ${ports.length} ports seeded`);

  // ========== SEED LOCATIONS ==========
  console.log('Seeding Locations...');
  const locations = [
    { name: 'Main Warehouse', code: 'WH001', description: 'Primary warehouse', city: 'Mumbai', state: 'Maharashtra', type: 'Warehouse' },
    { name: 'Secondary Warehouse', code: 'WH002', description: 'Secondary storage', city: 'Delhi', state: 'Delhi', type: 'Warehouse' },
    { name: 'Store Room A', code: 'SRA', description: 'Store room A', city: 'Mumbai', state: 'Maharashtra', type: 'Storage' },
    { name: 'Store Room B', code: 'SRB', description: 'Store room B', city: 'Bangalore', state: 'Karnataka', type: 'Storage' },
    { name: 'Cold Storage', code: 'CS01', description: 'Cold storage facility', city: 'Chennai', state: 'Tamil Nadu', type: 'Cold Storage' },
  ];

  for (const loc of locations) {
    try {
      await dataSource.query(
        `INSERT INTO locations (id, name, code, description, city, state, type, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)`,
        [uuid(), loc.name, loc.code, loc.description, loc.city, loc.state, loc.type, now]
      );
    } catch (e: any) { console.log(`  Loc error: ${e.message.substring(0, 40)}`); }
  }
  console.log(`  ✓ ${locations.length} locations seeded`);

  // ========== SEED CURRENCIES ==========
  console.log('Seeding Currencies...');
  const currencies = [
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', is_base: true },
    { code: 'USD', name: 'US Dollar', symbol: '$', is_base: false },
    { code: 'EUR', name: 'Euro', symbol: '€', is_base: false },
    { code: 'GBP', name: 'British Pound', symbol: '£', is_base: false },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', is_base: false },
  ];

  for (const curr of currencies) {
    try {
      await dataSource.query(
        `INSERT INTO currencies (id, code, name, symbol, is_base, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, true, $6)`,
        [uuid(), curr.code, curr.name, curr.symbol, curr.is_base, now]
      );
    } catch (e: any) { console.log(`  Curr error: ${e.message.substring(0, 40)}`); }
  }
  console.log(`  ✓ ${currencies.length} currencies seeded`);

  // ========== SEED PAYMENT TERMS ==========
  console.log('Seeding Payment Terms...');
  const paymentTerms = [
    { name: 'Immediate', code: 'IMMED', days: 0, description: 'Payment immediately' },
    { name: 'Net 15', code: 'NET15', days: 15, description: 'Payment within 15 days' },
    { name: 'Net 30', code: 'NET30', days: 30, description: 'Payment within 30 days' },
    { name: 'Net 45', code: 'NET45', days: 45, description: 'Payment within 45 days' },
    { name: 'Net 60', code: 'NET60', days: 60, description: 'Payment within 60 days' },
    { name: 'Net 90', code: 'NET90', days: 90, description: 'Payment within 90 days' },
    { name: 'Advance', code: 'ADV', days: 0, description: 'Payment in advance' },
  ];

  for (const pt of paymentTerms) {
    try {
      await dataSource.query(
        `INSERT INTO payment_terms (id, name, code, days, description, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, true, $6)`,
        [uuid(), pt.name, pt.code, pt.days, pt.description, now]
      );
    } catch (e: any) { console.log(`  PT error: ${e.message.substring(0, 40)}`); }
  }
  console.log(`  ✓ ${paymentTerms.length} payment terms seeded`);

  // ========== SEED NUMBER SERIES ==========
  console.log('Seeding Number Series...');
  const numberSeries = [
    { prefix: 'ENQ', module_name: 'sales_enquiry', current_number: 1000, padding: 4 },
    { prefix: 'SO', module_name: 'sales_order', current_number: 1000, padding: 4 },
    { prefix: 'PO', module_name: 'purchase_order', current_number: 1000, padding: 4 },
    { prefix: 'PQ', module_name: 'purchase_quote', current_number: 1000, padding: 4 },
    { prefix: 'INV', module_name: 'invoice', current_number: 1000, padding: 4 },
    { prefix: 'DN', module_name: 'delivery_note', current_number: 1000, padding: 4 },
    { prefix: 'GRN', module_name: 'goods_receipt', current_number: 1000, padding: 4 },
    { prefix: 'SKU', module_name: 'product_sku', current_number: 1, padding: 6 },
  ];

  for (const ns of numberSeries) {
    try {
      await dataSource.query(
        `INSERT INTO number_series (number_series_id, prefix, module_name, current_number, padding, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, true, $6)`,
        [uuid(), ns.prefix, ns.module_name, ns.current_number, ns.padding, now]
      );
    } catch (e: any) { console.log(`  NS error: ${e.message.substring(0, 40)}`); }
  }
  console.log(`  ✓ ${numberSeries.length} number series seeded`);

  // ========== SEED CUSTOMERS ==========
  console.log('Seeding Customers...');
  const customers = [
    { customer_code: 'CUST001', customer_name: 'Metro SuperMart', contact_person: 'Rajesh Kumar', email: 'rajesh@metrosupermart.com', phone: '+91 9876543210', zone: 'North' },
    { customer_code: 'CUST002', customer_name: 'City Hypermarket', contact_person: 'Priya Sharma', email: 'priya@cityhyper.com', phone: '+91 9876543211', zone: 'South' },
    { customer_code: 'CUST003', customer_name: 'Fresh Grocers', contact_person: 'Amit Patel', email: 'amit@freshgrocers.com', phone: '+91 9876543212', zone: 'West' },
    { customer_code: 'CUST004', customer_name: 'Value Mart', contact_person: 'Sunita Devi', email: 'sunita@valuemart.com', phone: '+91 9876543213', zone: 'East' },
    { customer_code: 'CUST005', customer_name: 'Premium Foods', contact_person: 'Vikram Singh', email: 'vikram@premiumfoods.com', phone: '+91 9876543214', zone: 'Central' },
  ];

  for (const cust of customers) {
    try {
      await dataSource.query(
        `INSERT INTO customers (customer_id, customer_code, customer_name, contact_person, email, phone, zone, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)`,
        [uuid(), cust.customer_code, cust.customer_name, cust.contact_person, cust.email, cust.phone, cust.zone, now]
      );
    } catch (e: any) { console.log(`  Cust error: ${e.message.substring(0, 40)}`); }
  }
  console.log(`  ✓ ${customers.length} customers seeded`);

  // ========== SEED VENDORS ==========
  console.log('Seeding Vendors...');
  const vendors = [
    { vendor_code: 'VND001', vendor_name: 'ABC Suppliers', contact_person: 'Ravi Kumar', email: 'ravi@abcsuppliers.com', phone: '+91 9988776655', category: 'Food Products' },
    { vendor_code: 'VND002', vendor_name: 'XYZ Trading Co', contact_person: 'Meera Joshi', email: 'meera@xyztrading.com', phone: '+91 9988776656', category: 'Beverages' },
    { vendor_code: 'VND003', vendor_name: 'Global Imports', contact_person: 'Suresh Nair', email: 'suresh@globalimports.com', phone: '+91 9988776657', category: 'Snacks' },
    { vendor_code: 'VND004', vendor_name: 'Prime Distributors', contact_person: 'Anita Gupta', email: 'anita@primedist.com', phone: '+91 9988776658', category: 'Cleaning' },
    { vendor_code: 'VND005', vendor_name: 'Nature Harvest', contact_person: 'Kiran Rao', email: 'kiran@natureharvest.com', phone: '+91 9988776659', category: 'Organic' },
  ];

  for (const vend of vendors) {
    try {
      await dataSource.query(
        `INSERT INTO vendors (vendor_id, vendor_code, vendor_name, contact_person, email, phone, category, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)`,
        [uuid(), vend.vendor_code, vend.vendor_name, vend.contact_person, vend.email, vend.phone, vend.category, now]
      );
    } catch (e: any) { console.log(`  Vend error: ${e.message.substring(0, 40)}`); }
  }
  console.log(`  ✓ ${vendors.length} vendors seeded`);

  // ========== SEED SAMPLE PRODUCTS ==========
  console.log('Seeding Sample Products...');

  const products = [
    { product_name: 'Crispeez Tomato ketchup 500gm', sku: 'BR-STD-SAU-000001', mrp: 120, standard_cost: 85 },
    { product_name: 'Crispeez Hot Sauce 250ml', sku: 'BR-PRE-SAU-000002', mrp: 95, standard_cost: 65 },
    { product_name: 'Tasty Bites Instant Noodles', sku: 'FD-STD-NOD-000003', mrp: 180, standard_cost: 130 },
    { product_name: 'Fresh Drink Co Mango Juice 1L', sku: 'BR-STD-BEV-000004', mrp: 150, standard_cost: 100 },
    { product_name: 'Nature Best Peanut Butter 500gm', sku: 'FD-NAT-SPO-000005', mrp: 350, standard_cost: 250 },
    { product_name: 'Sweet Treats Chocolate Bar 100gm', sku: 'CN-STD-CHC-000006', mrp: 80, standard_cost: 55 },
    { product_name: 'Clean Pro Dishwash Liquid 1L', sku: 'CL-STD-SAU-000007', mrp: 220, standard_cost: 160 },
    { product_name: 'Pure Care Handwash 500ml', sku: 'PC-STD-SAU-000008', mrp: 180, standard_cost: 120 },
  ];

  for (const prod of products) {
    try {
      await dataSource.query(
        `INSERT INTO products (product_id, product_name, sku, mrp, standard_cost, is_active, product_status, source, created_at)
         VALUES ($1, $2, $3, $4, $5, true, 'active', 'master', $6)
         ON CONFLICT (sku) DO NOTHING`,
        [uuid(), prod.product_name, prod.sku, prod.mrp, prod.standard_cost, now]
      );
    } catch (e: any) { console.log(`  Prod error: ${e.message.substring(0, 40)}`); }
  }
  console.log(`  ✓ ${products.length} sample products seeded`);

  console.log('\n=== SEEDING COMPLETE ===');
  console.log('\nMaster data has been seeded:');
  console.log('  - 8 Product Categories');
  console.log('  - 4 Segments');
  console.log('  - 8 Component Groups');
  console.log('  - 8 Brands');
  console.log('  - 8 UOMs');
  console.log('  - 5 GST Rates');
  console.log('  - 5 Zones');
  console.log('  - 5 Ports');
  console.log('  - 5 Locations');
  console.log('  - 5 Currencies');
  console.log('  - 7 Payment Terms');
  console.log('  - 8 Number Series');
  console.log('  - 5 Customers');
  console.log('  - 5 Vendors');
  console.log('  - 8 Sample Products');

  await dataSource.destroy();
}

seedMasterData().catch(console.error);
