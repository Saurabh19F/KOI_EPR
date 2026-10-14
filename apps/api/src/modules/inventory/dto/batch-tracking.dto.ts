import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';

export enum BatchStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  QUARANTINE = 'quarantine',
  CLEARED = 'cleared',
  REJECTED = 'rejected',
}

export class CreateBatchDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiProperty()
  @IsString()
  batchNumber: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  locationId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  manufacturingDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  unitCost?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vendorId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class BatchQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsEnum(BatchStatus)
  @IsOptional()
  status?: BatchStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  expiringInDays?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;
}

export class StockReportDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstocked';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  includeZeroStock?: string;
}

export class InventoryValuationDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  asOnDate?: string;
}

export class StockMovementReportDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  movementType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  toDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  groupBy?: 'product' | 'date' | 'warehouse' | 'type';
}
