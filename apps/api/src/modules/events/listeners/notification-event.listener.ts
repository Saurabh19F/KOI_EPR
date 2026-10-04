import { Injectable, Logger, Optional, Inject, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DataSource } from 'typeorm';
import { ERPEventType, ERPEvent } from '../event-bus.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationsGateway } from '../../notifications/notifications.gateway';
import { queuesEnabled } from '../../../common/queue.config';

/**
 * Notification Event Listener
 *
 * Handles all notification triggers from various modules.
 * Centralized notification logic.
 */
@Injectable()
export class NotificationEventListener {
  private readonly logger = new Logger(NotificationEventListener.name);
  private readonly queueAvailable: boolean;

  constructor(
    @Optional() @InjectQueue('notifications') private readonly notificationQueue: Queue | null,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => NotificationsGateway))
    private readonly notificationsGateway: NotificationsGateway,
    private readonly dataSource: DataSource,
  ) {
    this.queueAvailable = !!notificationQueue;
    if (!this.queueAvailable) {
      this.logger.warn('Notification queue not available - notifications disabled');
    }
  }

  /**
   * Helper to trigger notification directly (DB + WebSocket)
   */
  private async triggerNotification(data: {
    userId: string;
    companyId: string;
    title: string;
    message: string;
    moduleName?: string;
    recordId?: string;
  }): Promise<void> {
    try {
      const notification = await this.notificationsService.createNotification({
        companyId: data.companyId,
        userId: data.userId,
        title: data.title,
        message: data.message,
        moduleName: data.moduleName || 'fms',
        recordId: data.recordId,
        notificationType: 'in_app',
      });

      this.notificationsGateway.sendToUser(data.userId, 'notification', {
        id: notification.notificationId,
        title: notification.title,
        message: notification.message,
        moduleName: notification.moduleName,
        recordId: notification.recordId,
        type: notification.notificationType,
      });

      this.logger.log(`Real-time notification sent directly to user ${data.userId}`);
    } catch (err) {
      this.logger.error(`Failed to send real-time notification: ${err.message}`, err.stack);
    }
  }

  /**
   * FMS Task Created / Assigned - Notify assigned person
   */
  @OnEvent(ERPEventType.FMS_TASK_CREATED)
  async handleFmsTaskCreated(event: ERPEvent): Promise<void> {
    this.logger.log(`Notification: FMS task created/assigned`);

    const assigneeId = event.userId || event.data.assigneeId;
    if (!assigneeId) {
      this.logger.warn('FMS_TASK_CREATED event has no assigneeId, skipping notification');
      return;
    }

    const isQueueActive = this.queueAvailable && queuesEnabled();

    if (!isQueueActive) {
      await this.triggerNotification({
        userId: assigneeId,
        companyId: event.companyId || 'system',
        title: 'New Task Assigned',
        message: `FMS Task "${event.data.stepName || ''}" for Enquiry ${event.data.enquiryNo || ''} has been assigned to you.`,
        moduleName: 'fms',
        recordId: event.data.taskId,
      });
      return;
    }

    this.notificationQueue!.add('fms-task-assigned', {
      taskId: event.data.taskId,
      assigneeId,
      companyId: event.companyId,
      type: 'fms_task_assigned',
    });
  }

  /**
   * FMS Task Completed - Notify creator / manager
   */
  @OnEvent(ERPEventType.FMS_TASK_COMPLETED)
  async handleFmsTaskCompleted(event: ERPEvent): Promise<void> {
    this.logger.log(`Notification: FMS task completed`);

    const creatorId = event.data.createdBy || event.userId;
    if (!creatorId) return;

    // Send direct notification
    await this.triggerNotification({
      userId: creatorId,
      companyId: event.companyId || 'system',
      title: 'Task Completed',
      message: `FMS Task "${event.data.stepName || ''}" for Enquiry ${event.data.enquiryNo || ''} has been completed.`,
      moduleName: 'fms',
      recordId: event.data.taskId,
    });
  }

  /**
   * FMS Task Delayed - Escalate to manager
   */
  @OnEvent(ERPEventType.FMS_TASK_DELAYED)
  async handleTaskDelayed(event: ERPEvent): Promise<void> {
    this.logger.log(`Notification: Task delayed, escalating`);

    const isQueueActive = this.queueAvailable && queuesEnabled();

    if (!isQueueActive) {
      // In synchronous mode, notify the creator/owner or assignee of the delay
      const targetUserId = event.userId || event.data.assignedTo || 'system';
      if (targetUserId !== 'system') {
        await this.triggerNotification({
          userId: targetUserId,
          companyId: event.companyId || 'system',
          title: 'Task Delayed',
          message: `FMS Task "${event.data.stepName || ''}" for Enquiry ${event.data.enquiryNo || ''} is delayed.`,
          moduleName: 'fms',
          recordId: event.data.taskId,
        });
      }
      return;
    }

    this.notificationQueue!.add('fms-task-escalated', {
      taskId: event.data.taskId,
      companyId: event.companyId,
      plannedAt: event.data.plannedAt,
      type: 'fms_task_escalated',
    });
  }

  /**
   * FMS Task Escalated - Notify escalated recipient
   */
  @OnEvent(ERPEventType.FMS_TASK_ESCALATED)
  async handleFmsTaskEscalated(event: ERPEvent): Promise<void> {
    this.logger.log(`Notification: FMS task escalated`);

    const escalatedTo = event.userId || event.data.escalatedTo;
    if (!escalatedTo) return;

    await this.triggerNotification({
      userId: escalatedTo,
      companyId: event.companyId || 'system',
      title: 'Task Escalated',
      message: `FMS Task "${event.data.stepName || ''}" for Enquiry ${event.data.enquiryNo || ''} has been escalated to you: ${event.data.reason || ''}`,
      moduleName: 'fms',
      recordId: event.data.taskId,
    });
  }

  /**
   * Sourcing Task Assigned - Notify purchase executive
   */
  @OnEvent(ERPEventType.PURCHASE_TASK_ASSIGNED)
  async handlePurchaseTaskAssigned(event: ERPEvent): Promise<void> {
    this.logger.log(`Notification: Sourcing task assigned`);

    const assigneeId = event.userId || event.data.assignedPurchaseUserId;
    if (!assigneeId) return;

    await this.triggerNotification({
      userId: assigneeId,
      companyId: event.companyId || 'system',
      title: 'Sourcing Item Assigned',
      message: `Item "${event.data.productName || ''}" on Enquiry ${event.data.enquiryNo || ''} has been assigned to you.`,
      moduleName: 'purchase',
      recordId: event.data.enquiryId,
    });
  }

  /**
   * Rate Locked - Notify sales team
   */
  @OnEvent(ERPEventType.RATE_LOCKED)
  async handleRateLocked(event: ERPEvent): Promise<void> {
    this.logger.log(`Notification: Rate locked`);

    const isQueueActive = this.queueAvailable && queuesEnabled();

    if (!isQueueActive) {
      const targetUserId = event.userId || 'system';
      if (targetUserId !== 'system') {
        await this.triggerNotification({
          userId: targetUserId,
          companyId: event.companyId || 'system',
          title: 'Rate Locked',
          message: `Pricing rates have been successfully locked for Analysis ${event.data.analysisId || ''}.`,
          moduleName: 'rate',
          recordId: event.data.analysisId,
        });
      }
      return;
    }

    this.notificationQueue!.add('rate-locked', {
      analysisId: event.data.analysisId,
      companyId: event.companyId,
      approvedBy: event.userId,
      type: 'rate_locked',
    });
  }

  /**
   * Price Analysis Approved - Notify sales
   */
  @OnEvent(ERPEventType.PRICE_ANALYSIS_APPROVED)
  async handlePriceAnalysisApproved(event: ERPEvent): Promise<void> {
    this.logger.log(`Notification: Price analysis approved`);

    const isQueueActive = this.queueAvailable && queuesEnabled();

    if (!isQueueActive) {
      const targetUserId = event.userId || 'system';
      if (targetUserId !== 'system') {
        await this.triggerNotification({
          userId: targetUserId,
          companyId: event.companyId || 'system',
          title: 'Price Analysis Approved',
          message: `Price Analysis ${event.data.analysisId || ''} has been approved.`,
          moduleName: 'rate',
          recordId: event.data.analysisId,
        });
      }
      return;
    }

    this.notificationQueue!.add('price-analysis-approved', {
      analysisId: event.data.analysisId,
      companyId: event.companyId,
      approvedBy: event.userId,
      type: 'price_analysis_approved',
    });
  }

  /**
   * Enquiry Submitted - Notify sales manager
   */
  @OnEvent(ERPEventType.ENQUIRY_SUBMITTED)
  async handleEnquirySubmitted(event: ERPEvent): Promise<void> {
    this.logger.log(`Notification: Enquiry submitted`);

    const isQueueActive = this.queueAvailable && queuesEnabled();

    if (!isQueueActive) {
      const targetUserId = event.userId || 'system';
      if (targetUserId !== 'system') {
        await this.triggerNotification({
          userId: targetUserId,
          companyId: event.companyId || 'system',
          title: 'Enquiry Submitted',
          message: `Enquiry ${event.data.enquiryNo || ''} has been submitted successfully.`,
          moduleName: 'sales',
          recordId: event.data.enquiryId,
        });
      }

      // Notify assigned purchase executives
      try {
        const items = await this.dataSource.query(
          `SELECT DISTINCT assigned_purchase_user_id FROM sales_enquiry_order_items WHERE enquiry_order_id::text = $1 AND assigned_purchase_user_id IS NOT NULL`,
          [event.data.enquiryId]
        );
        for (const item of items) {
          await this.triggerNotification({
            userId: item.assigned_purchase_user_id,
            companyId: event.companyId || 'system',
            title: 'New Enquiry Sourcing Assignment',
            message: `You have been assigned to source items for Enquiry ${event.data.enquiryNo || ''}.`,
            moduleName: 'purchase',
            recordId: event.data.enquiryId,
          });
        }
      } catch (err) {
        this.logger.error(`Failed to fetch and notify assigned purchase users: ${err.message}`);
      }
      return;
    }

    this.notificationQueue!.add('enquiry-submitted', {
      enquiryId: event.data.enquiryId,
      enquiryNo: event.data.enquiryNo,
      companyId: event.companyId,
      submittedBy: event.userId,
      type: 'enquiry_submitted',
    });
  }

  /**
   * Product Not In Master - Notify Purchase team
   */
  @OnEvent(ERPEventType.PRODUCT_NOT_IN_MASTER)
  async handleProductNotInMaster(event: ERPEvent): Promise<void> {
    this.logger.log(`Notification: Products NOT IN MASTER for enquiry: ${event.data.enquiryNo}`);

    const isQueueActive = this.queueAvailable && queuesEnabled();

    if (!isQueueActive) {
      const targetUserId = event.userId || 'system';
      if (targetUserId !== 'system') {
        await this.triggerNotification({
          userId: targetUserId,
          companyId: event.companyId || 'system',
          title: 'Product Sourcing Review Needed',
          message: `Enquiry ${event.data.enquiryNo || ''} has products not in master catalog.`,
          moduleName: 'purchase',
          recordId: event.data.enquiryId,
        });
      }
      return;
    }

    this.notificationQueue!.add('product-review-notification', {
      enquiryId: event.data.enquiryId,
      enquiryNo: event.data.enquiryNo,
      productCount: event.data.products?.length || 0,
      products: event.data.products,
      companyId: event.companyId,
      createdBy: event.userId,
      type: 'product_not_in_master',
    });
  }

  /**
   * Enquiry Status Changed - Notify relevant roles
   */
  @OnEvent(ERPEventType.ENQUIRY_STATUS_CHANGED)
  async handleEnquiryStatusChanged(event: ERPEvent): Promise<void> {
    const { enquiryId, enquiryNo, oldStatus, newStatus } = event.data;
    this.logger.log(`Notification: Enquiry status changed from ${oldStatus} to ${newStatus}`);

    let enquiry: any;
    try {
      const results = await this.dataSource.query(
        `SELECT created_by, sales_person_id FROM sales_enquiry_orders WHERE enquiry_order_id::text = $1`,
        [enquiryId]
      );
      if (results && results.length > 0) {
        enquiry = results[0];
      }
    } catch (err) {
      this.logger.error(`Failed to fetch enquiry details for status change notification: ${err.message}`);
      return;
    }

    if (!enquiry) return;

    const creatorId = enquiry.created_by;
    const salesPersonId = enquiry.sales_person_id || creatorId;

    switch (newStatus) {
      case 'mis_review':
        try {
          const misUsers = await this.dataSource.query(
            `SELECT u.user_id FROM users u 
             INNER JOIN user_roles ur ON u.user_id = ur.user_id 
             INNER JOIN roles r ON ur.role_id = r.role_id 
             WHERE r.name IN ('MIS', 'MIS_USER', 'ADMIN')`
          );
          for (const user of misUsers) {
            await this.triggerNotification({
              userId: user.user_id,
              companyId: event.companyId || 'system',
              title: 'Enquiry Pending MIS Review',
              message: `Enquiry ${enquiryNo} is ready for MIS Review.`,
              moduleName: 'mis',
              recordId: enquiryId,
            });
          }
        } catch (err) {
          this.logger.error(`Failed to notify MIS users: ${err.message}`);
        }
        break;

      case 'mis_requote_required':
        try {
          const items = await this.dataSource.query(
            `SELECT DISTINCT assigned_purchase_user_id FROM sales_enquiry_order_items WHERE enquiry_order_id::text = $1 AND assigned_purchase_user_id IS NOT NULL`,
            [enquiryId]
          );
          for (const item of items) {
            await this.triggerNotification({
              userId: item.assigned_purchase_user_id,
              companyId: event.companyId || 'system',
              title: 'Requote Required by MIS',
              message: `MIS Review requires a requote for Enquiry ${enquiryNo}.`,
              moduleName: 'purchase',
              recordId: enquiryId,
            });
          }
        } catch (err) {
          this.logger.error(`Failed to notify purchase executives of requote request: ${err.message}`);
        }
        break;

      case 'mis_approved':
      case 'rate_calculation':
        if (salesPersonId) {
          await this.triggerNotification({
            userId: salesPersonId,
            companyId: event.companyId || 'system',
            title: 'Enquiry Ready for Rate Calculation',
            message: `Enquiry ${enquiryNo} has been approved by MIS and is ready for Rate Calculation.`,
            moduleName: 'rate',
            recordId: enquiryId,
          });
        }
        break;

      case 'quotation_created':
        if (creatorId) {
          await this.triggerNotification({
            userId: creatorId,
            companyId: event.companyId || 'system',
            title: 'Quotation Ready',
            message: `Pricing has been locked for Enquiry ${enquiryNo}. You can now generate the Quotation.`,
            moduleName: 'sales',
            recordId: enquiryId,
          });
        }
        break;
    }
  }

  /**
   * Purchase Order Approved - Notify accountant users
   */
  @OnEvent('purchase-order.approved')
  async handlePurchaseOrderApproved(payload: {
    orderId: string;
    companyId: string;
    userId: string;
  }): Promise<void> {
    this.logger.log(`Notification: PO approved, notifying accountants`);

    try {
      const order = await this.dataSource.query(
        `SELECT order_number, vendor_name, total_amount, purchase_person, so_no FROM purchase_orders WHERE order_id = $1`,
        [payload.orderId],
      );
      const po = order?.[0];
      if (!po) return;

      // Update linked sales order status to accountant_review
      if (po.so_no) {
        await this.dataSource.query(
          `UPDATE sales_orders SET status = 'accountant_review' WHERE order_number = $1 AND status NOT IN ('invoiced', 'cancelled', 'closed')`,
          [po.so_no],
        );
        this.logger.log(`Sales order ${po.so_no} moved to accountant_review`);
      }

      const accountants = await this.dataSource.query(
        `SELECT u.user_id FROM users u
         INNER JOIN roles r ON u.role_id = r.role_id
         WHERE r.role_code IN ('ACCOUNTANT', 'CHIEF_ACCOUNTANT')
         AND u.is_active = true
         AND ($1::text IS NULL OR u.company_id = $1)`,
        [payload.companyId || null],
      );

      for (const acct of accountants) {
        await this.triggerNotification({
          userId: acct.user_id,
          companyId: payload.companyId || 'system',
          title: 'Purchase Order Approved',
          message: `PO ${po.order_number} (${po.vendor_name || 'TBD'}) for ₹${Number(po.total_amount || 0).toLocaleString('en-IN')} has been approved. Please review for ledger entry.`,
          moduleName: 'accounts',
          recordId: payload.orderId,
        });
      }
    } catch (err) {
      this.logger.error(`Failed to notify accountants of PO approval: ${err.message}`, err.stack);
    }
  }
}
