import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ApiKeyStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

@Entity('api_keys')
@Index(['companyId'])
@Index(['keyHash'], { unique: true })
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  keyPrefix: string;

  @Column()
  keyHash: string;

  @Column()
  keyLast4: string;

  @Column({
    type: 'enum',
    enum: ApiKeyStatus,
    default: ApiKeyStatus.ACTIVE,
  })
  status: ApiKeyStatus;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  permissions: string;

  @Column({ nullable: true })
  allowedIps: string;

  @Column({ nullable: true })
  rateLimitPerMinute: number;

  @Column({ nullable: true })
  expiresAt: Date;

  @Column({ nullable: true })
  lastUsedAt: Date;

  @Column({ type: 'int', default: 0 })
  totalCalls: number;

  @Column({ nullable: true })
  revokedAt: Date;

  @Column({ nullable: true })
  revokedBy: string;

  @Column({ nullable: true })
  revokeReason: string;

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
