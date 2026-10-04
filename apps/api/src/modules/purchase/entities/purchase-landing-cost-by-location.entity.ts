import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('purchase_landing_cost_by_location')

export class PurchaseLandingCostByLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  purchaseQuoteItemId: string;

  @Column()
  location: string; // 'Delhi', 'Mumbai'

  @Column('decimal', { precision: 15, scale: 2 })
  landingCost: number;

  @Column({ default: false })
  isBestRate: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
