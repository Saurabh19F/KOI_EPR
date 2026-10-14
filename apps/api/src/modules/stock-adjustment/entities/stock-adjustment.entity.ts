import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('stock_adjustment_logs')
@Index(['companyId', 'warehouseId'])
@Index(['companyId', 'productId'])
export class StockAdjustmentLog {
  @PrimaryGeneratedColumn('uuid')
  adjustmentId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ type: 'date' })
  date: Date;

  @Column()
  productId: string;

  @Column({ nullable: true })
  productName: string;

  @Column()
  warehouseId: string;

  @Column({ nullable: true })
  warehouseName: string;

  @Column('decimal', { precision: 15, scale: 3 })
  adjustedQty: number;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ nullable: true })
  adjustedBy: string;

  @Column({ nullable: true })
  adjustedByUserId: string;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
