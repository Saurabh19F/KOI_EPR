import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { PurchaseQuoteItem } from './purchase-quote-item.entity';

export enum PurchaseStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  VENDOR_QUOTE_PENDING = 'vendor_quote_pending',
  RATE_FINALIZED = 'rate_finalized',
  SENT_TO_COSTING = 'sent_to_costing',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REVISED = 'revised',
}

@Entity('purchase_quotes')
@Index(['quoteNo'], { unique: true })
export class PurchaseQuote {
  @PrimaryGeneratedColumn('uuid')
  quoteId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ unique: true })
  quoteNo: string;

  @Column({ nullable: true })
  quoteDate: Date;

  @Column({ nullable: true })
  enquiryOrderId: string;

  @Column({ nullable: true })
  salesEnquiryOrderNo: string;

  @Column({ nullable: true })
  enquiryOrderNo: string;

  @Column({ nullable: true, type: 'timestamp' })
  deliveryDate: Date;

  @Column({ nullable: true, type: 'timestamp' })
  validUntil: Date;

  @Column({ nullable: true })
  shippingTerms: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @Column({ nullable: true })
  crmId: string;

  @Column({ nullable: true })
  orderNo: string;

  @Column({ nullable: true })
  customerId: string;


  @Column({ nullable: true })
  partyCode: string;

  @Column({ nullable: true })
  partyName: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  contactName: string;

  @Column({ nullable: true })
  contactPersonNo: string;

  @Column({ nullable: true })
  emailAddress: string;

  @Column({ nullable: true })
  pod: string;

  @Column({ nullable: true })
  paymentTermsId: string;

  @Column({ nullable: true })
  currencyId: string;

  @Column({ nullable: true })
  shipmentDetails: string;

  @Column({ nullable: true })
  transporterDetails: string;

  @Column({ nullable: true })
  salesPersonId: string;

  @Column({ nullable: true })
  purchasePersonId: string;

  @Column({ default: false })
  useSalesEnquiryData: boolean;

  @Column({ default: false })
  isRateFinalized: boolean;

  @Column({ default: true })
  isFreightApplicable: boolean;

  @Column({ default: true })
  isGstApplicable: boolean;

  @Column({ default: false })
  isLabelRequired: boolean;

  @Column({ default: false })
  isImageAvailable: boolean;

  @Column({ default: false })
  isSampleRequired: boolean;

  @Column({ default: false })
  isDesignerRequired: boolean;

  @Column({ default: false })
  isSentToCosting: boolean;

  @Column({ default: false })
  isApproved: boolean;

  @Column({
    type: 'enum',
    enum: PurchaseStatus,
    default: PurchaseStatus.DRAFT,
  })
  status: PurchaseStatus;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  grandTotal: number;

  @Column({ nullable: true })
  currency: string;

  @Column('text', { nullable: true })
  remarks: string;

  @Column('text', { nullable: true })
  approvalRemarks: string;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  approvedAt: Date;

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

  @Column({ nullable: true })
  deletedAt: Date;

  @OneToMany('PurchaseQuoteItem', (item: any) => item.quote)
  items: any[];
}
