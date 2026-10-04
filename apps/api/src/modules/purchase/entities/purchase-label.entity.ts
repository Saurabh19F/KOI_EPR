import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum LabelStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  SAMPLE_CREATED = 'sample_created',
  APPROVAL_PENDING = 'approval_pending',
  APPROVED = 'approved',
  REVISION_REQUIRED = 'revision_required',
  FINAL_UPLOADED = 'final_uploaded',
}

@Entity('purchase_labels')
export class PurchaseLabel {
  @PrimaryGeneratedColumn('uuid')
  labelId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ unique: true })
  labelCode: string;

  @Column({ nullable: true })
  labelDate: Date;

  @Column({ nullable: true })

  @Column({ nullable: true })
  quoteItemId: string;

  @Column({ nullable: true })
  salesEnquiryOrderNo: string;

  @Column({ nullable: true })
  orderNo: string;

  @Column({ nullable: true })
  partyName: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  productName: string;

  @Column({ nullable: true, type: 'text' })
  productDescription: string;

  @Column({ nullable: true })
  sku: string;

  @Column({ nullable: true })
  categoryId: string;

  @Column({ nullable: true })
  categoryName: string;

  @Column({ nullable: true })
  brandId: string;

  @Column({ nullable: true })
  brandName: string;

  @Column({ nullable: true })
  unitSize: string;

  @Column({ nullable: true })
  unitPerCarton: number;

  @Column({ nullable: true })
  totalValue: number;

  @Column({ nullable: true })
  importedBy: string;

  @Column({ nullable: true })
  poi: string;

  @Column({ nullable: true, type: 'text' })
  nutrition: string;

  @Column({ nullable: true, type: 'text' })
  ingredients: string;

  @Column({ nullable: true })
  barcode: string;

  @Column({ nullable: true })
  batchNumber: string;

  @Column({ nullable: true })
  shelfLife: string;

  @Column({ nullable: true })
  mfgDetails: string;

  @Column({ nullable: true, type: 'text' })
  allergenAdvice: string;

  @Column({ nullable: true })
  dimensions: string;

  @Column({ nullable: true, type: 'text' })
  otherInformation: string;

  @Column({ nullable: true })
  itemSelection: string;

  @Column({ nullable: true })
  designerId: string;

  @Column({ nullable: true })
  designerName: string;

  @Column({ nullable: true })
  plannedDate: Date;

  @Column({ nullable: true })
  actualDate: Date;

  @Column({ type: 'int', nullable: true })
  delayDays: number;

  @Column({ nullable: true })
  sampleStatus: string;

  @Column({ nullable: true })
  sampleDescription: string;

  @Column({ nullable: true })
  designFileUrl: string;

  @Column({ nullable: true })
  finalFileUrl: string;

  @Column({ nullable: true })
  sampleImageUrl: string;

  @Column({ nullable: true })
  fileName: string;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column('text', { nullable: true })
  approvalRemarks: string;

  @Column({
    type: 'enum',
    enum: LabelStatus,
    default: LabelStatus.PENDING,
  })
  status: LabelStatus;

  @Column({ nullable: true, type: 'text' })
  remark: string;

  @Column({ nullable: true, type: 'text' })
  remarksIfAny: string;

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
