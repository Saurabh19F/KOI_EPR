import { Injectable, Logger, NotFoundException, BadRequestException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, FindOptionsWhere, Between, In, EntityManager } from 'typeorm';
import {
  SalesOrder,
  SalesOrderItem,
  DeliveryNote,
  DeliveryNoteItem,
  SalesInvoice,
  SalesInvoiceItem,
  CreditNote,
  SalesOrderStatus,
  InvoiceStatus,
} from './entities/sales-order.entity';
import {
  CreateSalesOrderDto,
  UpdateSalesOrderDto,
  CreateDeliveryNoteDto,
  CreateSalesInvoiceDto,
  CreateCreditNoteDto,
  PaginationDto,
} from './dto/sales-order.dto';
import { AccountsReceivable, PaymentStatus } from '../financial/entities/accounting-voucher.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InventoryStock } from '../masters/entities/inventory-stock.entity';
import { Warehouse } from '../masters/entities/warehouse.entity';
import { StockMovement, MovementType } from '../inventory/entities/stock-movement.entity';
import { NotificationsService } from '../notifications/notifications.service';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class SalesOrderService {
  private readonly logger = new Logger(SalesOrderService.name);

  constructor(
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepository: Repository<SalesOrder>,
    @InjectRepository(SalesOrderItem)
    private readonly salesOrderItemRepository: Repository<SalesOrderItem>,
    @InjectRepository(DeliveryNote)
    private readonly deliveryNoteRepository: Repository<DeliveryNote>,
    @InjectRepository(DeliveryNoteItem)
    private readonly deliveryNoteItemRepository: Repository<DeliveryNoteItem>,
    @InjectRepository(SalesInvoice)
    private readonly salesInvoiceRepository: Repository<SalesInvoice>,
    @InjectRepository(SalesInvoiceItem)
    private readonly salesInvoiceItemRepository: Repository<SalesInvoiceItem>,
    @InjectRepository(CreditNote)
    private readonly creditNoteRepository: Repository<CreditNote>,
    @InjectRepository(AccountsReceivable)
    private readonly arRepository: Repository<AccountsReceivable>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

  // ============ SALES ORDER OPERATIONS ============

  async createSalesOrder(dto: CreateSalesOrderDto, userId: string, companyId: string): Promise<SalesOrder> {
    const orderNumber = await this.generateNumber('SO', companyId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create order
      const order = queryRunner.manager.create(SalesOrder, {
        orderNumber,
        enquiryId: dto.enquiryId,
        quotationId: dto.quotationId,
        orderDate: dto.orderDate,
        expectedDeliveryDate: dto.expectedDeliveryDate,
        customerId: dto.customerId,
        customerName: dto.customerName,
        customerCode: dto.customerCode,
        contactPerson: dto.contactPerson,
        contactPhone: dto.contactPhone,
        contactEmail: dto.contactEmail,
        billingAddress: dto.billingAddress,
        billingCountry: dto.billingCountry,
        billingState: dto.billingState,
        billingStateCode: dto.billingStateCode,
        billingCity: dto.billingCity,
        billingPincode: dto.billingPincode,
        billingGstin: dto.billingGstin,
        shippingAddress: dto.shippingAddress,
        shippingCountry: dto.shippingCountry,
        shippingState: dto.shippingState,
        shippingStateCode: dto.shippingStateCode,
        shippingCity: dto.shippingCity,
        shippingPincode: dto.shippingPincode,
        shippingGstin: dto.shippingGstin,
        salesPersonId: dto.salesPersonId,
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
        poNumber: dto.poNumber,
        poDate: dto.poDate,
        isExport: dto.isExport || false,
        portOfLoading: dto.portOfLoading,
        portOfDischarge: dto.portOfDischarge,
        piNumber: dto.piNumber,
        containerSize: dto.containerSize,
        cbmRequired: dto.cbmRequired,
        companyId,
        createdBy: userId,
      });

      const savedOrder = await queryRunner.manager.save(order);

      // Create items and calculate totals
      let subtotal = 0;
      let totalCgst = 0;
      let totalSgst = 0;
      let totalIgst = 0;
      let totalCess = 0;

      for (let i = 0; i < dto.items.length; i++) {
        const itemDto = dto.items[i];
        const taxableAmount = itemDto.quantity * itemDto.unitPrice;
        const discountAmount = itemDto.discountAmount || (itemDto.discountPercent ? taxableAmount * itemDto.discountPercent / 100 : 0);
        const netAmount = taxableAmount - discountAmount;

        const gstRate = itemDto.gstRate || 18;
        const cgstRate = gstRate / 2;
        const cgstAmount = netAmount * cgstRate / 100;
        const sgstAmount = netAmount * cgstRate / 100;
        const igstAmount = netAmount * gstRate / 100;
        const taxAmount = cgstAmount + sgstAmount;
        const totalAmount = netAmount + taxAmount;
        const unitsPerCase = Number(itemDto.unitsPerCase || 1);
        const buyingBestLandingRate = itemDto.buyingBestLandingRate ?? itemDto.landingCost ?? itemDto.unitPrice;
        const perPcRateWithoutGst = itemDto.perPcRateWithoutGst ?? (gstRate ? Number(buyingBestLandingRate || 0) / (1 + gstRate / 100) : Number(buyingBestLandingRate || 0));
        const gstCost = itemDto.gstCost ?? Number(buyingBestLandingRate || 0) * gstRate / 100;
        const totalRatePerBox = itemDto.totalRatePerBox ?? Number(buyingBestLandingRate || 0) * unitsPerCase;
        const rateWithGstCost = itemDto.rateWithGstCost ?? (Number(buyingBestLandingRate || 0) + gstCost) * unitsPerCase;
        const ratePerCarton = itemDto.ratePerCarton ?? rateWithGstCost;
        const finalRate = itemDto.finalRate ?? itemDto.finalPriceInForeignCurrency ?? itemDto.unitPrice;

        const item = queryRunner.manager.create(SalesOrderItem, {
          orderId: savedOrder.orderId,
          lineNumber: i + 1,
          productId: itemDto.productId,
          productName: itemDto.productName,
          productCode: itemDto.productCode,
          categoryName: itemDto.categoryName,
          brandName: itemDto.brandName,
          sku: itemDto.sku,
          hsnCode: itemDto.hsnCode,
          uomName: itemDto.uomName,
          unitSize: itemDto.unitSize,
          unitBasis: itemDto.unitBasis,
          packingType: itemDto.packingType,
          location: itemDto.location,
          purchasePersonId: itemDto.purchasePersonId,
          purchasePersonName: itemDto.purchasePersonName,
          quantity: itemDto.quantity,
          unitsPerCase,
          unitPrice: itemDto.unitPrice,
          mrp: itemDto.mrp,
          buyingBestLandingRate,
          landingCost: itemDto.landingCost ?? buyingBestLandingRate,
          discountPercent: itemDto.discountPercent || 0,
          discountAmount,
          taxableAmount: netAmount,
          gstRate,
          cgstRate,
          sgstRate: cgstRate,
          cgstAmount,
          sgstAmount,
          igstAmount,
          taxAmount,
          totalAmount,
          perPcRateWithoutGst,
          otherCost: itemDto.otherCost,
          gstCost,
          totalRatePerBox,
          rateWithGstCost,
          finalPriceInForeignCurrency: itemDto.finalPriceInForeignCurrency ?? finalRate,
          ratePerCarton,
          cbmPerBox: itemDto.cbmPerBox,
          cbmCostPerBoxInSelectedCurrency: itemDto.cbmCostPerBoxInSelectedCurrency,
          haulage: itemDto.haulage,
          finalRate,
          shiftOrderNo: itemDto.shiftOrderNo,
          description: itemDto.description,
          enquiryNo: itemDto.enquiryNo,
          remarks: itemDto.remarks,
          currencyType: itemDto.currencyType,
          itemSelected: itemDto.itemSelected || false,
          itemStatus: itemDto.itemStatus,
          importedBy: itemDto.importedBy,
          poi: itemDto.poi,
          nutrition: itemDto.nutrition,
          ingredients: itemDto.ingredients,
          barcode: itemDto.barcode,
          batchNumber: itemDto.batchNumber,
          shelfLifeMonths: itemDto.shelfLifeMonths,
          mfgDate: itemDto.mfgDate,
          allergenAdvice: itemDto.allergenAdvice,
          netWeight: itemDto.netWeight,
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
      const afterDiscount = subtotal - discountAmount;
      const taxAmount = totalCgst + totalSgst + totalIgst;
      const otherCharges = (dto.freightAmount || 0) + (dto.packingAmount || 0) + (dto.insuranceAmount || 0) + (dto.otherCharges || 0);
      const roundOff = Math.round(afterDiscount + taxAmount + otherCharges) - (afterDiscount + taxAmount + otherCharges);
      const totalAmount = afterDiscount + taxAmount + otherCharges + roundOff;

      // Update order with totals
      await queryRunner.manager.update(SalesOrder, savedOrder.orderId, {
        subtotal,
        discountAmount,
        cgstAmount: totalCgst,
        sgstAmount: totalSgst,
        igstAmount: totalIgst,
        taxAmount,
        totalAmount,
        roundOff,
      });

      await queryRunner.commitTransaction();

      // Emit event
      this.eventEmitter.emit('sales-order.created', { orderId: savedOrder.orderId, companyId, userId });

      return this.findSalesOrderById(savedOrder.orderId, companyId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllSalesOrders(params: PaginationDto & { companyId?: string; status?: SalesOrderStatus }): Promise<PaginatedResult<SalesOrder>> {
    const { page = 1, limit = 20, search, status, fromDate, toDate, companyId } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.salesOrderRepository.createQueryBuilder('order');

    if (companyId) queryBuilder.andWhere('order.companyId = :companyId', { companyId });
    if (status) queryBuilder.andWhere('order.status = :status', { status });
    if (fromDate && toDate) {
      queryBuilder.andWhere('order.orderDate BETWEEN :fromDate AND :toDate', { fromDate: new Date(fromDate), toDate: new Date(toDate) });
    }
    if (search) {
      queryBuilder.andWhere(
        '(order.orderNumber ILIKE :search OR order.customerName ILIKE :search OR order.poNumber ILIKE :search)',
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

  async findSalesOrderById(id: string, companyId?: string): Promise<SalesOrder> {
    const where: FindOptionsWhere<SalesOrder> = { orderId: id };
    if (companyId) where.companyId = companyId;

    const order = await this.salesOrderRepository.findOne({
      where,
    });
    if (!order) throw new NotFoundException(`Sales order not found: ${id}`);
    order.items = await this.salesOrderItemRepository.find({
      where: { orderId: order.orderId, ...(companyId ? { companyId } : {}) },
      order: { lineNumber: 'ASC' },
    });
    return order;
  }

  async findSalesOrderByNumber(orderNumber: string, companyId?: string): Promise<SalesOrder> {
    const where: FindOptionsWhere<SalesOrder> = { orderNumber };
    if (companyId) where.companyId = companyId;

    const order = await this.salesOrderRepository.findOne({
      where,
    });
    if (!order) throw new NotFoundException(`Sales order not found: ${orderNumber}`);
    order.items = await this.salesOrderItemRepository.find({
      where: { orderId: order.orderId, ...(companyId ? { companyId } : {}) },
      order: { lineNumber: 'ASC' },
    });
    return order;
  }

  async findSalesOrderByEnquiryId(enquiryId: string, companyId?: string): Promise<SalesOrder | null> {
    const qb = this.salesOrderRepository.createQueryBuilder('so')
      .where('so.enquiry_id = :enquiryId', { enquiryId: String(enquiryId) });
    if (companyId) qb.andWhere('so.company_id = :companyId', { companyId });

    const order = await qb.getOne();
    if (order) {
      order.items = await this.salesOrderItemRepository.find({ where: { orderId: order.orderId } });
    }
    return order;
  }

  async updateSalesOrder(id: string, dto: UpdateSalesOrderDto, companyId?: string): Promise<SalesOrder> {
    const order = await this.findSalesOrderById(id, companyId);
    if (order.status !== SalesOrderStatus.DRAFT) {
      throw new BadRequestException('Only draft orders can be updated');
    }

    await this.salesOrderRepository.update(id, {
      expectedDeliveryDate: dto.expectedDeliveryDate,
      contactPerson: dto.contactPerson,
      contactPhone: dto.contactPhone,
      contactEmail: dto.contactEmail,
      billingAddress: dto.billingAddress,
      shippingAddress: dto.shippingAddress,
      discountPercent: dto.discountPercent,
      freightAmount: dto.freightAmount,
      packingAmount: dto.packingAmount,
      insuranceAmount: dto.insuranceAmount,
      otherCharges: dto.otherCharges,
      termsAndConditions: dto.termsAndConditions,
      notes: dto.notes,
      poNumber: dto.poNumber,
      isExport: dto.isExport,
      piNumber: dto.piNumber,
      containerSize: dto.containerSize,
      cbmRequired: dto.cbmRequired,
    });

    if (dto.items) {
      await this.salesOrderItemRepository.delete({ orderId: id });

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

        await this.salesOrderItemRepository.save({
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
          cgstRate: gstRate / 2,
          cgstAmount,
          sgstAmount,
          igstAmount,
          taxAmount,
          totalAmount,
          description: itemDto.description,
          shiftOrderNo: itemDto.shiftOrderNo,
          enquiryNo: itemDto.enquiryNo,
          remarks: itemDto.remarks,
          currencyType: itemDto.currencyType,
          itemSelected: itemDto.itemSelected || false,
          itemStatus: itemDto.itemStatus,
          importedBy: itemDto.importedBy,
          poi: itemDto.poi,
          nutrition: itemDto.nutrition,
          ingredients: itemDto.ingredients,
          barcode: itemDto.barcode,
          batchNumber: itemDto.batchNumber,
          shelfLifeMonths: itemDto.shelfLifeMonths,
          mfgDate: itemDto.mfgDate,
          allergenAdvice: itemDto.allergenAdvice,
          netWeight: itemDto.netWeight,
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

      await this.salesOrderRepository.update(id, {
        subtotal,
        discountAmount,
        cgstAmount: totalCgst,
        sgstAmount: totalSgst,
        igstAmount: totalIgst,
        taxAmount,
        totalAmount,
      });
    }

    return this.findSalesOrderById(id, companyId);
  }

  async confirmSalesOrder(id: string, userId: string, companyId?: string): Promise<SalesOrder> {
    const order = await this.findSalesOrderById(id, companyId);
    if (order.status !== SalesOrderStatus.DRAFT) {
      throw new BadRequestException('Only draft orders can be confirmed');
    }

    await this.salesOrderRepository.update(id, {
      status: SalesOrderStatus.CONFIRMED,
      approvedBy: userId,
      approvedAt: new Date(),
    });

    this.eventEmitter.emit('sales-order.confirmed', { orderId: id, companyId: order.companyId, userId });

    const confirmed = await this.findSalesOrderById(id, companyId);

    if (confirmed.contactEmail) {
      this.sendQuotationEmail(confirmed, false).catch(err =>
        this.logger.error(`Failed to send quotation email: ${err.message}`),
      );
    }

    return confirmed;
  }

  async cancelSalesOrder(id: string, userId: string, companyId?: string): Promise<SalesOrder> {
    const order = await this.findSalesOrderById(id, companyId);
    if ([SalesOrderStatus.INVOICED, SalesOrderStatus.DELIVERED].includes(order.status)) {
      throw new BadRequestException('Cannot cancel invoiced or delivered orders');
    }

    await this.salesOrderRepository.update(id, {
      status: SalesOrderStatus.CANCELLED,
    });

    this.eventEmitter.emit('sales-order.cancelled', { orderId: id, companyId: order.companyId, userId });

    return this.findSalesOrderById(id, companyId);
  }

  // ============ DELIVERY NOTE OPERATIONS ============

  async createDeliveryNote(dto: CreateDeliveryNoteDto, userId: string, companyId: string): Promise<DeliveryNote> {
    const noteNumber = await this.generateNumber('DN', companyId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await this.findSalesOrderById(dto.orderId, companyId);

      const note = queryRunner.manager.create(DeliveryNote, {
        noteNumber,
        orderId: dto.orderId,
        noteDate: dto.noteDate,
        customerId: order.customerId,
        customerName: order.customerName,
        customerGstin: order.billingGstin,
        billingAddress: order.billingAddress,
        shippingAddress: order.shippingAddress,
        vehicleNumber: dto.vehicleNumber,
        transporterName: dto.transporterName,
        lrNumber: dto.lrNumber,
        lrDate: dto.lrDate,
        eWayBillNumber: dto.eWayBillNumber,
        notes: dto.notes,
        companyId,
        createdBy: userId,
      });

      const savedNote = await queryRunner.manager.save(note);

      let totalAmount = 0;
      let defaultWarehouse: Warehouse | null = null;

      for (let i = 0; i < dto.items.length; i++) {
        const itemDto = dto.items[i];
        const orderItem = await queryRunner.manager.findOne(SalesOrderItem, {
          where: { itemId: itemDto.orderItemId, orderId: dto.orderId },
        });

        if (!orderItem) {
          throw new BadRequestException(`Sales order item not found: ${itemDto.orderItemId}`);
        }

        const shippedQuantity = Number(itemDto.quantity || 0);
        const newShippedQty = Number(orderItem.shippedQuantity || 0) + shippedQuantity;
        if (newShippedQty > Number(orderItem.quantity)) {
          throw new BadRequestException(`Cannot ship more than ordered quantity for ${orderItem.productName}`);
        }

        const item = queryRunner.manager.create(DeliveryNoteItem, {
          noteId: savedNote.noteId,
          orderItemId: itemDto.orderItemId,
          lineNumber: i + 1,
          productId: orderItem.productId,
          productName: itemDto.productName || orderItem.productName,
          sku: itemDto.sku || orderItem.sku,
          hsnCode: itemDto.hsnCode || orderItem.hsnCode,
          uomName: itemDto.uomName || orderItem.uomName,
          quantity: shippedQuantity,
          batchNumber: itemDto.batchNumber,
          expiryDate: itemDto.expiryDate,
          companyId,
          createdBy: userId,
        });

        await queryRunner.manager.save(item);

        await queryRunner.manager.update(SalesOrderItem, itemDto.orderItemId, { shippedQuantity: newShippedQty });
        totalAmount += Number(orderItem.unitPrice) * shippedQuantity;

        if (orderItem.productId) {
          defaultWarehouse ??= await this.resolveDefaultWarehouse(queryRunner.manager);
          await this.recordInventoryMovement(queryRunner.manager, {
            companyId,
            productId: orderItem.productId,
            sku: orderItem.sku || itemDto.sku || orderItem.productName,
            warehouseId: defaultWarehouse.id,
            movementType: MovementType.SALES_ISSUE,
            quantity: shippedQuantity,
            userId,
            referenceType: 'delivery_note',
            referenceId: savedNote.noteId,
            referenceNo: noteNumber,
            batchNumber: itemDto.batchNumber,
            expiryDate: itemDto.expiryDate,
            unitCost: Number(orderItem.unitPrice || 0),
            remarks: `Dispatch against sales order ${order.orderNumber}`,
          });
        }
      }

      await queryRunner.manager.update(DeliveryNote, savedNote.noteId, { totalAmount });

      // Update order status
      await this.updateOrderShipmentStatus(dto.orderId, companyId, queryRunner.manager);

      await queryRunner.commitTransaction();

      return this.findDeliveryNoteById(savedNote.noteId, companyId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async updateOrderShipmentStatus(orderId: string, companyId: string, manager: EntityManager): Promise<void> {
    const order = await manager.findOne(SalesOrder, { where: { orderId, companyId } });
    if (!order) {
      throw new NotFoundException(`Sales order not found: ${orderId}`);
    }
    const items = await manager.find(SalesOrderItem, { where: { orderId, companyId } });

    const allShipped = items.every(item => Number(item.shippedQuantity) >= Number(item.quantity));
    const someShipped = items.some(item => Number(item.shippedQuantity) > 0);

    let newStatus = order.status;
    if (allShipped) {
      newStatus = SalesOrderStatus.SHIPPED;
    } else if (someShipped) {
      newStatus = SalesOrderStatus.PARTIALLY_SHIPPED;
    }

    if (newStatus !== order.status) {
      await manager.update(SalesOrder, orderId, { status: newStatus });
    }
  }

  async findDeliveryNoteById(id: string, companyId?: string): Promise<DeliveryNote> {
    const where: FindOptionsWhere<DeliveryNote> = { noteId: id };
    if (companyId) where.companyId = companyId;

    const note = await this.deliveryNoteRepository.findOne({
      where,
    });
    if (!note) throw new NotFoundException(`Delivery note not found: ${id}`);
    note.items = await this.deliveryNoteItemRepository.find({
      where: { noteId: note.noteId, ...(companyId ? { companyId } : {}) },
      order: { lineNumber: 'ASC' },
    });
    return note;
  }

  async findAllDeliveryNotes(params: PaginationDto & { companyId?: string }): Promise<PaginatedResult<DeliveryNote>> {
    const { page = 1, limit = 20, search, fromDate, toDate, companyId } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.deliveryNoteRepository.createQueryBuilder('note');

    if (companyId) queryBuilder.andWhere('note.companyId = :companyId', { companyId });
    if (fromDate && toDate) {
      queryBuilder.andWhere('note.noteDate BETWEEN :fromDate AND :toDate', { fromDate: new Date(fromDate), toDate: new Date(toDate) });
    }
    if (search) {
      queryBuilder.andWhere('(note.noteNumber ILIKE :search OR note.customerName ILIKE :search)', { search: `%${search}%` });
    }

    const [data, total] = await queryBuilder
      .orderBy('note.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ============ SALES INVOICE OPERATIONS ============

  async createSalesInvoice(dto: CreateSalesInvoiceDto, userId: string, companyId: string): Promise<SalesInvoice> {
    const invoiceNumber = await this.generateNumber('INV', companyId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = dto.orderId ? await this.findSalesOrderById(dto.orderId, companyId) : null;
      const deliveryNote = dto.deliveryNoteId ? await this.findDeliveryNoteById(dto.deliveryNoteId, companyId) : null;

      if (deliveryNote?.orderId && order?.orderId && deliveryNote.orderId !== order.orderId) {
        throw new BadRequestException('Delivery note does not belong to the selected sales order');
      }

      // Determine IGST vs CGST/SGST based on billing/shipping state
      const isInterState = dto.billingStateCode !== dto.shippingStateCode;
      const invoiceType = dto.invoiceType || (isInterState ? 'B2B' : 'B2B');

      const invoice = queryRunner.manager.create(SalesInvoice, {
        invoiceNumber,
        orderId: dto.orderId,
        deliveryNoteId: dto.deliveryNoteId,
        deliveryNoteNumber: dto.deliveryNoteId,
        invoiceDate: dto.invoiceDate,
        dueDate: dto.dueDate,
        customerId: dto.customerId,
        customerName: dto.customerName,
        customerCode: dto.customerCode,
        customerGstin: dto.customerGstin,
        billingAddress: dto.billingAddress,
        billingStateCode: dto.billingStateCode,
        shippingAddress: dto.shippingAddress,
        shippingStateCode: dto.shippingStateCode,
        reverseCharge: dto.reverseCharge || false,
        invoiceType,
        discountAmount: dto.discountAmount || 0,
        freightAmount: dto.freightAmount || 0,
        packingAmount: dto.packingAmount || 0,
        insuranceAmount: dto.insuranceAmount || 0,
        otherCharges: dto.otherCharges || 0,
        termsAndConditions: dto.termsAndConditions,
        notes: dto.notes,
        eWayBillNumber: dto.eWayBillNumber,
        vehicleNumber: dto.vehicleNumber,
        transporterName: dto.transporterName,
        distance: dto.distance,
        companyId,
        createdBy: userId,
      });

      const savedInvoice = await queryRunner.manager.save(invoice);

      let subtotal = 0;
      let totalCgst = 0;
      let totalSgst = 0;
      let totalIgst = 0;
      let totalCess = 0;

      for (let i = 0; i < dto.items.length; i++) {
        const itemDto = dto.items[i];
        const taxableAmount = itemDto.quantity * itemDto.unitPrice;
        const discountAmount = itemDto.discountAmount || (itemDto.discountPercent ? taxableAmount * itemDto.discountPercent / 100 : 0);
        const netAmount = taxableAmount - discountAmount;

        // Default GST rate
        const gstRate = 18;
        const cgstRate = isInterState ? 0 : gstRate / 2;
        const cgstAmount = netAmount * cgstRate / 100;
        const sgstAmount = netAmount * cgstRate / 100;
        const igstAmount = isInterState ? netAmount * gstRate / 100 : 0;
        const taxAmount = cgstAmount + sgstAmount + igstAmount;
        const totalAmount = netAmount + taxAmount;

        const item = queryRunner.manager.create(SalesInvoiceItem, {
          invoiceId: savedInvoice.invoiceId,
          orderItemId: itemDto.orderItemId,
          deliveryNoteItemId: itemDto.deliveryNoteItemId,
          lineNumber: i + 1,
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
          totalAmount,
          batchNumber: itemDto.batchNumber,
          expiryDate: itemDto.expiryDate ? new Date(itemDto.expiryDate) : null,
          serialNumbers: itemDto.serialNumbers ? JSON.stringify(itemDto.serialNumbers) : null,
          companyId,
          createdBy: userId,
        });

        await queryRunner.manager.save(item);

        subtotal += netAmount;
        totalCgst += cgstAmount;
        totalSgst += sgstAmount;
        totalIgst += igstAmount;

        // Update invoiced quantity in order item
        if (itemDto.orderItemId) {
          const orderItemWhere: FindOptionsWhere<SalesOrderItem> = { itemId: itemDto.orderItemId, companyId };
          if (dto.orderId) orderItemWhere.orderId = dto.orderId;

          const orderItem = await queryRunner.manager.findOne(SalesOrderItem, { where: orderItemWhere });
          if (!orderItem) {
            throw new BadRequestException(`Sales order item not found: ${itemDto.orderItemId}`);
          }

          const newInvoicedQty = Number(orderItem.invoicedQuantity || 0) + Number(itemDto.quantity || 0);
          if (newInvoicedQty > Number(orderItem.quantity)) {
            throw new BadRequestException(`Cannot invoice more than ordered quantity for ${orderItem.productName}`);
          }

          await queryRunner.manager.update(SalesOrderItem, itemDto.orderItemId, { invoicedQuantity: newInvoicedQty });
        }

        if (itemDto.deliveryNoteItemId) {
          const deliveryNoteItemWhere: FindOptionsWhere<DeliveryNoteItem> = {
            itemId: itemDto.deliveryNoteItemId,
            companyId,
          };
          if (dto.deliveryNoteId) deliveryNoteItemWhere.noteId = dto.deliveryNoteId;

          const deliveryNoteItem = await queryRunner.manager.findOne(DeliveryNoteItem, { where: deliveryNoteItemWhere });
          if (!deliveryNoteItem) {
            throw new BadRequestException(`Delivery note item not found: ${itemDto.deliveryNoteItemId}`);
          }
        }
      }

      const discountAmount = subtotal * (dto.discountAmount || 0) / 100;
      const taxAmount = totalCgst + totalSgst + totalIgst;
      const otherCharges = (dto.freightAmount || 0) + (dto.packingAmount || 0) + (dto.insuranceAmount || 0) + (dto.otherCharges || 0);
      const roundOff = Math.round(subtotal - discountAmount + taxAmount + otherCharges) - (subtotal - discountAmount + taxAmount + otherCharges);
      const totalAmount = subtotal - discountAmount + taxAmount + otherCharges + roundOff;

      await queryRunner.manager.update(SalesInvoice, savedInvoice.invoiceId, {
        subtotal,
        discountAmount,
        cgstAmount: totalCgst,
        sgstAmount: totalSgst,
        igstAmount: totalIgst,
        taxAmount,
        totalAmount,
        roundOff,
        status: InvoiceStatus.VALIDATED,
      });

      // Create Accounts Receivable entry
      const arEntry = queryRunner.manager.create(AccountsReceivable, {
        customerId: dto.customerId,
        customerName: dto.customerName,
        salesInvoiceId: savedInvoice.invoiceId,
        invoiceNumber,
        invoiceDate: dto.invoiceDate,
        dueDate: dto.dueDate,
        invoiceAmount: totalAmount,
        taxAmount,
        pendingAmount: totalAmount,
        status: PaymentStatus.PENDING,
        companyId,
        createdBy: userId,
      });
      await queryRunner.manager.save(arEntry);

      // Update order status if linked
      if (dto.orderId) {
        const allItems = await queryRunner.manager.find(SalesOrderItem, { where: { orderId: dto.orderId, companyId } });
        const allInvoiced = allItems.every(item => Number(item.invoicedQuantity) >= Number(item.quantity));
        if (allInvoiced) {
          await queryRunner.manager.update(SalesOrder, dto.orderId, { status: SalesOrderStatus.INVOICED });
        }
      }

      await queryRunner.commitTransaction();

      this.eventEmitter.emit('sales-invoice.created', { invoiceId: savedInvoice.invoiceId, companyId, userId });

      return this.findSalesInvoiceById(savedInvoice.invoiceId, companyId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findSalesInvoiceById(id: string, companyId?: string): Promise<SalesInvoice> {
    const where: FindOptionsWhere<SalesInvoice> = { invoiceId: id };
    if (companyId) where.companyId = companyId;

    const invoice = await this.salesInvoiceRepository.findOne({
      where,
    });
    if (!invoice) throw new NotFoundException(`Sales invoice not found: ${id}`);
    invoice.items = await this.salesInvoiceItemRepository.find({
      where: { invoiceId: invoice.invoiceId, ...(companyId ? { companyId } : {}) },
      order: { lineNumber: 'ASC' },
    });
    return invoice;
  }

  async findAllSalesInvoices(params: PaginationDto & { companyId?: string; status?: InvoiceStatus }): Promise<PaginatedResult<SalesInvoice>> {
    const { page = 1, limit = 20, search, status, fromDate, toDate, companyId } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.salesInvoiceRepository.createQueryBuilder('invoice');

    if (companyId) queryBuilder.andWhere('invoice.companyId = :companyId', { companyId });
    if (status) queryBuilder.andWhere('invoice.status = :status', { status });
    if (fromDate && toDate) {
      queryBuilder.andWhere('invoice.invoiceDate BETWEEN :fromDate AND :toDate', { fromDate: new Date(fromDate), toDate: new Date(toDate) });
    }
    if (search) {
      queryBuilder.andWhere(
        '(invoice.invoiceNumber ILIKE :search OR invoice.customerName ILIKE :search)',
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

  // ============ CREDIT NOTE OPERATIONS ============

  async createCreditNote(dto: CreateCreditNoteDto, userId: string, companyId: string): Promise<CreditNote> {
    const creditNoteNumber = await this.generateNumber('CN', companyId);

    const invoice = await this.findSalesInvoiceById(dto.invoiceId, companyId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const creditNote = queryRunner.manager.create(CreditNote, {
        creditNoteNumber,
        invoiceId: dto.invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        customerId: dto.customerId,
        customerName: dto.customerName,
        customerGstin: dto.customerGstin,
        creditNoteDate: dto.creditNoteDate,
        totalAmount: dto.totalAmount,
        taxAmount: dto.totalAmount * 18 / 118, // Assuming 18% GST included
        reason: dto.reason,
        notes: dto.notes,
        companyId,
        createdBy: userId,
      });

      const savedCreditNote = await queryRunner.manager.save(creditNote);

      // Update AR entry
      await queryRunner.manager.update(AccountsReceivable, { salesInvoiceId: dto.invoiceId }, {
        adjustmentAmount: () => `adjustment_amount + ${dto.totalAmount}`,
        pendingAmount: () => `pending_amount - ${dto.totalAmount}`,
      });

      await queryRunner.commitTransaction();

      return savedCreditNote;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ============ RE-PUNCH (update confirmed orders) ============

  async repunchSalesOrder(id: string, dto: UpdateSalesOrderDto, userId: string, companyId?: string): Promise<SalesOrder> {
    const order = await this.findSalesOrderById(id, companyId);
    if (order.status === SalesOrderStatus.CANCELLED || order.status === SalesOrderStatus.CLOSED) {
      throw new BadRequestException('Cannot re-punch cancelled or closed orders');
    }
    if (order.status === SalesOrderStatus.INVOICED) {
      throw new BadRequestException('Cannot re-punch fully invoiced orders');
    }

    await this.salesOrderRepository.update(id, {
      repunchCount: () => '"repunch_count" + 1',
      expectedDeliveryDate: dto.expectedDeliveryDate ?? order.expectedDeliveryDate,
      contactPerson: dto.contactPerson ?? order.contactPerson,
      contactPhone: dto.contactPhone ?? order.contactPhone,
      contactEmail: dto.contactEmail ?? order.contactEmail,
      billingAddress: dto.billingAddress ?? order.billingAddress,
      shippingAddress: dto.shippingAddress ?? order.shippingAddress,
      discountPercent: dto.discountPercent ?? order.discountPercent,
      freightAmount: dto.freightAmount ?? order.freightAmount,
      packingAmount: dto.packingAmount ?? order.packingAmount,
      insuranceAmount: dto.insuranceAmount ?? order.insuranceAmount,
      otherCharges: dto.otherCharges ?? order.otherCharges,
      termsAndConditions: dto.termsAndConditions ?? order.termsAndConditions,
      notes: dto.notes ?? order.notes,
      poNumber: dto.poNumber ?? order.poNumber,
      isExport: dto.isExport ?? order.isExport,
      piNumber: dto.piNumber ?? order.piNumber,
      containerSize: dto.containerSize ?? order.containerSize,
      cbmRequired: dto.cbmRequired ?? order.cbmRequired,
      updatedBy: userId,
    });

    if (dto.items && dto.items.length > 0) {
      await this.salesOrderItemRepository.delete({ orderId: id });

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
        const unitsPerCase = Number(itemDto.unitsPerCase || 1);
        const buyingBestLandingRate = itemDto.buyingBestLandingRate ?? itemDto.landingCost ?? itemDto.unitPrice;
        const gstCost = itemDto.gstCost ?? Number(buyingBestLandingRate || 0) * gstRate / 100;
        const totalRatePerBox = itemDto.totalRatePerBox ?? Number(buyingBestLandingRate || 0) * unitsPerCase;
        const rateWithGstCost = itemDto.rateWithGstCost ?? (Number(buyingBestLandingRate || 0) + gstCost) * unitsPerCase;
        const ratePerCarton = itemDto.ratePerCarton ?? rateWithGstCost;
        const finalRate = itemDto.finalRate ?? itemDto.finalPriceInForeignCurrency ?? itemDto.unitPrice;

        await this.salesOrderItemRepository.save({
          orderId: id,
          lineNumber: i + 1,
          productId: itemDto.productId,
          productName: itemDto.productName,
          productCode: itemDto.productCode,
          categoryName: itemDto.categoryName,
          brandName: itemDto.brandName,
          sku: itemDto.sku,
          hsnCode: itemDto.hsnCode,
          uomName: itemDto.uomName,
          unitSize: itemDto.unitSize,
          unitBasis: itemDto.unitBasis,
          packingType: itemDto.packingType,
          location: itemDto.location,
          purchasePersonId: itemDto.purchasePersonId,
          purchasePersonName: itemDto.purchasePersonName,
          quantity: itemDto.quantity,
          unitsPerCase,
          unitPrice: itemDto.unitPrice,
          mrp: itemDto.mrp,
          buyingBestLandingRate,
          landingCost: itemDto.landingCost ?? buyingBestLandingRate,
          discountPercent: itemDto.discountPercent || 0,
          discountAmount,
          taxableAmount: netAmount,
          gstRate,
          cgstRate: gstRate / 2,
          cgstAmount,
          sgstAmount,
          igstAmount,
          taxAmount,
          totalAmount,
          perPcRateWithoutGst: itemDto.perPcRateWithoutGst,
          otherCost: itemDto.otherCost,
          gstCost,
          totalRatePerBox,
          rateWithGstCost,
          finalPriceInForeignCurrency: itemDto.finalPriceInForeignCurrency ?? finalRate,
          ratePerCarton,
          cbmPerBox: itemDto.cbmPerBox,
          cbmCostPerBoxInSelectedCurrency: itemDto.cbmCostPerBoxInSelectedCurrency,
          haulage: itemDto.haulage,
          finalRate,
          shiftOrderNo: itemDto.shiftOrderNo,
          description: itemDto.description,
          enquiryNo: itemDto.enquiryNo,
          remarks: itemDto.remarks,
          currencyType: itemDto.currencyType,
          itemSelected: itemDto.itemSelected || false,
          itemStatus: itemDto.itemStatus,
          importedBy: itemDto.importedBy,
          poi: itemDto.poi,
          nutrition: itemDto.nutrition,
          ingredients: itemDto.ingredients,
          barcode: itemDto.barcode,
          batchNumber: itemDto.batchNumber,
          shelfLifeMonths: itemDto.shelfLifeMonths,
          mfgDate: itemDto.mfgDate,
          allergenAdvice: itemDto.allergenAdvice,
          netWeight: itemDto.netWeight,
          companyId,
          createdBy: userId,
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

      await this.salesOrderRepository.update(id, {
        subtotal,
        discountAmount,
        cgstAmount: totalCgst,
        sgstAmount: totalSgst,
        igstAmount: totalIgst,
        taxAmount,
        totalAmount,
      });
    }

    this.eventEmitter.emit('sales-order.repunched', { orderId: id, companyId: order.companyId, userId });

    const updated = await this.findSalesOrderById(id, companyId);

    if (updated.contactEmail) {
      this.sendQuotationEmail(updated, true).catch(err =>
        this.logger.error(`Failed to send re-quotation email: ${err.message}`),
      );
    }

    return updated;
  }

  // ============ EMAIL NOTIFICATIONS ============

  async sendQuotationEmail(order: SalesOrder, isReQuotation = false): Promise<void> {
    if (!this.notificationsService) {
      this.logger.warn('NotificationsService not available, skipping email');
      return;
    }

    const toEmail = order.contactEmail;
    if (!toEmail) {
      this.logger.warn(`No contact email for order ${order.orderNumber}, skipping email`);
      return;
    }

    const subject = isReQuotation
      ? `Re-Quotation - ${order.orderNumber} | KOI International`
      : `Quotation - ${order.orderNumber} | KOI International`;

    const itemsHtml = (order.items || []).map((item, i) => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">${i + 1}</td>
        <td style="padding:8px;border:1px solid #ddd">${item.productCode || '-'}</td>
        <td style="padding:8px;border:1px solid #ddd">${item.productName}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">${item.quantity}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right">${Number(item.unitPrice).toFixed(2)}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right">${Number(item.totalAmount).toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `
      <div style="font-family:sans-serif;padding:20px;color:#333;max-width:800px;margin:0 auto">
        <div style="background:#1a365d;color:white;padding:20px;text-align:center">
          <h1 style="margin:0;font-size:24px">KOI International</h1>
          <p style="margin:5px 0 0">${isReQuotation ? 'Re-Quotation' : 'Quotation'}</p>
        </div>
        <div style="padding:20px;background:#f8f9fa">
          <p>Dear ${order.contactPerson || order.customerName},</p>
          <p>${isReQuotation
            ? `Please find our updated quotation <strong>${order.orderNumber}</strong> below.`
            : `Thank you for your enquiry. Please find our quotation <strong>${order.orderNumber}</strong> below.`
          }</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0;background:white">
            <tr style="background:#e2e8f0">
              <td style="padding:8px;font-weight:bold">Order Number</td>
              <td style="padding:8px">${order.orderNumber}</td>
              <td style="padding:8px;font-weight:bold">Date</td>
              <td style="padding:8px">${new Date(order.orderDate).toLocaleDateString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding:8px;font-weight:bold">Customer</td>
              <td style="padding:8px">${order.customerName}</td>
              <td style="padding:8px;font-weight:bold">PI Number</td>
              <td style="padding:8px">${order.piNumber || '-'}</td>
            </tr>
          </table>
          <table style="width:100%;border-collapse:collapse;margin:20px 0;background:white">
            <thead>
              <tr style="background:#1a365d;color:white">
                <th style="padding:8px;border:1px solid #ddd">#</th>
                <th style="padding:8px;border:1px solid #ddd">Code</th>
                <th style="padding:8px;border:1px solid #ddd">Product</th>
                <th style="padding:8px;border:1px solid #ddd">Qty</th>
                <th style="padding:8px;border:1px solid #ddd">Rate</th>
                <th style="padding:8px;border:1px solid #ddd">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr style="background:#e2e8f0;font-weight:bold">
                <td colspan="5" style="padding:8px;border:1px solid #ddd;text-align:right">Total</td>
                <td style="padding:8px;border:1px solid #ddd;text-align:right">${Number(order.totalAmount).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          ${order.termsAndConditions ? `<div style="margin:20px 0"><strong>Terms & Conditions:</strong><p>${order.termsAndConditions}</p></div>` : ''}
          <p>Please feel free to contact us for any queries.</p>
          <p>Best Regards,<br/>${order.salesPersonName || 'Sales Team'}<br/>KOI International</p>
        </div>
      </div>
    `;

    await this.notificationsService.sendEmail({
      to: toEmail,
      subject,
      html,
      text: `${isReQuotation ? 'Re-Quotation' : 'Quotation'} ${order.orderNumber} - Total: ${Number(order.totalAmount).toFixed(2)}. Please check the attached details.`,
    });

    this.logger.log(`${isReQuotation ? 'Re-quotation' : 'Quotation'} email sent for ${order.orderNumber} to ${toEmail}`);
  }

  // ============ EXCEL EXPORT ============

  async exportSalesOrderToExcel(id: string, companyId?: string): Promise<{ buffer: Buffer; filename: string }> {
    const order = await this.findSalesOrderById(id, companyId);
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sales Order');

    // Header section
    sheet.mergeCells('A1:H1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'KOI INTERNATIONAL';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:H2');
    const subtitleCell = sheet.getCell('A2');
    subtitleCell.value = `Sales Order: ${order.orderNumber}`;
    subtitleCell.font = { size: 12, bold: true };
    subtitleCell.alignment = { horizontal: 'center' };

    // Order info
    const infoStart = 4;
    const infoData = [
      ['Order Number:', order.orderNumber, '', 'Date:', new Date(order.orderDate).toLocaleDateString('en-IN')],
      ['Customer:', order.customerName, '', 'PI Number:', order.piNumber || '-'],
      ['Contact:', order.contactPerson || '-', '', 'Container:', order.containerSize || '-'],
      ['Email:', order.contactEmail || '-', '', 'CBM Required:', order.cbmRequired ? String(order.cbmRequired) : '-'],
      ['Billing Address:', order.billingAddress || '-'],
      ['Shipping Address:', order.shippingAddress || '-'],
    ];
    infoData.forEach((row, i) => {
      row.forEach((val, j) => {
        const cell = sheet.getCell(infoStart + i, j + 1);
        cell.value = val;
        if (j === 0 || j === 3) cell.font = { bold: true };
      });
    });

    // Items table header
    const tableStart = infoStart + infoData.length + 1;
    const headers = [
      '#', 'Product Code', 'Product Name', 'Unit Size', 'Units/Ctn',
      'Qty', 'Rate', 'GST%', 'Landing Cost', 'CBM/Box',
      'Haulage', 'Final Rate', 'Amount',
    ];
    headers.forEach((h, i) => {
      const cell = sheet.getCell(tableStart, i + 1);
      cell.value = h;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A365D' } };
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      cell.alignment = { horizontal: 'center' };
    });

    // Items data
    let totalCbm = 0;
    (order.items || []).forEach((item, i) => {
      const row = tableStart + 1 + i;
      const unitsPerCase = Number(item.unitsPerCase || 1);
      const cartons = Math.ceil(Number(item.quantity) / unitsPerCase);
      const cbm = Number(item.cbmPerBox || 0) * cartons;
      totalCbm += cbm;

      const values = [
        i + 1,
        item.productCode || '-',
        item.productName,
        item.unitSize || '-',
        item.unitsPerCase || 1,
        item.quantity,
        Number(item.unitPrice).toFixed(2),
        `${item.gstRate || 0}%`,
        item.landingCost ? Number(item.landingCost).toFixed(2) : '-',
        item.cbmPerBox ? Number(item.cbmPerBox).toFixed(4) : '-',
        item.haulage ? Number(item.haulage).toFixed(2) : '-',
        item.finalRate ? Number(item.finalRate).toFixed(4) : '-',
        Number(item.totalAmount).toFixed(2),
      ];
      values.forEach((val, j) => {
        const cell = sheet.getCell(row, j + 1);
        cell.value = val;
        cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      });
    });

    // Totals
    const totalsStart = tableStart + 1 + (order.items || []).length + 1;
    const totals = [
      ['Subtotal', Number(order.subtotal).toFixed(2)],
      ['Discount', Number(order.discountAmount).toFixed(2)],
      ['CGST', Number(order.cgstAmount).toFixed(2)],
      ['SGST', Number(order.sgstAmount).toFixed(2)],
      ['IGST', Number(order.igstAmount).toFixed(2)],
      ['Total CBM', totalCbm.toFixed(4)],
      ['Grand Total', Number(order.totalAmount).toFixed(2)],
    ];
    totals.forEach(([label, val], i) => {
      sheet.getCell(totalsStart + i, 12).value = label;
      sheet.getCell(totalsStart + i, 12).font = { bold: true };
      sheet.getCell(totalsStart + i, 13).value = val;
      sheet.getCell(totalsStart + i, 13).font = { bold: label === 'Grand Total' };
    });

    // Auto-width columns
    sheet.columns.forEach(col => {
      col.width = 15;
    });

    const buffer = await workbook.xlsx.writeBuffer() as unknown as Buffer;
    const filename = `${order.orderNumber.replace(/\//g, '-')}.xlsx`;

    return { buffer, filename };
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
      throw new BadRequestException('Cannot dispatch stock because no active warehouse exists');
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
    const stock = await stockRepo.findOne({
      where: { productId: params.productId, warehouseId: params.warehouseId },
    });

    const quantityBefore = Number(stock?.currentStock || 0);
    if (params.movementType === MovementType.SALES_ISSUE && quantityBefore < quantity) {
      throw new BadRequestException(`Insufficient stock for product ${params.productId}`);
    }

    const quantityAfter = params.movementType === MovementType.SALES_ISSUE
      ? quantityBefore - quantity
      : quantityBefore + quantity;

    if (stock) {
      stock.currentStock = quantityAfter;
      stock.lastMovementDate = new Date();
      await manager.save(InventoryStock, stock);
    } else {
      await manager.save(InventoryStock, stockRepo.create({
        companyId: params.companyId,
        productId: params.productId,
        sku: params.sku || params.productId,
        warehouseId: params.warehouseId,
        currentStock: quantityAfter,
        reorderLevel: 0,
        maxStockLevel: 1000,
        lastMovementDate: new Date(),
      }));
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

  async generateNumber(prefix: string, companyId: string, salesType?: string): Promise<string> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const fyStartYear = currentMonth >= 4 ? currentYear : currentYear - 1;
    const fyEndYear = fyStartYear + 1;
    const fy = `${fyStartYear.toString().slice(-2)}-${fyEndYear.toString().slice(-2)}`;

    const repo = prefix === 'SO' ? this.salesOrderRepository :
                 prefix === 'DN' ? this.deliveryNoteRepository :
                 prefix === 'INV' ? this.salesInvoiceRepository :
                 this.creditNoteRepository;

    const whereClause: any = { companyId };

    const lastRecord = await repo.find({
      where: whereClause,
      order: { createdAt: 'DESC' },
      take: 1,
    });

    let nextNumber = 1;
    if (lastRecord.length > 0) {
      const lastNumber = lastRecord[0][prefix === 'SO' ? 'orderNumber' :
                                      prefix === 'DN' ? 'noteNumber' :
                                      prefix === 'INV' ? 'invoiceNumber' : 'creditNoteNumber'];
      const parts = lastNumber.split('/');
      const numPart = parts[parts.length - 1];
      nextNumber = parseInt(numPart, 10) + 1;
    }

    if (prefix === 'SO' && salesType) {
      return `KOI/${salesType}/${fy}/${nextNumber.toString().padStart(5, '0')}`;
    }

    return `KOI/${prefix}/${fy}/${nextNumber.toString().padStart(5, '0')}`;
  }

  // ============ STATISTICS ============

  async getSalesStatistics(companyId: string, fromDate?: Date, toDate?: Date) {
    const where: any = { companyId, isActive: true };
    if (fromDate && toDate) {
      where.orderDate = Between(fromDate, toDate);
    }

    const orders = await this.salesOrderRepository.find({ where });

    const totalOrders = orders.length;
    const totalOrderValue = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const confirmedOrders = orders.filter(o => o.status === SalesOrderStatus.CONFIRMED).length;
    const invoicedOrders = orders.filter(o => o.status === SalesOrderStatus.INVOICED).length;

    const invoices = await this.salesInvoiceRepository.find({ where: { companyId, isActive: true } });
    const totalInvoices = invoices.length;
    const totalInvoiceValue = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
    const paidInvoices = invoices.filter(inv => inv.status === InvoiceStatus.PAID).length;

    return {
      orders: {
        total: totalOrders,
        value: totalOrderValue,
        confirmed: confirmedOrders,
        invoiced: invoicedOrders,
      },
      invoices: {
        total: totalInvoices,
        value: totalInvoiceValue,
        paid: paidInvoices,
        pending: totalInvoices - paidInvoices,
      },
    };
  }
}
