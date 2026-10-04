const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from apps/api/.env
dotenv.config({ path: path.join(__dirname, '.env') });

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Up3HTVElA0DY@ep-crimson-wave-aow9s031.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log('🚀 Running database migration to enforce foreign keys...');
  const sqlPath = path.join(__dirname, '../../supabase-migrations/004_enforce_foreign_keys.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  await client.connect();
  try {
    await client.query(sql);
    console.log('✅ Migration executed successfully! Foreign keys enforced.');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

run().catch(console.error);
