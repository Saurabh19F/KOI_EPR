import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum LoginStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  LOCKED = 'locked',
  MFA_REQUIRED = 'mfa_required',
  MFA_FAILED = 'mfa_failed',
}

@Entity('login_history')
@Index(['companyId'])
@Index(['userId'])
@Index(['status'])
@Index(['createdAt'])
export class LoginHistory {
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
    enum: LoginStatus,
    default: LoginStatus.SUCCESS,
  })
  status: LoginStatus;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  deviceType: string;

  @Column({ nullable: true })
  deviceName: string;

  @Column({ nullable: true })
  browser: string;

  @Column({ nullable: true })
  browserVersion: string;

  @Column({ nullable: true })
  os: string;

  @Column({ nullable: true })
  osVersion: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  latitude: string;

  @Column({ nullable: true })
  longitude: string;

  @Column({ nullable: true })
  sessionId: string;

  @Column({ nullable: true })
  tokenId: string;

  @Column({ nullable: true })
  refreshTokenId: string;

  @Column({ nullable: true })
  loginMethod: string;

  @Column({ nullable: true })
  mfaMethod: string;

  @Column({ nullable: true })
  failureReason: string;

  @Column({ nullable: true })
  metadata: string;

  @CreateDateColumn()
  createdAt: Date;
}
