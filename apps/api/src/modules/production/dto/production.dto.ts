import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductionJobStatus, BomStatus } from '../entities/production.entity';

export class CreateProductionJobDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderNo?: string;

  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsString()
  productName: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  orderQty: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  plannedProductionQty: number;

  @ApiProperty()
  @IsString()
  uom: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unitPerCarton?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  partyName?: string;

  @ApiProperty()
  @IsString()
  warehouseId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  warehouseName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  materialRequestGroupId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(ProductionJobStatus)
  status?: ProductionJobStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  processDetails?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateProductionJobDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderNo?: string;

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
  @IsNumber()
  @Min(0)
  orderQty?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  plannedProductionQty?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  uom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unitPerCarton?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  partyName?: string;

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
  materialRequestGroupId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  processDetails?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CloseProductionJobDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  finalProducedQty: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateProductionLogDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productionJobId?: string;

  @ApiProperty()
  @IsDateString()
  date: string;

  @ApiProperty()
  @IsString()
  productionWarehouseId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productionWarehouseName?: string;

  @ApiProperty()
  @IsString()
  rawMaterialId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rawMaterialName?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  qtyConsumed: number;

  @ApiProperty()
  @IsString()
  finishedProductId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  finishedProductName?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  qtyProduced: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  destinationWarehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  destinationWarehouseName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qcStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qcId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateProductionMergeDetailDto {
  @ApiProperty()
  @IsString()
  productionJobId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderNo?: string;

  @ApiProperty()
  @IsString()
  finalProductId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  finalProductName?: string;

  @ApiProperty()
  @IsString()
  mergedItemId: string;

  @ApiProperty()
  @IsString()
  mergedItemName: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  mergedQty: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  uom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  workDetails?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  entryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateProductionMaterialClosureDto {
  @ApiProperty()
  @IsString()
  productionJobId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  requestId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderNo?: string;

  @ApiProperty()
  @IsString()
  finalProductId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  finalProductName?: string;

  @ApiProperty()
  @IsString()
  materialId: string;

  @ApiProperty()
  @IsString()
  materialName: string;

  @ApiProperty()
  @IsString()
  sourceWarehouseId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceWarehouseName?: string;

  @ApiProperty()
  @IsString()
  productionWarehouseId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productionWarehouseName?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  receivedQty: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  usedQty: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  returnedQty?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  closingDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateBomItemDto {
  @ApiProperty()
  @IsString()
  materialId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  materialName?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  uom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  wastagePercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class CreateBomDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(BomStatus)
  status?: BomStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  outputQty?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  uom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @ApiProperty({ type: [CreateBomItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBomItemDto)
  items: CreateBomItemDto[];
}

export class UpdateBomDto {
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
  version?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(BomStatus)
  status?: BomStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  outputQty?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  uom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @ApiPropertyOptional({ type: [CreateBomItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBomItemDto)
  items?: CreateBomItemDto[];
}
