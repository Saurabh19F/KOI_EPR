import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('company_settings')
@Index(['companyId'], { unique: true })
export class CompanySettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  // General Settings
  @Column({ default: 'Asia/Kolkata' })
  timezone: string;

  @Column({ default: 'INR' })
  currency: string;

  @Column({ default: 'en-IN' })
  locale: string;

  @Column({ default: 'DD/MM/YYYY' })
  dateFormat: string;

  @Column({ default: 'hh:mm A' })
  timeFormat: string;

  @Column({ default: ',' })
  thousandsSeparator: string;

  @Column({ default: '.' })
  decimalSeparator: string;

  // Numbering
  @Column({ default: true })
  autoNumberEnquiry: boolean;

  @Column({ default: true })
  autoNumberQuote: boolean;

  @Column({ default: true })
  autoNumberInvoice: boolean;

  @Column({ default: 4 })
  enquiryPrefixLength: number;

  @Column({ default: 4 })
  quotePrefixLength: number;

  // Email Settings
  @Column({ default: true })
  emailNotificationsEnabled: boolean;

  @Column({ nullable: true })
  emailFromName: string;

  @Column({ nullable: true })
  emailFromAddress: string;

  @Column({ nullable: true })
  emailReplyTo: string;

  @Column({ default: true })
  emailReminderEnabled: boolean;

  @Column({ default: 3 })
  emailReminderDays: number;

  // WhatsApp Settings
  @Column({ default: false })
  whatsappEnabled: boolean;

  @Column({ nullable: true })
  whatsappApiKey: string;

  @Column({ nullable: true })
  whatsappTemplateId: string;

  // SMS Settings
  @Column({ default: false })
  smsEnabled: boolean;

  @Column({ nullable: true })
  smsApiKey: string;

  @Column({ nullable: true })
  smsSenderId: string;

  // Tax Settings
  @Column({ default: 18 })
  defaultGstPercent: number;

  @Column({ default: false })
  tdsEnabled: boolean;

  @Column({ default: 10 })
  defaultTdsPercent: number;

  // Inventory Settings
  @Column({ default: false })
  inventoryEnabled: boolean;

  @Column({ default: 0 })
  defaultReorderLevel: number;

  @Column({ default: true })
  negativeStockAllowed: boolean;

  // Workflow Settings
  @Column({ default: false })
  autoApprovalEnabled: boolean;

  @Column({ default: 100000 })
  autoApprovalLimit: number;

  @Column({ default: 24 })
  taskSlaHours: number;

  // Finance Settings
  @Column({ default: false })
  financeEnabled: boolean;

  @Column({ nullable: true })
  bankName: string;

  @Column({ nullable: true })
  bankAccountNo: string;

  @Column({ nullable: true })
  bankIfsc: string;

  // Branding Settings
  @Column({ default: true })
  showPoweredBy: boolean;

  @Column({ default: true })
  showWatermark: boolean;

  // Security Settings
  @Column({ default: false })
  mfaEnabled: boolean;

  @Column({ default: false })
  ipWhitelistEnabled: boolean;

  @Column({ nullable: true })
  allowedIpList: string;

  @Column({ default: 90 })
  sessionTimeoutMinutes: number;

  @Column({ default: 5 })
  maxLoginAttempts: number;

  // Data Retention
  @Column({ default: 365 })
  auditLogRetentionDays: number;

  @Column({ default: 90 })
  sessionRetentionDays: number;

  // Metadata
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
