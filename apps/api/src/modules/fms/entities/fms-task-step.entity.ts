import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('fms_task_steps')
@Index(['fmsTaskId'])
export class FMSTaskStep {
  @PrimaryGeneratedColumn('uuid')
  taskStepId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  fmsTaskId: string;

  @Column({ nullable: true })
  stepId: string;

  @Column()
  stepNo: number;

  @Column({ nullable: true })
  stepCode: string; // ACT01, ACT02...

  @Column({ nullable: true })
  plannedAt: Date;

  @Column({ nullable: true })
  actualAt: Date;

  @Column({ default: 'pending' })
  status: string; // pending, completed, delayed

  @Column('text', { nullable: true })
  remarks: string;

  @Column({ nullable: true })
  completedBy: string;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  delayDays: number;

  @CreateDateColumn()
  createdAt: Date;
}
