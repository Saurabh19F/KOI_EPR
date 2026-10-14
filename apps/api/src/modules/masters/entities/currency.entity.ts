import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('currencies')
@Index(['code'])
export class Currency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  code: string; // 'INR', 'USD', 'EUR'

  @Column()
  name: string; // 'Indian Rupee', 'US Dollar'

  @Column({ nullable: true })
  symbol: string; // '₹', '$', '€'

  @Column({ nullable: true })
  decimalPlaces: number; // 2

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isBase: boolean; // Base currency

  @CreateDateColumn()
  createdAt: Date;
}
