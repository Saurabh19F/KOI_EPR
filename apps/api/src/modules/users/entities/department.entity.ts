import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('departments')
@Index(['departmentCode'], { unique: true })
export class Department {
  @PrimaryGeneratedColumn('uuid')
  departmentId: string;

  @Column({ name: 'company_id', nullable: true, type: 'uuid' })
  companyId: string;

  @Column({ name: 'department_code', unique: true })
  departmentCode: string;

  @Column({ name: 'department_name' })
  departmentName: string;

  @Column({ name: 'head_user_id', nullable: true, type: 'uuid' })
  headUserId: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
