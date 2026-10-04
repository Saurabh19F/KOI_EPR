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

export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  PARTIALLY_RECEIVED = 'partially_received',
  RECEIVED = 'received',
  INVOICED = 'invoiced',
  CANCELLED = 'cancelled',
  CLOSED = 'closed',
}

export enum VendorType {
  LOCAL = 'local',
  OUTSTATION = 'outstation',
  IMPORT = 'import',
}

export enum PurchaseInvoiceStatus {
  DRAFT = 'draft',
  VALIDATED = 'validated',
  APPROVED = 'approved',
  PAID = 'paid',
  PARTIAL = 'partial',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

@Entity('purchase_orders')
export class PurchaseOrder {
  @PrimaryGeneratedColumn('uuid')
  orderId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ unique: true })
  orderNumber: string;

  @Column({ nullable: true })
  quoteId: string; // Linked purchase quote

  @Column({ nullable: true })
  salesEnquiryId: string; // Linked sales enquiry

  @Column()
  orderDate: Date;

  @Column({ nullable: true })
  expectedDeliveryDate: Date;

  @Column({ nullable: true })
  vendorId: string;

  @Column()
  vendorName: string;

  @Column({ nullable: true })
  vendorCode: string;

  @Column({ nullable: true })
  vendorGstin: string;

  @Column({ type: 'enum', enum: VendorType, nullable: true })
  vendorType: VendorType;

  @Column({ nullable: true })
  vendorMobileNo: string;

  @Column({ nullable: true })
  purchasePersonId: string;

  @Column({ nullable: true })
  purchasePerson: string; // Person handling this PO

  @Column({ nullable: true })
  contactPerson: string;

  @Column({ nullable: true })
  contactPhone: string;

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ type: 'text', nullable: true })
  billingAddress: string;

  @Column({ nullable: true })
  billingCountry: string;

  @Column({ nullable: true })
  billingState: string;

  @Column({ nullable: true })
  billingStateCode: string;

  @Column({ nullable: true })
  billingCity: string;

  @Column({ nullable: true })
  billingPincode: string;

  @Column({ nullable: true })
  shippingAddress: string;

  @Column({ nullable: true })
  shippingCountry: string;

  @Column({ nullable: true })
  shippingState: string;

  @Column({ nullable: true })
  shippingStateCode: string;

  @Column({ nullable: true })
  shippingCity: string;

  @Column({ nullable: true })
  shippingPincode: string;

  @Column({ nullable: true })
  paymentTermsId: string;

  @Column({ nullable: true })
  paymentTermsName: string;

  @Column({ nullable: true })
  currencyId: string;

  @Column({ nullable: true })
  currencyCode: string;

  @Column({ type: 'decimal', precision: 18, scale: 6, default: 1 })
  exchangeRate: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountPercent: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  cgstAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  sgstAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  igstAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  cessAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  freightAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  packingAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  insuranceAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  otherCharges: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  roundOff: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'text', nullable: true })
  termsAndConditions: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  poNumber: string; // Our PO number

  @Column({ default: false })
  isImport: boolean;

  @Column({ nullable: true })
  countryOfOrigin: string;

  @Column({ nullable: true })
  portOfEntry: string;

  @Column({ nullable: true })
  preCarriageBy: string;

  @Column({ nullable: true })
  placeOfReceipt: string;

  @Column({ type: 'enum', enum: PurchaseOrderStatus, default: PurchaseOrderStatus.DRAFT })
  status: PurchaseOrderStatus;

  @Column({ nullable: true })
  poUrl: string; // URL to generated PO PDF

  @Column({ nullable: true })
  location: string; // Delivery/warehouse location

  @Column({ nullable: true })
  freightTerm: string; // Paid / To Pay / Add in Invoice

  @Column({ nullable: true })
  salesPersonId: string;

  @Column({ nullable: true })
  salesPersonName: string;

  @Column({ nullable: true })
  enquiryNo: string; // Linked enquiry number

  @Column({ nullable: true })
  soNo: string; // Linked sales order number

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  approvedAt: Date;

  // Activity-01: Accountant fields
  @Column({ nullable: true })
  act1PlannedDate: Date;

  @Column({ nullable: true })
  act1ActualDate: Date;

  @Column({ nullable: true })
  act1PoLink: string;

  @Column({ nullable: true })
  act1PoNum: string;

  @Column({ nullable: true })
  act1PoDate: Date;

  @Column({ type: 'text', nullable: true })
  act1Remarks: string;

  @Column({ nullable: true })
  act1UpdatedBy: string;

  @Column({ nullable: true })
  act1UpdatedAt: Date;

  // Activity-02: Chief Accountant fields
  @Column({ nullable: true })
  act2PlannedDate: Date;

  @Column({ nullable: true })
  act2ActualDate: Date;

  @Column({ nullable: true })
  act2Approval: string;

  @Column({ type: 'text', nullable: true })
  act2Remarks: string;

  @Column({ nullable: true })
  act2UpdatedBy: string;

  @Column({ nullable: true })
  act2UpdatedAt: Date;

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

  @OneToMany(() => PurchaseOrderItem, (item) => item.order)
  items: PurchaseOrderItem[];
}

