import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, FindOptionsWhere, Between, EntityManager, In } from 'typeorm';
import {
  PurchaseOrder,
  PurchaseOrderItem,
  GoodsReceiptNote,
  GoodsReceiptNoteItem,
  PurchaseInvoice,
  PurchaseInvoiceItem,
  DebitNote,
  VendorMaster,
  POApproval,
  PurchaseOrderStatus,
  PurchaseInvoiceStatus,
} from './entities/purchase-order.entity';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  CreateGoodsReceiptNoteDto,
  CreatePurchaseInvoiceDto,
  CreateDebitNoteDto,
  CreateVendorMasterDto,
  UpdateVendorMasterDto,
  SubmitForApprovalDto,
  ApproveRejectDto,
  PaginationDto,
} from './dto/purchase-order.dto';
import { AccountsPayable, PaymentStatus } from '../financial/entities/accounting-voucher.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InventoryStock } from '../masters/entities/inventory-stock.entity';
import { Warehouse } from '../masters/entities/warehouse.entity';
import { StockMovement, MovementType } from '../inventory/entities/stock-movement.entity';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class PurchaseOrderService {
  private readonly logger = new Logger(PurchaseOrderService.name);

  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private readonly purchaseOrderItemRepository: Repository<PurchaseOrderItem>,
    @InjectRepository(GoodsReceiptNote)
    private readonly grnRepository: Repository<GoodsReceiptNote>,
    @InjectRepository(GoodsReceiptNoteItem)
    private readonly grnItemRepository: Repository<GoodsReceiptNoteItem>,
    @InjectRepository(PurchaseInvoice)
    private readonly purchaseInvoiceRepository: Repository<PurchaseInvoice>,
    @InjectRepository(PurchaseInvoiceItem)
    private readonly purchaseInvoiceItemRepository: Repository<PurchaseInvoiceItem>,
    @InjectRepository(DebitNote)
    private readonly debitNoteRepository: Repository<DebitNote>,
    @InjectRepository(VendorMaster)
    private readonly vendorMasterRepository: Repository<VendorMaster>,
    @InjectRepository(POApproval)
    private readonly poApprovalRepository: Repository<POApproval>,
    @InjectRepository(AccountsPayable)
    private readonly apRepository: Repository<AccountsPayable>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ============ PURCHASE ORDER OPERATIONS ============

  async createPurchaseOrder(dto: CreatePurchaseOrderDto, userId: string, companyId: string): Promise<PurchaseOrder> {
    const orderNumber = await this.generateNumber('PO', companyId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = queryRunner.manager.create(PurchaseOrder, {
        orderNumber,
        quoteId: dto.quoteId,
        salesEnquiryId: dto.salesEnquiryId,
        orderDate: dto.orderDate,
        expectedDeliveryDate: dto.expectedDeliveryDate,
        vendorId: dto.vendorId,
        vendorName: dto.vendorName,
        vendorCode: dto.vendorCode,
        vendorGstin: dto.vendorGstin,
        vendorType: dto.vendorType as any,
        vendorMobileNo: dto.vendorMobileNo,
        purchasePersonId: dto.purchasePersonId,
        purchasePerson: dto.purchasePerson,
        billingAddress: dto.billingAddress,
        billingStateCode: dto.billingStateCode,
        shippingAddress: dto.shippingAddress,
        shippingStateCode: dto.shippingStateCode,
        paymentTermsId: dto.paymentTermsId,
        currencyId: dto.currencyId,
        exchangeRate: dto.exchangeRate || 1,
        discountPercent: dto.discountPercent || 0,
        freightAmount: dto.freightAmount || 0,
        packingAmount: dto.packingAmount || 0,
        insuranceAmount: dto.insuranceAmount || 0,
        otherCharges: dto.otherCharges || 0,
        termsAndConditions: dto.termsAndConditions,
        notes: dto.notes,
        isImport: dto.isImport || false,
        countryOfOrigin: dto.countryOfOrigin,
        portOfEntry: dto.portOfEntry,
        poUrl: dto.poUrl,
        location: dto.location,
        freightTerm: dto.freightTerm,
        salesPersonId: dto.salesPersonId,
        salesPersonName: dto.salesPersonName,
        enquiryNo: dto.enquiryNo,
        soNo: dto.soNo,
        companyId,
        createdBy: userId,
      });

      const savedOrder = await queryRunner.manager.save(order);

      let subtotal = 0;
      let totalCgst = 0;
      let totalSgst = 0;
      let totalIgst = 0;

      for (let i = 0; i < dto.items.length; i++) {
        const itemDto = dto.items[i];
        const taxableAmount = itemDto.quantity * itemDto.unitPrice;
        const discountAmount = itemDto.discountAmount || (itemDto.discountPercent ? taxableAmount * itemDto.discountPercent / 100 : 0);
        const netAmount = taxableAmount - discountAmount;

        const gstRate = itemDto.gstRate || 18;
        const cgstAmount = netAmount * (gstRate / 2) / 100;
        const sgstAmount = netAmount * (gstRate / 2) / 100;
        const igstAmount = netAmount * gstRate / 100;
        const taxAmount = cgstAmount + sgstAmount;
        const totalAmount = netAmount + taxAmount;

        const item = queryRunner.manager.create(PurchaseOrderItem, {
          orderId: savedOrder.orderId,
          lineNumber: i + 1,
          productId: itemDto.productId,
          productName: itemDto.productName,
          productCode: itemDto.productCode,
          uniqueCode: itemDto.uniqueCode,
          sku: itemDto.sku,
          hsnCode: itemDto.hsnCode,
          uomName: itemDto.uomName,
          orderQty: itemDto.orderQty || itemDto.quantity,
          quantity: itemDto.quantity,
          balanceQty: itemDto.balanceQty || itemDto.quantity,
          unitPrice: itemDto.unitPrice,
          discountPercent: itemDto.discountPercent || 0,
          discountAmount,
          taxableAmount: netAmount,
          gstRate,
          cgstAmount,
          sgstAmount,
          igstAmount,
          taxAmount,
          totalAmount,
          description: itemDto.description,
          remark: itemDto.remark,
          enquiryNo: itemDto.enquiryNo,
          bestPrice: itemDto.bestPrice,
          quotedPrice: itemDto.quotedPrice,
          approvedBy: itemDto.approvedBy,
          jat: itemDto.jat,
          currentStock: itemDto.currentStock,
          noNeed: itemDto.noNeed || false,
          indent: itemDto.indent || false,
          leadTimeDays: itemDto.leadTimeDays,
          soNo: itemDto.soNo,
          merge: itemDto.merge,
          formula: itemDto.formula,
          location: itemDto.location,
          companyId,
          createdBy: userId,
        });

        await queryRunner.manager.save(item);

        subtotal += netAmount;
        totalCgst += cgstAmount;
        totalSgst += sgstAmount;
        totalIgst += igstAmount;
      }

      const discountAmount = subtotal * (dto.discountPercent || 0) / 100;
      const taxAmount = totalCgst + totalSgst + totalIgst;
      const otherCharges = (dto.freightAmount || 0) + (dto.packingAmount || 0) + (dto.insuranceAmount || 0) + (dto.otherCharges || 0);
      const totalAmount = subtotal - discountAmount + taxAmount + otherCharges;

      await queryRunner.manager.update(PurchaseOrder, savedOrder.orderId, {
        subtotal,
        discountAmount,
        cgstAmount: totalCgst,
        sgstAmount: totalSgst,
        igstAmount: totalIgst,
        taxAmount,
        totalAmount,
      });

      await queryRunner.commitTransaction();

      this.eventEmitter.emit('purchase-order.created', { orderId: savedOrder.orderId, companyId, userId });

    return this.findPurchaseOrderById(savedOrder.orderId, companyId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllPurchaseOrders(params: PaginationDto & { companyId?: string; status?: PurchaseOrderStatus; purchasePersonId?: string }): Promise<PaginatedResult<PurchaseOrder>> {
    const { page = 1, limit = 20, search, status, fromDate, toDate, companyId } = params;
    const purchasePersonId = (params as any).purchasePersonId;
    const skip = (page - 1) * limit;

    const queryBuilder = this.purchaseOrderRepository.createQueryBuilder('order');

    if (companyId) queryBuilder.andWhere('order.companyId = :companyId', { companyId });
    if (status) queryBuilder.andWhere('order.status = :status', { status });
    if (purchasePersonId) queryBuilder.andWhere('order.purchasePersonId = :purchasePersonId', { purchasePersonId });
    if (fromDate && toDate) {
      queryBuilder.andWhere('order.orderDate BETWEEN :fromDate AND :toDate', { fromDate: new Date(fromDate), toDate: new Date(toDate) });
    }
    if (search) {
      queryBuilder.andWhere(
        '(order.orderNumber ILIKE :search OR order.vendorName ILIKE :search OR order.purchasePerson ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [data, total] = await queryBuilder
      .orderBy('order.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOrdersByVendor(vendorId: string, companyId?: string): Promise<PurchaseOrder[]> {
    const queryBuilder = this.purchaseOrderRepository.createQueryBuilder('order');
    queryBuilder.andWhere('order.vendorId = :vendorId', { vendorId });
    if (companyId) queryBuilder.andWhere('order.companyId = :companyId', { companyId });
    queryBuilder.andWhere('order.isActive = true');
    queryBuilder.orderBy('order.createdAt', 'DESC');
    queryBuilder.select([
      'order.orderId',
      'order.orderNumber',
      'order.orderDate',
      'order.salesPersonId',
      'order.salesPersonName',
      'order.purchasePerson',
      'order.location',
      'order.freightTerm',
      'order.enquiryNo',
      'order.soNo',
      'order.status',
      'order.paymentTermsName',
    ]);
    return queryBuilder.getMany();
  }

  async findPurchaseOrderById(id: string, companyId?: string): Promise<PurchaseOrder> {
    const where: FindOptionsWhere<PurchaseOrder> = { orderId: id };
    if (companyId) where.companyId = companyId;

    const order = await this.purchaseOrderRepository.findOne({
      where,
      relations: ['items'],
    });
    if (!order) throw new NotFoundException(`Purchase order not found: ${id}`);

    // Backfill quotedPrice from linked purchase quote if not set
    if (order.items?.length > 0) {
      const needsBackfill = order.items.some(item => !item.quotedPrice || Number(item.quotedPrice) === 0);
      if (needsBackfill) {
        try {
          let quoteItems: any[] = [];

          if (order.quoteId) {
            quoteItems = await this.dataSource.query(
              `SELECT product_name, product_id, buying_price FROM purchase_quote_items WHERE quote_id = $1`,
              [order.quoteId],
            );
          }

          // Fallback: find quote via salesEnquiryId
          if (quoteItems.length === 0 && order.salesEnquiryId) {
            quoteItems = await this.dataSource.query(
              `SELECT qi.product_name, qi.product_id, qi.buying_price
               FROM purchase_quote_items qi
               INNER JOIN purchase_quotes q ON q.quote_id = qi.quote_id
               WHERE q.enquiry_order_id = $1`,
              [order.salesEnquiryId],
            );
          }

          if (quoteItems.length > 0) {
            const priceByProductId = new Map<string, number>();
            const priceByName = new Map<string, number>();
            for (const qi of quoteItems) {
              const bp = Number(qi.buying_price || 0);
              if (bp > 0) {
                if (qi.product_id) priceByProductId.set(qi.product_id, bp);
                if (qi.product_name) priceByName.set(qi.product_name, bp);
              }
            }
            for (const item of order.items) {
              if (!item.quotedPrice || Number(item.quotedPrice) === 0) {
                const bp = (item.productId && priceByProductId.get(item.productId)) || priceByName.get(item.productName);
                if (bp && bp > 0) {
                  item.quotedPrice = bp;
                  await this.purchaseOrderItemRepository.update(item.itemId, { quotedPrice: bp });
                }
              }
            }
          }
        } catch (err) {
          this.logger.warn(`Failed to backfill quotedPrice for PO ${id}: ${err.message}`);
        }
      }
    }

    return order;
  }

  async updatePurchaseOrder(id: string, dto: UpdatePurchaseOrderDto, companyId?: string): Promise<PurchaseOrder> {
    const order = await this.findPurchaseOrderById(id, companyId);
    if (order.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestException('Only draft orders can be updated');
    }

    await this.purchaseOrderRepository.update(id, {
      ...(dto.vendorId && { vendorId: dto.vendorId }),
      ...(dto.vendorName && { vendorName: dto.vendorName }),
      ...(dto.vendorCode !== undefined && { vendorCode: dto.vendorCode }),
      ...(dto.vendorGstin !== undefined && { vendorGstin: dto.vendorGstin }),
      expectedDeliveryDate: dto.expectedDeliveryDate,
      billingAddress: dto.billingAddress,
      shippingAddress: dto.shippingAddress,
      discountPercent: dto.discountPercent,
      freightAmount: dto.freightAmount,
      packingAmount: dto.packingAmount,
      insuranceAmount: dto.insuranceAmount,
      otherCharges: dto.otherCharges,
      termsAndConditions: dto.termsAndConditions,
      notes: dto.notes,
    });

    if (dto.items) {
      await this.purchaseOrderItemRepository.delete({ orderId: id });

      let subtotal = 0;
      let totalCgst = 0;
      let totalSgst = 0;
      let totalIgst = 0;

      for (let i = 0; i < dto.items.length; i++) {
        const itemDto = dto.items[i];
        const taxableAmount = itemDto.quantity * itemDto.unitPrice;
        const discountAmount = itemDto.discountAmount || (itemDto.discountPercent ? taxableAmount * itemDto.discountPercent / 100 : 0);
        const netAmount = taxableAmount - discountAmount;
        const gstRate = itemDto.gstRate || 18;
        const cgstAmount = netAmount * (gstRate / 2) / 100;
        const sgstAmount = netAmount * (gstRate / 2) / 100;
        const igstAmount = netAmount * gstRate / 100;
        const taxAmount = cgstAmount + sgstAmount;
        const totalAmount = netAmount + taxAmount;

        await this.purchaseOrderItemRepository.save({
          orderId: id,
          lineNumber: i + 1,
          productId: itemDto.productId,
          productName: itemDto.productName,
          productCode: itemDto.productCode,
          sku: itemDto.sku,
          hsnCode: itemDto.hsnCode,
          uomName: itemDto.uomName,
          quantity: itemDto.quantity,
          unitPrice: itemDto.unitPrice,
          discountPercent: itemDto.discountPercent || 0,
          discountAmount,
          taxableAmount: netAmount,
          gstRate,
          cgstAmount,
          sgstAmount,
          igstAmount,
          taxAmount,
          totalAmount,
          description: itemDto.description,
        });

        subtotal += netAmount;
        totalCgst += cgstAmount;
        totalSgst += sgstAmount;
        totalIgst += igstAmount;
      }

      const discountAmount = subtotal * (dto.discountPercent || 0) / 100;
      const taxAmount = totalCgst + totalSgst + totalIgst;
      const otherCharges = (dto.freightAmount || 0) + (dto.packingAmount || 0) + (dto.insuranceAmount || 0) + (dto.otherCharges || 0);
      const totalAmount = subtotal - discountAmount + taxAmount + otherCharges;

      await this.purchaseOrderRepository.update(id, { subtotal, discountAmount, cgstAmount: totalCgst, sgstAmount: totalSgst, igstAmount: totalIgst, taxAmount, totalAmount });
    }

    return this.findPurchaseOrderById(id, companyId);
  }

  async approvePurchaseOrder(id: string, userId: string, companyId?: string): Promise<PurchaseOrder> {
    const order = await this.findPurchaseOrderById(id, companyId);
    if (order.status !== PurchaseOrderStatus.DRAFT && order.status !== PurchaseOrderStatus.SUBMITTED && order.status !== PurchaseOrderStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Order cannot be approved in current status');
    }

    await this.purchaseOrderRepository.update(id, {
      status: PurchaseOrderStatus.APPROVED,
      approvedBy: userId,
      approvedAt: new Date(),
    });

    this.eventEmitter.emit('purchase-order.approved', { orderId: id, companyId: order.companyId, userId });

    return this.findPurchaseOrderById(id, companyId);
  }

  async cancelPurchaseOrder(id: string, companyId?: string): Promise<PurchaseOrder> {
    const order = await this.findPurchaseOrderById(id, companyId);
    if ([PurchaseOrderStatus.INVOICED, PurchaseOrderStatus.RECEIVED].includes(order.status)) {
      throw new BadRequestException('Cannot cancel received or invoiced orders');
    }

    await this.purchaseOrderRepository.update(id, { status: PurchaseOrderStatus.CANCELLED });
    return this.findPurchaseOrderById(id, companyId);
  }

  // ============ GOODS RECEIPT NOTE OPERATIONS ============

  async createGoodsReceiptNote(dto: CreateGoodsReceiptNoteDto, userId: string, companyId: string): Promise<GoodsReceiptNote> {
    const grnNumber = await this.generateNumber('GRN', companyId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await this.findPurchaseOrderById(dto.orderId, companyId);
      let defaultWarehouse: Warehouse | null = null;

      const grn = queryRunner.manager.create(GoodsReceiptNote, {
        grnNumber,
        orderId: dto.orderId,
        grnDate: dto.grnDate,
        vendorId: order.vendorId,
        vendorName: order.vendorName,
        vendorGstin: order.vendorGstin,
        invoiceNumber: dto.invoiceNumber,
        invoiceDate: dto.invoiceDate,
        lrNumber: dto.lrNumber,
        lrDate: dto.lrDate,
        vehicleNumber: dto.vehicleNumber,
        transporterName: dto.transporterName,
        eWayBillNumber: dto.eWayBillNumber,
        notes: dto.notes,
        companyId,
        createdBy: userId,
      });

      const savedGrn = await queryRunner.manager.save(grn);

      let totalAmount = 0;

      for (let i = 0; i < dto.items.length; i++) {
        const itemDto = dto.items[i];
        const orderItem = await queryRunner.manager.findOne(PurchaseOrderItem, {
          where: { itemId: itemDto.orderItemId, orderId: dto.orderId },
        });

        if (!orderItem) {
          throw new BadRequestException(`Purchase order item not found: ${itemDto.orderItemId}`);
        }

        const receivedQuantity = Number(itemDto.receivedQuantity || 0);
        const acceptedQuantity = Number(itemDto.acceptedQuantity ?? itemDto.receivedQuantity);
        const newReceivedQty = Number(orderItem.receivedQuantity || 0) + receivedQuantity;
        if (newReceivedQty > Number(orderItem.quantity)) {
          throw new BadRequestException(`Cannot receive more than ordered quantity for ${orderItem.productName}`);
        }

        const item = queryRunner.manager.create(GoodsReceiptNoteItem, {
          grnId: savedGrn.grnId,
          orderItemId: itemDto.orderItemId,
          lineNumber: i + 1,
          productId: orderItem.productId,
          productName: itemDto.productName || orderItem.productName,
          sku: itemDto.sku || orderItem.sku,
          hsnCode: itemDto.hsnCode || orderItem.hsnCode,
          uomName: itemDto.uomName || orderItem.uomName,
          orderedQuantity: itemDto.orderedQuantity,
          receivedQuantity,
          acceptedQuantity,
          rejectedQuantity: itemDto.rejectedQuantity || 0,
          unitPrice: itemDto.unitPrice,
          taxableAmount: receivedQuantity * itemDto.unitPrice,
          batchNumber: itemDto.batchNumber,
          expiryDate: itemDto.expiryDate ? new Date(itemDto.expiryDate) : null,
          remarks: itemDto.remarks,
          companyId,
          createdBy: userId,
        });

        await queryRunner.manager.save(item);

        await queryRunner.manager.update(PurchaseOrderItem, itemDto.orderItemId, { receivedQuantity: newReceivedQty });

        if (orderItem.productId && acceptedQuantity > 0) {
          defaultWarehouse ??= await this.resolveDefaultWarehouse(queryRunner.manager);
          await this.recordInventoryMovement(queryRunner.manager, {
            companyId,
            productId: orderItem.productId,
            sku: orderItem.sku || itemDto.sku || orderItem.productName,
            warehouseId: defaultWarehouse.id,
            movementType: MovementType.PURCHASE_RECEIPT,
            quantity: acceptedQuantity,
            userId,
            referenceType: 'goods_receipt_note',
            referenceId: savedGrn.grnId,
            referenceNo: grnNumber,
            batchNumber: itemDto.batchNumber,
            expiryDate: itemDto.expiryDate,
            unitCost: Number(itemDto.unitPrice || orderItem.unitPrice || 0),
            remarks: `GRN against purchase order ${order.orderNumber}`,
          });
        }

        totalAmount += receivedQuantity * itemDto.unitPrice;
      }

      await queryRunner.manager.update(GoodsReceiptNote, savedGrn.grnId, { totalAmount });

      // Update PO status
      await this.updatePoReceiptStatus(dto.orderId, companyId, queryRunner.manager);

      await queryRunner.commitTransaction();

      return this.findGrnById(savedGrn.grnId, companyId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async updatePoReceiptStatus(orderId: string, companyId: string, manager: EntityManager): Promise<void> {
    const order = await manager.findOne(PurchaseOrder, { where: { orderId, companyId } });
    if (!order) {
      throw new NotFoundException(`Purchase order not found: ${orderId}`);
    }
    const items = await manager.find(PurchaseOrderItem, { where: { orderId, companyId } });

    const allReceived = items.every(item => Number(item.receivedQuantity) >= Number(item.quantity));
    const someReceived = items.some(item => Number(item.receivedQuantity) > 0);

    let newStatus = order.status;
    if (allReceived) {
      newStatus = PurchaseOrderStatus.RECEIVED;
    } else if (someReceived) {
      newStatus = PurchaseOrderStatus.PARTIALLY_RECEIVED;
    }

    if (newStatus !== order.status) {
      await manager.update(PurchaseOrder, orderId, { status: newStatus });
    }
  }

  async findGrnById(id: string, companyId?: string): Promise<GoodsReceiptNote> {
    const where: FindOptionsWhere<GoodsReceiptNote> = { grnId: id };
    if (companyId) where.companyId = companyId;

    const grn = await this.grnRepository.findOne({
      where,
      relations: ['items'],
    });
    if (!grn) throw new NotFoundException(`GRN not found: ${id}`);
    return grn;
  }

  async findAllGrns(params: PaginationDto & { companyId?: string }): Promise<PaginatedResult<GoodsReceiptNote>> {
    const { page = 1, limit = 20, search, fromDate, toDate, companyId } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.grnRepository.createQueryBuilder('grn');

    if (companyId) queryBuilder.andWhere('grn.companyId = :companyId', { companyId });
    if (fromDate && toDate) {
      queryBuilder.andWhere('grn.grnDate BETWEEN :fromDate AND :toDate', { fromDate: new Date(fromDate), toDate: new Date(toDate) });
    }
    if (search) {
      queryBuilder.andWhere('(grn.grnNumber ILIKE :search OR grn.vendorName ILIKE :search)', { search: `%${search}%` });
    }

    const [data, total] = await queryBuilder
      .orderBy('grn.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ============ PURCHASE INVOICE OPERATIONS ============

  async createPurchaseInvoice(dto: CreatePurchaseInvoiceDto, userId: string, companyId: string): Promise<PurchaseInvoice> {
    const invoiceNumber = await this.generateNumber('PI', companyId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (dto.orderId) {
        await this.findPurchaseOrderById(dto.orderId, companyId);
      }

      if (dto.grnId) {
        const grn = await this.findGrnById(dto.grnId, companyId);
        if (dto.orderId && grn.orderId && grn.orderId !== dto.orderId) {
          throw new BadRequestException('GRN does not belong to the selected purchase order');
        }
      }

      const isInterState = dto.vendorStateCode !== dto.billingStateCode;

      const invoice = queryRunner.manager.create(PurchaseInvoice, {
        invoiceNumber,
        orderId: dto.orderId,
        grnId: dto.grnId,
        grnNumber: dto.grnId,
        invoiceDate: dto.invoiceDate,
        vendorId: dto.vendorId,
        vendorName: dto.vendorName,
        vendorCode: dto.vendorCode,
        vendorGstin: dto.vendorGstin,
        vendorAddress: dto.vendorAddress,
        vendorStateCode: dto.vendorStateCode,
        billingStateCode: dto.billingStateCode,
        reverseCharge: dto.reverseCharge || false,
        discountAmount: dto.discountAmount || 0,
        freightAmount: dto.freightAmount || 0,
        packingAmount: dto.packingAmount || 0,
        insuranceAmount: dto.insuranceAmount || 0,
        otherCharges: dto.otherCharges || 0,
        tdsAmount: dto.tdsAmount,
        termsAndConditions: dto.termsAndConditions,
        notes: dto.notes,
        eWayBillNumber: dto.eWayBillNumber,
        lrNumber: dto.lrNumber,
        vehicleNumber: dto.vehicleNumber,
        dueDate: dto.dueDate,
        companyId,
        createdBy: userId,
      });

      const savedInvoice = await queryRunner.manager.save(invoice);

      let subtotal = 0;
      let totalCgst = 0;
      let totalSgst = 0;
      let totalIgst = 0;

      for (let i = 0; i < dto.items.length; i++) {
        const itemDto = dto.items[i];
        const taxableAmount = itemDto.quantity * itemDto.unitPrice;
        const gstRate = 18;
        const cgstAmount = isInterState ? 0 : taxableAmount * (gstRate / 2) / 100;
        const sgstAmount = isInterState ? 0 : taxableAmount * (gstRate / 2) / 100;
        const igstAmount = isInterState ? taxableAmount * gstRate / 100 : 0;
        const totalAmount = taxableAmount + cgstAmount + sgstAmount + igstAmount;

        const item = queryRunner.manager.create(PurchaseInvoiceItem, {
          invoiceId: savedInvoice.invoiceId,
          orderItemId: itemDto.orderItemId,
          grnItemId: itemDto.grnItemId,
          lineNumber: i + 1,
          productName: itemDto.productName,
          sku: itemDto.sku,
          hsnCode: itemDto.hsnCode,
          uomName: itemDto.uomName,
          quantity: itemDto.quantity,
          unitPrice: itemDto.unitPrice,
          taxableAmount,
          gstRate,
          cgstAmount,
          sgstAmount,
          igstAmount,
          totalAmount,
          batchNumber: itemDto.batchNumber,
          expiryDate: itemDto.expiryDate ? new Date(itemDto.expiryDate) : null,
          companyId,
          createdBy: userId,
        });

        await queryRunner.manager.save(item);

        subtotal += taxableAmount;
        totalCgst += cgstAmount;
        totalSgst += sgstAmount;
        totalIgst += igstAmount;

        // Update invoiced quantity in PO item
        if (itemDto.orderItemId) {
          const orderItemWhere: FindOptionsWhere<PurchaseOrderItem> = { itemId: itemDto.orderItemId, companyId };
          if (dto.orderId) orderItemWhere.orderId = dto.orderId;

          const orderItem = await queryRunner.manager.findOne(PurchaseOrderItem, { where: orderItemWhere });
          if (!orderItem) {
            throw new BadRequestException(`Purchase order item not found: ${itemDto.orderItemId}`);
          }

          const newInvoicedQty = Number(orderItem.invoicedQuantity || 0) + Number(itemDto.quantity || 0);
          if (newInvoicedQty > Number(orderItem.quantity)) {
            throw new BadRequestException(`Cannot invoice more than ordered quantity for ${orderItem.productName}`);
          }

          await queryRunner.manager.update(PurchaseOrderItem, itemDto.orderItemId, { invoicedQuantity: newInvoicedQty });
        }

        if (itemDto.grnItemId) {
          const grnItemWhere: FindOptionsWhere<GoodsReceiptNoteItem> = {
            itemId: itemDto.grnItemId,
            companyId,
          };
          if (dto.grnId) grnItemWhere.grnId = dto.grnId;

          const grnItem = await queryRunner.manager.findOne(GoodsReceiptNoteItem, { where: grnItemWhere });
          if (!grnItem) {
            throw new BadRequestException(`GRN item not found: ${itemDto.grnItemId}`);
          }
        }
      }

      const taxAmount = totalCgst + totalSgst + totalIgst;
      const otherCharges = (dto.freightAmount || 0) + (dto.packingAmount || 0) + (dto.insuranceAmount || 0) + (dto.otherCharges || 0);
      const grossAmount = subtotal - (dto.discountAmount || 0) + taxAmount + otherCharges;
      const netAmount = grossAmount - (dto.tdsAmount || 0);

      await queryRunner.manager.update(PurchaseInvoice, savedInvoice.invoiceId, {
        subtotal,
        cgstAmount: totalCgst,
        sgstAmount: totalSgst,
        igstAmount: totalIgst,
        taxAmount,
        totalAmount: grossAmount,
        netAmount,
        status: PurchaseInvoiceStatus.VALIDATED,
      });

      // Create AP entry
      const apEntry = queryRunner.manager.create(AccountsPayable, {
        vendorId: dto.vendorId,
        vendorName: dto.vendorName,
        purchaseInvoiceId: savedInvoice.invoiceId,
        invoiceNumber,
        invoiceDate: dto.invoiceDate,
        dueDate: dto.dueDate,
        invoiceAmount: netAmount,
        taxAmount,
        tdsAmount: dto.tdsAmount || 0,
        pendingAmount: netAmount,
        status: PaymentStatus.PENDING,
        purchaseOrderId: dto.orderId,
        purchaseOrderNumber: dto.orderId,
        companyId,
        createdBy: userId,
      });
      await queryRunner.manager.save(apEntry);

      // Update PO status if all invoiced
      if (dto.orderId) {
        const allItems = await queryRunner.manager.find(PurchaseOrderItem, { where: { orderId: dto.orderId, companyId } });
        const allInvoiced = allItems.every(item => Number(item.invoicedQuantity) >= Number(item.quantity));
        if (allInvoiced) {
          await queryRunner.manager.update(PurchaseOrder, dto.orderId, { status: PurchaseOrderStatus.INVOICED });
        }
      }

      await queryRunner.commitTransaction();

      this.eventEmitter.emit('purchase-invoice.created', { invoiceId: savedInvoice.invoiceId, companyId, userId });

      return this.findPurchaseInvoiceById(savedInvoice.invoiceId, companyId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findPurchaseInvoiceById(id: string, companyId?: string): Promise<PurchaseInvoice> {
    const where: FindOptionsWhere<PurchaseInvoice> = { invoiceId: id };
    if (companyId) where.companyId = companyId;

    const invoice = await this.purchaseInvoiceRepository.findOne({
      where,
      relations: ['items'],
    });
    if (!invoice) throw new NotFoundException(`Purchase invoice not found: ${id}`);
    return invoice;
  }

  async findAllPurchaseInvoices(params: PaginationDto & { companyId?: string; status?: PurchaseInvoiceStatus }): Promise<PaginatedResult<PurchaseInvoice>> {
    const { page = 1, limit = 20, search, status, fromDate, toDate, companyId } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.purchaseInvoiceRepository.createQueryBuilder('invoice');

    if (companyId) queryBuilder.andWhere('invoice.companyId = :companyId', { companyId });
    if (status) queryBuilder.andWhere('invoice.status = :status', { status });
    if (fromDate && toDate) {
      queryBuilder.andWhere('invoice.invoiceDate BETWEEN :fromDate AND :toDate', { fromDate: new Date(fromDate), toDate: new Date(toDate) });
    }
    if (search) {
      queryBuilder.andWhere(
        '(invoice.invoiceNumber ILIKE :search OR invoice.vendorName ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [data, total] = await queryBuilder
      .orderBy('invoice.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ============ DEBIT NOTE OPERATIONS ============

  async createDebitNote(dto: CreateDebitNoteDto, userId: string, companyId: string): Promise<DebitNote> {
    const debitNoteNumber = await this.generateNumber('DN', companyId);

    const invoice = await this.findPurchaseInvoiceById(dto.invoiceId, companyId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const debitNote = queryRunner.manager.create(DebitNote, {
        debitNoteNumber,
        invoiceId: dto.invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        vendorId: dto.vendorId,
        vendorName: dto.vendorName,
        vendorGstin: dto.vendorGstin,
        debitNoteDate: dto.debitNoteDate,
        totalAmount: dto.totalAmount,
        taxAmount: dto.totalAmount * 18 / 118,
        reason: dto.reason,
        notes: dto.notes,
        companyId,
        createdBy: userId,
      });

      const savedDebitNote = await queryRunner.manager.save(debitNote);

      // Update AP entry
      await queryRunner.manager.update(AccountsPayable, { purchaseInvoiceId: dto.invoiceId }, {
        adjustmentAmount: () => `adjustment_amount + ${dto.totalAmount}`,
        pendingAmount: () => `pending_amount - ${dto.totalAmount}`,
      });

      await queryRunner.commitTransaction();

      return savedDebitNote;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ============ HELPER METHODS ============

  private async resolveDefaultWarehouse(manager: EntityManager): Promise<Warehouse> {
    const warehouse = await manager.getRepository(Warehouse)
      .createQueryBuilder('warehouse')
      .where('warehouse.isActive = :isActive', { isActive: true })
      .orderBy('warehouse.isDefault', 'DESC')
      .addOrderBy('warehouse.name', 'ASC')
      .getOne();

    if (!warehouse) {
      throw new BadRequestException('Cannot receive stock because no active warehouse exists');
    }

    return warehouse;
  }

  private async recordInventoryMovement(
    manager: EntityManager,
    params: {
      companyId: string;
      productId: string;
      sku?: string;
      warehouseId: string;
      movementType: MovementType;
      quantity: number;
      userId?: string;
      referenceType: string;
      referenceId: string;
      referenceNo: string;
      batchNumber?: string;
      expiryDate?: Date;
      unitCost?: number;
      remarks?: string;
    },
  ): Promise<void> {
    const quantity = Number(params.quantity || 0);
    if (quantity <= 0) return;

    const stockRepo = manager.getRepository(InventoryStock);
    const movementRepo = manager.getRepository(StockMovement);
    let stock = await stockRepo.findOne({
      where: { productId: params.productId, warehouseId: params.warehouseId },
    });

    const quantityBefore = Number(stock?.currentStock || 0);
    const quantityAfter = quantityBefore + quantity;

    if (stock) {
      stock.currentStock = quantityAfter;
      stock.lastMovementDate = new Date();
      await manager.save(InventoryStock, stock);
    } else {
      stock = stockRepo.create({
        companyId: params.companyId,
        productId: params.productId,
        sku: params.sku || params.productId,
        warehouseId: params.warehouseId,
        currentStock: quantityAfter,
        reorderLevel: 0,
        maxStockLevel: 1000,
        lastMovementDate: new Date(),
      });
      await manager.save(InventoryStock, stock);
    }

    await manager.save(StockMovement, movementRepo.create({
      companyId: params.companyId,
      productId: params.productId,
      warehouseId: params.warehouseId,
      movementType: params.movementType,
      quantity,
      quantityBefore,
      quantityAfter,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      referenceNo: params.referenceNo,
      batchNumber: params.batchNumber,
      expiryDate: params.expiryDate,
      unitCost: params.unitCost,
      remarks: params.remarks,
      performedBy: params.userId,
    }));
  }

  private async generateNumber(prefix: string, companyId: string): Promise<string> {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const fy = `${currentYear}-${nextYear.toString().slice(-2)}`;

    const repo = prefix === 'PO' ? this.purchaseOrderRepository :
                 prefix === 'GRN' ? this.grnRepository :
                 prefix === 'PI' ? this.purchaseInvoiceRepository :
                 this.debitNoteRepository;

    const where: any = {};
    if (companyId) {
      if (prefix === 'PO') where.companyId = companyId;
      if (prefix === 'GRN') where.companyId = companyId;
      if (prefix === 'PI') where.companyId = companyId;
      if (prefix === 'DN') where.companyId = companyId;
    }

    const lastRecord = await repo.find({
      where,
      order: { createdAt: 'DESC' },
    });

    let nextNumber = 1;
    if (lastRecord.length > 0) {
      const lastNumber = lastRecord[0][prefix === 'PO' ? 'orderNumber' :
                                      prefix === 'GRN' ? 'grnNumber' :
                                      prefix === 'PI' ? 'invoiceNumber' : 'debitNoteNumber'];
      const parts = lastNumber.split('/');
      const numPart = parts[parts.length - 1];
      nextNumber = parseInt(numPart, 10) + 1;
    }

    return `${prefix}/${fy}/${nextNumber.toString().padStart(5, '0')}`;
  }

  // ============ STATISTICS ============

  async getPurchaseStatistics(companyId: string) {
    const orders = await this.purchaseOrderRepository.find({ where: { companyId, isActive: true } });
    const totalOrders = orders.length;
    const totalOrderValue = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    const invoices = await this.purchaseInvoiceRepository.find({ where: { companyId, isActive: true } });
    const totalInvoices = invoices.length;
    const totalInvoiceValue = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
    const pendingInvoices = invoices.filter(inv => inv.status === PurchaseInvoiceStatus.VALIDATED || inv.status === PurchaseInvoiceStatus.APPROVED).length;

    const pendingApprovals = await this.poApprovalRepository.count({ where: { companyId, status: 'pending' } });
    const vendors = await this.vendorMasterRepository.count({ where: { companyId, isActive: true } });

    return {
      orders: { total: totalOrders, value: totalOrderValue },
      invoices: { total: totalInvoices, value: totalInvoiceValue, pending: pendingInvoices },
      pendingApprovals,
      activeVendors: vendors,
    };
  }

  // ============ VENDOR MASTER OPERATIONS ============

  async createVendor(dto: CreateVendorMasterDto, userId: string, companyId: string): Promise<VendorMaster> {
    // Generate vendor code if not provided
    let vendorCode = dto.vendorCode;
    if (!vendorCode) {
      const count = await this.vendorMasterRepository.count({ where: { companyId } });
      vendorCode = `V${(count + 1).toString().padStart(5, '0')}`;
    }

    const vendor = this.vendorMasterRepository.create({
      ...dto,
      vendorType: dto.vendorType as any,
      vendorCode,
      companyId,
      createdBy: userId,
    });

    return this.vendorMasterRepository.save(vendor as VendorMaster);
  }

  async updateVendor(id: string, dto: UpdateVendorMasterDto, userId: string, companyId?: string): Promise<VendorMaster> {
    const where: FindOptionsWhere<VendorMaster> = { vendorId: id };
    if (companyId) where.companyId = companyId;

    const vendor = await this.vendorMasterRepository.findOne({ where });
    if (!vendor) throw new NotFoundException(`Vendor not found: ${id}`);

    const updateData: any = { ...dto, updatedBy: userId };
    await this.vendorMasterRepository.update(id, updateData);
    return this.vendorMasterRepository.findOne({ where: { vendorId: id } });
  }

  async findAllVendors(params: PaginationDto & { companyId?: string; category?: string }): Promise<PaginatedResult<VendorMaster>> {
    const { page = 1, limit = 20, search, companyId } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.vendorMasterRepository.createQueryBuilder('vendor');

    if (companyId) queryBuilder.andWhere('vendor.companyId = :companyId', { companyId });
    queryBuilder.andWhere('vendor.isActive = :isActive', { isActive: true });

    if (params.category) queryBuilder.andWhere('vendor.category = :category', { category: params.category });

    if (search) {
      queryBuilder.andWhere(
        '(vendor.vendorName ILIKE :search OR vendor.vendorCode ILIKE :search OR vendor.gstin ILIKE :search OR vendor.contactPerson ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await queryBuilder
      .orderBy('vendor.vendorName', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findVendorById(id: string, companyId?: string): Promise<VendorMaster> {
    const where: FindOptionsWhere<VendorMaster> = { vendorId: id };
    if (companyId) where.companyId = companyId;

    const vendor = await this.vendorMasterRepository.findOne({ where });
    if (!vendor) throw new NotFoundException(`Vendor not found: ${id}`);
    return vendor;
  }

  async deleteVendor(id: string, companyId?: string): Promise<{ success: boolean }> {
    const where: FindOptionsWhere<VendorMaster> = { vendorId: id };
    if (companyId) where.companyId = companyId;

    const vendor = await this.vendorMasterRepository.findOne({ where });
    if (!vendor) throw new NotFoundException(`Vendor not found: ${id}`);

    await this.vendorMasterRepository.update(id, { isActive: false });
    return { success: true };
  }

  // ============ PO APPROVAL WORKFLOW ============

  async submitForApproval(dto: SubmitForApprovalDto, userId: string, userName: string, companyId: string): Promise<POApproval> {
    const order = await this.findPurchaseOrderById(dto.orderId, companyId);
    if (order.status !== PurchaseOrderStatus.DRAFT && order.status !== PurchaseOrderStatus.SUBMITTED) {
      throw new BadRequestException('Order can only be submitted for approval when in Draft or Submitted status');
    }

    // Check for existing pending approval
    const existing = await this.poApprovalRepository.findOne({
      where: { orderId: dto.orderId, companyId, status: 'pending' },
    });
    if (existing) {
      throw new BadRequestException('Order already has a pending approval request');
    }

    // Check if any item has unitPrice > quotedPrice (needs admin approval)
    const items = order.items || [];
    const needsApproval = items.some((item: any) => {
      const unitPrice = Number(item.unitPrice || 0);
      const quotedPrice = Number(item.quotedPrice || 0);
      return quotedPrice > 0 && unitPrice > quotedPrice;
    });

    const approval = this.poApprovalRepository.create({
      orderId: dto.orderId,
      orderNumber: order.orderNumber,
      vendorName: order.vendorName,
      totalAmount: Number(order.totalAmount || 0),
      requestedBy: userId,
      requestedByName: userName,
      requestedAt: new Date(),
      companyId,
      status: needsApproval ? 'pending' : 'approved',
      remarks: dto.remarks,
    });

    if (needsApproval) {
      await this.purchaseOrderRepository.update(dto.orderId, { status: PurchaseOrderStatus.PENDING_APPROVAL });
    } else {
      // Auto-approve: all items have unitPrice <= quotedPrice
      approval.approvedBy = 'auto';
      approval.approvedByName = 'Auto-Approved';
      approval.approvedAt = new Date();
      await this.purchaseOrderRepository.update(dto.orderId, {
        status: PurchaseOrderStatus.APPROVED,
        approvedBy: 'auto',
        approvedAt: new Date(),
      });
      this.eventEmitter.emit('purchase-order.approved', { orderId: dto.orderId, companyId, userId });
    }

    return this.poApprovalRepository.save(approval);
  }

  async approveOrder(approvalId: string, dto: ApproveRejectDto, userId: string, userName: string, companyId?: string): Promise<POApproval> {
    const where: FindOptionsWhere<POApproval> = { approvalId };
    if (companyId) where.companyId = companyId;

    const approval = await this.poApprovalRepository.findOne({ where });
    if (!approval) throw new NotFoundException(`Approval not found: ${approvalId}`);
    if (approval.status !== 'pending') throw new BadRequestException('Approval is not pending');

    approval.status = 'approved';
    approval.approvedBy = userId;
    approval.approvedByName = userName;
    approval.approvedAt = new Date();
    approval.remarks = dto.remarks || approval.remarks;

    await this.purchaseOrderRepository.update(approval.orderId, {
      status: PurchaseOrderStatus.APPROVED,
      approvedBy: userId,
      approvedAt: new Date(),
    });

    // Mark items where unitPrice > quotedPrice as approved by admin
    const orderItems = await this.purchaseOrderItemRepository.find({
      where: { orderId: approval.orderId },
    });
    for (const item of orderItems) {
      const unitPrice = Number(item.unitPrice || 0);
      const quotedPrice = Number(item.quotedPrice || 0);
      if (quotedPrice > 0 && unitPrice > quotedPrice) {
        await this.purchaseOrderItemRepository.update(item.itemId, { approvedBy: userName });
      }
    }

    this.eventEmitter.emit('purchase-order.approved', { orderId: approval.orderId, companyId: approval.companyId, userId });

    return this.poApprovalRepository.save(approval);
  }

  async rejectOrder(approvalId: string, dto: ApproveRejectDto, userId: string, userName: string, companyId?: string): Promise<POApproval> {
    const where: FindOptionsWhere<POApproval> = { approvalId };
    if (companyId) where.companyId = companyId;

    const approval = await this.poApprovalRepository.findOne({ where });
    if (!approval) throw new NotFoundException(`Approval not found: ${approvalId}`);
    if (approval.status !== 'pending') throw new BadRequestException('Approval is not pending');

    approval.status = 'rejected';
    approval.approvedBy = userId;
    approval.approvedByName = userName;
    approval.approvedAt = new Date();
    approval.rejectionReason = dto.rejectionReason;

    await this.purchaseOrderRepository.update(approval.orderId, {
      status: PurchaseOrderStatus.DRAFT,
    });

    return this.poApprovalRepository.save(approval);
  }

  async findAllApprovals(params: PaginationDto & { companyId?: string }): Promise<PaginatedResult<POApproval>> {
    const { page = 1, limit = 20, status, companyId } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.poApprovalRepository.createQueryBuilder('approval');

    if (companyId) queryBuilder.andWhere('approval.companyId = :companyId', { companyId });
    if (status) queryBuilder.andWhere('approval.status = :status', { status });

    const [data, total] = await queryBuilder
      .orderBy('approval.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ============ PO TRACKING / ORDER SHEET ============

  async getOrderSheet(params: PaginationDto & { companyId?: string; purchasePerson?: string }): Promise<PaginatedResult<PurchaseOrder>> {
    const { page = 1, limit = 50, search, fromDate, toDate, companyId } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.purchaseOrderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items');

    if (companyId) queryBuilder.andWhere('order.companyId = :companyId', { companyId });
    queryBuilder.andWhere('order.isActive = :isActive', { isActive: true });

    if (params.purchasePerson) {
      queryBuilder.andWhere('order.purchasePerson = :purchasePerson', { purchasePerson: params.purchasePerson });
    }

    if (fromDate && toDate) {
      queryBuilder.andWhere('order.orderDate BETWEEN :fromDate AND :toDate', { fromDate: new Date(fromDate), toDate: new Date(toDate) });
    }

    if (search) {
      queryBuilder.andWhere(
        '(order.orderNumber ILIKE :search OR order.vendorName ILIKE :search OR order.purchasePerson ILIKE :search OR order.soNo ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await queryBuilder
      .orderBy('order.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getPOTrackingFMS(companyId: string) {
    // PO Tracking FMS: summary of orders grouped by status with pending delivery tracking
    const orders = await this.purchaseOrderRepository.find({ where: { companyId, isActive: true } });

    const statusCounts: Record<string, number> = {};
    let totalValue = 0;
    let pendingDeliveryValue = 0;

    for (const order of orders) {
      const status = order.status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      totalValue += Number(order.totalAmount || 0);

      if ([PurchaseOrderStatus.APPROVED, PurchaseOrderStatus.PARTIALLY_RECEIVED].includes(status as PurchaseOrderStatus)) {
        pendingDeliveryValue += Number(order.totalAmount || 0);
      }
    }

    // Get items with balance qty
    const pendingItems = await this.purchaseOrderItemRepository
      .createQueryBuilder('item')
      .innerJoin('purchase_orders', 'order', 'order.orderId = item.orderId')
      .where('item.companyId = :companyId', { companyId })
      .andWhere('item.balanceQty > 0')
      .andWhere('order.status IN (:...statuses)', {
        statuses: [PurchaseOrderStatus.APPROVED, PurchaseOrderStatus.PARTIALLY_RECEIVED],
      })
      .select([
        'item.orderId',
        'item.productName',
        'item.uniqueCode',
        'item.quantity',
        'item.receivedQuantity',
        'item.balanceQty',
        'item.leadTimeDays',
        'item.soNo',
        'item.location',
      ])
      .getRawMany();

    return {
      summary: {
        totalOrders: orders.length,
        totalValue,
        pendingDeliveryValue,
        statusCounts,
      },
      pendingItems,
    };
  }

  async getDatabaseView(params: PaginationDto & { companyId?: string }): Promise<any> {
    // Database view: flat view of all PO line items matching the spreadsheet Database tab
    const { page = 1, limit = 100, search, fromDate, toDate, companyId } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.purchaseOrderItemRepository
      .createQueryBuilder('item')
      .innerJoinAndSelect('purchase_orders', 'order', 'order.orderId = item.orderId')
      .where('item.companyId = :companyId', { companyId });

    if (search) {
      queryBuilder.andWhere(
        '(order.orderNumber ILIKE :search OR order.vendorName ILIKE :search OR item.productName ILIKE :search OR item.uniqueCode ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (fromDate && toDate) {
      queryBuilder.andWhere('order.orderDate BETWEEN :fromDate AND :toDate', {
        fromDate: new Date(fromDate),
        toDate: new Date(toDate),
      });
    }

    const [data, total] = await queryBuilder
      .orderBy('order.createdAt', 'DESC')
      .addOrderBy('item.lineNumber', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ============ ACCOUNTANT REVIEW ============

  async getAccountantReviewList(params: {
    page?: number;
    limit?: number;
    search?: string;
    activityStatus?: string;
    companyId?: string;
  }) {
    const { page = 1, limit = 20, search, activityStatus, companyId } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.purchaseOrderRepository
      .createQueryBuilder('po')
      .where('po.status = :status', { status: PurchaseOrderStatus.APPROVED });

    if (companyId) {
      queryBuilder.andWhere('po.companyId = :companyId', { companyId });
    }

    if (search) {
      queryBuilder.andWhere(
        '(po.orderNumber ILIKE :search OR po.vendorName ILIKE :search OR po.soNo ILIKE :search OR po.purchasePerson ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (activityStatus === 'pending_act1') {
      queryBuilder.andWhere('po.act1ActualDate IS NULL');
    } else if (activityStatus === 'pending_act2') {
      queryBuilder.andWhere('po.act1ActualDate IS NOT NULL AND po.act2Approval IS NULL');
    } else if (activityStatus === 'approved') {
      queryBuilder.andWhere("po.act2Approval = 'Approved'");
    } else if (activityStatus === 'rejected') {
      queryBuilder.andWhere("po.act2Approval = 'Rejected'");
    }

    const [data, total] = await queryBuilder
      .orderBy('po.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const vendorIds = data.map(po => po.vendorId).filter(Boolean);
    let vendorMap = new Map<string, VendorMaster>();
    if (vendorIds.length > 0) {
      const vendors = await this.vendorMasterRepository.find({
        where: { vendorId: In(vendorIds) },
      });
      vendorMap = new Map(vendors.map(v => [v.vendorId, v]));
    }

    const enriched = data.map(po => {
      const vendor = po.vendorId ? vendorMap.get(po.vendorId) : null;
      return {
        ...po,
        vendorMobileNo: po.vendorMobileNo || vendor?.mobileNo || null,
        contactEmail: po.contactEmail || vendor?.email || null,
        paymentTermsName: po.paymentTermsName || vendor?.paymentTerms || null,
        vendorGstin: po.vendorGstin || vendor?.gstin || null,
        billingAddress: po.billingAddress || vendor?.address || null,
      };
    });

    return { data: enriched, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateActivity1(
    id: string,
    dto: {
      act1PlannedDate?: string;
      act1ActualDate?: string;
      act1PoLink?: string;
      act1PoNum?: string;
      act1PoDate?: string;
      act1Remarks?: string;
    },
    userId: string,
    companyId?: string,
  ) {
    const where: FindOptionsWhere<PurchaseOrder> = { orderId: id };
    if (companyId) where.companyId = companyId;
    const order = await this.purchaseOrderRepository.findOne({ where });
    if (!order) throw new NotFoundException('Purchase order not found');

    const update: any = { act1UpdatedBy: userId, act1UpdatedAt: new Date() };
    if (dto.act1PlannedDate !== undefined) update.act1PlannedDate = dto.act1PlannedDate ? new Date(dto.act1PlannedDate) : null;
    if (dto.act1ActualDate !== undefined) update.act1ActualDate = dto.act1ActualDate ? new Date(dto.act1ActualDate) : null;
    if (dto.act1PoLink !== undefined) update.act1PoLink = dto.act1PoLink;
    if (dto.act1PoNum !== undefined) update.act1PoNum = dto.act1PoNum;
    if (dto.act1PoDate !== undefined) update.act1PoDate = dto.act1PoDate ? new Date(dto.act1PoDate) : null;
    if (dto.act1Remarks !== undefined) update.act1Remarks = dto.act1Remarks;

    await this.purchaseOrderRepository.update(id, update);
    return this.purchaseOrderRepository.findOne({ where: { orderId: id } });
  }

  async updateActivity2(
    id: string,
    dto: {
      act2PlannedDate?: string;
      act2ActualDate?: string;
      act2Approval?: string;
      act2Remarks?: string;
    },
    userId: string,
    companyId?: string,
  ) {
    const where: FindOptionsWhere<PurchaseOrder> = { orderId: id };
    if (companyId) where.companyId = companyId;
    const order = await this.purchaseOrderRepository.findOne({ where });
    if (!order) throw new NotFoundException('Purchase order not found');

    const update: any = { act2UpdatedBy: userId, act2UpdatedAt: new Date() };
    if (dto.act2PlannedDate !== undefined) update.act2PlannedDate = dto.act2PlannedDate ? new Date(dto.act2PlannedDate) : null;
    if (dto.act2ActualDate !== undefined) update.act2ActualDate = dto.act2ActualDate ? new Date(dto.act2ActualDate) : null;
    if (dto.act2Approval !== undefined) update.act2Approval = dto.act2Approval;
    if (dto.act2Remarks !== undefined) update.act2Remarks = dto.act2Remarks;

    await this.purchaseOrderRepository.update(id, update);
    return this.purchaseOrderRepository.findOne({ where: { orderId: id } });
  }
}
