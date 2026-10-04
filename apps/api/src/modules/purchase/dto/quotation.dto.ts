import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class GenerateQuotationDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  quoteId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  salesEnquiryId?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  includeVendorComparison?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  includeCostBreakdown?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  showMargins?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  validityDays?: string;
}

export class QuotationPdfData {
  // Header
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite?: string;
  companyLogo?: string;

  // Document Info
  quotationNumber: string;
  quotationDate: string;
  quotationValidity: string;
  quotationRef?: string;

  // Customer Info
  customerName: string;
  customerAddress: string;
  customerEmail?: string;
  customerPhone?: string;
  customerGstin?: string;

  // Sales Person
  salesPersonName: string;
  salesPersonEmail?: string;

  // Items
  items: QuotationItemPdfData[];

  // Summary
  subtotal: number;
  totalGst: number;
  totalAmount: number;
  totalCbm: number;
  currency: string;

  // Terms
  paymentTerms: string;
  deliveryTerms: string;
  validityTerms: string;
  warrantyTerms?: string;

  // Notes
  notes?: string;
  specialInstructions?: string;
}

export class QuotationItemPdfData {
  lineNo: number;
  sku: string;
  productName: string;
  productDescription?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  discountPercent?: number;
  discountAmount?: number;
  gstPercent?: number;
  gstAmount?: number;
  finalPrice: number;
  leadTimeDays?: number;
  imageUrl?: string;
  cbm?: number;
}

export class CostBreakdownData {
  itemName: string;
  buyingPrice: number;
  freight: number;
  landingCost: number;
  sellingPrice: number;
  margin: number;
  marginPercent: number;
  suggestedRetailPrice?: number;
}

export class VendorComparisonPdfData {
  itemName: string;
  vendorName: string;
  quotedRate: number;
  landingCost: number;
  leadTimeDays: number;
  rank: number;
  isRecommended: boolean;
}