@Entity('purchase_order_items')
export class PurchaseOrderItem {
  @PrimaryGeneratedColumn('uuid')
  itemId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ name: 'order_id', nullable: true })
  orderId: string;

  @ManyToOne(() => PurchaseOrder, (po) => po.items)
  @JoinColumn({ name: 'order_id' })
  order: PurchaseOrder;

  @Column({ type: 'int' })
  lineNumber: number;

  @Column({ nullable: true })
  productId: string;

  @Column()
  productName: string;

  @Column({ nullable: true })
  productCode: string;

  @Column({ nullable: true })
  sku: string;

  @Column({ nullable: true })
  hsnCode: string;

  @Column({ nullable: true })
  uniqueCode: string; // Unique product code from spreadsheet

  @Column({ nullable: true })
  uomId: string;

  @Column({ nullable: true })
  uomName: string; // Unit: Per Kg / Per Pcs

  @Column({ type: 'decimal', precision: 18, scale: 3, default: 0 })
  orderQty: number; // Original ordered quantity

  @Column({ type: 'decimal', precision: 18, scale: 3, default: 1 })
  quantity: number; // Actual/confirmed quantity

  @Column({ type: 'decimal', precision: 18, scale: 3, default: 0 })
  receivedQuantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 3, default: 0 })
  invoicedQuantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 3, default: 0 })
  balanceQty: number; // Remaining qty to be delivered

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  discountPercent: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  taxableAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  gstRate: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  cgstAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  sgstAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  igstAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  cessAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ nullable: true })
  enquiryNo: string; // Enquiry reference number

  @Column({ nullable: true })
  enquiryDate: Date;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  bestPrice: number; // Best price as on GST

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  quotedPrice: number; // Quoted price

  @Column({ nullable: true })
  approvedBy: string; // Per-item approval

  @Column({ nullable: true })
  jat: string; // JAT code

  @Column({ type: 'decimal', precision: 18, scale: 3, nullable: true })
  currentStock: number;

  @Column({ default: false })
  noNeed: boolean; // Flag: item not needed

  @Column({ default: false })
  indent: boolean; // Flag: indent raised for this item

  @Column({ nullable: true })
  leadTimeDays: number;

  @Column({ nullable: true })
  soNo: string; // Sales order number

  @Column({ nullable: true })
  merge: string; // Merge indicator

  @Column({ nullable: true })
  formula: string; // Calculation formula

  @Column({ nullable: true })
  location: string; // Item delivery location

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}

// Vendor Master
@Entity('vendor_masters')
@Index(['companyId', 'vendorCode'], { unique: true })
export class VendorMaster {
  @PrimaryGeneratedColumn('uuid')
  vendorId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  vendorName: string;

  @Column({ nullable: true })
  vendorCode: string;

  @Column({ type: 'enum', enum: VendorType, nullable: true })
  vendorType: VendorType;

  @Column({ nullable: true })
  contactPerson: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  mobileNo: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  stateCode: string;

  @Column({ nullable: true })
  pincode: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  gstin: string;

  @Column({ nullable: true })
  fssaiNumber: string;

  @Column({ nullable: true })
  panNumber: string;

  @Column({ nullable: true })
  category: string; // Vendor category

  @Column({ type: 'text', nullable: true })
  productsSupplied: string; // Comma-separated products

  @Column({ nullable: true })
  paymentTerms: string;

  @Column({ nullable: true })
  purchasePerson: string; // Assigned purchase person

  @Column({ nullable: true })
  bankName: string;

  @Column({ nullable: true })
  bankAccountNo: string;

  @Column({ nullable: true })
  bankIfsc: string;

  @Column({ nullable: true })
  bankBranch: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  rating: number; // Vendor rating 0-5

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
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

// PO Approval Sheet - tracks per-PO approval workflow
@Entity('po_approvals')
@Index(['companyId', 'orderId'])
export class POApproval {
  @PrimaryGeneratedColumn('uuid')
  approvalId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  orderId: string;

  @Column()
  orderNumber: string;

  @Column()
  vendorName: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ nullable: true })
  requestedBy: string;

  @Column({ nullable: true })
  requestedByName: string;

  @Column({ nullable: true })
  requestedAt: Date;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  approvedByName: string;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ default: 'pending' })
  status: string; // pending, approved, rejected

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Goods Receipt Note (GRN)
@Entity('goods_receipt_notes')
@Index(['grnNumber'], { unique: true })
@Index(['orderId'])
export class GoodsReceiptNote {
  @PrimaryGeneratedColumn('uuid')
  grnId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ unique: true })
  grnNumber: string;

  @Column({ nullable: true })
  orderId: string;

  @Column()
  grnDate: Date;

  @Column({ nullable: true })
  vendorId: string;

  @Column()
  vendorName: string;

  @Column({ nullable: true })
  vendorGstin: string;

  @Column({ nullable: true })
  invoiceNumber: string;

  @Column({ nullable: true })
  invoiceDate: Date;

  @Column({ nullable: true })
  lrNumber: string;

  @Column({ nullable: true })
  lrDate: Date;

  @Column({ nullable: true })
  vehicleNumber: string;

  @Column({ nullable: true })
  transporterName: string;

  @Column({ nullable: true })
  eWayBillNumber: string;

  @Column({ nullable: true })
  eWayBillDate: Date;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ nullable: true })
  notes: string;

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

  items: GoodsReceiptNoteItem[];
}

