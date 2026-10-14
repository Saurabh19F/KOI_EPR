import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('final_currency_rate_master')

export class FinalCurrencyRateMaster {
  @PrimaryGeneratedColumn('uuid')
  finalCurrencyRateId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  currencyCode: string;

  @Column('decimal', { precision: 15, scale: 4 })
  actualRate: number;

  @Column('decimal', { precision: 10, scale: 4 })
  marginBuffer: number;

  @Column('decimal', { precision: 15, scale: 4 })
  finalRate: number;

  @Column({ nullable: true })
  roundingRule: string;

  @Column()
  rateDate: Date;

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
