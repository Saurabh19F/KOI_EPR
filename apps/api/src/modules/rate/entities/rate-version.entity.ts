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
import { PriceAnalysisStatus } from './price-analysis.entity';

export enum RequoteReason {
  VENDOR_RATE_CHANGE = 'vendor_rate_change',
  CURRENCY_CHANGE = 'currency_change',
  HAULAGE_CHANGE = 'haulage_change',
  CUSTOMER_REQUEST = 'customer_request',
  SALES_REQUEST = 'sales_request',
  MARGIN_REVISION = 'margin_revision',
  QUANTITY_CHANGE = 'quantity_change',
  COMPETITOR_PRICE = 'competitor_price',
  PROFIT_ADJUSTMENT = 'profit_adjustment',
  OTHER = 'other',
}

@Entity('rate_versions')
@Index(['analysisId', 'versionNo'], { unique: false })
export class RateVersion {
  @PrimaryGeneratedColumn('uuid')
  versionId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  analysisId: string;

  @Column()
  analysisNo: string;

  @Column()
  versionNo: number;

  @Column({
    type: 'enum',
    enum: PriceAnalysisStatus,
    default: PriceAnalysisStatus.DRAFT,
  })
  status: PriceAnalysisStatus;

  @Column({
    type: 'enum',
    enum: RequoteReason,
    nullable: true,
  })
  requoteReason: RequoteReason;

  @Column({ nullable: true })
  requoteRemarks: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalPurchaseValue: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalSellingValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  marginPercentage: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalCbm: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  currencyRateUsed: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  haulageUsed: number;

  @Column({ nullable: true })
  currencyUsed: string;

  @Column({ nullable: true })
  haulageLocationUsed: string;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  approvalRemarks: string;

  @Column({ nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  deletedAt: Date;

  // Snapshot of the formula used
  @Column({ type: 'text', nullable: true })
  formulaSnapshot: string;

  // Flag to mark if this is the active version
  @Column({ default: false })
  isActive: boolean;
}
