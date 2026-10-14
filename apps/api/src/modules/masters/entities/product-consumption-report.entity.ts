import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('product_consumption_reports')

export class ProductConsumptionReport {
  @PrimaryGeneratedColumn('uuid')
  reportId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  productId: string;

  @Column()
  reportDate: Date;

  @Column('decimal', { precision: 15, scale: 3 })
  openingStock: number;

  @Column('decimal', { precision: 15, scale: 3 })
  receivedQty: number;

  @Column('decimal', { precision: 15, scale: 3 })
  consumptionQty: number;

  @Column('decimal', { precision: 15, scale: 3 })
  closingStock: number;

  @Column({ nullable: true })
  wastageQty: number;

  @Column({ nullable: true })
  remarks: string;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
