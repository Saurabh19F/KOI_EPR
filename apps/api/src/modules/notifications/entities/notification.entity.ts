import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('notifications')

export class Notification {
  @PrimaryGeneratedColumn('uuid')
  notificationId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  moduleName: string; // sales_enquiry, purchase_quote, fms, etc.

  @Column({ nullable: true })
  recordId: string;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({ default: 'in_app' })
  notificationType: string; // email, whatsapp, in_app, system_alert, escalation

  @Column({ default: 'pending' })
  status: string; // pending, sent, failed, read

  @Column({ nullable: true })
  sentAt: Date;

  @Column({ nullable: true })
  readAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
