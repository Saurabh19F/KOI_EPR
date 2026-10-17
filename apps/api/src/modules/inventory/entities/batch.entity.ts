import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum BatchStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  QUARANTINE = 'quarantine',
  CLEARED = 'cleared',
  REJECTED = 'rejected',
}

@Entity('inventory_batches')
@Index(['batchNumber'], { unique: true })
@Index(['productId', 'batchNumber'])
@Index(['warehouseId'])
@Index(['expiryDate'])
export class InventoryBatch {
  @PrimaryGeneratedColumn('uuid')
  batchId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ unique: true })
  batchNumber: string;

  @Column()
  productId: string;

  @Column({ nullable: true })
  productName: string;

  @Column({ nullable: true })
  warehouseId: string;

  @Column({ nullable: true })
  warehouseName: string;

  @Column({ nullable: true })
  locationId: string;

  @Column({ nullable: true })
  locationName: string;

  @Column({ nullable: true })
  manufacturingDate: Date;

  @Column({ nullable: true })
  expiryDate: Date;

  @Column({ type: 'decimal', precision: 18, scale: 3, default: 0 })
  quantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 3, default: 0 })
  reservedQuantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 })
  availableQuantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  unitCost: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalCost: number;

  @Column({ nullable: true })
  vendorId: string;

  @Column({ nullable: true })
  vendorName: string;

  @Column({ nullable: true })
  purchaseOrderId: string;

  @Column({ nullable: true })
  grnId: string;

  @Column({ nullable: true })
  grnNumber: string;

  @Column({ nullable: true })
  invoiceNumber: string;

  @Column({ nullable: true })
  mfgLicenseNumber: string;

  @Column({ nullable: true })
  barcode: string;

  @Column({
    type: 'enum',
    enum: BatchStatus,
    default: BatchStatus.ACTIVE,
  })
  status: BatchStatus;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ nullable: true })
  lastMovementDate: Date;

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
