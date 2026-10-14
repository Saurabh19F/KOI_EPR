const { DataSource } = require('typeorm');
require('dotenv').config();

const ds = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
  await ds.initialize();
  console.log('Connected');

  const tables = [
    'currency_rate_master',
    'haulage_master',
    'payment_terms',
    'ports',
    'zones',
    'locations',
    'number_series',
    'customers',
    'vendors',
    'users',
  ];

  for (const table of tables) {
    const cols = await ds.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position`,
      [table]
    );
    console.log(`\n=== ${table} ===`);
    cols.forEach(c => console.log(`  ${c.column_name} (${c.data_type})`));
  }

  await ds.destroy();
}

checkSchema().catch(e => { console.error(e.message); process.exit(1); });
