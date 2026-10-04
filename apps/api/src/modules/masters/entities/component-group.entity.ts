import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';

@Entity('component_groups')
@Index(['groupCode'], { unique: true })
export class ComponentGroup {
  @PrimaryGeneratedColumn('uuid')
  groupId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ unique: true })
  groupCode: string;

  @Column()
  groupName: string;

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

  @Column({ nullable: true })
  deletedAt: Date;

  products: any[];
}
