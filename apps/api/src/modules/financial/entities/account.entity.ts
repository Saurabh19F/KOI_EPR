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

export enum AccountType {
  ASSET = 'asset',
  LIABILITY = 'liability',
  EQUITY = 'equity',
  REVENUE = 'revenue',
  EXPENSE = 'expense',
}

export enum AccountNature {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

export enum AccountGroup {
  // Assets
  CURRENT_ASSET = 'current_asset',
  FIXED_ASSET = 'fixed_asset',
  BANK = 'bank',
  CASH = 'cash',
  RECEIVABLE = 'receivable',
  INVENTORY = 'inventory',

  // Liabilities
  CURRENT_LIABILITY = 'current_liability',
  LONG_TERM_LIABILITY = 'long_term_liability',
  PAYABLE = 'payable',

  // Equity
  CAPITAL = 'capital',
  RESERVES = 'reserves',

  // Revenue
  SALES = 'sales',
  OTHER_INCOME = 'other_income',

  // Expense
  DIRECT_EXPENSE = 'direct_expense',
  INDIRECT_EXPENSE = 'indirect_expense',
  PURCHASE = 'purchase',
}

@Entity('accounts')
@Index(['accountCode'], { unique: true })


export class Account {
  @PrimaryGeneratedColumn('uuid')
  accountId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ unique: true })
  accountCode: string; // e.g., "CASH-001", "BANK-001", "SALES-001"

  @Column()
  accountName: string;

  @Column({ type: 'enum', enum: AccountType })
  accountType: AccountType;

  @Column({ type: 'enum', enum: AccountNature })
  accountNature: AccountNature; // Debit or Credit balance normal

  @Column({ type: 'enum', enum: AccountGroup, nullable: true })
  accountGroup: AccountGroup;

  @Column({ nullable: true })
  parentAccountId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  gstin: string; // Applicable for tax accounts

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  openingBalance: number;

  @Column({ type: 'enum', enum: AccountNature, nullable: true })
  openingBalanceType: AccountNature;

  @Column({ nullable: true })
  bankName: string;

  @Column({ nullable: true })
  accountNumber: string;

  @Column({ nullable: true })
  ifscCode: string;

  @Column({ nullable: true })
  branchName: string;

  @Column({ nullable: true })
  panNumber: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isSystem: boolean; // System accounts cannot be deleted

  @Column({ default: false })
  isBillWise: boolean; // Enable bill-wise tracking for receivables/payables

  @Column({ default: false })
  isInventoryValue: boolean; // Track inventory value in this account

  @Column({ nullable: true })
  creditLimit: number;

  @Column({ type: 'int', default: 0 })
  creditPeriod: number; // Days

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  deletedAt: Date;
}
