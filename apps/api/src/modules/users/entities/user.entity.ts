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
import { Department } from './department.entity';
import { Role } from './role.entity';
import { Permission } from './permission.entity';

@Entity('users')
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid', { name: 'user_id' })
  userId: string;

  @Column({ name: 'company_id', nullable: true, type: 'uuid' })
  companyId: string;

  @Column({ name: 'department_id', nullable: true, type: 'uuid' })
  departmentId: string;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ name: 'role_id', nullable: true, type: 'uuid' })
  roleId: string;

  @ManyToOne(() => Role, (role) => role.users, { nullable: true, eager: false })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  // Virtual field - populated by UsersService.loadPermissionsForRole()
  permissions?: Permission[];

  @Column({ name: 'email', unique: true })
  email: string;

  @Column({ name: 'password_hash', nullable: true })
  password: string;

  @Column({ name: 'name', nullable: true })
  name: string;

  @Column({ name: 'user_code', nullable: true })
  userCode: string;

  @Column({ name: 'phone', nullable: true })
  phone: string;

  @Column({ type: 'jsonb', nullable: true, default: '{}' })
  preferences: Record<string, any>;

  @Column({ name: 'avatar', nullable: true })
  avatar: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_super_admin', default: false })
  isSuperAdmin: boolean;

  @Column({ name: 'last_login_at', nullable: true, type: 'timestamp' })
  lastLoginAt: Date;

  @Column({ name: 'last_login_ip', nullable: true })
  lastLoginIp: string;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'email_verified_at', nullable: true, type: 'timestamp' })
  emailVerifiedAt: Date;

  @Column({ name: 'is_locked', default: false })
  isLocked: boolean;

  @Column({ name: 'locked_until', nullable: true, type: 'timestamp' })
  lockedUntil: Date;

  @Column({ name: 'failed_login_attempts', default: 0 })
  failedLoginAttempts: number;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', nullable: true, type: 'timestamp' })
  deletedAt: Date;
}
