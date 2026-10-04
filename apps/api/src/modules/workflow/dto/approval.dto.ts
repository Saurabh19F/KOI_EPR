import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean, IsObject, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum ApprovalType {
  PURCHASE_QUOTE = 'purchase_quote',
  VENDOR_SELECTION = 'vendor_selection',
  RATE_FINALIZATION = 'rate_finalization',
  PRICE_DISCOUNT = 'price_discount',
  CREDIT_LIMIT = 'credit_limit',
  WRITE_OFF = 'write_off',
}

export enum ApprovalLevel {
  LEVEL_1 = 1,
  LEVEL_2 = 2,
  LEVEL_3 = 3,
  LEVEL_4 = 4,
}

export class CreateApprovalRequestDto {
  @ApiProperty({ enum: ApprovalType })
  @IsEnum(ApprovalType)
  approvalType: ApprovalType;

  @ApiProperty()
  @IsString()
  entityType: string;

  @ApiProperty()
  @IsString()
  entityId: string;

  @ApiProperty()
  @IsString()
  entityReference: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  previousAmount?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  justification?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  requestNotes?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  contextData?: Record<string, any>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export class ApprovalActionDto {
  @ApiProperty()
  @IsString()
  approvalId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  delegationReason?: string;
}

export class ApproveDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Type(() => String)
  remarks?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  escalate?: boolean;
}

export class RejectDto {
  @ApiProperty()
  @IsString()
  reason: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Type(() => String)
  remarks?: string;
}

export class RequestRevisionDto {
  @ApiProperty()
  @IsString()
  revisionNotes: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Type(() => String)
  remarks?: string;
}

export class DelegateApprovalDto {
  @ApiProperty()
  @IsString()
  toUserId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  toRoleId?: string;

  @ApiProperty()
  @IsString()
  reason: string;
}

export class ApprovalQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  approvalType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  entityType?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  myApprovals?: string; // 'true' to filter by user's pending approvals
}

export class ApprovalResponseDto {
  @ApiProperty()
  approvalId: string;

  @ApiProperty()
  approvalType: string;

  @ApiProperty()
  entityType: string;

  @ApiProperty()
  entityId: string;

  @ApiProperty()
  entityReference: string;

  @ApiProperty()
  requesterId: string;

  @ApiProperty()
  requesterName: string;

  @ApiProperty()
  requesterRole: string;

  @ApiProperty()
  currentLevel: number;

  @ApiProperty()
  requiredLevel: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  amount: number;

  @ApiPropertyOptional()
  previousAmount?: number;

  @ApiPropertyOptional()
  variance?: number;

  @ApiPropertyOptional()
  variancePercent?: number;

  @ApiPropertyOptional()
  justification?: string;

  @ApiProperty()
  priority: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  currentApproverLevel: number;

  @ApiPropertyOptional()
  currentApproverRole?: string;
}

export class ApprovalSummaryDto {
  @ApiProperty()
  pending: number;

  @ApiProperty()
  approved: number;

  @ApiProperty()
  rejected: number;

  @ApiProperty()
  revisionRequested: number;

  @ApiProperty()
  total: number;
}

export class BatchApprovalDto {
  @ApiProperty()
  @IsString({ each: true })
  approvalIds: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Type(() => String)
  remarks?: string;
}

export class EscalateApprovalDto {
  @ApiProperty()
  @IsString()
  approvalId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}
