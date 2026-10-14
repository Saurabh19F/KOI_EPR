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
import { JournalEntryType } from './journal-entry.entity';

// Accounts Payable - Tracks vendor payments
export enum PaymentStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

@Entity('accounts_payable')


@Index(['dueDate'])
export class AccountsPayable {
  @PrimaryGeneratedColumn('uuid')
  apId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  vendorId: string;

  @Column()
  vendorName: string;

  @Column({ nullable: true })
  purchaseInvoiceId: string;

  @Column()
  invoiceNumber: string;

  @Column()
  invoiceDate: Date;

  @Column()
  dueDate: Date;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  invoiceAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  tdsAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  adjustmentAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  pendingAmount: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ nullable: true })
  purchaseOrderId: string;

  @Column({ nullable: true })
  purchaseOrderNumber: string;

  @Column({ nullable: true })
  grnId: string;

  @Column({ nullable: true })
  grnNumber: string;

  @Column({ nullable: true })
  billNumber: string; // Vendor's bill number

  @Column({ nullable: true })
  billDate: Date;

  @Column({ nullable: true })
  notes: string;

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

@Entity('accounts_receivable')


@Index(['dueDate'])
export class AccountsReceivable {
  @PrimaryGeneratedColumn('uuid')
  arId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  customerId: string;

  @Column()
  customerName: string;

  @Column({ nullable: true })
  salesInvoiceId: string;

  @Column()
  invoiceNumber: string;

  @Column()
  invoiceDate: Date;

  @Column()
  dueDate: Date;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  invoiceAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  tdsAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  adjustmentAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  receivedAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  pendingAmount: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ nullable: true })
  salesOrderId: string;

  @Column({ nullable: true })
  salesOrderNumber: string;

  @Column({ nullable: true })
  deliveryNoteId: string;

  @Column({ nullable: true })
  deliveryNoteNumber: string;

  @Column({ nullable: true })
  eInvoiceNumber: string; // GST e-invoice number

  @Column({ nullable: true })
  eInvoiceDate: Date;

  @Column({ nullable: true })
  eWayBillNumber: string;

  @Column({ nullable: true })
  notes: string;

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

// Payment tracking
@Entity('payments')


export class Payment {
  @PrimaryGeneratedColumn('uuid')
  paymentId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  paymentNumber: string; // e.g., "PAY/2025-26/00001"

  @Column({ type: 'date' })
  paymentDate: Date;

  @Column({ type: 'enum', enum: JournalEntryType })
  paymentType: JournalEntryType; // PAYMENT or RECEIPT

  @Column()
  partyType: string; // Customer or Vendor

  @Column()
  partyId: string;

  @Column()
  partyName: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  tdsAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  TDS_rate: number;

  @Column({ nullable: true })
  TDS_section: string; // e.g., "194Q", "194C"

  @Column()
  mode: string; // CASH, BANK, CHEQUE, NEFT, RTGS, UPI

  @Column({ nullable: true })
  bankAccountId: string;

  @Column({ nullable: true })
  chequeNumber: string;

  @Column({ nullable: true })
  chequeDate: Date;

  @Column({ nullable: true })
  referenceNumber: string;

  @Column({ nullable: true })
  utrNumber: string; // UTR for NEFT/RTGS

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  sourceModule: string;

  @Column({ nullable: true })
  sourceId: string;

  @Column({ nullable: true })
  journalEntryId: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('payment_allocations')
@Index(['paymentId'])
@Index(['billId'])
export class PaymentAllocation {
  @PrimaryGeneratedColumn('uuid')
  allocationId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
    payment: Payment;

  @Column()
  billId: string; // AP or AR record ID

  @Column()
  billType: string; // 'ap' or 'ar'

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  billAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  allocatedAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  tdsAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  adjustmentAmount: number;

  @Column({ type: 'date' })
  allocationDate: Date;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
