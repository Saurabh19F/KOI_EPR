import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('haulage_master')
@Index(['location'])
export class HaulageRate {
  @PrimaryGeneratedColumn('uuid')
  haulageId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  location: string; // DELHI, MUMBAI

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  ratePerCbm: number;

  @Column({ nullable: true })
  description: string;

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
