import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';

dotenv.config({ path: '.env' });
dotenv.config({ path: 'apps/api/.env' });

type PackingSheetRow = {
  sku: string;
  timestamp: string;
  location: string;
  productType: string;
  productDescription: string;
  unitType: string;
  uom: string;
  packingSize: string;
  cbm: string;
  category: string;
  purchasePerson: string;
  brand: string;
  caseNo: string;
  aliasName: string;
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

function toNumber(value?: string) {
  const cleaned = clean(value);
  if (!cleaned) return null;
  const number = Number(cleaned.replace(/[%,$]/g, ''));
  return Number.isFinite(number) ? number : null;
}

function clip(value: string | null, max: number) {
  if (!value) return null;
  return value.length > max ? value.slice(0, max) : value;
}

function headerIndex(headers: string[]) {
  return new Map(headers.map((header, index) => [header.trim().toLowerCase(), index]));
}

function get(row: string[], indexes: Map<string, number>, header: string) {
  const index = indexes.get(header.toLowerCase());
  return index === undefined ? '' : row[index] || '';
}

function toPackingRow(row: string[], indexes: Map<string, number>): PackingSheetRow {
  return {
    sku: get(row, indexes, 'SKU'),
    timestamp: get(row, indexes, 'Timestamp'),
    location: get(row, indexes, 'Location'),
    productType: get(row, indexes, 'Product Type'),
    productDescription: get(row, indexes, 'Product Description'),
    unitType: get(row, indexes, 'Unit Type'),
    uom: get(row, indexes, 'Unit (Per Pc / Per Kg)'),
    packingSize: get(row, indexes, 'Packing Size'),
    cbm: get(row, indexes, 'CBM'),
    category: get(row, indexes, 'Category'),
    purchasePerson: get(row, indexes, 'Purchase Person'),
    brand: get(row, indexes, 'Brand'),
    caseNo: get(row, indexes, 'Case No'),
    aliasName: get(row, indexes, 'alias name'),
  };
}

async function readSourceCsv() {
  if (process.env.PACKING_MASTER_CSV_URL) {
    const response = await fetch(process.env.PACKING_MASTER_CSV_URL);
    if (!response.ok) {
      throw new Error(`Failed to download packing sheet: ${response.status} ${response.statusText}`);
    }
    return response.text();
  }

  const repoRoot = path.resolve(__dirname, '../../../..');
  const configuredPath = process.env.PACKING_MASTER_CSV_PATH;
  const candidates = [
    configuredPath,
    path.resolve(process.cwd(), 'scratch/form_responses.csv'),
    path.resolve(process.cwd(), '../../scratch/form_responses.csv'),
    path.resolve(repoRoot, 'scratch/form_responses.csv'),
  ].filter(Boolean) as string[];

  const csvPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!csvPath) {
    throw new Error('Packing CSV not found. Set PACKING_MASTER_CSV_PATH or PACKING_MASTER_CSV_URL.');
  }
  return fs.readFileSync(csvPath, 'utf8');
}

