import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';

@Entity('company_branding')
@Index(['companyId'], { unique: true })
export class CompanyBranding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ nullable: true })
  faviconUrl: string;

  @Column({ default: '#2563EB' })
  primaryColor: string;

  @Column({ default: '#64748B' })
  secondaryColor: string;

  @Column({ default: '#22C55E' })
  successColor: string;

  @Column({ default: '#F59E0B' })
  warningColor: string;

  @Column({ default: '#EF4444' })
  dangerColor: string;

  @Column({ default: '#1E293B' })
  textColor: string;

  @Column({ default: '#F8FAFC' })
  backgroundColor: string;

  @Column({ nullable: true })
  fontFamily: string;

  @Column({ nullable: true })
  fontUrl: string;

  @Column({ nullable: true })
  loginPageHeading: string;

  @Column({ nullable: true })
  loginPageSubheading: string;

  @Column({ nullable: true })
  loginPageBackgroundUrl: string;

  @Column({ nullable: true })
  emailHeaderUrl: string;

  @Column({ nullable: true })
  emailFooterText: string;

  @Column({ default: true })
  showPlatformBranding: boolean;

  @Column({ default: true })
  showPoweredBy: boolean;

  @Column({ nullable: true })
  customCss: string;

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
