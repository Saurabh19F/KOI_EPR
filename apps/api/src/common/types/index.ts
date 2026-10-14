// Re-export PaginatedResult from the DTOs
export { PaginatedResult } from '../dto/pagination.dto';

// Re-export CurrentUserDto
export { CurrentUserDto } from '../dto/current-user.dto';

// ============================================
// SHARED TYPES - Use these in both Frontend and Backend
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ============ User & Auth Types ============

export interface User {
  userId: string;
  companyId?: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  roles: Role[];
  department?: Department;
  lastLoginAt?: string;
  emailVerified?: boolean;
}

export interface Role {
  roleId: string;
  roleName: string;
  roleCode: string;
  description?: string;
  level: number;
  permissions: Permission[];
}

export interface Permission {
  permissionId: string;
  name: string;
  code: string;
  module: string;
  description?: string;
}

export interface Department {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  description?: string;
  headUserId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
  requiresTwoFactor?: boolean;
}

// ============ Company Types ============

export interface Company {
  companyId: string;
  name: string;
  displayName?: string;
  logo?: string;
  address?: Address;
  phone?: string;
  email?: string;
  website?: string;
  gstin?: string;
  pan?: string;
  cin?: string;
  tan?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  stateCode: string;
  country: string;
  postalCode: string;
}

// ============ Product Types ============

export interface Product {
  productId: string;
  productCode: string;
  productName: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  hsnCode?: string;
  sacCode?: string;
  unitId?: string;
  unitName?: string;
  productType: 'goods' | 'services';
  taxCategory?: string;
  gstRate?: number;
  sellingPrice?: number;
  purchasePrice?: number;
  mrp?: number;
  reorderLevel?: number;
  reorderQuantity?: number;
  isActive: boolean;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  variantId: string;
  productId: string;
  sku: string;
  name: string;
  attributes: Record<string, string>;
  sellingPrice?: number;
  purchasePrice?: number;
  mrp?: number;
  isActive: boolean;
}

// ============ Inventory Types ============

export interface InventoryBatch {
  batchId: string;
  batchNumber: string;
  productId: string;
  productName: string;
  warehouseId?: string;
  warehouseName?: string;
  locationId?: string;
  locationName?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  quantity: number;
  reservedQuantity: number;
  unitCost: number;
  totalCost: number;
  vendorId?: string;
  grnId?: string;
  grnNumber?: string;
  barcode?: string;
  isActive: boolean;
  createdAt: string;
}

export interface StockReservation {
  reservationId: string;
  productId: string;
  productName: string;
  batchId?: string;
  batchNumber?: string;
  warehouseId?: string;
  warehouseName?: string;
  orderId: string;
  orderType: string;
  quantity: number;
  fulfilledQuantity: number;
  cancelledQuantity: number;
  status: 'pending' | 'partial' | 'fulfilled' | 'cancelled' | 'expired';
  expiryDate?: string;
}

export interface StockTransfer {
  transferId: string;
  transferNumber: string;
  transferDate: string;
  sourceWarehouseId: string;
  sourceWarehouseName: string;
  sourceLocationId?: string;
  destinationWarehouseId: string;
  destinationWarehouseName: string;
  destinationLocationId?: string;
  referenceNumber?: string;
  status: 'pending' | 'in_transit' | 'received' | 'cancelled';
  totalQuantity: number;
  items: StockTransferItem[];
}

export interface StockTransferItem {
  itemId: string;
  productId: string;
  productName: string;
  batchId?: string;
  batchNumber?: string;
  quantity: number;
  unitCost: number;
}

// ============ Financial Types ============

export interface Account {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  accountNature: AccountNature;
  accountGroupId?: string;
  accountGroupName?: string;
  parentAccountId?: string;
  parentAccountName?: string;
  openingBalance?: number;
  balanceType: 'debit' | 'credit';
  costCenterEnabled?: boolean;
  isActive: boolean;
}

export enum AccountType {
  ASSET = 'asset',
  LIABILITY = 'liability',
  EQUITY = 'equity',
  REVENUE = 'revenue',
  EXPENSE = 'expense',
}

