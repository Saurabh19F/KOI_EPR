import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum FeatureCategory {
  SALES = 'sales',
  PURCHASE = 'purchase',
  RATE = 'rate',
  MASTERS = 'masters',
  FMS = 'fms',
  INVENTORY = 'inventory',
  PRODUCTION = 'production',
  FINANCE = 'finance',
  ANALYTICS = 'analytics',
  API = 'api',
  CUSTOMIZATION = 'customization',
  SUPPORT = 'support',
}

@Entity('features')
@Index(['featureCode'], { unique: true })
@Index(['category'])
export class Feature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  featureCode: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: FeatureCategory,
    default: FeatureCategory.SALES,
  })
  category: FeatureCategory;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  icon: string;

  @Column({ nullable: true })
  helpUrl: string;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
