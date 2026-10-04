const { Client } = require('pg');

const client = new Client({
  host: 'aws-1-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.telztddxrafqlkrsbrcu',
  password: 'Kriscel@123456789000',
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

async function migrate() {
  try {
    console.log('Connecting to Supabase...');
    await client.connect();
    console.log('Connected!');

    // Check if fms_step_directory exists
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'fms_step_directory'
      ) as exists;
    `);

    if (checkResult.rows[0].exists) {
      console.log('FMS tables already exist, skipping migration.');
    } else {
      console.log('Creating FMS tables...');

      // Create fms_step_directory
      await client.query(`
        CREATE TABLE IF NOT EXISTS fms_step_directory (
          step_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id UUID,
          step_code VARCHAR(50) UNIQUE NOT NULL,
          step_name VARCHAR(255) NOT NULL,
          description TEXT,
          sequence INTEGER DEFAULT 1,
          sla_hours INTEGER DEFAULT 24,
          assigned_role VARCHAR(100),
          assigned_department VARCHAR(100),
          is_active BOOLEAN DEFAULT true,
          created_by UUID,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_by UUID,
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('Created fms_step_directory');

      // Create fms_tasks
      await client.query(`
        CREATE TABLE IF NOT EXISTS fms_tasks (
          task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id UUID,
          unique_key VARCHAR(255) UNIQUE,
          enquiry_order_id UUID,
          enquiry_order_no VARCHAR(100),
          sku VARCHAR(100),
          product_name TEXT,
          assigned_to UUID,
          assigned_by UUID,
          step_code VARCHAR(50),
          step_name VARCHAR(255),
          planned_start_date TIMESTAMP,
          planned_end_date TIMESTAMP,
          actual_start_date TIMESTAMP,
          actual_end_date TIMESTAMP,
          sla_hours INTEGER,
          sla_deadline TIMESTAMP,
          delay_hours INTEGER DEFAULT 0,
          delay_reason TEXT,
          status VARCHAR(50) DEFAULT 'pending',
          remarks TEXT,
          rate_output TEXT,
          rate_output_date TIMESTAMP,
          is_escalated BOOLEAN DEFAULT false,
          escalated_to UUID,
          escalated_at TIMESTAMP,
          is_active BOOLEAN DEFAULT true,
          created_by UUID,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_by UUID,
          updated_at TIMESTAMP DEFAULT NOW(),
          deleted_at TIMESTAMP
        );
      `);
      console.log('Created fms_tasks');

      // Create fms_mail_queue
      await client.query(`
        CREATE TABLE IF NOT EXISTS fms_mail_queue (
          mail_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          task_id UUID,
          mail_type VARCHAR(100) NOT NULL,
          recipient_email VARCHAR(255),
          recipient_name VARCHAR(255),
          subject VARCHAR(500),
          body TEXT,
          status VARCHAR(50) DEFAULT 'pending',
          sent_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('Created fms_mail_queue');

      // Create fms_escalations
      await client.query(`
        CREATE TABLE IF NOT EXISTS fms_escalations (
          escalation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          task_id UUID NOT NULL,
          escalated_by UUID,
          escalated_to UUID,
          escalation_level INTEGER DEFAULT 1,
          reason TEXT NOT NULL,
          resolved BOOLEAN DEFAULT false,
          resolved_by UUID,
          resolved_at TIMESTAMP,
          resolution_notes TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('Created fms_escalations');

      // Seed default FMS steps
      await client.query(`
        INSERT INTO fms_step_directory (step_code, step_name, description, sequence, sla_hours, assigned_role)
        VALUES
          ('ACT01', 'Purchase Order Creation', 'Create and send purchase order to vendor', 1, 24, 'purchase'),
          ('ACT02', 'Vendor Quote Receipt', 'Receive and verify vendor quotations', 2, 48, 'purchase'),
          ('ACT03', 'Rate Analysis', 'Calculate and analyze product rates', 3, 24, 'rate')
        ON CONFLICT (step_code) DO NOTHING;
      `);
      console.log('Seeded default FMS steps');

      console.log('Migration completed successfully!');
    }

    // Verify tables
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'fms%'
      ORDER BY table_name;
    `);
    console.log('\nFMS Tables created:');
    tables.rows.forEach(row => console.log('  - ' + row.table_name));

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
