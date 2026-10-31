import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, ILike } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OnEvent } from '@nestjs/event-emitter';
import {
  QualityLog,
  QualityLogStatus,
  InspectionDecision,
  RejectActionLog,
  RejectActionStatus,
  RejectActionType,
} from './entities/quality.entity';
import {
  CreateQualityLogDto,
  UpdateQualityLogDto,
  CreateRejectActionLogDto,
  UpdateRejectActionLogDto,
} from './dto/quality.dto';
import { PaginatedResult } from '../../common/types';

@Injectable()
export class QualityService {
  private readonly logger = new Logger(QualityService.name);

  constructor(
    @InjectRepository(QualityLog)
    private qcRepo: Repository<QualityLog>,
    @InjectRepository(RejectActionLog)
    private rejectRepo: Repository<RejectActionLog>,
    private dataSource: DataSource,
    private eventEmitter: EventEmitter2,
  ) {}

  private generateQcNumber(): string {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `QC-${random}`;
  }

  private generateRejectNumber(): string {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `REJECT-${random}`;
  }

  // ========== QUALITY LOG ==========

  async createQualityLog(
    dto: CreateQualityLogDto,
    userId: string,
    companyId?: string,
  ): Promise<QualityLog> {
    const qcNumber = this.generateQcNumber();

    const qcLog = this.qcRepo.create({
      ...dto,
      qcNumber,
      companyId,
      status: QualityLogStatus.PENDING,
      createdBy: userId,
      updatedBy: userId,
    });

    return this.qcRepo.save(qcLog);
  }

