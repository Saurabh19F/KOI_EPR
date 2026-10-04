import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('freight_master')
export class FreightRate {
  @PrimaryGeneratedColumn('uuid')
  freightId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  portFrom: string;

  @Column()
  portTo: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  ratePerCbm: number;

  @Column({ nullable: true })
  currency: string;

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
