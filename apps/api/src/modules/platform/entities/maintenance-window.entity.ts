import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum MaintenanceStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('maintenance_windows')
@Index(['status'])
export class MaintenanceWindow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: MaintenanceStatus,
    default: MaintenanceStatus.SCHEDULED,
  })
  status: MaintenanceStatus;

  @Column()
  scheduledStartAt: Date;

  @Column()
  scheduledEndAt: Date;

  @Column({ nullable: true })
  actualStartAt: Date;

  @Column({ nullable: true })
  actualEndAt: Date;

  @Column({ default: false })
  isPlanned: boolean;

  @Column({ default: true })
  notifyBefore: boolean;

  @Column({ default: 24 })
  notifyHoursBefore: number;

  @Column({ default: false })
  allowReadOnly: boolean;

  @Column({ default: false })
  requireMaintenance: boolean;

  @Column({ nullable: true })
  affectedServices: string;

  @Column({ nullable: true })
  affectedTenants: string;

  @Column({ default: true })
  showBanner: boolean;

  @Column({ default: false })
  isRecurring: boolean;

  @Column({ nullable: true })
  recurringPattern: string;

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
