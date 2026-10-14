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

export enum BatchStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  QUARANTINE = 'quarantine',
  CLEARED = 'cleared',
  REJECTED = 'rejected',
}

@Entity('inventory_batches')
@Index(['productId', 'batchNumber'], { unique: true })
@Index(['warehouseId'])
@Index(['expiryDate'])
export class InventoryBatch {
  @PrimaryGeneratedColumn('uuid')
  batchId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  productId: string;

  @Column()
  batchNumber: string;

  @Column({ nullable: true })
  warehouseId: string;

  @Column({ nullable: true })
  locationId: string;

  @Column('decimal', { precision: 15, scale: 3, default: 0 })
  quantity: number;

  @Column('decimal', { precision: 15, scale: 3, default: 0 })
  reservedQuantity: number;

  @Column('decimal', { precision: 15, scale: 3, default: 0 })
  availableQuantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  unitCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalValue: number;

  @Column({ nullable: true })
  mfgDate: Date;

  @Column({ nullable: true })
  expiryDate: Date;

  @Column({ nullable: true })
  grnId: string;

  @Column({ nullable: true })
  grnNumber: string;

  @Column({ nullable: true })
  vendorId: string;

  @Column({ nullable: true })
  vendorName: string;

  @Column({ nullable: true })
  purchaseInvoiceId: string;

  @Column({ nullable: true })
  invoiceNumber: string;

  @Column({
    type: 'enum',
    enum: BatchStatus,
    default: BatchStatus.ACTIVE,
  })
  status: BatchStatus;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ nullable: true })
  lastMovementDate: Date;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  deletedAt: Date;
}
