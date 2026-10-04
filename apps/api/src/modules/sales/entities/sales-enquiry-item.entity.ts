import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ItemLineStatus {
  PENDING = 'pending',
  QUOTED = 'quoted',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
}

export enum ProductMasterStatus {
  MASTER_PRODUCT = 'master_product',
  NOT_IN_MASTER = 'not_in_master',
  PENDING_REVIEW = 'pending_review',
  MAPPED = 'mapped',
}

@Entity('sales_enquiry_order_items')
export class SalesEnquiryOrderItem {
  @PrimaryGeneratedColumn('uuid')
  itemId: string;

  @Column({ nullable: true })
  enquiryOrderId: string;

  // NOTE: Removed ManyToOne relations to avoid circular dependency issues
  // Use manual joins in services when needed

  @Column({ nullable: true })
  productId: string;

  // Manual product entry tracking
  @Column({ default: false })
  isManualEntry: boolean;

  // The manual product name entered by sales (before master is created)
  @Column({ nullable: true })
  manualProductName: string;

  // After product master is created, link to the actual master product
  @Column({ nullable: true })
  masterProductId: string;

  // Whether this item has been enriched with master product data
  @Column({ default: false })
  isEnriched: boolean;

  @Column({
    type: 'enum',
    enum: ProductMasterStatus,
    default: ProductMasterStatus.MASTER_PRODUCT,
  })
  masterStatus: ProductMasterStatus;

  @Column({ type: 'int', nullable: true })
  lineNo: number;

  @Column({ nullable: true })
  sku: string;

  @Column({ nullable: true })
  productCode: string;

  @Column({ nullable: true })
  productName: string;

  @Column({ nullable: true, type: 'text' })
  productDescription: string;

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
  uom: string;

  @Column({ nullable: true })
  unitBasis: string;

  @Column({ nullable: true })
  packingSize: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  cbmPerBox: number;

  @Column({ nullable: true })
  unitsPerCase: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  totalCbm: number;

  @Column({ type: 'int', nullable: true })
  quantity: number;

  @Column({ nullable: true })
  purchasePersonId: string;

  @Column({ name: 'purchase_person_name', nullable: true })
  purchasePersonName: string;

  @Column({ name: 'product_purchase_person_name', nullable: true })
  productPurchasePersonName: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  mrp: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  buyingPrice: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  expectedRate: number;

  @Column({ nullable: true })
  expectedCurrency: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  gstPercent: number;

  @Column({
    type: 'enum',
    enum: ItemLineStatus,
    default: ItemLineStatus.PENDING,
  })
  lineStatus: ItemLineStatus;

  @Column({ nullable: true, type: 'text' })
  specialRequirement: string;

  @Column('text', { nullable: true })
  remarks: string;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ name: 'assigned_purchase_user_id', nullable: true })
  assignedPurchaseUserId: string;

  @Column({ name: 'purchase_status', nullable: true })
  purchaseStatus: string;

  @Column({ name: 'purchase_submitted_at', nullable: true })
  purchaseSubmittedAt: Date;

  @Column({ name: 'purchase_reviewed_at', nullable: true })
  purchaseReviewedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  deletedAt: Date;
}
