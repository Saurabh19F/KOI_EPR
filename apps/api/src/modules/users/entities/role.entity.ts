import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Permission } from './permission.entity';
import { Department } from './department.entity';

@Entity('roles')
@Index(['roleCode'], { unique: true })
export class Role {
  @PrimaryGeneratedColumn('uuid')
  roleId: string;

  @Column({ name: 'company_id', nullable: true, type: 'uuid' })
  companyId: string;

  @Column({ name: 'department_id', nullable: true, type: 'uuid' })
  departmentId: string;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ name: 'role_code', unique: true })
  roleCode: string;

  @Column({ name: 'role_name' })
  roleName: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ default: 1 })
  level: number;

  @OneToMany(() => User, (user) => user.role)
  users: User[];

  @ManyToMany(() => Permission, { cascade: true })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'roleId' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'permissionId' },
  })
  permissions: Permission[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
