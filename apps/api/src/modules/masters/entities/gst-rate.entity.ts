import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('gst_rates')
@Index(['gstCode'], { unique: true })
export class GstRate {
  @PrimaryGeneratedColumn('uuid')
  gstRateId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ unique: true })
  gstCode: string;

  @Column()
  gstName: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  gstPercent: number;

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
