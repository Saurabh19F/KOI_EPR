import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, IsNull, In, DataSource } from 'typeorm';
import { PurchaseQuote, PurchaseStatus } from './entities/purchase-quote.entity';
import { PurchaseQuoteItem } from './entities/purchase-quote-item.entity';
import { VendorQuote, VendorQuoteStatus } from './entities/vendor-quote.entity';
import { PurchaseLandingCost } from './entities/purchase-landing-cost.entity';
import { PurchaseLabel } from './entities/purchase-label.entity';
import { CreatePurchaseQuoteDto, UpdatePurchaseQuoteDto, CreatePurchaseQuoteItemDto } from '../../common/dto/create-purchase.dto';
import { CreateVendorQuoteEntryDto } from '../../common/dto/create-purchase.dto';
import { CreatePurchaseLabelDto, UpdatePurchaseLabelDto } from '../../common/dto/create-purchase.dto';
import { NumberSeriesService } from '../../common/utils/number-series';
import { PaginatedResult } from '../../common/types';
import {
  VendorComparisonSummaryDto,
  RankedVendorQuoteDto,
  ItemComparisonDto,
  AutoSelectDto,
  AutoSelectResultDto,
} from './dto/vendor-comparison.dto';
import { RateService } from '../rate/rate.service';

// Valid status transitions
const PURCHASE_STATUS_TRANSITIONS: Record<PurchaseStatus, PurchaseStatus[]> = {
  [PurchaseStatus.DRAFT]: [PurchaseStatus.SUBMITTED],
  [PurchaseStatus.SUBMITTED]: [PurchaseStatus.UNDER_REVIEW, PurchaseStatus.VENDOR_QUOTE_PENDING],
  [PurchaseStatus.UNDER_REVIEW]: [PurchaseStatus.VENDOR_QUOTE_PENDING, PurchaseStatus.RATE_FINALIZED],
  [PurchaseStatus.VENDOR_QUOTE_PENDING]: [PurchaseStatus.RATE_FINALIZED],
  [PurchaseStatus.RATE_FINALIZED]: [PurchaseStatus.SENT_TO_COSTING, PurchaseStatus.APPROVED],
  [PurchaseStatus.SENT_TO_COSTING]: [PurchaseStatus.APPROVED, PurchaseStatus.REJECTED],
  [PurchaseStatus.APPROVED]: [],
  [PurchaseStatus.REJECTED]: [PurchaseStatus.REVISED],
  [PurchaseStatus.REVISED]: [PurchaseStatus.SUBMITTED, PurchaseStatus.UNDER_REVIEW],
};

@Injectable()
export class PurchaseService {
  constructor(
    @InjectRepository(PurchaseQuote)
    private quoteRepo: Repository<PurchaseQuote>,
    @InjectRepository(PurchaseQuoteItem)
    private itemRepo: Repository<PurchaseQuoteItem>,
    @InjectRepository(VendorQuote)
    private vendorQuoteRepo: Repository<VendorQuote>,
    @InjectRepository(PurchaseLandingCost)
    private landingCostRepo: Repository<PurchaseLandingCost>,
    @InjectRepository(PurchaseLabel)
    private labelRepo: Repository<PurchaseLabel>,
    private numberSeriesService: NumberSeriesService,
    @Inject(forwardRef(() => RateService))
    private rateService: RateService,
    private dataSource: DataSource,
  ) {}

  private isRestrictedPurchaseUser(user: any): boolean {
    if (!user) return false;
    if (user.isSuperAdmin) return false;
    const roles = (user.roles || []).map((r: string) => r.toUpperCase());
    if (roles.includes('ADMIN') || roles.includes('MANAGEMENT') || roles.includes('SALES_MANAGER') || roles.includes('SALES_USER')) {
      return false;
    }
    return roles.includes('PURCHASE_USER') || roles.includes('PURCHASE_MANAGER');
  }

  private async validatePurchaseUserAssignment(productIds: string[], currentUser: any, enquiryOrderId?: string): Promise<void> {
    if (!this.isRestrictedPurchaseUser(currentUser)) {
      return;
    }
    const currentUserId = currentUser?.sub || currentUser?.userId;
    if (productIds.length > 0) {
      // 1. Check if products are explicitly assigned to this user in the sales enquiry items (if enquiryOrderId is provided)
      let allowedProductIds: string[] = [];
      if (enquiryOrderId) {
        const enquiryItems = await this.dataSource.query(
          `SELECT product_id FROM sales_enquiry_order_items WHERE enquiry_order_id::text = $1 AND purchase_person_id::text = $2 AND deleted_at IS NULL`,
          [enquiryOrderId, currentUserId]
        );
        allowedProductIds = enquiryItems.map((item: any) => item.product_id).filter(Boolean);
      }

      // 2. For products not explicitly assigned to the user in the sales enquiry, check the product master default
      const remainingProductIds = productIds.filter(id => !allowedProductIds.includes(id));
      if (remainingProductIds.length > 0) {
        const products = await this.dataSource.query(
          `SELECT product_id, purchase_person_id FROM products WHERE product_id = ANY($1)`,
          [remainingProductIds]
        );
        for (const p of products) {
          if (p.purchase_person_id && p.purchase_person_id !== currentUserId) {
            throw new ForbiddenException('Access Denied: You can only create quotations for products assigned to you.');
          }
        }
      }
    }
  }

  private async resolvePartyDetails(quote: PurchaseQuote): Promise<void> {
    if ((!quote.partyName || !quote.partyCode) && quote.enquiryOrderId) {
      try {
        const enquiries = await this.dataSource.query(
          `SELECT buyer_name, buyer_code, customer_id FROM sales_enquiry_orders WHERE enquiry_order_id::text = $1`,
          [quote.enquiryOrderId]
        );
        if (enquiries && enquiries[0]) {
          let customerName = '';
          let customerCode = '';
          if (enquiries[0].customer_id) {
            const customers = await this.dataSource.query(
              `SELECT customer_name, buyer_code FROM customers WHERE customer_id::text = $1`,
              [enquiries[0].customer_id]
            );
            if (customers && customers[0]) {
              customerName = customers[0].customer_name;
              customerCode = customers[0].buyer_code;
            }
          }
          quote.partyName = enquiries[0].buyer_name || customerName || '';
          quote.partyCode = enquiries[0].buyer_code || customerCode || '';
          if (!quote.customerId) {
            quote.customerId = enquiries[0].customer_id || null;
          }
        }
      } catch (e) {
        console.error('Failed to resolve party details for quote:', e);
      }
    }
  }

