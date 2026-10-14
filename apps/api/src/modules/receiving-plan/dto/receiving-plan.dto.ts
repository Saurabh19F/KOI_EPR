import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  IsPositive,
  ValidateNested,
  Min,
} from 'class-validator';
import { ReceivingPlanStatus } from '../entities/receiving-plan.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReceivingPlanDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsString()
  productName: string;

  @ApiProperty()
  @IsString()
  warehouseId: string;

  @ApiProperty()
  @IsString()
  warehouseName: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  plannedQty: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purchaseOrderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  poNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateReceivingPlanDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  plannedQty?: number;

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
  @IsEnum(ReceivingPlanStatus)
  status?: ReceivingPlanStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class BulkCreateItemDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsString()
  productName: string;

  @ApiProperty()
  @IsString()
  warehouseId: string;

  @ApiProperty()
  @IsString()
  warehouseName: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  plannedQty: number;
}

export class BulkCreateReceivingPlanDto {
  @ApiProperty()
  @IsString()
  purchaseOrderId: string;

  @ApiProperty()
  @IsString()
  poNumber: string;

  @ApiProperty({ type: [BulkCreateItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkCreateItemDto)
  items: BulkCreateItemDto[];
}

export class UpdateReceivedQtyDto {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  receivedQty: number;
}

export class SubmitGoodsReceivingDto {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  receivedQty: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  rejectedQty?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storageLocation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invoiceNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  biltyNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  truckNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  driverName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  driverNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gstInvoiceNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invoiceImageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  itemImageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}
