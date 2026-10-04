import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

// Batch/Lot tracking for inventory
@Entity('inventory_batches')

@Index(['batchNumber'], { unique: true })
export class InventoryBatch {
  @PrimaryGeneratedColumn('uuid')
  batchId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ unique: true })
  batchNumber: string;

  @Column()
  productId: string;

  @Column()
  productName: string;

  @Column({ nullable: true })
  warehouseId: string;

  @Column({ nullable: true })
  warehouseName: string;

  @Column({ nullable: true })
  locationId: string;

  @Column({ nullable: true })
  locationName: string;

  @Column({ nullable: true })
  manufacturingDate: Date;

  @Column({ nullable: true })
  expiryDate: Date;

  @Column({ type: 'decimal', precision: 18, scale: 3, default: 0 })
  quantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 3, default: 0 })
  reservedQuantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  unitCost: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  totalCost: number;

  @Column({ nullable: true })
  vendorId: string;

  @Column({ nullable: true })
  vendorName: string;

  @Column({ nullable: true })
  purchaseOrderId: string;

  @Column({ nullable: true })
  grnId: string;

  @Column({ nullable: true })
  grnNumber: string;

  @Column({ nullable: true })
  invoiceNumber: string;

  @Column({ nullable: true })
  mfgLicenseNumber: string;

  @Column({ nullable: true })
  barcode: string;

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

// Serial number tracking for individual items
@Entity('inventory_serial_numbers')

@Index(['serialNumber'], { unique: true })
export class InventorySerialNumber {
  @PrimaryGeneratedColumn('uuid')
  serialId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ unique: true })
  serialNumber: string;

  @Column()
  productId: string;

  @Column()
  productName: string;

  @Column({ nullable: true })
  sku: string;

  @Column({ nullable: true })
  batchId: string;

  @Column({ nullable: true })
  batchNumber: string;

  @Column({ nullable: true })
  warehouseId: string;

  @Column({ nullable: true })
  warehouseName: string;

  @Column({ nullable: true })
  locationId: string;

  @Column({ nullable: true })
  locationName: string;

  @Column({ nullable: true })
  manufacturingDate: Date;

  @Column({ nullable: true })
  expiryDate: Date;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  unitCost: number;

  @Column({ nullable: true })
  vendorId: string;

  @Column({ nullable: true })
  vendorName: string;

  @Column({ default: 'available' })
  status: string; // available, sold, used, damaged, returned

  @Column({ nullable: true })
  salesInvoiceId: string;

  @Column({ nullable: true })
  salesOrderId: string;

  @Column({ nullable: true })
  customerId: string;

  @Column({ nullable: true })
  warrantyExpiry: Date;

  @Column({ nullable: true })
  notes: string;

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

// Stock reservation for orders
@Entity('stock_reservations')


export class StockReservation {
  @PrimaryGeneratedColumn('uuid')
  reservationId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  productId: string;

  @Column()
  productName: string;

  @Column({ nullable: true })
  batchId: string;

  @Column({ nullable: true })
  batchNumber: string;

  @Column({ nullable: true })
  warehouseId: string;

  @Column({ nullable: true })
  warehouseName: string;

  @Column()
  orderId: string;

  @Column()
  orderType: string; // sales_order, purchase_order, job_work

  @Column({ type: 'decimal', precision: 18, scale: 3 })
  quantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 3, default: 0 })
  fulfilledQuantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 3, default: 0 })
  cancelledQuantity: number;

  @Column({ default: 'pending' })
  status: string; // pending, partial, fulfilled, cancelled, expired

  @Column({ nullable: true })
  expiryDate: Date; // Reservation expiry

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Stock valuation methods tracking
export enum ValuationMethod {
  FIFO = 'fifo',
  LIFO = 'lifo',
  AVERAGE = 'average',
  STANDARD = 'standard',
}

@Entity('stock_valuation')

@Index(['warehouseId'])
export class StockValuation {
  @PrimaryGeneratedColumn('uuid')
  valuationId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  productId: string;

  @Column({ nullable: true })
  warehouseId: string;

  @Column({ nullable: true })
  warehouseName: string;

  @Column({ type: 'decimal', precision: 18, scale: 3, default: 0 })
  quantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  averageCost: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  fifoCost: number; // Cost from oldest batch

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  lifoCost: number; // Cost from newest batch

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  standardCost: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalValue: number;

