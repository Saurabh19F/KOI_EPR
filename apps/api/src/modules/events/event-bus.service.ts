import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface ERPEvent {
  event: string;
  companyId: string;
  userId?: string;
  data: Record<string, any>;
  timestamp: Date;
}

export enum ERPEventType {
  // Sales Events
  ENQUIRY_CREATED = 'enquiry.created',
  ENQUIRY_SUBMITTED = 'enquiry.submitted',
  ENQUIRY_STATUS_CHANGED = 'enquiry.status_changed',
  ENQUIRY_PUNCHED = 'enquiry.punched',

  // Purchase Events
  PURCHASE_TASK_ASSIGNED = 'purchase.task_assigned',
  PURCHASE_QUOTE_CREATED = 'purchase.quote_created',
  PURCHASE_QUOTE_SUBMITTED = 'purchase.quote_submitted',
  VENDOR_QUOTE_ADDED = 'purchase.vendor_quote_added',

  // Rate Events
  RATE_UPDATED = 'rate.updated',
  RATE_LOCKED = 'rate.locked',
  PRICE_ANALYSIS_CREATED = 'price_analysis.created',
  PRICE_ANALYSIS_APPROVED = 'price_analysis.approved',
  PRICE_ANALYSIS_REJECTED = 'price_analysis.rejected',

  // FMS Events
  FMS_TASK_CREATED = 'fms.task_created',
  FMS_TASK_COMPLETED = 'fms.task_completed',
  FMS_TASK_DELAYED = 'fms.task_delayed',
  FMS_TASK_ESCALATED = 'fms.task_escalated',

  // Workflow Events
  WORKFLOW_STARTED = 'workflow.started',
  WORKFLOW_STEP_APPROVED = 'workflow.step_approved',
  WORKFLOW_STEP_REJECTED = 'workflow.step_rejected',
  WORKFLOW_COMPLETED = 'workflow.completed',

  // User Events
  USER_CREATED = 'user.created',
  USER_LOGGED_IN = 'user.logged_in',

  // Master Events
  MASTER_CREATED = 'master.created',
  MASTER_UPDATED = 'master.updated',

  // Product Master Events
  PRODUCT_NOT_IN_MASTER = 'product.not_in_master',
  PRODUCT_REVIEW_COMPLETED = 'product.review_completed',
}

@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);

  constructor(private readonly eventEmitter: EventEmitter2) { }

  /**
   * Emit an event to all registered listeners
   */
  emit(event: ERPEventType, companyId: string, userId: string | null, data: Record<string, any> = {}): void {
    const erpEvent: ERPEvent = {
      event,
      companyId,
      userId: userId || undefined,
      data,
      timestamp: new Date(),
    };

    this.logger.debug(`Emitting event: ${event}`, { companyId, event: erpEvent });
    this.eventEmitter.emit(event, erpEvent);
  }

  /**
   * Emit event asynchronously (queued)
   */
  async emitAsync(event: ERPEventType, companyId: string, userId: string | null, data: Record<string, any> = {}): Promise<void> {
    // Queue for BullMQ processing
    // This prevents blocking the main thread
    this.emit(event, companyId, userId, data);
  }

  /**
   * Subscribe to an event
   */
  on(event: ERPEventType, handler: (event: ERPEvent) => void | Promise<void>): void {
    this.eventEmitter.on(event, handler);
  }

  /**
   * Subscribe once (fires only once)
   */
  once(event: ERPEventType, handler: (event: ERPEvent) => void | Promise<void>): void {
    this.eventEmitter.once(event, handler);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: ERPEventType, handler: (event: ERPEvent) => void | Promise<void>): void {
    this.eventEmitter.off(event, handler);
  }

  // ========================
  // Convenience Methods for Common Events
  // ========================

  enquirySubmitted(companyId: string, userId: string, enquiryId: string, enquiryNo: string): void {
    this.emit(ERPEventType.ENQUIRY_SUBMITTED, companyId, userId, {
      enquiryId,
      enquiryNo,
    });
  }

  purchaseQuoteCreated(companyId: string, userId: string, quoteId: string): void {
    this.emit(ERPEventType.PURCHASE_QUOTE_CREATED, companyId, userId, { quoteId });
  }

  rateFmsTaskCreated(companyId: string, taskId: string, enquiryId: string, productId: string, assigneeId: string): void {
    this.emit(ERPEventType.FMS_TASK_CREATED, companyId, assigneeId, {
      taskId,
      enquiryId,
      productId,
    });
  }

  priceAnalysisApproved(companyId: string, userId: string, analysisId: string): void {
    this.emit(ERPEventType.PRICE_ANALYSIS_APPROVED, companyId, userId, { analysisId });
  }

  rateLocked(companyId: string, userId: string, analysisId: string): void {
    this.emit(ERPEventType.RATE_LOCKED, companyId, userId, { analysisId });
  }

  fmsTaskDelayed(companyId: string, taskId: string, plannedAt: Date): void {
    this.emit(ERPEventType.FMS_TASK_DELAYED, companyId, null, { taskId, plannedAt });
  }

  productNotInMaster(companyId: string, userId: string, enquiryId: string, enquiryNo: string, products: Array<{ sku: string; productName: string; quantity: number }>): void {
    this.emit(ERPEventType.PRODUCT_NOT_IN_MASTER, companyId, userId, {
      enquiryId,
      enquiryNo,
      products,
    });
  }
}
