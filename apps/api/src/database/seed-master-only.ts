/**
 * Seed script for MASTER DATA ONLY
 * Users are managed via database SQL scripts
 * Run: npm run seed
 */

import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config({ path: '.env' });

async function seed() {
  console.log('Starting ERP seed (master data only)...\n');

  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    synchronize: false,
    logging: false,
  });

  await dataSource.initialize();
  console.log('Database connected\n');

  // ===== PRODUCT CATEGORIES =====
  const categories = [
    { code: 'BRD', name: 'Biscuits & Bakery' },
    { code: 'KRI', name: 'Chocolates & Confectionery' },
    { code: 'SNA', name: 'Snacks & Savories' },
    { code: 'BVR', name: 'Beverages' },
    { code: 'DRY', name: 'Dry Fruits' },
    { code: 'FRZ', name: 'Frozen Foods' },
  ];

  for (const cat of categories) {
    await dataSource.query(`
      INSERT INTO product_categories (category_id, category_code, category_name, is_active)
      VALUES (gen_random_uuid(), $1, $2, true)
      ON CONFLICT (category_code) DO UPDATE SET category_name = $2
    `, [cat.code, cat.name]);
  }
  console.log('✓ Product Categories');

  // ===== SEGMENTS =====
  const segments = [
    { code: 'SS', name: 'Small Size' },
    { code: 'BB', name: 'Big Box' },
    { code: 'RB', name: 'Regular' },
    { code: 'FF', name: 'Family Pack' },
  ];

  for (const seg of segments) {
    await dataSource.query(`
      INSERT INTO segments (segment_id, segment_code, segment_name, is_active)
      VALUES (gen_random_uuid(), $1, $2, true)
      ON CONFLICT (segment_code) DO UPDATE SET segment_name = $2
    `, [seg.code, seg.name]);
  }
  console.log('✓ Segments');

  // ===== COMPONENT GROUPS =====
  const groups = [
    { code: 'GRP', name: 'General' },
    { code: 'ORG', name: 'Organic' },
    { code: 'STD', name: 'Standard' },
    { code: 'PRM', name: 'Premium' },
  ];

  for (const grp of groups) {
    await dataSource.query(`
      INSERT INTO component_groups (group_id, group_code, group_name, is_active)
      VALUES (gen_random_uuid(), $1, $2, true)
      ON CONFLICT (group_code) DO UPDATE SET group_name = $2
    `, [grp.code, grp.name]);
  }
  console.log('✓ Component Groups');

  // ===== BRANDS =====
  const brands = [
    { name: 'Parle', country: 'India' },
    { name: 'Britannia', country: 'India' },
    { name: 'Cadbury', country: 'UK' },
    { name: 'Nestle', country: 'Switzerland' },
    { name: 'Haldiram', country: 'India' },
    { name: 'PepsiCo', country: 'USA' },
    { name: 'Ferrero', country: 'Italy' },
    { name: 'Mars', country: 'USA' },
    { name: 'Lays', country: 'USA' },
    { name: 'Doritos', country: 'USA' },
  ];

  for (const brand of brands) {
    await dataSource.query(`
      INSERT INTO brands (brand_id, brand_name, country, is_active)
      VALUES (gen_random_uuid(), $1, $2, true)
      ON CONFLICT (brand_name) DO UPDATE SET country = $2
    `, [brand.name, brand.country]);
  }
  console.log('✓ Brands');

  // ===== UOM =====
  const uoms = [
    { name: 'Pieces', code: 'PCS' },
    { name: 'Kilograms', code: 'KG' },
    { name: 'Grams', code: 'GM' },
    { name: 'Liters', code: 'LTR' },
    { name: 'Milliliters', code: 'ML' },
    { name: 'Cartons', code: 'CTN' },
    { name: 'Boxes', code: 'BOX' },
    { name: 'Packets', code: 'PKT' },
  ];

  for (const uom of uoms) {
    await dataSource.query(`
      INSERT INTO uom_master (uom_id, uom_name, uom_short_code, is_active)
      VALUES (gen_random_uuid(), $1, $2, true)
      ON CONFLICT (uom_name) DO UPDATE SET uom_short_code = $2
    `, [uom.name, uom.code]);
  }
  console.log('✓ Units of Measure');

  // ===== GST RATES =====
  const gstRates = [
    { percent: 0, name: 'Exempt' },
    { percent: 5, name: 'GST 5%' },
    { percent: 12, name: 'GST 12%' },
    { percent: 18, name: 'GST 18%' },
    { percent: 28, name: 'GST 28%' },
  ];

  for (const gst of gstRates) {
    await dataSource.query(`
      INSERT INTO gst_rates (gst_rate_id, gst_name, gst_percent, is_active)
      VALUES (gen_random_uuid(), $1, $2, true)
      ON CONFLICT (gst_percent) DO UPDATE SET gst_name = $1
    `, [gst.name, gst.percent]);
  }
  console.log('✓ GST Rates');

  // ===== ZONES =====
  const zones = [
    { code: 'USA', name: 'USA & Canada' },
    { code: 'UK', name: 'United Kingdom' },
    { code: 'EU', name: 'European Union' },
    { code: 'DOM', name: 'Domestic' },
    { code: 'ME', name: 'Middle East' },
    { code: 'APAC', name: 'Asia Pacific' },
  ];

  for (const zone of zones) {
    await dataSource.query(`
      INSERT INTO zones (zone_id, zone_code, zone_name, is_active)
      VALUES (gen_random_uuid(), $1, $2, true)
      ON CONFLICT (zone_code) DO UPDATE SET zone_name = $2
    `, [zone.code, zone.name]);
  }
  console.log('✓ Zones');

  // ===== LOCATIONS =====
  const locations = [
    { name: 'Delhi NCR', region: 'North' },
    { name: 'Mumbai', region: 'West' },
    { name: 'Bangalore', region: 'South' },
    { name: 'Chennai', region: 'South' },
    { name: 'Kolkata', region: 'East' },
    { name: 'Hyderabad', region: 'South' },
    { name: 'Pune', region: 'West' },
    { name: 'Ahmedabad', region: 'West' },
  ];

  for (const loc of locations) {
    await dataSource.query(`
      INSERT INTO locations (location_id, location_name, region, is_active)
      VALUES (gen_random_uuid(), $1, $2, true)
      ON CONFLICT (location_name) DO UPDATE SET region = $2
    `, [loc.name, loc.region]);
  }
  console.log('✓ Locations');

  // ===== HAULAGE CHARGES =====
  const haulage = [
    { location: 'Delhi', amount: 185000 },
    { location: 'Mumbai', amount: 85000 },
    { location: 'Chennai', amount: 95000 },
    { location: 'Kolkata', amount: 120000 },
  ];

  for (const h of haulage) {
    await dataSource.query(`
      INSERT INTO haulage_master (haulage_id, location_name, amount, is_active)
      VALUES (gen_random_uuid(), $1, $2, true)
      ON CONFLICT (location_name) DO UPDATE SET amount = $2
    `, [h.location, h.amount]);
  }
  console.log('✓ Haulage Charges');

  // ===== CURRENCY RATES =====
  const currencies = [
    { code: 'USD', rate: 83.50, margin: 0.25 },
    { code: 'GBP', rate: 105.25, margin: 0.25 },
    { code: 'EUR', rate: 90.75, margin: 0.25 },
    { code: 'AED', rate: 22.75, margin: 0.10 },
    { code: 'SGD', rate: 62.00, margin: 0.15 },
    { code: 'AUD', rate: 55.50, margin: 0.20 },
  ];

  for (const curr of currencies) {
    await dataSource.query(`
      INSERT INTO currency_rate_master (rate_id, currency_code, rate, margin, is_active)
      VALUES (gen_random_uuid(), $1, $2, $3, true)
      ON CONFLICT (currency_code) DO UPDATE SET rate = $2, margin = $3
    `, [curr.code, curr.rate, curr.margin]);
  }
  console.log('✓ Currency Rates');

  // ===== PAYMENT TERMS =====
  const paymentTerms = [
    { name: 'Immediate', days: 0 },
    { name: 'Net 15', days: 15 },
    { name: 'Net 30', days: 30 },
    { name: 'Net 45', days: 45 },
    { name: 'Net 60', days: 60 },
    { name: 'Net 90', days: 90 },
    { name: 'Advance', days: 0 },
    { name: '50% Advance, 50% on Delivery', days: 0 },
  ];

  for (const pt of paymentTerms) {
    await dataSource.query(`
      INSERT INTO payment_terms (payment_terms_id, terms_name, days, is_active)
      VALUES (gen_random_uuid(), $1, $2, true)
      ON CONFLICT (terms_name) DO UPDATE SET days = $2
    `, [pt.name, pt.days]);
  }
  console.log('✓ Payment Terms');

  // ===== PORTS =====
  const ports = [
    { name: 'JNPT', location: 'Mumbai', country: 'India' },
    { name: 'Mundra', location: 'Gujarat', country: 'India' },
    { name: 'Chennai', location: 'Chennai', country: 'India' },
    { name: 'Kolkata', location: 'Kolkata', country: 'India' },
    { name: 'Nhava Sheva', location: 'Mumbai', country: 'India' },
    { name: 'Los Angeles', location: 'California', country: 'USA' },
    { name: 'Felixstowe', location: 'Suffolk', country: 'UK' },
    { name: 'Dubai', location: 'Dubai', country: 'UAE' },
  ];

  for (const port of ports) {
    await dataSource.query(`
      INSERT INTO ports (port_id, port_name, location, country, is_active)
      VALUES (gen_random_uuid(), $1, $2, $3, true)
      ON CONFLICT (port_name) DO UPDATE SET location = $2, country = $3
    `, [port.name, port.location, port.country]);
  }
  console.log('✓ Ports');

  console.log('\n✅ Master data seeded successfully!');
  console.log('\nNote: Users are managed via database SQL scripts.');
  console.log('Run FULL-seed.sql in your database SQL editor to create users.\n');

  await dataSource.destroy();
}

seed().catch(console.error);
