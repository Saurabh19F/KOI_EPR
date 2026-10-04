import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('onboarding_checklists')
@Index(['companyId'])
export class OnboardingChecklist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  stepNumber: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  category: string;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  completedBy: string;

  @Column({ nullable: true })
  stepData: string;

  @Column({ nullable: true })
  stepUrl: string;

  @Column({ default: true })
  isRequired: boolean;

  @Column({ default: 0 })
  sortOrder: number;

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
