import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum POLedgerStatus {
  PENDING = 'pending',
  LEDGER_UPLOADED = 'ledger_uploaded',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('po_ledger_entries')
@Index(['companyId', 'orderId'])
@Index(['status'])
export class POLedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  ledgerEntryId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  orderId: string;

  @Column()
  orderNumber: string;

  @Column({ nullable: true })
  enquiryNo: string;

  @Column({ nullable: true })
  salesEnquiryId: string;

  @Column({ nullable: true })
  vendorName: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  poAmount: number;

  @Column({ nullable: true })
  poDate: Date;

  @Column({ nullable: true })
  poPdfUrl: string;

  // Accountant fields
  @Column({ nullable: true })
  ledgerNumber: string;

  @Column({ nullable: true })
  ledgerDate: Date;

  @Column({ nullable: true })
  ledgerPdfUrl: string;

  @Column({ nullable: true })
  ledgerFileName: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  ledgerAmount: number;

  @Column({ nullable: true })
  accountHeadName: string;

  @Column({ type: 'text', nullable: true })
  accountantRemarks: string;

  @Column({ nullable: true })
  accountantId: string;

  @Column({ nullable: true })
  accountantName: string;

  @Column({ nullable: true })
  uploadedAt: Date;

  // Planned/Actual dates for tracking
  @Column({ nullable: true })
  plannedDate: Date;

  @Column({ nullable: true })
  actualDate: Date;

  // Chief Accountant fields
  @Column({ nullable: true })
  chiefAccountantId: string;

  @Column({ nullable: true })
  chiefAccountantName: string;

  @Column({ nullable: true })
  approvalPlannedDate: Date;

  @Column({ nullable: true })
  approvalActualDate: Date;

  @Column({ type: 'text', nullable: true })
  chiefAccountantRemarks: string;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  rejectedAt: Date;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({
    type: 'enum',
    enum: POLedgerStatus,
    default: POLedgerStatus.PENDING,
  })
  status: POLedgerStatus;

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
