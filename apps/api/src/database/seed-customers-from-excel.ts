import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import * as ExcelJS from 'exceljs';
import * as path from 'path';
import * as crypto from 'crypto';

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const EXCEL_PATH = path.resolve(
  process.env.CUSTOMER_EXCEL_PATH ||
    'C:\\Users\\Krisc\\Downloads\\Customer Master Data.xlsx',
);
const BATCH_SIZE = 100;

async function seedCustomers() {
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

  let companyId: string | null = null;
  try {
    const rows: any[] = await dataSource.query(
      `SELECT company_id, COUNT(*) as cnt FROM users WHERE company_id IS NOT NULL GROUP BY company_id ORDER BY cnt DESC LIMIT 1`,
    );
    companyId = rows.length ? rows[0].company_id : null;
  } catch (_e) {
    console.log('Could not determine companyId');
  }
  console.log('Using companyId:', companyId);

  const countryMap = new Map<string, string>();
  const existingCountries: any[] = await dataSource.query(
    `SELECT id, LOWER(name) as name, LOWER(code) as code FROM countries`,
  );
  for (const c of existingCountries) {
    countryMap.set(c.name, c.id);
    if (c.code) countryMap.set(c.code, c.id);
  }

  const currencyMap = new Map<string, string>();
  const existingCurrencies: any[] = await dataSource.query(
    `SELECT id, LOWER(code) as code FROM currencies`,
  );
  for (const c of existingCurrencies) {
    currencyMap.set(c.code, c.id);
  }

  const paymentTermsMap = new Map<string, string>();
  const existingPT: any[] = await dataSource.query(
    `SELECT id, LOWER(code) as code, LOWER(name) as name FROM payment_terms`,
  );
  for (const p of existingPT) {
    paymentTermsMap.set(p.code, p.id);
    if (p.name) paymentTermsMap.set(p.name, p.id);
  }

  const userMap = new Map<string, string>();
  const users: any[] = await dataSource.query(
    `SELECT user_id, LOWER(TRIM(name)) as name FROM users WHERE is_active = true`,
  );
  for (const u of users) {
    userMap.set(u.name, u.user_id);
    const firstName = u.name.split(' ')[0];
    if (firstName) userMap.set(firstName, u.user_id);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(EXCEL_PATH);

  const allCountries = new Set<string>();
  const allCurrencies = new Set<string>();
  const allPaymentTerms = new Set<string>();

  const settingsSheet = workbook.getWorksheet('Settings');
  const countryCodeMap = new Map<string, string>();
  if (settingsSheet) {
    settingsSheet.eachRow((row, rowNum) => {
      if (rowNum === 1) return;
      const country = cellValue(row, 5);
      const code = cellValue(row, 9);
      const currency = cellValue(row, 6);
      if (country) {
        allCountries.add(country.trim());
        if (code) countryCodeMap.set(country.trim().toLowerCase(), code.trim());
      }
      if (currency) allCurrencies.add(currency.trim().toUpperCase());
    });
  }

  const dataSheets = ['Database', 'Form Responses 1', 'Sheet1'];
  for (const sheetName of dataSheets) {
    const sheet = workbook.getWorksheet(sheetName);
    if (!sheet) continue;
    sheet.eachRow((row, rowNum) => {
      if (rowNum === 1) return;
      if (sheetName === 'Database') {
        const country = cellValue(row, 3);
        const currency = cellValue(row, 19);
        const pt = cellValue(row, 20);
        if (country) allCountries.add(country.trim());
        if (currency) allCurrencies.add(currency.trim().toUpperCase());
        if (pt) allPaymentTerms.add(pt.trim().toUpperCase());
      } else {
        const country = cellValue(row, 8);
        const currency = cellValue(row, 17);
        const pt = cellValue(row, 16);
        if (country) allCountries.add(country.trim());
        if (currency) allCurrencies.add(currency.trim().toUpperCase());
        if (pt) allPaymentTerms.add(pt.trim().toUpperCase());
      }
    });
  }

  for (const name of allCountries) {
    const key = name.toLowerCase();
    if (countryMap.has(key)) continue;
    const id = crypto.randomUUID();
    const code = countryCodeMap.get(key) || name.substring(0, 3).toUpperCase();
    try {
      await dataSource.query(
        `INSERT INTO countries (id, name, code, is_active, created_at) VALUES ($1, $2, $3, true, NOW()) ON CONFLICT DO NOTHING`,
        [id, name, code],
      );
      countryMap.set(key, id);
    } catch (_e) {
      const found = await dataSource.query(
        `SELECT id FROM countries WHERE LOWER(name) = $1 LIMIT 1`,
        [key],
      );
      if (found.length) countryMap.set(key, found[0].id);
    }
  }
  console.log(`Countries: ${countryMap.size} mapped`);

  const currencyDefaults: Record<string, { name: string; symbol: string }> = {
    USD: { name: 'US Dollar', symbol: '$' },
    EUR: { name: 'Euro', symbol: '€' },
    EURO: { name: 'Euro', symbol: '€' },
    GBP: { name: 'British Pound', symbol: '£' },
    INR: { name: 'Indian Rupee', symbol: '₹' },
    AUD: { name: 'Australian Dollar', symbol: 'A$' },
    CAD: { name: 'Canadian Dollar', symbol: 'C$' },
    AED: { name: 'UAE Dirham', symbol: 'د.إ' },
    SGD: { name: 'Singapore Dollar', symbol: 'S$' },
    NZD: { name: 'New Zealand Dollar', symbol: 'NZ$' },
    MYR: { name: 'Malaysian Ringgit', symbol: 'RM' },
    JPY: { name: 'Japanese Yen', symbol: '¥' },
    ZAR: { name: 'South African Rand', symbol: 'R' },
    KRW: { name: 'South Korean Won', symbol: '₩' },
  };
  for (const code of allCurrencies) {
    const key = code.toLowerCase();
    if (currencyMap.has(key)) continue;
    const normalizedKey = key === 'euro' ? 'eur' : key;
    if (currencyMap.has(normalizedKey)) {
      currencyMap.set(key, currencyMap.get(normalizedKey)!);
      continue;
    }
    const id = crypto.randomUUID();
    const def = currencyDefaults[code] || { name: code, symbol: code };
    const dbCode = code === 'EURO' ? 'EUR' : code;
    try {
      await dataSource.query(
        `INSERT INTO currencies (id, code, name, symbol, decimal_places, is_active, is_base, created_at)
         VALUES ($1, $2, $3, $4, 2, true, $5, NOW()) ON CONFLICT DO NOTHING`,
        [id, dbCode, def.name, def.symbol, dbCode === 'INR'],
      );
      currencyMap.set(key, id);
      currencyMap.set(normalizedKey, id);
    } catch (_e) {
      const found = await dataSource.query(
        `SELECT id FROM currencies WHERE LOWER(code) = $1 LIMIT 1`,
        [normalizedKey],
      );
      if (found.length) {
        currencyMap.set(key, found[0].id);
        currencyMap.set(normalizedKey, found[0].id);
      }
    }
  }
  console.log(`Currencies: ${currencyMap.size} mapped`);

  for (const code of allPaymentTerms) {
    const key = code.toLowerCase();
    if (paymentTermsMap.has(key)) continue;
    const id = crypto.randomUUID();
    try {
      await dataSource.query(
        `INSERT INTO payment_terms (id, company_id, code, name, days, is_active, created_at)
         VALUES ($1, $2, $3, $4, 0, true, NOW()) ON CONFLICT DO NOTHING`,
        [id, companyId, code, code],
      );
      paymentTermsMap.set(key, id);
    } catch (_e) {
      const found = await dataSource.query(
        `SELECT id FROM payment_terms WHERE LOWER(code) = $1 LIMIT 1`,
        [key],
      );
      if (found.length) paymentTermsMap.set(key, found[0].id);
    }
  }
  console.log(`Payment Terms: ${paymentTermsMap.size} mapped`);

  const seenBuyerCodes = new Set<string>();

  const dbSheet = workbook.getWorksheet('Database');
  if (dbSheet) {
    console.log(`\nProcessing: Database (${dbSheet.rowCount - 1} rows)`);
    const rows: any[] = [];
    dbSheet.eachRow((row, rowNum) => {
      if (rowNum === 1) return;
      const buyerCode = cellValue(row, 2);
      if (!buyerCode) return;
      rows.push({
        buyerCode: buyerCode.trim(),
        country: cellValue(row, 3),
        customerName: cellValue(row, 4),
        contactPerson: cellValue(row, 5),
        contactNumber: cellValue(row, 6),
        email: cellValue(row, 7),
        deliveryAddress: cellValue(row, 8),
        deliveryCity: cellValue(row, 9),
        deliveryState: cellValue(row, 10),
        deliveryPincode: cellValue(row, 11),
        billingAddress: cellValue(row, 12),
        billingCity: cellValue(row, 13),
        billingState: cellValue(row, 14),
        billingPincode: cellValue(row, 15),
        pod: cellValue(row, 16),
        portOfLoading: cellValue(row, 17),
        currency: cellValue(row, 19),
        paymentTerms: cellValue(row, 20),
        priority: cellValue(row, 21),
        salesPerson: cellValue(row, 22),
        city: null,
        state: null,
        pinCode: null,
        productZone: null,
      });
    });
    await importRows(dataSource, rows, companyId, countryMap, currencyMap, paymentTermsMap, userMap, seenBuyerCodes);
  }

  for (const sheetName of ['Form Responses 1', 'Sheet1']) {
    const sheet = workbook.getWorksheet(sheetName);
    if (!sheet) continue;
    console.log(`\nProcessing: ${sheetName} (${sheet.rowCount - 1} rows)`);
    const rows: any[] = [];
    sheet.eachRow((row, rowNum) => {
      if (rowNum === 1) return;
      const buyerCode = cellValue(row, 14);
      if (!buyerCode) return;
      rows.push({
        buyerCode: buyerCode.trim(),
        customerName: cellValue(row, 2),
        city: cellValue(row, 3),
        contactNumber: cellValue(row, 4),
        email: cellValue(row, 5),
        state: cellValue(row, 6),
        contactPerson: cellValue(row, 7),
        country: cellValue(row, 8),
        billingAddress: cellValue(row, 9),
        pinCode: cellValue(row, 10),
        deliveryAddress: cellValue(row, 11),
        productZone: cellValue(row, 12),
        pod: cellValue(row, 13),
        salesPerson: cellValue(row, 15),
        paymentTerms: cellValue(row, 16),
        currency: cellValue(row, 17),
        portOfLoading: cellValue(row, 18),
        deliveryCity: null,
        deliveryState: null,
        deliveryPincode: null,
        billingCity: null,
        billingState: null,
        billingPincode: null,
        priority: null,
      });
    });
    await importRows(dataSource, rows, companyId, countryMap, currencyMap, paymentTermsMap, userMap, seenBuyerCodes);
  }

  const finalCount = await dataSource.query(`SELECT COUNT(*) as cnt FROM customers`);
  console.log('\n=== IMPORT COMPLETE ===');
  console.log(`  Unique buyer codes: ${seenBuyerCodes.size}`);
  console.log(`  Total customers in DB: ${finalCount[0].cnt}`);

  await dataSource.destroy();
}

async function importRows(
  ds: DataSource,
  rows: any[],
  companyId: string | null,
  countryMap: Map<string, string>,
  currencyMap: Map<string, string>,
  paymentTermsMap: Map<string, string>,
  userMap: Map<string, string>,
  seenBuyerCodes: Set<string>,
) {
  let processed = 0;
  let errors = 0;
  for (const r of rows) {
    if (seenBuyerCodes.has(r.buyerCode)) {
      processed++;
      continue;
    }
    seenBuyerCodes.add(r.buyerCode);

    try {
      const countryId = r.country
        ? countryMap.get(r.country.trim().toLowerCase()) || null
        : null;

      let currencyId: string | null = null;
      if (r.currency) {
        const ck = r.currency.trim().toLowerCase();
        currencyId = currencyMap.get(ck) || null;
      }

      let paymentTermsId: string | null = null;
      if (r.paymentTerms) {
        const pk = r.paymentTerms.trim().toLowerCase();
        paymentTermsId = paymentTermsMap.get(pk) || null;
      }

      let salesPersonId: string | null = null;
      if (r.salesPerson) {
        const sp = r.salesPerson.trim().toLowerCase();
        salesPersonId = userMap.get(sp) || null;
        if (!salesPersonId) {
          const firstName = sp.split(' ')[0];
          salesPersonId = userMap.get(firstName) || null;
        }
      }

      const customerName = r.customerName
        ? r.customerName.trim().replace(/\t/g, ' ').replace(/\s+/g, ' ')
        : r.buyerCode;

      const customerType = r.country
        ? (r.country.trim().toLowerCase() === 'india' ? 'domestic' : 'export')
        : null;

      let customerCategory: string | null = null;
      if (r.priority) {
        const p = r.priority.trim().toLowerCase();
        if (p.includes('high')) customerCategory = 'key_account';
        else if (p.includes('medium') || p.includes('regular')) customerCategory = 'A';
      }

      await ds.query(
        `INSERT INTO customers (
          customer_id, company_id, buyer_code, customer_name,
          contact_person, contact_number, email,
          customer_type, customer_category, status,
          country_id, state, city, pin_code,
          billing_address, billing_city, billing_state, billing_pincode,
          delivery_address, delivery_city, delivery_state, delivery_pincode,
          product_zone, pod, port_of_loading,
          payment_terms_id, currency_id, sales_person_id,
          shipping_terms,
          is_active, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7,
          $8, $9, 'active',
          $10, $11, $12, $13,
          $14, $15, $16, $17,
          $18, $19, $20, $21,
          $22, $23, $24,
          $25, $26, $27,
          $28,
          true, NOW(), NOW()
        )
        ON CONFLICT (buyer_code) DO UPDATE SET
          customer_name = COALESCE(EXCLUDED.customer_name, customers.customer_name),
          contact_person = COALESCE(EXCLUDED.contact_person, customers.contact_person),
          contact_number = COALESCE(EXCLUDED.contact_number, customers.contact_number),
          email = COALESCE(EXCLUDED.email, customers.email),
          customer_type = COALESCE(EXCLUDED.customer_type, customers.customer_type),
          customer_category = COALESCE(EXCLUDED.customer_category, customers.customer_category),
          country_id = COALESCE(EXCLUDED.country_id, customers.country_id),
          state = COALESCE(EXCLUDED.state, customers.state),
          city = COALESCE(EXCLUDED.city, customers.city),
          pin_code = COALESCE(EXCLUDED.pin_code, customers.pin_code),
          billing_address = COALESCE(EXCLUDED.billing_address, customers.billing_address),
          billing_city = COALESCE(EXCLUDED.billing_city, customers.billing_city),
          billing_state = COALESCE(EXCLUDED.billing_state, customers.billing_state),
          billing_pincode = COALESCE(EXCLUDED.billing_pincode, customers.billing_pincode),
          delivery_address = COALESCE(EXCLUDED.delivery_address, customers.delivery_address),
          delivery_city = COALESCE(EXCLUDED.delivery_city, customers.delivery_city),
          delivery_state = COALESCE(EXCLUDED.delivery_state, customers.delivery_state),
          delivery_pincode = COALESCE(EXCLUDED.delivery_pincode, customers.delivery_pincode),
          product_zone = COALESCE(EXCLUDED.product_zone, customers.product_zone),
          pod = COALESCE(EXCLUDED.pod, customers.pod),
          port_of_loading = COALESCE(EXCLUDED.port_of_loading, customers.port_of_loading),
          payment_terms_id = COALESCE(EXCLUDED.payment_terms_id, customers.payment_terms_id),
          currency_id = COALESCE(EXCLUDED.currency_id, customers.currency_id),
          sales_person_id = COALESCE(EXCLUDED.sales_person_id, customers.sales_person_id),
          updated_at = NOW()`,
        [
          crypto.randomUUID(),
          companyId,
          r.buyerCode,
          customerName,
          r.contactPerson ? r.contactPerson.trim() : null,
          r.contactNumber ? String(r.contactNumber).trim() : null,
          r.email ? r.email.trim() : null,
          customerType,
          customerCategory,
          countryId,
          r.state ? r.state.trim() : null,
          r.city ? r.city.trim() : null,
          r.pinCode ? String(r.pinCode).trim() : null,
          r.billingAddress ? r.billingAddress.trim() : null,
          r.billingCity ? r.billingCity.trim() : null,
          r.billingState ? r.billingState.trim() : null,
          r.billingPincode ? String(r.billingPincode).trim() : null,
          r.deliveryAddress ? r.deliveryAddress.trim() : null,
          r.deliveryCity ? r.deliveryCity.trim() : null,
          r.deliveryState ? r.deliveryState.trim() : null,
          r.deliveryPincode ? String(r.deliveryPincode).trim() : null,
          r.productZone ? r.productZone.trim() : null,
          r.pod ? r.pod.trim() : null,
          r.portOfLoading ? r.portOfLoading.trim() : null,
          paymentTermsId,
          currencyId,
          salesPersonId,
          r.paymentTerms ? r.paymentTerms.trim() : null,
        ],
      );
      processed++;
    } catch (e: any) {
      errors++;
      if (errors <= 5) {
        console.error(`  Error ${r.buyerCode}: ${e.message?.substring(0, 120)}`);
      }
      processed++;
    }
  }
  console.log(`  Done: ${processed} processed, ${errors} errors`);
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

seedCustomers().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
