import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum CustomerType {
  DOMESTIC = 'domestic',
  EXPORT = 'export',
  DISTRIBUTOR = 'distributor',
  RETAILER = 'retailer',
}

export enum CustomerCategory {
  A = 'A',
  B = 'B',
  C = 'C',
  KEY_ACCOUNT = 'key_account',
}

@Entity('customers')
@Index(['buyerCode'], { unique: true })
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  customerId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ unique: true })
  buyerCode: string;

  @Column()
  customerName: string;

  @Column({ nullable: true })
  contactPerson: string;

  @Column({ nullable: true })
  contactNumber: string;

  @Column({ nullable: true })
  mobile: string;

  @Column({ nullable: true })
  alternateContact: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  alternateEmail: string;

  @Column({ nullable: true })
  whatsappNumber: string;

  @Column({ nullable: true })
  website: string;

  @Column({
    type: 'enum',
    enum: CustomerType,
    nullable: true,
  })
  customerType: CustomerType;

  @Column({
    type: 'enum',
    enum: CustomerCategory,
    nullable: true,
  })
  customerCategory: CustomerCategory;

  @Column({
    type: 'enum',
    enum: CustomerStatus,
    default: CustomerStatus.ACTIVE,
  })
  status: CustomerStatus;

  @Column({ nullable: true })
  countryId: string;

  // NOTE: Removed ManyToOne relations to avoid circular dependency issues
  // Use manual joins in services when needed

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  pinCode: string;

  @Column({ nullable: true, type: 'text' })
  billingAddress: string;

  @Column({ nullable: true })
  billingCity: string;

  @Column({ nullable: true })
  billingState: string;

  @Column({ nullable: true })
  billingCountry: string;

  @Column({ nullable: true })
  billingPincode: string;

  @Column({ nullable: true })
  isBillingSameAsDelivery: boolean;

  @Column({ nullable: true, type: 'text' })
  deliveryAddress: string;

  @Column({ nullable: true })
  deliveryCity: string;

  @Column({ nullable: true })
  deliveryState: string;

  @Column({ nullable: true })
  deliveryCountry: string;

  @Column({ nullable: true })
  deliveryPincode: string;

  @Column({ nullable: true })
  productZone: string;

  @Column({ nullable: true })
  pod: string;

  @Column({ nullable: true })
  portOfLoading: string;

  @Column({ nullable: true })
  paymentTermsId: string;

  // NOTE: Removed ManyToOne to PaymentTerms

  @Column({ nullable: true })
  currencyId: string;

  // NOTE: Removed ManyToOne to Currency

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  creditLimit: number;

  @Column({ type: 'int', nullable: true })
  creditDays: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  openingBalance: number;

  @Column({ nullable: true })
  gstNumber: string;

  @Column({ nullable: true })
  panNumber: string;

  @Column({ nullable: true })
  tinNumber: string;

  @Column({ nullable: true })
  ieCode: string;

  @Column({ nullable: true })
  salesPersonId: string;

  @Column({ nullable: true })
  shippingTerms: string;

  @Column({ nullable: true })
  incoterms: string;

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

  // Status
  @Column({ default: true })
  isActive: boolean;
}
