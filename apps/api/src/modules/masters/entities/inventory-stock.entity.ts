import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('inventory_stock')

export class InventoryStock {
  @PrimaryGeneratedColumn('uuid')
  stockId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ nullable: true })
  productId: string;

  @Column()
  sku: string;

  @Column({ name: 'location_id', nullable: true })
  warehouseId: string;

  @Column('decimal', { precision: 15, scale: 3, default: 0 })
  currentStock: number;

  @Column('decimal', { precision: 15, scale: 3, default: 0 })
  reorderLevel: number;

  @Column('decimal', { precision: 15, scale: 3, default: 0 })
  maxStockLevel: number;

  @Column({ default: 90 })
  slowMovingDays: number;

  @Column({ default: 180 })
  deadStockDays: number;

  @Column('decimal', { precision: 15, scale: 3, default: 0 })
  damagedQuantity: number;

  @Column({ default: 'normal' })
  stockStatus: string; // 'normal', 'slow_moving', 'dead_stock', 'damaged_stock'

  @Column({ nullable: true })
  lastMovementDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Stock Statuses:
// normal       - Stock moving normally
// slow_moving  - Not sold in slow_moving_days
// dead_stock   - Not sold in dead_stock_days
// damaged_stock - Physically damaged
