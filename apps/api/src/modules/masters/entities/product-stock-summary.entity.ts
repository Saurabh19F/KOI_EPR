import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('product_stock_summary')

export class ProductStockSummary {
  @PrimaryGeneratedColumn('uuid')
  summaryId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  productId: string;

  @Column()
  locationId: string;

  @Column('decimal', { precision: 15, scale: 3, default: 0 })
  openingQty: number;

  @Column('decimal', { precision: 15, scale: 3, default: 0 })
  inQty: number;

  @Column('decimal', { precision: 15, scale: 3, default: 0 })
  outQty: number;

  @Column('decimal', { precision: 15, scale: 3, default: 0 })
  reservedQty: number;

  @Column('decimal', { precision: 15, scale: 3, default: 0 })
  closingQty: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  avgCost: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  stockValue: number;

  @Column({ nullable: true })
  lastStockUpdate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
