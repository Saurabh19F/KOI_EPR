import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum MailQueueStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('fms_mail_queue')
export class FmsMailQueue {
  @PrimaryGeneratedColumn('uuid')
  mailId: string;

  @Column({ nullable: true })
  taskId: string;

  @Column()
  recipientEmail: string;

  @Column()
  subject: string;

  @Column('text', { nullable: true })
  body: string;

  @Column({ nullable: true })
  scheduledFor: Date;

  @Column({ nullable: true })
  sentAt: Date;

  @Column({
    type: 'enum',
    enum: MailQueueStatus,
    default: MailQueueStatus.PENDING,
  })
  status: MailQueueStatus;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