  async createQuote(dto: CreatePurchaseQuoteDto, userId?: string, currentUser?: any): Promise<PurchaseQuote> {
    const productIds = dto.items?.map(item => item.productId).filter(Boolean) || [];
    await this.validatePurchaseUserAssignment(productIds, currentUser, dto.enquiryOrderId);

    // Generate quote number
    const quoteNo = await this.numberSeriesService.generateNumber('PURCHASE_QUOTE', 'PUR');

    const purchasePersonId = this.isRestrictedPurchaseUser(currentUser)
      ? (currentUser.sub || currentUser.userId)
      : dto.purchasePersonId;

    const quote = this.quoteRepo.create({
      ...dto,
      quoteNo,
      purchasePersonId,
      quoteDate: new Date(),
      createdBy: userId,
    });

    await this.resolvePartyDetails(quote);

    const savedQuote = await this.quoteRepo.save(quote);

    // Create items if provided
    if (dto.items && dto.items.length > 0) {
      for (let i = 0; i < dto.items.length; i++) {
        const itemDto = dto.items[i];
        await this.createQuoteItem(savedQuote.quoteId, itemDto, i + 1, userId);
      }
    }

    return this.findQuoteById(savedQuote.quoteId);
  }

  async createQuoteFromEnquiry(enquiryId: string, dto: Partial<CreatePurchaseQuoteDto>, userId?: string, currentUser?: any): Promise<PurchaseQuote> {
    const productIds = dto.items?.map(item => item.productId).filter(Boolean) || [];
    await this.validatePurchaseUserAssignment(productIds, currentUser, enquiryId);

    const quoteNo = await this.numberSeriesService.generateNumber('PURCHASE_QUOTE', 'PUR');

    const purchasePersonId = this.isRestrictedPurchaseUser(currentUser)
      ? (currentUser.sub || currentUser.userId)
      : dto.purchasePersonId;

    const quote = this.quoteRepo.create({
      ...dto,
      quoteNo,
      purchasePersonId,
      enquiryOrderId: enquiryId,
      quoteDate: new Date(),
      useSalesEnquiryData: true,
      createdBy: userId,
    });

    await this.resolvePartyDetails(quote);

    const savedQuote = await this.quoteRepo.save(quote);
    return this.findQuoteById(savedQuote.quoteId);
  }

