import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, ILike } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
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

    if (saved.actionType === RejectActionType.REPLACEMENT) {
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

    return this.rejectRepo.save(action);
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
}
