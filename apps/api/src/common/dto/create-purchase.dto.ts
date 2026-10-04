import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ========== Purchase Quote DTOs ==========

export class CreateVendorQuoteDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vendorId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vendorName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vendorQuoteNo?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  quoteDate?: Date;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  quotedRate?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  quotedCurrency?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  gstPercent?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  freight?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  landingCost?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  totalAmount?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  moq?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  leadTimeDays?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  deliveryDate?: Date;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  rateValidity?: Date;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deliveryTerms?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  paymentTermsId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  currencyRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  discountPercent?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  otherCharges?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  termsConditions?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  attachmentUrl?: string;
}

export class CreatePurchaseQuoteItemDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  enquiryItemId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  lineNo?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  brandName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productDescription?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  unitSize?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  unitPerCarton?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  uom?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  unitBasis?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  packingType?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  packingSize?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  cbmPerBox?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  unitsPerCase?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  totalCbm?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  moq?: number;

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
  gstPercent?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  freight?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  otherCost?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  gstCost?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  landingCost?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  landingCostDelhi?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  totalValue?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  ratePerCarton?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  finalPriceInForeignCurrency?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vendorId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vendorName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vendorQuoteNo?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  vendorRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  vendorTotal?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vendorCurrency?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  leadTimeDays?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  rateValidity?: Date;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vendorAttachmentUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bestLandingLocation?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  bestLandingCost?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remark?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiPropertyOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVendorQuoteDto)
  @IsOptional()
  vendorQuotes?: CreateVendorQuoteDto[];
}

export class CreatePurchaseQuoteDto {
  // Source Reference
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  enquiryOrderId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  salesEnquiryOrderNo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  enquiryOrderNo?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  quoteDate?: Date;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  deliveryDate?: Date;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  validUntil?: Date;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  shippingTerms?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  crmId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  orderNo?: string;

  // Customer / Party Details
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  partyCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  partyName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contactName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contactPersonNo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  emailAddress?: string;

  // Commercial Details
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pod?: string;

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
  shipmentDetails?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  transporterDetails?: string;

  // Users
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  salesPersonId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  purchasePersonId?: string;

  // Toggles
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  useSalesEnquiryData?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isRateFinalized?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isFreightApplicable?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isGstApplicable?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isLabelRequired?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isImageAvailable?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isSampleRequired?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isDesignerRequired?: boolean;

  // Remarks
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiProperty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseQuoteItemDto)
  @IsOptional()
  items?: CreatePurchaseQuoteItemDto[];
}

export class UpdatePurchaseQuoteDto {
  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  quoteDate?: Date;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  deliveryDate?: Date;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  validUntil?: Date;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  shippingTerms?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  enquiryOrderNo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pod?: string;

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
  shipmentDetails?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  transporterDetails?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  purchasePersonId?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isRateFinalized?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isFreightApplicable?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isGstApplicable?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isLabelRequired?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isSampleRequired?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isDesignerRequired?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isSentToCosting?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isApproved?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  approvalRemarks?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contactName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  emailAddress?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contactPersonNo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ type: [CreatePurchaseQuoteItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseQuoteItemDto)
  @IsOptional()
  items?: CreatePurchaseQuoteItemDto[];
}

// ========== Vendor Quote DTOs ==========
export class CreateVendorQuoteEntryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  quoteId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  quoteItemId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiProperty()
  @IsString()
  vendorId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vendorName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vendorQuoteNo?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  quoteDate?: Date;

  @ApiProperty()
  @IsNumber()
  quotedRate: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  quotedCurrency?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  gstPercent?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  freight?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  landingCost?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  totalAmount?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  moq?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  leadTimeDays?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  deliveryDate?: Date;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  rateValidity?: Date;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deliveryTerms?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  paymentTermsId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  currencyRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  discountPercent?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  otherCharges?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  termsConditions?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  attachmentUrl?: string;
}

// ========== Purchase Label DTOs ==========
export class CreatePurchaseLabelDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  quoteId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  quoteItemId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  salesEnquiryOrderNo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  orderNo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  partyName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productDescription?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  brandName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  unitSize?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  unitPerCarton?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  totalValue?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  importedBy?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  poi?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nutrition?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ingredients?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  batchNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  shelfLife?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  mfgDetails?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  allergenAdvice?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dimensions?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  otherInformation?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  itemSelection?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  designerId?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  plannedDate?: Date;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  actualDate?: Date;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  delayDays?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sampleStatus?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sampleDescription?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  designFileUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  finalFileUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sampleImageUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remark?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarksIfAny?: string;
}

export class UpdatePurchaseLabelDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  importedBy?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  poi?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nutrition?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ingredients?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  batchNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  shelfLife?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  mfgDetails?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  allergenAdvice?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dimensions?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  otherInformation?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  designerId?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  plannedDate?: Date;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  actualDate?: Date;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  delayDays?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sampleStatus?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sampleDescription?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  designFileUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  finalFileUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sampleImageUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remark?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarksIfAny?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  approvalRemarks?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  designerName?: string;
}
