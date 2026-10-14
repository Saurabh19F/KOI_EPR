import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Haulage Master — maps to the actual 'haulage_master' table in the database.
 * The legacy 'haulage_charges' table has a different schema and is not used.
 */
@Entity('haulage_master')
export class HaulageCharge {
  @PrimaryGeneratedColumn('uuid', { name: 'haulage_id' })
  id: string;

  @Column({ name: 'company_id', nullable: true })
  companyId: string;

  @Column({ name: 'location' })
  location: string;

  @Column('decimal', { name: 'rate_per_cbm', precision: 10, scale: 2 })
  ratePerCbm: number;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
