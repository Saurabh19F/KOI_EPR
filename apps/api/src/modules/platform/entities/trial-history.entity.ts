import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TrialEvent {
  STARTED = 'started',
  EXTENDED = 'extended',
  REMINDER_SENT = 'reminder_sent',
  CONVERTED = 'converted',
  EXPIRED = 'expired',
  UPGRADED = 'upgraded',
}

@Entity('trial_history')
@Index(['companyId'])
@Index(['event'])
export class TrialHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column({
    type: 'enum',
    enum: TrialEvent,
  })
  event: TrialEvent;

  @Column({ nullable: true })
  previousTrialEnd: Date;

  @Column({ nullable: true })
  newTrialEnd: Date;

  @Column({ nullable: true })
  extendedDays: number;

  @Column({ nullable: true })
  reminderNumber: number;

  @Column({ nullable: true })
  reason: string;

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
