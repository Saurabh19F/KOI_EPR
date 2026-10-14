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

export enum MovementType {
  PURCHASE_RECEIPT = 'purchase_receipt',
  SALES_ISSUE = 'sales_issue',
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out',
  ADJUSTMENT_IN = 'adjustment_in',
  ADJUSTMENT_OUT = 'adjustment_out',
  DAMAGE = 'damage',
  RETURN_IN = 'return_in',
  RETURN_OUT = 'return_out',
}

@Entity('stock_movements')


export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  movementId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  productId: string;

  @Column()
  warehouseId: string;

  @Column({ nullable: true })
  locationId: string;

  @Column({
    type: 'enum',
    enum: MovementType,
  })
  movementType: MovementType;

  @Column('decimal', { precision: 15, scale: 3 })
  quantity: number;

  @Column('decimal', { precision: 15, scale: 3, default: 0 })
  quantityBefore: number;

  @Column('decimal', { precision: 15, scale: 3, default: 0 })
  quantityAfter: number;

  @Column({ nullable: true })
  referenceType: string; // 'purchase_order', 'sales_order', 'transfer', 'adjustment'

  @Column({ nullable: true })
  referenceId: string;

  @Column({ nullable: true })
  referenceNo: string;

  @Column({ nullable: true })
  batchNumber: string;

  @Column({ nullable: true })
  expiryDate: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  unitCost: number;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ nullable: true })
  performedBy: string;



  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
