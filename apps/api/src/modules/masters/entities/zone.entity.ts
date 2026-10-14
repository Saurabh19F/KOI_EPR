import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('zones')

export class Zone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  code: string; // 'ZONE-NORTH', 'ZONE-SOUTH'

  @Column()
  name: string; // 'North Zone', 'South Zone'

  @Column({ nullable: true })
  region: string; // 'North', 'South', 'East', 'West'

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;
}
