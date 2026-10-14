import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('freight_rates')

export class FreightRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  code: string; // 'FRT001'

  @Column()
  name: string; // 'Sea Freight - Mumbai to Singapore'

  @Column({ nullable: true })
  carrier: string; // 'MAERSK', 'MSC', 'COSCO'

  @Column({ nullable: true })
  fromPortId: string; // FK to Port

  @Column({ nullable: true })
  toPortId: string; // FK to Port

  @Column({ nullable: true })
  containerType: string; // '20ft', '40ft', '40hq', 'LCL'

  @Column('decimal', { precision: 10, scale: 2 })
  rate20ft: number;

  @Column('decimal', { precision: 10, scale: 2 })
  rate40ft: number;

  @Column('decimal', { precision: 10, scale: 2 })
  rate40hq: number;

  @Column({ nullable: true })
  currencyId: string;

  @Column({ nullable: true })
  transitDays: number;

  @Column({ nullable: true })
  validFrom: Date;

  @Column({ nullable: true })
  validTo: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;
}
