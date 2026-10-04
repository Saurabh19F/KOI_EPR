import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum AnnouncementType {
  INFO = 'info',
  WARNING = 'warning',
  MAINTENANCE = 'maintenance',
  UPDATE = 'update',
  PROMOTIONAL = 'promotional',
}

export enum AnnouncementTarget {
  ALL = 'all',
  SPECIFIC_PLANS = 'specific_plans',
  SPECIFIC_COMPANIES = 'specific_companies',
  TRIALING = 'trialing',
  PAST_DUE = 'past_due',
}

@Entity('announcements')
@Index(['type'])
@Index(['isActive'])
export class Announcement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({
    type: 'enum',
    enum: AnnouncementType,
    default: AnnouncementType.INFO,
  })
  type: AnnouncementType;

  @Column({
    type: 'enum',
    enum: AnnouncementTarget,
    default: AnnouncementTarget.ALL,
  })
  target: AnnouncementTarget;

  @Column({ nullable: true })
  targetPlans: string;

  @Column({ nullable: true })
  targetCompanies: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isPublished: boolean;

  @Column({ nullable: true })
  publishedAt: Date;

  @Column({ nullable: true })
  publishedBy: string;

  @Column({ nullable: true })
  startsAt: Date;

  @Column({ nullable: true })
  endsAt: Date;

  @Column({ default: false })
  showOnDashboard: boolean;

  @Column({ default: false })
  showOnLogin: boolean;

  @Column({ default: true })
  dismissible: boolean;

  @Column({ default: false })
  sticky: boolean;

  @Column({ nullable: true })
  actionUrl: string;

  @Column({ nullable: true })
  actionLabel: string;

  @Column({ default: 0 })
  sortOrder: number;

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
