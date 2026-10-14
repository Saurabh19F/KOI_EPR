-- Masters listed in the KOI Google Sheet index.
-- Safe to run multiple times.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
);

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
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP NULL;

ALTER TABLE vendors ALTER COLUMN "category" TYPE VARCHAR(255);

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
);

CREATE INDEX IF NOT EXISTS idx_vendors_company ON vendors("companyId");
CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors("category");
CREATE INDEX IF NOT EXISTS idx_packing_master_company ON packing_master("companyId");
CREATE INDEX IF NOT EXISTS idx_packing_master_type ON packing_master("packingType");
