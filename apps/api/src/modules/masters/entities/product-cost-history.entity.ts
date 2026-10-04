import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('product_cost_history')

export class ProductCostHistory {
  @PrimaryGeneratedColumn('uuid')
  historyId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  productId: string;

  @Column({ nullable: true })
  vendorId: string;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  costPrice: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  landingCost: number;

  @Column({ nullable: true })
  effectiveFrom: Date;

  @Column({ nullable: true })
  effectiveTo: Date;

  @Column({ nullable: true })
  reason: string; // 'Rate revision', 'Vendor change'

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
