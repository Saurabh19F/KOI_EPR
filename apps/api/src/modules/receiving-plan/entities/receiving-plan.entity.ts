import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ReceivingPlanStatus {
  PENDING = 'pending',
  PARTIALLY_RECEIVED = 'partially_received',
  RECEIVED = 'received',
  CANCELLED = 'cancelled',
}

@Entity('receiving_plans')
@Index(['planNumber'], { unique: true })
@Index(['companyId', 'purchaseOrderId'])
@Index(['companyId', 'warehouseId'])
export class ReceivingPlan {
  @PrimaryGeneratedColumn('uuid')
  planId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ unique: true })
  planNumber: string;

  @Column({ nullable: true })
  purchaseOrderId: string;

  @Column({ nullable: true })
  poNumber: string;

  @Column()
  productId: string;

  @Column()
  productName: string;

  @Column()
  warehouseId: string;

  @Column()
  warehouseName: string;

  @Column({ type: 'decimal', precision: 15, scale: 3 })
  plannedQty: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 })
  totalReceivedQty: number;

  @Column({ type: 'enum', enum: ReceivingPlanStatus, default: ReceivingPlanStatus.PENDING })
  status: ReceivingPlanStatus;

  @Column({ nullable: true })
  plannedBy: string;

  @Column({ nullable: true })
  plannedByUserId: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