  @Column({ type: 'enum', enum: ValuationMethod, default: ValuationMethod.AVERAGE })
  valuationMethod: ValuationMethod;

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

// Physical stock take / Cycle counting
@Entity('stock_counts')

export class StockCount {
  @PrimaryGeneratedColumn('uuid')
  countId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  countNumber: string;

  @Column()
  countDate: Date;

  @Column()
  warehouseId: string;

  @Column()
  warehouseName: string;

  @Column({ nullable: true })
  locationId: string;

  @Column({ nullable: true })
  locationName: string;

  @Column({ nullable: true })
  countedBy: string;

  @Column({ default: 'draft' })
  status: string; // draft, in_progress, completed, variances_posted

  @Column({ nullable: true })
  notes: string;

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

  items: StockCountItem[];
}

@Entity('stock_count_items')
export class StockCountItem {
  @PrimaryGeneratedColumn('uuid')
  itemId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ name: 'count_id', nullable: true })
  countId: string;

  count: StockCount;

  @Column()
  productId: string;

  @Column()
  productName: string;

  @Column({ nullable: true })
  batchId: string;

  @Column({ nullable: true })
  batchNumber: string;

  @Column({ nullable: true })
  locationId: string;

  @Column({ nullable: true })
  locationName: string;

  @Column({ type: 'decimal', precision: 18, scale: 3 })
  systemQuantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 3 })
  countedQuantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 3 })
  variance: number;

  @Column({ nullable: true })
  reason: string; // theft, damage, miscount, etc.

  @Column({ nullable: true })
  notes: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}

// Stock transfer between warehouses
@Entity('stock_transfers')
@Index(['transferNumber'], { unique: true })
export class StockTransfer {
  @PrimaryGeneratedColumn('uuid')
  transferId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ unique: true })
  transferNumber: string;

  @Column()
  transferDate: Date;

  @Column()
  sourceWarehouseId: string;

  @Column()
  sourceWarehouseName: string;

  @Column({ nullable: true })
  sourceLocationId: string;

  @Column({ nullable: true })
  destinationWarehouseId: string;

  @Column()
  destinationWarehouseName: string;

  @Column({ nullable: true })
  destinationLocationId: string;

  @Column({ nullable: true })
  referenceNumber: string;

  @Column({ default: 'pending' })
  status: string; // pending, in_transit, received, cancelled

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalQuantity: number;

  @Column({ nullable: true })
  sentBy: string;

  @Column({ nullable: true })
  receivedBy: string;

  @Column({ nullable: true })
  sentAt: Date;

  @Column({ nullable: true })
  receivedAt: Date;

  @Column({ nullable: true })
  notes: string;

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

  items: StockTransferItem[];
}

@Entity('stock_transfer_items')
export class StockTransferItem {
  @PrimaryGeneratedColumn('uuid')
  itemId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ name: 'transfer_id', nullable: true })
  transferId: string;

  transfer: StockTransfer;

  @Column()
  productId: string;

  @Column()
  productName: string;

  @Column({ nullable: true })
  batchId: string;

  @Column({ nullable: true })
  batchNumber: string;

  @Column({ type: 'decimal', precision: 18, scale: 3 })
  quantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  unitCost: number;

  @Column({ nullable: true })
  sourceLocationId: string;

  @Column({ nullable: true })
  destinationLocationId: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}

// Reorder point configuration
@Entity('reorder_points')

export class ReorderPoint {
  @PrimaryGeneratedColumn('uuid')
  reorderId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  productId: string;

  @Column()
  productName: string;

  @Column({ nullable: true })
  warehouseId: string;

  @Column({ nullable: true })
  warehouseName: string;

  @Column({ type: 'decimal', precision: 18, scale: 3 })
  reorderLevel: number; // Minimum stock level

  @Column({ type: 'decimal', precision: 18, scale: 3 })
  reorderQuantity: number; // Quantity to reorder

  @Column({ type: 'decimal', precision: 18, scale: 3 })
  maximumLevel: number; // Maximum stock level

  @Column({ type: 'int', default: 0 })
  leadTimeDays: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  autoReorder: boolean;

  @Column({ nullable: true })
  preferredVendorId: string;

  @Column({ nullable: true })
  preferredVendorName: string;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
