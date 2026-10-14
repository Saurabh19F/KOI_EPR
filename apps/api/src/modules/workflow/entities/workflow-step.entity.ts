import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

@Entity('workflow_steps')
@Index(['workflowId'])
export class WorkflowStep {
  @PrimaryGeneratedColumn('uuid')
  stepId: string;

  @Column({ name: 'workflow_id' })
  workflowId: string;

  @ManyToOne('WorkflowDefinition', 'steps')
  @JoinColumn({ name: 'workflow_id' })
  workflow: any;

  @Column({ name: 'step_order' })
  stepOrder: number;

  @Column({ name: 'step_name' })
  stepName: string;

  @Column({ name: 'approver_role_id', nullable: true })
  approverRoleId: string;

  @Column({ name: 'approver_user_id', nullable: true })
  approverUserId: string;

  @Column({ name: 'approval_level', nullable: true })
  approvalLevel: number;

  @Column({ name: 'is_escalation', default: false })
  isEscalation: boolean;

  @Column({ name: 'escalation_days', nullable: true })
  escalationDays: number;

  @CreateDateColumn()
  createdAt: Date;
}
