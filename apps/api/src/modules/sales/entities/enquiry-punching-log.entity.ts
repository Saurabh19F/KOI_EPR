import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('enquiry_punching_logs')
export class EnquiryPunchingLog {
  @PrimaryGeneratedColumn('uuid')
  logId: string;

  @Column({ nullable: true })
  enquiryOrderId: string;

  // NOTE: Removed ManyToOne to avoid circular dependency issues

  @Column({ nullable: true })
  itemId: string;

  @Column({ nullable: true })
  oldStatus: string;

  @Column({ nullable: true })
  newStatus: string;

  @Column({ nullable: true })
  changedBy: string;

  @CreateDateColumn()
  punchedAt: Date;

  @Column({ nullable: true })
  sku: string;

  @Column({ nullable: true })
  productName: string;

  @Column({ type: 'int', nullable: true })
  quantity: number;

  @Column({ nullable: true })
  status: string;

  @Column('text', { nullable: true })
  remarks: string;
}
