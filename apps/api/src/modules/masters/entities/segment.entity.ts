import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('segments')
@Index(['segmentCode'], { unique: true })
export class Segment {
  @PrimaryGeneratedColumn('uuid')
  segmentId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ unique: true })
  segmentCode: string;

  @Column()
  segmentName: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  categoryId: string;


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
}
