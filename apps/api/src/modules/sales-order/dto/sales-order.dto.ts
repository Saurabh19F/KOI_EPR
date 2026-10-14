import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsDate,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============ Sales Order DTOs ============

export class SalesOrderItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty()
  @IsString()
  productName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hsnCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  uomName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unitSize?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unitBasis?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  packingType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purchasePersonId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purchasePersonName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  unitsPerCase?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  mrp?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  buyingBestLandingRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  landingCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discountPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  gstRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  perPcRateWithoutGst?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  otherCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  gstCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalRatePerBox?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  rateWithGstCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  finalPriceInForeignCurrency?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  ratePerCarton?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  cbmPerBox?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  cbmCostPerBoxInSelectedCurrency?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  haulage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  finalRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shiftOrderNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  enquiryNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currencyType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  itemSelected?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  itemStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  importedBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  poi?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nutrition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ingredients?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  shelfLifeMonths?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mfgDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  allergenAdvice?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  netWeight?: string;
}

export class CreateSalesOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  enquiryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  enquiryIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  quotationId?: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  orderDate: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expectedDeliveryDate?: Date;

  @ApiProperty()
  @IsString()
  customerId: string;

  @ApiProperty()
  @IsString()
  customerName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiProperty()
  @IsString()
  billingAddress: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  billingCountry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  billingState?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  billingStateCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  billingCity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  billingPincode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  billingGstin?: string;

  @ApiProperty()
  @IsString()
  shippingAddress: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shippingCountry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shippingState?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shippingStateCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shippingCity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shippingPincode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shippingGstin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  salesPersonId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentTermsId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currencyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  exchangeRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discountPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  freightAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  packingAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  insuranceAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  otherCharges?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  poNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  poDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isExport?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  portOfLoading?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  portOfDischarge?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  piNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  containerSize?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  cbmRequired?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  grossWeight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  netWeight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shipmentDetails?: string;

  @ApiProperty({ type: [SalesOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalesOrderItemDto)
  items: SalesOrderItemDto[];
}

export class UpdateSalesOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expectedDeliveryDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  billingAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discountPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  freightAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  packingAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  insuranceAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  otherCharges?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  poNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isExport?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  piNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  containerSize?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  cbmRequired?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  grossWeight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  netWeight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shipmentDetails?: string;

  @ApiProperty({ type: [SalesOrderItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalesOrderItemDto)
  items?: SalesOrderItemDto[];
}

// ============ Delivery Note DTOs ============

export class DeliveryNoteItemDto {
  @ApiProperty()
  @IsString()
  orderItemId: string;

  @ApiProperty()
  @IsString()
  productName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hsnCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  uomName?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiryDate?: Date;
}

export class CreateDeliveryNoteDto {
  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  noteDate: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transporterName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lrNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  lrDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eWayBillNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [DeliveryNoteItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryNoteItemDto)
  items: DeliveryNoteItemDto[];
}

// ============ Sales Invoice DTOs ============

export class SalesInvoiceItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderItemId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryNoteItemId?: string;

  @ApiProperty()
  @IsString()
  productName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hsnCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  uomName?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discountPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expiryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serialNumbers?: string[];
}

export class CreateSalesInvoiceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryNoteId?: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  invoiceDate: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  dueDate: Date;

  @ApiProperty()
  @IsString()
  customerId: string;

  @ApiProperty()
  @IsString()
  customerName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerGstin?: string;

  @ApiProperty()
  @IsString()
  billingAddress: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  billingStateCode?: string;

  @ApiProperty()
  @IsString()
  shippingAddress: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shippingStateCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  reverseCharge?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invoiceType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  freightAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  packingAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  insuranceAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  otherCharges?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eWayBillNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transporterName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  distance?: number;

  @ApiProperty({ type: [SalesInvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalesInvoiceItemDto)
  items: SalesInvoiceItemDto[];
}

// ============ Credit Note DTOs ============

export class CreateCreditNoteDto {
  @ApiProperty()
  @IsString()
  invoiceId: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  creditNoteDate: Date;

  @ApiProperty()
  @IsString()
  customerId: string;

  @ApiProperty()
  @IsString()
  customerName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerGstin?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiProperty()
  @IsString()
  reason: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

// ============ Pagination ============

export class PaginationDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  toDate?: string;
}
