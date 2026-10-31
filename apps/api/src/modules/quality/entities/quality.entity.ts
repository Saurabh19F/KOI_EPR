import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum QualityLogStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum InspectionDecision {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PARTIALLY_APPROVED = 'partially_approved',
}

export enum RejectActionType {
  PACKING_ISSUE = 'packing_issue',
  EXPIRED = 'expired',
  BET_CTN = 'bet_ctn',
  BENT_CTN = 'bent_ctn',
  SHORTAGE_PCS_CTN = 'shortage_pcs_ctn',
  DIFFERENT_ITEM_AS_PO = 'different_item_as_po',
  INFECTED = 'infected',
  IMPACTED = 'impacted',
  INFECTION_IN_MATERIAL = 'infection_in_material',
  MOISTURE_DAMAGE = 'moisture_damage',
  OTHERS = 'others',
  SHORT_KG = 'short_kg',
}

export enum RejectActionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('quality_logs')
export class QualityLog {
  @PrimaryGeneratedColumn('uuid')
  qcId: string;

  @Column({ nullable: true })
  companyId: string;

  @Index({ unique: true })
  @Column()
  qcNumber: string;

  @Column({ nullable: true })
  grnId: string;

  @Column({ nullable: true })
  grnNumber: string;

  @Column({ nullable: true })
  grnItemId: string;

  @Column({ nullable: true })
  orderId: string;

  @Column({ nullable: true })
  sku: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  unitPrice: number;

  @Column({ nullable: true })
  batchNumber: string;

  @Column({ nullable: true })
  expiryDate: Date;

  @Column({ nullable: true })
  productionLogId: string;

  @Column({ nullable: true })
  productionJobId: string;

  @Column({ type: 'date' })
  dateRequested: Date;

  @Column()
  warehouseId: string;

  @Column({ nullable: true })
  warehouseName: string;

  @Column()
  productId: string;

  @Column({ nullable: true })
  productName: string;

  @Column('decimal', { precision: 15, scale: 3 })
  qtyToInspect: number;

  @Column('decimal', { precision: 15, scale: 3, default: 0 })
  qtyApproved: number;

  @Column('decimal', { precision: 15, scale: 3, default: 0 })
  qtyRejected: number;

  @Column({
    type: 'enum',
    enum: QualityLogStatus,
    default: QualityLogStatus.PENDING,
  })
  status: QualityLogStatus;

  @Column({ nullable: true })
  checkedBy: string;

  @Column({ nullable: true })
  checkedByUserId: string;

  @Column({ type: 'date', nullable: true })
  inspectionDate: Date;

  @Column({
    type: 'enum',
    enum: InspectionDecision,
    nullable: true,
  })
  decision: InspectionDecision;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('reject_action_logs')
export class RejectActionLog {
  @PrimaryGeneratedColumn('uuid')
  actionId: string;

  @Column({ nullable: true })
  companyId: string;

  @Index({ unique: true })
  @Column()
  actionNumber: string;

  @Column({ nullable: true })
  receiptId: string;

  @Column({ nullable: true })
  purchaseOrderId: string;

  @Column({ nullable: true })
  poNumber: string;

  @Column()
  productId: string;

  @Column({ nullable: true })
  productName: string;

  @Column({ nullable: true })
  vendorId: string;

  @Column({ nullable: true })
  vendorName: string;

  @Column('decimal', { precision: 15, scale: 3 })
  rejectedQty: number;

  @Column({
    type: 'enum',
    enum: RejectActionType,
  })
  actionType: RejectActionType;

  @Column({ type: 'date' })
  actionDate: Date;

  @Column({ nullable: true })
  referenceNo: string;

  @Column({
    type: 'enum',
    enum: RejectActionStatus,
    default: RejectActionStatus.PENDING,
  })
  status: RejectActionStatus;

  @Column({ type: 'boolean', default: false })
  isReplacementExpected: boolean;

  @Column({ type: 'boolean', default: false })
  replacementReceived: boolean;

  @Column({ nullable: true })
  replacementVendor: string;

  @Column({ nullable: true })
  replacementVendorId: string;

  @Column({ type: 'date', nullable: true })
  replacementEta: Date;

  @Column({ nullable: true })
  supplierOption: string;

  @Column({ nullable: true })
  documentNoteType: string;

  @Column({ nullable: true })
  freightCharges: string;

  @Column({ nullable: true })
  resolutionPath: string;

  @Column({ type: 'text', nullable: true })
  purchaseRemarks: string;

  @Column({ type: 'text', nullable: true })
  qualityRemarks: string;

  @Column({ nullable: true })
  updatedBy: string;

  @Column({ nullable: true })
  updatedByUserId: string;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
