import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import * as ExcelJS from 'exceljs';
import * as path from 'path';
import * as crypto from 'crypto';

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const EXCEL_PATH = path.resolve(
  process.env.EXCEL_PATH ||
    'C:\\Users\\Krisc\\Downloads\\Product Master (Responses).xlsx',
);
const SHEET_NAME = 'Form Responses 1';
const BATCH_SIZE = 200;

async function seedProducts() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : false,
    synchronize: false,
    logging: false,
  });

  await dataSource.initialize();
  console.log('Connected to database...\n');

  // Pre-load lookup tables
  const gstRows: any[] = await dataSource.query(
    `SELECT gst_rate_id, gst_percent FROM gst_rates WHERE is_active = true`,
  );
  const gstMap = new Map<number, string>();
  for (const g of gstRows) {
    gstMap.set(Number(g.gst_percent), g.gst_rate_id);
  }

  const brandRows: any[] = await dataSource.query(
    `SELECT brand_id, brand_name FROM brands WHERE is_active = true`,
  );
  const brandMap = new Map<string, string>();
  for (const b of brandRows) {
    brandMap.set(b.brand_name.toLowerCase().trim(), b.brand_id);
  }

  const locationRows: any[] = await dataSource.query(
    `SELECT id, name, city FROM locations`,
  );
  const locationMap = new Map<string, string>();
  for (const l of locationRows) {
    if (l.city) locationMap.set(l.city.toLowerCase().trim(), l.id);
    if (l.name) locationMap.set(l.name.toLowerCase().trim(), l.id);
  }

  // Fetch default companyId — use the company most users belong to
  let defaultCompanyId: string | null = null;
  try {
    const companyRows: any[] = await dataSource.query(
      `SELECT company_id, COUNT(*) as cnt FROM users WHERE company_id IS NOT NULL GROUP BY company_id ORDER BY cnt DESC LIMIT 1`,
    );
    defaultCompanyId = companyRows.length ? companyRows[0].company_id : null;
  } catch (_e) {
    console.log('Could not determine companyId from users — skipping');
  }

  // Read Excel
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(EXCEL_PATH);
  const sheet = workbook.getWorksheet(SHEET_NAME);
  if (!sheet) {
    console.error(`Sheet "${SHEET_NAME}" not found`);
    process.exit(1);
  }

  console.log(`Reading sheet: ${sheet.name} (${sheet.rowCount} rows)\n`);

  let inserted = 0;
  let errors = 0;

  const rows: any[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const sku = cellValue(row, 1);
    if (!sku) return;

    rows.push({
      rowNumber,
      sku: String(sku).trim(),
      location: cellValue(row, 3),
      productType: cellValue(row, 4),
      productName: cellValue(row, 5),
      unitSize: cellValue(row, 6),
      packingSize: numValue(row, 7),
      mrp: numValue(row, 8),
      gst: numValue(row, 9),
      cbm: numValue(row, 10),
      buyingPrice: numValue(row, 11),
      category: cellValue(row, 12),
      purchasePerson: cellValue(row, 13),
      brand: cellValue(row, 14),
      unitBasis: cellValue(row, 15),
      caseNo: cellValue(row, 16),
      formEditUrl: cellValue(row, 17),
      template1SendStatus: cellValue(row, 18),
      conversionRatio: numValue(row, 19),
      aliasName: cellValue(row, 23),
      categoryType: cellValue(row, 24),
    });
  });

  console.log(`Parsed ${rows.length} product rows from Excel\n`);

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(rows.length / BATCH_SIZE);

    for (const r of batch) {
      try {
        let gstRateId: string | null = null;
        if (r.gst !== null && r.gst !== undefined) {
          const gstPercent = r.gst < 1 ? Math.round(r.gst * 100) : Math.round(r.gst);
          gstRateId = gstMap.get(gstPercent) || null;
        }

        let brandId: string | null = null;
        if (r.brand) {
          const brandKey = String(r.brand).toLowerCase().trim();
          brandId = brandMap.get(brandKey) || null;
          if (!brandId && brandKey) {
            const newId = crypto.randomUUID();
            try {
              await dataSource.query(
                `INSERT INTO brands (brand_id, brand_name, brand_code, is_active, created_at)
                 VALUES ($1, $2, $3, true, NOW())
                 ON CONFLICT (brand_name) DO NOTHING`,
                [newId, String(r.brand).trim(), String(r.brand).trim().substring(0, 10).toUpperCase()],
              );
              const found = await dataSource.query(
                `SELECT brand_id FROM brands WHERE LOWER(TRIM(brand_name)) = $1 LIMIT 1`,
                [brandKey],
              );
              if (found.length) {
                brandId = found[0].brand_id;
                brandMap.set(brandKey, brandId!);
              }
            } catch (_e) {
              // ignore brand creation errors
            }
          }
        }

        let locationId: string | null = null;
        if (r.location) {
          const locKey = String(r.location).toLowerCase().trim();
          locationId = locationMap.get(locKey) || null;
        }

        let unitBasis: string | null = null;
        if (r.unitBasis) {
          const ub = String(r.unitBasis).toLowerCase().trim();
          if (ub.includes('kg')) unitBasis = 'per_kg';
          else if (ub.includes('pc') || ub.includes('piece')) unitBasis = 'per_pc';
        }

        const productName = r.productName || r.productType || r.sku;

        await dataSource.query(
          `INSERT INTO products (
            product_id, sku, product_code, product_name, description,
            product_type, unit_size, packing_size, mrp, gst_rate_id,
            cbm_per_box, buying_price, brand_id, unit_basis,
            case_no, form_edit_url, template1_send_status,
            conversion_ratio, alias_name, location_id,
            purchase_person_name, company_id,
            is_active, product_status, source, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12, $13, $14,
            $15, $16, $17,
            $18, $19, $20,
            $21, $22,
            true, 'active', 'master', NOW(), NOW()
          )
          ON CONFLICT (sku) DO UPDATE SET
            product_name = COALESCE(EXCLUDED.product_name, products.product_name),
            description = COALESCE(EXCLUDED.description, products.description),
            product_type = COALESCE(EXCLUDED.product_type, products.product_type),
            unit_size = COALESCE(EXCLUDED.unit_size, products.unit_size),
            packing_size = COALESCE(EXCLUDED.packing_size, products.packing_size),
            mrp = COALESCE(EXCLUDED.mrp, products.mrp),
            gst_rate_id = COALESCE(EXCLUDED.gst_rate_id, products.gst_rate_id),
            cbm_per_box = COALESCE(EXCLUDED.cbm_per_box, products.cbm_per_box),
            buying_price = COALESCE(EXCLUDED.buying_price, products.buying_price),
            brand_id = COALESCE(EXCLUDED.brand_id, products.brand_id),
            unit_basis = COALESCE(EXCLUDED.unit_basis, products.unit_basis),
            case_no = COALESCE(EXCLUDED.case_no, products.case_no),
            form_edit_url = COALESCE(EXCLUDED.form_edit_url, products.form_edit_url),
            template1_send_status = COALESCE(EXCLUDED.template1_send_status, products.template1_send_status),
            conversion_ratio = COALESCE(EXCLUDED.conversion_ratio, products.conversion_ratio),
            alias_name = COALESCE(EXCLUDED.alias_name, products.alias_name),
            location_id = COALESCE(EXCLUDED.location_id, products.location_id),
            purchase_person_name = COALESCE(EXCLUDED.purchase_person_name, products.purchase_person_name),
            updated_at = NOW()`,
          [
            crypto.randomUUID(),
            r.sku,
            r.sku,
            productName,
            r.productName || null,
            r.productType || null,
            r.unitSize || null,
            r.packingSize || null,
            r.mrp || null,
            gstRateId,
            r.cbm || null,
            r.buyingPrice || null,
            brandId,
            unitBasis,
            r.caseNo ? String(r.caseNo) : null,
            r.formEditUrl || null,
            r.template1SendStatus || null,
            r.conversionRatio || null,
            r.aliasName || null,
            locationId,
            r.purchasePerson || null,
            defaultCompanyId,
          ],
        );

        inserted++;
      } catch (e: any) {
        errors++;
        if (errors <= 10) {
          console.error(`Row ${r.rowNumber} (${r.sku}): ${e.message?.substring(0, 80)}`);
        }
      }
    }

    process.stdout.write(
      `\rBatch ${batchNum}/${totalBatches} — processed: ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`,
    );
  }

  console.log('\n');
  console.log('=== IMPORT COMPLETE ===');
  console.log(`  Inserted/Updated: ${inserted}`);
  console.log(`  Errors:           ${errors}`);

  const countResult = await dataSource.query(`SELECT COUNT(*) as cnt FROM products`);
  console.log(`  Total products in DB: ${countResult[0].cnt}`);

  await dataSource.destroy();
}

function cellValue(row: ExcelJS.Row, col: number): string | null {
  const cell = row.getCell(col);
  let val = cell.value;
  if (val === null || val === undefined) return null;
  if (typeof val === 'object') {
    if ('result' in val) val = (val as any).result;
    else if ('text' in val) val = (val as any).text;
    else if (val instanceof Date) return val.toISOString();
    else return String(val);
  }
  const s = String(val).trim();
  return s === '' ? null : s;
}

function numValue(row: ExcelJS.Row, col: number): number | null {
  const raw = cellValue(row, col);
  if (raw === null) return null;
  const n = parseFloat(raw);
  return isNaN(n) ? null : n;
}

seedProducts().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
