import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDate,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsDecimal,
  Min,
  MaxLength,
  IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';

// ============ Account DTOs ============

export class CreateAccountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiProperty({ example: 'CASH-001' })
  @IsString()
  @MaxLength(50)
  accountCode: string;

  @ApiProperty({ example: 'Cash Account' })
  @IsString()
  @MaxLength(200)
  accountName: string;

  @ApiProperty({ enum: ['asset', 'liability', 'equity', 'revenue', 'expense'] })
  @IsEnum(['asset', 'liability', 'equity', 'revenue', 'expense'])
  accountType: string;

  @ApiProperty({ enum: ['debit', 'credit'] })
  @IsEnum(['debit', 'credit'])
  accountNature: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountGroup?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentAccountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gstin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  openingBalance?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  openingBalanceType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ifscCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  panNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  creditLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  creditPeriod?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isBillWise?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isInventoryValue?: boolean;
}

export class UpdateAccountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountGroup?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentAccountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gstin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ifscCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  creditLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  creditPeriod?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isBillWise?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isInventoryValue?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ============ Journal Entry DTOs ============

export class JournalLineDto {
  @ApiProperty()
  @IsString()
  accountId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  debitAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  creditAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  narration?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  costCenterId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectId?: string;
}

export class CreateJournalEntryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiProperty({ enum: ['JV', 'RV', 'PV', 'CV', 'SI', 'PI', 'CN', 'DN'] })
  @IsString()
  voucherType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entryType?: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  entryDate: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  postingDate: Date;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  referenceDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  partyType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  partyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  partyName?: string;

  @ApiProperty({ type: [JournalLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines: JournalLineDto[];
}

export class UpdateJournalEntryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  entryDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  postingDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  partyType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  partyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  partyName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines?: JournalLineDto[];
}

// ============ Payment DTOs ============

export class PaymentAllocationDto {
  @ApiProperty()
  @IsString()
  billId: string;

  @ApiProperty()
  @IsString()
  billType: string; // 'ap' or 'ar'

  @ApiProperty()
  @IsNumber()
  @Min(0)
  allocatedAmount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  tdsAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  adjustmentAmount?: number;
}

export class CreatePaymentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  paymentDate: Date;

  @ApiProperty({ enum: ['PAYMENT', 'RECEIPT'] })
  @IsString()
  paymentType: string;

  @ApiProperty({ enum: ['Customer', 'Vendor'] })
  @IsString()
  partyType: string;

  @ApiProperty()
  @IsString()
  partyId: string;

  @ApiProperty()
  @IsString()
  partyName: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  tdsAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  tdsRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tdsSection?: string;

  @ApiProperty({ enum: ['CASH', 'BANK', 'CHEQUE', 'NEFT', 'RTGS', 'UPI'] })
  @IsString()
  mode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankAccountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  chequeNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  chequeDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  utrNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceModule?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceId?: string;

  @ApiProperty({ type: [PaymentAllocationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentAllocationDto)
  allocations: PaymentAllocationDto[];
}

// ============ Financial Reports DTOs ============

export class FinancialReportQueryDto {
  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  fromDate: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  toDate: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  costCenterId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  voucherType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeOpeningBalance?: boolean;
}

export class AccountBalanceReportDto {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingDebit: number;
  closingCredit: number;
  netBalance: number;
}

export class LedgerReportDto {
  accountId: string;
  accountCode: string;
  accountName: string;
  transactions: {
    date: Date;
    voucherNumber: string;
    voucherType: string;
    description: string;
    partyName: string;
    debit: number;
    credit: number;
    runningBalance: number;
  }[];
  openingBalance: number;
  closingBalance: number;
  totalDebit: number;
  totalCredit: number;
}

export class TrialBalanceDto {
  accounts: {
    accountId: string;
    accountCode: string;
    accountName: string;
    accountType: string;
    openingDebit: number;
    openingCredit: number;
    debitTurnover: number;
    creditTurnover: number;
    closingDebit: number;
    closingCredit: number;
  }[];
  totalOpeningDebit: number;
  totalOpeningCredit: number;
  totalDebitTurnover: number;
  totalCreditTurnover: number;
  totalClosingDebit: number;
  totalClosingCredit: number;
}

export class BalanceSheetDto {
  assets: {
    group: string;
    accounts: {
      accountId: string;
      accountName: string;
      accountCode: string;
      balance: number;
    }[];
    total: number;
  }[];
  liabilities: {
    group: string;
    accounts: {
      accountId: string;
      accountName: string;
      accountCode: string;
      balance: number;
    }[];
    total: number;
  }[];
  equity: {
    group: string;
    accounts: {
      accountId: string;
      accountName: string;
      accountCode: string;
      balance: number;
    }[];
    total: number;
  };
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

export class ProfitLossDto {
  income: {
    group: string;
    accounts: {
      accountId: string;
      accountName: string;
      accountCode: string;
      amount: number;
    }[];
    total: number;
  }[];
  expenses: {
    group: string;
    accounts: {
      accountId: string;
      accountName: string;
      accountCode: string;
      amount: number;
    }[];
    total: number;
  }[];
  totalIncome: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}
