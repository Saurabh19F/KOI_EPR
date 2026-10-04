import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum JournalEntryType {
  JOURNAL = 'journal',
  PAYMENT = 'payment',
  RECEIPT = 'receipt',
  CONTRA = 'contra',
  SALES = 'sales',
  PURCHASE = 'purchase',
  CREDIT_NOTE = 'credit_note',
  DEBIT_NOTE = 'debit_note',
}

export enum VoucherType {
  RECEIPT_VOUCHER = 'RV',
  PAYMENT_VOUCHER = 'PV',
  JOURNAL_VOUCHER = 'JV',
  CONTRA_VOUCHER = 'CV',
  SALES_VOUCHER = 'SI',
  PURCHASE_VOUCHER = 'PI',
  CREDIT_NOTE = 'CN',
  DEBIT_NOTE = 'DN',
}

@Entity('journal_entries')
export class JournalEntry {
  @PrimaryGeneratedColumn('uuid', { name: 'entry_id' })
  entryId: string;

  @Column({ nullable: true, name: 'company_id' })
  companyId: string;

  @Column({ unique: true, name: 'entry_number' })
  voucherNumber: string;

  @Column({ type: 'varchar', name: 'voucher_type' })
  voucherType: string;

  @Column({ type: 'varchar', name: 'entry_type' })
  entryType: string;

  @Column({ name: 'entry_date', type: 'date' })
  entryDate: Date;

  @Column({ name: 'posting_date', type: 'date' })
  postingDate: Date;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'total_debit', default: 0 })
  totalDebit: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'total_credit', default: 0 })
  totalCredit: number;

  @Column({ nullable: true, name: 'reference_number' })
  referenceNumber: string;

  @Column({ nullable: true, name: 'reference_date', type: 'date' })
  referenceDate: Date;

  @Column({ nullable: true, name: 'party_type' })
  partyType: string;

  @Column({ nullable: true, name: 'party_id' })
  partyId: string;

  @Column({ nullable: true, name: 'party_name' })
  partyName: string;

  @Column({ default: true, name: 'is_posted' })
  isPosted: boolean;

  @Column({ default: false, name: 'is_auto' })
  isAuto: boolean;

  @Column({ nullable: true, name: 'is_cancelled' })
  isCancelled: boolean;

  @Column({ nullable: true, name: 'source_module' })
  sourceModule: string;

  @Column({ nullable: true, name: 'source_id' })
  sourceId: string;

  @Column({ nullable: true, name: 'approved_by' })
  approvedBy: string;

  @Column({ nullable: true, name: 'approved_at' })
  approvedAt: Date;

  @Column({ nullable: true, name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ nullable: true, name: 'updated_by' })
  updatedBy: string;

  @Column({ nullable: true, name: 'updated_at' })
  updatedAt: Date;

  @Column({ nullable: true, name: 'deleted_at' })
  deletedAt: Date;
}

@Entity('journal_entry_lines')
export class JournalEntryLine {
  @PrimaryGeneratedColumn('uuid', { name: 'line_id' })
  lineId: string;

  @Column({ nullable: true, name: 'company_id' })
  companyId: string;

  @Column({ name: 'entry_id' })
  entryId: string;

  @Column({ name: 'account_id' })
  accountId: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'debit_amount', default: 0 })
  debitAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'credit_amount', default: 0 })
  creditAmount: number;

  @Column({ type: 'text', nullable: true })
  narration: string;

  @Column({ nullable: true, name: 'cost_center_id' })
  costCenterId: string;

  @Column({ nullable: true, name: 'department_id' })
  departmentId: string;

  @Column({ nullable: true, name: 'project_id' })
  projectId: string;

  @Column({ nullable: true, name: 'bill_wise_ref_id' })
  billWiseRefId: string;

  @Column({ type: 'int', name: 'line_number', default: 0 })
  lineNumber: number;

  @Column({ nullable: true, name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity('bill_wise_entries')
export class BillWiseEntry {
  @PrimaryGeneratedColumn('uuid')
  billId: string;

  @Column({ nullable: true, name: 'company_id' })
  companyId: string;

  @Column({ name: 'account_id' })
  accountId: string;

  @Column({ nullable: true, name: 'entry_line_id' })
  entryLineId: string;

  @Column({ type: 'date', name: 'reference_date' })
  referenceDate: Date;

  @Column({ name: 'reference_number' })
  referenceNumber: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'original_amount' })
  originalAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'pending_amount', default: 0 })
  pendingAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'adjusted_amount', default: 0 })
  adjustedAmount: number;

  @Column({ name: 'entry_type' })
  entryType: string;

  @Column({ default: 'open' })
  status: string;

  @Column({ nullable: true, name: 'due_date' })
  dueDate: Date;

  @Column({ nullable: true, name: 'source_module' })
  sourceModule: string;

  @Column({ nullable: true, name: 'source_id' })
  sourceId: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true, name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity('cost_centers')
export class CostCenter {
  @PrimaryGeneratedColumn('uuid', { name: 'cost_center_id' })
  costCenterId: string;

  @Column({ nullable: true, name: 'company_id' })
  companyId: string;

  @Column({ name: 'cost_center_code' })
  costCenterCode: string;

  @Column({ name: 'cost_center_name' })
  costCenterName: string;

  @Column({ nullable: true, name: 'parent_id' })
  parentId: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'allocation_percentage' })
  allocationPercentage: number;

  @Column({ nullable: true })
  type: string;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ nullable: true, name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ nullable: true, name: 'updated_by' })
  updatedBy: string;

  @Column({ nullable: true, name: 'updated_at' })
  updatedAt: Date;
}
