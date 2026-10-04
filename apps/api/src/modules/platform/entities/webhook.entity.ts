import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum WebhookStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  FAILED = 'failed',
}

@Entity('webhooks')
@Index(['companyId'])
export class Webhook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  url: string;

  @Column()
  secret: string;

  @Column({ default: 'HMAC-SHA256' })
  signingAlgorithm: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  includeHeaders: boolean;

  @Column({ nullable: true })
  events: string;

  @Column({ nullable: true })
  headers: string;

  @Column({ nullable: true })
  retryPolicy: string;

  @Column({ type: 'int', default: 3 })
  maxRetries: number;

  @Column({ type: 'int', default: 1000 })
  timeoutMs: number;

  @Column({ nullable: true })
  userId: string;

  @Column({ default: false })
  isSystem: boolean;

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
