import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('label_artwork_details')

export class LabelArtwork {
  @PrimaryGeneratedColumn('uuid')
  labelDetailId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ unique: true })
  uniqueCode: string;

  @Column({ nullable: true })
  labelDate: Date;

  @Column({ nullable: true })
  orderNo: string;

  @Column({ nullable: true })
  salesEnquiryOrderId: string;

  @Column({ nullable: true })
  salesEnquiryOrderNo: string;

  @Column({ nullable: true })
  purchaseQuoteId: string;

  @Column({ nullable: true })
  purchaseQuoteItemId: string;

  @Column({ nullable: true })
  partyName: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  productId: string;

  @Column({ nullable: true })
  productCode: string;

  @Column({ nullable: true })
  productName: string;

  @Column('text', { nullable: true })
  productDescription: string;

  @Column({ nullable: true })
  unitSize: string;

  @Column({ nullable: true })
  unitsPerCase: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  totalValue: number;

  @Column('text', { nullable: true })
  remark: string;

  @Column({ default: false })
  itemSelection: boolean;

  @Column({ nullable: true })
  importedBy: string;

  @Column({ nullable: true })
  poi: string; // Place of Origin

  @Column('text', { nullable: true })
  nutrition: string;

  @Column('text', { nullable: true })
  ingredients: string;

  @Column({ nullable: true })
  barcode: string;

  @Column({ nullable: true })
  batchNumber: string;

  @Column({ nullable: true })
  shelfLife: string;

  @Column({ nullable: true })
  mfgDetails: string; // Manufacturing details

  @Column('text', { nullable: true })
  allergenAdvice: string;

  @Column({ nullable: true })
  categoryId: string;

  @Column({ nullable: true })
  purchasePersonId: string;

  @Column({ nullable: true })
  brandId: string;

  @Column({ nullable: true })
  designerId: string;

  @Column({ nullable: true })
  plannedAt: Date;

  @Column({ nullable: true })
  actualAt: Date;

  @Column({ nullable: true })
  delayDays: number;

  @Column({ nullable: true })
  sampleStatus: string;

  @Column({ nullable: true })
  dimensions: string;

  @Column('text', { nullable: true })
  otherInformationIngredients: string;

  @Column({ nullable: true })
  fileUrl: string;

  @Column('text', { nullable: true })
  remarksIfAny: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
