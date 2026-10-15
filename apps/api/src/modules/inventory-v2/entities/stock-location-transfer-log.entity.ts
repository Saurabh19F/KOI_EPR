import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('stock_location_transfer_logs')
@Index(['transferId'], { unique: true })
@Index(['warehouseId', 'productId'])
export class StockLocationTransferLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  transferId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  warehouseId: string;

  @Column()
  productId: string;

  @Column()
  sourceLocation: string;

  @Column()
  destinationLocation: string;

  @Column({ type: 'decimal', precision: 15, scale: 3 })
  transferredQty: number;

  @Column({ nullable: true })
  transferredBy: string;

  @Column({ nullable: true })
  transferredByUserId: string;

  @CreateDateColumn()
  createdAt: Date;
}
