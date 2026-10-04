import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  PENDING_CUSTOMER = 'pending_customer',
  PENDING_INTERNAL = 'pending_internal',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum TicketCategory {
  TECHNICAL = 'technical',
  BILLING = 'billing',
  FEATURE_REQUEST = 'feature_request',
  DATA_ISSUE = 'data_issue',
  HOW_TO = 'how_to',
  OTHER = 'other',
}

@Entity('support_tickets')
@Index(['companyId'])
@Index(['status'])
@Index(['priority'])
export class SupportTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column({ unique: true })
  ticketNumber: string;

  @Column()
  subject: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: TicketCategory,
    default: TicketCategory.OTHER,
  })
  category: TicketCategory;

  @Column({
    type: 'enum',
    enum: TicketPriority,
    default: TicketPriority.MEDIUM,
  })
  priority: TicketPriority;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.OPEN,
  })
  status: TicketStatus;

  @Column({ nullable: true })
  reporterId: string;

  @Column({ nullable: true })
  reporterName: string;

  @Column({ nullable: true })
  reporterEmail: string;

  @Column({ nullable: true })
  assignedTo: string;

  @Column({ nullable: true })
  assignedToName: string;

  @Column({ nullable: true })
  relatedEntityType: string;

  @Column({ nullable: true })
  relatedEntityId: string;

  @Column({ nullable: true })
  attachments: string;

  @Column({ nullable: true })
  internalNotes: string;

  @Column({ nullable: true })
  resolution: string;

  @Column({ nullable: true })
  resolvedAt: Date;

  @Column({ nullable: true })
  resolvedBy: string;

  @Column({ nullable: true })
  closedAt: Date;

  @Column({ nullable: true })
  closedBy: string;

  @Column({ nullable: true })
  satisfactionRating: number;

  @Column({ nullable: true })
  satisfactionComment: string;

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
