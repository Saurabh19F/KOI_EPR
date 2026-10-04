import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Base entity with multi-tenant and audit fields
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  updatedById: string;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  deletedAt: Date;
}

/**
 * TenantEntity - alias for BaseEntity for backward compatibility
 */
export abstract class TenantEntity extends BaseEntity {
}

export enum EntityStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
  PENDING = 'pending',
  DELETED = 'deleted',
}