  async findAllQualityLogs(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: QualityLogStatus;
    warehouseId?: string;
    productId?: string;
    companyId?: string;
  }): Promise<PaginatedResult<QualityLog>> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.qcRepo.createQueryBuilder('qc');

    if (params.companyId) {
      qb.andWhere('qc.companyId = :companyId', { companyId: params.companyId });
    }

    if (params.status) {
      qb.andWhere('qc.status = :status', { status: params.status });
    }

    if (params.warehouseId) {
      qb.andWhere('qc.warehouseId = :warehouseId', { warehouseId: params.warehouseId });
    }

    if (params.productId) {
      qb.andWhere('qc.productId = :productId', { productId: params.productId });
    }

    if (params.search) {
      qb.andWhere(
        '(qc.qcNumber ILIKE :search OR qc.productName ILIKE :search OR qc.warehouseName ILIKE :search)',
        { search: `%${params.search}%` },
      );
    }

    qb.orderBy('qc.createdAt', 'DESC');
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findQualityLogById(id: string): Promise<QualityLog> {
    const qcLog = await this.qcRepo.findOne({ where: { qcId: id } });
    if (!qcLog) {
      throw new NotFoundException(`Quality log ${id} not found`);
    }
    return qcLog;
  }

  async updateInspection(
    id: string,
    dto: UpdateQualityLogDto,
    userId: string,
  ): Promise<QualityLog> {
    const qcLog = await this.findQualityLogById(id);

    if (qcLog.status === QualityLogStatus.CANCELLED) {
      throw new BadRequestException('Cannot update a cancelled inspection');
    }

    if (qcLog.status === QualityLogStatus.COMPLETED) {
      throw new BadRequestException('Cannot update a completed inspection');
    }

    if (dto.qtyApproved !== undefined || dto.qtyRejected !== undefined) {
      const approved = dto.qtyApproved ?? qcLog.qtyApproved;
      const rejected = dto.qtyRejected ?? qcLog.qtyRejected;
      const total = Number(approved) + Number(rejected);

      if (total > Number(qcLog.qtyToInspect)) {
        throw new BadRequestException(
          'Approved + rejected quantity cannot exceed quantity to inspect',
        );
      }
    }

    Object.assign(qcLog, dto);
    qcLog.updatedBy = userId;

    if (dto.decision && qcLog.status === QualityLogStatus.PENDING) {
      qcLog.status = QualityLogStatus.IN_PROGRESS;
    }

    return this.qcRepo.save(qcLog);
  }

  async completeInspection(id: string, userId: string): Promise<QualityLog> {
    const qcLog = await this.findQualityLogById(id);

    if (qcLog.status === QualityLogStatus.CANCELLED) {
      throw new BadRequestException('Cannot complete a cancelled inspection');
    }

    if (qcLog.status === QualityLogStatus.COMPLETED) {
      throw new BadRequestException('Inspection is already completed');
    }

    if (!qcLog.decision) {
      throw new BadRequestException('Decision must be set before completing inspection');
    }

    const approved = Number(qcLog.qtyApproved);
    const rejected = Number(qcLog.qtyRejected);
    const toInspect = Number(qcLog.qtyToInspect);

    if (approved + rejected === 0) {
      throw new BadRequestException(
        'Approved or rejected quantities must be recorded before completing',
      );
    }

    if (qcLog.decision === InspectionDecision.APPROVED && approved !== toInspect) {
      throw new BadRequestException(
        'Approved quantity must equal quantity to inspect for an Approved decision',
      );
    }

    if (qcLog.decision === InspectionDecision.REJECTED && rejected !== toInspect) {
      throw new BadRequestException(
        'Rejected quantity must equal quantity to inspect for a Rejected decision',
      );
    }

    qcLog.status = QualityLogStatus.COMPLETED;
    qcLog.updatedBy = userId;

    if (!qcLog.inspectionDate) {
      qcLog.inspectionDate = new Date();
    }

    const saved = await this.qcRepo.save(qcLog);

    if (approved > 0) {
      this.eventEmitter.emit('quality.inspection.approved', {
        qualityLogId: saved.qcId,
        qcNumber: saved.qcNumber,
        productionJobId: saved.productionJobId,
        productId: saved.productId,
        productName: saved.productName,
        warehouseId: saved.warehouseId,
        warehouseName: saved.warehouseName,
        qtyApproved: approved,
        companyId: saved.companyId,
        userId,
      });
    }

    if (saved.grnId) {
      this.eventEmitter.emit('quality.grn.decided', {
        qualityLogId: saved.qcId,
        qcNumber: saved.qcNumber,
        grnId: saved.grnId,
        grnNumber: saved.grnNumber,
        grnItemId: saved.grnItemId,
        orderId: saved.orderId,
        productId: saved.productId,
        productName: saved.productName,
        sku: saved.sku,
        warehouseId: saved.warehouseId,
        warehouseName: saved.warehouseName,
        qtyApproved: approved,
        qtyRejected: rejected,
        unitPrice: saved.unitPrice,
        batchNumber: saved.batchNumber,
        expiryDate: saved.expiryDate,
        decision: saved.decision,
        companyId: saved.companyId,
        userId,
      });
    }

    if (rejected > 0) {
      try {
        let vendorId = null;
        let vendorName = null;

        if (saved.orderId) {
          const po = await this.dataSource.query(
            `SELECT vendor_id, vendor_name FROM purchase_orders WHERE order_id::text = $1 LIMIT 1`,
            [saved.orderId],
          );
          vendorId = po?.[0]?.vendor_id || null;
          vendorName = po?.[0]?.vendor_name || null;
        }

        if (!vendorName && saved.grnId) {
          const grn = await this.dataSource.query(
            `SELECT vendor_id, vendor_name FROM goods_receipt_notes WHERE grn_id::text = $1 LIMIT 1`,
            [saved.grnId],
          );
          vendorId = grn?.[0]?.vendor_id || null;
          vendorName = grn?.[0]?.vendor_name || null;
        }

        const actionNumber = this.generateRejectNumber();
        const rejectAction = this.rejectRepo.create({
          actionNumber,
          receiptId: saved.grnId || null,
          purchaseOrderId: saved.orderId || null,
          poNumber: null,
          productId: saved.productId,
          productName: saved.productName,
          vendorId,
          vendorName,
          rejectedQty: rejected,
          actionType: RejectActionType.PACKING_ISSUE,
          actionDate: new Date(),
          referenceNo: saved.grnNumber || saved.qcNumber,
          companyId: saved.companyId,
          status: RejectActionStatus.PENDING,
          qualityRemarks: saved.remarks || `Rejected from QC ${saved.qcNumber}`,
          createdBy: userId,
        });
        const savedAction = await this.rejectRepo.save(rejectAction);
        this.logger.log(`Auto-created reject action ${actionNumber} for QC ${saved.qcNumber}, rejected qty: ${rejected}`);

        if (saved.grnId) {
          this.eventEmitter.emit('grn.items.rejected', {
            actionId: savedAction.actionId,
            actionNumber: savedAction.actionNumber,
            grnId: saved.grnId,
            grnNumber: saved.grnNumber,
            orderId: saved.orderId,
            productId: saved.productId,
            productName: saved.productName,
            rejectedQty: rejected,
            companyId: saved.companyId,
            userId,
          });
        }
      } catch (err) {
        this.logger.error(`Failed to auto-create reject action for QC ${saved.qcNumber}: ${err.message}`, err.stack);
      }
    }

    return saved;
  }

  async cancelQualityLog(id: string, userId: string): Promise<QualityLog> {
    const qcLog = await this.findQualityLogById(id);

    if (qcLog.status === QualityLogStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed inspection');
    }

    if (qcLog.status === QualityLogStatus.CANCELLED) {
      throw new BadRequestException('Inspection is already cancelled');
    }

    qcLog.status = QualityLogStatus.CANCELLED;
    qcLog.updatedBy = userId;

    return this.qcRepo.save(qcLog);
  }

  // ========== REJECT ACTION LOG ==========

  async createRejectAction(
    dto: CreateRejectActionLogDto,
    userId: string,
    companyId?: string,
  ): Promise<RejectActionLog> {
    const actionNumber = this.generateRejectNumber();

    const action = this.rejectRepo.create({
      ...dto,
      actionNumber,
      companyId,
      status: RejectActionStatus.PENDING,
      createdBy: userId,
    });

    const saved = await this.rejectRepo.save(action);

    if ((saved as any).actionType === 'replacement') {
      this.eventEmitter.emit('quality.reject.replacement', {
        actionId: saved.actionId,
        actionNumber: saved.actionNumber,
        purchaseOrderId: saved.purchaseOrderId,
        poNumber: saved.poNumber,
        productId: saved.productId,
        productName: saved.productName,
        rejectedQty: Number(saved.rejectedQty),
        companyId,
        userId,
      });
    }

    return saved;
  }

  async findAllRejectActions(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: RejectActionStatus;
    actionType?: string;
    companyId?: string;
  }): Promise<PaginatedResult<RejectActionLog>> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.rejectRepo.createQueryBuilder('ra');

    if (params.companyId) {
      qb.andWhere('ra.companyId = :companyId', { companyId: params.companyId });
    }

    if (params.status) {
      qb.andWhere('ra.status = :status', { status: params.status });
    }

    if (params.actionType) {
      qb.andWhere('ra.actionType = :actionType', { actionType: params.actionType });
    }

    if (params.search) {
      qb.andWhere(
        '(ra.actionNumber ILIKE :search OR ra.productName ILIKE :search OR ra.poNumber ILIKE :search)',
        { search: `%${params.search}%` },
      );
    }

    qb.orderBy('ra.createdAt', 'DESC');
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    const needsVendor = data.filter(d => !d.vendorName);
    if (needsVendor.length > 0) {
      const poIds = [...new Set(needsVendor.map(d => d.purchaseOrderId).filter(Boolean))];
      if (poIds.length > 0) {
        const pos = await this.dataSource.query(
          `SELECT order_id, vendor_id, vendor_name FROM purchase_orders WHERE order_id::text = ANY($1)`,
          [poIds],
        );
        const poMap = new Map(pos.map((p: any) => [p.order_id, p]));
        for (const item of needsVendor) {
          const po = poMap.get(item.purchaseOrderId);
          if (po && po.vendor_name) {
            item.vendorId = po.vendor_id;
            item.vendorName = po.vendor_name;
          }
        }
      }
    }

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findRejectActionById(id: string): Promise<RejectActionLog> {
    const action = await this.rejectRepo.findOne({ where: { actionId: id } });
    if (!action) {
      throw new NotFoundException(`Reject action ${id} not found`);
    }
    return action;
  }

  async updateRejectAction(
    id: string,
    dto: UpdateRejectActionLogDto,
    userId: string,
  ): Promise<RejectActionLog> {
    const action = await this.findRejectActionById(id);

    if (action.status === RejectActionStatus.CANCELLED) {
      throw new BadRequestException('Cannot update a cancelled reject action');
    }

    if (action.status === RejectActionStatus.COMPLETED) {
      throw new BadRequestException('Cannot update a completed reject action');
    }

    Object.assign(action, dto);
    action.updatedBy = dto.updatedBy || userId;
    action.updatedByUserId = userId;

    const saved = await this.rejectRepo.save(action);

    if (saved.isReplacementExpected && saved.replacementEta && saved.purchaseOrderId) {
      this.eventEmitter.emit('reject.resolution.replacement', {
        actionId: saved.actionId,
        purchaseOrderId: saved.purchaseOrderId,
        replacementEta: saved.replacementEta,
        companyId: saved.companyId,
        userId,
      });
    }

    if (saved.isReplacementExpected === false && saved.resolutionPath && saved.purchaseOrderId) {
      this.eventEmitter.emit('reject.resolution.no-replacement', {
        actionId: saved.actionId,
        purchaseOrderId: saved.purchaseOrderId,
        productId: saved.productId,
        companyId: saved.companyId,
        userId,
      });
    }

    if (saved.documentNoteType) {
      this.eventEmitter.emit('reject.document-note-routing', {
        actionId: saved.actionId,
        actionNumber: saved.actionNumber,
        purchaseOrderId: saved.purchaseOrderId,
        poNumber: saved.poNumber,
        productId: saved.productId,
        productName: saved.productName,
        rejectedQty: Number(saved.rejectedQty),
        documentNoteType: saved.documentNoteType,
        companyId: saved.companyId,
        userId,
      });
    }

    return saved;
  }

  async markReplacementReceived(id: string, userId: string): Promise<RejectActionLog> {
    const action = await this.findRejectActionById(id);

    if (!action.isReplacementExpected) {
      throw new BadRequestException('No replacement is expected for this reject action');
    }

    if (action.replacementReceived) {
      throw new BadRequestException('Replacement has already been marked as received');
    }

    action.replacementReceived = true;
    action.updatedBy = userId;
    action.updatedByUserId = userId;

    return this.rejectRepo.save(action);
  }

  @OnEvent('grn.created')
  async handleGrnCreated(payload: {
    grnId: string;
    grnNumber: string;
    grnItemId: string;
    productId: string;
    productName: string;
    warehouseId: string;
    warehouseName: string;
    receivedQty: number;
    sku?: string;
    unitPrice?: number;
    batchNumber?: string;
    expiryDate?: string;
    orderId?: string;
    companyId: string;
    userId: string;
  }) {
    try {
      const qcNumber = this.generateQcNumber();

      const qcLog = this.qcRepo.create({
        qcNumber,
        grnId: payload.grnId,
        grnNumber: payload.grnNumber,
        grnItemId: payload.grnItemId,
        orderId: payload.orderId,
        dateRequested: new Date(),
        warehouseId: payload.warehouseId,
        warehouseName: payload.warehouseName || '',
        productId: payload.productId,
        productName: payload.productName || '',
        sku: payload.sku,
        unitPrice: payload.unitPrice,
        batchNumber: payload.batchNumber,
        expiryDate: payload.expiryDate ? new Date(payload.expiryDate) : undefined,
        qtyToInspect: payload.receivedQty,
        companyId: payload.companyId,
        status: QualityLogStatus.PENDING,
        remarks: `Auto-created from GRN ${payload.grnNumber}`,
        createdBy: payload.userId,
        updatedBy: payload.userId,
      });

      await this.qcRepo.save(qcLog);
      this.logger.log(`QC inspection ${qcNumber} auto-created for GRN ${payload.grnNumber}`);
    } catch (err) {
      this.logger.error(`Failed to auto-create QC for GRN ${payload.grnNumber}: ${err.message}`, err.stack);
    }
  }
}
