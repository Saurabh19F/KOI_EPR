import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, In } from 'typeorm';
import { ReceivingPlan, ReceivingPlanStatus } from './entities/receiving-plan.entity';
import { PurchaseOrder, PurchaseOrderStatus, PurchaseOrderItem, GoodsReceiptNote, GoodsReceiptNoteItem } from '../purchase-order/entities/purchase-order.entity';
import { User } from '../users/entities/user.entity';
import { Warehouse } from '../masters/entities/warehouse.entity';
import { InventoryService } from '../inventory/inventory.service';
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

    return {
      data,
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
        `SELECT * FROM receiving_plans WHERE plan_id = $1 AND company_id = $2 FOR UPDATE`,
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

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return hash;
  }

  async generatePlanNumber(companyId?: string, manager?: EntityManager): Promise<string> {
    const repo = manager || this.dataSource.manager;

    const lockKey = companyId ? Math.abs(this.hashCode(companyId)) : 0;
    await repo.query('SELECT pg_advisory_xact_lock($1)', [lockKey]);

    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const fy = `${currentYear}-${nextYear.toString().slice(-2)}`;

    const result = await repo.query(
      `SELECT plan_number FROM receiving_plans WHERE ($1::text IS NULL OR company_id = $1) ORDER BY created_at DESC LIMIT 1`,
      [companyId || null],
    );

    let nextNumber = 1;
    if (result.length > 0) {
      const parts = result[0].plan_number.split('/');
      const numPart = parts[parts.length - 1];
      const parsed = parseInt(numPart, 10);
      if (!isNaN(parsed)) nextNumber = parsed + 1;
    }

    return `PLAN/${fy}/${nextNumber.toString().padStart(5, '0')}`;
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
        `SELECT * FROM receiving_plans WHERE plan_id = $1 AND company_id = $2 FOR UPDATE`,
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
          );
        } catch (stockErr) {
          this.logger.error(`Stock update failed for GRN ${grnNumber}: ${stockErr.message}`, stockErr.stack);
        }
      }

      return savedGrn;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
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

  async generateGrnNumber(companyId?: string, manager?: EntityManager): Promise<string> {
    const repo = manager || this.dataSource.manager;

    const lockKey = companyId ? Math.abs(this.hashCode(`grn_${companyId}`)) : 1;
    await repo.query('SELECT pg_advisory_xact_lock($1)', [lockKey]);

    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const fy = `${currentYear}-${nextYear.toString().slice(-2)}`;

    const result = await repo.query(
      `SELECT grn_number FROM goods_receipt_notes WHERE ($1::text IS NULL OR company_id = $1) ORDER BY created_at DESC LIMIT 1`,
      [companyId || null],
    );

    let nextNumber = 1;
    if (result.length > 0) {
      const parts = result[0].grn_number.split('/');
      const numPart = parts[parts.length - 1];
      const parsed = parseInt(numPart, 10);
      if (!isNaN(parsed)) nextNumber = parsed + 1;
    }

    return `GRN/${fy}/${nextNumber.toString().padStart(5, '0')}`;
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
          `SELECT * FROM receiving_plans WHERE plan_id = $1 AND company_id = $2 FOR UPDATE`,
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

        const grn = queryRunner.manager.create(GoodsReceiptNote, {
          grnNumber: masterReceiptId,
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
        const planRows = await this.dataSource.query(
          `SELECT * FROM receiving_plans WHERE plan_id = $1 AND company_id = $2`,
          [item.planId, companyId],
        );
        if (planRows?.[0]) {
          const plan = planRows[0];
          const acceptedQty = item.receivedQty - (item.rejectedQty || 0);
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
                  referenceId: masterReceiptId,
                  referenceNo: masterReceiptId,
                  remarks: `Bulk GRN ${masterReceiptId} against plan ${plan.plan_number}`,
                  companyId,
                },
              );
            } catch (stockErr) {
              this.logger.error(`Stock update failed for bulk GRN item ${item.planId}: ${stockErr.message}`);
            }
          }
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
          `SELECT * FROM receiving_plans WHERE plan_id = $1 AND company_id = $2 FOR UPDATE`,
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

        const grn = queryRunner.manager.create(GoodsReceiptNote, {
          grnNumber: multiReceiptId,
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

      // Record stock movements outside transaction
      for (const v of validatedItems) {
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
                referenceId: multiReceiptId,
                referenceNo: multiReceiptId,
                remarks: `Multi-GRN ${multiReceiptId} against plan ${v.plan.plan_number}`,
                companyId,
              },
            );
          } catch (stockErr) {
            this.logger.error(`Stock update failed for multi GRN item ${v.item.planId}: ${stockErr.message}`);
          }
        }
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

      const poItem = po.items?.find((i) => i.productId === dto.productId && i.isActive && !i.noNeed);
      if (!poItem) {
        throw new NotFoundException(`Product ${dto.productId} is not an active item on PO ${po.orderNumber}`);
      }

      const orderedQty = Number(poItem.quantity || 0);
      const existingPlans = await queryRunner.manager.find(ReceivingPlan, {
        where: { purchaseOrderId: dto.poId, productId: dto.productId, companyId },
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
        where: { id: In(warehouseIds), companyId, isActive: true },
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
          productId: poItem.productId,
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
    ];

    const poQuery = this.dataSource
      .getRepository(PurchaseOrder)
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.items', 'item', 'item.isActive = true AND item.noNeed = false')
      .where('po.companyId = :companyId', { companyId })
      .andWhere('po.isActive = true')
      .andWhere('po.status IN (:...statuses)', { statuses: statusesToShow });

    if (filters?.search) {
      poQuery.andWhere(
        '(po.orderNumber ILIKE :search OR item.productName ILIKE :search OR po.vendorName ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (user.warehouseId) {
      poQuery.andWhere('(po.location = :warehouseId OR po.location IS NULL OR po.location = :empty)', {
        warehouseId: user.warehouseId,
        empty: '',
      });
    }

    poQuery.orderBy('po.createdAt', 'DESC');
    poQuery.skip(offset).take(limit);

    const purchaseOrders = await poQuery.getMany();

    const poIds = purchaseOrders.map((po) => po.orderId);

    let existingPlans: ReceivingPlan[] = [];
    if (poIds.length > 0) {
      existingPlans = await this.receivingPlanRepository.find({
        where: { purchaseOrderId: In(poIds), companyId },
      });
    }

    const plannedQtyMap = new Map<string, number>();
    for (const plan of existingPlans) {
      if (plan.status === ReceivingPlanStatus.CANCELLED) continue;
      const key = `${plan.purchaseOrderId}___${plan.productId}`;
      const existing = plannedQtyMap.get(key) || 0;
      plannedQtyMap.set(key, existing + Number(plan.plannedQty));
    }

    const pendingPOs: any[] = [];
    let totalOrderCount = 0;
    let unplannedOrderCount = 0;

    for (const po of purchaseOrders) {
      if (!po.items?.length) continue;

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
          salesPerson: po.salesPersonName || '',
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

  private async generateBulkGrnId(companyId?: string, manager?: EntityManager): Promise<string> {
    const repo = manager || this.dataSource.manager;
    const digits = String(Math.floor(10000 + Math.random() * 90000));
    return `RCPT-${digits}`;
  }
}
