import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsEnum, IsBoolean, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ========== Sales Enquiry DTOs ==========

export class CreateEnquiryItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productName?: string;

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
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  unitPerCarton?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  uom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  cbmPerBox?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  expectedRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  mrp?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  buyingPrice?: number;

  // Additional fields from frontend
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unitSize?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalCbm?: number;

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
  @IsString()
  productPurchasePersonName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isNew?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isManualEntry?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  manualProductName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  masterStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  gstPercent?: number;
}

export class CreateEnquiryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEnquiryItemDto)
  items?: CreateEnquiryItemDto[];

  // Additional fields from frontend
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  enquiryNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  enquiryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buyerCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buyerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buyerEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  poNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  poDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pod?: string;

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
  @IsString()
  shipmentDetails?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cubeSize?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  portOfLoading?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transporterDetails?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isBillingSameAsDelivery?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  billingAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isExportEnquiry?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPoReceived?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPurchaseRequired?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRateCalculationRequired?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isApprovalRequired?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEmailReminderRequired?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  salesPersonName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  createdBy?: string;
}

export class UpdateEnquiryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buyerCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buyerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buyerEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  poNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  poDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pod?: string;

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
  @IsString()
  shipmentDetails?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  portOfLoading?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transporterDetails?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isBillingSameAsDelivery?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  billingAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isExportEnquiry?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPoReceived?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPurchaseRequired?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRateCalculationRequired?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isApprovalRequired?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEmailReminderRequired?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEnquiryItemDto)
  items?: CreateEnquiryItemDto[];
}

export class UpdateEnquiryItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  expectedRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unitSize?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  unitPerCarton?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isManualEntry?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  masterStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  masterProductId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  cbmPerBox?: number;

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
  @IsString()
  assignedPurchaseUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  mrp?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  buyingPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  gstPercent?: number;
}
