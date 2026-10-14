import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('product_images')
@Index(['productId'])
export class ProductImage {
  @PrimaryGeneratedColumn('uuid')
  imageId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  productId: string;

  @Column()
  imageUrl: string;

  @Column({ nullable: true })
  imageType: string; // 'primary', 'secondary', 'thumbnail'

  @Column({ nullable: true })
  altText: string;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
