import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindManyOptions, In, IsNull, DataSource } from 'typeorm';
import { SalesEnquiryOrder, EnquiryStatus } from './entities/sales-enquiry.entity';
import { SalesEnquiryOrderItem } from './entities/sales-enquiry-item.entity';
import { SalesEnquiryDocument } from './entities/sales-enquiry-document.entity';
import { EnquiryPunchingLog } from './entities/enquiry-punching-log.entity';
import { EnquiryEmailReminder, ReminderStatus } from './entities/enquiry-email-reminder.entity';
import { CreateEnquiryDto, UpdateEnquiryDto, UpdateEnquiryItemDto } from '../../common/dto/create-sales.dto';
import { NumberSeriesService } from '../../common/utils/number-series';
import { PaginatedResult } from '../../common/types';
import { EventBusService, ERPEventType } from '../events/event-bus.service';
import { User } from '../users/entities/user.entity';
import { Customer } from '../masters/entities/customer.entity';
import { MastersService } from '../masters/masters.service';
import { RateService } from '../rate/rate.service';
import { SalesOrderService } from '../sales-order/sales-order.service';
import { CreateSalesOrderDto } from '../sales-order/dto/sales-order.dto';

// Valid status transitions
const STATUS_TRANSITIONS: Record<EnquiryStatus, EnquiryStatus[]> = {
  [EnquiryStatus.DRAFT]: [EnquiryStatus.SUBMITTED],
  [EnquiryStatus.SUBMITTED]: [
    EnquiryStatus.PUNCHED,
    EnquiryStatus.VERIFIED,
    EnquiryStatus.PURCHASE_ASSIGNED,
    EnquiryStatus.CANCELLED,
  ],
  [EnquiryStatus.PURCHASE_ASSIGNED]: [EnquiryStatus.PURCHASE_IN_PROGRESS, EnquiryStatus.CANCELLED],
  [EnquiryStatus.PURCHASE_IN_PROGRESS]: [EnquiryStatus.PURCHASE_COMPLETED, EnquiryStatus.CANCELLED],
  [EnquiryStatus.PURCHASE_COMPLETED]: [EnquiryStatus.MIS_REVIEW, EnquiryStatus.CANCELLED],
  [EnquiryStatus.MIS_REVIEW]: [EnquiryStatus.MIS_APPROVED, EnquiryStatus.MIS_REQUOTE_REQUIRED, EnquiryStatus.CANCELLED],
  [EnquiryStatus.MIS_REQUOTE_REQUIRED]: [EnquiryStatus.PURCHASE_IN_PROGRESS, EnquiryStatus.CANCELLED],
  [EnquiryStatus.MIS_APPROVED]: [EnquiryStatus.RATE_CALCULATION, EnquiryStatus.CANCELLED],
  [EnquiryStatus.RATE_CALCULATION]: [EnquiryStatus.APPROVAL_PENDING, EnquiryStatus.CANCELLED],
  [EnquiryStatus.APPROVAL_PENDING]: [EnquiryStatus.QUOTATION_CREATED, EnquiryStatus.CANCELLED],
  [EnquiryStatus.QUOTATION_CREATED]: [EnquiryStatus.QUOTATION_SENT, EnquiryStatus.WON, EnquiryStatus.LOST, EnquiryStatus.CANCELLED],
  [EnquiryStatus.QUOTATION_SENT]: [EnquiryStatus.WON, EnquiryStatus.LOST, EnquiryStatus.CANCELLED],
  [EnquiryStatus.WON]: [],
  [EnquiryStatus.LOST]: [],
  [EnquiryStatus.CANCELLED]: [],

  // Legacy mappings for compatibility
  [EnquiryStatus.PUNCHED]: [EnquiryStatus.VERIFIED, EnquiryStatus.PURCHASE_ASSIGNED, EnquiryStatus.CANCELLED],
  [EnquiryStatus.VERIFIED]: [EnquiryStatus.PURCHASE_PENDING, EnquiryStatus.PURCHASE_ASSIGNED, EnquiryStatus.CANCELLED],
  [EnquiryStatus.PURCHASE_PENDING]: [EnquiryStatus.PURCHASE_ASSIGNED, EnquiryStatus.PURCHASE_IN_PROGRESS, EnquiryStatus.CANCELLED],
  [EnquiryStatus.VENDOR_QUOTE_PENDING]: [EnquiryStatus.RATE_PENDING, EnquiryStatus.RATE_CALCULATION, EnquiryStatus.CANCELLED],
  [EnquiryStatus.RATE_PENDING]: [EnquiryStatus.RATE_CALCULATION, EnquiryStatus.APPROVAL_PENDING, EnquiryStatus.CANCELLED],
  [EnquiryStatus.FOLLOW_UP]: [EnquiryStatus.QUOTATION_SENT, EnquiryStatus.WON, EnquiryStatus.LOST, EnquiryStatus.CANCELLED],
};

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(SalesEnquiryOrder)
    private enquiryRepo: Repository<SalesEnquiryOrder>,
    @InjectRepository(SalesEnquiryOrderItem)
    private itemRepo: Repository<SalesEnquiryOrderItem>,
    @InjectRepository(SalesEnquiryDocument)
    private documentRepo: Repository<SalesEnquiryDocument>,
    @InjectRepository(EnquiryPunchingLog)
    private punchingLogRepo: Repository<EnquiryPunchingLog>,
    @InjectRepository(EnquiryEmailReminder)
    private reminderRepo: Repository<EnquiryEmailReminder>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    private numberSeries: NumberSeriesService,
    private eventBus: EventBusService,
    @Inject(forwardRef(() => MastersService))
    private mastersService: MastersService,
    @Inject(forwardRef(() => RateService))
    private rateService: RateService,
    private salesOrderService: SalesOrderService,
    private dataSource: DataSource,
  ) { }

  async getPurchaseUsers(currentUser?: any): Promise<{ userId: string; name: string }[]> {
    const users = await this.dataSource.query(`
      SELECT u.user_id AS "userId", u.name AS "name"
      FROM users u
      INNER JOIN departments d ON d.department_id = u.department_id
      WHERE d.department_code = 'PURCHASE'
        AND u.is_active = true
        AND u.deleted_at IS NULL
      ORDER BY u.name ASC
    `);
    return users;
  }

  private async paginate<T>(
    repo: Repository<T>,
    page: number = 1,
    limit: number = 20,
    where: any = {},
    order: any = { createdAt: 'DESC' },
    relations: string[] = [],
  ): Promise<PaginatedResult<T>> {
    const skip = (page - 1) * limit;
    const [data, total] = await repo.findAndCount({
      where,
      order,
      relations,
      skip,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ========== ENQUIRY ORDERS ==========
  async createEnquiry(dto: CreateEnquiryDto, userId?: string, companyId?: string, currentUser?: any): Promise<SalesEnquiryOrder> {
    // Generate enquiry number using actual user code
    let userCode = 'USR';
    const effectiveCreatorId = dto.createdBy || userId;
    console.log('[createEnquiry] Input:', { dtoCreatedBy: dto.createdBy, userId, effectiveCreatorId });
    if (effectiveCreatorId) {
      const user = await this.userRepo.findOne({ where: { userId: effectiveCreatorId } as any });
      if (user?.userCode) {
        userCode = user.userCode.trim().replace(/\s+/g, '');
      }
    }
    const enquiryOrderNo = dto.enquiryNumber || await this.numberSeries.generateEnquiryNumber(userCode);

    // Create enquiry with all fields
    const enquiry = this.enquiryRepo.create({
      customerId: dto.customerId,
      companyId: companyId,
      enquiryOrderNo,
      status: dto.status as EnquiryStatus || EnquiryStatus.DRAFT,
      remarks: dto.remarks,
      createdBy: effectiveCreatorId,
      // Map all additional fields from frontend
      buyerCode: dto.buyerCode,
      buyerName: dto.buyerName,
      contactName: dto.contactName,
      contactNumber: dto.contactNumber,
      buyerEmail: dto.buyerEmail,
      country: dto.country,
      state: dto.state,
      city: dto.city,
      poNumber: dto.poNumber,
      poDate: dto.poDate ? new Date(dto.poDate) : undefined,
      pod: dto.pod,
      paymentTermsId: dto.paymentTermsId,
      currencyId: dto.currencyId,
      shipmentDetails: dto.shipmentDetails,
      cubeSize: dto.cubeSize,
      portOfLoading: dto.portOfLoading,
      transporterDetails: dto.transporterDetails,
      isBillingSameAsDelivery: dto.isBillingSameAsDelivery,
      billingAddress: dto.billingAddress,
      deliveryAddress: dto.deliveryAddress,
      isExportEnquiry: dto.isExportEnquiry,
      isPoReceived: dto.isPoReceived,
      isPurchaseRequired: dto.isPurchaseRequired,
      isRateCalculationRequired: dto.isRateCalculationRequired,
      isApprovalRequired: dto.isApprovalRequired,
      isEmailReminderRequired: dto.isEmailReminderRequired,
      enquiryDate: dto.enquiryDate ? new Date(dto.enquiryDate) : new Date(),
      salesPersonName: dto.salesPersonName,
    });

    const savedEnquiry = await this.enquiryRepo.save(enquiry);

    // Create items if provided
    let aggregateTotalCbm = 0;
    if (dto.items && dto.items.length > 0) {
      const items = [];
      for (const item of dto.items) {
        let productId = item.productId;
        let sku = item.sku;
        if (item.isManualEntry) {
          const tempProduct = await this.mastersService.createManualProduct(
            item.manualProductName || item.productName,
            savedEnquiry.enquiryOrderId,
            savedEnquiry.enquiryOrderNo,
            userId,
            item.remarks,
          );
          productId = tempProduct.productId;
          sku = tempProduct.sku;
        }

        const quantity = item.quantity || 1;

        // Auto-fetch assigned purchase person and product details from Product Master
        let purchasePersonId = item.purchasePersonId;
        let purchasePersonName = item.purchasePersonName;
        let productPurchasePersonName = item.productPurchasePersonName;
        if (productId) {
          try {
            const product = await this.mastersService.findProductById(productId, currentUser);
            if (product) {
              if (product.purchasePersonId && !purchasePersonId) {
                purchasePersonId = product.purchasePersonId;
              }
              productPurchasePersonName = product.purchasePersonName || '';
              if (!item.cbmPerBox && product.cbmPerBox) {
                item.cbmPerBox = product.cbmPerBox;
              }
              if (!item.unitPerCarton && (product.unitsPerCase || product.unitsPerCarton)) {
                item.unitPerCarton = product.unitsPerCase || product.unitsPerCarton;
              }
            }
          } catch (e) {
            console.error('Failed to resolve purchase person from product master:', e);
          }
        }

        const cbmPerBox = item.cbmPerBox ? Number(item.cbmPerBox) : 0;
        const totalCbm = cbmPerBox * quantity;
        aggregateTotalCbm += totalCbm;
        if (purchasePersonId) {
          try {
            const pUser = await this.userRepo.findOne({ where: { userId: purchasePersonId } as any });
            if (pUser) {
              purchasePersonName = pUser.name || '';
            }
          } catch (e) {
            console.error('Failed to resolve purchase person name:', e);
          }
        }

        const enquiryItem = this.itemRepo.create({
          productId: productId,
          productName: item.productName,
          productCode: item.productCode,
          sku: sku,
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          brandId: item.brandId,
          brandName: item.brandName,
          quantity: quantity,
          unitPerCarton: item.unitPerCarton,
          uom: item.uom,
          cbmPerBox: cbmPerBox,
          expectedRate: item.expectedRate,
          mrp: item.mrp,
          buyingPrice: item.buyingPrice,
          gstPercent: item.gstPercent,
          productDescription: item.productDescription,
          unitSize: item.unitSize,
          totalCbm: totalCbm,
          purchasePersonId: purchasePersonId,
          purchasePersonName: purchasePersonName,
          productPurchasePersonName: productPurchasePersonName,
          assignedPurchaseUserId: purchasePersonId,
          purchaseStatus: 'pending',
          remarks: item.remarks,
          isManualEntry: item.isManualEntry,
          manualProductName: item.manualProductName,
          masterStatus: item.masterStatus as any,
          enquiryOrderId: savedEnquiry.enquiryOrderId,
        });
        items.push(enquiryItem);
      }
      await this.itemRepo.save(items);

      // Save aggregate Total CBM on Enquiry Header
      savedEnquiry.totalCbm = aggregateTotalCbm;
      await this.enquiryRepo.save(savedEnquiry);
    }

    // Log status change
    await this.addPunchingLog({
      enquiryOrderId: savedEnquiry.enquiryOrderId,
      oldStatus: null as any,
      newStatus: savedEnquiry.status,
      changedBy: userId,
      remarks: 'Enquiry created',
    });

    // Emit event: Enquiry Created
    this.eventBus.emit(ERPEventType.ENQUIRY_CREATED, companyId || 'system', userId, {
      enquiryId: savedEnquiry.enquiryOrderId,
      enquiryNo: savedEnquiry.enquiryOrderNo,
      customerId: dto.customerId,
    });

    return this.findEnquiryById(savedEnquiry.enquiryOrderId);
  }

  async findAllEnquiries(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: EnquiryStatus;
    customerId?: string;
    createdBy?: string;
    unassigned?: boolean;
    currentUser?: any;
  } = {}): Promise<PaginatedResult<SalesEnquiryOrder>> {
    const { page = 1, limit = 20, search, status, customerId, createdBy, unassigned, currentUser } = params;

    // Build where clause — supports search across multiple fields via OR
    let whereClause: any;
    const baseFilters: any = { deletedAt: null as any };
    if (status) {
      const validStatuses = new Set(Object.values(EnquiryStatus));
      const normalizeStatus = (value: string) => {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'requote_required' || normalized === 'revised') {
          return EnquiryStatus.MIS_REQUOTE_REQUIRED;
        }
        return validStatuses.has(normalized as EnquiryStatus) ? normalized : null;
      };
      if (typeof status === 'string' && status.includes(',')) {
        const statuses = [...new Set(status.split(',').map(normalizeStatus).filter(Boolean))];
        if (statuses.length) baseFilters.status = In(statuses);
      } else {
        const normalized = normalizeStatus(status as string);
        if (normalized) baseFilters.status = normalized;
      }
    }
    if (customerId) baseFilters.customerId = customerId;
    if (createdBy) baseFilters.createdBy = createdBy;

    const currentUserId = currentUser?.sub || currentUser?.userId;

    if (unassigned) {
      const unassignedItems = await this.itemRepo.find({
        where: {
          assignedPurchaseUserId: IsNull() as any,
          purchasePersonId: IsNull() as any,
          deletedAt: IsNull() as any,
        },
        select: ['enquiryOrderId'],
      });
      const unassignedEnquiryIds = [...new Set(unassignedItems.map(item => item.enquiryOrderId).filter(Boolean))];
      if (unassignedEnquiryIds.length > 0) {
        baseFilters.enquiryOrderId = In(unassignedEnquiryIds);
      } else {
        baseFilters.enquiryOrderId = '00000000-0000-0000-0000-000000000000';
      }
    } else if (currentUser && !currentUser.isSuperAdmin) {
      const roles = (currentUser.roles || []).map((r: string) => r.toUpperCase());
      const isAdmin = roles.includes('ADMIN') || roles.includes('MANAGEMENT');
      const isMis = roles.includes('MIS') || roles.includes('MIS_USER');

      if (!isAdmin && !isMis) {
        const isSales = roles.includes('SALES_USER') || roles.includes('SALES_MANAGER');
        const isPurchase = roles.includes('PURCHASE_USER') || roles.includes('PURCHASE_MANAGER');

        if (isSales && !isPurchase) {
          baseFilters.createdBy = currentUserId;
        } else if (isPurchase) {
          const assignedItems = await this.itemRepo.find({
            where: [
              { assignedPurchaseUserId: currentUserId },
              { purchasePersonId: currentUserId },
            ],
            select: ['enquiryOrderId'],
          });
          const assignedEnquiryIds = assignedItems.map(item => item.enquiryOrderId).filter(Boolean);
          if (assignedEnquiryIds.length > 0) {
            baseFilters.enquiryOrderId = In(assignedEnquiryIds);
          } else {
            baseFilters.enquiryOrderId = '00000000-0000-0000-0000-000000000000';
          }
        }
      }
    }

    if (search) {
      // Use OR across enquiryOrderNo, buyerName, buyerCode, poNumber
      whereClause = [
        { ...baseFilters, enquiryOrderNo: ILike(`%${search}%`) },
        { ...baseFilters, buyerName: ILike(`%${search}%`) },
        { ...baseFilters, buyerCode: ILike(`%${search}%`) },
        { ...baseFilters, poNumber: ILike(`%${search}%`) },
      ];
    } else {
      whereClause = baseFilters;
    }

    const skip = (page - 1) * limit;
    const [data, total] = await this.enquiryRepo.findAndCount({
      where: whereClause,
      order: { createdAt: 'DESC' },
      relations: ['createdByUser'],
      skip,
      take: limit,
    });
    const result = { data, total, page, limit, totalPages: Math.ceil(total / limit) };

    // Fetch customer details for all distinct customer IDs in the list
    const customerIds = result.data.map(e => e.customerId).filter(Boolean);
    let customersMap = new Map<string, any>();
    if (customerIds.length > 0) {
      const customers = await this.customerRepo.find({
        where: { customerId: In(customerIds) }
      });
      customersMap = new Map(customers.map(c => [c.customerId, c]));
    }

    // Add items, item count, submitted count, and customer details to each enquiry
    for (const enquiry of result.data) {
      const items = await this.itemRepo.find({
        where: { enquiryOrderId: (enquiry as any).enquiryOrderId, deletedAt: IsNull() },
        select: ['itemId', 'purchaseStatus', 'assignedPurchaseUserId', 'purchasePersonId', 'purchasePersonName', 'productName', 'sku', 'manualProductName']
      });
      (enquiry as any).items = items;
      (enquiry as any).itemCount = items.length;
      (enquiry as any).submittedItemCount = items.filter(
        it => it.purchaseStatus === 'submitted' || it.purchaseStatus === 'completed'
      ).length;

      const customer = customersMap.get(enquiry.customerId);
      if (customer) {
        (enquiry as any).customer = customer;
        (enquiry as any).customerName = customer.customerName;
      }
    }

    return result;
  }

  async findEnquiryById(id: string): Promise<SalesEnquiryOrder> {
    const enquiry = await this.enquiryRepo.findOne({
      where: { enquiryOrderId: id, deletedAt: null as any },
      relations: ['createdByUser'],
    });
    if (!enquiry) throw new NotFoundException('Enquiry not found');

    if (enquiry.customerId) {
      const customer = await this.customerRepo.findOne({ where: { customerId: enquiry.customerId } });
      if (customer) {
        (enquiry as any).customer = customer;
        (enquiry as any).customerName = customer.customerName;
      }
    }

    const items = await this.itemRepo.find({
      where: { enquiryOrderId: id, deletedAt: null as any },
    });
    (enquiry as any).items = items;

    return enquiry;
  }

  async findEnquiryByNumber(enquiryOrderNo: string): Promise<SalesEnquiryOrder> {
    const enquiry = await this.enquiryRepo.findOne({
      where: { enquiryOrderNo },
      relations: [],
    });
    if (!enquiry) throw new NotFoundException('Enquiry not found');

    if (enquiry.customerId) {
      const customer = await this.customerRepo.findOne({ where: { customerId: enquiry.customerId } });
      if (customer) {
        (enquiry as any).customer = customer;
        (enquiry as any).customerName = customer.customerName;
      }
    }

    const items = await this.itemRepo.find({
      where: { enquiryOrderId: enquiry.enquiryOrderId, deletedAt: null as any },
    });
    (enquiry as any).items = items;

    return enquiry;
  }

  async updateEnquiry(id: string, dto: UpdateEnquiryDto) {
    const enquiry = await this.findEnquiryById(id);
    Object.assign(enquiry, dto);
    return this.enquiryRepo.save(enquiry);
  }

  async convertEnquiryToSalesOrder(id: string, userId?: string, companyId?: string) {
    const enquiry = await this.findEnquiryById(id);
    const enquiryCompanyId = enquiry.companyId || companyId;

    if (companyId && enquiry.companyId && enquiry.companyId !== companyId) {
      throw new NotFoundException('Enquiry not found');
    }

    if (enquiry.status !== EnquiryStatus.WON) {
      throw new BadRequestException('Only won enquiries can be converted to sales order');
    }

    const existingOrder = await this.salesOrderService.findSalesOrderByEnquiryId(id, enquiryCompanyId || undefined);
    if (existingOrder) {
      return existingOrder;
    }

    const items = (enquiry as any).items || [];
    if (!items.length) {
      throw new BadRequestException('Cannot create sales order because enquiry has no items');
    }

    const customer = (enquiry as any).customer;
    const billingAddress = enquiry.billingAddress || customer?.billingAddress || '-';
    const shippingAddress = enquiry.deliveryAddress || customer?.deliveryAddress || billingAddress;

    const orderDto: CreateSalesOrderDto = {
      enquiryId: enquiry.enquiryOrderId,
      orderDate: new Date(),
      expectedDeliveryDate: enquiry.podDate || undefined,
      customerId: enquiry.customerId || customer?.customerId || '',
      customerName: customer?.customerName || enquiry.buyerName || enquiry.buyerCode || 'Customer',
      customerCode: enquiry.buyerCode || customer?.buyerCode,
      contactPerson: enquiry.contactName || customer?.contactPerson,
      contactPhone: enquiry.contactNumber || enquiry.buyerPhone || customer?.contactNumber || customer?.mobile,
      contactEmail: enquiry.buyerEmail || customer?.email,
      billingAddress,
      billingCountry: enquiry.billingCountry || customer?.billingCountry || enquiry.country,
      billingState: enquiry.billingState || customer?.billingState || enquiry.state,
      billingCity: enquiry.billingCity || customer?.billingCity || enquiry.city,
      billingPincode: enquiry.billingPincode || customer?.billingPincode,
      billingGstin: customer?.gstNumber,
      shippingAddress,
      shippingCountry: enquiry.deliveryCountry || customer?.deliveryCountry || enquiry.country,
      shippingState: enquiry.deliveryState || customer?.deliveryState || enquiry.state,
      shippingCity: enquiry.deliveryCity || customer?.deliveryCity || enquiry.city,
      shippingPincode: enquiry.deliveryPincode || customer?.deliveryPincode,
      salesPersonId: enquiry.salesPersonId || customer?.salesPersonId,
      paymentTermsId: enquiry.paymentTermsId || customer?.paymentTermsId,
      currencyId: enquiry.currencyId || customer?.currencyId,
      poNumber: enquiry.poNumber,
      poDate: enquiry.poDate,
      isExport: enquiry.isExportEnquiry,
      portOfLoading: enquiry.portOfLoading || customer?.portOfLoading,
      portOfDischarge: enquiry.portOfDischarge || enquiry.pod,
      notes: `Converted from enquiry ${enquiry.enquiryOrderNo}`,
      items: items.map((item: any, index: number) => ({
        productId: item.masterProductId || item.productId,
        productName: item.productName || item.manualProductName || item.sku || `Item ${index + 1}`,
        productCode: item.productCode,
        categoryName: item.categoryName,
        brandName: item.brandName,
        sku: item.sku,
        uomName: item.uom,
        unitSize: item.unitSize,
        unitBasis: item.unitBasis,
        packingType: item.packingType,
        purchasePersonId: item.purchasePersonId || item.assignedPurchaseUserId,
        purchasePersonName: item.purchasePersonName || item.productPurchasePersonName,
        unitsPerCase: item.unitsPerCase || item.unitPerCarton,
        cbmPerBox: item.cbmPerBox ? Number(item.cbmPerBox) : undefined,
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.expectedRate || item.mrp || 0),
        mrp: item.mrp ? Number(item.mrp) : undefined,
        buyingBestLandingRate: item.expectedRate ? Number(item.expectedRate) : undefined,
        landingCost: item.expectedRate ? Number(item.expectedRate) : undefined,
        gstRate: item.gstPercent ? Number(item.gstPercent) : 18,
        description: item.productDescription || item.specialRequirement || item.remarks,
      })),
    };

    const salesOrder = await this.salesOrderService.createSalesOrder(
      orderDto,
      userId || enquiry.createdBy,
      enquiryCompanyId as string,
    );

    await this.addPunchingLog({
      enquiryOrderId: id,
      oldStatus: enquiry.status,
      newStatus: enquiry.status,
      changedBy: userId,
      remarks: `Sales order ${salesOrder.orderNumber} created from won enquiry`,
    });

    return salesOrder;
  }

  async updateEnquiryStatus(
    id: string,
    newStatus: EnquiryStatus,
    userId?: string,
    remarks?: string,
    companyId?: string,
    roles?: string[],
  ) {
    const enquiry = await this.findEnquiryById(id);
    const oldStatus = enquiry.status;

    // Validate status transition
    if (!this.canTransition(oldStatus, newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${oldStatus} to ${newStatus}`,
      );
    }

    const adminOnlyStatuses = [
      EnquiryStatus.PURCHASE_ASSIGNED,
      EnquiryStatus.RATE_CALCULATION,
      EnquiryStatus.APPROVAL_PENDING,
      EnquiryStatus.QUOTATION_CREATED,
    ];
    if (adminOnlyStatuses.includes(newStatus)) {
      const userRoles = (roles || []).map(r => r.toUpperCase());
      const hasAdmin = userRoles.includes('ADMIN') || userRoles.includes('MANAGEMENT');
      if (!hasAdmin) {
        throw new BadRequestException('Only Admin/Management can perform this action.');
      }
    }

    // Validate Purchase Completed transition
    if (newStatus === EnquiryStatus.PURCHASE_COMPLETED) {
      const items = await this.itemRepo.find({ where: { enquiryOrderId: id, deletedAt: null as any } });
      if (!items || items.length === 0) {
        throw new BadRequestException('Enquiry has no products.');
      }
      const pendingItems = items.filter(item => item.purchaseStatus !== 'submitted' && item.purchaseStatus !== 'completed');
      if (pendingItems.length > 0) {
        throw new BadRequestException(
          `Cannot complete purchase: ${pendingItems.length} product(s) (e.g. ${pendingItems[0].productName || pendingItems[0].sku}) still have pending purchase quote status.`
        );
      }
    }

    // Validate MIS Review start condition (Critical Change 6)
    if (newStatus === EnquiryStatus.MIS_REVIEW) {
      const items = await this.itemRepo.find({ where: { enquiryOrderId: id, deletedAt: null as any } });
      if (!items || items.length === 0) {
        throw new BadRequestException('Enquiry has no products.');
      }
      for (const item of items) {
        if (!item.assignedPurchaseUserId) {
          throw new BadRequestException(`Product ${item.productName || item.productCode} is not assigned to any Purchase User.`);
        }
        if (item.purchaseStatus !== 'submitted' && item.purchaseStatus !== 'completed') {
          throw new BadRequestException(`Product ${item.productName || item.productCode} does not have a submitted Purchase Quote.`);
        }
      }
    }

    // Update status
    enquiry.status = newStatus;
    await this.enquiryRepo.save(enquiry);

    // Log the change
    await this.addPunchingLog({
      enquiryOrderId: id,
      oldStatus,
      newStatus,
      changedBy: userId,
      remarks: remarks || `Status changed from ${oldStatus} to ${newStatus}`,
    });

    // Emit status changed event
    this.eventBus.emit(ERPEventType.ENQUIRY_STATUS_CHANGED, companyId || 'system', userId, {
      enquiryId: id,
      enquiryNo: enquiry.enquiryOrderNo,
      oldStatus,
      newStatus,
    });

    // Auto-create Price Analysis if transitioned to RATE_PENDING or RATE_CALCULATION
    if (newStatus === EnquiryStatus.RATE_PENDING || newStatus === EnquiryStatus.RATE_CALCULATION) {
      try {
        // Check if a PriceAnalysis already exists
        const existingAnalysis = await this.rateService.findAllAnalysis({ enquiryOrderId: id });
        if (existingAnalysis && existingAnalysis.total > 0) {
          // Trigger createRequote on the latest one
          const latest = existingAnalysis.data[0];
          await this.rateService.createRequote(latest.analysisId, remarks || 'Requote requested from Sales', '', userId);
        } else {
          const items = await this.itemRepo.find({ where: { enquiryOrderId: id } });
          const analysisItems = items.map((item, index) => ({
            enquiryItemId: item.itemId,
            lineNo: item.lineNo || (index + 1),
            sku: item.sku,
            productCode: item.productCode,
            categoryId: item.categoryId,
            categoryName: item.categoryName,
            productName: item.productName,
            productDescription: item.productDescription,
            brandId: item.brandId,
            brandName: item.brandName,
            unitSize: item.unitSize,
            unitsPerCase: item.unitsPerCase || item.unitPerCarton,
            uom: item.uom,
            unitBasis: item.unitBasis,
            packingSize: item.packingSize,
            orderQuantity: item.quantity,
            cbmPerBox: item.cbmPerBox ? Number(item.cbmPerBox) : undefined,
            totalCbm: item.totalCbm ? Number(item.totalCbm) : undefined,
            mrp: item.mrp ? Number(item.mrp) : undefined,
            buyingPrice: item.expectedRate ? Number(item.expectedRate) : undefined,
            purchaseCurrency: item.expectedCurrency || 'INR',
            gstPercent: item.gstPercent ? Number(item.gstPercent) : undefined,
            status: 'pending',
          }));

          await this.rateService.createAnalysis({
            enquiryOrderId: enquiry.enquiryOrderId,
            enquiryOrderNo: enquiry.enquiryOrderNo,
            customerId: enquiry.customerId,
            buyerCode: enquiry.buyerCode,
            customerName: enquiry.buyerName,
            country: enquiry.country,
            state: enquiry.state,
            city: enquiry.city,
            pod: enquiry.pod,
            paymentTermsId: enquiry.paymentTermsId,
            currencyId: enquiry.currencyId,
            portOfLoading: enquiry.portOfLoading,
            salesPersonId: enquiry.salesPersonId,
            items: analysisItems as any,
          }, userId);
        }
      } catch (err) {
        console.error('[SalesService] Failed to auto-create or requote PriceAnalysis:', err?.message);
      }
    }

    // If enquiry is submitted, emit specific event (triggers FMS task creation)
    if (newStatus === EnquiryStatus.SUBMITTED) {
      this.eventBus.emit(ERPEventType.ENQUIRY_SUBMITTED, companyId || 'system', userId, {
        enquiryId: id,
        enquiryNo: enquiry.enquiryOrderNo,
        customerId: enquiry.customerId,
      });

      // Check for NOT IN MASTER products and emit event
      const items = await this.itemRepo.find({ where: { enquiryOrderId: id, deletedAt: IsNull() } });
      const manualProducts = items
        .filter(item => item.isManualEntry)
        .map(item => ({
          sku: item.sku || 'NOT IN MASTER',
          productName: item.productName,
          quantity: item.quantity,
        }));

      if (manualProducts.length > 0) {
        this.eventBus.productNotInMaster(companyId || 'system', userId, id, enquiry.enquiryOrderNo, manualProducts);
      }

      // Auto-transition to purchase_assigned if items have assigned purchase managers
      const hasPurchaseAssignments = items.length > 0 && items.every(it => it.assignedPurchaseUserId || it.purchasePersonId);
      if (hasPurchaseAssignments) {
        try {
          enquiry.status = EnquiryStatus.PURCHASE_ASSIGNED;
          await this.enquiryRepo.save(enquiry);
          await this.addPunchingLog({
            enquiryOrderId: id,
            oldStatus: EnquiryStatus.SUBMITTED,
            newStatus: EnquiryStatus.PURCHASE_ASSIGNED,
            changedBy: userId,
            remarks: 'Auto-transitioned: Purchase managers assigned to all items.',
          });
        } catch (e) {
          console.error('Failed auto-transition to purchase_assigned:', e);
        }
      }
    }

    return this.findEnquiryById(id);
  }

  private canTransition(from: EnquiryStatus, to: EnquiryStatus): boolean {
    const allowed = STATUS_TRANSITIONS[from];
    return allowed?.includes(to) || false;
  }

  async getStatusTransitions(currentStatus: EnquiryStatus): Promise<EnquiryStatus[]> {
    return STATUS_TRANSITIONS[currentStatus] || [];
  }

  async deleteEnquiry(id: string) {
    const enquiry = await this.findEnquiryById(id);
    enquiry.deletedAt = new Date();
    await this.enquiryRepo.save(enquiry);
    return { deleted: true };
  }

  // ========== ENQUIRY ITEMS ==========
  async addEnquiryItem(enquiryId: string, data: any) {
    const enquiry = await this.findEnquiryById(enquiryId);

    // Auto-fetch purchase person from Product Master if not manually selected
    let purchasePersonId = data.purchasePersonId;
    let purchasePersonName = data.purchasePersonName;
    let productPurchasePersonName = data.productPurchasePersonName;
    if (data.productId) {
      try {
        const product = await this.mastersService.findProductById(data.productId);
        if (product) {
          if (product.purchasePersonId && !purchasePersonId) {
            purchasePersonId = product.purchasePersonId;
          }
          productPurchasePersonName = product.purchasePersonName || '';
        }
      } catch (e) {
        console.error('Failed to resolve purchase person from product master:', e);
      }
    }
    if (purchasePersonId) {
      try {
        const pUser = await this.userRepo.findOne({ where: { userId: purchasePersonId } as any });
        if (pUser) {
          purchasePersonName = pUser.name || '';
        }
      } catch (e) {
        console.error('Failed to resolve purchase person name:', e);
      }
    }

    const item = this.itemRepo.create({
      ...data,
      purchasePersonId,
      purchasePersonName,
      productPurchasePersonName,
      assignedPurchaseUserId: purchasePersonId || data.assignedPurchaseUserId,
      purchaseStatus: 'pending',
      enquiryOrderId: enquiry.enquiryOrderId,
    });
    const saved = await this.itemRepo.save(item);
    const savedItem: any = Array.isArray(saved) ? saved[0] : saved;

    if (enquiry.status !== EnquiryStatus.DRAFT && savedItem.assignedPurchaseUserId) {
      this.eventBus.emit(
        ERPEventType.PURCHASE_TASK_ASSIGNED,
        enquiry.companyId || 'system',
        savedItem.assignedPurchaseUserId,
        {
          enquiryId: enquiry.enquiryOrderId,
          enquiryNo: enquiry.enquiryOrderNo,
          productName: savedItem.productName || savedItem.manualProductName,
          assignedPurchaseUserId: savedItem.assignedPurchaseUserId,
        }
      );
    }

    return savedItem;
  }

  async getEnquiryItems(enquiryId: string, currentUser?: any) {
    const where: any = { enquiryOrderId: enquiryId };

    if (currentUser && !currentUser.isSuperAdmin) {
      const roles = (currentUser.roles || []).map((r: string) => r.toUpperCase());
      const isPurchaseUser = roles.includes('PURCHASE_USER') || roles.includes('PURCHASE_MANAGER');
      const isSalesOrAdmin = roles.includes('ADMIN') || roles.includes('MANAGEMENT') || roles.includes('SALES_MANAGER') || roles.includes('SALES_USER') || roles.includes('MIS') || roles.includes('MIS_USER');

      if (isPurchaseUser && !isSalesOrAdmin) {
        const currentUserId = currentUser.sub || currentUser.userId;
        where.assignedPurchaseUserId = currentUserId;
      }
    }

    return this.itemRepo.find({
      where,
      order: { createdAt: 'ASC' },
    });
  }

  async updateEnquiryItem(id: string, dto: UpdateEnquiryItemDto) {
    const item = await this.itemRepo.findOne({ where: { itemId: id } });
    if (!item) throw new NotFoundException('Item not found');

    const oldAssigneeId = item.assignedPurchaseUserId;
    const dtoAny = dto as any;

    // Auto-resolve names if purchasePersonId or assignedPurchaseUserId changes
    const newPersonId = dtoAny.purchasePersonId || dtoAny.assignedPurchaseUserId;
    if (newPersonId && newPersonId !== item.purchasePersonId) {
      dtoAny.purchasePersonId = newPersonId;
      dtoAny.assignedPurchaseUserId = newPersonId;
      try {
        const pUser = await this.userRepo.findOne({ where: { userId: newPersonId } as any });
        if (pUser) {
          dtoAny.purchasePersonName = pUser.name || '';
        }
      } catch (e) {
        console.error('Failed to resolve purchase person name during update:', e);
      }
    }

    Object.assign(item, dto);
    const saved = await this.itemRepo.save(item);

    if (saved.enquiryOrderId) {
      try {
        const enquiry = await this.findEnquiryById(saved.enquiryOrderId);
        if (
          enquiry &&
          enquiry.status !== EnquiryStatus.DRAFT &&
          saved.assignedPurchaseUserId &&
          saved.assignedPurchaseUserId !== oldAssigneeId
        ) {
          this.eventBus.emit(
            ERPEventType.PURCHASE_TASK_ASSIGNED,
            enquiry.companyId || 'system',
            saved.assignedPurchaseUserId,
            {
              enquiryId: enquiry.enquiryOrderId,
              enquiryNo: enquiry.enquiryOrderNo,
              productName: saved.productName || saved.manualProductName,
              assignedPurchaseUserId: saved.assignedPurchaseUserId,
            }
          );
        }
      } catch (err) {
        console.error('Failed to trigger notification on enquiry item update:', err);
      }
    }

    return saved;
  }

  async deleteEnquiryItem(id: string) {
    const item = await this.itemRepo.findOne({ where: { itemId: id } });
    if (!item) throw new NotFoundException('Item not found');
    await this.itemRepo.remove(item);
    return { deleted: true };
  }

  // ========== DOCUMENTS ==========
  async addDocument(enquiryId: string, data: any) {
    const enquiry = await this.findEnquiryById(enquiryId);
    const doc = this.documentRepo.create({
      ...data,
      enquiryOrderId: enquiry.enquiryOrderId,
    });
    return this.documentRepo.save(doc);
  }

  async getDocuments(enquiryId: string) {
    return this.documentRepo.find({ where: { enquiryOrderId: enquiryId } });
  }

  async deleteDocument(id: string) {
    const doc = await this.documentRepo.findOne({ where: { documentId: id } });
    if (!doc) throw new NotFoundException('Document not found');
    await this.documentRepo.remove(doc);
    return { deleted: true };
  }

  // ========== PUNCHING LOGS ==========
  async addPunchingLog(data: Partial<EnquiryPunchingLog>) {
    const log = this.punchingLogRepo.create(data);
    return this.punchingLogRepo.save(log);
  }

  async getPunchingLogs(enquiryId: string) {
    return this.punchingLogRepo.find({
      where: { enquiryOrderId: enquiryId },
      order: { punchedAt: 'DESC' },
    });
  }

  // ========== EMAIL REMINDERS ==========
  async addReminder(enquiryId: string, data: any) {
    const enquiry = await this.findEnquiryById(enquiryId);
    // Map frontend field names to entity field names
    const reminderData: any = {
      enquiryOrderId: enquiry.enquiryOrderId,
      reminderType: data.reminderType || data.type || 'follow_up',
      emailBody: data.message || data.emailBody || '',
      scheduledFor: data.reminderDate ? new Date(data.reminderDate) : data.scheduledFor,
      sentBy: data.sentBy,
    };
    const reminder = this.reminderRepo.create(reminderData);
    return this.reminderRepo.save(reminder);
  }

  async getReminders(enquiryId: string) {
    return this.reminderRepo.find({ where: { enquiryOrderId: enquiryId } });
  }

  async getPendingReminders() {
    // NOTE: No 'enquiryOrder' relation on reminder entity — avoid loading it
    return this.reminderRepo.find({
      where: { status: 'pending' as any },
      order: { createdAt: 'ASC' },
    });
  }

  async markReminderSent(id: string) {
    const reminder = await this.reminderRepo.findOne({ where: { reminderId: id } });
    if (!reminder) throw new NotFoundException('Reminder not found');
    reminder.status = ReminderStatus.SENT;
    reminder.sentAt = new Date();
    return this.reminderRepo.save(reminder);
  }

  async misReview(
    enquiryId: string,
    action: 'approve' | 'requote',
    remarks: string,
    userId: string,
    requoteItemIds?: string[],
  ) {
    const enquiry = await this.findEnquiryById(enquiryId);
    
    if (action === 'approve') {
      enquiry.status = EnquiryStatus.MIS_APPROVED;
      enquiry.misStatus = 'approved';
      enquiry.misReviewedBy = userId;
      enquiry.misReviewedAt = new Date();
      enquiry.misRemarks = remarks;
      await this.enquiryRepo.save(enquiry);
      
      await this.addPunchingLog({
        enquiryOrderId: enquiryId,
        oldStatus: EnquiryStatus.MIS_REVIEW,
        newStatus: EnquiryStatus.MIS_APPROVED,
        changedBy: userId,
        remarks: remarks || 'MIS Approved',
      });

      await this.updateEnquiryStatus(enquiryId, EnquiryStatus.RATE_CALCULATION, userId, 'Transitioned to Rate Calculation after MIS Approval');
      
      this.eventBus.emit(ERPEventType.ENQUIRY_STATUS_CHANGED, 'system', userId, {
        enquiryId,
        enquiryNo: enquiry.enquiryOrderNo,
        newStatus: EnquiryStatus.RATE_CALCULATION,
        message: 'MIS Approved. Rate Analysis required.',
      });
      
    } else if (action === 'requote') {
      enquiry.status = EnquiryStatus.MIS_REQUOTE_REQUIRED;
      enquiry.misStatus = 'requote_required';
      enquiry.misReviewedBy = userId;
      enquiry.misReviewedAt = new Date();
      enquiry.misRemarks = remarks;
      await this.enquiryRepo.save(enquiry);

      if (requoteItemIds && requoteItemIds.length > 0) {
        await this.itemRepo.update(
          { itemId: In(requoteItemIds) },
          { purchaseStatus: 'pending', purchaseReviewedAt: new Date() }
        );
      } else {
        await this.itemRepo.update(
          { enquiryOrderId: enquiryId },
          { purchaseStatus: 'pending', purchaseReviewedAt: new Date() }
        );
      }

      await this.addPunchingLog({
        enquiryOrderId: enquiryId,
        oldStatus: EnquiryStatus.MIS_REVIEW,
        newStatus: EnquiryStatus.MIS_REQUOTE_REQUIRED,
        changedBy: userId,
        remarks: remarks || 'MIS Requote Required',
      });

      this.eventBus.emit(ERPEventType.ENQUIRY_STATUS_CHANGED, 'system', userId, {
        enquiryId,
        enquiryNo: enquiry.enquiryOrderNo,
        newStatus: EnquiryStatus.MIS_REQUOTE_REQUIRED,
        message: `MIS Requote Required: ${remarks}`,
      });
    }

    return this.findEnquiryById(enquiryId);
  }

  // ========== STATISTICS ==========
  async getEnquiryStats() {
    const total = await this.enquiryRepo.count({ where: { deletedAt: null as any } });
    const byStatus = await this.enquiryRepo
      .createQueryBuilder('enquiry')
      .select('enquiry.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('enquiry.deletedAt IS NULL')
      .groupBy('enquiry.status')
      .getRawMany();

    return {
      total,
      byStatus: byStatus.reduce((acc, row) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
