import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsDate,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============ Batch DTOs ============

export class CreateBatchDto {
  @ApiProperty()
  @IsString()
  companyId: string;

  @ApiProperty()
  @IsString()
  batchNumber: string;

  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsString()
  productName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  warehouseName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  manufacturingDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiryDate?: Date;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitCost: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  grnId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  grnNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mfgLicenseNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  barcode?: string;
}

export class BatchQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  includeExpired?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

// ============ Serial Number DTOs ============

export class CreateSerialNumberDto {
  @ApiProperty()
  @IsString()
  companyId: string;

  @ApiProperty()
  @IsString()
  serialNumber: string;

  @ApiProperty()
  @IsString()
  productId: string;

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
  batchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  manufacturingDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiryDate?: Date;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitCost: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  warrantyExpiry?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkCreateSerialDto {
  @ApiProperty()
  @IsString()
  companyId: string;

  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsString()
  productName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prefix?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitCost: number;
}

// ============ Stock Reservation DTOs ============

export class CreateReservationDto {
  @ApiProperty()
  @IsString()
  companyId: string;

  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsString()
  productName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiProperty()
  @IsString()
  orderType: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiryDate?: Date;
}

// ============ Stock Transfer DTOs ============

export class TransferItemDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsString()
  productName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitCost: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceLocationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  destinationLocationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateStockTransferDto {
  @ApiProperty()
  @IsString()
  companyId: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  transferDate: Date;

  @ApiProperty()
  @IsString()
  sourceWarehouseId: string;

  @ApiProperty()
  @IsString()
  sourceWarehouseName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceLocationId?: string;

  @ApiProperty()
  @IsString()
  destinationWarehouseId: string;

  @ApiProperty()
  @IsString()
  destinationWarehouseName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  destinationLocationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [TransferItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferItemDto)
  items: TransferItemDto[];
}

// ============ Stock Count DTOs ============

export class CountItemDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsString()
  productName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationName?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  countedQuantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateStockCountDto {
  @ApiProperty()
  @IsString()
  companyId: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  countDate: Date;

  @ApiProperty()
  @IsString()
  warehouseId: string;

  @ApiProperty()
  @IsString()
  warehouseName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  countedBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [CountItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CountItemDto)
  items?: CountItemDto[];
}

// ============ Reorder Point DTOs ============

export class CreateReorderPointDto {
  @ApiProperty()
  @IsString()
  companyId: string;

  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsString()
  productName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  warehouseName?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  reorderLevel: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  reorderQuantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  maximumLevel: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  leadTimeDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoReorder?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preferredVendorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preferredVendorName?: string;
}

// ============ Stock Valuation DTOs ============

export class StockValuationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  valuationMethod?: string;
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
}

// ============ Utility ============

import { IsBoolean } from 'class-validator';
