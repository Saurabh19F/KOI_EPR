import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PurchaseQuote } from './purchase-quote.entity';

@Entity('purchase_quote_items')
export class PurchaseQuoteItem {
  @PrimaryGeneratedColumn('uuid')
  itemId: string;
  @Column({ name: 'quote_id', nullable: true })
  quoteId: string;

  @Column({ nullable: true })
  enquiryItemId: string;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId: string;

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
  brandId: string;

  @Column({ nullable: true })
  brandName: string;

  @Column({ nullable: true })
  productName: string;

  @Column({ nullable: true, type: 'text' })
  productDescription: string;

  @Column({ nullable: true })
  unitSize: string;

  @Column({ nullable: true })
  unitPerCarton: number;

  @Column({ nullable: true })
  uom: string;

  @Column({ nullable: true })
  unitBasis: string;

  @Column({ nullable: true })
  packingType: string;

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

  @Column({ type: 'int', nullable: true })
  moq: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  mrp: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  buyingPrice: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  gstPercent: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  freight: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  otherCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  gstCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  landingCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  landingCostDelhi: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  totalValue: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  ratePerCarton: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  finalPriceInForeignCurrency: number;

  @Column({ nullable: true })
  vendorId: string;

  @Column({ nullable: true })
  vendorName: string;

  @Column({ nullable: true })
  vendorQuoteNo: string;

  @Column({ nullable: true })
  vendorQuoteDate: Date;

  @Column({ type: 'int', nullable: true })
  leadTimeDays: number;

  @Column({ nullable: true })
  rateValidity: Date;

  @Column({ nullable: true })
  vendorCurrency: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  vendorRate: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  vendorTotal: number;

  @Column({ nullable: true })
  vendorAttachmentUrl: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  bestLandingLocation: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  bestLandingCost: number;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true, type: 'text' })
  remark: string;

  @Column({ nullable: true, type: 'text' })
  remarks: string;

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

  @ManyToOne('PurchaseQuote', (quote: any) => quote.items)
  @JoinColumn({ name: 'quote_id' })
  quote: any;
}
