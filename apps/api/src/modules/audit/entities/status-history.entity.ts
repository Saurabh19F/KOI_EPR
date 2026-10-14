import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('status_history')

export class StatusHistory {
  @PrimaryGeneratedColumn('uuid')
  statusHistoryId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  moduleName: string; // sales_enquiry, purchase_quote, fms, etc.

  @Column()
  recordId: string;

  @Column({ nullable: true })
  oldStatus: string;

  @Column()
  newStatus: string;

  @Column({ nullable: true })
  changedBy: string;

  @CreateDateColumn()
  changedAt: Date;

  @Column('text', { nullable: true })
  remarks: string;
}
