import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum QualityStatus {
  PENDING = 'pending',
  INSPECTION_SCHEDULED = 'inspection_scheduled',
  IN_PROGRESS = 'in_progress',
  PASSED = 'passed',
  FAILED = 'failed',
  REWORK_REQUIRED = 'rework_required',
  REWORK_DONE = 'rework_done',
  COMPLETED = 'completed',
}

@Entity('quality_fms_tasks')
@Index(['uniqueKey'], { unique: true })
export class QualityFmsTask {
  @PrimaryGeneratedColumn('uuid')
  taskId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ unique: true })
  uniqueKey: string; // QUALFMS-ENQ-001-SKU001-ACT01

  @Column({ nullable: true })
  enquiryOrderId: string;

  @Column({ nullable: true })
  enquiryOrderNo: string;

  @Column({ nullable: true })
  salesOrderId: string;

  @Column({ nullable: true })
  salesOrderNo: string;

  @Column({ nullable: true })
  purchaseOrderId: string;

  @Column({ nullable: true })
  purchaseOrderNo: string;

  @Column({ nullable: true })
  productId: string;

  @Column({ nullable: true })
  productCode: string;

  @Column({ nullable: true })
  productName: string;

  @Column({ nullable: true })
  sku: string;

  @Column({ nullable: true })
  brandId: string;

  @Column({ nullable: true })
  brandName: string;

  @Column({ nullable: true })
  categoryName: string;

  @Column({ nullable: true })
  vendorId: string;

  @Column({ nullable: true })
  vendorName: string;

  @Column({ nullable: true })
  inspectorId: string;

  @Column({ nullable: true })
  inspectorName: string;

  @Column({ nullable: true })
  assignedBy: string;

  // Quantities
  @Column({ type: 'decimal', precision: 15, scale: 3, nullable: true })
  orderedQuantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, nullable: true })
  receivedQuantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, nullable: true })
  inspectedQuantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, nullable: true })
  passedQuantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, nullable: true })
  rejectedQuantity: number;

  // Inspection details
  @Column('text', { nullable: true })
  checklistItems: string; // JSON array of checklist items with pass/fail

  @Column('text', { nullable: true })
  remarks: string;

  @Column('text', { nullable: true })
  defectDescription: string;

  @Column({ nullable: true })
  sampleImageUrl: string;

  @Column({ nullable: true })
  reportFileUrl: string;

  // Dates
  @Column({ nullable: true })
  scheduledDate: Date;

  @Column({ nullable: true })
  inspectionDate: Date;

  @Column({ nullable: true })
  completedDate: Date;

  @Column({ nullable: true })
  delayDays: number;

  @Column({
    type: 'enum',
    enum: QualityStatus,
    default: QualityStatus.PENDING,
  })
  status: QualityStatus;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
