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

export enum SalesOrderStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  PURCHASE_IN_PROGRESS = 'purchase_in_progress',
  PURCHASE_COMPLETED = 'purchase_completed',
  PARTIALLY_SHIPPED = 'partially_shipped',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  ACCOUNTANT_REVIEW = 'accountant_review',
  INVOICED = 'invoiced',
  CANCELLED = 'cancelled',
  CLOSED = 'closed',
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  VALIDATED = 'validated',
  E_INVOICED = 'e_invoiced',
  SENT = 'sent',
  PAID = 'paid',
  PARTIAL = 'partial',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

@Entity('sales_orders')
@Index(['orderNumber'], { unique: true })


@Index(['orderDate'])
export class SalesOrder {
  @PrimaryGeneratedColumn('uuid')
  orderId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ unique: true })
  orderNumber: string;

  @Column({ nullable: true })
  enquiryId: string; // Linked sales enquiry

  @Column({ nullable: true })
  quotationId: string; // Linked quotation

  @Column()
  orderDate: Date;

  @Column({ nullable: true })
  expectedDeliveryDate: Date;

  @Column({ nullable: true })
  customerId: string;

  @Column()
  customerName: string;

  @Column({ nullable: true })
  customerCode: string;

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
  billingGstin: string;

  @Column({ type: 'text', nullable: true })
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
  shippingGstin: string;

  @Column({ nullable: true })
  salesPersonId: string;

  @Column({ nullable: true })
  salesPersonName: string;

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

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalInBaseCurrency: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalCgstWeight: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalInWords: string;

  @Column({ type: 'text', nullable: true })
  termsAndConditions: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  poNumber: string; // Customer's PO number

  @Column({ nullable: true })
  poDate: Date;

  @Column({ default: false })
  isExport: boolean;

  @Column({ nullable: true })
  exportCountry: string;

  @Column({ nullable: true })
  portOfLoading: string;

  @Column({ nullable: true })
  portOfDischarge: string;

  @Column({ nullable: true })
  piNumber: string;

  @Column({ nullable: true })
  containerSize: string;

  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  cbmRequired: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  grossWeight: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  netWeight: number;

  @Column({ type: 'int', default: 0 })
  repunchCount: number;

  @Column({ type: 'text', nullable: true })
  shipmentDetails: string;

  @Column({ nullable: true })
  preCarriageBy: string;

  @Column({ nullable: true })
  placeOfReceipt: string;

  @Column({ default: false })
  isQuotationConverted: boolean;

  @Column({ type: 'enum', enum: SalesOrderStatus, default: SalesOrderStatus.DRAFT })
  status: SalesOrderStatus;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  approvedAt: Date;

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

  items: SalesOrderItem[];
}

@Entity('sales_order_items')
@Index(['orderId'])
export class SalesOrderItem {
  @PrimaryGeneratedColumn('uuid')
  itemId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ name: 'order_id', nullable: true })
  orderId: string;

  order: SalesOrder;

  @Column({ type: 'int' })
  lineNumber: number;

  @Column({ nullable: true })
  productId: string;

  @Column()
  productName: string;

  @Column({ nullable: true })
  productCode: string;

  @Column({ nullable: true })
  categoryName: string;

  @Column({ nullable: true })
  brandName: string;

  @Column({ nullable: true })
  sku: string;

  @Column({ nullable: true })
  hsnCode: string;

  @Column({ nullable: true })
  uomId: string;

  @Column({ nullable: true })
  uomName: string;

  @Column({ nullable: true })
  unitSize: string;

  @Column({ nullable: true })
  unitBasis: string;

  @Column({ nullable: true })
  packingType: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  purchasePersonId: string;

  @Column({ nullable: true })
  purchasePersonName: string;

  @Column({ type: 'decimal', precision: 18, scale: 3, default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 3, nullable: true })
  unitsPerCase: number;

  @Column({ type: 'decimal', precision: 18, scale: 3, default: 0 })
  shippedQuantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 3, default: 0 })
  invoicedQuantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  mrp: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  buyingBestLandingRate: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  landingCost: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  discountPercent: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  taxableAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  gstRate: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  cgstRate: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  sgstRate: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  igstRate: number;

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

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  weight: number;

  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  perPcRateWithoutGst: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  otherCost: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  gstCost: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  totalRatePerBox: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  rateWithGstCost: number;

  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  finalPriceInForeignCurrency: number;

  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  ratePerCarton: number;

  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  cbmPerBox: number;

  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  cbmCostPerBoxInSelectedCurrency: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  haulage: number;

  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  finalRate: number;

  @Column({ type: 'decimal', precision: 18, scale: 3, nullable: true })
  orderedQuantity: number;

  @Column({ nullable: true })
  shiftOrderNo: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  dimensionL: number;

  @Column({ nullable: true })
  dimensionB: number;

  @Column({ nullable: true })
  dimensionH: number;

  @Column({ nullable: true })
  dimensionUom: string;

  @Column({ nullable: true })
  enquiryNo: string;

  @Column({ nullable: true })
  remarks: string;

  @Column({ nullable: true })
  currencyType: string;

  @Column({ default: false })
  itemSelected: boolean;

  @Column({ nullable: true })
  itemStatus: string;

  @Column({ nullable: true })
  importedBy: string;

  @Column({ nullable: true })
  poi: string;

  @Column({ type: 'text', nullable: true })
  nutrition: string;

  @Column({ type: 'text', nullable: true })
  ingredients: string;

  @Column({ nullable: true })
  barcode: string;

  @Column({ nullable: true })
  batchNumber: string;

  @Column({ type: 'int', nullable: true })
  shelfLifeMonths: number;

  @Column({ nullable: true })
  mfgDate: string;

  @Column({ type: 'text', nullable: true })
  allergenAdvice: string;

  @Column({ nullable: true })
  netWeight: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}

