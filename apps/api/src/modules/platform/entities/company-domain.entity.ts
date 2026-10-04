import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum DomainVerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  FAILED = 'failed',
}

export enum DomainType {
  PRIMARY = 'primary',
  ALIAS = 'alias',
  CUSTOM = 'custom',
}

@Entity('company_domains')
@Index(['companyId'])
@Index(['domain'], { unique: true })
export class CompanyDomain {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  domain: string;

  @Column({
    type: 'enum',
    enum: DomainType,
    default: DomainType.CUSTOM,
  })
  domainType: DomainType;

  @Column({
    type: 'enum',
    enum: DomainVerificationStatus,
    default: DomainVerificationStatus.PENDING,
  })
  verificationStatus: DomainVerificationStatus;

  @Column({ nullable: true })
  verificationToken: string;

  @Column({ nullable: true })
  verificationMethod: string;

  @Column({ nullable: true })
  verifiedAt: Date;

  @Column({ nullable: true })
  dnsRecords: string;

  @Column({ default: false })
  isSslEnabled: boolean;

  @Column({ nullable: true })
  sslCertificateId: string;

  @Column({ nullable: true })
  sslExpiresAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  redirectTo: string;

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