  async findAllQuotes(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: PurchaseStatus;
    customerId?: string;
    enquiryOrderId?: string;
    currentUser?: any;
  } = {}): Promise<PaginatedResult<PurchaseQuote>> {
    const { page = 1, limit = 20, search, status, customerId, enquiryOrderId, currentUser } = params;

    const where: any = { deletedAt: IsNull() };
    if (status) {
      if (typeof status === 'string' && status.includes(',')) {
        const statuses = status.split(',').map(s => s.trim());
        where.status = In(statuses);
      } else {
        where.status = status;
      }
    }
    if (customerId) where.customerId = customerId;
    if (enquiryOrderId) where.enquiryOrderId = enquiryOrderId;
    if (search) {
      where.quoteNo = ILike(`%${search}%`);
    }

    if (this.isRestrictedPurchaseUser(currentUser)) {
      const currentUserId = currentUser.sub || currentUser.userId;
      where.purchasePersonId = currentUserId;
    }

    const result = await this.paginate(this.quoteRepo, page, limit, where, { createdAt: 'DESC' }, ['items']);

    // Fetch enquiry details for all distinct enquiryOrderIds in the list if partyName is missing
    const enquiryOrderIds = result.data.map(q => q.enquiryOrderId).filter(Boolean);
    if (enquiryOrderIds.length > 0) {
      try {
        const enquiries = await this.dataSource.query(
          `SELECT enquiry_order_id, buyer_name, buyer_code, customer_id FROM sales_enquiry_orders WHERE enquiry_order_id = ANY($1)`,
          [enquiryOrderIds]
        );
        const enquiriesMap = new Map<string, any>(enquiries.map((e: any) => [e.enquiry_order_id, e]));

        // Also get customers if buyer_name is null but customer_id is present
        const customerIds = enquiries.map((e: any) => e.customer_id).filter(Boolean);
        let customersMap = new Map<string, any>();
        if (customerIds.length > 0) {
          const customers = await this.dataSource.query(
            `SELECT customer_id, customer_name, buyer_code FROM customers WHERE customer_id = ANY($1)`,
            [customerIds]
          );
          customersMap = new Map(customers.map((c: any) => [c.customer_id, c]));
        }

        for (const quote of result.data) {
          if ((!quote.partyName || !quote.partyCode) && quote.enquiryOrderId) {
            const enquiry: any = enquiriesMap.get(quote.enquiryOrderId);
            if (enquiry) {
              const customer = enquiry.customer_id ? customersMap.get(enquiry.customer_id) : null;
              quote.partyName = enquiry.buyer_name || customer?.customer_name || '';
              quote.partyCode = enquiry.buyer_code || customer?.buyer_code || '';
              if (!quote.customerId) {
                quote.customerId = enquiry.customer_id || null;
              }
            }
          }
        }
      } catch (e) {
        console.error('Failed to resolve party details in findAllQuotes:', e);
      }
    }

    return result;
  }

  async findQuoteById(id: string): Promise<PurchaseQuote> {
    const quote = await this.quoteRepo.findOne({
      where: { quoteId: id, deletedAt: IsNull() },
      relations: [],
    });
    if (!quote) throw new NotFoundException('Purchase Quote not found');

    await this.resolvePartyDetails(quote);

    // Get items with vendor quotes
    const items = await this.itemRepo.find({
      where: { quoteId: id, deletedAt: IsNull() },
      order: { lineNo: 'ASC' },
    });

    // Enrich items missing categoryName/unitSize from product master
    const itemsNeedingEnrichment = items.filter(i => i.productId && (!i.categoryName || !i.unitSize));
    if (itemsNeedingEnrichment.length > 0) {
      const productIds = [...new Set(itemsNeedingEnrichment.map(i => i.productId))];
      const products = await this.dataSource.query(
        `SELECT p.product_id, p.unit_size, p.units_per_case, p.cbm_per_box,
                c.category_name, b.brand_name
         FROM products p
         LEFT JOIN categories c ON c.category_id = p.category_id
         LEFT JOIN brands b ON b.brand_id = p.brand_id
         WHERE p.product_id = ANY($1)`,
        [productIds],
      );
      const productMap = new Map(products.map((p: any) => [p.product_id, p]));
      for (const item of itemsNeedingEnrichment) {
        const prod = productMap.get(item.productId);
        if (prod) {
          if (!item.categoryName && prod.category_name) item.categoryName = prod.category_name;
          if (!item.unitSize && prod.unit_size) item.unitSize = prod.unit_size;
          if (!item.brandName && prod.brand_name) item.brandName = prod.brand_name;
          if (!item.unitPerCarton && prod.units_per_case) item.unitPerCarton = prod.units_per_case;
          if (!item.cbmPerBox && prod.cbm_per_box) item.cbmPerBox = prod.cbm_per_box;
        }
      }
    }

    // Get vendor quotes for each item
    for (const item of items) {
      const vendorQuotes = await this.vendorQuoteRepo.find({
        where: { quoteItemId: item.itemId, deletedAt: IsNull() },
        order: { createdAt: 'ASC' },
      });
      (item as any).vendorQuotes = vendorQuotes;
    }

    (quote as any).items = items;

    // Calculate grand total
    let grandTotal = 0;
    for (const item of items) {
      if (item.totalValue) {
        grandTotal += Number(item.totalValue);
      }
    }
    quote.grandTotal = grandTotal;

    return quote;
  }

  async findQuoteByNumber(quoteNo: string): Promise<PurchaseQuote> {
    const quote = await this.quoteRepo.findOne({
      where: { quoteNo, deletedAt: IsNull() },
      relations: [],
    });
    if (!quote) throw new NotFoundException('Purchase Quote not found');
    return this.findQuoteById(quote.quoteId);
  }

  async updateQuote(id: string, dto: UpdatePurchaseQuoteDto, userId?: string): Promise<PurchaseQuote> {
    const quote = await this.findQuoteById(id);

    // Check status transition
    if (dto.status && dto.status !== quote.status) {
      this.validateStatusTransition(quote.status, dto.status as PurchaseStatus);
    }

    const { items, ...rest } = dto;
    Object.assign(quote, rest);
    if (userId) quote.updatedBy = userId;

    await this.quoteRepo.save(quote);

    if (items) {
      // Delete old items
      await this.itemRepo.delete({ quoteId: id });
      
      // Save new ones
      for (let i = 0; i < items.length; i++) {
        await this.createQuoteItem(id, items[i], i + 1, userId);
      }
    }

    return this.findQuoteById(id);
  }

  async updateQuoteStatus(id: string, status: PurchaseStatus, remarks?: string, userId?: string): Promise<PurchaseQuote> {
    const quote = await this.findQuoteById(id);
    this.validateStatusTransition(quote.status, status);

    quote.status = status;
    if (remarks) quote.remarks = remarks;
    if (userId) quote.updatedBy = userId;

    await this.quoteRepo.save(quote);

    if (status === PurchaseStatus.SUBMITTED) {
      await this.handleQuoteSubmission(id);
    }

    // Auto-create Price Analysis if transitioned to SENT_TO_COSTING
    if (status === PurchaseStatus.SENT_TO_COSTING) {
      try {
        await this.rateService.createAnalysisFromPurchaseQuote(id, {}, userId);
      } catch (err) {
        console.error('[PurchaseService] Failed to auto-create PriceAnalysis from PurchaseQuote:', err?.message);
      }
    }

    return this.findQuoteById(id);
  }

  async deleteQuote(id: string): Promise<void> {
    const quote = await this.findQuoteById(id);
    quote.deletedAt = new Date();
    await this.quoteRepo.save(quote);

    // Soft delete items
    await this.itemRepo.update({ quoteId: id }, { deletedAt: new Date() });
  }

  // ========== CONVERT QUOTE TO PO ==========

  async convertQuoteToPO(
    quoteId: string,
    body: {
      vendorId: string;
      vendorName: string;
      vendorCode?: string;
      vendorGstin?: string;
      billingAddress?: string;
      shippingAddress?: string;
      expectedDeliveryDate?: Date;
      notes?: string;
    },
    user: any,
  ): Promise<any> {
    const quote = await this.quoteRepo.findOne({
      where: { quoteId },
    });
    if (!quote) throw new NotFoundException('Purchase quote not found');

    if (quote.status !== PurchaseStatus.APPROVED) {
      throw new BadRequestException('Only approved purchase quotes can be converted to PO');
    }

    const items = await this.itemRepo.find({ where: { quoteId } });
    if (!items.length) {
      throw new BadRequestException('Quote has no items to convert');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Generate PO number
      const orderNumber = await this.numberSeriesService.generateNumber('PO', user?.companyId);

      // Create PO
      const po = queryRunner.manager.create('purchase_orders', {
        orderNumber,
        quoteId: quote.quoteId,
        salesEnquiryId: quote.enquiryOrderId,
        enquiryNo: quote.orderNo || quote.enquiryOrderNo || '',
        orderDate: new Date(),
        expectedDeliveryDate: body.expectedDeliveryDate || quote.deliveryDate,
        vendorId: body.vendorId,
        vendorName: body.vendorName,
        vendorCode: body.vendorCode || '',
        vendorGstin: body.vendorGstin || '',
        billingAddress: body.billingAddress || '',
        shippingAddress: body.shippingAddress || '',
        paymentTermsId: quote.paymentTermsId,
        currencyId: quote.currencyId,
        notes: body.notes || quote.notes || '',
        status: 'draft',
        companyId: user?.companyId,
        createdBy: user?.userId,
      });

      const savedPO = await queryRunner.manager.save('purchase_orders', po);
      const poId = (savedPO as any).orderId;

      // Create PO items from quote items
      let subtotal = 0;
      for (const item of items) {
        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.buyingPrice || item.unitPrice || 0);
        const lineTotal = quantity * unitPrice;
        subtotal += lineTotal;

        const poItem = queryRunner.manager.create('purchase_order_items', {
          orderId: poId,
          productId: item.productId,
          productName: item.productName,
          productCode: item.productCode || item.sku,
          sku: item.sku,
          hsnCode: item.hsnCode || '',
          uomName: item.uom || '',
          quantity,
          unitPrice,
          quotedPrice: Number(item.buyingPrice || 0),
          gstRate: Number(item.gstPercent || 0),
          description: item.productDescription || '',
        });

        await queryRunner.manager.save('purchase_order_items', poItem);
      }

      // Update PO total
      await queryRunner.manager.update('purchase_orders', poId, {
        subtotalAmount: subtotal,
        totalAmount: subtotal,
      });

      await queryRunner.commitTransaction();

      return {
        message: 'Purchase Quote converted to Purchase Order successfully',
        purchaseOrderId: poId,
        orderNumber,
        quoteId: quote.quoteId,
        quoteNo: quote.quoteNo,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ========== PURCHASE QUOTE ITEMS ==========

  async createQuoteItem(quoteId: string, dto: CreatePurchaseQuoteItemDto, lineNo: number = 1, userId?: string): Promise<PurchaseQuoteItem> {
    const quantity = Number(dto.quantity || 0);
    const buyingPrice = Number(dto.buyingPrice || 0);
    const gstPercent = Number(dto.gstPercent || 0);
    const freight = Number(dto.freight || 0);
    const otherCost = Number(dto.otherCost || 0);
    const cbmPerBox = Number(dto.cbmPerBox || 0);

    const gstAmount = buyingPrice * (gstPercent / 100);
    const landingCost = buyingPrice + gstAmount + freight + otherCost;
    const totalValue = landingCost * quantity;
    const totalCbm = cbmPerBox * quantity;

    const item = this.itemRepo.create({
      ...dto,
      quoteId,
      lineNo,
      totalCbm,
      landingCost,
      totalValue,
      createdBy: userId,
    });

    const saved = await this.itemRepo.save(item);
    if (saved.enquiryItemId) {
      await this.syncQuoteItemToSalesEnquiry(saved);
      await this.ensureEnquiryInProgress(saved.enquiryItemId);
    }
    return saved;
  }

  async updateQuoteItem(id: string, dto: Partial<PurchaseQuoteItem>, userId?: string, currentUser?: any): Promise<PurchaseQuoteItem> {
    const item = await this.itemRepo.findOne({
      where: { itemId: id, deletedAt: IsNull() },
    });
    if (!item) throw new NotFoundException('Quote Item not found');

    if (this.isRestrictedPurchaseUser(currentUser)) {
      const currentUserId = currentUser.sub || currentUser.userId;
      const quote = await this.quoteRepo.findOne({ where: { quoteId: item.quoteId } });
      if (quote && quote.purchasePersonId && quote.purchasePersonId !== currentUserId) {
        throw new ForbiddenException('Access Denied: You cannot modify this item.');
      }
      if ((dto as any).productId) {
        const quote = await this.quoteRepo.findOne({ where: { quoteId: item.quoteId } });
        await this.validatePurchaseUserAssignment([(dto as any).productId], currentUser, quote?.enquiryOrderId);
      }
    }

    Object.assign(item, dto);
    if (userId) item.updatedBy = userId;

    // Recalculate totals unconditionally
    const quantity = Number(item.quantity || 0);
    const buyingPrice = Number(item.buyingPrice || 0);
    const gstPercent = Number(item.gstPercent || 0);
    const freight = Number(item.freight || 0);
    const otherCost = Number(item.otherCost || 0);
    const cbmPerBox = Number(item.cbmPerBox || 0);

    const gstAmount = buyingPrice * (gstPercent / 100);
    const landingCost = buyingPrice + gstAmount + freight + otherCost;

    item.landingCost = landingCost;
    item.totalValue = landingCost * quantity;
    item.totalCbm = cbmPerBox * quantity;

    const saved = await this.itemRepo.save(item);
    if (saved.enquiryItemId) {
      await this.syncQuoteItemToSalesEnquiry(saved);
      await this.ensureEnquiryInProgress(saved.enquiryItemId);
    }
    return saved;
  }

  async deleteQuoteItem(id: string, currentUser?: any): Promise<void> {
    const item = await this.itemRepo.findOne({ where: { itemId: id } });
    if (!item) throw new NotFoundException('Quote Item not found');

    if (this.isRestrictedPurchaseUser(currentUser)) {
      const currentUserId = currentUser.sub || currentUser.userId;
      const quote = await this.quoteRepo.findOne({ where: { quoteId: item.quoteId } });
      if (quote && quote.purchasePersonId && quote.purchasePersonId !== currentUserId) {
        throw new ForbiddenException('Access Denied: You cannot delete this item.');
      }
    }

    item.deletedAt = new Date();
    await this.itemRepo.save(item);

    // Soft delete vendor quotes
    await this.vendorQuoteRepo.update({ quoteItemId: id }, { deletedAt: new Date() });
  }

  async addItemsToQuote(quoteId: string, items: CreatePurchaseQuoteItemDto[], userId?: string, currentUser?: any): Promise<PurchaseQuote> {
    const productIds = items.map(item => item.productId).filter(Boolean);
    const quote = await this.quoteRepo.findOne({ where: { quoteId } });
    await this.validatePurchaseUserAssignment(productIds, currentUser, quote?.enquiryOrderId);

    const existingItems = await this.itemRepo.count({ where: { quoteId, deletedAt: IsNull() } });

    for (let i = 0; i < items.length; i++) {
      await this.createQuoteItem(quoteId, items[i], existingItems + i + 1, userId);
    }

    return this.findQuoteById(quoteId);
  }

  // ========== VENDOR QUOTES ==========

  async createVendorQuote(dto: CreateVendorQuoteEntryDto, userId?: string): Promise<VendorQuote> {
    // Validate that quoteId (PurchaseQuote UUID) is provided
    if (!dto.quoteId) {
      throw new BadRequestException('Purchase Quote ID (quoteId) is required');
    }

    // Get quote item to calculate totals and update with vendor info
    const quoteItem = dto.quoteItemId
      ? await this.itemRepo.findOne({ where: { itemId: dto.quoteItemId } })
      : null;

    // Calculate totals
    const quantity = dto.quantity || quoteItem?.quantity || 0;
    const landingCost = dto.landingCost || dto.quotedRate || 0;
    const totalAmount = landingCost * quantity;

    const vendorQuote = this.vendorQuoteRepo.create({
      quoteId: dto.quoteId, // FK to PurchaseQuote (UUID)
      quoteItemId: dto.quoteItemId || null, // FK to PurchaseQuoteItem (UUID)
      vendorId: dto.vendorId,
      vendorName: dto.vendorName,
      vendorQuoteNo: dto.vendorQuoteNo,
      quoteDate: dto.quoteDate || new Date(),
      quotedRate: dto.quotedRate,
      quotedCurrency: dto.quotedCurrency,
      gstPercent: dto.gstPercent,
      freight: dto.freight,
      landingCost: dto.landingCost,
      quantity,
      totalAmount,
      moq: dto.moq,
      leadTimeDays: dto.leadTimeDays,
      deliveryDate: dto.deliveryDate,
      rateValidity: dto.rateValidity,
      deliveryTerms: dto.deliveryTerms,
      paymentTermsId: dto.paymentTermsId,
      currencyRate: dto.currencyRate,
      discountPercent: dto.discountPercent,
      otherCharges: dto.otherCharges,
      notes: dto.notes,
      termsConditions: dto.termsConditions,
      attachmentUrl: dto.attachmentUrl,
      status: VendorQuoteStatus.RECEIVED,
      createdBy: userId,
    });

    const savedQuote = await this.vendorQuoteRepo.save(vendorQuote);

    // Update the purchase quote item with vendor info if this is the first/best quote
    if (quoteItem) {
      // Check if this quote is better than existing
      if (!quoteItem.vendorId || dto.landingCost < Number(quoteItem.bestLandingCost || Infinity)) {
        await this.itemRepo.update(quoteItem.itemId, {
          vendorId: dto.vendorId,
          vendorName: dto.vendorName,
          vendorQuoteNo: dto.vendorQuoteNo,
          vendorRate: dto.quotedRate,
          vendorCurrency: dto.quotedCurrency,
          vendorTotal: totalAmount,
          leadTimeDays: dto.leadTimeDays,
          rateValidity: dto.rateValidity,
          vendorAttachmentUrl: dto.attachmentUrl,
          bestLandingLocation: 'BEST',
          bestLandingCost: landingCost,
        });
      }
    }

    return this.findVendorQuoteById(savedQuote.vendorQuoteId);
  }

  async findVendorQuotesByItem(quoteItemId: string): Promise<VendorQuote[]> {
    return this.vendorQuoteRepo.find({
      where: { quoteItemId, deletedAt: IsNull() },
      order: { quotedRate: 'ASC' },
    });
  }

  async findVendorQuoteById(id: string): Promise<VendorQuote> {
    const vendorQuote = await this.vendorQuoteRepo.findOne({
      where: { vendorQuoteId: id, deletedAt: IsNull() },
    });
    if (!vendorQuote) throw new NotFoundException('Vendor Quote not found');
    return vendorQuote;
  }

  async selectVendorQuote(vendorQuoteId: string, userId?: string): Promise<VendorQuote> {
    const vendorQuote = await this.findVendorQuoteById(vendorQuoteId);

    // Get all quotes for this item
    const allQuotes = await this.vendorQuoteRepo.find({
      where: { quoteItemId: vendorQuote.quoteItemId, deletedAt: IsNull() },
    });

    // Reset all quotes
    for (const quote of allQuotes) {
      quote.isSelected = false;
      await this.vendorQuoteRepo.save(quote);
    }

    // Mark selected
    vendorQuote.isSelected = true;
    vendorQuote.approvedBy = userId;
    vendorQuote.approvedAt = new Date();
    await this.vendorQuoteRepo.save(vendorQuote);

    // Update purchase quote item with selected vendor
    await this.itemRepo.update(vendorQuote.quoteItemId, {
      vendorId: vendorQuote.vendorId,
      vendorName: vendorQuote.vendorName,
      vendorQuoteNo: vendorQuote.vendorQuoteNo,
      vendorRate: vendorQuote.quotedRate,
      vendorCurrency: vendorQuote.quotedCurrency,
      vendorTotal: vendorQuote.totalAmount,
      leadTimeDays: vendorQuote.leadTimeDays,
      rateValidity: vendorQuote.rateValidity,
      bestLandingCost: vendorQuote.landingCost,
    });

    return vendorQuote;
  }

  async compareVendorQuotes(quoteId: string): Promise<any> {
    const quote = await this.findQuoteById(quoteId);
    const comparison: any = {
      quote,
      itemComparisons: [],
    };

    for (const item of (quote as any).items || []) {
      const vendorQuotes = await this.vendorQuoteRepo.find({
        where: { quoteItemId: item.itemId, deletedAt: IsNull() },
        order: { quotedRate: 'ASC' },
      });

      // Calculate ranks - ONLY calculate, don't persist to DB (read-only comparison)
      let bestRate = vendorQuotes[0]?.landingCost || 0;
      const rankedQuotes = vendorQuotes.map((vq, index) => ({
        ...vq,
        rateRank: index + 1,
        vsBestRatePercent: bestRate > 0 ? ((vq.landingCost - bestRate) / bestRate) * 100 : 0,
        isBestQuote: index === 0,
      }));

      (comparison as any).itemComparisons.push({
        item,
        vendorQuotes: rankedQuotes,
      });
    }

    return comparison;
  }

  // ========== ENHANCED VENDOR COMPARISON ==========

  /**
   * Get comprehensive vendor comparison with scoring and recommendations
   */
  async getEnhancedComparison(quoteId: string): Promise<VendorComparisonSummaryDto> {
    const quote = await this.findQuoteById(quoteId);
    const items = (quote as any).items || [];

    const itemComparisons: ItemComparisonDto[] = [];
    let grandTotalBestPrices = 0;
    let grandTotalAvgPrices = 0;
    const allVendorIds = new Set<string>();

    for (const item of items) {
      const vendorQuotes = await this.vendorQuoteRepo.find({
        where: { quoteItemId: item.itemId, deletedAt: IsNull() },
        order: { landingCost: 'ASC' },
      });

      // Track vendors
      vendorQuotes.forEach(vq => {
        if (vq.vendorId) allVendorIds.add(vq.vendorId);
      });

      if (vendorQuotes.length === 0) continue;

      // Calculate item-level statistics
      const prices = vendorQuotes.map(vq => Number(vq.landingCost) || 0);
      const bestPrice = Math.min(...prices);
      const worstPrice = Math.max(...prices);
      const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const priceSpreadPercent = bestPrice > 0 ? ((worstPrice - bestPrice) / bestPrice) * 100 : 0;

      // Rank vendors with enhanced metrics
      const rankedQuotes = this.rankVendorQuotes(vendorQuotes, item.targetPrice);

      // Find recommended vendor (best overall score)
      const recommended = rankedQuotes.find(r => r.recommendation === 'best');
      const bestLeadTime = Math.min(...vendorQuotes.map(vq => Number(vq.leadTimeDays) || 999));

      grandTotalBestPrices += bestPrice * (item.quantity || 1);
      grandTotalAvgPrices += averagePrice * (item.quantity || 1);

      itemComparisons.push({
        item: {
          itemId: item.itemId,
          productId: item.productId,
          sku: item.sku,
          productName: item.productName,
          quantity: item.quantity,
          uom: item.uom,
          targetPrice: item.targetPrice,
          totalCbm: item.totalCbm,
        },
        vendorQuotes: rankedQuotes,
        bestPrice,
        averagePrice,
        worstPrice,
        priceSpreadPercent,
        bestLeadTime,
        recommendedVendorId: recommended?.vendorId,
        recommendedVendorName: recommended?.vendorName,
      });
    }

    // Determine overall best vendor
    const vendorTotals: Record<string, { total: number; count: number; name: string }> = {};
    for (const comparison of itemComparisons) {
      const rec = comparison.vendorQuotes.find(v => v.isBestPrice);
      if (rec) {
        if (!vendorTotals[rec.vendorId]) {
          vendorTotals[rec.vendorId] = { total: 0, count: 0, name: rec.vendorName };
        }
        vendorTotals[rec.vendorId].total += rec.landingCost;
        vendorTotals[rec.vendorId].count++;
      }
    }

    let overallBestVendorId: string | undefined;
    let overallBestVendorName: string | undefined;
    let maxCount = 0;

    for (const [vendorId, data] of Object.entries(vendorTotals)) {
      if (data.count > maxCount) {
        maxCount = data.count;
        overallBestVendorId = vendorId;
        overallBestVendorName = data.name;
      }
    }

    return {
      quoteId: quote.quoteId,
      quoteNo: quote.quoteNo,
      quoteDate: quote.quoteDate,
      status: quote.status,
      totalItems: items.length,
      itemsWithQuotes: itemComparisons.length,
      itemsWithoutQuotes: items.length - itemComparisons.length,
      totalVendorsQuoted: allVendorIds.size,
      itemComparisons,
      grandTotalBestPrices,
      grandTotalAvgPrices,
      potentialSavings: grandTotalAvgPrices - grandTotalBestPrices,
      overallBestVendorId,
      overallBestVendorName,
      comparisonDate: new Date(),
    };
  }

  /**
   * Rank vendor quotes with comprehensive scoring
   */
  private rankVendorQuotes(vendorQuotes: VendorQuote[], targetPrice?: number): RankedVendorQuoteDto[] {
    if (vendorQuotes.length === 0) return [];

    const prices = vendorQuotes.map(vq => Number(vq.landingCost) || 0);
    const bestPrice = Math.min(...prices);

    // Sort by landing cost
    const sorted = [...vendorQuotes].sort((a, b) =>
      (Number(a.landingCost) || 0) - (Number(b.landingCost) || 0)
    );

    // Assign price ranks
    const priceRanks: Record<string, number> = {};
    sorted.forEach((vq, index) => {
      priceRanks[vq.vendorQuoteId] = index + 1;
    });

    // Lead time stats
    const leadTimes = vendorQuotes
      .map(vq => Number(vq.leadTimeDays) || 0)
      .filter(lt => lt > 0);
    const minLeadTime = leadTimes.length > 0 ? Math.min(...leadTimes) : 1;
    const maxLeadTime = leadTimes.length > 0 ? Math.max(...leadTimes) : 1;

    // Calculate scores
    return vendorQuotes.map(vq => {
      const landingCost = Number(vq.landingCost) || 0;
      const leadTimeDays = Number(vq.leadTimeDays) || 0;
      const vsBestRatePercent = bestPrice > 0 ? ((landingCost - bestPrice) / bestPrice) * 100 : 0;
      const vsTargetPricePercent = targetPrice && targetPrice > 0
        ? ((landingCost - targetPrice) / targetPrice) * 100
        : 0;
      const isBestPrice = landingCost === bestPrice;
      const isWithinTarget = targetPrice ? landingCost <= targetPrice : true;

      // Lead time score (0-100, lower lead time = higher score)
      const leadTimeScore = maxLeadTime > minLeadTime && leadTimeDays > 0
        ? 100 - ((leadTimeDays - minLeadTime) / (maxLeadTime - minLeadTime)) * 100
        : (leadTimeDays === minLeadTime ? 100 : 50);

      // Price score (0-100, lower price = higher score)
      const priceScore = bestPrice > 0
        ? 100 - ((landingCost - bestPrice) / bestPrice) * 100
        : 100;

      // Overall score (weighted: 70% price, 30% lead time)
      const overallScore = Math.round((priceScore * 0.7) + (leadTimeScore * 0.3));

      // Recommendation logic
      let recommendation: 'best' | 'alternative' | 'rejected';
      let recommendationReason: string;

      if (isBestPrice && overallScore >= 80) {
        recommendation = 'best';
        recommendationReason = 'Best price and good lead time';
      } else if (overallScore >= 60 && !isBestPrice) {
        recommendation = 'alternative';
        recommendationReason = isWithinTarget
          ? 'Good value, meets target price'
          : 'Acceptable option with longer lead time';
      } else {
        recommendation = 'rejected';
        recommendationReason = vsBestRatePercent > 20
          ? 'Price significantly higher than best'
          : 'Lead time too long';
      }

      return {
        vendorQuoteId: vq.vendorQuoteId,
        vendorId: vq.vendorId,
        vendorName: vq.vendorName,
        vendorQuoteNo: vq.vendorQuoteNo,
        quoteDate: vq.quoteDate,
        quotedRate: Number(vq.quotedRate) || 0,
        quotedCurrency: vq.quotedCurrency,
        gstPercent: Number(vq.gstPercent) || 0,
        freight: Number(vq.freight) || 0,
        landingCost,
        totalAmount: Number(vq.totalAmount) || 0,
        quantity: vq.quantity,
        moq: vq.moq,
        leadTimeDays,
        deliveryDate: vq.deliveryDate,
        rateValidity: vq.rateValidity,
        deliveryTerms: vq.deliveryTerms,
        paymentTermsId: vq.paymentTermsId,
        currencyRate: Number(vq.currencyRate) || 0,
        discountPercent: Number(vq.discountPercent) || 0,
        otherCharges: Number(vq.otherCharges) || 0,
        notes: vq.notes,
        attachmentUrl: vq.attachmentUrl,
        priceRank: priceRanks[vq.vendorQuoteId],
        vsBestRatePercent: Math.round(vsBestRatePercent * 100) / 100,
        vsTargetPricePercent: Math.round(vsTargetPricePercent * 100) / 100,
        isBestPrice,
        isWithinTarget,
        leadTimeScore: Math.round(leadTimeScore),
        overallScore,
        recommendation,
        recommendationReason,
      };
    });
  }

  /**
   * Auto-select best vendors based on strategy
   */
  async autoSelectVendors(dto: AutoSelectDto): Promise<AutoSelectResultDto> {
    const quote = await this.findQuoteById(dto.quoteId);
    const items = (quote as any).items || [];
    const selections: AutoSelectResultDto['selections'] = [];
    let totalSavings = 0;

    for (const item of items) {
      const vendorQuotes = await this.vendorQuoteRepo.find({
        where: { quoteItemId: item.itemId, deletedAt: IsNull() },
        order: { landingCost: 'ASC' },
      });

      if (vendorQuotes.length === 0) continue;

      let selectedQuote: VendorQuote;

      switch (dto.strategy) {
        case 'fastest_delivery':
          // Sort by lead time, then by price
          selectedQuote = [...vendorQuotes].sort((a, b) => {
            const ltDiff = (Number(a.leadTimeDays) || 999) - (Number(b.leadTimeDays) || 999);
            if (ltDiff !== 0) return ltDiff;
            return (Number(a.landingCost) || 0) - (Number(b.landingCost) || 0);
          })[0];
          break;

        case 'best_value':
          // Use pre-calculated overall score
          const ranked = this.rankVendorQuotes(vendorQuotes, item.targetPrice);
          const bestValue = ranked.find(r => r.recommendation === 'best') || ranked[0];
          selectedQuote = vendorQuotes.find(vq => vq.vendorQuoteId === bestValue.vendorQuoteId)!;
          break;

        case 'lowest_price':
        default:
          selectedQuote = vendorQuotes[0]; // Already sorted by landing cost ASC
          break;
      }

      if (selectedQuote) {
        // Calculate potential savings vs second best
        const savings = vendorQuotes.length > 1
          ? (Number(vendorQuotes[1].landingCost) - Number(selectedQuote.landingCost)) * (item.quantity || 1)
          : 0;
        totalSavings += savings;

        // Select this vendor
        await this.selectVendorQuote(selectedQuote.vendorQuoteId);

        selections.push({
          itemId: item.itemId,
          productName: item.productName,
          selectedVendorQuoteId: selectedQuote.vendorQuoteId,
          vendorName: selectedQuote.vendorName,
          landingCost: Number(selectedQuote.landingCost),
          reason: dto.strategy === 'lowest_price'
            ? 'Lowest price selected'
            : dto.strategy === 'fastest_delivery'
              ? 'Fastest delivery selected'
              : 'Best value (price + lead time) selected',
        });
      }
    }

    return {
      success: true,
      selections,
      totalSavings: Math.round(totalSavings * 100) / 100,
    };
  }

  /**
   * Export comparison as structured data for PDF/Excel
   */
  async exportComparison(quoteId: string, format: 'pdf' | 'excel' = 'pdf'): Promise<any> {
    const comparison = await this.getEnhancedComparison(quoteId);

    if (format === 'excel') {
      // Return structured data that can be formatted as Excel
      return {
        format: 'excel',
        headers: [
          'Item', 'Vendor', 'Landing Cost', 'Price Rank',
          'vs Best %', 'Lead Time', 'Score', 'Recommendation'
        ],
        rows: comparison.itemComparisons.flatMap(item =>
          item.vendorQuotes.map(vq => [
            item.item.productName,
            vq.vendorName,
            vq.landingCost,
            vq.priceRank,
            `${vq.vsBestRatePercent}%`,
            `${vq.leadTimeDays} days`,
            vq.overallScore,
            vq.recommendation,
          ])
        ),
        summary: {
          totalItems: comparison.totalItems,
          totalVendors: comparison.totalVendorsQuoted,
          grandTotalBest: comparison.grandTotalBestPrices,
          grandTotalAvg: comparison.grandTotalAvgPrices,
          potentialSavings: comparison.potentialSavings,
          recommendedVendor: comparison.overallBestVendorName,
        },
      };
    }

    // PDF format - return full comparison
    return {
      format: 'pdf',
      ...comparison,
    };
  }

  // ========== LABELS ==========

  async createLabel(dto: CreatePurchaseLabelDto, userId?: string): Promise<PurchaseLabel> {
    const labelCode = await this.numberSeriesService.generateNumber('PURCHASE_LABEL', 'LBL');

    // Calculate delay if actual date is provided
    if (dto.plannedDate && dto.actualDate) {
      const planned = new Date(dto.plannedDate);
      const actual = new Date(dto.actualDate);
      dto.delayDays = Math.ceil((actual.getTime() - planned.getTime()) / (1000 * 60 * 60 * 24));
    } else if (dto.plannedDate) {
      const planned = new Date(dto.plannedDate);
      const today = new Date();
      if (today > planned) {
        dto.delayDays = Math.ceil((today.getTime() - planned.getTime()) / (1000 * 60 * 60 * 24));
      }
    }

    const label = this.labelRepo.create({
      ...dto,
      labelCode,
      labelDate: new Date(),
      createdBy: userId,
    });

    const saved = await this.labelRepo.save(label);
    return this.findLabelById(saved.labelId);
  }

  async findAllLabels(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  } = {}): Promise<PaginatedResult<PurchaseLabel>> {
    const page = params.page ? Number(params.page) : 1;
    const limit = params.limit ? Number(params.limit) : 20;
    const { search, status } = params;

    const where: any = { deletedAt: IsNull() };
    if (status) where.status = status;
    if (search) {
      where.labelCode = ILike(`%${search}%`);
    }

    return this.paginate(this.labelRepo, page, limit, where, { createdAt: 'DESC' });
  }

  async findLabelById(id: string): Promise<PurchaseLabel> {
    const label = await this.labelRepo.findOne({
      where: { labelId: id, deletedAt: IsNull() },
    });
    if (!label) throw new NotFoundException('Label not found');
    return label;
  }

  async updateLabel(id: string, dto: UpdatePurchaseLabelDto, userId?: string): Promise<PurchaseLabel> {
    const label = await this.findLabelById(id);

    // Recalculate delay if dates changed
    const plannedDate = dto.plannedDate || label.plannedDate;
    const actualDate = dto.actualDate || label.actualDate;
    if (plannedDate && actualDate) {
      const planned = new Date(plannedDate);
      const actual = new Date(actualDate);
      dto.delayDays = Math.ceil((actual.getTime() - planned.getTime()) / (1000 * 60 * 60 * 24));
    } else if (plannedDate) {
      const planned = new Date(plannedDate);
      const today = new Date();
      if (today > planned) {
        dto.delayDays = Math.ceil((today.getTime() - planned.getTime()) / (1000 * 60 * 60 * 24));
      }
    }

    Object.assign(label, dto);
    if (userId) label.updatedBy = userId;

    await this.labelRepo.save(label);
    return this.findLabelById(id);
  }

  async deleteLabel(id: string): Promise<void> {
    const label = await this.findLabelById(id);
    label.deletedAt = new Date();
    await this.labelRepo.save(label);
  }

  // ========== LANDING COSTS ==========

  async createLandingCost(data: Partial<PurchaseLandingCost>): Promise<PurchaseLandingCost> {
    const cost = this.landingCostRepo.create(data);
    return this.landingCostRepo.save(cost);
  }

  async findLandingCostsByLocation(location: string): Promise<PurchaseLandingCost[]> {
    return this.landingCostRepo.find({
      where: { location },
    });
  }

  // ========== HELPER METHODS ==========

  private validateStatusTransition(current: PurchaseStatus, next: PurchaseStatus): void {
    const allowed = PURCHASE_STATUS_TRANSITIONS[current];
    if (!allowed || !allowed.includes(next)) {
      throw new BadRequestException(
        `Invalid status transition from '${current}' to '${next}'. Allowed: ${allowed?.join(', ') || 'none'}`
      );
    }
  }

  private async paginate<T>(
    repo: Repository<T>,
    page: number,
    limit: number,
    where: any,
    order: any,
    relations: string[] = [],
  ): Promise<PaginatedResult<T>> {
    const [data, total] = await repo.findAndCount({
      where,
      order,
      relations,
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async syncQuoteItemToSalesEnquiry(item: PurchaseQuoteItem, purchaseStatus?: string) {
    if (!item.enquiryItemId) return;
    try {
      const isManual = !item.productId || item.sku?.startsWith('TEMP-') || item.sku === 'NOT IN MASTER' || item.categoryName === 'NOT IN MASTER';
      await this.dataSource.query(
        `UPDATE sales_enquiry_order_items 
         SET expected_rate = $1, 
             remarks = COALESCE($2, remarks),
             purchase_status = COALESCE($3, purchase_status),
             product_id = COALESCE($4, product_id),
             master_product_id = COALESCE($5, master_product_id),
             sku = COALESCE($6, sku),
             category_id = COALESCE($7, category_id),
             category_name = COALESCE($8, category_name),
             brand_id = COALESCE($9, brand_id),
             brand_name = COALESCE($10, brand_name),
             product_name = COALESCE($11, product_name),
             unit_size = COALESCE($12, unit_size),
             unit_per_carton = COALESCE($13, unit_per_carton),
             cbm_per_box = COALESCE($14, cbm_per_box),
             mrp = COALESCE($15, mrp),
             gst_percent = COALESCE($16, gst_percent),
             is_manual_entry = $17
         WHERE item_id::text = $18`,
        [
          item.buyingPrice || item.landingCost || 0,
          item.remark || item.remarks,
          purchaseStatus || 'in_progress',
          item.productId,
          item.productId || null,
          item.sku,
          item.categoryId,
          item.categoryName,
          item.brandId,
          item.brandName,
          item.productName,
          item.unitSize,
          item.unitPerCarton,
          item.cbmPerBox,
          item.mrp,
          item.gstPercent,
          !!isManual,
          item.enquiryItemId
        ]
      );
    } catch (err) {
      console.error('Failed to sync quote item to sales enquiry item:', err);
    }
  }

  private async ensureEnquiryInProgress(enquiryItemId: string) {
    if (!enquiryItemId) return;
    try {
      const items = await this.dataSource.query(
        `SELECT enquiry_order_id FROM sales_enquiry_order_items WHERE item_id::text = $1`,
        [enquiryItemId]
      );
      if (items && items[0] && items[0].enquiry_order_id) {
        const eqId = items[0].enquiry_order_id;
        const enquiries = await this.dataSource.query(
          `SELECT status FROM sales_enquiry_orders WHERE enquiry_order_id::text = $1`,
          [eqId]
        );
        if (enquiries && enquiries[0] && (enquiries[0].status === 'purchase_assigned' || enquiries[0].status === 'submitted')) {
          await this.dataSource.query(
            `UPDATE sales_enquiry_orders SET status = 'purchase_in_progress' WHERE enquiry_order_id::text = $1`,
            [eqId]
          );
        }
      }
    } catch (err) {
      console.error('Failed to transition enquiry to purchase_in_progress:', err);
    }
  }

  private async handleQuoteSubmission(quoteId: string) {
    try {
      const items = await this.itemRepo.find({ where: { quoteId, deletedAt: IsNull() } });
      for (const item of items) {
        if (item.enquiryItemId) {
          await this.dataSource.query(
            `UPDATE sales_enquiry_order_items 
             SET purchase_status = 'submitted', 
                 purchase_submitted_at = NOW() 
             WHERE item_id::text = $1`,
            [item.enquiryItemId]
          );
        }
      }

      const quote = await this.quoteRepo.findOne({ where: { quoteId } });
      if (quote && quote.enquiryOrderId) {
        const enquiryItems = await this.dataSource.query(
          `SELECT item_id, purchase_status FROM sales_enquiry_order_items WHERE enquiry_order_id::text = $1 AND deleted_at IS NULL`,
          [quote.enquiryOrderId]
        );
        const allSubmitted = enquiryItems.every((item: any) => item.purchase_status === 'submitted' || item.purchase_status === 'completed');
        if (allSubmitted && enquiryItems.length > 0) {
          const oldEnquiries = await this.dataSource.query(
            `SELECT status FROM sales_enquiry_orders WHERE enquiry_order_id::text = $1`,
            [quote.enquiryOrderId]
          );
          const oldStatus = oldEnquiries && oldEnquiries[0] ? oldEnquiries[0].status : 'purchase_in_progress';

          // 1. Transition to purchase_completed
          await this.dataSource.query(
            `UPDATE sales_enquiry_orders 
             SET status = 'purchase_completed' 
             WHERE enquiry_order_id::text = $1`,
            [quote.enquiryOrderId]
          );
          console.log(`Enquiry ${quote.enquiryOrderId} status automatically updated to purchase_completed`);

          // Insert punching log for purchase_completed
          await this.dataSource.query(
            `INSERT INTO enquiry_punching_logs (enquiry_order_id, old_status, new_status, remarks, punched_at)
             VALUES ($1, $2, 'purchase_completed', 'Purchase Quotes completed, automatically updated status.', NOW())`,
            [quote.enquiryOrderId, oldStatus]
          );

          // 2. Transition to mis_review
          await this.dataSource.query(
            `UPDATE sales_enquiry_orders 
             SET status = 'mis_review' 
             WHERE enquiry_order_id::text = $1`,
            [quote.enquiryOrderId]
          );
          console.log(`Enquiry ${quote.enquiryOrderId} status automatically updated to mis_review`);

          // Insert punching log for mis_review
          await this.dataSource.query(
            `INSERT INTO enquiry_punching_logs (enquiry_order_id, old_status, new_status, remarks, punched_at)
             VALUES ($1, 'purchase_completed', 'mis_review', 'Automatically forwarded to MIS Review.', NOW())`,
            [quote.enquiryOrderId]
          );
        }
      }
    } catch (err) {
      console.error('Failed to handle quote submission:', err);
    }
  }
}
