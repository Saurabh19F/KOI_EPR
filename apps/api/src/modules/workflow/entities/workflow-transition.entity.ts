import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export type TransitionAction = 'approve' | 'reject' | 'delegate' | 'skip' | 'return';

@Entity('workflow_transitions')
export class WorkflowTransition {
  @PrimaryGeneratedColumn('uuid')
  transitionId: string;

  @Column({ name: 'instance_id' })
  instanceId: string;


  @Column({ name: 'from_step_id', nullable: true })
  fromStepId: string;


  @Column({ name: 'to_step_id', nullable: true })
  toStepId: string;


  @Column()
  action: string;

  @Column({ name: 'action_by', nullable: true })
  actionBy: string;

  @Column({ name: 'action_at', nullable: true })
  actionAt: Date;

  @Column({ nullable: true })
  remarks: string;

  @Column({ name: 'delegated_to_user_id', nullable: true })
  delegatedToUserId: string;

  @Column({ name: 'delegated_to_role_id', nullable: true })
  delegatedToRoleId: string;

  @CreateDateColumn()
  createdAt: Date;
}
