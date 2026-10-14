import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';

@Entity('product_categories')
@Index(['categoryCode'], { unique: true })
export class ProductCategory {
  @PrimaryGeneratedColumn('uuid')
  categoryId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ unique: true })
  categoryCode: string;

  @Column()
  categoryName: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  parentCategoryId: string;

  @Column({ default: 1 })
  level: number;

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

  @Column({ nullable: true })
  deletedAt: Date;

  products: any[];
}
