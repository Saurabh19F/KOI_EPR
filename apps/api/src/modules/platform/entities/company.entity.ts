import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CompanyStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
  PENDING = 'pending',
  ONBOARDING = 'onboarding',
}

export enum SubscriptionStatus {
  TRIALING = 'trialing',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

@Entity('companies')
@Index(['slug'], { unique: true })
@Index(['status'])
@Index(['subscriptionStatus'])
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  companyCode: string;

  @Column({ nullable: true })
  slug: string;

  @Column({ nullable: true })
  legalName: string;

  @Column({ nullable: true })
  displayName: string;

  @Column({
    type: 'enum',
    enum: CompanyStatus,
    default: CompanyStatus.PENDING,
  })
  status: CompanyStatus;

  @Column({ default: 'Asia/Kolkata' })
  timezone: string;

  @Column({ default: 'INR' })
  currency: string;

  @Column({ default: 'en-IN' })
  locale: string;

  @Column({ nullable: true })
  industry: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ nullable: true })
  favicon: string;

  @Column({ nullable: true })
  gstNumber: string;

  @Column({ nullable: true })
  panNumber: string;

  @Column({ nullable: true })
  primaryContactName: string;

  @Column({ nullable: true })
  primaryContactEmail: string;

  @Column({ nullable: true })
  primaryContactPhone: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  trialStartsAt: Date;

  @Column({ nullable: true })
  trialEndsAt: Date;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.TRIALING,
  })
  subscriptionStatus: SubscriptionStatus;

  @Column({ nullable: true })
  currentPlanId: string;

  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ nullable: true })
  stripeSubscriptionId: string;

  @Column({ default: false })
  isOnboarded: boolean;

  @Column({ nullable: true })
  onboardedAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @Column({ nullable: true })
  lastActivityAt: Date;

  @Column({ nullable: true })
  maxUsers: number;

  @Column({ nullable: true })
  maxStorageMb: number;

  @Column({ nullable: true })
  deletedAt: Date;

  @Column({ nullable: true })
  deletedBy: string;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
