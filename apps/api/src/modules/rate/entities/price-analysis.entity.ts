import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PriceAnalysisStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  CALCULATED = 'calculated',
  APPROVAL_PENDING = 'approval_pending',
  APPROVED = 'approved',
  LOCKED = 'locked',
  REJECTED = 'rejected',
}

@Entity('price_analysis_master')
@Index(['analysisNo'], { unique: true })
export class PriceAnalysis {
  @PrimaryGeneratedColumn('uuid')
  analysisId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ unique: true })
  analysisNo: string;

  @Column({ nullable: true })
  analysisDate: Date;

  @Column({ nullable: true })
  enquiryOrderId: string;

  @Column({ nullable: true })
  enquiryOrderNo: string;

  @Column({ nullable: true })
  purchaseQuoteId: string;

  @Column({ nullable: true })
  purchaseQuoteNo: string;

  @Column({ nullable: true })
  customerId: string;

  @Column({ nullable: true })
  buyerCode: string;

  @Column({ nullable: true })
  customerName: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  pod: string;

  @Column({ nullable: true })
  paymentTermsId: string;

  @Column({ nullable: true })
  currencyId: string;

  @Column({ nullable: true })
  portOfLoading: string;

  @Column({ nullable: true })
  costingPersonId: string;

  @Column({ nullable: true })
  salesPersonId: string;

  @Column({ nullable: true })
  purchaseTeamStatus: string;

  @Column({ default: false })
  usePurchaseRate: boolean;

  @Column({ default: false })
  usePreviousYearData: boolean;

  @Column({ default: true })
  isFreightApplicable: boolean;

  @Column({ default: true })
  isHaulageApplicable: boolean;

  @Column({ default: true })
  isGstApplicable: boolean;

  @Column({ default: true })
  isMarginApplicable: boolean;

  @Column({ default: false })
  isCurrencyConversionRequired: boolean;

  @Column({ default: false })
  isRateRounded: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  gbpRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  gbpMargin: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  gbpFinalRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  usdRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  usdMargin: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  usdFinalRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  cadRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  cadMargin: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  cadFinalRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  audRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  audMargin: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  audFinalRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  euroRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  euroMargin: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  euroFinalRate: number;

  @Column({ nullable: true })
  excelFileUrl: string;

  @Column({ nullable: true })
  pdfFileUrl: string;

  @Column({
    type: 'enum',
    enum: PriceAnalysisStatus,
    default: PriceAnalysisStatus.DRAFT,
  })
  status: PriceAnalysisStatus;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  totalPurchaseValue: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  totalSellingValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalMargin: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  totalCbm: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  totalHaulage: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, default: 100 })
  freightUSD: number;

  @Column({ nullable: true })
  haulageLocation: string;

  @Column({ type: 'int', nullable: true })
  containerSize: number;

  @Column({ nullable: true, type: 'text' })
  remarks: string;

  @Column({ nullable: true, type: 'text' })
  internalNotes: string;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column('text', { nullable: true })
  approvalRemarks: string;

  // ========== REQUOTE CHAIN ==========
  // Points to the PA this was requoted FROM (null for originals)
  @Column({ nullable: true })
  parentAnalysisId: string;

  // The root/original PA in the requote chain (same for all versions)
  @Column({ nullable: true })
  rootAnalysisId: string;

  // Version number in the requote chain (1 = original, 2 = first requote, etc.)
  @Column({ type: 'int', default: 1 })
  requoteVersion: number;

  // Reason for this requote
  @Column({ nullable: true })
  requoteReason: string;

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
}
