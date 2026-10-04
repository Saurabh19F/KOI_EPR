import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('email_queue')

export class EmailQueue {
  @PrimaryGeneratedColumn('uuid')
  emailId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ nullable: true })
  moduleName: string; // sales_enquiry, fms, etc.

  @Column({ nullable: true })
  recordId: string;

  @Column({ nullable: true })
  templateId: string;

  @Column('text')
  mailTo: string; // comma-separated or JSON array

  @Column('text', { nullable: true })
  mailCc: string;

  @Column('text', { nullable: true })
  mailBcc: string;

  @Column()
  subject: string;

  @Column('text')
  body: string;

  @Column({ nullable: true })
  attachmentIds: string; // JSON array of attachment IDs

  @Column({ default: 'pending' })
  sendStatus: string; // pending, sent, failed

  @Column({ default: 0 })
  retryCount: number;

  @Column('text', { nullable: true })
  errorMessage: string;

  @Column({ nullable: true })
  scheduledAt: Date;

  @Column({ nullable: true })
  sentAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
