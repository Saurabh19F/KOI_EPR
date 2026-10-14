const { DataSource } = require('typeorm');
require('dotenv').config();

const ds = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkConstraints() {
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
    'gst_rates',
    'uom_master',
    'brands',
  ];

  for (const table of tables) {
    const constraints = await ds.query(
      `SELECT conname, contype, pg_get_constraintdef(oid) as definition
       FROM pg_constraint
       WHERE conrelid = $1::regclass
       ORDER BY contype`,
      [table]
    );
    console.log(`\n=== ${table} CONSTRAINTS ===`);
    if (constraints.length === 0) {
      console.log('  (none)');
    } else {
      constraints.forEach(c => console.log(`  [${c.contype}] ${c.conname}: ${c.definition}`));
    }
  }

  await ds.destroy();
}

checkConstraints().catch(e => { console.error(e.message); process.exit(1); });
