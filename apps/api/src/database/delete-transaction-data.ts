import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config({ path: '.env' });

const KEEP_TABLES = new Set([
  // Masters
  'brands', 'component_groups', 'countries', 'currencies', 'currency_rate_master',
  'currency_rates', 'customers', 'final_currency_rate_master', 'formula_master',
  'freight_master', 'gst_rates', 'haulage_master', 'locations', 'packing_master',
  'payment_terms', 'ports', 'product_categories', 'products', 'segments',
  'uom_master', 'vendor_masters', 'vendors', 'warehouses', 'zones',
  // Setup / Admin
  'accounts', 'approval_matrix', 'companies', 'company_branding', 'company_contacts',
  'company_settings', 'email_templates', 'number_series', 'system_settings',
  'notification_rules', 'subscriptions',
  // Users
  'users', 'roles', 'role_permissions', 'permissions', 'departments',
]);

async function main() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    synchronize: false,
    logging: false,
  });
  await ds.initialize();

  const tables = await ds.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  const toDelete = tables
    .map((t: any) => t.table_name)
    .filter((name: string) => !KEEP_TABLES.has(name));

  console.log(`\n=== Tables to TRUNCATE (${toDelete.length}) ===`);
  toDelete.forEach((t: string) => console.log(`  - ${t}`));

  console.log(`\n=== Tables to KEEP (${tables.length - toDelete.length}) ===`);
  tables
    .map((t: any) => t.table_name)
    .filter((n: string) => KEEP_TABLES.has(n))
    .forEach((t: string) => console.log(`  + ${t}`));

  console.log('\nTruncating...');
  for (const table of toDelete) {
    try {
      await ds.query(`TRUNCATE TABLE "${table}" CASCADE`);
      console.log(`  TRUNCATED: ${table}`);
    } catch (e: any) {
      console.log(`  FAILED: ${table} - ${e.message}`);
    }
  }

  console.log('\n=== Verification - Kept tables row counts ===');
  for (const name of KEEP_TABLES) {
    try {
      const cnt = await ds.query(`SELECT count(*) as n FROM "${name}"`);
      console.log(`  ${name}: ${cnt[0].n} rows`);
    } catch {
      // table might not exist
    }
  }

  await ds.destroy();
  console.log('\nDone!');
}

main().catch(console.error);
