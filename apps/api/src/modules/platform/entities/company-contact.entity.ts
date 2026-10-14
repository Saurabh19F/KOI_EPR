import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ContactType {
  BILLING = 'billing',
  SHIPPING = 'shipping',
  PRIMARY = 'primary',
  SUPPORT = 'support',
  TECHNICAL = 'technical',
  ACCOUNTING = 'accounting',
  OTHER = 'other',
}

@Entity('company_contacts')
@Index(['companyId'])
export class CompanyContact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column({
    type: 'enum',
    enum: ContactType,
    default: ContactType.PRIMARY,
  })
  contactType: ContactType;

  @Column()
  name: string;

  @Column({ nullable: true })
  designation: string;

  @Column({ nullable: true })
  department: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  mobile: string;

  @Column({ nullable: true })
  fax: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  postalCode: string;

  @Column({ default: false })
  isPrimary: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  metadata: string;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
