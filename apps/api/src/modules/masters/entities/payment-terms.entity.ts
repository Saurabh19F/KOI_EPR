import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('payment_terms')

export class PaymentTerms {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  code: string; // 'NET30', 'NET45', 'NET60'

  @Column()
  name: string; // 'Net 30 Days', 'Net 45 Days'

  @Column()
  days: number; // 30, 45, 60

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;
}
