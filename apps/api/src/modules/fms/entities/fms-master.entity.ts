import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('fms_master')
export class FmsMaster {
  @PrimaryGeneratedColumn('uuid')
  fmsId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  fmsCode: string; // RATEFMS

  @Column()
  fmsName: string; // Rate FMS

  @Column({ nullable: true })
  description: string;

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
}
