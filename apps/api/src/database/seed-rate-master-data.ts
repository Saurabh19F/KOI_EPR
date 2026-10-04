import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config({ path: '.env' });

async function seedRateData() {
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

  // ========== SEED HAULAGE MASTER ==========
  console.log('Seeding Haulage Master...');
  const haulageData = [
    { location: 'Delhi', rate_per_cbm: 185000, description: 'Delhi warehouse haulage rate' },
    { location: 'Mumbai', rate_per_cbm: 85000, description: 'Mumbai warehouse haulage rate' },
    { location: 'Chennai', rate_per_cbm: 95000, description: 'Chennai warehouse haulage rate' },
    { location: 'Kolkata', rate_per_cbm: 90000, description: 'Kolkata warehouse haulage rate' },
    { location: 'Bangalore', rate_per_cbm: 88000, description: 'Bangalore warehouse haulage rate' },
  ];

  for (const h of haulageData) {
    try {
      await dataSource.query(
        `INSERT INTO haulage_master (haulage_id, location, rate_per_cbm, description, is_active, created_at)
         VALUES ($1, $2, $3, $4, true, $5)`,
        [uuid(), h.location, h.rate_per_cbm, h.description, now]
      );
      console.log(`  ✓ ${h.location}: ${h.rate_per_cbm}`);
    } catch (e: any) {
      console.log(`  Haulage error: ${e.message.substring(0, 50)}`);
    }
  }

  // ========== SEED CURRENCY RATE MASTER ==========
  console.log('\nSeeding Currency Rate Master...');
  const currencyRates = [
    { currency_code: 'GBP', rate: 127.25, currency_name: 'British Pound' },
    { currency_code: 'USD', rate: 90.75, currency_name: 'US Dollar' },
    { currency_code: 'CAD', rate: 60.75, currency_name: 'Canadian Dollar' },
    { currency_code: 'AUD', rate: 61.50, currency_name: 'Australian Dollar' },
    { currency_code: 'EUR', rate: 105.75, currency_name: 'Euro' },
    { currency_code: 'AED', rate: 24.50, currency_name: 'UAE Dirham' },
    { currency_code: 'SGD', rate: 67.25, currency_name: 'Singapore Dollar' },
    { currency_code: 'JPY', rate: 0.60, currency_name: 'Japanese Yen' },
  ];

  for (const c of currencyRates) {
    try {
      await dataSource.query(
        `INSERT INTO currency_rate_master (rate_id, currency_code, currency_name, rate, rate_date, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, true, $6)`,
        [uuid(), c.currency_code, c.currency_name, c.rate, now, now]
      );
      console.log(`  ✓ ${c.currency_code}: ${c.rate}`);
    } catch (e: any) {
      console.log(`  Currency error: ${e.message.substring(0, 50)}`);
    }
  }

  // ========== SEED FINAL CURRENCY RATE MASTER (with margin) ==========
  console.log('\nSeeding Final Currency Rate Master...');
  const finalCurrencyRates = [
    { currency_code: 'GBP', actual_rate: 127.25, margin_buffer: 0.25, final_rate: 127.50 },
    { currency_code: 'USD', actual_rate: 90.75, margin_buffer: 0.25, final_rate: 91.00 },
    { currency_code: 'CAD', actual_rate: 60.75, margin_buffer: 0.25, final_rate: 61.00 },
    { currency_code: 'AUD', actual_rate: 61.50, margin_buffer: 0.50, final_rate: 62.00 },
    { currency_code: 'EUR', actual_rate: 105.75, margin_buffer: 0.25, final_rate: 106.00 },
    { currency_code: 'AED', actual_rate: 24.50, margin_buffer: 0.10, final_rate: 24.60 },
    { currency_code: 'SGD', actual_rate: 67.25, margin_buffer: 0.25, final_rate: 67.50 },
    { currency_code: 'JPY', actual_rate: 0.60, margin_buffer: 0.01, final_rate: 0.61 },
  ];

  for (const f of finalCurrencyRates) {
    try {
      await dataSource.query(
        `INSERT INTO final_currency_rate_master (final_currency_rate_id, currency_code, actual_rate, margin_buffer, final_rate, rate_date, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, $7)`,
        [uuid(), f.currency_code, f.actual_rate, f.margin_buffer, f.final_rate, now, now]
      );
      console.log(`  ✓ ${f.currency_code}: ${f.actual_rate} + ${f.margin_buffer} = ${f.final_rate}`);
    } catch (e: any) {
      console.log(`  Final currency error: ${e.message.substring(0, 50)}`);
    }
  }

  // ========== SEED FREIGHT MASTER ==========
  console.log('\nSeeding Freight Master...');
  const freightData = [
    { port_from: 'Mumbai', port_to: 'Chennai', rate_per_cbm: 15000, currency: 'INR' },
    { port_from: 'Mumbai', port_to: 'Delhi', rate_per_cbm: 25000, currency: 'INR' },
    { port_from: 'Chennai', port_to: 'Kolkata', rate_per_cbm: 12000, currency: 'INR' },
    { port_from: 'Mumbai', port_to: 'Bangalore', rate_per_cbm: 8000, currency: 'INR' },
  ];

  for (const f of freightData) {
    try {
      await dataSource.query(
        `INSERT INTO freight_master (freight_id, port_from, port_to, rate_per_cbm, currency, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, true, $6)`,
        [uuid(), f.port_from, f.port_to, f.rate_per_cbm, f.currency, now]
      );
      console.log(`  ✓ ${f.port_from} → ${f.port_to}: ${f.rate_per_cbm}`);
    } catch (e: any) {
      console.log(`  Freight error: ${e.message.substring(0, 50)}`);
    }
  }

  // ========== UPDATE SEGMENTS WITH PROPER CODES ==========
  console.log('\nUpdating Segment Codes...');
  const segmentCodes = [
    { name: 'Economy', code: '00' },
    { name: 'Kids', code: '01' },
    { name: 'Adult', code: '02' },
    { name: 'Natural/Organic', code: '03' },
  ];

  for (const seg of segmentCodes) {
    try {
      const result = await dataSource.query(
        `UPDATE segments SET segment_code = $1 WHERE segment_name ILIKE $2 OR description ILIKE $2 RETURNING segment_id`,
        [seg.code, `%${seg.name}%`]
      );
      if (result.length > 0) {
        console.log(`  ✓ Updated ${seg.name} → ${seg.code}`);
      }
    } catch (e: any) {
      console.log(`  Segment update error: ${e.message.substring(0, 50)}`);
    }
  }

  console.log('\n=== RATE MASTER DATA SEEDING COMPLETE ===');
  console.log('\nSeeded:');
  console.log('  - 5 Haulage rates (Delhi, Mumbai, Chennai, Kolkata, Bangalore)');
  console.log('  - 8 Currency rates (GBP, USD, CAD, AUD, EUR, AED, SGD, JPY)');
  console.log('  - 8 Final Currency rates (with margin buffer)');
  console.log('  - 4 Freight rates');
  console.log('  - Updated Segment codes (00/01/02/03)');

  await dataSource.destroy();
}

seedRateData().catch(console.error);
