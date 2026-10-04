import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('approval_matrix')

export class ApprovalMatrix {
  @PrimaryGeneratedColumn('uuid')
  approvalMatrixId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  moduleName: string; // sales_enquiry, purchase_quote, price_analysis

  @Column('text', { nullable: true })
  conditionJson: string; // JSON condition for when approval is required

  @Column()
  approvalLevel: number; // 1, 2, 3...

  @Column({ nullable: true })
  approverRoleId: string;

  @Column({ nullable: true })
  approverUserId: string;

  @Column({ default: true })
  isRequired: boolean;

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

// Examples:
// - Price Analysis final rate approval required
// - Purchase quote approval required if value > limit
// - Rate lock only by manager/admin
