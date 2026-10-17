import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DataSource, EntityManager } from 'typeorm';
import { ReceivingPlan, ReceivingPlanStatus } from '../../receiving-plan/entities/receiving-plan.entity';
import { QualityLog, QualityLogStatus } from '../../quality/entities/quality.entity';
import { RejectActionLog, RejectActionType, RejectActionStatus } from '../../quality/entities/quality.entity';
import { PurchaseIndentItem, IndentStatus } from '../../purchase/entities/purchase-indent.entity';
import { StockTransfer, StockTransferItem, StockValuation, InventoryBatch, ValuationMethod } from '../../inventory/entities';
import { PurchaseOrder, PurchaseOrderItem } from '../../purchase-order/entities/purchase-order.entity';
import { ProductionJob, ProductionJobStatus, ProductionMaterialClosure } from '../../production/entities/production.entity';
import { Warehouse } from '../../masters/entities/warehouse.entity';
import { generateDocumentNumber } from '../../../common/utils/document-number.util';

@Injectable()
export class WorkflowLinkageListener {
  private readonly logger = new Logger(WorkflowLinkageListener.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Linkage 1: Receiving Plan → GRN
   * When a GRN is created, find matching receiving plans for the same PO + product
   * and update their received quantities.
   */
  @OnEvent('grn.created')
  async handleGrnCreated(payload: {
    grnId: string;
    orderId: string;
    planId?: string;
    companyId: string;
    items: Array<{ productId: string; acceptedQuantity: number }>;
  }) {
    try {
      for (const item of payload.items) {
        const plan = await this.dataSource.manager.findOne(ReceivingPlan, {
          where: {
            purchaseOrderId: payload.orderId,
            productId: item.productId,
            companyId: payload.companyId,
            status: ReceivingPlanStatus.PENDING,
          },
        });

        if (!plan) {
          const partialPlan = await this.dataSource.manager.findOne(ReceivingPlan, {
            where: {
              purchaseOrderId: payload.orderId,
              productId: item.productId,
              companyId: payload.companyId,
              status: ReceivingPlanStatus.PARTIALLY_RECEIVED,
            },
          });
          if (partialPlan) {
            await this.updateReceivingPlan(partialPlan, item.acceptedQuantity);
          }
          continue;
        }

        await this.updateReceivingPlan(plan, item.acceptedQuantity);
      }

      if (payload.planId) {
        await this.dataSource.manager.update(
          'goods_receipt_notes',
          { grnId: payload.grnId },
          { planId: payload.planId },
        );
      }

      this.logger.log(`Linkage 1: Receiving plans updated for GRN ${payload.grnId}`);
    } catch (error) {
      this.logger.error(`Failed to update receiving plans for GRN ${payload.grnId}:`, error);
    }
  }

  private async updateReceivingPlan(plan: ReceivingPlan, receivedQty: number) {
    const newTotal = Number(plan.totalReceivedQty) + receivedQty;
    let newStatus = plan.status;

    if (newTotal >= Number(plan.plannedQty)) {
      newStatus = ReceivingPlanStatus.RECEIVED;
    } else if (newTotal > 0) {
      newStatus = ReceivingPlanStatus.PARTIALLY_RECEIVED;
    }

    await this.dataSource.manager.update(ReceivingPlan, plan.planId, {
      totalReceivedQty: newTotal,
      status: newStatus,
    });
  }

  /**
   * Linkage 2: Production → Stock Transfer (Material Requisition)
   * When a production job starts, create a stock transfer request
   * to move raw materials from the warehouse to the production floor.
   */
  @OnEvent('production.job.started')
  async handleProductionJobStarted(payload: {
    jobId: string;
    jobNumber: string;
    productId: string;
    productName: string;
    warehouseId: string;
    warehouseName: string;
    orderQty: number;
    companyId: string;
    userId: string;
  }) {
    try {
      const existing = await this.dataSource.manager.findOne(StockTransfer, {
        where: { productionId: payload.jobId, companyId: payload.companyId },
      });
      if (existing) {
        this.logger.log(`Stock transfer already exists for job ${payload.jobNumber}, skipping`);
        return;
      }

      const currentYear = new Date().getFullYear();
      const fy = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
      const rand = Math.floor(1000 + Math.random() * 9000);
      const transferNumber = `ST/${fy}/MR-${rand}`;

      const transfer = this.dataSource.manager.create(StockTransfer, {
        transferNumber,
        transferDate: new Date(),
        sourceWarehouseId: payload.warehouseId,
        sourceWarehouseName: payload.warehouseName,
        destinationWarehouseId: payload.warehouseId,
        destinationWarehouseName: `${payload.warehouseName} - Production Floor`,
        productionId: payload.jobId,
        requestType: 'material_requisition',
        finalProductId: payload.productId,
        finalProductName: payload.productName,
        referenceNumber: payload.jobNumber,
        requestRemarks: `Material requisition for production job ${payload.jobNumber}`,
        requestedByUsername: payload.userId,
        status: 'pending',
        totalQuantity: payload.orderQty,
        companyId: payload.companyId,
        createdBy: payload.userId,
      });

      await this.dataSource.manager.save(transfer);
      this.logger.log(`Linkage 2: Stock transfer ${transferNumber} created for production job ${payload.jobNumber}`);
    } catch (error) {
      this.logger.error(`Failed to create stock transfer for job ${payload.jobId}:`, error);
    }
  }

  /**
   * Linkage 3: Production → Quality
   * When a production job is completed/closed, auto-create a quality
   * inspection log for the finished goods.
   */
  @OnEvent('production.job.completed')
  async handleProductionJobCompleted(payload: {
    jobId: string;
    jobNumber: string;
    productId: string;
    productName: string;
    warehouseId: string;
    warehouseName: string;
    finalProducedQty: number;
    companyId: string;
    userId: string;
  }) {
    try {
      const existing = await this.dataSource.manager.findOne(QualityLog, {
        where: { productionJobId: payload.jobId, companyId: payload.companyId },
      });
      if (existing) {
        this.logger.log(`QC inspection already exists for job ${payload.jobNumber}, skipping`);
        return;
      }

      const rand = Math.floor(1000 + Math.random() * 9000);
      const qcNumber = `QC-${rand}`;

      const qcLog = this.dataSource.manager.create(QualityLog, {
        qcNumber,
        companyId: payload.companyId,
        productionJobId: payload.jobId,
        dateRequested: new Date(),
        warehouseId: payload.warehouseId,
        warehouseName: payload.warehouseName,
        productId: payload.productId,
        productName: payload.productName,
        qtyToInspect: payload.finalProducedQty,
        qtyApproved: 0,
        qtyRejected: 0,
        status: QualityLogStatus.PENDING,
        remarks: `Auto-created QC inspection for completed production job ${payload.jobNumber}`,
        createdBy: payload.userId,
      });

      await this.dataSource.manager.save(qcLog);
      this.logger.log(`Linkage 3: QC inspection ${qcNumber} created for completed job ${payload.jobNumber}`);
    } catch (error) {
      this.logger.error(`Failed to create QC inspection for job ${payload.jobId}:`, error);
    }
  }

  /**
   * Linkage 4: Reject → Replacement PO (Purchase Indent)
   * When a reject action with REPLACEMENT type is created,
   * auto-create a purchase indent for the replacement material.
   */
  @OnEvent('quality.reject.replacement')
  async handleRejectReplacement(payload: {
    actionId: string;
    actionNumber: string;
    purchaseOrderId: string;
    poNumber: string;
    productId: string;
    productName: string;
    rejectedQty: number;
    companyId: string;
    userId: string;
  }) {
    try {
      const existing = await this.dataSource.manager.findOne(PurchaseIndentItem, {
        where: {
          remarks: `Replacement indent for reject action ${payload.actionNumber}`,
          companyId: payload.companyId,
        },
      });
      if (existing) {
        this.logger.log(`Replacement indent already exists for reject ${payload.actionNumber}, skipping`);
        return;
      }

      const indent = this.dataSource.manager.create(PurchaseIndentItem, {
        companyId: payload.companyId,
        orderNo: payload.poNumber,
        productId: payload.productId,
        productName: payload.productName,
        quantity: payload.rejectedQty,
        indentStatus: IndentStatus.PENDING,
        isIndentRaised: false,
        remarks: `Replacement indent for reject action ${payload.actionNumber}`,
        createdBy: payload.userId,
      });

      await this.dataSource.manager.save(indent);
      this.logger.log(`Linkage 4: Replacement indent created for reject action ${payload.actionNumber}`);
    } catch (error) {
      this.logger.error(`Failed to create replacement indent for reject ${payload.actionId}:`, error);
    }
  }

  /**
   * Linkage 5: Quality Approved → Stock (Finished Goods)
   * When a quality inspection approves goods, auto-create an inventory
   * batch to move the approved quantity into finished goods stock.
   */
  @OnEvent('quality.inspection.approved')
  async handleInspectionApproved(payload: {
    qualityLogId: string;
    qcNumber: string;
    productionJobId: string;
    productId: string;
    productName: string;
    warehouseId: string;
    warehouseName: string;
    qtyApproved: number;
    companyId: string;
    userId: string;
  }) {
    try {
      const existing = await this.dataSource.manager.findOne(InventoryBatch, {
        where: {
          companyId: payload.companyId,
          productId: payload.productId,
          warehouseId: payload.warehouseId,
        },
      });

      if (existing) {
        const newQty = Number(existing.quantity) + payload.qtyApproved;
        await this.dataSource.manager.update(InventoryBatch, existing.batchId, {
          quantity: newQty,
          totalCost: newQty * Number(existing.unitCost),
          updatedBy: payload.userId,
        });
        this.logger.log(`Linkage 5: Updated batch ${existing.batchNumber} with ${payload.qtyApproved} approved units from QC ${payload.qcNumber}`);
        return;
      }

      const rand = Math.floor(10000 + Math.random() * 90000);
      const batchNumber = `FG-${payload.qcNumber}-${rand}`;

      const batch = this.dataSource.manager.create(InventoryBatch, {
        companyId: payload.companyId,
        batchNumber,
        productId: payload.productId,
        productName: payload.productName,
        warehouseId: payload.warehouseId,
        warehouseName: payload.warehouseName,
        quantity: payload.qtyApproved,
        unitCost: 0,
        totalCost: 0,
        createdBy: payload.userId,
      });

      await this.dataSource.manager.save(batch);
      this.logger.log(`Linkage 5: Inventory batch ${batchNumber} created for ${payload.qtyApproved} approved units from QC ${payload.qcNumber}`);
    } catch (error) {
      this.logger.error(`Failed to create inventory batch for QC ${payload.qualityLogId}:`, error);
    }
  }

  /**
   * Linkage 6: Purchase Order Approved → Receiving Plan
   * When a PO is approved, auto-create receiving plans for each item
   * so the planner can track expected receipts.
   */
  @OnEvent('purchase-order.approved')
  async handlePurchaseOrderApproved(payload: {
    orderId: string;
    companyId: string;
    userId: string;
  }) {
    try {
      const order = await this.dataSource.manager.findOne(PurchaseOrder, {
        where: { orderId: payload.orderId, companyId: payload.companyId },
        relations: ['items'],
      });

      if (!order) {
        this.logger.error(`Linkage 6: PO ${payload.orderId} not found, cannot create receiving plans`);
        return;
      }

      if (!order.items?.length) {
        this.logger.warn(`Linkage 6: PO ${order.orderNumber} has no items, skipping receiving plan creation`);
        return;
      }

      const existingPlans = await this.dataSource.manager.find(ReceivingPlan, {
        where: {
          purchaseOrderId: payload.orderId,
          companyId: payload.companyId,
        },
      });
      if (existingPlans.length > 0) {
        this.logger.log(`Linkage 6: Receiving plans already exist for PO ${order.orderNumber}, skipping`);
        return;
      }

      const warehouse = await this.dataSource.manager.getRepository(Warehouse)
        .createQueryBuilder('warehouse')
        .where('warehouse.isActive = :isActive', { isActive: true })
        .orderBy('warehouse.isDefault', 'DESC')
        .addOrderBy('warehouse.name', 'ASC')
        .getOne();

      if (!warehouse) {
        this.logger.error(`Linkage 6: No active warehouse found, cannot create receiving plans for PO ${order.orderNumber}`);
        return;
      }

      // One transaction for the whole batch: the plan-number generator takes a
      // transaction-scoped advisory lock, which only serialises against other
      // generators while the rows it hands out are still being inserted.
      const createdCount = await this.dataSource.transaction(async (manager) => {
        let created = 0;
        for (const item of order.items) {
          if (!item.isActive || item.noNeed) continue;
          if (!item.productId) continue;

          const qty = Number(item.quantity || 0);
          if (qty <= 0) continue;

          const planNumber = await this.generatePlanNumber(manager);

          const plan = manager.create(ReceivingPlan, {
            planNumber,
            companyId: payload.companyId,
            purchaseOrderId: payload.orderId,
            poNumber: order.orderNumber,
            productId: item.productId,
            productName: item.productName,
            warehouseId: warehouse.id,
            warehouseName: warehouse.name,
            plannedQty: qty,
            totalReceivedQty: 0,
            status: ReceivingPlanStatus.PENDING,
            plannedByUserId: payload.userId,
            plannedBy: payload.userId,
            remarks: `Auto-created from approved PO ${order.orderNumber}`,
            createdBy: payload.userId,
          });

          await manager.save(plan);
          created++;
        }
        return created;
      });

      if (createdCount > 0) {
        this.logger.log(`Linkage 6: ${createdCount} receiving plans created for approved PO ${order.orderNumber}`);
      } else {
        this.logger.warn(`Linkage 6: No eligible items found in PO ${order.orderNumber} (all items inactive, noNeed, or zero qty)`);
      }
    } catch (error) {
      this.logger.error(`Linkage 6 FAILED for PO ${payload.orderId}: ${error.message}`, error.stack);
    }
  }

  /**
   * Linkage 7: GRN Rejected Items → Auto-create RejectActionLog
   * When a GRN records rejected quantities, auto-create a reject action log.
   */
  @OnEvent('grn.items.rejected')
  async handleGrnItemsRejected(payload: {
    grnId: string;
    grnNumber: string;
    receiptId: string;
    purchaseOrderId: string;
    poNumber: string;
    productId: string;
    productName: string;
    rejectedQty: number;
    companyId: string;
    userId: string;
  }) {
    try {
      const existing = await this.dataSource.manager.findOne(RejectActionLog, {
        where: {
          receiptId: payload.grnId,
          productId: payload.productId,
          companyId: payload.companyId,
        },
      });
      if (existing) {
        this.logger.log(`Reject action already exists for GRN ${payload.grnNumber} product ${payload.productId}, skipping`);
        return;
      }

      const rand = Math.floor(1000 + Math.random() * 9000);
      const actionNumber = `REJECT-${rand}`;

      const rejectAction = this.dataSource.manager.create(RejectActionLog, {
        actionNumber,
        companyId: payload.companyId,
        receiptId: payload.grnId,
        purchaseOrderId: payload.purchaseOrderId,
        poNumber: payload.poNumber,
        productId: payload.productId,
        productName: payload.productName,
        rejectedQty: payload.rejectedQty,
        actionType: RejectActionType.RETURN_TO_VENDOR,
        actionDate: new Date(),
        status: RejectActionStatus.PENDING,
        createdBy: payload.userId,
      });

      await this.dataSource.manager.save(rejectAction);
      this.logger.log(`Linkage 7: Reject action ${actionNumber} auto-created for GRN ${payload.grnNumber} (${payload.rejectedQty} units rejected)`);
    } catch (error) {
      this.logger.error(`Failed to auto-create reject action for GRN ${payload.grnId}:`, error);
    }
  }

  /**
   * Linkage 8: Reject Resolution (Replacement) → Update PO Expected Delivery Date
   * When a reject action is resolved with replacement expected, update the PO ETA.
   */
  @OnEvent('reject.resolution.replacement')
  async handleRejectResolutionReplacement(payload: {
    actionId: string;
    purchaseOrderId: string;
    replacementEta: Date;
    companyId: string;
    userId: string;
  }) {
    try {
      const po = await this.dataSource.manager.findOne(PurchaseOrder, {
        where: { orderId: payload.purchaseOrderId, companyId: payload.companyId },
      });

      if (!po) {
        this.logger.error(`Linkage 8: PO ${payload.purchaseOrderId} not found for company ${payload.companyId}`);
        return;
      }

      await this.dataSource.manager.update(PurchaseOrder,
        { orderId: payload.purchaseOrderId, companyId: payload.companyId },
        { expectedDeliveryDate: payload.replacementEta, updatedBy: payload.userId },
      );

      this.logger.log(`Linkage 8: PO ${po.orderNumber} expectedDeliveryDate updated to ${payload.replacementEta} from reject resolution`);
    } catch (error) {
      this.logger.error(`Failed to update PO ETA for reject ${payload.actionId}:`, error);
    }
  }

  /**
   * Linkage 9: Reject Resolution (No Replacement) → Close Receiving Plan
   * When a reject action is resolved with no replacement, cancel the receiving plan.
   */
  @OnEvent('reject.resolution.no-replacement')
  async handleRejectResolutionNoReplacement(payload: {
    actionId: string;
    purchaseOrderId: string;
    productId: string;
    companyId: string;
    userId: string;
  }) {
    try {
      const plans = await this.dataSource.manager.find(ReceivingPlan, {
        where: {
          purchaseOrderId: payload.purchaseOrderId,
          productId: payload.productId,
          companyId: payload.companyId,
          status: ReceivingPlanStatus.PENDING,
        },
      });

      if (!plans.length) {
        this.logger.log(`Linkage 9: No pending receiving plans for PO ${payload.purchaseOrderId} product ${payload.productId}`);
        return;
      }

      for (const plan of plans) {
        await this.dataSource.manager.update(ReceivingPlan, plan.planId, {
          status: ReceivingPlanStatus.CANCELLED,
          updatedBy: payload.userId,
        });
      }

      this.logger.log(`Linkage 9: ${plans.length} receiving plan(s) cancelled for PO ${payload.purchaseOrderId} (no replacement)`);
    } catch (error) {
      this.logger.error(`Failed to cancel receiving plans for reject ${payload.actionId}:`, error);
    }
  }

  /**
   * Linkage 10: Stock Transfer Received → Update Production Job Status
   * When all material transfers for a production job are received,
   * transition the job to READY_FOR_PRODUCTION.
   */
  @OnEvent('stock-transfer.received')
  async handleStockTransferReceived(payload: {
    transferId: string;
    productionId: string;
    destinationWarehouseId: string;
    companyId: string;
    userId: string;
  }) {
    try {
      const job = await this.dataSource.manager.findOne(ProductionJob, {
        where: { jobId: payload.productionId, companyId: payload.companyId },
      });

      if (!job) {
        this.logger.log(`Linkage 10: Production job ${payload.productionId} not found for company ${payload.companyId}, skipping`);
        return;
      }

      if (job.status !== ProductionJobStatus.WAITING_FOR_MATERIAL) {
        this.logger.log(`Linkage 10: Job ${job.jobNumber} is ${job.status}, not WAITING_FOR_MATERIAL, skipping auto-transition`);
        return;
      }

      const pendingTransfers = await this.dataSource.manager.find(StockTransfer, {
        where: {
          productionId: payload.productionId,
          companyId: payload.companyId,
        },
      });

      const allReceived = pendingTransfers.every(
        (t) => t.status === 'received' || t.status === 'cancelled',
      );

      if (!allReceived) {
        this.logger.log(`Linkage 10: Not all transfers received for job ${job.jobNumber}, keeping WAITING_FOR_MATERIAL`);
        return;
      }

      await this.dataSource.manager.update(ProductionJob,
        { jobId: job.jobId, companyId: payload.companyId },
        { status: ProductionJobStatus.READY_FOR_PRODUCTION, updatedBy: payload.userId },
      );

      this.logger.log(`Linkage 10: Job ${job.jobNumber} transitioned to READY_FOR_PRODUCTION (all materials received)`);
    } catch (error) {
      this.logger.error(`Failed to update job status for transfer ${payload.transferId}:`, error);
    }
  }

  /**
   * Linkage 11: Production Job Completed → Process Material Closures for Stock
   * When a production job is closed and has material closures,
   * deduct used materials and return unused materials to source warehouse.
   */
  @OnEvent('production.job.completed')
  async handleProductionJobMaterialClosures(payload: {
    jobId: string;
    jobNumber: string;
    productId: string;
    warehouseId: string;
    companyId: string;
    userId: string;
    materialClosures?: Array<{
      materialId: string;
      materialName: string;
      usedQty: number;
      returnedQty: number;
      sourceWarehouseId: string;
      productionWarehouseId: string;
    }>;
  }) {
    if (!payload.materialClosures?.length) return;

    try {
      for (const closure of payload.materialClosures) {
        if (closure.usedQty > 0) {
          await this.adjustStockValuation(
            closure.materialId,
            closure.productionWarehouseId,
            -closure.usedQty,
          );
          this.logger.log(`Linkage 11: Deducted ${closure.usedQty} of ${closure.materialName} from production warehouse for job ${payload.jobNumber}`);
        }

        if (closure.returnedQty > 0) {
          await this.adjustStockValuation(
            closure.materialId,
            closure.sourceWarehouseId,
            closure.returnedQty,
          );
          await this.adjustStockValuation(
            closure.materialId,
            closure.productionWarehouseId,
            -closure.returnedQty,
          );
          this.logger.log(`Linkage 11: Returned ${closure.returnedQty} of ${closure.materialName} to source warehouse for job ${payload.jobNumber}`);
        }
      }

      this.logger.log(`Linkage 11: Material closures processed for job ${payload.jobNumber}`);
    } catch (error) {
      this.logger.error(`Failed to process material closures for job ${payload.jobId}:`, error);
    }
  }

  private async adjustStockValuation(
    productId: string,
    warehouseId: string,
    quantityChange: number,
  ): Promise<void> {
    let valuation = await this.dataSource.manager.findOne(StockValuation, {
      where: { productId, warehouseId },
    });

    if (!valuation) {
      valuation = this.dataSource.manager.create(StockValuation, {
        productId,
        warehouseId,
        warehouseName: '',
        quantity: 0,
        averageCost: 0,
        totalValue: 0,
        valuationMethod: ValuationMethod.AVERAGE,
      });
      await this.dataSource.manager.save(valuation);
    }

    const newQty = Number(valuation.quantity) + quantityChange;
    const avgCost = Number(valuation.averageCost);

    await this.dataSource.manager.update(StockValuation, valuation.valuationId, {
      quantity: Math.max(0, newQty),
      totalValue: Math.max(0, newQty) * avgCost,
    });
  }

  private async generatePlanNumber(manager: EntityManager): Promise<string> {
    return generateDocumentNumber({
      manager,
      prefix: 'PLAN',
      table: 'receiving_plans',
      column: 'plan_number',
    });
  }
}
