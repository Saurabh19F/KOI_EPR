import { Injectable, Logger, Optional } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventBusService, ERPEventType, ERPEvent } from '../event-bus.service';
import { AuditLog } from '../../audit/entities/audit-log.entity';

/**
 * Audit Event Listener
 *
 * Automatically logs all significant events to audit trail.
 * Centralized audit logging.
 */
@Injectable()
export class AuditEventListener {
  private readonly logger = new Logger(AuditEventListener.name);

  constructor(
    @Optional() @InjectRepository(AuditLog) private readonly auditRepo: Repository<AuditLog> | null,
  ) {}

  /**
   * Log all events to audit trail
   */
  @OnEvent(ERPEventType.ENQUIRY_SUBMITTED)
  async handleEnquirySubmitted(event: ERPEvent): Promise<void> {
    await this.logEvent('ENQUIRY_SUBMITTED', event);
  }

  @OnEvent(ERPEventType.PURCHASE_QUOTE_CREATED)
  async handlePurchaseQuoteCreated(event: ERPEvent): Promise<void> {
    await this.logEvent('PURCHASE_QUOTE_CREATED', event);
  }

  @OnEvent(ERPEventType.PRICE_ANALYSIS_APPROVED)
  async handlePriceAnalysisApproved(event: ERPEvent): Promise<void> {
    await this.logEvent('PRICE_ANALYSIS_APPROVED', event);
  }

  @OnEvent(ERPEventType.PRICE_ANALYSIS_REJECTED)
  async handlePriceAnalysisRejected(event: ERPEvent): Promise<void> {
    await this.logEvent('PRICE_ANALYSIS_REJECTED', event);
  }

  @OnEvent(ERPEventType.RATE_LOCKED)
  async handleRateLocked(event: ERPEvent): Promise<void> {
    await this.logEvent('RATE_LOCKED', event);
  }

  @OnEvent(ERPEventType.FMS_TASK_COMPLETED)
  async handleFmsTaskCompleted(event: ERPEvent): Promise<void> {
    await this.logEvent('FMS_TASK_COMPLETED', event);
  }

  @OnEvent(ERPEventType.FMS_TASK_DELAYED)
  async handleFmsTaskDelayed(event: ERPEvent): Promise<void> {
    await this.logEvent('FMS_TASK_DELAYED', event);
  }

  @OnEvent(ERPEventType.FMS_TASK_ESCALATED)
  async handleFmsTaskEscalated(event: ERPEvent): Promise<void> {
    await this.logEvent('FMS_TASK_ESCALATED', event);
  }

  @OnEvent(ERPEventType.WORKFLOW_COMPLETED)
  async handleWorkflowCompleted(event: ERPEvent): Promise<void> {
    await this.logEvent('WORKFLOW_COMPLETED', event);
  }

  @OnEvent(ERPEventType.WORKFLOW_STEP_APPROVED)
  async handleWorkflowStepApproved(event: ERPEvent): Promise<void> {
    await this.logEvent('WORKFLOW_STEP_APPROVED', event);
  }

  @OnEvent(ERPEventType.WORKFLOW_STEP_REJECTED)
  async handleWorkflowStepRejected(event: ERPEvent): Promise<void> {
    await this.logEvent('WORKFLOW_STEP_REJECTED', event);
  }

  @OnEvent(ERPEventType.PRODUCT_NOT_IN_MASTER)
  async handleProductNotInMaster(event: ERPEvent): Promise<void> {
    await this.logEvent('PRODUCT_NOT_IN_MASTER', event);
  }

  @OnEvent(ERPEventType.PRODUCT_REVIEW_COMPLETED)
  async handleProductReviewCompleted(event: ERPEvent): Promise<void> {
    await this.logEvent('PRODUCT_REVIEW_COMPLETED', event);
  }

  private async logEvent(action: string, event: ERPEvent): Promise<void> {
    this.logger.log(
      `[AUDIT] ${action} - Company: ${event.companyId}, User: ${event.userId}, Data: ${JSON.stringify(event.data)}`,
    );

    if (!this.auditRepo) {
      this.logger.warn('AuditLog repository not available, audit log not persisted');
      return;
    }

    try {
      const auditLog = this.auditRepo.create({
        companyId: event.companyId,
        moduleName: action.split('.')[0] || 'SYSTEM',
        recordId: event.data?.enquiryId || event.data?.taskId || event.data?.quoteId || event.data?.productId || 'unknown',
        action,
        newValue: JSON.stringify(event.data),
        changedBy: event.userId || 'system',
        ipAddress: null,
        userAgent: null,
      });

      await this.auditRepo.save(auditLog);
      this.logger.debug(`Audit log persisted: ${auditLog.auditLogId}`);
    } catch (error) {
      this.logger.error(`Failed to persist audit log: ${error.message}`, error.stack);
    }
  }
}
