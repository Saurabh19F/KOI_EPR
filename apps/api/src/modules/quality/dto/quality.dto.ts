import { IsString, IsOptional, IsNumber, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  QualityLogStatus,
  InspectionDecision,
  RejectActionType,
  RejectActionStatus,
} from '../entities/quality.entity';

export class CreateQualityLogDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productionLogId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productionJobId?: string;

  @ApiProperty()
  @IsDateString()
  dateRequested: string;

  @ApiProperty()
  @IsString()
  warehouseId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  warehouseName?: string;

  @ApiProperty()
  @IsString()
  productId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productName?: string;

  @ApiProperty()
  @IsNumber()
  qtyToInspect: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateQualityLogDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  checkedBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  checkedByUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  inspectionDate?: string;

  @ApiPropertyOptional({ enum: InspectionDecision })
  @IsOptional()
  @IsEnum(InspectionDecision)
  decision?: InspectionDecision;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  qtyApproved?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  qtyRejected?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ enum: QualityLogStatus })
  @IsOptional()
  @IsEnum(QualityLogStatus)
  status?: QualityLogStatus;
}

export class CreateRejectActionLogDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receiptId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purchaseOrderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  poNumber?: string;

  @ApiProperty()
  @IsString()
  productId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productName?: string;

  @ApiProperty()
  @IsNumber()
  rejectedQty: number;

  @ApiProperty({ enum: RejectActionType })
  @IsEnum(RejectActionType)
  actionType: RejectActionType;

  @ApiProperty()
  @IsDateString()
  actionDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isReplacementExpected?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  replacementVendor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  replacementEta?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resolutionPath?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purchaseRemarks?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qualityRemarks?: string;
}

export class UpdateRejectActionLogDto {
  @ApiPropertyOptional({ enum: RejectActionType })
  @IsOptional()
  @IsEnum(RejectActionType)
  actionType?: RejectActionType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  actionDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceNo?: string;

  @ApiPropertyOptional({ enum: RejectActionStatus })
  @IsOptional()
  @IsEnum(RejectActionStatus)
  status?: RejectActionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isReplacementExpected?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  replacementVendor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  replacementEta?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resolutionPath?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purchaseRemarks?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qualityRemarks?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  updatedBy?: string;
}
