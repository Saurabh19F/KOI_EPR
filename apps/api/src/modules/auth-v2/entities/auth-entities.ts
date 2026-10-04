import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('password_reset_tokens')
@Index(['token'])
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ unique: true })
  token: string;

  @Column()
  email: string;

  @Column({ default: 'pending' })
  status: string; // pending, used, expired

  @Column()
  expiresAt: Date;

  @Column({ nullable: true })
  usedAt: Date;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('email_verification_tokens')
@Index(['token'])
export class EmailVerificationToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ unique: true })
  token: string;

  @Column()
  email: string;

  @Column({ default: 'pending' })
  status: string; // pending, verified, expired

  @Column()
  expiresAt: Date;

  @Column({ nullable: true })
  verifiedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('token_blacklist')
@Index(['token', 'expiresAt'])
export class TokenBlacklist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  token: string;

  @Column()
  userId: string;

  @Column()
  tokenType: string; // access, refresh

  @Column()
  expiresAt: Date;

  @Column({ default: 'blacklisted' })
  reason: string; // logout, password_change, security, admin

  @Column({ nullable: true })
  jti: string; // JWT ID for precise revocation

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('two_factor_config')
@Index(['userId'], { unique: true })
export class TwoFactorConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ default: false })
  enabled: boolean;

  @Column({ nullable: true })
  secret: string; // Encrypted TOTP secret

  @Column({ type: 'jsonb', nullable: true })
  backupCodes: string[]; // Encrypted backup codes

  @Column({ default: 0 })
  backupCodesRemaining: number;

  @Column({ default: 'totp' })
  method: string; // totp, sms, email

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  lastVerifiedAt: Date;

  @Column({ default: true })
  allowBackupCodes: boolean;

  @Column({ default: 10 })
  gracePeriodMinutes: number; // Time to enter code after password login

  @Column({ nullable: true })
  enforcedByAdmin: string; // Admin userId who enforced 2FA

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('login_activity')
@Index(['userId', 'createdAt'])
@Index(['companyId', 'createdAt'])
export class LoginActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  userId: string;

  @Column()
  email: string;

  @Column()
  event: string; // login_success, login_failed, logout, password_changed, 2fa_enabled, etc.

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  deviceInfo: string;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'jsonb', nullable: true })
  userAgentParsed: {
    browser: string;
    os: string;
    device: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: true })
  success: boolean;

  @Column({ nullable: true })
  failureReason: string;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('session_management')
@Index(['userId', 'createdAt'])
@Index(['refreshTokenId'])
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  userId: string;

  @Column()
  refreshTokenId: string;

  @Column({ nullable: true })
  accessTokenJti: string;

  @Column({ nullable: true })
  deviceInfo: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  location: string;

  @Column({ default: 'active' })
  status: string; // active, expired, revoked

  @Column({ nullable: true })
  lastActivityAt: Date;

  @Column()
  expiresAt: Date;

  @Column({ nullable: true })
  revokedAt: Date;

  @Column({ nullable: true })
  revokedBy: string;

  @Column({ nullable: true })
  revokeReason: string;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('api_key_management')
@Index(['userId'])
@Index(['keyHash'])
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  userId: string;

  @Column()
  name: string;

  @Column()
  keyHash: string; // SHA-256 hash of the key

  @Column()
  keyPrefix: string; // First 8 chars for identification

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  scopes: string[]; // Permissions

  @Column({ nullable: true })
  expiresAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastUsedAt: Date;

  @Column({ nullable: true })
  lastIpAddress: string;

  @Column({ default: 0 })
  requestCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('security_audit_log')
@Index(['userId', 'createdAt'])
@Index(['eventType', 'createdAt'])
export class SecurityAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  userId: string;

  @Column()
  eventType: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  resource: string;

  @Column({ nullable: true })
  action: string;

  @Column({ type: 'jsonb', nullable: true })
  oldValues: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  newValues: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: 'success' })
  result: string; // success, failure

  @Column({ nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;
}
