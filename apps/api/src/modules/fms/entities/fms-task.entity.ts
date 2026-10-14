import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum FmsTaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DELAYED = 'delayed',
  ESCALATED = 'escalated',
}

@Entity('fms_tasks')
@Index(['uniqueKey'], { unique: true })
export class FmsTask {
  @PrimaryGeneratedColumn('uuid')
  taskId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ unique: true })
  uniqueKey: string; // RATEFMS-ENQ-HIT-2026-0149-SKU001-AMIT-ACT01

  @Column({ nullable: true })
  enquiryOrderId: string;

  @Column({ nullable: true })
  enquiryOrderNo: string;

  @Column({ nullable: true })
  sku: string;

  @Column({ nullable: true })
  productName: string;

  @Column({ nullable: true })
  assignedTo: string;

  @Column({ nullable: true })
  assignedBy: string;

  // Step info
  @Column({ nullable: true })
  stepCode: string;

  @Column({ nullable: true })
  stepName: string;

  // Dates
  @Column({ nullable: true })
  plannedStartDate: Date;

  @Column({ nullable: true })
  plannedEndDate: Date;

  @Column({ nullable: true })
  actualStartDate: Date;

  @Column({ nullable: true })
  actualEndDate: Date;

  // SLA
  @Column({ type: 'int', nullable: true })
  slaHours: number;

  @Column({ nullable: true })
  slaDeadline: Date;

  // Delay
  @Column({ type: 'int', default: 0 })
  delayHours: number;

  @Column({ nullable: true })
  delayReason: string;

  // Status
  @Column({
    type: 'enum',
    enum: FmsTaskStatus,
    default: FmsTaskStatus.PENDING,
  })
  status: FmsTaskStatus;

  @Column({ nullable: true })
  remarks: string;

  // Output (rate update)
  @Column('text', { nullable: true })
  rateOutput: string;

  @Column({ nullable: true })
  rateOutputDate: Date;

  // Escalation
  @Column({ default: false })
  isEscalated: boolean;

  @Column({ nullable: true })
  escalatedTo: string;

  @Column({ nullable: true })
  escalatedAt: Date;

  // Tracking
  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  deletedAt: Date;
}
