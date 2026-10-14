import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('purchase_landing_cost_by_location')

export class PurchaseLandingCost {
  @PrimaryGeneratedColumn('uuid')
  landingCostId: string;

  @Column({ nullable: true })
  quoteId: string;

  @Column({ nullable: true })
  quoteItemId: string;

  @Column()
  location: string; // DELHI, MUMBAI

  // Freight
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  freightCost: number;

  @Column({ nullable: true })
  freightPerCbm: number;

  @Column({ nullable: true })
  freightCurrency: string;

  // GST
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  gstPercent: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  gstAmount: number;

  // Insurance
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  insuranceCost: number;

  // Handling
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  handlingCost: number;

  // Other charges
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  otherCharges: number;

  @Column('text', { nullable: true })
  otherChargesDescription: string;

  // Total
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  totalLandingCost: number;

  // Tracking
  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
