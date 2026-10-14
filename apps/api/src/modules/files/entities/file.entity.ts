import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('files')
export class FileEntity {
  @PrimaryGeneratedColumn('uuid')
  fileId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  entityType: string;

  @Column()
  entityId: string;

  @Column()
  fileName: string;

  @Column()
  fileUrl: string;

  @Column({ type: 'int', nullable: true })
  fileSize: number;

  @Column({ nullable: true })
  mimeType: string;

  @Column({ nullable: true })
  uploadedBy: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
