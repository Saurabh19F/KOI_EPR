import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('system_settings')
@Index(['companyId', 'key'], { unique: true })
export class SystemSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  @Index()
  companyId: string;

  @Column()
  key: string; // 'COMPANY_NAME', 'DEFAULT_CURRENCY', 'TAX_PERCENT'

  @Column()
  value: string; // Stored as string

  @Column({ nullable: true })
  type: string; // 'string', 'number', 'boolean', 'json'

  @Column({ nullable: true })
  category: string; // 'general', 'sales', 'purchase', 'inventory', 'finance'

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isSystem: boolean; // System settings can't be deleted

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Get typed value
  getTypedValue(): any {
    switch (this.type) {
      case 'number':
        return parseFloat(this.value);
      case 'boolean':
        return this.value === 'true';
      case 'json':
        return JSON.parse(this.value);
      default:
        return this.value;
    }
  }
}
