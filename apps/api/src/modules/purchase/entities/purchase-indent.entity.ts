import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum IndentStatus {
  PENDING = 'pending',
  RAISED = 'raised',
  PARTIAL = 'partial',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * Tracks purchase indent assignments per order item per person.
 * Maps to the Purchase Indent Dashboard spreadsheet structure.
 */
@Entity('purchase_indent_items')
@Index(['companyId', 'orderNo'])
@Index(['companyId', 'assignedTo'])
@Index(['companyId', 'indentStatus'])
export class PurchaseIndentItem {
  @PrimaryGeneratedColumn('uuid')
  indentItemId: string;

  @Column({ nullable: true })
  companyId: string;

  // Reference to the sales enquiry order
  @Column({ nullable: true })
  enquiryOrderId: string;

  @Column({ nullable: true })
  orderNo: string;

  @Column({ nullable: true })
  orderDate: Date;

  @Column({ nullable: true })
  plannedDate: Date;

  // Sales person who created the order
  @Column({ nullable: true })
  salesPersonId: string;

  @Column({ nullable: true })
  salesPersonName: string;

  // Product details (from enquiry item)
  @Column({ nullable: true })
  enquiryItemId: string;

  @Column({ nullable: true })
  productId: string;

  @Column({ nullable: true })
  productCode: string;

  @Column({ nullable: true })
  productName: string;

  @Column({ nullable: true, type: 'text' })
  productDescription: string;

  @Column({ nullable: true })
  unitSize: string;

  @Column({ nullable: true })
  unitPerCarton: number;

  @Column({ nullable: true })
  brandName: string;

  @Column({ nullable: true })
  categoryName: string;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  // Purchase team member assigned to raise indent for this item
  @Column({ nullable: true })
  assignedTo: string;

  @Column({ nullable: true })
  assignedToName: string;

  // Indent tracking
  @Column({
    type: 'enum',
    enum: IndentStatus,
    default: IndentStatus.PENDING,
  })
  indentStatus: IndentStatus;

  @Column({ default: false })
  isIndentRaised: boolean;

  // Link to the purchase quote created for this indent
  @Column({ nullable: true })
  purchaseQuoteId: string;

  @Column({ nullable: true })
  purchaseQuoteNo: string;

  @Column({ nullable: true })
  indentRaisedAt: Date;

  @Column({ nullable: true })
  indentRaisedBy: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

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

/**
 * Tracks indent assignment at the order level per person.
 * Aggregated view for the dashboard.
 */
@Entity('purchase_indent_orders')
@Index(['companyId', 'orderNo'], { unique: true })
@Index(['companyId', 'salesPersonName'])
export class PurchaseIndentOrder {
  @PrimaryGeneratedColumn('uuid')
  indentOrderId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ nullable: true })
  enquiryOrderId: string;

  @Column()
  orderNo: string;

  @Column({ nullable: true })
  orderDate: Date;

  @Column({ nullable: true })
  plannedDate: Date;

  @Column({ nullable: true })
  salesPersonId: string;

  @Column({ nullable: true })
  salesPersonName: string;

  @Column({ type: 'int', default: 0 })
  totalItems: number;

  @Column({ type: 'int', default: 0 })
  totalIndentRaised: number;

  @Column({ type: 'int', default: 0 })
  totalIndentNotRaised: number;

  @Column({ nullable: true })
  pendingFrom: string;

  @Column({ default: 'pending' })
  status: string;

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
