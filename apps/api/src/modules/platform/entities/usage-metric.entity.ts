import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum MetricType {
  USERS = 'users',
  STORAGE = 'storage',
  API_CALLS = 'api_calls',
  EMAILS_SENT = 'emails_sent',
  DOCUMENTS = 'documents',
  OCR_PAGES = 'ocr_pages',
  AI_TOKENS = 'ai_tokens',
  WORKFLOWS = 'workflows',
  ENQUIRIES = 'enquiries',
  QUOTES = 'quotes',
  LOGINS = 'logins',
}

@Entity('usage_metrics')
@Index(['companyId', 'metricType', 'date'], { unique: true })
@Index(['date'])
export class UsageMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column({
    type: 'enum',
    enum: MetricType,
  })
  metricType: MetricType;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'bigint', default: 0 })
  count: number;

  @Column({ type: 'bigint', default: 0 })
  prevMonthCount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  changePercent: number;

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
