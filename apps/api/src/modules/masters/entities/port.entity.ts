import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('ports')

export class Port {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  code: string; // 'MUMBAI', 'JNPT', 'NHAVA SHEVA'

  @Column()
  name: string; // 'Mumbai Port', 'Jawaharlal Nehru Port'

  @Column({ nullable: true })
  type: string; // 'sea', 'air', 'land', 'ICD'

  @Column({ nullable: true })
  countryId: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;
}
