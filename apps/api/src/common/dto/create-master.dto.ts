import { IsString, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'Premium Widget' })
  @IsString()
  productName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  segmentId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  groupId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  uomId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  gstRateId?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber()
  @IsOptional()
  cbmPerBox?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber()
  @IsOptional()
  unitsPerCase?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber()
  @IsOptional()
  totalCbm?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dimensions?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  hsCode?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber()
  @IsOptional()
  standardCost?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  unitBasis?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  packingSize?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber()
  @IsOptional()
  mrp?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber()
  @IsOptional()
  buyingPrice?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber()
  @IsOptional()
  landingCost?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber()
  @IsOptional()
  lastPurchaseRate?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  stockStatus?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber()
  @IsOptional()
  currentStock?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber()
  @IsOptional()
  reorderLevel?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber()
  @IsOptional()
  maxStockLevel?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber()
  @IsOptional()
  safetyStock?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber()
  @IsOptional()
  minOrderQty?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber()
  @IsOptional()
  maxOrderQty?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber()
  @IsOptional()
  slowMovingDays?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber()
  @IsOptional()
  deadStockDays?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber()
  @IsOptional()
  damagedQty?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  locationId?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber()
  @IsOptional()
  leadTimeDays?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  materialType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  countryOfOrigin?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  hsnCode?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber()
  @IsOptional()
  conversionRatio?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isDiscontinued?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  unitSize?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  caseNo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  aliasName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  purchasePersonId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  purchasePersonName?: string;
}

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  segmentId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  groupId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  uomId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  gstRateId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  standardCost?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isDiscontinued?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dimensions?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  hsCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  unitBasis?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  packingSize?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  mrp?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  buyingPrice?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  landingCost?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  lastPurchaseRate?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  stockStatus?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  currentStock?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  reorderLevel?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  maxStockLevel?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  safetyStock?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  minOrderQty?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  maxOrderQty?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  slowMovingDays?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  deadStockDays?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  damagedQty?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  locationId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  leadTimeDays?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  materialType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  countryOfOrigin?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  hsnCode?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  conversionRatio?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  unitSize?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  caseNo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  aliasName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  purchasePersonId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  purchasePersonName?: string;
}

export class CreateCustomerDto {
  @ApiProperty({ example: 'ABC Corporation' })
  @IsString()
  customerName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  buyerCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerCategory?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contactNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  mobile?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  alternateContact?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  alternateEmail?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  whatsappNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  countryId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  billingCountry?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  billingAddress?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  billingCity?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  billingState?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  billingPincode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pinCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deliveryAddress?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deliveryCity?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deliveryState?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deliveryCountry?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deliveryPincode?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isBillingSameAsDelivery?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productZone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  zone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pod?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  salesPersonId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  paymentTermsId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  currencyId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  portOfLoading?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber()
  @IsOptional()
  creditLimit?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber()
  @IsOptional()
  creditDays?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber()
  @IsOptional()
  openingBalance?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  gstNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  panNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tinNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ieCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  shippingTerms?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  incoterms?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  buyerCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerCategory?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contactNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  mobile?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  alternateContact?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  alternateEmail?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  whatsappNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  countryId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  billingCountry?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  billingAddress?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  billingCity?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  billingState?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  billingPincode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pinCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deliveryAddress?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deliveryCity?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deliveryState?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deliveryCountry?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deliveryPincode?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isBillingSameAsDelivery?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productZone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  zone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pod?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  salesPersonId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  paymentTermsId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  currencyId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  portOfLoading?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber()
  @IsOptional()
  creditLimit?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber()
  @IsOptional()
  creditDays?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber()
  @IsOptional()
  openingBalance?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  gstNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  panNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tinNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ieCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  shippingTerms?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  incoterms?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isBlacklisted?: boolean;
}

export class CreateVendorDto {
  @ApiProperty({ example: 'XYZ Suppliers' })
  @IsString()
  vendorName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  gstNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fssaiNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bankAccountNo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bankIfsc?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productCategory?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productsSupplied?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  purchasePerson?: string;
}

export class UpdateVendorDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vendorName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  gstNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fssaiNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bankAccountNo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bankIfsc?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productCategory?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productsSupplied?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  purchasePerson?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreatePackingDto {
  @ApiPropertyOptional({ example: 'PKG-001' })
  @IsString()
  @IsOptional()
  packingCode?: string;

  @ApiProperty({ example: '12 Bottle Carton' })
  @IsString()
  packingName: string;

  @ApiPropertyOptional({ example: 'carton' })
  @IsString()
  @IsOptional()
  packingType?: string;

  @ApiPropertyOptional({ example: 'Corrugated box' })
  @IsString()
  @IsOptional()
  material?: string;

  @ApiPropertyOptional({ example: '200g' })
  @IsString()
  @IsOptional()
  unitSize?: string;

  @ApiPropertyOptional({ example: 12 })
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber()
  @IsOptional()
  unitsPerCase?: number;

  @ApiPropertyOptional({ example: 0.022 })
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber()
  @IsOptional()
  cbmPerBox?: number;

  @ApiPropertyOptional({ example: 1.25 })
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber()
  @IsOptional()
  weightKg?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dimensions?: string;

  @ApiPropertyOptional({ example: 'Pcs' })
  @IsString()
  @IsOptional()
  uom?: string;

  @ApiPropertyOptional({ example: 'Large' })
  @IsString()
  @IsOptional()
  size?: string;

  @ApiPropertyOptional({ example: 'Amit Sharma' })
  @IsString()
  @IsOptional()
  purchasePersonName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vendorName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdatePackingDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  packingCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  packingName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  packingType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  material?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  unitSize?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber()
  @IsOptional()
  unitsPerCase?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber()
  @IsOptional()
  cbmPerBox?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber()
  @IsOptional()
  weightKg?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dimensions?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  uom?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  size?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  purchasePersonName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vendorName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
