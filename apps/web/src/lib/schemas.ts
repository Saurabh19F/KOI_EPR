import { z } from 'zod';

// ========== COMMON SCHEMAS ==========

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const searchSchema = z.object({
  search: z.string().optional(),
});

// ========== AUTH SCHEMAS ==========

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().optional(),
});

// ========== PRODUCT SCHEMAS ==========

export const createProductSchema = z.object({
  productName: z.string().min(1, 'Product name is required').max(200),
  productCode: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional().nullable(),
  segmentId: z.string().uuid().optional().nullable(),
  groupId: z.string().uuid().optional().nullable(),
  brandId: z.string().uuid().optional().nullable(),
  uomId: z.string().uuid().optional().nullable(),
  gstRateId: z.string().uuid().optional().nullable(),
  weight: z.number().positive().optional(),
  cbmPerBox: z.number().positive().optional(),
  unitsPerCase: z.number().int().positive().optional(),
  totalCbm: z.number().positive().optional(),
  dimensions: z.string().optional(),
  hsCode: z.string().optional(),
  standardCost: z.number().min(0).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  segmentId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
});

// ========== CUSTOMER SCHEMAS ==========

export const createCustomerSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').max(200),
  contactPerson: z.string().optional(),
  contactPersonNo: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  billingAddress: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingCountry: z.string().optional(),
  billingPincode: z.string().optional(),
  deliveryAddress: z.string().optional(),
  deliveryCity: z.string().optional(),
  zone: z.string().optional(),
  paymentTermsId: z.string().uuid().optional().nullable(),
  creditLimit: z.number().min(0).optional(),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();
export const customerQuerySchema = searchSchema.extend({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  isActive: z.coerce.boolean().optional(),
  zone: z.string().optional(),
});



// ========== SALES ENQUIRY SCHEMAS ==========

export const enquiryItemSchema = z.object({
  productName: z.string().min(1, 'Product name is required'),
  sku: z.string().optional(),
  quantity: z.number().positive('Quantity must be positive'),
  expectedRate: z.number().min(0).optional(),
  uom: z.string().optional(),
  description: z.string().optional(),
});

export const createEnquirySchema = z.object({
  customerId: z.string().uuid().optional().nullable(),
  referenceNo: z.string().optional(),
  remarks: z.string().max(500).optional(),
  items: z.array(enquiryItemSchema).min(1, 'At least one item is required'),
});

export const updateEnquirySchema = z.object({
  customerId: z.string().uuid().optional().nullable(),
  referenceNo: z.string().optional(),
  remarks: z.string().max(1000).optional(),
});

export const enquiryStatusSchema = z.object({
  status: z.enum(['draft', 'submitted', 'approved', 'rejected', 'cancelled', 'completed']),
  remarks: z.string().max(500).optional(),
});

// ========== PURCHASE QUOTE SCHEMAS ==========

export const purchaseItemSchema = z.object({
  productName: z.string().min(1, 'Product name is required'),
  sku: z.string().optional(),
  quantity: z.number().positive('Quantity must be positive'),
  targetRate: z.number().min(0).optional(),
  vendorId: z.string().uuid().optional().nullable(),
  description: z.string().optional(),
});

export const createPurchaseQuoteSchema = z.object({
  enquiryOrderId: z.string().uuid().optional().nullable(),
  referenceNo: z.string().optional(),
  remarks: z.string().max(500).optional(),
  items: z.array(purchaseItemSchema).min(1, 'At least one item is required'),
});

export const updatePurchaseQuoteSchema = z.object({
  remarks: z.string().max(1000).optional(),
});

// ========== INVENTORY SCHEMAS ==========

export const warehouseSchema = z.object({
  code: z.string().min(1, 'Warehouse code is required').max(50),
  name: z.string().min(1, 'Warehouse name is required').max(200),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  isDefault: z.boolean().default(false),
});

export const adjustStockSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  warehouseId: z.string().uuid('Invalid warehouse ID'),
  quantity: z.number().positive('Quantity must be positive'),
  type: z.enum(['increase', 'decrease']),
  reason: z.string().min(1, 'Reason is required'),
  remarks: z.string().max(500).optional(),
});

