import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('number_series')

export class NumberSeries {
  @PrimaryGeneratedColumn('uuid')
  numberSeriesId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  moduleName: string; // sales_enquiry, purchase_quote, price_analysis, rate_fms, label_artwork

  @Column()
  prefix: string; // ENQ, PUR, PA, RATEFMS, LBL

  @Column({ nullable: true })
  year: number;

  @Column({ default: 0 })
  currentNumber: number;

  @Column({ default: 6 })
  padding: number; // e.g., 6 for 000001

  @Column({ nullable: true })
  format: string; // '{PREFIX}-{YEAR}-{NUMBER}' or '{PREFIX}-{USER_CODE}-{YEAR}-{NUMBER}'

  @Column({ nullable: true })
  userCode: string; // For ENQ-NEH-2026-0234 format

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

// Examples:
// ENQ-NEH-2026-0234 -> Sales Enquiry with user code
// PUR-2026-0001 -> Purchase Quote
// PA-2026-0001 -> Price Analysis
// RATEFMS-2026-0001 -> Rate FMS Task
// LBL-2026-0001 -> Label Artwork
