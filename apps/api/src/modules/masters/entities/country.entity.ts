import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('countries')
@Index(['code'])
export class Country {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  code: string; // 'IN', 'US', 'CN'

  @Column()
  name: string; // 'India', 'United States'

  @Column({ nullable: true })
  phoneCode: string; // '+91'

  @Column({ nullable: true })
  currencyCode: string; // 'INR', 'USD'

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
