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

export type InstanceStatus = 'pending' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';

@Entity('workflow_instances')

@Index(['status'])
export class WorkflowInstance {
  @PrimaryGeneratedColumn('uuid')
  instanceId: string;

  @Column({ name: 'workflow_id' })
  workflowId: string;

  @ManyToOne('WorkflowDefinition', 'instances', { nullable: true })
  @JoinColumn({ name: 'workflow_id' })
  workflow: any;

  @Column({ name: 'entity_type', nullable: true })
  entityType: string;

  @Column({ name: 'entity_id', nullable: true })
  entityId: string;

  @Column({ name: 'current_step_id', nullable: true })
  currentStepId: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ name: 'initiated_by', nullable: true })
  initiatedBy: string;

  @Column({ name: 'initiated_at', nullable: true })
  initiatedAt: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;

  transitions: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
