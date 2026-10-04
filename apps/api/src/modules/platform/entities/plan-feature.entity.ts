import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('plan_features')
@Index(['planId'])
@Index(['featureId'])
export class PlanFeature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  planId: string;

  @Column()
  featureId: string;

  @Column({ default: true })
  enabled: boolean;

  @Column({ nullable: true })
  maxLimit: number;

  @Column({ nullable: true })
  softLimit: number;

  @Column({ nullable: true })
  hardLimit: number;

  @Column({ nullable: true })
  limitUnit: string;

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
