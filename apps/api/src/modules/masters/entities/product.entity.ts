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
import { ProductCategory } from './product-category.entity';
import { Segment } from './segment.entity';
import { Brand } from './brand.entity';
import { Uom } from './uom.entity';
import { GstRate } from './gst-rate.entity';

export enum StockStatus {
  NORMAL = 'normal',
  SLOW_MOVING = 'slow_moving',
  DEAD_STOCK = 'dead_stock',
  DAMAGED = 'damaged',
}

export enum UnitBasis {
  PER_PC = 'per_pc',
  PER_KG = 'per_kg',
}

export enum ProductStatus {
  PENDING_REVIEW = 'pending_review',  // Manual entry, needs Purchase review
  PENDING_MIS_REVIEW = 'pending_mis_review', // Needs MIS validation
  ACTIVE = 'active',                 // Approved and active
  INACTIVE = 'inactive',             // Deactivated
}

export enum ProductSource {
  MASTER = 'master',   // Created directly in product master
  MANUAL = 'manual',   // Entered via sales enquiry
}

@Entity('products')
@Index(['sku'], { unique: true })
@Index(['productCode'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  productId: string;

  @Column({ nullable: true })
  companyId: string;

  // SKU / Part Number - Auto-generated: CCC-SS-GGG-NNN format
  @Column({ unique: true })
  sku: string;

  @Column({ nullable: true })
  productCode: string;

  @Column()
  productName: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  // Product Type
  @Column({ nullable: true })
  productType: string;

  // Foreign Keys
  @Column({ name: 'category_id', nullable: true, type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => ProductCategory, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: ProductCategory;

  @Column({ name: 'segment_id', nullable: true, type: 'uuid' })
  segmentId: string;

  @ManyToOne(() => Segment, { nullable: true })
  @JoinColumn({ name: 'segment_id' })
  segment: Segment;

  @Column({ nullable: true })
  groupId: string;

  @Column({ name: 'brand_id', nullable: true, type: 'uuid' })
  brandId: string;

  @ManyToOne(() => Brand, { nullable: true })
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @Column({ name: 'uom_id', nullable: true, type: 'uuid' })
  uomId: string;

  @ManyToOne(() => Uom, { nullable: true })
  @JoinColumn({ name: 'uom_id' })
  uom: Uom;

  @Column({ name: 'gst_rate_id', nullable: true, type: 'uuid' })
  gstRateId: string;

  @ManyToOne(() => GstRate, { nullable: true })
  @JoinColumn({ name: 'gst_rate_id' })
  gstRate: GstRate;


  // Physical Properties
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cbmPerBox: number;

  @Column({ nullable: true })
  unitsPerCase: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalCbm: number;

  @Column({ nullable: true })
  dimensions: string;

  @Column({ nullable: true })
  barcode: string;

  @Column({ nullable: true })
  hsCode: string;

  // Unit Type / Unit Basis
  @Column({
    type: 'enum',
    enum: UnitBasis,
    nullable: true,
  })
  unitBasis: UnitBasis;

  @Column({ nullable: true })
  packingSize: number;

  // Cost Information
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  mrp: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  standardCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  buyingPrice: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  landingCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  lastPurchaseRate: number;

  @Column({ nullable: true })
  lastPurchaseDate: Date;

  // Purchase Person Assignment
  @Column({ nullable: true })
  purchasePersonId: string;

  @Column({ nullable: true })
  purchasePersonName: string;

  // Conversion Ratio
  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  conversionRatio: number;

  // Stock Classification
  @Column({
    type: 'enum',
    enum: StockStatus,
    default: StockStatus.NORMAL,
  })
  stockStatus: StockStatus;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  currentStock: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  reorderLevel: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  maxStockLevel: number;

  @Column({ type: 'int', nullable: true })
  slowMovingDays: number;

  @Column({ type: 'int', nullable: true })
  deadStockDays: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  damagedQty: number;

  @Column({ nullable: true })
  lastMovementDate: Date;

  // Location
  @Column({ nullable: true })
  locationId: string;

  // Legacy/Integration Fields
  @Column({ nullable: true })
  formEditUrl: string;

  @Column({ nullable: true })
  template1SendStatus: string;

  // Status
  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isDiscontinued: boolean;

  // Product Review Workflow
  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.PENDING_REVIEW,
  })
  productStatus: ProductStatus;

  @Column({
    type: 'enum',
    enum: ProductSource,
    default: ProductSource.MASTER,
  })
  source: ProductSource;

  // Manual product temporary name (before SKU is assigned)
  @Column({ nullable: true })
  tempProductName: string;

  // Original enquiry that triggered this product
  @Column({ nullable: true })
  sourceEnquiryId: string;

  @Column({ nullable: true })
  sourceEnquiryNo: string;

  // Review audit trail
  @Column({ nullable: true })
  reviewedBy: string;

  @Column({ nullable: true })
  reviewedAt: Date;

  @Column({ nullable: true })
  misReviewedBy: string;

  @Column({ nullable: true })
  misReviewedAt: Date;

  // Remap from old enquiry items
  @Column({ nullable: true })
  originalEnquiryItemId: string;

  // Image & Documents
  @Column({ nullable: true })
  imageUrl: string;

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

  @Column({ name: 'unit_size', nullable: true })
  unitSize: string;

  @Column({ name: 'case_no', nullable: true })
  caseNo: string;

  @Column({ name: 'alias_name', nullable: true })
  aliasName: string;

  // Transient / Integration fields (not persisted in DB)
  unitsPerCarton?: number;
  remarks?: string;
}
