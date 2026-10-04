import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('product_documents')
@Index(['productId'])
export class ProductDocument {
  @PrimaryGeneratedColumn('uuid')
  documentId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  productId: string;

  @Column()
  documentType: string; // 'datasheet', 'certificate', 'msds', 'other'

  @Column()
  documentName: string;

  @Column()
  fileUrl: string;

  @Column({ nullable: true })
  fileSize: number; // in bytes

  @Column({ nullable: true })
  mimeType: string; // 'application/pdf', 'image/jpeg'

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
