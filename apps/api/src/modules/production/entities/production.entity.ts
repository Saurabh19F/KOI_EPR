import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ProductionJobStatus {
  DRAFT = 'draft',
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('production_jobs')
export class ProductionJob {
  @PrimaryGeneratedColumn('uuid')
  jobId: string;

  @Column({ nullable: true })
  companyId: string;

  @Index({ unique: true })
  @Column()
  jobNumber: string;

  @Column({ nullable: true })
  orderNo: string;

  @Column()
  productId: string;

  @Column()
  productName: string;

  @Column('decimal', { precision: 15, scale: 3 })
  orderQty: number;

  @Column('decimal', { precision: 15, scale: 3 })
  plannedProductionQty: number;

  @Column('decimal', { precision: 15, scale: 3, default: 0 })
  finalProducedQty: number;

  @Column()
  uom: string;

  @Column({ nullable: true })
  unitPerCarton: string;

  @Column({ nullable: true })
  partyName: string;

  @Column()
  warehouseId: string;

  @Column({ nullable: true })
  warehouseName: string;

  @Column({ nullable: true })
  materialRequestGroupId: string;

  @Column({
    type: 'enum',
    enum: ProductionJobStatus,
    default: ProductionJobStatus.DRAFT,
  })
  status: ProductionJobStatus;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  closingDate: Date;

  @Column({ nullable: true })
  startedBy: string;

  @Column({ nullable: true })
  closedBy: string;

  @Column({ type: 'text', nullable: true })
  processDetails: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('production_logs')
export class ProductionLog {
  @PrimaryGeneratedColumn('uuid')
  logId: string;

  @Column({ nullable: true })
  companyId: string;

  @Index({ unique: true })
  @Column()
  logNumber: string;

  @Column({ nullable: true })
  productionJobId: string;

  @Column({ type: 'timestamp' })
  date: Date;

  @Column()
  productionWarehouseId: string;

  @Column({ nullable: true })
  productionWarehouseName: string;

  @Column()
  rawMaterialId: string;

  @Column({ nullable: true })
  rawMaterialName: string;

  @Column('decimal', { precision: 15, scale: 3 })
  qtyConsumed: number;

  @Column()
  finishedProductId: string;

  @Column({ nullable: true })
  finishedProductName: string;

  @Column('decimal', { precision: 15, scale: 3 })
  qtyProduced: number;

  @Column({ nullable: true })
  destinationWarehouseId: string;

  @Column({ nullable: true })
  destinationWarehouseName: string;

  @Column({ nullable: true })
  qcStatus: string;

  @Column({ nullable: true })
  qcId: string;

  @Column()
  loggedBy: string;

  @Column({ nullable: true })
  loggedByUserId: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('production_merge_details')
export class ProductionMergeDetail {
  @PrimaryGeneratedColumn('uuid')
  mergeId: string;

  @Column({ nullable: true })
  companyId: string;

  @Index({ unique: true })
  @Column()
  mergeNumber: string;

  @Column()
  productionJobId: string;

  @Column({ nullable: true })
  orderNo: string;

  @Column()
  finalProductId: string;

  @Column({ nullable: true })
  finalProductName: string;

  @Column()
  mergedItemId: string;

  @Column()
  mergedItemName: string;

  @Column('decimal', { precision: 15, scale: 3 })
  mergedQty: number;

  @Column({ nullable: true })
  uom: string;

  @Column({ type: 'text', nullable: true })
  workDetails: string;

  @Column()
  enteredBy: string;

  @Column({ nullable: true })
  enteredByUserId: string;

  @Column({ type: 'timestamp' })
  entryDate: Date;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;
}

export enum BomStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('bill_of_materials')
@Index(['companyId', 'productId'])
export class BillOfMaterial {
  @PrimaryGeneratedColumn('uuid')
  bomId: string;

  @Column({ nullable: true })
  companyId: string;

  @Index({ unique: true })
  @Column()
  bomNumber: string;

  @Column()
  productId: string;

  @Column({ nullable: true })
  productName: string;

  @Column({ nullable: true })
  version: string;

  @Column({
    type: 'enum',
    enum: BomStatus,
    default: BomStatus.DRAFT,
  })
  status: BomStatus;

  @Column('decimal', { precision: 15, scale: 3, default: 1 })
  outputQty: number;

  @Column({ nullable: true })
  uom: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamp', nullable: true })
  effectiveFrom: Date;

  @Column({ type: 'timestamp', nullable: true })
  effectiveTo: Date;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('bom_items')
@Index(['bomId'])
export class BomItem {
  @PrimaryGeneratedColumn('uuid')
  bomItemId: string;

  @Column()
  bomId: string;

  @Column()
  materialId: string;

  @Column({ nullable: true })
  materialName: string;

  @Column('decimal', { precision: 15, scale: 3 })
  quantity: number;

  @Column({ nullable: true })
  uom: string;

  @Column('decimal', { precision: 15, scale: 3, default: 0 })
  wastagePercent: number;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('production_material_closures')
export class ProductionMaterialClosure {
  @PrimaryGeneratedColumn('uuid')
  closureId: string;

  @Column({ nullable: true })
  companyId: string;

  @Index({ unique: true })
  @Column()
  closureNumber: string;

  @Column()
  productionJobId: string;

  @Column({ nullable: true })
  requestId: string;

  @Column({ nullable: true })
  orderNo: string;

  @Column()
  finalProductId: string;

  @Column({ nullable: true })
  finalProductName: string;

  @Column()
  materialId: string;

  @Column()
  materialName: string;

  @Column()
  sourceWarehouseId: string;

  @Column({ nullable: true })
  sourceWarehouseName: string;

  @Column()
  productionWarehouseId: string;

  @Column({ nullable: true })
  productionWarehouseName: string;

  @Column('decimal', { precision: 15, scale: 3 })
  receivedQty: number;

  @Column('decimal', { precision: 15, scale: 3 })
  usedQty: number;

  @Column('decimal', { precision: 15, scale: 3, default: 0 })
  returnedQty: number;

  @Column()
  closedBy: string;

  @Column({ nullable: true })
  closedByUserId: string;

  @Column({ type: 'timestamp' })
  closingDate: Date;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
