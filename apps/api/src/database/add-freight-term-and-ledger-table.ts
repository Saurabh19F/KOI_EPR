import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config({ path: '.env' });

async function migrate() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    synchronize: false,
    logging: false,
  });

  await ds.initialize();

  try {
    await ds.query(`ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS "freight_term" varchar`);
    console.log('Added freightTerm column to purchase_orders');
  } catch (e: any) {
    console.log('Error adding freightTerm:', e.message);
  }

  try {
    await ds.query(`
      CREATE TABLE IF NOT EXISTS po_ledger_entries (
        "ledger_entry_id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" varchar,
        "order_id" varchar NOT NULL,
        "order_number" varchar NOT NULL,
        "enquiry_no" varchar,
        "sales_enquiry_id" varchar,
        "vendor_name" varchar,
        "po_amount" numeric(18,2) DEFAULT 0,
        "po_date" timestamp,
        "po_pdf_url" varchar,
        "ledger_number" varchar,
        "ledger_date" timestamp,
        "ledger_pdf_url" varchar,
        "ledger_file_name" varchar,
        "ledger_amount" numeric(18,2),
        "account_head_name" varchar,
        "accountant_remarks" text,
        "accountant_id" varchar,
        "accountant_name" varchar,
        "uploaded_at" timestamp,
        "planned_date" timestamp,
        "actual_date" timestamp,
        "chief_accountant_id" varchar,
        "chief_accountant_name" varchar,
        "approval_planned_date" timestamp,
        "approval_actual_date" timestamp,
        "chief_accountant_remarks" text,
        "approved_at" timestamp,
        "rejected_at" timestamp,
        "rejection_reason" text,
        "status" varchar DEFAULT 'pending' CHECK ("status" IN ('pending', 'ledger_uploaded', 'approved', 'rejected')),
        "is_active" boolean DEFAULT true,
        "created_by" varchar,
        "created_at" timestamp DEFAULT now(),
        "updated_by" varchar,
        "updated_at" timestamp DEFAULT now()
      )
    `);
    console.log('Created po_ledger_entries table');

    await ds.query(`CREATE INDEX IF NOT EXISTS "IDX_po_ledger_company_order" ON po_ledger_entries ("company_id", "order_id")`);
    await ds.query(`CREATE INDEX IF NOT EXISTS "IDX_po_ledger_status" ON po_ledger_entries ("status")`);
    console.log('Created indexes on po_ledger_entries');
  } catch (e: any) {
    console.log('Error creating po_ledger_entries:', e.message);
  }

  const cols = await ds.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'purchase_orders' AND column_name = 'freight_term'
  `);
  console.log('Verify freightTerm column:', cols.length > 0 ? 'EXISTS' : 'MISSING');

  const tbl = await ds.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_name = 'po_ledger_entries'
  `);
  console.log('Verify po_ledger_entries table:', tbl.length > 0 ? 'EXISTS' : 'MISSING');

  await ds.destroy();
  console.log('Done');
}

migrate();
