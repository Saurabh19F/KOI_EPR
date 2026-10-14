import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('system_error_logs')
@Index(['companyId', 'errorTimestamp'])
@Index(['companyId', 'context'])
@Index(['companyId', 'username'])
export class SystemErrorLog {
  @PrimaryGeneratedColumn('uuid')
  errorId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ type: 'timestamptz' })
  errorTimestamp: Date;

  @Column({ nullable: true })
  context: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'text', nullable: true })
  stack: string;

  @Column({ nullable: true })
  username: string;

  @Column({ nullable: true })
  role: string;

  @Column({ nullable: true })
  warehouseId: string;

  @Column({ nullable: true })
  url: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}
