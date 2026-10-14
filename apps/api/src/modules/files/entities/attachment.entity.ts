import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('attachments')

export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  attachmentId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  moduleName: string; // sales_enquiry, purchase_quote, vendor_quote, label_artwork, price_analysis, help_ticket

  @Column()
  recordId: string; // ID of the record in the module

  @Column()
  fileName: string;

  @Column({ nullable: true })
  fileType: string; // pdf, excel, image, document

  @Column({ nullable: true })
  mimeType: string; // application/pdf, image/jpeg

  @Column({ nullable: true })
  fileUrl: string; // Public URL or presigned URL

  @Column({ nullable: true })
  storageKey: string; // S3/MinIO storage key

  @Column({ nullable: true })
  fileSize: number; // in bytes

  @Column({ nullable: true })
  uploadedBy: string;

  @CreateDateColumn()
  uploadedAt: Date;

  @Column({ default: true })
  isActive: boolean;
}
