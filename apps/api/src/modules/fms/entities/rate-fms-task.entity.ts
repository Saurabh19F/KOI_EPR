import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('rate_fms_tasks')

export class RateFMSTask {
  @PrimaryGeneratedColumn('uuid')
  taskId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ unique: true })
  uniqueKey: string; // RATEFMS-ENQ-149-SKU001-AMIT-ACT01

  @Column({ nullable: true })
  fmsId: string;

  @Column({ nullable: true })
  stepId: string;

  @Column({ nullable: true })
  stepCode: string; // ACT01

  @Column({ nullable: true })
  enquiryOrderId: string;

  @Column({ nullable: true })
  enquiryOrderNo: string;

  @Column({ nullable: true })
  enquiryDate: Date;

  @Column({ nullable: true })
  salesPersonId: string;

  @Column({ nullable: true })
  salesPersonName: string;

  @Column({ nullable: true })
  buyerCode: string;

  @Column({ nullable: true })
  customerId: string;

  @Column({ nullable: true })
  productId: string;

  @Column({ nullable: true })
  productCode: string;

  @Column({ nullable: true })
  productDescription: string;

  @Column({ nullable: true })
  brandId: string;

  @Column({ nullable: true })
  productName: string;

  @Column({ nullable: true })
  unitSize: string;

  @Column({ nullable: true })
  unitsPerCase: number;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  cbm: number;

  @Column({ nullable: true })
  quantity: number;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  totalCbm: number;

  @Column({ nullable: true })
  purchasePersonId: string;

  @Column({ nullable: true })
  purchasePersonName: string;

  @Column('text', { nullable: true })
  remarks: string;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  oldRate: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  currentRate: number;

  @Column({ nullable: true })
  vendorId: string;

  @Column({ nullable: true })
  vendorName: string;

  @Column({ nullable: true })
  plannedAt: Date;

  @Column({ nullable: true })
  actualAt: Date;

  @Column({ nullable: true })
  delayDays: number;

  @Column({ default: 'pending' })
  status: string; // pending, assigned, in_progress, rate_received, updated, completed, delayed

  @Column({ nullable: true })
  source: string;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
