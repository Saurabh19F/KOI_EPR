import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ProvisioningStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum ProvisioningTask {
  CREATE_COMPANY = 'create_company',
  CREATE_DEFAULT_ROLES = 'create_default_roles',
  CREATE_ADMIN_USER = 'create_admin_user',
  SEED_NUMBER_SERIES = 'seed_number_series',
  SEED_SETTINGS = 'seed_settings',
  SEED_EMAIL_TEMPLATES = 'seed_email_templates',
  SEED_WORKFLOW_TEMPLATES = 'seed_workflow_templates',
  SEED_SUBSCRIPTION = 'seed_subscription',
  SEED_BRANDING = 'seed_branding',
  SEED_MASTERS = 'seed_masters',
  SEND_WELCOME_EMAIL = 'send_welcome_email',
}

@Entity('provisioning_jobs')
@Index(['companyId'])
@Index(['status'])
export class ProvisioningJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  jobId: string;

  @Column({
    type: 'enum',
    enum: ProvisioningStatus,
    default: ProvisioningStatus.PENDING,
  })
  status: ProvisioningStatus;

  @Column({ type: 'int', default: 0 })
  totalTasks: number;

  @Column({ type: 'int', default: 0 })
  completedTasks: number;

  @Column({ type: 'int', default: 0 })
  failedTasks: number;

  @Column({ nullable: true })
  currentTask: string;

  @Column({ nullable: true })
  completedSteps: string;

  @Column({ nullable: true })
  failedSteps: string;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  retryCount: number;

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
