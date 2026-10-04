import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('fms_step_directory')
export class FmsStep {
  @PrimaryGeneratedColumn('uuid')
  stepId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  stepCode: string; // ACT01, ACT02, etc.

  @Column()
  stepName: string; // Actual Costing, Supplier Quote, etc.

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'int', default: 1 })
  sequence: number;

  @Column({ type: 'int', default: 24 })
  slaHours: number; // Default SLA in hours

  @Column({ nullable: true })
  assignedRole: string; // COSTING, PURCHASE

  @Column({ nullable: true })
  assignedDepartment: string;

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
}
