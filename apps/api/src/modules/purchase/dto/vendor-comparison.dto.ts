import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class VendorComparisonItemDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  itemId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productName?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  uom?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  targetPrice?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  totalCbm?: number;
}

export class RankedVendorQuoteDto {
  @ApiProperty()
  vendorQuoteId: string;

  @ApiProperty()
  vendorId: string;

  @ApiProperty()
  vendorName: string;

  @ApiProperty()
  vendorQuoteNo?: string;

  @ApiProperty()
  quoteDate?: Date;

  @ApiProperty()
  quotedRate: number;

  @ApiProperty()
  quotedCurrency?: string;

  @ApiProperty()
  gstPercent?: number;

  @ApiProperty()
  freight?: number;

  @ApiProperty()
  landingCost: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  quantity?: number;

  @ApiProperty()
  moq?: number;

  @ApiProperty()
  leadTimeDays?: number;

  @ApiPropertyOptional()
  deliveryDate?: Date;

  @ApiPropertyOptional()
  rateValidity?: Date;

  @ApiPropertyOptional()
  deliveryTerms?: string;

  @ApiPropertyOptional()
  paymentTermsId?: string;

  @ApiPropertyOptional()
  currencyRate?: number;

  @ApiPropertyOptional()
  discountPercent?: number;

  @ApiPropertyOptional()
  otherCharges?: number;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  attachmentUrl?: string;

  // Comparison metrics (calculated, not stored)
  @ApiProperty()
  priceRank: number;

  @ApiProperty()
  vsBestRatePercent: number;

  @ApiProperty()
  vsTargetPricePercent: number;

  @ApiProperty()
  isBestPrice: boolean;

  @ApiProperty()
  isWithinTarget: boolean;

  @ApiProperty()
  leadTimeScore: number;

  @ApiProperty()
  overallScore: number;

  @ApiProperty()
  recommendation: 'best' | 'alternative' | 'rejected';

  @ApiProperty()
  recommendationReason: string;
}

export class ItemComparisonDto {
  @ApiProperty()
  item: VendorComparisonItemDto;

  @ApiProperty()
  vendorQuotes: RankedVendorQuoteDto[];

  @ApiProperty()
  bestPrice: number;

  @ApiProperty()
  averagePrice: number;

  @ApiProperty()
  worstPrice: number;

  @ApiProperty()
  priceSpreadPercent: number;

  @ApiProperty()
  bestLeadTime: number;

  @ApiProperty()
  recommendedVendorId?: string;

  @ApiProperty()
  recommendedVendorName?: string;
}

export class VendorComparisonSummaryDto {
  @ApiProperty()
  quoteId: string;

  @ApiProperty()
  quoteNo: string;

  @ApiProperty()
  quoteDate: Date;

  @ApiProperty()
  status: string;

  @ApiProperty()
  totalItems: number;

  @ApiProperty()
  itemsWithQuotes: number;

  @ApiProperty()
  itemsWithoutQuotes: number;

  @ApiProperty()
  totalVendorsQuoted: number;

  @ApiProperty()
  itemComparisons: ItemComparisonDto[];

  @ApiProperty()
  grandTotalBestPrices: number;

  @ApiProperty()
  grandTotalAvgPrices: number;

  @ApiProperty()
  potentialSavings: number;

  @ApiProperty()
  overallBestVendorId?: string;

  @ApiProperty()
  overallBestVendorName?: string;

  @ApiProperty()
  comparisonDate: Date;
}

export class SelectVendorDto {
  @ApiProperty()
  @IsString()
  vendorQuoteId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class BulkSelectVendorDto {
  @ApiProperty()
  @IsString()
  vendorQuoteId: string;

  @ApiProperty()
  @IsString()
  itemId: string;
}

export class AutoSelectDto {
  @ApiProperty()
  @IsString()
  quoteId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  strategy?: 'lowest_price' | 'best_value' | 'fastest_delivery';
}

export class AutoSelectResultDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  selections: Array<{
    itemId: string;
    productName: string;
    selectedVendorQuoteId: string;
    vendorName: string;
    landingCost: number;
    reason: string;
  }>;

  @ApiProperty()
  totalSavings: number;
}
