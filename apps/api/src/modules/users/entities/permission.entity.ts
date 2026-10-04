import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('permissions')
@Index(['permissionCode'], { unique: true })
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  permissionId: string;

  @Column({ unique: true })
  permissionCode: string;

  @Column()
  permissionName: string;

  @Column({ nullable: true })
  moduleName: string;

  @Column({ nullable: true })
  action: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
