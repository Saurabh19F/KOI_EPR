import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum GstInvoiceType {
  B2B = 'B2B',           // Business to Business
  B2C = 'B2C',           // Business to Consumer
  B2C_LARGE = 'B2C_LARGE', // B2C with amount > 2.5L
  EXP = 'EXP',           // Export
  EXP_WOPAY = 'EXP_WOPAY', // Export without payment
  SEZWP = 'SEZWP',       // SEZ with payment
  SEZWOP = 'SEZWOP',     // SEZ without payment
  DE = 'DE',             // Deemed Export
}

export enum GstStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
  PROVISIONAL = 'provisional',
}

@Entity('gst_configuration')
@Index(['companyId'])
export class GstConfiguration {
  @PrimaryGeneratedColumn('uuid')
  configId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  legalName: string;

  @Column()
  tradeName: string;

  @Column({ unique: true })
  gstin: string;

  @Column()
  panNumber: string;

  @Column({ nullable: true })
  tanNumber: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column({ type: 'text' })
  address: string;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column()
  stateCode: string;

  @Column()
  pincode: string;

  @Column({ type: 'enum', enum: GstStatus, default: GstStatus.ACTIVE })
  status: GstStatus;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  registrationDate: Date;

  @Column({ nullable: true })
  cancellationDate: Date;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;
}

// TDS/TCS Configuration
export enum TdsTcsType {
  TDS_VENDOR = 'tds_vendor',
  TDS_CONTRACTOR = 'tds_contractor',
  TDS_RENT = 'tds_rent',
  TDS_PROFESSIONAL = 'tds_professional',
  TDS_OTHER = 'tds_other',
  TCS_SELLER = 'tcs_seller',
}

@Entity('tds_tcs_configuration')
@Index(['companyId', 'panNumber'], { unique: true })
export class TdsTcsConfiguration {
  @PrimaryGeneratedColumn('uuid')
  configId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  name: string;

  @Column()
  panNumber: string;

  @Column({ unique: true })
  tanNumber: string;

  @Column({ nullable: true })
  gstin: string;

  @Column()
  mobile: string;

  @Column()
  email: string;

  @Column({ type: 'text' })
  address: string;

  @Column()
  type: TdsTcsType;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  rate: number;

  @Column({ nullable: true })
  surchargeRate: number;

  @Column({ nullable: true })
  eduCessRate: number;

  @Column({ nullable: true })
  thresholdLimit: number;

  @Column({ nullable: true })
  thresholdLimitType: string; // 'individual' or 'cumulative'

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;
}

// GST Filing status tracking
export enum GstFilingStatus {
  PENDING = 'pending',
  FILED = 'filed',
  AMENDED = 'amended',
  DEFAULTED = 'defaulted',
}

@Entity('gst_filing_records')


export class GstFilingRecord {
  @PrimaryGeneratedColumn('uuid')
  filingId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  financialYear: string; // "2025-26"

  @Column()
  period: string; // "012025" (MMYYYY format)

  @Column()
  filingType: string; // GSTR1, GSTR3B, GSTR9

  @Column({ type: 'enum', enum: GstFilingStatus, default: GstFilingStatus.PENDING })
  status: GstFilingStatus;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalTaxableValue: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  cgstAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  sgstAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  igstAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  cessAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalTax: number;

  @Column({ nullable: true })
  arnNumber: string; // Acknowledgment Receipt Number

  @Column({ nullable: true })
  filingDate: Date;

  @Column({ nullable: true })
  dueDate: Date;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Currency Revaluation
@Entity('currency_revaluations')

export class CurrencyRevaluation {
  @PrimaryGeneratedColumn('uuid')
  revaluationId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  revaluationNumber: string;

  @Column()
  revaluationDate: Date;

  @Column()
  currencyId: string;

  @Column()
  currencyCode: string;

  @Column({ type: 'decimal', precision: 18, scale: 6 })
  originalRate: number;

  @Column({ type: 'decimal', precision: 18, scale: 6 })
  newRate: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  gainAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  lossAmount: number;

  @Column({ nullable: true })
  gainAccountId: string;

  @Column({ nullable: true })
  lossAccountId: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  journalEntryId: string;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}

// Bank Reconciliation
export enum ReconciliationStatus {
  UNRECONCILED = 'unreconciled',
  MATCHED = 'matched',
  DISPUTED = 'disputed',
}

@Entity('bank_reconciliation')

export class BankReconciliation {
  @PrimaryGeneratedColumn('uuid')
  reconciliationId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  bankAccountId: string;

  @Column()
  bankAccountName: string;

  @Column()
  bankName: string;

  @Column()
  statementNumber: string;

  @Column()
  statementDate: Date;

  @Column({ type: 'date' })
  fromDate: Date;

  @Column({ type: 'date' })
  toDate: Date;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  openingBalance: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  closingBalance: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  totalCredits: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  totalDebits: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  matchedCredits: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  matchedDebits: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  unmatchedCredits: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  unmatchedDebits: number;

  @Column({ type: 'enum', enum: ReconciliationStatus, default: ReconciliationStatus.UNRECONCILED })
  status: ReconciliationStatus;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('bank_reconciliation_lines')
@Index(['reconciliationId'])
export class BankReconciliationLine {
  @PrimaryGeneratedColumn('uuid')
  lineId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
    reconciliation: BankReconciliation;

  @Column()
  sourceType: string; // 'bank_statement' or 'voucher'

  @Column()
  transactionDate: Date;

  @Column()
  description: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  debitAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  creditAmount: number;

  @Column({ nullable: true })
  referenceNumber: string;

  @Column({ nullable: true })
  voucherId: string;

  @Column({ nullable: true })
  voucherType: string;

  @Column({ nullable: true })
  matchingLineId: string; // Matched line from opposite source

  @Column({ type: 'enum', enum: ReconciliationStatus, default: ReconciliationStatus.UNRECONCILED })
  status: ReconciliationStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
