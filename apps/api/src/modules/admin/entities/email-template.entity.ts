import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('email_templates')

export class EmailTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  @Index()
  companyId: string;

  @Column()
  code: string; // 'WF_APPROVAL', 'WF_REJECTION', 'SO_CONFIRMATION'

  @Column()
  name: string; // 'Workflow Approval Notification'

  @Column()
  subject: string; // 'Your request {{entity_type}} #{{entity_number}} requires approval'

  @Column('text')
  body: string; // HTML template with placeholders

  @Column({ default: 'email' })
  channel: string; // 'email', 'whatsapp', 'sms'

  @Column({ nullable: true })
  triggerEvent: string; // 'workflow.approved', 'workflow.rejected', 'order.confirmed'

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  isDefault: boolean; // For system templates

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Placeholder system
// {{entity_type}} - Sales Enquiry, Purchase Quote, etc.
// {{entity_number}} - SE-2024-0001
// {{customer_name}} - Customer name
// {{amount}} - Grand total
// {{approver_name}} - Who should approve
// {{initiator_name}} - Who created it
// {{comments}} - Approval/rejection comments
