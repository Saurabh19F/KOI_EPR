import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import {
  OrderReviewDraft,
  OrderFinalSubmission,
  OrderReviewLog,
  OrderItemTask,
  OrderTaskEmailLog,
  OrderItemCancellation,
  OrderClosure,
  ReviewDraftStatus,
  TaskStatus,
  TaskEmailStatus,
  OrderClosureStatus,
} from './entities/order-review.entity';
import { SalesOrder, SalesOrderItem } from '../sales-order/entities/sales-order.entity';
import { Department } from '../users/entities/department.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class OrderReviewService {
  private readonly logger = new Logger(OrderReviewService.name);

  constructor(
    @InjectRepository(OrderReviewDraft)
    private readonly draftRepo: Repository<OrderReviewDraft>,
    @InjectRepository(OrderFinalSubmission)
    private readonly submissionRepo: Repository<OrderFinalSubmission>,
    @InjectRepository(OrderReviewLog)
    private readonly logRepo: Repository<OrderReviewLog>,
    @InjectRepository(OrderItemTask)
    private readonly taskRepo: Repository<OrderItemTask>,
    @InjectRepository(OrderTaskEmailLog)
    private readonly emailLogRepo: Repository<OrderTaskEmailLog>,
    @InjectRepository(OrderItemCancellation)
    private readonly cancellationRepo: Repository<OrderItemCancellation>,
    @InjectRepository(OrderClosure)
    private readonly closureRepo: Repository<OrderClosure>,
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepo: Repository<SalesOrder>,
    @InjectRepository(SalesOrderItem)
    private readonly salesOrderItemRepo: Repository<SalesOrderItem>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  private requireCompanyId(companyId: string): asserts companyId is string {
    if (!companyId) throw new ForbiddenException('No company context');
  }

  private static readonly MANAGER_ROLES = ['ADMIN', 'SUPER_ADMIN', 'SALES_MANAGER', 'MANAGER'];

  private isManager(roles: string[]): boolean {
    return roles.some(r => OrderReviewService.MANAGER_ROLES.includes(r?.toUpperCase?.()));
  }

  private async assertOrderAccess(orderId: string, companyId: string, userId: string, roles: string[]): Promise<SalesOrder> {
    this.requireCompanyId(companyId);
    const qb = this.salesOrderRepo.createQueryBuilder('so')
      .where('so.orderId = :orderId AND so.companyId = :companyId', { orderId, companyId });
    if (!this.isManager(roles)) {
      qb.andWhere('(so.salesPersonId = :userId OR so.createdBy = :userId)', { userId });
    }
    const order = await qb.getOne();
    if (!order) throw new NotFoundException('Order not found or access denied');
    return order;
  }

  private async filterAccessibleOrderIds(orderIds: string[], companyId: string, userId: string, roles: string[]): Promise<string[]> {
    this.requireCompanyId(companyId);
    if (orderIds.length === 0) return [];
    const qb = this.salesOrderRepo.createQueryBuilder('so')
      .select('so.orderId')
      .where('so.orderId IN (:...orderIds) AND so.companyId = :companyId', { orderIds, companyId });
    if (!this.isManager(roles)) {
      qb.andWhere('(so.salesPersonId = :userId OR so.createdBy = :userId)', { userId });
    }
    const orders = await qb.getMany();
    return orders.map(o => o.orderId);
  }

  // ──────────────────────────────────────────────────────────
  // 0. Batch: load items for multiple orders at once
  // ──────────────────────────────────────────────────────────

  async getBatchOrderItems(orderIds: string[], companyId: string, userId: string, roles: string[] = []) {
    this.requireCompanyId(companyId);
    if (!Array.isArray(orderIds) || orderIds.length === 0) return {};
    if (orderIds.length > 50) throw new BadRequestException('Too many order IDs (max 50)');
    const accessible = await this.filterAccessibleOrderIds(orderIds, companyId, userId, roles);
    const result: Record<string, any> = {};
    for (const orderId of accessible) {
      result[orderId] = await this.loadOrderItems(orderId, companyId);
    }
    return result;
  }

  // ──────────────────────────────────────────────────────────
  // 0b. Order Summary + Lifecycle Journey
  // ──────────────────────────────────────────────────────────

  async getOrderLifecycle(orderIds: string[], companyId: string, userId: string, roles: string[] = []) {
    this.requireCompanyId(companyId);
    if (!Array.isArray(orderIds) || orderIds.length === 0) return null;
    if (orderIds.length > 50) throw new BadRequestException('Too many order IDs (max 50)');
    orderIds = await this.filterAccessibleOrderIds(orderIds, companyId, userId, roles);

    const items = await this.salesOrderItemRepo.find({
      where: { orderId: In(orderIds), companyId },
    });

    const orders = await this.salesOrderRepo.find({
      where: { orderId: In(orderIds), companyId },
    });
    const orderNumbers = orders.map(o => o.orderNumber).filter(Boolean);

    const allDrafts = await this.draftRepo
      .createQueryBuilder('d')
      .where('d.orderId IN (:...orderIds)', { orderIds })
      .andWhere('d.companyId = :companyId', { companyId })
      .orderBy('d.draftVersion', 'DESC')
      .getMany();

    const latestDraftByItem = new Map<string, OrderReviewDraft>();
    for (const d of allDrafts) {
      if (!latestDraftByItem.has(d.itemId)) {
        latestDraftByItem.set(d.itemId, d);
      }
    }

    const cancellations = await this.cancellationRepo.find({
      where: { orderId: In(orderIds), companyId, isRestored: false },
    });
    const cancelledItemIds = new Set(cancellations.map(c => c.itemId));

    const activeItems = items.filter(i => !cancelledItemIds.has(i.itemId));
    const totalItems = activeItems.length;

    let totalCarton = 0;
    let totalAutoCbm = 0;
    let totalNetWeight = 0;
    let grossWeight = 0;

    for (const item of activeItems) {
      const draft = latestDraftByItem.get(item.itemId);
      const qty = Number(draft?.reviewQuantity || item.quantity || 0);
      const unitCbm = Number((item as any).cbmPerBox || 0);
      const unitWt = Number((item as any).weight || 0);

      totalCarton += qty;
      totalAutoCbm += qty * unitCbm;
      const net = qty * unitWt;
      totalNetWeight += net;
      grossWeight += net + ((item as any).categoryName ? 2 : 0);
    }

    let indentComplete = 0;
    let poComplete = 0;
    for (const item of activeItems) {
      const draft = latestDraftByItem.get(item.itemId);
      if (draft?.indentDate) indentComplete++;
      if (draft?.poNumber) poComplete++;
    }

    let receivedCount = 0;
    const poNumbers = [...new Set(
      Array.from(latestDraftByItem.values())
        .filter(d => d.poNumber)
        .map(d => d.poNumber),
    )];
    if (poNumbers.length > 0) {
      const received: any[] = await this.dataSource.query(
        `SELECT DISTINCT rp.product_id FROM receiving_plans rp
         WHERE rp.company_id = $1
         AND rp.po_number = ANY($2)
         AND rp.status IN ('partially_received', 'received')`,
        [companyId, poNumbers],
      );
      receivedCount = received.length;
    }

    let producedCount = 0;
    let totalProduced = 0;
    if (orderNumbers.length > 0) {
      const prodJobs: any[] = await this.dataSource.query(
        `SELECT product_id, final_produced_qty, status FROM production_jobs
         WHERE company_id = $1
         AND order_no = ANY($2)
         AND status != 'cancelled'`,
        [companyId, orderNumbers],
      );
      producedCount = prodJobs.filter(j =>
        j.status === 'completed' || Number(j.final_produced_qty) > 0,
      ).length;
      totalProduced = prodJobs.reduce((sum, j) => sum + Number(j.final_produced_qty || 0), 0);
    }

    const stageStatus = (completed: number, total: number) => {
      if (total === 0) return 'pending';
      if (completed >= total) return 'complete';
      if (completed > 0) return 'partial';
      return 'pending';
    };

    const stages = [
      { name: 'Sales Orders', status: 'complete', detail: `${orderIds.length} orders selected` },
      { name: 'Indent / Plan', status: stageStatus(indentComplete, totalItems), completed: indentComplete, total: totalItems, detail: `${indentComplete}/${totalItems} item(s) complete` },
      { name: 'Purchase Order', status: stageStatus(poComplete, totalItems), completed: poComplete, total: totalItems, detail: `${poComplete}/${totalItems} item(s) complete` },
      { name: 'Stock In / GRN', status: stageStatus(receivedCount, totalItems), completed: receivedCount, total: totalItems, detail: `${receivedCount} received` },
      { name: 'Production', status: stageStatus(producedCount, totalItems), completed: producedCount, total: totalItems, detail: `${producedCount} produced` },
    ];

    const completedStages = stages.filter(s => s.status === 'complete').length;

    return {
      summary: {
        totalProducts: totalItems,
        totalCarton: Math.round(totalCarton),
        totalAutoCbm: Number(totalAutoCbm.toFixed(3)),
        totalNetWeight: Number(totalNetWeight.toFixed(3)),
        grossWeight: Number(grossWeight.toFixed(3)),
        unitsProduced: Math.round(totalProduced),
      },
      stages,
      totalStages: 5,
      completedStages,
      remainingStages: 5 - completedStages,
      orderScope: `${totalItems} Products`,
    };
  }

  // ──────────────────────────────────────────────────────────
  // 1. Load orders for the review grid
  // ──────────────────────────────────────────────────────────

  async getOrdersForReview(companyId: string, userId: string, roles: string[] = [], filters?: { search?: string; status?: string }) {
    this.requireCompanyId(companyId);
    const qb = this.salesOrderRepo.createQueryBuilder('so')
      .where('so.isActive = true')
      .andWhere('so.companyId = :companyId', { companyId });

    if (!userId) throw new ForbiddenException('User context required');
    if (!this.isManager(roles)) {
      qb.andWhere('(so.salesPersonId = :userId OR so.createdBy = :userId)', { userId });
    }

    if (filters?.search) {
      qb.andWhere('(so.orderNumber ILIKE :search OR so.customerName ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    if (filters?.status) {
      qb.andWhere('so.status = :status', { status: filters.status });
    }

    qb.orderBy('so.orderDate', 'DESC');

    const orders = await qb.getMany();

    try {
      const salesPersonIds = [...new Set(orders.filter(o => o.salesPersonId && !o.salesPersonName).map(o => o.salesPersonId))];
      if (salesPersonIds.length > 0) {
        const users: any[] = await this.dataSource.query(
          `SELECT user_id, name FROM users WHERE user_id IN (${salesPersonIds.map((_, i) => `$${i + 1}`).join(',')})`,
          salesPersonIds,
        );
        const nameMap = new Map(users.map((u: any) => [u.user_id, u.name]));
        for (const order of orders) {
          if (!order.salesPersonName && order.salesPersonId) {
            (order as any).salesPersonName = nameMap.get(order.salesPersonId) || null;
          }
        }
      }
    } catch (err) {
      this.logger.warn('Failed to resolve sales person names', err);
    }

    return orders;
  }

  async getOrderItemsForReview(orderId: string, companyId: string, userId: string, roles: string[] = []) {
    this.requireCompanyId(companyId);
    await this.assertOrderAccess(orderId, companyId, userId, roles);
    return this.loadOrderItems(orderId, companyId);
  }

  private async loadOrderItems(orderId: string, companyId: string) {

    const items = await this.salesOrderItemRepo.find({
      where: { orderId, companyId },
      order: { lineNumber: 'ASC' },
    });

    const drafts = await this.draftRepo
      .createQueryBuilder('d')
      .where('d.orderId = :orderId', { orderId })
      .andWhere('d.companyId = :companyId', { companyId })
      .orderBy('d.draftVersion', 'DESC')
      .getMany();

    const submissions = await this.submissionRepo.find({ where: { orderId, companyId } });

    const cancellations = await this.cancellationRepo.find({ where: { orderId, companyId, isRestored: false } });

    const closure = await this.closureRepo.findOne({ where: { orderId, companyId } });

    const cancelledItemIds = new Set(cancellations.map(c => c.itemId));

    const latestDraftByItem = new Map<string, OrderReviewDraft>();
    for (const d of drafts) {
      if (!latestDraftByItem.has(d.itemId)) {
        latestDraftByItem.set(d.itemId, d);
      }
    }

    const submissionByItem = new Map<string, OrderFinalSubmission>();
    for (const s of submissions) {
      submissionByItem.set(s.itemId, s);
    }

    return {
      items: items.map(item => {
        const draft = latestDraftByItem.get(item.itemId);
        const submission = submissionByItem.get(item.itemId);
        return {
          ...item,
          isCancelled: cancelledItemIds.has(item.itemId),
          isLocked: submission?.isLocked ?? false,
          submissionCount: submission?.submissionCount ?? 0,
          reviewData: draft ? {
            poNumber: draft.poNumber,
            poDate: draft.poDate,
            indentDate: draft.indentDate,
            expectedDeliveryDate: draft.expectedDeliveryDate,
            reviewQuantity: draft.reviewQuantity,
            autoCbm: draft.autoCbm,
            autoNetWeight: draft.autoNetWeight,
            autoGrossWeight: draft.autoGrossWeight,
            finalDispatch: draft.finalDispatch,
            remarks: draft.remarks,
            draftVersion: draft.draftVersion,
          } : null,
        };
      }),
      closure: closure ? { status: closure.status, closedAt: closure.closedAt } : null,
    };
  }

  // ──────────────────────────────────────────────────────────
  // 2. Save draft (cumulative append)
  // ──────────────────────────────────────────────────────────

  async saveDraft(
    orderId: string,
    companyId: string,
    userId: string,
    userName: string,
    itemDrafts: Array<{
      itemId: string;
      lineNumber: number;
      productId?: string;
      productName: string;
      productCode?: string;
      categoryName?: string;
      soQuantity: number;
      unitCbm?: number;
      unitWeight?: number;
      purchasePersonName?: string;
      poNumber?: string;
      poDate?: Date;
      indentDate?: Date;
      expectedDeliveryDate?: Date;
      reviewQuantity?: number;
      finalDispatch?: string;
      remarks?: string;
    }>,
    roles: string[] = [],
  ) {
    this.requireCompanyId(companyId);
    const order = await this.assertOrderAccess(orderId, companyId, userId, roles);

    const latestDraft = await this.draftRepo
      .createQueryBuilder('d')
      .where('d.orderId = :orderId', { orderId })
      .andWhere('d.companyId = :companyId', { companyId })
      .orderBy('d.draftVersion', 'DESC')
      .getOne();

    const nextVersion = (latestDraft?.draftVersion ?? 0) + 1;

    const drafts: OrderReviewDraft[] = itemDrafts.map(item => {
      const draft = new OrderReviewDraft();
      draft.companyId = companyId;
      draft.orderId = orderId;
      draft.orderNumber = order.orderNumber;
      draft.itemId = item.itemId;
      draft.lineNumber = item.lineNumber;
      draft.productId = item.productId;
      draft.productName = item.productName;
      draft.productCode = item.productCode;
      draft.categoryName = item.categoryName;
      draft.soQuantity = item.soQuantity;
      draft.unitCbm = item.unitCbm;
      draft.unitWeight = item.unitWeight;
      draft.purchasePersonName = item.purchasePersonName;
      draft.poNumber = item.poNumber;
      draft.poDate = item.poDate;
      draft.indentDate = item.indentDate;
      draft.expectedDeliveryDate = item.expectedDeliveryDate;
      draft.reviewQuantity = item.reviewQuantity;
      draft.finalDispatch = item.finalDispatch;
      draft.remarks = item.remarks;
      draft.draftVersion = nextVersion;
      draft.savedBy = userId;
      draft.savedByName = userName;
      draft.status = ReviewDraftStatus.DRAFT;

      // Auto-calculations
      if (item.reviewQuantity != null && item.unitCbm != null) {
        draft.autoCbm = Number((item.reviewQuantity * item.unitCbm).toFixed(4));
      }
      if (item.reviewQuantity != null && item.unitWeight != null) {
        draft.autoNetWeight = Number((item.reviewQuantity * item.unitWeight).toFixed(3));
      }
      if (draft.autoNetWeight != null) {
        const extra = item.categoryName ? 2 : 0;
        draft.categoryExtraWeight = extra;
        draft.autoGrossWeight = Number((draft.autoNetWeight + extra).toFixed(3));
      }

      return draft;
    });

    await this.draftRepo.save(drafts);
    return { draftVersion: nextVersion, itemCount: drafts.length };
  }

  // ──────────────────────────────────────────────────────────
  // 3. Final submission
  // ──────────────────────────────────────────────────────────

  async submitFinal(
    orderId: string,
    companyId: string,
    userId: string,
    userName: string,
    itemIds: string[],
    roles: string[] = [],
  ) {
    const order = await this.assertOrderAccess(orderId, companyId, userId, roles);

    const results = [];

    await this.dataSource.transaction(async manager => {
      for (const itemId of itemIds) {
        let submission = await manager.findOne(OrderFinalSubmission, {
          where: { orderId, itemId, companyId },
        });

        if (submission?.isLocked) {
          throw new BadRequestException(
            `Item ${itemId} is locked after 2 submissions`,
          );
        }

        const latestDraft = await manager
          .createQueryBuilder(OrderReviewDraft, 'd')
          .where('d.orderId = :orderId AND d.itemId = :itemId', { orderId, itemId })
          .andWhere('d.companyId = :companyId', { companyId })
          .orderBy('d.draftVersion', 'DESC')
          .getOne();

        if (!latestDraft) {
          throw new BadRequestException(`No draft found for item ${itemId}`);
        }

        if (!submission) {
          submission = new OrderFinalSubmission();
          submission.companyId = companyId;
          submission.orderId = orderId;
          submission.orderNumber = order.orderNumber;
          submission.itemId = itemId;
          submission.lineNumber = latestDraft.lineNumber;
          submission.productName = latestDraft.productName;
          submission.submissionCount = 0;
        }

        submission.submissionCount += 1;

        if (submission.submissionCount >= 2) {
          submission.isLocked = true;
          submission.lockedAt = new Date();
          submission.lockedBy = userId;
        }

        await manager.save(OrderFinalSubmission, submission);

        latestDraft.status = ReviewDraftStatus.SUBMITTED;
        await manager.save(OrderReviewDraft, latestDraft);

        const log = new OrderReviewLog();
        log.companyId = companyId;
        log.orderId = orderId;
        log.orderNumber = order.orderNumber;
        log.itemId = itemId;
        log.lineNumber = latestDraft.lineNumber;
        log.productName = latestDraft.productName;
        log.submissionNumber = submission.submissionCount;
        log.submittedBy = userId;
        log.submittedByName = userName;
        log.submittedData = {
          poNumber: latestDraft.poNumber,
          poDate: latestDraft.poDate,
          indentDate: latestDraft.indentDate,
          expectedDeliveryDate: latestDraft.expectedDeliveryDate,
          reviewQuantity: latestDraft.reviewQuantity,
          autoCbm: latestDraft.autoCbm,
          autoNetWeight: latestDraft.autoNetWeight,
          autoGrossWeight: latestDraft.autoGrossWeight,
          finalDispatch: latestDraft.finalDispatch,
          remarks: latestDraft.remarks,
        };

        await manager.save(OrderReviewLog, log);
        results.push({ itemId, submissionNumber: submission.submissionCount, isLocked: submission.isLocked });
      }
    });

    return { orderId, results };
  }

  // ──────────────────────────────────────────────────────────
  // 4. Cancel / Restore item
  // ──────────────────────────────────────────────────────────

  async cancelItem(
    orderId: string,
    itemId: string,
    companyId: string,
    userId: string,
    userName: string,
    reason: string,
    roles: string[] = [],
  ) {
    const order = await this.assertOrderAccess(orderId, companyId, userId, roles);

    const existing = await this.cancellationRepo.findOne({ where: { orderId, itemId, companyId, isRestored: false } });
    if (existing) throw new BadRequestException('Item already cancelled');

    const item = await this.salesOrderItemRepo.findOne({ where: { itemId, orderId, companyId } });
    if (!item) throw new NotFoundException('Sales order item not found');

    const cancellation = new OrderItemCancellation();
    cancellation.companyId = companyId;
    cancellation.orderId = orderId;
    cancellation.orderNumber = order.orderNumber;
    cancellation.itemId = itemId;
    cancellation.lineNumber = item.lineNumber;
    cancellation.productName = item.productName;
    cancellation.cancellationReason = reason;
    cancellation.cancelledBy = userId;
    cancellation.cancelledByName = userName;

    await this.cancellationRepo.save(cancellation);
    return { cancelled: true, itemId };
  }

  async restoreItem(cancellationId: string, companyId: string, userId: string, roles: string[] = []) {
    this.requireCompanyId(companyId);
    const cancellation = await this.cancellationRepo.findOne({ where: { cancellationId, companyId } });
    if (!cancellation) throw new NotFoundException('Cancellation not found');
    if (cancellation.isRestored) throw new BadRequestException('Already restored');

    await this.assertOrderAccess(cancellation.orderId, companyId, userId, roles);

    cancellation.isRestored = true;
    cancellation.restoredAt = new Date();
    cancellation.restoredBy = userId;
    await this.cancellationRepo.save(cancellation);
    return { restored: true, itemId: cancellation.itemId };
  }

  // ──────────────────────────────────────────────────────────
  // 5. Order closure
  // ──────────────────────────────────────────────────────────

  async closeOrder(orderId: string, companyId: string, userId: string, userName: string, notes?: string, roles: string[] = []) {
    const order = await this.assertOrderAccess(orderId, companyId, userId, roles);

    let closure = await this.closureRepo.findOne({ where: { orderId, companyId } });
    if (closure?.status === OrderClosureStatus.CLOSED) {
      throw new BadRequestException('Order already closed');
    }

    if (!closure) {
      closure = new OrderClosure();
      closure.companyId = companyId;
      closure.orderId = orderId;
      closure.orderNumber = order.orderNumber;
    }

    closure.status = OrderClosureStatus.CLOSED;
    closure.closedBy = userId;
    closure.closedByName = userName;
    closure.closedAt = new Date();
    closure.closureNotes = notes;

    await this.closureRepo.save(closure);
    return { closed: true, orderId };
  }

  async reopenOrder(orderId: string, companyId: string, userId: string, reason: string, roles: string[] = []) {
    await this.assertOrderAccess(orderId, companyId, userId, roles);
    const closure = await this.closureRepo.findOne({ where: { orderId, companyId } });
    if (!closure || closure.status !== OrderClosureStatus.CLOSED) {
      throw new BadRequestException('Order is not closed');
    }

    closure.status = OrderClosureStatus.REOPENED;
    closure.reopenedBy = userId;
    closure.reopenedAt = new Date();
    closure.reopenReason = reason;

    await this.closureRepo.save(closure);
    return { reopened: true, orderId };
  }

  // ──────────────────────────────────────────────────────────
  // 6. Review logs (audit trail)
  // ──────────────────────────────────────────────────────────

  async getReviewLogs(orderId: string, companyId: string, userId: string, roles: string[] = []) {
    await this.assertOrderAccess(orderId, companyId, userId, roles);
    return this.logRepo.find({
      where: { orderId, companyId },
      order: { submittedAt: 'DESC' },
    });
  }

  async getSubmissionHistory(orderId: string, itemId: string, companyId: string, userId: string, roles: string[] = []) {
    await this.assertOrderAccess(orderId, companyId, userId, roles);
    return this.logRepo.find({
      where: { orderId, itemId, companyId },
      order: { submissionNumber: 'ASC' },
    });
  }

  async getLookupDepartments(companyId: string) {
    this.requireCompanyId(companyId);
    return this.departmentRepo.find({
      where: { companyId, isActive: true },
      order: { departmentName: 'ASC' },
    });
  }

  async getLookupUsers(companyId: string, departmentId?: string) {
    this.requireCompanyId(companyId);
    const where: any = { companyId, isActive: true };
    if (departmentId) where.departmentId = departmentId;
    return this.userRepo.find({
      where,
      select: ['userId', 'name', 'email', 'departmentId'],
      order: { name: 'ASC' },
    });
  }
}
