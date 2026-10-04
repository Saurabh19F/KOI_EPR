import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum VendorQuoteStatus {
  PENDING = 'pending',
  RECEIVED = 'received',
  COMPARED = 'compared',
  SELECTED = 'selected',
  REJECTED = 'rejected',
}

@Entity('vendor_quotes')
export class VendorQuote {
  @PrimaryGeneratedColumn('uuid')
  vendorQuoteId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ nullable: true })
  quoteId: string;

  @Column({ nullable: true })
  quoteItemId: string;

  @Column({ nullable: true })
  productId: string;

  @Column({ nullable: true })
  vendorId: string;

  @Column({ nullable: true })
  sku: string;

  @Column({ nullable: true })
  productName: string;

  @Column({ nullable: true })

  @Column({ nullable: true })
  vendorName: string;

  @Column({ nullable: true })
  vendorQuoteNo: string;

  @Column({ nullable: true })
  quoteDate: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  quotedRate: number;

  @Column({ nullable: true })
  quotedCurrency: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  gstPercent: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  freight: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  landingCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  totalAmount: number;

  @Column({ type: 'int', nullable: true })
  quantity: number;

  @Column({ type: 'int', nullable: true })
  moq: number;

  @Column({ type: 'int', nullable: true })
  leadTimeDays: number;

  @Column({ nullable: true })
  deliveryDate: Date;

  @Column({ nullable: true })
  rateValidity: Date;

  @Column({ nullable: true })
  deliveryTerms: string;

  @Column({ nullable: true })
  paymentTermsId: string;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  currencyRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  discountPercent: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  otherCharges: number;

  @Column('text', { nullable: true })
  notes: string;

  @Column('text', { nullable: true })
  termsConditions: string;

  @Column({ nullable: true })
  attachmentUrl: string;

  @Column({ nullable: true })
  attachmentName: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  rateRank: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  vsBestRatePercent: number;

  @Column({
    type: 'enum',
    enum: VendorQuoteStatus,
    default: VendorQuoteStatus.PENDING,
  })
  status: VendorQuoteStatus;

  @Column({ default: false })
  isBestQuote: boolean;

  @Column({ default: false })
  isSelected: boolean;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column('text', { nullable: true })
  approvalRemarks: string;

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
