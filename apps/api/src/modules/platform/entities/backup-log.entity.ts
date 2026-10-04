import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum BackupStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  VERIFIED = 'verified',
}

export enum BackupType {
  FULL = 'full',
  INCREMENTAL = 'incremental',
  DIFFERENTIAL = 'differential',
}

@Entity('backup_logs')
@Index(['companyId'])
@Index(['status'])
export class BackupLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  backupId: string;

  @Column()
  backupName: string;

  @Column({
    type: 'enum',
    enum: BackupType,
    default: BackupType.FULL,
  })
  type: BackupType;

  @Column({
    type: 'enum',
    enum: BackupStatus,
    default: BackupStatus.IN_PROGRESS,
  })
  status: BackupStatus;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ type: 'bigint', nullable: true })
  sizeBytes: number;

  @Column({ type: 'int', nullable: true })
  durationSeconds: number;

  @Column({ nullable: true })
  storageLocation: string;

  @Column({ nullable: true })
  storageUrl: string;

  @Column({ nullable: true })
  checksum: string;

  @Column({ default: true })
  isAutomated: boolean;

  @Column({ nullable: true })
  retentionUntil: Date;

  @Column({ default: true })
  isCompressed: boolean;

  @Column({ default: true })
  isEncrypted: boolean;

  @Column({ nullable: true })
  errorMessage: string;

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
