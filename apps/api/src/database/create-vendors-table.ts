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

  // Create table
  await ds.query(`
    CREATE TABLE IF NOT EXISTS vendors (
      "vendorId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "vendorCode" VARCHAR(100) UNIQUE NOT NULL,
      "vendorName" VARCHAR(255) NOT NULL,
      "contactPerson" VARCHAR(255),
      "contactPersonNo" VARCHAR(100),
      "email" VARCHAR(255),
      "phone" VARCHAR(100),
      "mobile" VARCHAR(100),
      "address" TEXT,
      "city" VARCHAR(255),
      "state" VARCHAR(255),
      "country" VARCHAR(255),
      "pincode" VARCHAR(20),
      "bankName" VARCHAR(255),
      "bankAccountNo" VARCHAR(255),
      "bankIfsc" VARCHAR(100),
      "gstNumber" VARCHAR(100),
      "panNumber" VARCHAR(100),
      "IECode" VARCHAR(100),
      "paymentTermsId" VARCHAR(100),
      "isActive" BOOLEAN DEFAULT true,
      "rating" INTEGER DEFAULT 0,
      "category" VARCHAR(255),
      "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Vendors table created successfully!');

  // Seed sample vendors
  const uuid = () => require('crypto').randomUUID();
  const now = new Date();
  const vendors = [
    { code: 'VND001', name: 'ABC Suppliers', person: 'Ravi Kumar', email: 'ravi@abcsuppliers.com', phone: '+91 9988776655', category: 'Food Products' },
    { code: 'VND002', name: 'XYZ Trading Co', person: 'Meera Joshi', email: 'meera@xyztrading.com', phone: '+91 9988776656', category: 'Beverages' },
    { code: 'VND003', name: 'Global Imports', person: 'Suresh Nair', email: 'suresh@globalimports.com', phone: '+91 9988776657', category: 'Snacks' },
    { code: 'VND004', name: 'Prime Distributors', person: 'Anita Gupta', email: 'anita@primedist.com', phone: '+91 9988776658', category: 'Cleaning' },
    { code: 'VND005', name: 'Nature Harvest', person: 'Kiran Rao', email: 'kiran@natureharvest.com', phone: '+91 9988776659', category: 'Organic' },
  ];

  for (const v of vendors) {
    try {
      await ds.query(`
        INSERT INTO vendors (
          "vendorId", "vendorCode", "vendorName", "contactPerson", "email", "phone", "category", "isActive", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $9)
        ON CONFLICT ("vendorCode") DO NOTHING
      `, [uuid(), v.code, v.name, v.person, v.email, v.phone, v.category, now, now]);
    } catch (e: any) {
      console.log(`Seeding error for ${v.name}: ${e.message}`);
    }
  }
  console.log('Sample vendors seeded successfully!');

  await ds.destroy();
}

migrate().catch(console.error);
