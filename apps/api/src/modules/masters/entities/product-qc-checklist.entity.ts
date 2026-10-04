import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('product_qc_checklists')
@Index(['productId'])
export class ProductQCChecklist {
  @PrimaryGeneratedColumn('uuid')
  checklistId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  productId: string;

  @Column()
  checkPoint: string; // 'Visual', 'Weight', 'Dimensions'

  @Column({ nullable: true })
  specification: string; // 'No scratches', '50g ± 5g'

  @Column({ nullable: true })
  tolerance: string; // '+/- 5%'

  @Column({ nullable: true })
  testMethod: string; // 'Manual', 'Machine'

  @Column({ default: true })
  isMandatory: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
