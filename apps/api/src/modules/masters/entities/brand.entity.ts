import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('brands')
@Index(['brandCode'], { unique: true })
export class Brand {
  @PrimaryGeneratedColumn('uuid')
  brandId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ unique: true })
  brandCode: string;

  @Column()
  brandName: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  website: string;

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

  products: Product[];
}