@Entity('goods_receipt_note_items')
export class GoodsReceiptNoteItem {
  @PrimaryGeneratedColumn('uuid')
  itemId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ name: 'grn_id', nullable: true })
  grnId: string;

  grn: GoodsReceiptNote;

  @Column()
  orderItemId: string;

  @Column({ type: 'int' })
  lineNumber: number;

  @Column({ nullable: true })
  productId: string;

  @Column()
  productName: string;

  @Column({ nullable: true })
  sku: string;

  @Column({ nullable: true })
  hsnCode: string;

  @Column({ nullable: true })
  uomName: string;

  @Column({ type: 'decimal', precision: 18, scale: 3 })
  orderedQuantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 3 })
  receivedQuantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 3, default: 0 })
  acceptedQuantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 3, default: 0 })
  rejectedQuantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  taxableAmount: number;

  @Column({ nullable: true })
  batchNumber: string;

  @Column({ nullable: true })
  expiryDate: Date;

  @Column({ nullable: true })
  manufacturingDate: Date;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}

// Purchase Invoice
@Entity('purchase_invoices')
@Index(['invoiceNumber'], { unique: true })

@Index(['vendorId'])
export class PurchaseInvoice {
  @PrimaryGeneratedColumn('uuid')
  invoiceId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ unique: true })
  invoiceNumber: string;

  @Column({ nullable: true })
  orderId: string;

  @Column({ nullable: true })
  grnId: string;

  @Column({ nullable: true })
  grnNumber: string;

  @Column()
  invoiceDate: Date;

  @Column()
  vendorId: string;

  @Column()
  vendorName: string;

  @Column({ nullable: true })
  vendorCode: string;

  @Column({ nullable: true })
  vendorGstin: string;

  @Column({ nullable: true })
  vendorAddress: string;

  @Column({ nullable: true })
  vendorStateCode: string;

  @Column({ nullable: true })
  billingAddress: string;

  @Column({ nullable: true })
  billingStateCode: string;

  @Column({ nullable: true })
  reverseCharge: boolean;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  cgstAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  sgstAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  igstAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  cessAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  freightAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  packingAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  insuranceAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  otherCharges: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  roundOff: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  tdsAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  netAmount: number;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({ nullable: true })
  eInvoiceNumber: string;

  @Column({ nullable: true })
  irn: string;

  @Column({ nullable: true })
  eWayBillNumber: string;

  @Column({ nullable: true })
  eWayBillDate: Date;

  @Column({ nullable: true })
  lrNumber: string;

  @Column({ nullable: true })
  vehicleNumber: string;

  @Column({ type: 'text', nullable: true })
  termsAndConditions: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'enum', enum: PurchaseInvoiceStatus, default: PurchaseInvoiceStatus.DRAFT })
  status: PurchaseInvoiceStatus;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  cancelledBy: string;

  @Column({ nullable: true })
  cancelledAt: Date;

  @Column({ type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;

  items: PurchaseInvoiceItem[];
}

@Entity('purchase_invoice_items')
export class PurchaseInvoiceItem {
  @PrimaryGeneratedColumn('uuid')
  itemId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ name: 'invoice_id', nullable: true })
  invoiceId: string;

  invoice: PurchaseInvoice;

  @Column()
  orderItemId: string;

  @Column({ nullable: true })
  grnItemId: string;

  @Column({ type: 'int' })
  lineNumber: number;

  @Column({ nullable: true })
  productId: string;

  @Column()
  productName: string;

  @Column({ nullable: true })
  productCode: string;

  @Column({ nullable: true })
  sku: string;

  @Column({ nullable: true })
  hsnCode: string;

  @Column({ nullable: true })
  uomName: string;

  @Column({ type: 'decimal', precision: 18, scale: 3 })
  quantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  discountPercent: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  taxableAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  gstRate: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  cgstAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  sgstAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  igstAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  cessAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  totalAmount: number;

  @Column({ nullable: true })
  batchNumber: string;

  @Column({ nullable: true })
  expiryDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}

// Debit Note (for purchase returns)
@Entity('debit_notes')
@Index(['debitNoteNumber'], { unique: true })
export class DebitNote {
  @PrimaryGeneratedColumn('uuid')
  debitNoteId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ unique: true })
  debitNoteNumber: string;

  @Column({ nullable: true })
  invoiceId: string;

  @Column({ nullable: true })
  invoiceNumber: string;

  @Column()
  vendorId: string;

  @Column()
  vendorName: string;

  @Column({ nullable: true })
  vendorGstin: string;

  @Column()
  debitNoteDate: Date;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ nullable: true })
  reason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  eInvoiceNumber: string;

  @Column({ nullable: true })
  irn: string;

  @Column({ default: 'draft' })
  status: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
