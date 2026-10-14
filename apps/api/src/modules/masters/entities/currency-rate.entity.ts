import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('currency_rates')

export class CurrencyRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  currencyId: string; // FK to Currency

  @Column()
  baseCurrencyId: string; // FK to Currency (base)

  @Column('decimal', { precision: 18, scale: 6 })
  rate: number; // 1 USD = 83.50 INR

  @Column()
  effectiveDate: Date;

  @Column({ nullable: true })
  expiryDate: Date;

  @Column({ nullable: true })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;
}
