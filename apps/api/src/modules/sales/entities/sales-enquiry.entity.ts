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

export enum EnquiryStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  PUNCHED = 'punched',
  VERIFIED = 'verified',
  PURCHASE_PENDING = 'purchase_pending',
  VENDOR_QUOTE_PENDING = 'vendor_quote_pending',
  RATE_PENDING = 'rate_pending',
  APPROVAL_PENDING = 'approval_pending',
  QUOTATION_CREATED = 'quotation_created',
  QUOTATION_SENT = 'quotation_sent',
  FOLLOW_UP = 'follow_up',
  WON = 'won',
  LOST = 'lost',
  CANCELLED = 'cancelled',

  // New workflow statuses
  PURCHASE_ASSIGNED = 'purchase_assigned',
  PURCHASE_IN_PROGRESS = 'purchase_in_progress',
  PURCHASE_COMPLETED = 'purchase_completed',
  MIS_REVIEW = 'mis_review',
  MIS_REQUOTE_REQUIRED = 'mis_requote_required',
  MIS_APPROVED = 'mis_approved',
  RATE_CALCULATION = 'rate_calculation',
}

@Entity('sales_enquiry_orders')
@Index(['enquiryOrderNo'], { unique: true })
export class SalesEnquiryOrder {
  @PrimaryGeneratedColumn('uuid')
  enquiryOrderId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ unique: true })
  enquiryOrderNo: string;

  @Column({ nullable: true })
  enquiryDate: Date;

  @Column({ nullable: true })
  crmId: string;

  @Column({ nullable: true })
  orderNo: string;

  @Column({ nullable: true })
  salesPersonId: string;

  @Column({ name: 'sales_person_name', nullable: true })
  salesPersonName: string;

  @Column({ nullable: true })
  customerId: string;

  // NOTE: Removed ManyToOne to Customer to avoid circular dependency issues
  // Use manual joins in services when needed

  @Column({ nullable: true })
  buyerCode: string;

  @Column({ nullable: true })
  buyerName: string;

  @Column({ nullable: true })
  contactName: string;

  @Column({ nullable: true })
  contactNumber: string;

  @Column({ nullable: true })
  buyerPhone: string;

  @Column({ nullable: true })
  buyerEmail: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  poNumber: string;

  @Column({ nullable: true })
  poDate: Date;

  @Column({ nullable: true })
  pod: string;

  @Column({ nullable: true })
  podDate: Date;

  @Column({ nullable: true })
  paymentTermsId: string;

  @Column({ nullable: true })
  currencyId: string;

  @Column({ nullable: true })
  shipmentDetails: string;

  @Column({ nullable: true })
  cubeSize: string;

  @Column({ nullable: true })
  portOfLoading: string;

  @Column({ nullable: true })
  portOfDischarge: string;

  @Column({ nullable: true })
  transporterDetails: string;

  @Column({ default: false })
  isBillingSameAsDelivery: boolean;

  @Column('text', { nullable: true })
  billingAddress: string;

  @Column({ nullable: true })
  billingCountry: string;

  @Column({ nullable: true })
  billingState: string;

  @Column({ nullable: true })
  billingCity: string;

  @Column({ nullable: true })
  billingPincode: string;

  @Column('text', { nullable: true })
  deliveryAddress: string;

  @Column({ nullable: true })
  deliveryCountry: string;

  @Column({ nullable: true })
  deliveryState: string;

  @Column({ nullable: true })
  deliveryCity: string;

  @Column({ nullable: true })
  deliveryPincode: string;

  @Column({
    type: 'enum',
    enum: EnquiryStatus,
    default: EnquiryStatus.DRAFT,
  })
  status: EnquiryStatus;

  @Column({ default: false })
  isExportEnquiry: boolean;

  @Column({ default: false })
  isPoReceived: boolean;

  @Column({ default: false })
  isPdfGenerated: boolean;

  @Column({ default: false })
  isExcelGenerated: boolean;

  @Column({ default: false })
  isEmailReminderRequired: boolean;

  @Column({ default: false })
  isEmailSent: boolean;

  @Column({ default: false })
  isQuotationCreated: boolean;

  @Column({ default: false })
  isPurchaseRequired: boolean;

  @Column({ default: false })
  isRateCalculationRequired: boolean;

  @Column({ default: false })
  isApprovalRequired: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column('text', { nullable: true })
  remarks: string;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column('text', { nullable: true })
  approvalRemarks: string;

  @Column({ name: 'created_by', nullable: true, type: 'uuid' })
  createdBy: string;

  @ManyToOne('User', { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdByUser: any;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  deletedAt: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  totalCbm: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  totalValue: number;

  @Column({ name: 'mis_status', nullable: true })
  misStatus: string;

  @Column({ name: 'mis_reviewed_by', nullable: true })
  misReviewedBy: string;

  @Column({ name: 'mis_reviewed_at', nullable: true })
  misReviewedAt: Date;

  @Column({ name: 'mis_remarks', type: 'text', nullable: true })
  misRemarks: string;

  // NOTE: Removed OneToMany to SalesEnquiryOrderItem to avoid circular dependency issues
}
