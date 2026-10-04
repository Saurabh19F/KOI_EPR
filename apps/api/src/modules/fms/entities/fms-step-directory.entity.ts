import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('fms_step_directory')

export class FMSStepDirectory {
  @PrimaryGeneratedColumn('uuid')
  stepId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  fmsId: string;

  @Column()
  stepNo: number; // 1, 2, 3...

  @Column()
  stepCode: string; // ACT01, ACT02

  @Column()
  taskName: string; // Master Updation Details

  @Column({ nullable: true })
  what: string; // What needs to be done

  @Column({ nullable: true })
  how: string; // From Vendor, Manual

  @Column({ nullable: true })
  assignedRoleId: string; // Purchase Team

  @Column({ nullable: true })
  assignedUserId: string; // Specific user

  @Column('decimal', { precision: 5, scale: 2 })
  slaDays: number; // 2.00 days

  @Column({ nullable: true })
  sourceQuery: string; // SQL query to pull records

  @Column({ nullable: true })
  uniqueKeyMapping: string; // How to generate unique key

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
