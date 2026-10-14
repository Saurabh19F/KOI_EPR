const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_Up3HTVElA0DY@ep-crimson-wave-aow9s031.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
});

async function run() {
  await client.connect();
  console.log('Connected to PostgreSQL successfully.');

  // Check columns of users table
  const colRes = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'preferences'
  `);

  if (colRes.rows.length === 0) {
    console.log('Column "preferences" is missing from table "users". Adding it now...');
    await client.query(`
      ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}';
    `);
    console.log('Column "preferences" added successfully.');
  } else {
    console.log('Column "preferences" already exists in table "users".');
  }

  // Check if two_factor_config table exists, if not create it
  const tableRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_name = 'two_factor_config'
  `);

  if (tableRes.rows.length === 0) {
    console.log('Creating table "two_factor_config"...');
    await client.query(`
      CREATE TABLE two_factor_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
        enabled BOOLEAN NOT NULL DEFAULT FALSE,
        secret TEXT,
        backup_codes JSONB DEFAULT '[]'::jsonb,
        backup_codes_remaining INTEGER NOT NULL DEFAULT 0,
        method TEXT NOT NULL DEFAULT 'totp',
        phone_number TEXT,
        last_verified_at TIMESTAMP WITH TIME ZONE,
        allow_backup_codes BOOLEAN NOT NULL DEFAULT TRUE,
        grace_period_minutes INTEGER NOT NULL DEFAULT 10,
        enforced_by_admin TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Table "two_factor_config" created.');
  } else {
    console.log('Table "two_factor_config" already exists.');
  }

  // Check if session_management table exists
  const sessionRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_name = 'session_management'
  `);

  if (sessionRes.rows.length === 0) {
    console.log('Creating table "session_management"...');
    await client.query(`
      CREATE TABLE session_management (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID,
        user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        refresh_token_id TEXT NOT NULL,
        access_token_jti TEXT,
        device_info TEXT,
        ip_address TEXT,
        location TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        last_activity_at TIMESTAMP WITH TIME ZONE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        revoked_at TIMESTAMP WITH TIME ZONE,
        revoked_by TEXT,
        revoke_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Table "session_management" created.');
  } else {
    console.log('Table "session_management" already exists.');
  }

  // Check if api_key_management table exists
  const apiKeyRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_name = 'api_key_management'
  `);

  if (apiKeyRes.rows.length === 0) {
    console.log('Creating table "api_key_management"...');
    await client.query(`
      CREATE TABLE api_key_management (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID,
        user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        key_hash TEXT NOT NULL,
        key_prefix TEXT NOT NULL,
        description TEXT,
        scopes JSONB DEFAULT '[]'::jsonb,
        expires_at TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        last_used_at TIMESTAMP WITH TIME ZONE,
        last_ip_address TEXT,
        request_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Table "api_key_management" created.');
  } else {
    console.log('Table "api_key_management" already exists.');
  }

  // Check if login_activity table exists
  const loginActRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_name = 'login_activity'
  `);

  if (loginActRes.rows.length === 0) {
    console.log('Creating table "login_activity"...');
    await client.query(`
      CREATE TABLE login_activity (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID,
        user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        event TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        device_info TEXT,
        location TEXT,
        user_agent_parsed JSONB,
        metadata JSONB,
        success BOOLEAN NOT NULL DEFAULT TRUE,
        failure_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Table "login_activity" created.');
  } else {
    console.log('Table "login_activity" already exists.');
  }

  // Check if security_audit_log table exists
  const auditRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_name = 'security_audit_log'
  `);

  if (auditRes.rows.length === 0) {
    console.log('Creating table "security_audit_log"...');
    await client.query(`
      CREATE TABLE security_audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID,
        user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        resource TEXT,
        action TEXT,
        old_values JSONB,
        new_values JSONB,
        metadata JSONB,
        result TEXT NOT NULL DEFAULT 'success',
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Table "security_audit_log" created.');
  } else {
    console.log('Table "security_audit_log" already exists.');
  }

  await client.end();
}

run().catch(console.error);
