import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum SubscriptionBillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

@Entity('subscriptions')
@Index(['companyId'])
@Index(['status'])
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column({ nullable: true })
  planId: string;

  @Column({
    type: 'enum',
    enum: ['trialing', 'active', 'past_due', 'suspended', 'cancelled', 'expired'],
    default: 'trialing',
  })
  status: string;

  @Column({
    type: 'enum',
    enum: SubscriptionBillingCycle,
    default: SubscriptionBillingCycle.MONTHLY,
  })
  billingCycle: SubscriptionBillingCycle;

  @Column({ type: 'timestamp', nullable: true })
  currentPeriodStart: Date;

  @Column({ type: 'timestamp', nullable: true })
  currentPeriodEnd: Date;

  @Column({ type: 'timestamp', nullable: true })
  trialStart: Date;

  @Column({ type: 'timestamp', nullable: true })
  trialEnd: Date;

  @Column({ default: false })
  trialConverted: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalAmount: number;

  @Column({ default: 'INR' })
  currency: string;

  @Column({ nullable: true })
  couponId: string;

  @Column({ nullable: true })
  stripeSubscriptionId: string;

  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ nullable: true })
  stripePriceId: string;

  @Column({ nullable: true })
  paymentMethodId: string;

  @Column({ nullable: true })
  cardLast4: string;

  @Column({ nullable: true })
  cardBrand: string;

  @Column({ default: false })
  autoRenew: boolean;

  @Column({ nullable: true })
  cancelledAt: Date;

  @Column({ nullable: true })
  cancelledBy: string;

  @Column({ nullable: true })
  cancelReason: string;

  @Column({ default: false })
  cancelledImmediately: boolean;

  @Column({ nullable: true })
  pausedAt: Date;

  @Column({ nullable: true })
  pausedBy: string;

  @Column({ nullable: true })
  resumeAt: Date;

  @Column({ nullable: true })
  failedPaymentAttempts: number;

  @Column({ nullable: true })
  nextRetryAt: Date;

  @Column({ nullable: true })
  metadata: string;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
