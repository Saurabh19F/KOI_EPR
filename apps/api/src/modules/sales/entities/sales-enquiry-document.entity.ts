import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('sales_enquiry_documents')
export class SalesEnquiryDocument {
  @PrimaryGeneratedColumn('uuid')
  documentId: string;

  @Column({ nullable: true })
  enquiryOrderId: string;

  // NOTE: Removed ManyToOne to avoid circular dependency issues

  @Column()
  documentType: string; // PO, INVOICE, SPEC_SHEET, OTHER

  @Column({ nullable: true })
  documentName: string;

  @Column({ nullable: true })
  fileUrl: string;

  @Column({ nullable: true })
  fileSize: number;

  @Column({ nullable: true })
  mimeType: string;

  @Column({ nullable: true })
  uploadedBy: string;

  @CreateDateColumn()
  uploadedAt: Date;
}
