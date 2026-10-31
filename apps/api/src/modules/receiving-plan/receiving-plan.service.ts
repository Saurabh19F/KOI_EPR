import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReceivingPlan, ReceivingPlanStatus } from './entities/receiving-plan.entity';
import { PurchaseOrder, PurchaseOrderStatus, PurchaseOrderItem, GoodsReceiptNote, GoodsReceiptNoteItem } from '../purchase-order/entities/purchase-order.entity';
import { User } from '../users/entities/user.entity';
import { Warehouse } from '../masters/entities/warehouse.entity';
import { InventoryService } from '../inventory/inventory.service';
import { generateDocumentNumber } from '../../common/utils/document-number.util';
import { MovementType } from '../inventory/entities/stock-movement.entity';
import {
  CreateReceivingPlanDto,
  UpdateReceivingPlanDto,
  BulkCreateReceivingPlanDto,
  UpdateReceivedQtyDto,
  SubmitGoodsReceivingDto,
  SubmitBulkGoodsReceivingDto,
  SubmitMultiGoodsReceivingDto,
  AllocateToWarehousesDto,
  BulkAllocateDto,
} from './dto/receiving-plan.dto';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ReceivingPlanService {
  private readonly logger = new Logger(ReceivingPlanService.name);

  constructor(
    @InjectRepository(ReceivingPlan)
    private readonly receivingPlanRepository: Repository<ReceivingPlan>,
    @InjectRepository(GoodsReceiptNote)
    private readonly grnRepository: Repository<GoodsReceiptNote>,
    @InjectRepository(GoodsReceiptNoteItem)
    private readonly grnItemRepository: Repository<GoodsReceiptNoteItem>,
    private readonly inventoryService: InventoryService,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateReceivingPlanDto, userId: string, companyId: string): Promise<ReceivingPlan> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const planNumber = await this.generatePlanNumber(companyId, queryRunner.manager);

      const plan = queryRunner.manager.create(ReceivingPlan, {
        planNumber,
        companyId,
        purchaseOrderId: dto.purchaseOrderId,
        poNumber: dto.poNumber,
        productId: dto.productId,
        productName: dto.productName,
        warehouseId: dto.warehouseId,
        warehouseName: dto.warehouseName,
        plannedQty: dto.plannedQty,
        totalReceivedQty: 0,
        status: ReceivingPlanStatus.PENDING,
        plannedByUserId: userId,
        plannedBy: userId,
        remarks: dto.remarks,
        createdBy: userId,
        updatedBy: userId,
      });

      const saved = await queryRunner.manager.save(plan);

      await this.updatePOStatusAfterPlanCreate(dto.purchaseOrderId, companyId, queryRunner.manager);

      await queryRunner.commitTransaction();
      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async bulkCreate(dto: BulkCreateReceivingPlanDto, userId: string, companyId: string): Promise<ReceivingPlan[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const plans: ReceivingPlan[] = [];

      for (const item of dto.items) {
        const planNumber = await this.generatePlanNumber(companyId, queryRunner.manager);

        const plan = queryRunner.manager.create(ReceivingPlan, {
          planNumber,
          companyId,
          purchaseOrderId: dto.purchaseOrderId,
          poNumber: dto.poNumber,
          productId: item.productId,
          productName: item.productName,
          warehouseId: item.warehouseId,
          warehouseName: item.warehouseName,
          plannedQty: item.plannedQty,
          totalReceivedQty: 0,
          status: ReceivingPlanStatus.PENDING,
          plannedByUserId: userId,
          plannedBy: userId,
          createdBy: userId,
          updatedBy: userId,
        });

        const saved = await queryRunner.manager.save(plan);
        plans.push(saved);
      }

      await this.updatePOStatusAfterPlanCreate(dto.purchaseOrderId, companyId, queryRunner.manager);

      await queryRunner.commitTransaction();
      return plans;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    search?: string;
    status?: ReceivingPlanStatus;
    warehouseId?: string;
    poNumber?: string;
    companyId?: string;
  }): Promise<PaginatedResult<ReceivingPlan>> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const query = this.receivingPlanRepository.createQueryBuilder('rp');

    if (filters.companyId) {
      query.andWhere('rp.companyId = :companyId', { companyId: filters.companyId });
    }

    if (filters.status) {
      query.andWhere('rp.status = :status', { status: filters.status });
    }

    if (filters.warehouseId) {
      query.andWhere('rp.warehouseId = :warehouseId', { warehouseId: filters.warehouseId });
    }

    if (filters.poNumber) {
      query.andWhere('rp.poNumber = :poNumber', { poNumber: filters.poNumber });
    }

    if (filters.search) {
      query.andWhere(
        '(rp.planNumber ILIKE :search OR rp.productName ILIKE :search OR rp.warehouseName ILIKE :search OR rp.poNumber ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    query.orderBy('rp.createdAt', 'DESC');
    query.skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();

    const poIds = [...new Set(data.map((p) => p.purchaseOrderId).filter(Boolean))];
    let enriched: any[] = data;

    if (poIds.length > 0) {
      const pos = await this.dataSource.manager
        .getRepository(PurchaseOrder)
        .find({
          where: { orderId: In(poIds) },
          relations: ['items'],
        });

      const poMap: Record<string, PurchaseOrder> = {};
      for (const po of pos) {
        poMap[po.orderId] = po;
      }

      enriched = data.map((plan) => {
        const po = poMap[plan.purchaseOrderId];
        const poItem = po?.items?.find((i) => i.productId === plan.productId);
        return {
          ...plan,
          vendorName: po?.vendorName || '',
          vendorCode: po?.vendorCode || '',
          salesOrderNo: po?.orderNumber || '',
          expectedDate: po?.expectedDeliveryDate || null,
          uniqueCode: poItem?.uniqueCode || poItem?.productCode || plan.productId || '',
          uomName: poItem?.uomName || '',
        };
      });
    }

    return {
      data: enriched,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, companyId: string): Promise<ReceivingPlan> {
    const plan = await this.receivingPlanRepository.findOne({
      where: { planId: id, companyId },
    });

    if (!plan) {
      throw new NotFoundException(`Receiving plan with ID ${id} not found`);
    }

    return plan;
  }

  async update(id: string, dto: UpdateReceivingPlanDto, userId: string, companyId: string): Promise<ReceivingPlan> {
    const plan = await this.findOne(id, companyId);

    if (plan.status === ReceivingPlanStatus.CANCELLED) {
      throw new BadRequestException('Cannot update a cancelled receiving plan');
    }

    if (plan.status === ReceivingPlanStatus.RECEIVED) {
      throw new BadRequestException('Cannot update a fully received receiving plan');
    }

    if (dto.plannedQty !== undefined) plan.plannedQty = dto.plannedQty;
    if (dto.warehouseId !== undefined) plan.warehouseId = dto.warehouseId;
    if (dto.warehouseName !== undefined) plan.warehouseName = dto.warehouseName;
    if (dto.remarks !== undefined) plan.remarks = dto.remarks;
    plan.updatedBy = userId;

    return this.receivingPlanRepository.save(plan);
  }

  async updateReceivedQty(planId: string, dto: UpdateReceivedQtyDto, companyId: string): Promise<ReceivingPlan> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const rows = await queryRunner.query(
        `SELECT * FROM receiving_plans WHERE plan_id = $1 AND (company_id = $2 OR ($2::text IS NULL AND company_id IS NULL)) FOR UPDATE`,
        [planId, companyId],
      );

      if (!rows || rows.length === 0) {
        throw new NotFoundException(`Receiving plan with ID ${planId} not found`);
      }

      const row = rows[0];

      if (row.status === ReceivingPlanStatus.CANCELLED) {
        throw new BadRequestException('Cannot update received quantity on a cancelled plan');
      }

      const newTotal = Number(row.total_received_qty) + dto.receivedQty;
      const planned = Number(row.planned_qty);

      let newStatus = row.status;
      if (newTotal >= planned) {
        newStatus = ReceivingPlanStatus.RECEIVED;
      } else if (newTotal > 0) {
        newStatus = ReceivingPlanStatus.PARTIALLY_RECEIVED;
      }

      await queryRunner.query(
        `UPDATE receiving_plans SET total_received_qty = $1, status = $2, updated_at = NOW() WHERE plan_id = $3`,
        [newTotal, newStatus, planId],
      );

      await queryRunner.commitTransaction();

      return this.findOne(planId, companyId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async cancel(id: string, userId: string, companyId: string): Promise<ReceivingPlan> {
    const plan = await this.findOne(id, companyId);

    if (plan.status === ReceivingPlanStatus.RECEIVED) {
      throw new BadRequestException('Cannot cancel a fully received receiving plan');
    }

    plan.status = ReceivingPlanStatus.CANCELLED;
    plan.updatedBy = userId;

    return this.receivingPlanRepository.save(plan);
  }

  /**
   * `companyId` is accepted for call-site compatibility but deliberately unused:
   * `receiving_plans.plan_number` is globally unique, so the series has to be global
   * too - numbering per company hands two companies the same number.
   */
  async generatePlanNumber(companyId?: string, manager?: EntityManager): Promise<string> {
    return generateDocumentNumber({
      manager: manager || this.dataSource.manager,
      prefix: 'PLAN',
      table: 'receiving_plans',
      column: 'plan_number',
    });
  }

  async submitGoodsReceiving(
    planId: string,
    dto: SubmitGoodsReceivingDto,
    userId: string,
    userName: string,
    companyId: string,
  ): Promise<GoodsReceiptNote> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const planRows = await queryRunner.query(
        `SELECT * FROM receiving_plans WHERE plan_id = $1 AND (company_id = $2 OR company_id IS NULL) FOR UPDATE`,
        [planId, companyId],
      );

      if (!planRows || planRows.length === 0) {
        throw new NotFoundException(`Receiving plan ${planId} not found`);
      }

      const plan = planRows[0];

      if (plan.status === ReceivingPlanStatus.CANCELLED) {
        throw new BadRequestException('Cannot receive against a cancelled plan');
      }

      if (plan.status === ReceivingPlanStatus.RECEIVED) {
        throw new BadRequestException('This plan is already fully received');
      }

      const plannedQty = Number(plan.planned_qty);
      const previousReceivedQty = Number(plan.total_received_qty);
      const balanceBeforeGrn = plannedQty - previousReceivedQty;
      const receivedQty = dto.receivedQty;
      const rejectedQty = dto.rejectedQty || 0;
      const acceptedQty = receivedQty - rejectedQty;
      const totalReceivedAfterGrn = previousReceivedQty + acceptedQty;
      const extraReceivedQty = Math.max(0, totalReceivedAfterGrn - plannedQty);

      if (rejectedQty > receivedQty) {
        throw new BadRequestException('Rejected quantity cannot exceed received quantity');
      }

      if (balanceBeforeGrn > 0 && acceptedQty > balanceBeforeGrn * 1.15) {
        throw new BadRequestException(
          `Accepted quantity (${acceptedQty}) exceeds 15% tolerance of balance (${balanceBeforeGrn}). Max allowed: ${Math.floor(balanceBeforeGrn * 1.15)}`,
        );
      }

      const grnNumber = await this.generateGrnNumber(companyId, queryRunner.manager);

      const grn = queryRunner.manager.create(GoodsReceiptNote, {
        grnNumber,
        companyId,
        orderId: plan.purchase_order_id,
        grnDate: new Date(),
        vendorName: '',
        planId: plan.plan_id,
        storageLocation: dto.storageLocation,
        invoiceNumber: dto.invoiceNo,
        driverName: dto.driverName,
        driverNo: dto.driverNo,
        vehicleNumber: dto.truckNo,
        gstInvoiceNo: dto.gstInvoiceNo,
        invoiceImageUrl: dto.invoiceImageUrl,
        itemImageUrl: dto.itemImageUrl,
        purchaserName: '',
        plannerName: plan.planned_by || '',
        receivedByUsername: userName,
        notes: dto.remarks,
        lrNumber: dto.biltyNo,
        grnType: 'SINGLE',
        status: 'completed',
        createdBy: userId,
        updatedBy: userId,
      });

      const savedGrn = await queryRunner.manager.save(grn);

      const grnItem = queryRunner.manager.create(GoodsReceiptNoteItem, {
        companyId,
        grnId: savedGrn.grnId,
        orderItemId: plan.purchase_order_id || plan.plan_id,
        lineNumber: 1,
        productId: plan.product_id,
        productName: plan.product_name,
        orderedQuantity: plannedQty,
        receivedQuantity: receivedQty,
        acceptedQuantity: acceptedQty,
        rejectedQuantity: rejectedQty,
        unitPrice: 0,
        taxableAmount: 0,
        plannedQtyAtGrn: plannedQty,
        previousReceivedQty,
        balanceBeforeGrn,
        extraReceivedQty,
        totalReceivedAfterGrn,
        remarks: dto.remarks,
        createdBy: userId,
      });

      await queryRunner.manager.save(grnItem);

      let newStatus = plan.status;
      if (totalReceivedAfterGrn >= plannedQty) {
        newStatus = ReceivingPlanStatus.RECEIVED;
      } else if (totalReceivedAfterGrn > 0) {
        newStatus = ReceivingPlanStatus.PARTIALLY_RECEIVED;
      }

      await queryRunner.query(
        `UPDATE receiving_plans SET total_received_qty = $1, status = $2, updated_at = NOW(), updated_by = $3 WHERE plan_id = $4`,
        [totalReceivedAfterGrn, newStatus, userId, planId],
      );

      await queryRunner.commitTransaction();

      let productSku: string | undefined;
      if (plan.purchase_order_id) {
        const poItemRows = await this.dataSource.query(
          `SELECT sku FROM purchase_order_items WHERE order_id = $1 AND product_id = $2 LIMIT 1`,
          [plan.purchase_order_id, plan.product_id],
        );
        productSku = poItemRows?.[0]?.sku || undefined;
      }

      if (acceptedQty > 0) {
        try {
          await this.inventoryService.recordMovement(
            plan.product_id,
            plan.warehouse_id,
            MovementType.PURCHASE_RECEIPT,
            acceptedQty,
            userId,
            {
              referenceType: 'goods_receipt',
              referenceId: savedGrn.grnId,
              referenceNo: grnNumber,
              remarks: `GRN ${grnNumber} against plan ${plan.plan_number}`,
              companyId,
            },
            { productName: plan.product_name, warehouseName: plan.warehouse_name, sku: productSku },
          );
        } catch (stockErr) {
          this.logger.error(`Stock update failed for GRN ${grnNumber}: ${stockErr.message}`, stockErr.stack);
        }
      }

      if (rejectedQty > 0) {
        this.eventEmitter.emit('grn.items.rejected', {
          grnId: savedGrn.grnId,
          grnNumber,
          receiptId: savedGrn.grnId,
          purchaseOrderId: plan.purchase_order_id,
          poNumber: plan.po_number || '',
          productId: plan.product_id,
          productName: plan.product_name,
          rejectedQty,
          companyId,
          userId,
        });
      }

      this.eventEmitter.emit('grn.created', {
        grnId: savedGrn.grnId,
        grnNumber,
        productId: plan.product_id,
        productName: plan.product_name,
        warehouseId: plan.warehouse_id,
        warehouseName: plan.warehouse_name || '',
        receivedQty: receivedQty,
        companyId,
        userId,
      });

      return savedGrn;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async listAllGrns(params: {
    companyId: string;
    search?: string;
    warehouseId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; total: number; page: number; totalPages: number }> {
    const { companyId, search, warehouseId, page = 1, limit = 20 } = params;
    const qb = this.grnRepository.createQueryBuilder('grn')
      .where(companyId ? 'grn.companyId = :companyId' : '(grn.companyId IS NULL OR grn.companyId = :companyId)', { companyId: companyId || '' })
      .orderBy('grn.createdAt', 'DESC');

    if (search) {
      qb.andWhere(
        '(grn.grnNumber ILIKE :s OR grn.vendorName ILIKE :s OR grn.invoiceNumber ILIKE :s OR grn.orderId ILIKE :s)',
        { s: `%${search}%` },
      );
    }

    const [grns, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const grnIds = grns.map((g) => g.grnId);
    let itemsMap: Record<string, GoodsReceiptNoteItem[]> = {};
    if (grnIds.length > 0) {
      const items = await this.grnItemRepository.find({
        where: { grnId: In(grnIds) },
        order: { lineNumber: 'ASC' },
      });
      for (const item of items) {
        if (!itemsMap[item.grnId]) itemsMap[item.grnId] = [];
        itemsMap[item.grnId].push(item);
      }
    }

    const poIds = [...new Set(grns.map((g) => g.orderId).filter(Boolean))];
    let poMap: Record<string, any> = {};
    if (poIds.length > 0) {
      const pos = await this.dataSource.manager
        .getRepository(PurchaseOrder)
        .find({ where: { orderId: In(poIds) } });
      for (const po of pos) { poMap[po.orderId] = po; }
    }

    const data = grns.map((grn) => {
      const items = itemsMap[grn.grnId] || [];
      const po = poMap[grn.orderId];
      const totalAccepted = items.reduce((sum, i) => sum + Number(i.acceptedQuantity || 0), 0);
      const totalRejected = items.reduce((sum, i) => sum + Number(i.rejectedQuantity || 0), 0);
      return {
        ...grn,
        items,
        itemCount: items.length,
        grnType: grn.grnType === 'MULTI' ? `MULTI GRN` : grn.grnType === 'BULK' ? 'BULK GRN' : 'SINGLE GRN',
        poNumber: po?.orderNumber || grn.orderId || '',
        productDetails: items.map((i) => i.productName).join(', '),
        vendorDetails: grn.vendorName || po?.vendorName || '',
        buyerCode: po?.vendorCode || '',
        totalAccepted,
        totalRejected,
      };
    });

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getGrnHistory(planId: string, companyId: string): Promise<GoodsReceiptNote[]> {
    return this.grnRepository.find({
      where: { planId, companyId },
      order: { createdAt: 'DESC' },
    });
  }

  async getGrnWithItems(grnId: string, companyId: string): Promise<GoodsReceiptNote & { items: GoodsReceiptNoteItem[] }> {
    const grn = await this.grnRepository.findOne({
      where: { grnId, companyId },
    });

    if (!grn) {
      throw new NotFoundException(`GRN ${grnId} not found`);
    }

    const items = await this.grnItemRepository.find({
      where: { grnId, companyId },
      order: { lineNumber: 'ASC' },
    });

    return { ...grn, items };
  }

  /** Globally unique series, see {@link generatePlanNumber} on the unused `companyId`. */
  async generateGrnNumber(companyId?: string, manager?: EntityManager): Promise<string> {
    return generateDocumentNumber({
      manager: manager || this.dataSource.manager,
      prefix: 'GRN',
      table: 'goods_receipt_notes',
      column: 'grn_number',
    });
  }

  private async updatePOStatusAfterPlanCreate(
    purchaseOrderId: string,
    companyId: string,
    manager: EntityManager,
    plannerName?: string,
  ): Promise<void> {
    if (!purchaseOrderId) return;

    const po = await manager.findOne(PurchaseOrder, {
      where: { orderId: purchaseOrderId, companyId },
      relations: ['items'],
    });

    if (!po || !po.items?.length) return;

    const plans = await manager.find(ReceivingPlan, {
      where: { purchaseOrderId, companyId },
    });

    const totalPlannedByProduct = new Map<string, number>();
    for (const plan of plans) {
      if (plan.status === ReceivingPlanStatus.CANCELLED) continue;
      const existing = totalPlannedByProduct.get(plan.productId) || 0;
      totalPlannedByProduct.set(plan.productId, existing + Number(plan.plannedQty));
    }

    let allPlanned = true;
    let anyPlanned = false;

    for (const item of po.items) {
      if (!item.isActive || item.noNeed) continue;
      const orderedQty = Number(item.quantity || 0);
      if (orderedQty <= 0) continue;

      const plannedQty = totalPlannedByProduct.get(item.productId) || 0;
      if (plannedQty > 0) anyPlanned = true;
      if (plannedQty < orderedQty) allPlanned = false;
    }

    const updateData: Partial<PurchaseOrder> = {};

    if (allPlanned && anyPlanned) {
      updateData.status = PurchaseOrderStatus.PLANNED;
    } else if (anyPlanned) {
      updateData.status = PurchaseOrderStatus.PARTIALLY_PLANNED;
    }

    if (plannerName) {
      updateData.plannedBy = plannerName;
    }

    if (Object.keys(updateData).length > 0) {
      await manager.update(PurchaseOrder, { orderId: purchaseOrderId, companyId }, updateData);
    }
  }

  async syncFromApprovedPOs(userId: string, companyId: string): Promise<{ synced: number; skipped: number; errors: string[] }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const approvedPOs = await queryRunner.manager.find(PurchaseOrder, {
        where: { companyId, status: PurchaseOrderStatus.APPROVED, isActive: true },
        relations: ['items'],
      });

      const warehouse = await queryRunner.manager.getRepository(Warehouse)
        .createQueryBuilder('warehouse')
        .where('warehouse.isActive = :isActive', { isActive: true })
        .orderBy('warehouse.isDefault', 'DESC')
        .addOrderBy('warehouse.name', 'ASC')
        .getOne();

      if (!warehouse) {
        throw new BadRequestException('No active warehouse found. Create a warehouse before syncing receiving plans.');
      }

      const warehouseId = warehouse.id;
      const warehouseName = warehouse.name;

      let synced = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (let i = 0; i < approvedPOs.length; i++) {
        const order = approvedPOs[i];

        const existingPlans = await queryRunner.manager.find(ReceivingPlan, {
          where: { purchaseOrderId: order.orderId, companyId },
        });

        if (existingPlans.length > 0) {
          skipped++;
          continue;
        }

        if (!order.items?.length) {
          skipped++;
          continue;
        }

        const savepointName = `sp_sync_${i}`;
        await queryRunner.query(`SAVEPOINT ${savepointName}`);

        try {
          for (const item of order.items) {
            if (!item.isActive || item.noNeed) continue;
            if (!item.productId) continue;

            const qty = Number(item.quantity || 0);
            if (qty <= 0) continue;

            const planNumber = await this.generatePlanNumber(companyId, queryRunner.manager);

            const plan = queryRunner.manager.create(ReceivingPlan, {
              planNumber,
              companyId,
              purchaseOrderId: order.orderId,
              poNumber: order.orderNumber,
              productId: item.productId,
              productName: item.productName,
              warehouseId,
              warehouseName,
              plannedQty: qty,
              totalReceivedQty: 0,
              status: ReceivingPlanStatus.PENDING,
              plannedByUserId: userId,
              plannedBy: userId,
              remarks: `Synced from approved PO ${order.orderNumber}`,
              createdBy: userId,
            });

            await queryRunner.manager.save(plan);
          }

          await queryRunner.query(`RELEASE SAVEPOINT ${savepointName}`);
          synced++;
        } catch (error) {
          await queryRunner.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
          const msg = `Failed to sync PO ${order.orderNumber}: ${error.message}`;
          this.logger.error(msg, error.stack);
          errors.push(msg);
        }
      }

      await queryRunner.commitTransaction();
      this.logger.log(`Receiving plan sync complete: ${synced} synced, ${skipped} skipped, ${errors.length} errors`);
      return { synced, skipped, errors };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async submitBulkGoodsReceiving(
    dto: SubmitBulkGoodsReceivingDto,
    userId: string,
    userName: string,
    companyId: string,
  ): Promise<{ masterReceiptId: string; processedCount: number; totalAccepted: number; totalRejected: number; grns: GoodsReceiptNote[] }> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('No items provided for bulk GRN');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const masterReceiptId = await this.generateBulkGrnId(companyId, queryRunner.manager);
      const grns: GoodsReceiptNote[] = [];
      let totalAccepted = 0;
      let totalRejected = 0;

      for (const item of dto.items) {
        const planRows = await queryRunner.query(
          `SELECT * FROM receiving_plans WHERE plan_id = $1 AND (company_id = $2 OR ($2::text IS NULL AND company_id IS NULL)) FOR UPDATE`,
          [item.planId, companyId],
        );

        if (!planRows || planRows.length === 0) {
          throw new BadRequestException(`Receiving plan ${item.planId} not found`);
        }

        const plan = planRows[0];

        if (plan.status === ReceivingPlanStatus.CANCELLED) {
          throw new BadRequestException(`Plan ${item.planId} is cancelled`);
        }

        const plannedQty = Number(plan.planned_qty);
        const previousReceivedQty = Number(plan.total_received_qty);
        const receivedQty = item.receivedQty;
        const rejectedQty = item.rejectedQty || 0;
        const acceptedQty = receivedQty - rejectedQty;
        const balanceBeforeGrn = plannedQty - previousReceivedQty;
        const totalReceivedAfterGrn = previousReceivedQty + acceptedQty;
        const extraReceivedQty = Math.max(0, totalReceivedAfterGrn - plannedQty);

        if (rejectedQty > receivedQty) {
          throw new BadRequestException(`Rejected qty cannot exceed received qty for plan ${item.planId}`);
        }

        if (balanceBeforeGrn > 0 && acceptedQty > balanceBeforeGrn * 1.15) {
          throw new BadRequestException(
            `Plan ${item.planId}: accepted quantity (${acceptedQty}) exceeds 15% tolerance of balance (${balanceBeforeGrn}). Max allowed: ${Math.floor(balanceBeforeGrn * 1.15)}`,
          );
        }

        const itemGrnNumber = await this.generateGrnNumber(companyId, queryRunner.manager);

        const grn = queryRunner.manager.create(GoodsReceiptNote, {
          grnNumber: itemGrnNumber,
          companyId,
          orderId: plan.purchase_order_id,
          grnDate: new Date(),
          vendorName: '',
          planId: plan.plan_id,
          storageLocation: item.storageLocation || 'Inward-Staging',
          invoiceNumber: dto.invoiceNo,
          driverName: dto.driverName,
          driverNo: dto.driverNo,
          vehicleNumber: dto.truckNo,
          gstInvoiceNo: dto.gstInvoiceNo,
          invoiceImageUrl: dto.invoiceImageUrl,
          itemImageUrl: item.itemImageUrl,
          purchaserName: '',
          plannerName: plan.planned_by || '',
          receivedByUsername: userName,
          notes: dto.remarks,
          lrNumber: dto.biltyNo,
          grnType: 'BULK',
          status: 'completed',
          createdBy: userId,
          updatedBy: userId,
        });

        const savedGrn = await queryRunner.manager.save(grn);

        const grnItem = queryRunner.manager.create(GoodsReceiptNoteItem, {
          companyId,
          grnId: savedGrn.grnId,
          orderItemId: plan.purchase_order_id || plan.plan_id,
          lineNumber: 1,
          productId: plan.product_id,
          productName: item.itemDescription || plan.product_name,
          orderedQuantity: plannedQty,
          receivedQuantity: receivedQty,
          acceptedQuantity: acceptedQty,
          rejectedQuantity: rejectedQty,
          unitPrice: 0,
          taxableAmount: 0,
          plannedQtyAtGrn: plannedQty,
          previousReceivedQty,
          balanceBeforeGrn,
          extraReceivedQty,
          totalReceivedAfterGrn,
          remarks: rejectedQty > 0 ? `Reject Reason: ${item.rejectionReason}` : (dto.remarks || 'OK'),
          createdBy: userId,
        });

        await queryRunner.manager.save(grnItem);

        let newStatus = plan.status;
        if (totalReceivedAfterGrn >= plannedQty) {
          newStatus = ReceivingPlanStatus.RECEIVED;
        } else if (totalReceivedAfterGrn > 0) {
          newStatus = ReceivingPlanStatus.PARTIALLY_RECEIVED;
        }

        await queryRunner.query(
          `UPDATE receiving_plans SET total_received_qty = $1, status = $2, updated_at = NOW(), updated_by = $3 WHERE plan_id = $4`,
          [totalReceivedAfterGrn, newStatus, userId, item.planId],
        );

        grns.push(savedGrn);
        totalAccepted += acceptedQty;
        totalRejected += rejectedQty;
      }

      await queryRunner.commitTransaction();

      for (const item of dto.items) {
        const matchedGrn = grns.find((g) => g.planId === item.planId);
        const planRows = await this.dataSource.query(
          `SELECT * FROM receiving_plans WHERE plan_id = $1 AND (company_id = $2 OR ($2::text IS NULL AND company_id IS NULL))`,
          [item.planId, companyId],
        );
        if (planRows?.[0]) {
          const plan = planRows[0];
          const grnId = matchedGrn?.grnId || masterReceiptId;
          const grnNumber = matchedGrn?.grnNumber || masterReceiptId;
          const acceptedQty = item.receivedQty - (item.rejectedQty || 0);

          let bulkSku: string | undefined;
          if (plan.purchase_order_id) {
            const poItemRows = await this.dataSource.query(
              `SELECT sku FROM purchase_order_items WHERE order_id = $1 AND product_id = $2 LIMIT 1`,
              [plan.purchase_order_id, plan.product_id],
            );
            bulkSku = poItemRows?.[0]?.sku || undefined;
          }

          if (acceptedQty > 0) {
            try {
              await this.inventoryService.recordMovement(
                plan.product_id,
                plan.warehouse_id,
                MovementType.PURCHASE_RECEIPT,
                acceptedQty,
                userId,
                {
                  referenceType: 'goods_receipt',
                  referenceId: grnId,
                  referenceNo: grnNumber,
                  remarks: `Bulk GRN ${grnNumber} against plan ${plan.plan_number}`,
                  companyId,
                },
                { productName: plan.product_name, warehouseName: plan.warehouse_name, sku: bulkSku },
              );
            } catch (stockErr) {
              this.logger.error(`Stock update failed for bulk GRN item ${item.planId}: ${stockErr.message}`);
            }
          }

          const rejectedQty = item.rejectedQty || 0;
          if (rejectedQty > 0) {
            this.eventEmitter.emit('grn.items.rejected', {
              grnId,
              grnNumber,
              receiptId: masterReceiptId,
              purchaseOrderId: plan.purchase_order_id,
              poNumber: plan.po_number || '',
              productId: plan.product_id,
              productName: plan.product_name,
              rejectedQty,
              companyId,
              userId,
            });
          }

          this.eventEmitter.emit('grn.created', {
            grnId,
            grnNumber,
            productId: plan.product_id,
            productName: plan.product_name,
            warehouseId: plan.warehouse_id,
            warehouseName: plan.warehouse_name || '',
            receivedQty: item.receivedQty,
            companyId,
            userId,
          });
        }
      }

      return { masterReceiptId, processedCount: dto.items.length, totalAccepted, totalRejected, grns };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async submitMultiGoodsReceiving(
    dto: SubmitMultiGoodsReceivingDto,
    userId: string,
    userName: string,
    companyId: string,
  ): Promise<{ multiReceiptId: string; processedCount: number; totalAccepted: number; totalRejected: number; grns: GoodsReceiptNote[] }> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('No GRN items were selected');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const multiReceiptId = await this.generateBulkGrnId(companyId, queryRunner.manager);

      // Phase 1: Validate all items (duplicate detection + plan validation)
      const seen = new Set<string>();
      const validatedItems: Array<{
        item: typeof dto.items[0];
        plan: any;
        acceptedQty: number;
        rejectedQty: number;
        totalReceivedAfterGrn: number;
        balanceBeforeGrn: number;
        extraReceivedQty: number;
        newStatus: string;
      }> = [];

      let totalAccepted = 0;
      let totalRejected = 0;

      for (let idx = 0; idx < dto.items.length; idx++) {
        const item = dto.items[idx];
        const identityKey = `${item.planId}|${item.poId || ''}|${item.productId}`.toUpperCase();

        if (seen.has(identityKey)) {
          throw new BadRequestException(
            `Duplicate GRN selection blocked at line ${idx + 1}: ${item.planId} / ${item.productId}`,
          );
        }
        seen.add(identityKey);

        const planRows = await queryRunner.query(
          `SELECT * FROM receiving_plans WHERE plan_id = $1 AND (company_id = $2 OR ($2::text IS NULL AND company_id IS NULL)) FOR UPDATE`,
          [item.planId, companyId],
        );

        if (!planRows || planRows.length === 0) {
          throw new BadRequestException(`Receiving plan ${item.planId} not found`);
        }

        const plan = planRows[0];

        if (plan.status === ReceivingPlanStatus.CANCELLED) {
          throw new BadRequestException(`Plan ${item.planId} is cancelled`);
        }

        if (dto.warehouseId && plan.warehouse_id !== dto.warehouseId) {
          throw new BadRequestException(
            `Plan ${item.planId} belongs to warehouse ${plan.warehouse_id}, not ${dto.warehouseId}`,
          );
        }

        const plannedQty = Number(plan.planned_qty);
        const previousReceivedQty = Number(plan.total_received_qty);
        const receivedQty = item.receivedQty;
        const rejectedQty = item.rejectedQty || 0;
        const acceptedQty = receivedQty - rejectedQty;
        const balanceBeforeGrn = Math.max(0, plannedQty - previousReceivedQty);
        const totalReceivedAfterGrn = previousReceivedQty + acceptedQty;
        const extraReceivedQty = Math.max(0, totalReceivedAfterGrn - plannedQty);

        if (rejectedQty > receivedQty) {
          throw new BadRequestException(`Rejected qty exceeds received qty for plan ${item.planId}`);
        }

        if (balanceBeforeGrn > 0 && acceptedQty > balanceBeforeGrn * 1.15) {
          throw new BadRequestException(
            `Plan ${item.planId}: accepted quantity (${acceptedQty}) exceeds 15% tolerance of balance (${balanceBeforeGrn}). Max allowed: ${Math.floor(balanceBeforeGrn * 1.15)}`,
          );
        }

        let newStatus = plan.status;
        if (totalReceivedAfterGrn >= plannedQty) {
          newStatus = ReceivingPlanStatus.RECEIVED;
        } else if (totalReceivedAfterGrn > 0) {
          newStatus = ReceivingPlanStatus.PARTIALLY_RECEIVED;
        }

        validatedItems.push({ item, plan, acceptedQty, rejectedQty, totalReceivedAfterGrn, balanceBeforeGrn, extraReceivedQty, newStatus });
        totalAccepted += acceptedQty;
        totalRejected += rejectedQty;
      }

      // Phase 2: Persist all validated items
      const grns: GoodsReceiptNote[] = [];

      for (const v of validatedItems) {
        const { item, plan } = v;
        const plannedQty = Number(plan.planned_qty);
        const previousReceivedQty = Number(plan.total_received_qty);

        const itemGrnNumber = await this.generateGrnNumber(companyId, queryRunner.manager);

        const grn = queryRunner.manager.create(GoodsReceiptNote, {
          grnNumber: itemGrnNumber,
          companyId,
          orderId: plan.purchase_order_id,
          grnDate: new Date(),
          vendorName: '',
          planId: plan.plan_id,
          storageLocation: item.storageLocation || 'Inward-Staging',
          invoiceNumber: dto.invoiceNo,
          driverName: dto.driverName,
          driverNo: dto.driverNo,
          vehicleNumber: dto.truckNo,
          gstInvoiceNo: dto.gstInvoiceNo,
          invoiceImageUrl: dto.invoiceImageUrl,
          itemImageUrl: item.itemImageUrl,
          purchaserName: '',
          plannerName: plan.planned_by || '',
          receivedByUsername: userName,
          notes: item.remarks,
          lrNumber: dto.biltyNo,
          grnType: 'MULTI',
          status: 'completed',
          createdBy: userId,
          updatedBy: userId,
        });

        const savedGrn = await queryRunner.manager.save(grn);

        const grnItem = queryRunner.manager.create(GoodsReceiptNoteItem, {
          companyId,
          grnId: savedGrn.grnId,
          orderItemId: plan.purchase_order_id || plan.plan_id,
          lineNumber: 1,
          productId: plan.product_id,
          productName: item.itemDescription || plan.product_name,
          orderedQuantity: plannedQty,
          receivedQuantity: item.receivedQty,
          acceptedQuantity: v.acceptedQty,
          rejectedQuantity: v.rejectedQty,
          unitPrice: 0,
          taxableAmount: 0,
          plannedQtyAtGrn: plannedQty,
          previousReceivedQty,
          balanceBeforeGrn: v.balanceBeforeGrn,
          extraReceivedQty: v.extraReceivedQty,
          totalReceivedAfterGrn: v.totalReceivedAfterGrn,
          remarks: v.rejectedQty > 0 ? `Reject Reason: ${item.rejectionReason}` : (item.remarks || 'OK'),
          createdBy: userId,
        });

        await queryRunner.manager.save(grnItem);

        await queryRunner.query(
          `UPDATE receiving_plans SET total_received_qty = $1, status = $2, updated_at = NOW(), updated_by = $3 WHERE plan_id = $4`,
          [v.totalReceivedAfterGrn, v.newStatus, userId, item.planId],
        );

        grns.push(savedGrn);
      }

      await queryRunner.commitTransaction();

      // Record stock movements and emit rejection events outside transaction
      for (const v of validatedItems) {
        const matchedGrn = grns.find((g) => g.planId === v.plan.plan_id);
        const grnId = matchedGrn?.grnId || multiReceiptId;
        const grnNumber = matchedGrn?.grnNumber || multiReceiptId;

        let multiSku: string | undefined;
        if (v.plan.purchase_order_id) {
          const poItemRows = await this.dataSource.query(
            `SELECT sku FROM purchase_order_items WHERE order_id = $1 AND product_id = $2 LIMIT 1`,
            [v.plan.purchase_order_id, v.plan.product_id],
          );
          multiSku = poItemRows?.[0]?.sku || undefined;
        }

        if (v.acceptedQty > 0) {
          try {
            await this.inventoryService.recordMovement(
              v.plan.product_id,
              v.plan.warehouse_id,
              MovementType.PURCHASE_RECEIPT,
              v.acceptedQty,
              userId,
              {
                referenceType: 'goods_receipt',
                referenceId: grnId,
                referenceNo: grnNumber,
                remarks: `Multi-GRN ${grnNumber} against plan ${v.plan.plan_number}`,
                companyId,
              },
              { productName: v.plan.product_name, warehouseName: v.plan.warehouse_name, sku: multiSku },
            );
          } catch (stockErr) {
            this.logger.error(`Stock update failed for multi GRN item ${v.item.planId}: ${stockErr.message}`);
          }
        }

        if (v.rejectedQty > 0) {
          this.eventEmitter.emit('grn.items.rejected', {
            grnId,
            grnNumber,
            receiptId: multiReceiptId,
            purchaseOrderId: v.plan.purchase_order_id,
            poNumber: v.plan.po_number || '',
            productId: v.plan.product_id,
            productName: v.plan.product_name,
            rejectedQty: v.rejectedQty,
            companyId,
            userId,
          });
        }

        this.eventEmitter.emit('grn.created', {
          grnId,
          grnNumber,
          productId: v.plan.product_id,
          productName: v.plan.product_name,
          warehouseId: v.plan.warehouse_id,
          warehouseName: v.plan.warehouse_name || '',
          receivedQty: v.item.receivedQty,
          companyId,
          userId,
        });
      }

      return { multiReceiptId, processedCount: validatedItems.length, totalAccepted, totalRejected, grns };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ============ GAS-style Split Allocation ============

  async allocateToWarehouses(
    dto: AllocateToWarehousesDto,
    userId: string,
    userName: string,
    companyId: string,
  ): Promise<ReceivingPlan[]> {
    if (!dto.allocations?.length) {
      throw new BadRequestException('No allocations provided');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const po = await queryRunner.manager.findOne(PurchaseOrder, {
        where: { orderId: dto.poId, companyId, isActive: true },
        relations: ['items'],
      });

      if (!po) {
        throw new NotFoundException(`Purchase order ${dto.poId} not found`);
      }

      if (![PurchaseOrderStatus.APPROVED, PurchaseOrderStatus.PARTIALLY_PLANNED, PurchaseOrderStatus.PLANNED].includes(po.status as PurchaseOrderStatus)) {
        throw new BadRequestException(`Purchase order ${po.orderNumber} is not in a plannable status (current: ${po.status})`);
      }

      const poItem = po.items?.find(
        (i) => (i.productId === dto.productId || i.itemId === dto.productId) && i.isActive && !i.noNeed,
      );
      if (!poItem) {
        throw new NotFoundException(`Product ${dto.productId} is not an active item on PO ${po.orderNumber}`);
      }
      const resolvedProductId = poItem.productId || poItem.itemId || dto.productId;

      const orderedQty = Number(poItem.quantity || 0);
      const existingPlans = await queryRunner.manager.find(ReceivingPlan, {
        where: { purchaseOrderId: dto.poId, productId: resolvedProductId, ...(companyId ? { companyId } : {}) },
      });
      const alreadyPlanned = existingPlans
        .filter((p) => p.status !== ReceivingPlanStatus.CANCELLED)
        .reduce((sum, p) => sum + Number(p.plannedQty), 0);

      const newAllocationTotal = dto.allocations.reduce((sum, a) => sum + a.qty, 0);
      if (alreadyPlanned + newAllocationTotal > orderedQty) {
        throw new BadRequestException(
          `Total planned qty (${alreadyPlanned} existing + ${newAllocationTotal} new) exceeds ordered qty (${orderedQty})`,
        );
      }

      const warehouseIds = dto.allocations.map((a) => a.warehouseId);
      const warehouses = await queryRunner.manager.find(Warehouse, {
        where: { id: In(warehouseIds), isActive: true },
      });
      const warehouseMap = new Map(warehouses.map((w) => [w.id, w]));

      for (const alloc of dto.allocations) {
        if (!warehouseMap.has(alloc.warehouseId)) {
          throw new NotFoundException(`Warehouse ${alloc.warehouseId} not found`);
        }
      }

      const plans: ReceivingPlan[] = [];

      for (const alloc of dto.allocations) {
        if (alloc.qty <= 0) continue;

        const warehouse = warehouseMap.get(alloc.warehouseId);
        const planNumber = await this.generatePlanNumber(companyId, queryRunner.manager);

        const plan = queryRunner.manager.create(ReceivingPlan, {
          planNumber,
          companyId,
          purchaseOrderId: po.orderId,
          poNumber: po.orderNumber,
          productId: resolvedProductId,
          productName: poItem.productName,
          warehouseId: warehouse.id,
          warehouseName: warehouse.name,
          plannedQty: alloc.qty,
          totalReceivedQty: 0,
          status: ReceivingPlanStatus.PENDING,
          plannedByUserId: userId,
          plannedBy: userName,
          remarks: dto.remarks,
          createdBy: userId,
          updatedBy: userId,
        });

        const saved = await queryRunner.manager.save(plan);
        plans.push(saved);
      }

      await this.updatePOStatusAfterPlanCreate(po.orderId, companyId, queryRunner.manager, userName);

      await queryRunner.commitTransaction();
      return plans;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async bulkAllocate(
    dto: BulkAllocateDto,
    userId: string,
    userName: string,
    companyId: string,
  ): Promise<{ completed: number; plans: ReceivingPlan[] }> {
    if (!dto.plans?.length) {
      throw new BadRequestException('No items selected for bulk allocation');
    }

    const allPlans: ReceivingPlan[] = [];

    for (const planData of dto.plans) {
      const created = await this.allocateToWarehouses(planData, userId, userName, companyId);
      allPlans.push(...created);
    }

    return { completed: dto.plans.length, plans: allPlans };
  }

  // ============ Planner Dashboard Data ============

  async getPlannerData(
    user: { userId: string; companyId: string; warehouseId?: string; name?: string },
    filters?: { search?: string; page?: number; limit?: number },
  ): Promise<{
    pendingPOs: any[];
    totalOrderCount: number;
    unplannedOrderCount: number;
    plannedAllocationCount: number;
  }> {
    const companyId = user.companyId;
    const page = filters?.page || 1;
    const limit = filters?.limit || 100;
    const offset = (page - 1) * limit;

    const statusesToShow = [
      PurchaseOrderStatus.DRAFT,
      PurchaseOrderStatus.SUBMITTED,
      PurchaseOrderStatus.PENDING_APPROVAL,
      PurchaseOrderStatus.APPROVED,
      PurchaseOrderStatus.PARTIALLY_PLANNED,
      PurchaseOrderStatus.PLANNED,
      PurchaseOrderStatus.PARTIALLY_RECEIVED,
    ];

    const poQuery = this.dataSource
      .getRepository(PurchaseOrder)
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.items', 'item', 'item.isActive = true AND item.noNeed = false')
      .where('po.isActive = true')
      .andWhere('po.status IN (:...statuses)', { statuses: statusesToShow });

    if (companyId) {
      poQuery.andWhere('po.companyId = :companyId', { companyId });
    }

    if (filters?.search) {
      poQuery.andWhere(
        '(po.orderNumber ILIKE :search OR item.productName ILIKE :search OR po.vendorName ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (user.warehouseId) {
      const warehouse = await this.dataSource
        .getRepository(Warehouse)
        .findOne({ where: { id: user.warehouseId } });
      if (warehouse) {
        poQuery.andWhere(
          '(po.location = :whName OR po.location = :whCode OR po.location = :whId OR po.location IS NULL OR po.location = :empty)',
          { whName: warehouse.name, whCode: warehouse.code, whId: user.warehouseId, empty: '' },
        );
      } else {
        poQuery.andWhere('1 = 0');
      }
    }

    poQuery.orderBy('po.createdAt', 'DESC');
    poQuery.skip(offset).take(limit);

    const purchaseOrders = await poQuery.getMany();

    const poIds = purchaseOrders.map((po) => po.orderId);

    let existingPlans: ReceivingPlan[] = [];
    if (poIds.length > 0) {
      const planWhere: any = { purchaseOrderId: In(poIds) };
      if (companyId) {
        planWhere.companyId = companyId;
      }
      existingPlans = await this.receivingPlanRepository.find({
        where: planWhere,
      });
    }

    const plannedQtyMap = new Map<string, number>();
    for (const plan of existingPlans) {
      if (plan.status === ReceivingPlanStatus.CANCELLED) continue;
      const key = `${plan.purchaseOrderId}___${plan.productId}`;
      const existing = plannedQtyMap.get(key) || 0;
      plannedQtyMap.set(key, existing + Number(plan.plannedQty));
    }

    const enquiryIds = purchaseOrders.map((po) => po.salesEnquiryId).filter(Boolean);
    const soNos = purchaseOrders.map((po) => po.soNo).filter(Boolean);
    const enquiryNos = purchaseOrders.map((po) => po.enquiryNo).filter(Boolean);

    const enquiryByIdMap = new Map<string, any>();
    const enquiryBySoMap = new Map<string, any>();
    const enquiryByNoMap = new Map<string, any>();

    if (enquiryIds.length > 0 || soNos.length > 0 || enquiryNos.length > 0) {
      const conditions: string[] = [];
      const params: any[] = [];
      let idx = 1;
      if (enquiryIds.length > 0) { conditions.push(`enquiry_order_id = ANY($${idx})`); params.push(enquiryIds); idx++; }
      if (soNos.length > 0) { conditions.push(`order_no = ANY($${idx})`); params.push(soNos); idx++; }
      if (enquiryNos.length > 0) { conditions.push(`enquiry_order_no = ANY($${idx})`); params.push(enquiryNos); idx++; }

      const enquiries = await this.dataSource.query(
        `SELECT enquiry_order_id, enquiry_order_no, order_no, buyer_code, sales_person_name FROM sales_enquiry_orders WHERE ${conditions.join(' OR ')}`,
        params,
      );
      for (const e of enquiries) {
        if (e.enquiry_order_id) enquiryByIdMap.set(e.enquiry_order_id, e);
        if (e.order_no) enquiryBySoMap.set(e.order_no, e);
        if (e.enquiry_order_no) enquiryByNoMap.set(e.enquiry_order_no, e);
      }
    }

    const pendingPOs: any[] = [];
    let totalOrderCount = 0;
    let unplannedOrderCount = 0;

    for (const po of purchaseOrders) {
      if (!po.items?.length) continue;

      const enquiry = enquiryByIdMap.get(po.salesEnquiryId) || enquiryBySoMap.get(po.soNo) || enquiryByNoMap.get(po.enquiryNo);

      for (const item of po.items) {
        const qty = Number(item.quantity || 0);
        if (qty <= 0) continue;

        totalOrderCount++;

        const itemIdentifier = item.productId || item.itemId;
        const key = `${po.orderId}___${itemIdentifier}`;
        const totalPlanned = plannedQtyMap.get(key) || 0;
        const unplannedQty = Math.max(0, qty - totalPlanned);

        if (unplannedQty > 0) unplannedOrderCount++;

        pendingPOs.push({
          poId: po.orderId,
          poNumber: po.orderNumber,
          productId: item.productId || item.itemId,
          productName: item.productName,
          productCode: item.productCode || item.sku,
          itemDescription: item.description || item.productName,
          vendorName: po.vendorName,
          qty,
          plannedQty: totalPlanned,
          unplannedQty,
          uom: item.uomName || '',
          expectedDate: po.expectedDeliveryDate,
          purchasePerson: po.purchasePerson || '',
          salesPerson: enquiry?.sales_person_name || po.salesPersonName || '',
          buyerCode: enquiry?.buyer_code || '',
          location: item.location || po.location || '',
          orderNo: item.soNo || po.soNo || '',
          poStatus: po.status,
        });
      }
    }

    const plannedAllocationCount = existingPlans.filter(
      (p) => p.status !== ReceivingPlanStatus.CANCELLED,
    ).length;

    return {
      pendingPOs,
      totalOrderCount,
      unplannedOrderCount,
      plannedAllocationCount,
    };
  }

  async getWorkflowTracker(
    companyId: string,
    filters?: { search?: string; page?: number; limit?: number },
  ): Promise<{ data: any[]; total: number; page: number; totalPages: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const offset = (page - 1) * limit;

    const planQuery = this.receivingPlanRepository
      .createQueryBuilder('rp')
      .where('rp.companyId = :companyId', { companyId })
      .andWhere('rp.status != :cancelled', { cancelled: ReceivingPlanStatus.CANCELLED });

    if (filters?.search) {
      planQuery.andWhere(
        '(rp.productName ILIKE :search OR rp.poNumber ILIKE :search OR rp.planNumber ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const total = await planQuery.getCount();
    const plans = await planQuery
      .orderBy('rp.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getMany();

    if (plans.length === 0) {
      return { data: [], total: 0, page, totalPages: 0 };
    }

    const poIds = [...new Set(plans.map((p) => p.purchaseOrderId).filter(Boolean))];
    const productIds = [...new Set(plans.map((p) => p.productId).filter(Boolean))];

    const poMap = new Map<string, any>();
    if (poIds.length > 0) {
      const poRows = await this.dataSource.query(
        `SELECT po.order_id, po.status, po.approved_at, po.created_at,
                pi.product_id, pi.quantity
         FROM purchase_orders po
         LEFT JOIN purchase_order_items pi ON pi.order_id::text = po.order_id::text
         WHERE po.order_id::text = ANY($1) AND po.company_id::text = $2`,
        [poIds, companyId],
      );
      for (const row of poRows) {
        const key = row.order_id;
        if (!poMap.has(key)) {
          poMap.set(key, { orderId: key, status: row.status, approvedAt: row.approved_at, createdAt: row.created_at, items: [] });
        }
        if (row.product_id) {
          poMap.get(key).items.push({ productId: row.product_id, quantity: row.quantity });
        }
      }
    }

    const grnMap = new Map<string, any>();
    if (poIds.length > 0) {
      const grns = await this.dataSource.query(
        `SELECT grn.grn_id, grn.grn_number, grn.grn_date, grn.order_id,
                gi.product_id, gi.accepted_quantity
         FROM goods_receipt_notes grn
         LEFT JOIN goods_receipt_note_items gi ON gi.grn_id::text = grn.grn_id::text
         WHERE grn.order_id::text = ANY($1) AND grn.company_id::text = $2`,
        [poIds, companyId],
      );
      for (const grn of grns) {
        const key = `${grn.order_id}___${grn.product_id}`;
        const existing = grnMap.get(key);
        if (!existing || new Date(grn.grn_date) > new Date(existing.grn_date)) {
          grnMap.set(key, grn);
        }
      }
    }

    const prodMap = new Map<string, any>();
    if (productIds.length > 0) {
      const jobs = await this.dataSource.query(
        `SELECT job_id, product_id, order_qty, final_produced_qty, status, closing_date
         FROM production_jobs
         WHERE product_id::text = ANY($1) AND company_id::text = $2
         ORDER BY created_at DESC`,
        [productIds, companyId],
      );
      for (const job of jobs) {
        if (!prodMap.has(job.product_id)) {
          prodMap.set(job.product_id, job);
        }
      }
    }

    const data = plans.map((plan) => {
      const po = poMap.get(plan.purchaseOrderId);
      const poItem = po?.items?.find((i: any) => i.productId === plan.productId);
      const poQty = poItem ? Number(poItem.quantity) : Number(plan.plannedQty);
      const poApproved = po && (po.status === 'approved' || po.status === 'planned' || po.status === 'partially_planned' || po.status === 'partially_received' || po.status === 'received');

      const grnKey = `${plan.purchaseOrderId}___${plan.productId}`;
      const grnData = grnMap.get(grnKey);
      const receivedQty = Number(plan.totalReceivedQty) || 0;
      const grnComplete = receivedQty >= Number(plan.plannedQty);

      const prodJob = prodMap.get(plan.productId);
      const producedQty = prodJob ? Number(prodJob.final_produced_qty) : 0;
      const prodComplete = prodJob?.status === 'completed';

      return {
        planId: plan.planId,
        planNumber: plan.planNumber,
        productId: plan.productId,
        productName: plan.productName,
        poNumber: plan.poNumber,
        plan: {
          status: 'complete',
          qty: Number(plan.plannedQty),
          label: `${Number(plan.plannedQty)} planned`,
        },
        poStatus: {
          status: poApproved ? 'complete' : 'pending',
          qty: poQty,
          date: po?.approvedAt || po?.createdAt || null,
          label: `${poQty} PO qty`,
        },
        grn: {
          status: grnComplete ? 'complete' : 'pending',
          qty: receivedQty,
          date: grnData?.grn_date || null,
          label: `${receivedQty} recvd`,
        },
        production: {
          status: prodComplete ? 'complete' : 'pending',
          qty: producedQty,
          date: prodJob?.closing_date || null,
          label: `${producedQty} prod`,
        },
      };
    });

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  private async generateBulkGrnId(companyId?: string, manager?: EntityManager): Promise<string> {
    return generateDocumentNumber({
      manager: manager || this.dataSource.manager,
      prefix: 'RCPT',
      table: 'goods_receipt_notes',
      column: 'grn_number',
    });
  }
}