export enum AccountNature {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

export interface JournalEntry {
  voucherId: string;
  voucherNumber: string;
  voucherDate: string;
  description?: string;
  entries: JournalEntryLine[];
  attachments?: string[];
  status: 'draft' | 'posted' | 'cancelled';
  totalDebit: number;
  totalCredit: number;
}

export interface JournalEntryLine {
  lineId: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  narration?: string;
  costCenterId?: string;
  costCenterName?: string;
}

export interface TrialBalanceEntry {
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  openingDebit: number;
  openingCredit: number;
  debit: number;
  credit: number;
  closingDebit: number;
  closingCredit: number;
}

export interface LedgerEntry {
  entryId: string;
  voucherId: string;
  voucherNumber: string;
  voucherDate: string;
  description?: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  balance: number;
  balanceType: 'debit' | 'credit';
  costCenterId?: string;
  costCenterName?: string;
  reference?: string;
  referenceType?: string;
}

export interface BalanceSheet {
  assets: {
    current: AccountGroupSummary[];
    nonCurrent: AccountGroupSummary[];
    total: number;
  };
  liabilities: {
    current: AccountGroupSummary[];
    nonCurrent: AccountGroupSummary[];
    total: number;
  };
  equity: {
    items: AccountGroupSummary[];
    total: number;
  };
  totalLiabilities: number;
  totalEquity: number;
}

export interface AccountGroupSummary {
  groupId: string;
  groupName: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  balance: number;
  children?: AccountGroupSummary[];
}

export interface ProfitLossStatement {
  revenue: {
    items: AccountGroupSummary[];
    total: number;
  };
  expenses: {
    items: AccountGroupSummary[];
    total: number;
  };
  grossProfit: number;
  netProfit: number;
}

// ============ Sales Types ============

export interface SalesOrder {
  orderId: string;
  orderNumber: string;
  orderDate: string;
  customerId: string;
  customerName: string;
  customerGstin?: string;
  billingAddress?: Address;
  shippingAddress?: Address;
  status: SalesOrderStatus;
  items: SalesOrderItem[];
  subtotal: number;
  sgstAmount: number;
  cgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  tcsAmount: number;
  discountAmount: number;
  roundOff: number;
  totalAmount: number;
  currency?: string;
  exchangeRate?: number;
  baseTotalAmount?: number;
  notes?: string;
  terms?: string;
  attachments?: string[];
}

export interface SalesOrderItem {
  itemId: string;
  productId: string;
  productName: string;
  sku?: string;
  hsnCode?: string;
  description?: string;
  quantity: number;
  unitId?: string;
  unitName?: string;
  rate: number;
  baseRate?: number;
  discountPercent?: number;
  discountAmount?: number;
  taxableAmount: number;
  taxPercent: number;
  sgstPercent?: number;
  sgstAmount?: number;
  cgstPercent?: number;
  cgstAmount?: number;
  igstPercent?: number;
  igstAmount?: number;
  cessPercent?: number;
  cessAmount?: number;
  totalAmount: number;
  batchId?: string;
  batchNumber?: string;
  deliveryDate?: string;
  deliveredQuantity?: number;
}

export enum SalesOrderStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface DeliveryNote extends Omit<SalesOrder, 'status' | 'items'> {
  status: DeliveryNoteStatus;
  items: DeliveryNoteItem[];
  salesOrderId?: string;
  salesOrderNumber?: string;
  invoiceId?: string;
  invoiceNumber?: string;
}

export interface DeliveryNoteItem extends Omit<SalesOrderItem, 'discountPercent' | 'discountAmount' | 'deliveryDate' | 'deliveredQuantity'> {
  deliveredQuantity: number;
  pendingQuantity: number;
}

export enum DeliveryNoteStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface SalesInvoice extends Omit<SalesOrder, 'status'> {
  status: InvoiceStatus;
  items: SalesInvoiceItem[];
  deliveryNoteId?: string;
  deliveryNoteNumber?: string;
  eInvoiceNumber?: string;
  eWayBillNumber?: string;
  irn?: string;
  ackNumber?: string;
  ackDate?: string;
}

export interface SalesInvoiceItem extends SalesOrderItem {
  warehouseId?: string;
  warehouseName?: string;
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  PRINTED = 'printed',
  CANCELLED = 'cancelled',
}

// ============ Purchase Types ============

export interface PurchaseOrder {
  orderId: string;
  orderNumber: string;
  orderDate: string;
  vendorId: string;
  vendorName: string;
  vendorGstin?: string;
  billingAddress?: Address;
  shippingAddress?: Address;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  subtotal: number;
  sgstAmount: number;
  cgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  tdsAmount: number;
  discountAmount: number;
  roundOff: number;
  totalAmount: number;
  currency?: string;
  exchangeRate?: number;
  baseTotalAmount?: number;
  notes?: string;
  terms?: string;
}

export interface PurchaseOrderItem {
  itemId: string;
  productId: string;
  productName: string;
  sku?: string;
  hsnCode?: string;
  description?: string;
  quantity: number;
  unitId?: string;
  unitName?: string;
  rate: number;
  baseRate?: number;
  discountPercent?: number;
  discountAmount?: number;
  taxableAmount: number;
  taxPercent: number;
  sgstPercent?: number;
  sgstAmount?: number;
  cgstPercent?: number;
  cgstAmount?: number;
  igstPercent?: number;
  igstAmount?: number;
  cessPercent?: number;
  cessAmount?: number;
  totalAmount: number;
  expectedDeliveryDate?: string;
  receivedQuantity?: number;
}

export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface GoodsReceiptNote extends Omit<PurchaseOrder, 'status' | 'items'> {
  status: GoodsReceiptNoteStatus;
  items: GoodsReceiptNoteItem[];
  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
  invoiceId?: string;
  invoiceNumber?: string;
}

export interface GoodsReceiptNoteItem extends Omit<PurchaseOrderItem, 'discountPercent' | 'discountAmount' | 'expectedDeliveryDate' | 'receivedQuantity'> {
  receivedQuantity: number;
  rejectedQuantity: number;
  batchId?: string;
  batchNumber?: string;
  warehouseId?: string;
  warehouseName?: string;
  locationId?: string;
  locationName?: string;
}

export enum GoodsReceiptNoteStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface PurchaseInvoice extends Omit<PurchaseOrder, 'status'> {
  status: PurchaseInvoiceStatus;
  items: PurchaseInvoiceItem[];
  grnId?: string;
  grnNumber?: string;
}

export interface PurchaseInvoiceItem extends PurchaseOrderItem {
  warehouseId?: string;
  warehouseName?: string;
  batchId?: string;
  batchNumber?: string;
}

export enum PurchaseInvoiceStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  PAID = 'paid',
  PARTIAL = 'partial',
  CANCELLED = 'cancelled',
}

