import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config({ path: '.env' });
dotenv.config({ path: 'apps/api/.env' });

const DEFAULT_VENDOR_SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1FuVKukmIw3N5fJPpyF7MzjjADSeA_TFSMNYpzrOikgA/export?format=csv&gid=0';

type VendorSheetRow = {
  sno: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  fssaiNumber: string;
  gstNumber: string;
  category: string;
  productsSupplied: string;
  paymentTerms: string;
  purchasePerson: string;
};

function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    const next = csv[i + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => value.trim() !== '')) rows.push(row);
  return rows;
}

function clean(value?: string) {
  const normalized = (value || '').replace(/\s+/g, ' ').trim();
  if (!normalized || /^n\/?a$/i.test(normalized)) return null;
  return normalized;
}

function cleanGst(value?: string) {
  return clean(value)?.replace(/^gstin\s*:?\s*/i, '').replace(/^:\s*/, '').trim() || null;
}

function toVendor(row: string[]): VendorSheetRow {
  return {
    sno: row[0] || '',
    name: row[1] || '',
    contactPerson: row[2] || '',
    phone: row[3] || '',
    email: row[4] || '',
    address: row[5] || '',
    fssaiNumber: row[6] || '',
    gstNumber: row[7] || '',
    category: row[8] || '',
    productsSupplied: row[9] || '',
    paymentTerms: row[10] || '',
    purchasePerson: row[11] || '',
  };
}

async function ensureVendorTable(dataSource: DataSource) {
  await dataSource.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS vendors (
      "vendorId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "companyId" VARCHAR(100),
      "vendorCode" VARCHAR(100) UNIQUE NOT NULL,
      "vendorName" VARCHAR(255) NOT NULL,
      "contactPerson" VARCHAR(255),
      "email" VARCHAR(255),
      "phone" VARCHAR(50),
      "address" TEXT,
      "city" VARCHAR(100),
      "country" VARCHAR(100),
      "gstNumber" VARCHAR(100),
      "fssaiNumber" VARCHAR(100),
      "bankName" VARCHAR(255),
      "bankAccountNo" VARCHAR(100),
      "bankIfsc" VARCHAR(50),
      "category" VARCHAR(255),
      "productsSupplied" TEXT,
      "paymentTerms" VARCHAR(255),
      "purchasePerson" VARCHAR(255),
      "isActive" BOOLEAN DEFAULT TRUE,
      "createdAt" TIMESTAMP DEFAULT now(),
      "updatedAt" TIMESTAMP DEFAULT now(),
      "deletedAt" TIMESTAMP NULL
    )
  `);
  await dataSource.query(`
    ALTER TABLE vendors
      ADD COLUMN IF NOT EXISTS "companyId" VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "contactPerson" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "email" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "phone" VARCHAR(50),
      ADD COLUMN IF NOT EXISTS "address" TEXT,
      ADD COLUMN IF NOT EXISTS "city" VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "country" VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "gstNumber" VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "fssaiNumber" VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "bankName" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "bankAccountNo" VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "bankIfsc" VARCHAR(50),
      ADD COLUMN IF NOT EXISTS "category" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "productsSupplied" TEXT,
      ADD COLUMN IF NOT EXISTS "paymentTerms" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "purchasePerson" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT now(),
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT now(),
      ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP NULL
  `);
  await dataSource.query(`ALTER TABLE vendors ALTER COLUMN "category" TYPE VARCHAR(255)`);
  await dataSource.query(`CREATE INDEX IF NOT EXISTS idx_vendors_company ON vendors("companyId")`);
  await dataSource.query(`CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors("category")`);
}

async function importVendorMaster() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' || process.env.DATABASE_URL?.includes('sslmode=')
      ? { rejectUnauthorized: false }
      : false,
    synchronize: false,
    logging: false,
  });

  const csvUrl = process.env.VENDOR_MASTER_CSV_URL || DEFAULT_VENDOR_SHEET_CSV_URL;
  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error(`Failed to download vendor sheet: ${response.status} ${response.statusText}`);
  }

  const rows = parseCsv(await response.text());
  const vendors = rows.slice(1).map(toVendor).filter((row) => clean(row.name));
  const seenCodes = new Set<string>();

  await dataSource.initialize();
  await ensureVendorTable(dataSource);

  let imported = 0;
  for (let index = 0; index < vendors.length; index += 1) {
    const vendor = vendors[index];
    const serial = clean(vendor.sno);
    let vendorCode = serial && /^\d+$/.test(serial)
      ? `VND-${serial.padStart(3, '0')}`
      : `VND-GS-${String(index + 1).padStart(3, '0')}`;

    while (seenCodes.has(vendorCode)) {
      vendorCode = `VND-GS-${String(index + 1 + seenCodes.size).padStart(3, '0')}`;
    }
    seenCodes.add(vendorCode);

    await dataSource.query(
      `INSERT INTO vendors (
        "companyId", "vendorCode", "vendorName", "contactPerson", "email", "phone",
        "address", "country", "gstNumber", "fssaiNumber", "category",
        "productsSupplied", "paymentTerms", "purchasePerson", "isActive", "deletedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, TRUE, NULL)
      ON CONFLICT ("vendorCode") DO UPDATE SET
        "vendorName" = EXCLUDED."vendorName",
        "contactPerson" = EXCLUDED."contactPerson",
        "email" = EXCLUDED."email",
        "phone" = EXCLUDED."phone",
        "address" = EXCLUDED."address",
        "country" = EXCLUDED."country",
        "gstNumber" = EXCLUDED."gstNumber",
        "fssaiNumber" = EXCLUDED."fssaiNumber",
        "category" = EXCLUDED."category",
        "productsSupplied" = EXCLUDED."productsSupplied",
        "paymentTerms" = EXCLUDED."paymentTerms",
        "purchasePerson" = EXCLUDED."purchasePerson",
        "isActive" = TRUE,
        "deletedAt" = NULL,
        "updatedAt" = now()`,
      [
        null,
        vendorCode,
        clean(vendor.name),
        clean(vendor.contactPerson),
        clean(vendor.email),
        clean(vendor.phone),
        clean(vendor.address),
        'India',
        cleanGst(vendor.gstNumber),
        clean(vendor.fssaiNumber),
        clean(vendor.category),
        clean(vendor.productsSupplied),
        clean(vendor.paymentTerms),
        clean(vendor.purchasePerson),
      ],
    );
    imported += 1;
  }

  await dataSource.destroy();
  console.log(`Imported ${imported} vendors from Google Sheet.`);
}

importVendorMaster().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
