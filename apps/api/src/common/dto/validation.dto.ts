import { IsString, IsOptional, IsNumber, IsBoolean, IsEmail, IsUUID, IsEnum, IsArray, ValidateNested, Min, Max, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ========== COMMON DTOs ==========

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
  @Max(100)
  limit?: number = 20;
}

export class SearchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export class IdParamDto {
  @ApiProperty()
  @IsUUID()
  id: string;
}

// ========== SALES ENQUIRY DTOs ==========

export class CreateSalesEnquiryDto {
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
  @MaxLength(500)
  remarks?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalesEnquiryItemDto)
  items?: CreateSalesEnquiryItemDto[];
}

export class CreateSalesEnquiryItemDto {
  @ApiProperty()
  @IsString()
  productName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

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
  uom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  cbmPerBox?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  unitPerCarton?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productDescription?: string;
}