// ============ Report Types ============

export interface ReportDefinition {
  reportId: string;
  name: string;
  description?: string;
  type: ReportType;
  defaultFormat: ReportFormat;
  columns?: ReportColumn[];
  filters?: ReportFilter[];
  isSystem: boolean;
}

export interface ReportColumn {
  field: string;
  header: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  format?: 'currency' | 'date' | 'number' | 'percentage';
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

export interface ReportFilter {
  field: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'dateRange' | 'select' | 'multiSelect';
  required?: boolean;
  options?: { label: string; value: any }[];
}

export enum ReportType {
  FINANCIAL = 'financial',
  INVENTORY = 'inventory',
  SALES = 'sales',
  PURCHASE = 'purchase',
  TAX = 'tax',
  CUSTOM = 'custom',
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  HTML = 'html',
}

export interface GeneratedReport {
  reportInstanceId: string;
  reportId: string;
  reportName: string;
  type: ReportType;
  format: ReportFormat;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
  expiresAt?: string;
}

// ============ GST Types ============

export interface GstSummary {
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalTax: number;
  totalAmount: number;
}

export interface GstRateBreakdown {
  rate: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  count: number;
}

// ============ Currency Types ============

export interface Currency {
  currencyId: string;
  currencyCode: string;
  currencyName: string;
  symbol: string;
  decimalPlaces: number;
  isBaseCurrency: boolean;
  exchangeRate?: number;
}

export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  effectiveDate: string;
}
