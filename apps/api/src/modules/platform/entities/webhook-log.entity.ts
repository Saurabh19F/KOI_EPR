import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum WebhookDeliveryStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  RETRYING = 'retrying',
}

@Entity('webhook_logs')
@Index(['webhookId'])
@Index(['status'])
@Index(['createdAt'])
export class WebhookLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  webhookId: string;

  @Column()
  companyId: string;

  @Column()
  event: string;

  @Column({ type: 'text' })
  payload: string;

  @Column({ nullable: true })
  response: string;

  @Column({ type: 'int', nullable: true })
  responseStatusCode: number;

  @Column({
    type: 'enum',
    enum: WebhookDeliveryStatus,
    default: WebhookDeliveryStatus.PENDING,
  })
  status: WebhookDeliveryStatus;

  @Column({ type: 'int', default: 0 })
  attemptNumber: number;

  @Column({ type: 'int', default: 0 })
  totalAttempts: number;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ nullable: true })
  errorCode: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  durationMs: number;

  @Column({ nullable: true })
  nextRetryAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

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
