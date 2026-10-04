import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_logs')

export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  auditLogId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  moduleName: string;

  @Column()
  recordId: string;

  @Column({ nullable: true })
  action: string; // create, update, delete, approve, reject, lock, unlock, export, send_email, generate_pdf, assign, status_change

  @Column('text', { nullable: true })
  oldValue: string; // JSON

  @Column('text', { nullable: true })
  newValue: string; // JSON

  @Column({ nullable: true })
  changedBy: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}
