import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('currency_rate_master')

export class CurrencyRateMaster {
  @PrimaryGeneratedColumn('uuid')
  currencyRateId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  currencyCode: string; // GBP, USD, CAD, AUD, EURO

  @Column('decimal', { precision: 15, scale: 4 })
  actualRate: number; // 127.25, 90.75

  @Column()
  rateDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
