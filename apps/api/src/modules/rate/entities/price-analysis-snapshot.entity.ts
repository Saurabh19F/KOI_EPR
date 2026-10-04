import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('price_analysis_calculation_snapshot')
@Index(['priceAnalysisId'])
export class PriceAnalysisSnapshot {
  @PrimaryGeneratedColumn('uuid')
  snapshotId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  priceAnalysisId: string;

  @Column({ nullable: true })
  priceAnalysisItemId: string;

  @Column({ nullable: true })
  currencyType: string;

  // Currency Rates
  @Column('decimal', { precision: 15, scale: 4, nullable: true })
  gbpCurrencyRate: number;

  @Column('decimal', { precision: 15, scale: 4, nullable: true })
  usdCurrencyRate: number;

  @Column('decimal', { precision: 15, scale: 4, nullable: true })
  cadCurrencyRate: number;

  @Column('decimal', { precision: 15, scale: 4, nullable: true })
  audCurrencyRate: number;

  @Column('decimal', { precision: 15, scale: 4, nullable: true })
  euroCurrencyRate: number;

  // Currency Margins
  @Column('decimal', { precision: 10, scale: 4, nullable: true })
  gbpMargin: number;

  @Column('decimal', { precision: 10, scale: 4, nullable: true })
  usdMargin: number;

  @Column('decimal', { precision: 10, scale: 4, nullable: true })
  cadMargin: number;

  @Column('decimal', { precision: 10, scale: 4, nullable: true })
  audMargin: number;

  @Column('decimal', { precision: 10, scale: 4, nullable: true })
  euroMargin: number;

  // Haulage
  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  delhiHaulage: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  mumbaiHaulage: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  freight: number;

  // Formula used
  @Column('text', { nullable: true })
  costFormula: string;

  @Column('text', { nullable: true })
  currencyFormula: string;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
