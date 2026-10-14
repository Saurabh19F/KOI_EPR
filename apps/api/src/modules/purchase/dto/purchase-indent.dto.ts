import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, IsArray, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IndentStatus } from '../entities/purchase-indent.entity';

export class CreatePurchaseIndentItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  enquiryOrderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  orderDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  plannedDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  salesPersonId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  salesPersonName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  enquiryItemId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productName?: string;

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
  unitPerCarton?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiProperty()
  @IsString()
  assignedTo: string;

  @ApiProperty()
  @IsString()
  assignedToName: string;
}

export class UpdatePurchaseIndentItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(IndentStatus)
  indentStatus?: IndentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isIndentRaised?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purchaseQuoteId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purchaseQuoteNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedToName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class BulkCreateIndentDto {
  @ApiProperty()
  @IsString()
  enquiryOrderId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  plannedDate?: string;

  @ApiProperty({ type: [CreatePurchaseIndentItemDto] })
  @IsArray()
  items: CreatePurchaseIndentItemDto[];
}

export class MarkIndentRaisedDto {
  @ApiProperty()
  @IsString()
  purchaseQuoteId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purchaseQuoteNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class IndentDashboardQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  salesPersonName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
