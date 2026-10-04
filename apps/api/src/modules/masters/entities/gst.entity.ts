import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('gst_rates')

export class GSTRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  code: string; // 'GST0', 'GST5', 'GST12', 'GST18', 'GST28'

  @Column()
  name: string; // '0% GST', '5% GST'

  @Column('decimal', { precision: 5, scale: 2 })
  rate: number; // 0.00, 5.00, 12.00, 18.00, 28.00

  @Column({ nullable: true })
  hsnCode: string; // HSN code range

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  effectiveFrom: Date;

  @Column({ nullable: true })
  effectiveTo: Date;

  @Column({ nullable: true })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;
}
