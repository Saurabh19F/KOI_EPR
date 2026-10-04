import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadLedgerDto {
  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiProperty()
  @IsString()
  ledgerNumber: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  ledgerDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ledgerPdfUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ledgerFileName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  ledgerAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountHeadName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountantRemarks?: string;
}

export class UpdateLedgerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ledgerNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  ledgerDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ledgerPdfUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ledgerFileName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  ledgerAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountHeadName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountantRemarks?: string;
}

export class ApproveLedgerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  chiefAccountantRemarks?: string;
}

export class RejectLedgerDto {
  @ApiProperty()
  @IsString()
  rejectionReason: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  chiefAccountantRemarks?: string;
}
