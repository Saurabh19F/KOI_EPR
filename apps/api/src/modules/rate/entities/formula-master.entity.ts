import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum FormulaType {
  LANDING_COST = 'landing_cost',
  FINAL_RATE = 'final_rate',
  MARGIN = 'margin',
  GST = 'gst',
  FREIGHT = 'freight',
  HAULAGE = 'haulage',
 OTHER_COST = 'other_cost',
}

export enum CalculationMethod {
  ADD = 'add',
  SUBTRACT = 'subtract',
  MULTIPLY = 'multiply',
  DIVIDE = 'divide',
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

@Entity('formula_master')
@Index(['formulaType', 'isActive'], { unique: false })
export class FormulaMaster {
  @PrimaryGeneratedColumn('uuid')
  formulaId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  formulaName: string;

  @Column({
    type: 'enum',
    enum: FormulaType,
  })
  formulaType: FormulaType;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  categoryId: string;

  @Column({ nullable: true })
  brandId: string;

  @Column({ nullable: true })
  productId: string;

  @Column({ nullable: true })
  customerType: string;

  @Column({ nullable: true })
  country: string;

  @Column({
    type: 'enum',
    enum: CalculationMethod,
    default: CalculationMethod.ADD,
  })
  calculationMethod: CalculationMethod;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  defaultValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  minValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  maxValue: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 1 })
  priority: number;

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
}

// Formula for calculating GST
export const GST_FORMULA = {
  formula: 'gstAmount = buyingPrice * (gstPercent / 100)',
  inputs: ['buyingPrice', 'gstPercent'],
  output: 'gstAmount',
};

// Formula for calculating landing cost
export const LANDING_COST_FORMULA = {
  formula: 'landingCost = buyingPrice + gstAmount + freightCost + otherCost',
  inputs: ['buyingPrice', 'gstAmount', 'freightCost', 'otherCost'],
  output: 'landingCost',
};

// Formula for calculating final rate with margin
export const FINAL_RATE_FORMULA = {
  formula: 'finalRate = landingCost / (1 - marginPercent / 100)',
  inputs: ['landingCost', 'marginPercent'],
  output: 'finalRate',
};

// Formula for calculating haulage allocation
export const HAULAGE_FORMULA = {
  formula: 'haulagePerUnit = (totalHaulage * itemCbm / totalShipmentCbm) / quantity',
  inputs: ['totalHaulage', 'itemCbm', 'totalShipmentCbm', 'quantity'],
  output: 'haulagePerUnit',
};

// Formula for calculating freight allocation
export const FREIGHT_FORMULA = {
  formula: 'freightPerUnit = (totalFreight * itemCbm / totalShipmentCbm) / quantity',
  inputs: ['totalFreight', 'itemCbm', 'totalShipmentCbm', 'quantity'],
  output: 'freightPerUnit',
};
