import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PlanType {
  STARTER = 'starter',
  GROWTH = 'growth',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

@Entity('subscription_plans')
@Index(['planCode'], { unique: true })
@Index(['isPublic'])
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  planCode: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: PlanType,
    default: PlanType.STARTER,
  })
  planType: PlanType;

  @Column({ default: 'monthly' })
  defaultBillingCycle: string;

  // Pricing
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monthlyPriceInr: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  yearlyPriceInr: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monthlyPriceUsd: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  yearlyPriceUsd: number;

  // Limits
  @Column({ default: 5 })
  userLimit: number;

  @Column({ default: 1000 })
  storageLimitMb: number;

  @Column({ default: 10000 })
  apiLimitPerMonth: number;

  @Column({ default: 1000 })
  emailLimitPerMonth: number;

  @Column({ default: 100 })
  documentLimitPerMonth: number;

  // Trial
  @Column({ default: 14 })
  trialDays: number;

  @Column({ default: true })
  trialEnabled: boolean;

  // Features
  @Column({ default: true })
  salesEnquiryEnabled: boolean;

  @Column({ default: true })
  purchaseQuoteEnabled: boolean;

  @Column({ default: true })
  priceAnalysisEnabled: boolean;

  @Column({ default: true })
  rateFmsEnabled: boolean;

  @Column({ default: false })
  inventoryEnabled: boolean;

  @Column({ default: false })
  productionEnabled: boolean;

  @Column({ default: false })
  financeEnabled: boolean;

  @Column({ default: true })
  dashboardEnabled: boolean;

  @Column({ default: true })
  reportsEnabled: boolean;

  @Column({ default: false })
  apiAccessEnabled: boolean;

  @Column({ default: false })
  webhookEnabled: boolean;

  @Column({ default: false })
  customDomainEnabled: boolean;

  @Column({ default: false })
  whiteLabelEnabled: boolean;

  @Column({ default: false })
  sandboxEnabled: boolean;

  @Column({ default: false })
  multiBranchEnabled: boolean;

  @Column({ default: false })
  multiCurrencyEnabled: boolean;

  @Column({ default: false })
  advancedAnalyticsEnabled: boolean;

  @Column({ default: false })
  aiAssistantEnabled: boolean;

  // Support
  @Column({ default: 'email' })
  supportSla: string;

  @Column({ default: 24 })
  supportResponseHours: number;

  // Metadata
  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isPublic: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  stripePriceIdMonthly: string;

  @Column({ nullable: true })
  stripePriceIdYearly: string;

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