// Delivery Note / Delivery Challan
@Entity('delivery_notes')
@Index(['noteNumber'], { unique: true })
@Index(['orderId'])
export class DeliveryNote {
  @PrimaryGeneratedColumn('uuid')
  noteId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ unique: true })
  noteNumber: string;

  @Column({ nullable: true })
  orderId: string;

  @Column()
  noteDate: Date;

  @Column({ nullable: true })
  customerId: string;

  @Column()
  customerName: string;

  @Column({ nullable: true })
  customerGstin: string;

  @Column({ nullable: true })
  billingAddress: string;

  @Column({ nullable: true })
  shippingAddress: string;

  @Column({ nullable: true })
  vehicleNumber: string;

  @Column({ nullable: true })
  transporterName: string;

  @Column({ nullable: true })
  lrNumber: string;

  @Column({ nullable: true })
  lrDate: Date;

  @Column({ nullable: true })
  eWayBillNumber: string;

  @Column({ nullable: true })
  eWayBillDate: Date;

  @Column({ nullable: true })
  eWayBillValidUntil: Date;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ default: 'pending' })
  status: string;

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

  items: DeliveryNoteItem[];
}

@Entity('delivery_note_items')
export class DeliveryNoteItem {
  @PrimaryGeneratedColumn('uuid')
  itemId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ name: 'note_id', nullable: true })
  noteId: string;

  note: DeliveryNote;

  @Column()
  orderItemId: string; // Link to sales order item

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
  quantity: number;

  @Column({ nullable: true })
  batchNumber: string;

  @Column({ nullable: true })
  expiryDate: Date;

  @Column({ nullable: true })
  dimensionL: number;

  @Column({ nullable: true })
  dimensionB: number;

  @Column({ nullable: true })
  dimensionH: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}

// Sales Invoice
@Entity('sales_invoices')
@Index(['invoiceNumber'], { unique: true })

@Index(['customerId'])
export class SalesInvoice {
  @PrimaryGeneratedColumn('uuid')
  invoiceId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ unique: true })
  invoiceNumber: string;

  @Column({ nullable: true })
  orderId: string;

  @Column({ nullable: true })
  deliveryNoteId: string;

  @Column({ nullable: true })
  deliveryNoteNumber: string;

  @Column()
  invoiceDate: Date;

  @Column({ nullable: true })
  dueDate: Date;

  @Column({ nullable: true })
  customerId: string;

  @Column()
  customerName: string;

  @Column({ nullable: true })
  customerCode: string;

  @Column({ nullable: true })
  customerGstin: string;

  @Column({ nullable: true })
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
  reverseCharge: boolean;

  @Column({ nullable: true })
  invoiceType: string; // REG, SEZWP, SEZWP, EXP, DEX

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

  @Column({ type: 'text', nullable: true })
  termsAndConditions: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  eInvoiceNumber: string;

  @Column({ nullable: true })
  eInvoiceDate: Date;

  @Column({ nullable: true })
  eWayBillNumber: string;

  @Column({ nullable: true })
  eWayBillDate: Date;

  @Column({ nullable: true })
  eWayBillValidUntil: Date;

  @Column({ nullable: true })
  irn: string; // Invoice Reference Number from e-invoice

  @Column({ nullable: true })
  ackNumber: string; // Acknowledgment number

  @Column({ nullable: true })
  ackDate: Date;

  @Column({ nullable: true })
  qrCodeUrl: string;

  @Column({ nullable: true })
  qrCodeBase64: string;

  @Column({ nullable: true })
  pdfUrl: string;

  @Column({ nullable: true })
  vehicleNumber: string;

  @Column({ nullable: true })
  transporterName: string;

  @Column({ nullable: true })
  distance: number;

  @Column({ nullable: true })
  eDocumentNumber: string;

  @Column({ nullable: true })
  eDocumentDate: Date;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  status: InvoiceStatus;

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

  items: SalesInvoiceItem[];
}

@Entity('sales_invoice_items')
export class SalesInvoiceItem {
  @PrimaryGeneratedColumn('uuid')
  itemId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ name: 'invoice_id', nullable: true })
  invoiceId: string;

  invoice: SalesInvoice;

  @Column({ nullable: true })
  orderItemId: string;

  @Column({ nullable: true })
  deliveryNoteItemId: string;

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

  @Column({ nullable: true })
  serialNumbers: string; // JSON array of serial numbers

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}

// Credit Note (for sales returns)
@Entity('credit_notes')
@Index(['creditNoteNumber'], { unique: true })
export class CreditNote {
  @PrimaryGeneratedColumn('uuid')
  creditNoteId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ unique: true })
  creditNoteNumber: string;

  @Column({ nullable: true })
  invoiceId: string;

  @Column({ nullable: true })
  invoiceNumber: string;

  @Column({ nullable: true })
  customerId: string;

  @Column()
  customerName: string;

  @Column({ nullable: true })
  customerGstin: string;

  @Column()
  creditNoteDate: Date;

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
