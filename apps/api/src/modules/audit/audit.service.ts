import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { StatusHistory } from './entities/status-history.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
    @InjectRepository(StatusHistory)
    private readonly statusHistoryRepo: Repository<StatusHistory>,
  ) {}

  async log(
    companyId: string,
    moduleName: string,
    recordId: string,
    action: string,
    changedBy: string,
    options: {
      oldValue?: Record<string, any>;
      newValue?: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
    } = {},
  ): Promise<AuditLog> {
    const log = this.auditLogRepo.create({
      companyId,
      moduleName,
      recordId,
      action,
      changedBy,
      oldValue: options.oldValue ? JSON.stringify(options.oldValue) : undefined,
      newValue: options.newValue ? JSON.stringify(options.newValue) : undefined,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
    });

    return this.auditLogRepo.save(log);
  }

  async getAuditTrail(
    moduleName: string,
    recordId: string,
  ): Promise<AuditLog[]> {
    return this.auditLogRepo.find({
      where: { moduleName, recordId },
      order: { createdAt: 'DESC' },
    });
  }

  async getUserActivity(changedBy: string, limit = 50): Promise<AuditLog[]> {
    return this.auditLogRepo.find({
      where: { changedBy },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async logStatusChange(
    moduleName: string,
    recordId: string,
    fromStatus: string | null,
    toStatus: string,
    changedBy: string,
    reason?: string,
  ): Promise<StatusHistory> {
    const history = this.statusHistoryRepo.create({
      moduleName,
      recordId,
      oldStatus: fromStatus || undefined,
      newStatus: toStatus,
      changedBy,
      remarks: reason,
    });
    return this.statusHistoryRepo.save(history);
  }

  async getStatusHistory(
    moduleName: string,
    recordId: string,
  ): Promise<StatusHistory[]> {
    return this.statusHistoryRepo.find({
      where: { moduleName, recordId },
      order: { changedAt: 'DESC' },
    });
  }
}
