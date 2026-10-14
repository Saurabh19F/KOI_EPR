import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('sku_settings')
@Index(['companyId', 'sku'], { unique: true })
export class SkuSetting {
  @PrimaryGeneratedColumn('uuid')
  settingId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  sku: string;

  @Column({ type: 'text', nullable: true })
  rejectReasons: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
