import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config({ path: '.env' });

async function migrate() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: false,
    synchronize: false,
    logging: false,
  });

  await ds.initialize();
  console.log('Connected to database for migration...');

  // Create enum types (ignore if already exist)
  await ds.query(`
    DO $$ BEGIN
      CREATE TYPE quality_log_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await ds.query(`
    DO $$ BEGIN
      CREATE TYPE inspection_decision AS ENUM ('pending', 'approved', 'rejected', 'partially_approved');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await ds.query(`
    DO $$ BEGIN
      CREATE TYPE reject_action_type AS ENUM ('packing_issue', 'expired', 'bet_ctn', 'bent_ctn', 'shortage_pcs_ctn', 'different_item_as_po', 'infected', 'impacted', 'infection_in_material', 'moisture_damage', 'others', 'short_kg');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);

  // Migrate existing reject_action_logs enum to new defect-type values
  const enumNames = [
    'reject_action_logs_actiontype_enum',
    'reject_action_logs_action_type_enum',
    'reject_action_type',
  ];
  const newValues = [
    'packing_issue', 'expired', 'bet_ctn', 'bent_ctn', 'shortage_pcs_ctn',
    'different_item_as_po', 'infected', 'impacted', 'infection_in_material',
    'moisture_damage', 'others', 'short_kg',
  ];
  for (const enumName of enumNames) {
    for (const val of newValues) {
      await ds.query(`
        DO $$ BEGIN
          ALTER TYPE "${enumName}" ADD VALUE IF NOT EXISTS '${val}';
        EXCEPTION WHEN undefined_object THEN NULL;
        END $$;
      `);
    }
  }

  await ds.query(`
    DO $$ BEGIN
      CREATE TYPE reject_action_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);

  // Create quality_logs table
  await ds.query(`
    CREATE TABLE IF NOT EXISTS quality_logs (
      "qcId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "companyId" VARCHAR(255),
      "qcNumber" VARCHAR(255) NOT NULL,
      "productionLogId" VARCHAR(255),
      "productionJobId" VARCHAR(255),
      "dateRequested" DATE NOT NULL,
      "warehouseId" VARCHAR(255) NOT NULL,
      "warehouseName" VARCHAR(255),
      "productId" VARCHAR(255) NOT NULL,
      "productName" VARCHAR(255),
      "qtyToInspect" DECIMAL(15,3) NOT NULL,
      "qtyApproved" DECIMAL(15,3) DEFAULT 0,
      "qtyRejected" DECIMAL(15,3) DEFAULT 0,
      "status" quality_log_status DEFAULT 'pending',
      "checkedBy" VARCHAR(255),
      "checkedByUserId" VARCHAR(255),
      "inspectionDate" DATE,
      "decision" inspection_decision,
      "reason" TEXT,
      "remarks" TEXT,
      "createdBy" VARCHAR(255) NOT NULL,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedBy" VARCHAR(255),
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('quality_logs table created successfully!');

  // Create unique index on qcNumber
  await ds.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS "IDX_quality_logs_qcNumber" ON quality_logs ("qcNumber")
  `);

  // Create reject_action_logs table
  await ds.query(`
    CREATE TABLE IF NOT EXISTS reject_action_logs (
      "actionId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "companyId" VARCHAR(255),
      "actionNumber" VARCHAR(255) NOT NULL,
      "receiptId" VARCHAR(255),
      "purchaseOrderId" VARCHAR(255),
      "poNumber" VARCHAR(255),
      "productId" VARCHAR(255) NOT NULL,
      "productName" VARCHAR(255),
      "rejectedQty" DECIMAL(15,3) NOT NULL,
      "actionType" reject_action_type NOT NULL,
      "actionDate" DATE NOT NULL,
      "referenceNo" VARCHAR(255),
      "status" reject_action_status DEFAULT 'pending',
      "isReplacementExpected" BOOLEAN DEFAULT false,
      "replacementReceived" BOOLEAN DEFAULT false,
      "replacementVendor" VARCHAR(255),
      "replacementEta" DATE,
      "resolutionPath" VARCHAR(255),
      "purchaseRemarks" TEXT,
      "qualityRemarks" TEXT,
      "updatedBy" VARCHAR(255),
      "updatedByUserId" VARCHAR(255),
      "createdBy" VARCHAR(255) NOT NULL,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('reject_action_logs table created successfully!');

  // Create unique index on actionNumber
  await ds.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS "IDX_reject_action_logs_actionNumber" ON reject_action_logs ("actionNumber")
  `);

  await ds.destroy();
  console.log('Migration complete!');
}

migrate().catch(console.error);