export const transferStockSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  fromWarehouseId: z.string().uuid('Invalid source warehouse ID'),
  toWarehouseId: z.string().uuid('Invalid destination warehouse ID'),
  quantity: z.number().positive('Quantity must be positive'),
  remarks: z.string().max(500).optional(),
});

export const stockQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  warehouseId: z.string().uuid().optional(),
  status: z.enum(['all', 'in_stock', 'low_stock', 'out_of_stock', 'overstocked']).default('all'),
});

export const movementsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  warehouseId: z.string().uuid().optional(),
  movementType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// ========== USER SCHEMAS ==========

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().optional(),
  departmentId: z.string().uuid().optional().nullable(),
  roleId: z.string().uuid().optional().nullable(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  departmentId: z.string().uuid().optional().nullable(),
  roleId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const createRoleSchema = z.object({
  roleName: z.string().min(1, 'Role name is required').max(100),
  roleCode: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
  permissionIds: z.array(z.string().uuid()).optional(),
});

export const updateRoleSchema = createRoleSchema.partial();
updateRoleSchema.extend({
  isActive: z.boolean().optional(),
});

// ========== FILE SCHEMAS ==========

export const fileUploadSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  mimeType: z.string().min(1, 'MIME type is required'),
  fileSize: z.number().positive('File size must be positive').max(100 * 1024 * 1024, 'File size exceeds 100MB'),
  moduleName: z.string().min(1, 'Module name is required'),
});

export const confirmUploadSchema = z.object({
  storageKey: z.string().min(1, 'Storage key is required'),
  fileName: z.string().min(1, 'File name is required'),
  mimeType: z.string().min(1, 'MIME type is required'),
  fileSize: z.number().positive(),
  moduleName: z.string().min(1, 'Module name is required'),
  recordId: z.string().min(1, 'Record ID is required'),
});

// ========== PRICE ANALYSIS SCHEMAS ==========

export const analysisItemSchema = z.object({
  productName: z.string().min(1, 'Product name is required'),
  sku: z.string().optional(),
  orderQuantity: z.number().positive('Quantity must be positive'),
  buyingPrice: z.number().min(0, 'Buying price must be non-negative'),
  gstPercent: z.number().min(0).max(100).optional(),
  freightCost: z.number().min(0).optional(),
  otherCost: z.number().min(0).optional(),
  cbmPerBox: z.number().positive().optional(),
  unitsPerCase: z.number().int().positive().optional(),
  targetCurrency: z.enum(['GBP', 'USD', 'CAD', 'AUD', 'EUR', 'INR']).optional(),
  description: z.string().optional(),
});

export const createAnalysisSchema = z.object({
  purchaseQuoteId: z.string().uuid().optional().nullable(),
  enquiryOrderId: z.string().uuid().optional().nullable(),
  customerId: z.string().uuid().optional().nullable(),
  isGstApplicable: z.boolean().default(true),
  isHaulageApplicable: z.boolean().default(false),
  isCurrencyConversionRequired: z.boolean().default(false),
  isMarginApplicable: z.boolean().default(false),
  isRateRounded: z.boolean().default(true),
  gbpRate: z.number().positive().optional(),
  usdRate: z.number().positive().optional(),
  cadRate: z.number().positive().optional(),
  audRate: z.number().positive().optional(),
  euroRate: z.number().positive().optional(),
  items: z.array(analysisItemSchema).optional(),
});

// ========== TYPE EXPORTS ==========

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CreateEnquiryInput = z.infer<typeof createEnquirySchema>;
export type UpdateEnquiryInput = z.infer<typeof updateEnquirySchema>;
export type CreatePurchaseQuoteInput = z.infer<typeof createPurchaseQuoteSchema>;
export type WarehouseInput = z.infer<typeof warehouseSchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
export type TransferStockInput = z.infer<typeof transferStockSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;
export type CreateAnalysisInput = z.infer<typeof createAnalysisSchema>;
