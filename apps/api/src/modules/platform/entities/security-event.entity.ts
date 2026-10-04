import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum SecurityEventType {
  LOGIN_FAILED = 'login_failed',
  PASSWORD_CHANGED = 'password_changed',
  PASSWORD_RESET = 'password_reset',
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',
  MFA_FAILED = 'mfa_failed',
  API_KEY_CREATED = 'api_key_created',
  API_KEY_REVOKED = 'api_key_revoked',
  PERMISSION_CHANGED = 'permission_changed',
  ROLE_CHANGED = 'role_changed',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  DATA_EXPORT = 'data_export',
  BULK_DELETE = 'bulk_delete',
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt',
  UNUSUAL_LOCATION = 'unusual_location',
  NEW_DEVICE_LOGIN = 'new_device_login',
  SESSION_TERMINATED = 'session_terminated',
  COMPANY_SUSPENDED = 'company_suspended',
  COMPANY_ACTIVATED = 'company_activated',
}

export enum SecurityEventSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

@Entity('security_events')
@Index(['companyId'])
@Index(['userId'])
@Index(['eventType'])
@Index(['severity'])
@Index(['createdAt'])
export class SecurityEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  userEmail: string;

  @Column({
    type: 'enum',
    enum: SecurityEventType,
  })
  eventType: SecurityEventType;

  @Column({
    type: 'enum',
    enum: SecurityEventSeverity,
    default: SecurityEventSeverity.INFO,
  })
  severity: SecurityEventSeverity;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  sessionId: string;

  @Column({ nullable: true })
  entityType: string;

  @Column({ nullable: true })
  entityId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  resolvedAt: Date;

  @Column({ nullable: true })
  resolvedBy: string;

  @Column({ nullable: true })
  resolution: string;

  @Column({ default: false })
  isAlertSent: boolean;

  @Column({ nullable: true })
  alertSentAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
