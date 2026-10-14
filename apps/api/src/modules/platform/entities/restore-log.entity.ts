import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum RestoreStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('restore_logs')
@Index(['companyId'])
@Index(['status'])
export class RestoreLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  restoreId: string;

  @Column({ nullable: true })
  backupId: string;

  @Column({ nullable: true })
  backupLogId: string;

  @Column()
  restoreName: string;

  @Column({
    type: 'enum',
    enum: RestoreStatus,
    default: RestoreStatus.IN_PROGRESS,
  })
  status: RestoreStatus;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ type: 'int', nullable: true })
  durationSeconds: number;

  @Column({ type: 'bigint', nullable: true })
  dataRestoredBytes: number;

  @Column({ type: 'int', nullable: true })
  tablesRestored: number;

  @Column({ type: 'int', nullable: true })
  recordsRestored: number;

  @Column({ default: false })
  isPointInTime: boolean;

  @Column({ nullable: true })
  pointInTimeAt: Date;

  @Column({ default: false })
  isSandbox: boolean;

  @Column({ nullable: true })
  sandboxName: string;

  @Column({ default: false })
  overwriteExisting: boolean;

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
