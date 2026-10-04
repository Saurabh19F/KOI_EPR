import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';

@Entity('workflow_definitions')
@Index(['workflowCode'], { unique: true })
export class WorkflowDefinition {
  @PrimaryGeneratedColumn('uuid')
  workflowId: string;

  @Column({ name: 'workflow_code', unique: true })
  workflowCode: string;

  @Column({ name: 'workflow_name' })
  workflowName: string;

  @Column({ name: 'entity_type', nullable: true })
  entityType: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany('WorkflowStep', 'workflow')
  steps: any[];

  @OneToMany('WorkflowInstance', 'workflow')
  instances: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
