const { DataSource } = require('typeorm');
require('dotenv').config();

const ds = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkEnums() {
  await ds.initialize();

  const enums = await ds.query(`
    SELECT t.typname AS enum_name, e.enumlabel AS enum_value
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname LIKE 'customers_%' OR t.typname LIKE 'vendor%' OR t.typname LIKE 'sales_%'
    ORDER BY t.typname, e.enumsortorder
  `);

  const grouped = {};
  for (const row of enums) {
    if (!grouped[row.enum_name]) grouped[row.enum_name] = [];
    grouped[row.enum_name].push(row.enum_value);
  }
  console.log(JSON.stringify(grouped, null, 2));

  await ds.destroy();
}

checkEnums().catch(e => { console.error(e.message); process.exit(1); });
