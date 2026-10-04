import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('uom_master')
@Index(['uomCode'], { unique: true })
export class Uom {
  @PrimaryGeneratedColumn('uuid')
  uomId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ unique: true })
  uomCode: string;

  @Column()
  uomName: string;

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
