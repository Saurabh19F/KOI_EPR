import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum ReminderStatus {
  PENDING = 'pending',
  SENT = 'sent',
  CANCELLED = 'cancelled',
}

@Entity('enquiry_email_reminders')
export class EnquiryEmailReminder {
  @PrimaryGeneratedColumn('uuid')
  reminderId: string;

  @Column({ nullable: true })
  enquiryOrderId: string;

  // NOTE: Removed ManyToOne to avoid circular dependency issues

  @Column()
  reminderType: string; // RATE_PENDING, QUOTATION_PENDING, FOLLOW_UP

  @Column({ nullable: true })
  scheduledFor: Date;

  @Column({ nullable: true })
  sentAt: Date;

  @Column({
    type: 'enum',
    enum: ReminderStatus,
    default: ReminderStatus.PENDING,
  })
  status: ReminderStatus;

  @Column('text', { nullable: true })
  emailBody: string;

  @Column({ nullable: true })
  sentBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
