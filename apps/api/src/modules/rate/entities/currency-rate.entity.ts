import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('currency_rate_master')

export class CurrencyRate {
  @PrimaryGeneratedColumn('uuid')
  rateId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  currencyCode: string; // GBP, USD, CAD, AUD, EURO

  @Column()
  currencyName: string;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  rate: number;

  @Column({ type: 'date' })
  rateDate: Date;

  @Column({ nullable: true })
  source: string; // RBI, XE, MANUAL

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
