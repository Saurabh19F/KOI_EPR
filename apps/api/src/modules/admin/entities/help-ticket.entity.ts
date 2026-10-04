import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Department } from '../../users/entities/department.entity';

@Entity('help_tickets')

export class HelpTicket {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ nullable: true, name: 'company_id' })
  @Index()
  companyId: string;

  @Column({ name: 'ticket_number' })
  ticketNumber: string;

  @Column()
  subject: string;

  @Column('text')
  description: string;

  @Column({ default: 'support', name: 'category' })
  category: string;

  @Column({ default: 'medium', name: 'priority' })
  priority: string;

  @Column({ default: 'open', name: 'status' })
  status: string;

  @Column({ name: 'reporter_id' })
  reporterId: string;

    reporter: User;

  @Column({ nullable: true, name: 'assigned_to_id' })
  assignedToId: string;

    assignedTo: User;

  @Column({ nullable: true, name: 'department_id' })
  departmentId: string;

    department: Department;

  @Column({ nullable: true, name: 'reference_type' })
  referenceType: string;

  @Column({ nullable: true, name: 'reference_id' })
  referenceId: string;

  @Column({ nullable: true, name: 'resolution' })
  resolution: string;

  @Column({ nullable: true, name: 'resolved_at' })
  resolvedAt: Date;

  @Column({ nullable: true, name: 'resolved_by_id' })
  resolvedById: string;

    resolvedBy: User;

  @Column({ nullable: true, name: 'closed_at' })
  closedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('ticket_comments')
export class TicketComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
    ticket: HelpTicket;

  @Column()
    user: User;

  @Column('text')
  comment: string;

  @Column({ default: false })
  isInternal: boolean; // Only visible to staff

  @Column({ nullable: true })
  attachments: string; // JSON array of file IDs

  @CreateDateColumn()
  createdAt: Date;
}