async function ensurePackingTable(dataSource: DataSource) {
  await dataSource.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS packing_master (
      "packingId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "companyId" VARCHAR(100),
      "packingCode" VARCHAR(160) UNIQUE NOT NULL,
      "packingName" VARCHAR(255) NOT NULL,
      "packingType" VARCHAR(100),
      "material" VARCHAR(255),
      "unitSize" VARCHAR(100),
      "unitsPerCase" NUMERIC(18, 3),
      "cbmPerBox" NUMERIC(18, 4),
      "weightKg" NUMERIC(18, 3),
      "dimensions" VARCHAR(255),
      "uom" VARCHAR(50),
      "size" VARCHAR(100),
      "purchasePersonName" VARCHAR(255),
      "vendorName" VARCHAR(255),
      "notes" TEXT,
      "isActive" BOOLEAN DEFAULT TRUE,
      "createdAt" TIMESTAMP DEFAULT now(),
      "updatedAt" TIMESTAMP DEFAULT now(),
      "deletedAt" TIMESTAMP NULL
    )
  `);
  await dataSource.query(`
    ALTER TABLE packing_master
      ALTER COLUMN "packingCode" TYPE VARCHAR(160),
      ADD COLUMN IF NOT EXISTS "companyId" VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "packingType" VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "material" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "unitSize" VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "unitsPerCase" NUMERIC(18, 3),
      ADD COLUMN IF NOT EXISTS "cbmPerBox" NUMERIC(18, 4),
      ADD COLUMN IF NOT EXISTS "weightKg" NUMERIC(18, 3),
      ADD COLUMN IF NOT EXISTS "dimensions" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "uom" VARCHAR(50),
      ADD COLUMN IF NOT EXISTS "size" VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "purchasePersonName" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "vendorName" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "notes" TEXT,
      ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT now(),
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT now(),
      ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP NULL
  `);
  await dataSource.query(`CREATE INDEX IF NOT EXISTS idx_packing_master_company ON packing_master("companyId")`);
  await dataSource.query(`CREATE INDEX IF NOT EXISTS idx_packing_master_type ON packing_master("packingType")`);
}

async function importPackingMaster() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' || process.env.DATABASE_URL?.includes('sslmode=')
      ? { rejectUnauthorized: false }
      : false,
    synchronize: false,
    logging: false,
  });

  const rows = parseCsv(await readSourceCsv());
  const indexes = headerIndex(rows[0] || []);
  const packingRows = rows
    .slice(1)
    .map((row) => toPackingRow(row, indexes))
    .filter((row) => clean(row.sku) && clean(row.productDescription));

  await dataSource.initialize();
  await ensurePackingTable(dataSource);

  await dataSource.query(`
    UPDATE packing_master
    SET "deletedAt" = now(), "isActive" = FALSE, "updatedAt" = now()
    WHERE "packingCode" IN ('PKG-001', 'PKG-002', 'PKG-003')
      AND "packingName" IN ('Standard 12 Pcs Carton', 'Standard 24 Pcs Carton', 'Tin 12 Pcs Carton')
      AND "deletedAt" IS NULL
  `);

  const importRows = packingRows.map((packing) => {
    const notes = [
      clean(packing.productType) ? `Product Type: ${clean(packing.productType)}` : null,
      clean(packing.location) ? `Location: ${clean(packing.location)}` : null,
      clean(packing.category) ? `Category: ${clean(packing.category)}` : null,
      clean(packing.brand) ? `Brand: ${clean(packing.brand)}` : null,
      clean(packing.purchasePerson) ? `Purchase Person: ${clean(packing.purchasePerson)}` : null,
      clean(packing.caseNo) ? `Case No: ${clean(packing.caseNo)}` : null,
      clean(packing.timestamp) ? `Sheet Timestamp: ${clean(packing.timestamp)}` : null,
    ].filter(Boolean).join(' | ');

    return {
      companyId: null,
      packingCode: clean(packing.sku),
      packingName: clip(clean(packing.productDescription) || clean(packing.aliasName), 255),
      packingType: clip(clean(packing.category), 100),
      material: clip(clean(packing.aliasName), 255),
      unitSize: clip(clean(packing.unitType), 100),
      unitsPerCase: toNumber(packing.packingSize),
      cbmPerBox: toNumber(packing.cbm),
      uom: clip(clean(packing.uom), 50),
      size: null,
      purchasePersonName: clip(clean(packing.purchasePerson), 255),
      vendorName: clip(clean(packing.brand), 255),
      notes: notes || null,
    };
  });

  let imported = 0;
  for (let offset = 0; offset < importRows.length; offset += 500) {
    const batch = importRows.slice(offset, offset + 500);
    await dataSource.query(
      `INSERT INTO packing_master (
        "companyId", "packingCode", "packingName", "packingType", "material",
        "unitSize", "unitsPerCase", "cbmPerBox", "uom", "size",
        "purchasePersonName", "vendorName", "notes",
        "isActive", "deletedAt"
      )
      SELECT
        x."companyId", x."packingCode", x."packingName", x."packingType", x."material",
        x."unitSize", x."unitsPerCase", x."cbmPerBox", x."uom", x."size",
        x."purchasePersonName", x."vendorName", x."notes",
        TRUE, NULL
      FROM jsonb_to_recordset($1::jsonb) AS x(
        "companyId" text,
        "packingCode" text,
        "packingName" text,
        "packingType" text,
        "material" text,
        "unitSize" text,
        "unitsPerCase" numeric,
        "cbmPerBox" numeric,
        "uom" text,
        "size" text,
        "purchasePersonName" text,
        "vendorName" text,
        "notes" text
      )
      ON CONFLICT ("packingCode") DO UPDATE SET
        "packingName" = EXCLUDED."packingName",
        "packingType" = EXCLUDED."packingType",
        "material" = EXCLUDED."material",
        "unitSize" = EXCLUDED."unitSize",
        "unitsPerCase" = EXCLUDED."unitsPerCase",
        "cbmPerBox" = EXCLUDED."cbmPerBox",
        "uom" = EXCLUDED."uom",
        "size" = EXCLUDED."size",
        "purchasePersonName" = EXCLUDED."purchasePersonName",
        "vendorName" = EXCLUDED."vendorName",
        "notes" = EXCLUDED."notes",
        "isActive" = TRUE,
        "deletedAt" = NULL,
        "updatedAt" = now()`,
      [JSON.stringify(batch)],
    );
    imported += batch.length;
  }

  await dataSource.destroy();
  console.log(`Imported ${imported} packing records from sheet data.`);
}

importPackingMaster().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
