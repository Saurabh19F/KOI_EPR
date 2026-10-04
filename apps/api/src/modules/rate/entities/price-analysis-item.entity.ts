import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum PriceAnalysisItemStatus {
  PENDING = 'pending',
  CALCULATED = 'calculated',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('price_analysis_items')
export class PriceAnalysisItem {
  @PrimaryGeneratedColumn('uuid')
  itemId: string;

  @Column({ nullable: true })
  analysisId: string;

  @Column({ nullable: true })
  quoteId: string;

  @Column({ nullable: true })
  quoteItemId: string;

  @Column({ nullable: true })
  enquiryItemId: string;

  @Column({ type: 'int', nullable: true })
  lineNo: number;

  @Column({ nullable: true })
  sku: string;

  @Column({ nullable: true })
  productCode: string;

  @Column({ nullable: true })
  categoryId: string;

  @Column({ nullable: true })
  categoryName: string;

  @Column({ nullable: true })
  productName: string;

  @Column({ nullable: true, type: 'text' })
  productDescription: string;

  @Column({ nullable: true })
  brandId: string;

  @Column({ nullable: true })
  brandName: string;

  @Column({ nullable: true })
  unitSize: string;

  @Column({ nullable: true })
  unitsPerCase: number;

  @Column({ nullable: true })
  packingType: string;

  @Column({ nullable: true })
  unitBasis: string;

  @Column({ nullable: true })
  packingSize: number;

  @Column({ type: 'int', nullable: true })
  orderQuantity: number;

  @Column({ nullable: true })
  purchasePersonId: string;

  @Column({ nullable: true })
  purchasePersonName: string;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  cbmPerBox: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  totalCbm: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  mrp: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  buyingPrice: number;

  @Column({ nullable: true })
  purchaseCurrency: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  buyingBestLandingRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  gstPercent: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  gstAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  perPcRateWithoutGst: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  landingCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  tax: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  otherCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  gstCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  totalRatePerBox: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  rateWithGstCost: number;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  bestLandingLocation: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  haulageDelhi: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  haulageMumbai: number;

  @Column({ nullable: true })
  selectedHaulageLocation: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  selectedHaulage: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  freightCost: number;

  @Column({ nullable: true })
  targetCurrency: string;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  currencyRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  currencyMargin: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  finalCurrencyRate: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  finalPriceInForeignCurrency: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  ratePerCarton: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  cbmCostPerBoxInSelectedCurrency: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  finalRate: number;

  @Column({ nullable: true })
  finalCurrency: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  marginPercent: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  finalSellingRate: number;

  @Column({ nullable: true, type: 'text' })
  remark: string;

  @Column({
    type: 'enum',
    enum: PriceAnalysisItemStatus,
    default: PriceAnalysisItemStatus.PENDING,
  })
  status: PriceAnalysisItemStatus;

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
