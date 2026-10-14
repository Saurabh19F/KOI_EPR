import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ========== Price Analysis DTOs ==========

export class CreatePriceAnalysisItemDto {
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
  productName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productDescription?: string;

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
  unitsPerCase?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  packingType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  unitBasis?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  packingSize?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  orderQuantity?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  purchasePersonId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  purchasePersonName?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  cbmPerBox?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  totalCbm?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  mrp?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  buyingPrice?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  purchaseCurrency?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  buyingBestLandingRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  gstPercent?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  gstAmount?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  perPcRateWithoutGst?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  landingCost?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  tax?: number;

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
  totalRatePerBox?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  rateWithGstCost?: number;

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
  haulageDelhi?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  haulageMumbai?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  selectedHaulageLocation?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  selectedHaulage?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  freightCost?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  targetCurrency?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  currencyRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  currencyMargin?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  finalCurrencyRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  finalPriceInForeignCurrency?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  ratePerCarton?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  cbmCostPerBoxInSelectedCurrency?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  finalRate?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  finalCurrency?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  marginPercent?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  finalSellingRate?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remark?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  unitName?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  gstPercentage?: number;
}

export class CreatePriceAnalysisDto {
  // Source Reference
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  enquiryOrderId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  enquiryOrderNo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  purchaseQuoteId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  purchaseQuoteNo?: string;

  // Customer Details
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  buyerCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerName?: string;

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
  portOfLoading?: string;

  // Users
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  costingPersonId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  salesPersonId?: string;

  // Toggles
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  usePurchaseRate?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  usePreviousYearData?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isFreightApplicable?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isHaulageApplicable?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isGstApplicable?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isMarginApplicable?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isCurrencyConversionRequired?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isRateRounded?: boolean;

  // Currency Rates (Editable)
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  gbpRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  gbpMargin?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  gbpFinalRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  usdRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  usdMargin?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  usdFinalRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  cadRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  cadMargin?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  cadFinalRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  audRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  audMargin?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  audFinalRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  euroRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  euroMargin?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  euroFinalRate?: number;

  // Remarks
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  internalNotes?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  totalPurchaseValue?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  totalSellingValue?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  totalMargin?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  totalCbm?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  totalHaulage?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  haulageLocation?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  containerSize?: number;

  @ApiProperty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePriceAnalysisItemDto)
  @IsOptional()
  items?: CreatePriceAnalysisItemDto[];
}

export class UpdatePriceAnalysisDto {
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  totalPurchaseValue?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  totalSellingValue?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  totalMargin?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  totalCbm?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  totalHaulage?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  freightUSD?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  haulageLocation?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  containerSize?: number;

  // Toggles
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  usePurchaseRate?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  usePreviousYearData?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isFreightApplicable?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isHaulageApplicable?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isGstApplicable?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isMarginApplicable?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isCurrencyConversionRequired?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isRateRounded?: boolean;

  // Currency Rates
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  gbpRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  gbpMargin?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  gbpFinalRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  usdRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  usdMargin?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  usdFinalRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  cadRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  cadMargin?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  cadFinalRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  audRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  audMargin?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  audFinalRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  euroRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  euroMargin?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  euroFinalRate?: number;

  // Remarks
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  internalNotes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  approvalRemarks?: string;
}

export class UpdatePriceAnalysisItemDto {
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  cbmPerBox?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  orderQuantity?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  buyingPrice?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  buyingBestLandingRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  gstPercent?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  gstAmount?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  landingCost?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  otherCost?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  freightCost?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  selectedHaulageLocation?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  selectedHaulage?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  currencyRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  currencyMargin?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  finalCurrencyRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  finalPriceInForeignCurrency?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  ratePerCarton?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  cbmCostPerBoxInSelectedCurrency?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  finalRate?: number;


  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  marginPercent?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  finalSellingRate?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remark?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  packingType?: string;

  // Additional fields for full save support
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  targetCurrency?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  mrp?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  unitsPerCase?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  gstCost?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  totalRatePerBox?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  rateWithGstCost?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  perPcRateWithoutGst?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  tax?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  totalCbm?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  unitName?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  gstPercentage?: number;
}

// ========== Haulage Rate DTOs ==========
export class CreateHaulageRateDto {
  @ApiProperty()
  @IsString()
  location: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  containerSize?: string;

  @ApiProperty({ description: 'Rate per CBM in INR' })
  @IsNumber()
  ratePerCbm: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateHaulageRateDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  containerSize?: string;

  @ApiPropertyOptional({ description: 'Rate per CBM in INR' })
  @IsNumber()
  @IsOptional()
  ratePerCbm?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// ========== Currency Rate DTOs ==========
export class CreateCurrencyRateDto {
  @ApiProperty()
  @IsString()
  currencyCode: string;

  @ApiProperty()
  @IsNumber()
  actualRate: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  marginBuffer?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  finalRate?: number;
}

export class UpdateCurrencyRateDto {
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  actualRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  marginBuffer?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  finalRate?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
