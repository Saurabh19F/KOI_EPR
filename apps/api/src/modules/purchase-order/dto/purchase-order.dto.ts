import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsDate,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============ Purchase Order DTOs ============

export class PurchaseOrderItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty()
  @IsString()
  productName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  uniqueCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hsnCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  uomName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  orderQty?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  balanceQty?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discountPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  gstRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  enquiryNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bestPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  quotedPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  approvedBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jat?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  currentStock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  noNeed?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  indent?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  leadTimeDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  soNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  merge?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  formula?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lineNumber?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  indentQty?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  orderQtyPerCase?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  approvedByJatinSir?: string;
}

export class CreatePurchaseOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  quoteId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  salesEnquiryId?: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  orderDate: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expectedDeliveryDate?: Date;

  @ApiProperty()
  @IsString()
  vendorId: string;

  @ApiProperty()
  @IsString()
  vendorName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorGstin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorMobileNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purchasePersonId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purchasePerson?: string;

  @ApiProperty()
  billingAddress: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  billingStateCode?: string;

  @ApiProperty()
  shippingAddress: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shippingStateCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentTermsId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currencyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  exchangeRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discountPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  freightAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  packingAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  insuranceAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  otherCharges?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isImport?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  countryOfOrigin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  portOfEntry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  poUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  freightTerm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  salesPersonId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  salesPersonName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  enquiryNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  soNo?: string;

  @ApiProperty({ type: [PurchaseOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items: PurchaseOrderItemDto[];
}

export class UpdatePurchaseOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expectedDeliveryDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorGstin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  billingAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discountPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  freightAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  packingAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  insuranceAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  otherCharges?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [PurchaseOrderItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items?: PurchaseOrderItemDto[];
}

// ============ GRN DTOs ============

export class GrnItemDto {
  @ApiProperty()
  @IsString()
  orderItemId: string;

  @ApiProperty()
  @IsString()
  productName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hsnCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  uomName?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  orderedQuantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  receivedQuantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  acceptedQuantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  rejectedQuantity?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiryDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateGoodsReceiptNoteDto {
  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  grnDate: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  invoiceDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lrNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  lrDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transporterName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eWayBillNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [GrnItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GrnItemDto)
  items: GrnItemDto[];
}

// ============ Purchase Invoice DTOs ============

export class PurchaseInvoiceItemDto {
  @ApiProperty()
  @IsString()
  orderItemId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  grnItemId?: string;

  @ApiProperty()
  @IsString()
  productName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hsnCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  uomName?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discountPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiryDate?: Date;
}

export class CreatePurchaseInvoiceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  grnId?: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  invoiceDate: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  dueDate: Date;

  @ApiProperty()
  @IsString()
  vendorId: string;

  @ApiProperty()
  @IsString()
  vendorName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorGstin?: string;

  @ApiProperty()
  vendorAddress: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorStateCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  billingStateCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  reverseCharge?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  freightAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  packingAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  insuranceAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  otherCharges?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  tdsAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eWayBillNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lrNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @ApiProperty({ type: [PurchaseInvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseInvoiceItemDto)
  items: PurchaseInvoiceItemDto[];
}

// ============ Debit Note DTOs ============

export class CreateDebitNoteDto {
  @ApiProperty()
  @IsString()
  invoiceId: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  debitNoteDate: Date;

  @ApiProperty()
  @IsString()
  vendorId: string;

  @ApiProperty()
  @IsString()
  vendorName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorGstin?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiProperty()
  @IsString()
  reason: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

// ============ Vendor Master DTOs ============

export class CreateVendorMasterDto {
  @ApiProperty()
  @IsString()
  vendorName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mobileNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stateCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gstin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fssaiNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  panNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productsSupplied?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purchasePerson?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankAccountNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankIfsc?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankBranch?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  rating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateVendorMasterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mobileNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stateCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gstin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fssaiNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  panNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productsSupplied?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purchasePerson?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankAccountNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankIfsc?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankBranch?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  rating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

// ============ PO Approval DTOs ============

export class SubmitForApprovalDto {
  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class ApproveRejectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

// ============ Pagination ============

export class PaginationDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  toDate?: string;
}
