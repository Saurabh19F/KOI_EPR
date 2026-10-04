const { DataSource } = require('typeorm');
require('dotenv').config();

const ds = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  await ds.initialize();

  // Check which haulage table actually exists and its columns
  const tables = await ds.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name LIKE '%haul%'
  `);
  console.log('\nHaulage tables:', tables.map(t => t.table_name));

  for (const t of tables) {
    const cols = await ds.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = $1 ORDER BY ordinal_position
    `, [t.table_name]);
    console.log(`\n${t.table_name} columns:`);
    cols.forEach(c => console.log(`  ${c.column_name} (${c.data_type}) nullable=${c.is_nullable}`));
    
    const rows = await ds.query(`SELECT * FROM ${t.table_name} LIMIT 3`);
    console.log(`  Sample rows: ${rows.length}`, rows[0] ? JSON.stringify(rows[0]).slice(0,120) : '(empty)');
  }

  // Also check haulage_master
  const masterCols = await ds.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'haulage_master' ORDER BY ordinal_position
  `);
  if (masterCols.length) {
    console.log('\nhaulage_master columns:');
    masterCols.forEach(c => console.log(`  ${c.column_name} (${c.data_type})`));
    const mRows = await ds.query(`SELECT * FROM haulage_master LIMIT 3`);
    console.log(`  Sample rows: ${mRows.length}`, mRows[0] ? JSON.stringify(mRows[0]).slice(0,120) : '(empty)');
  }

  // Check GST percent field name
  const gstCols = await ds.query(`
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_name = 'gst_rates' ORDER BY ordinal_position
  `);
  console.log('\ngst_rates columns:', gstCols.map(c => c.column_name).join(', '));
  const gstRows = await ds.query(`SELECT * FROM gst_rates LIMIT 10`);
  console.log('GST rates sample:', gstRows.map(r => `${r.gst_code}:${r.gst_percent || r.gstPercent}%`).join(', '));

  await ds.destroy();
}
check().catch(e => { console.error(e.message); process.exit(1); });
