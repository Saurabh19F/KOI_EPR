import { Injectable, Logger, Optional } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DataSource } from 'typeorm';
import { EventBusService, ERPEventType, ERPEvent } from '../event-bus.service';
import { FmsService } from '../../fms/fms.service';
import { queuesEnabled } from '../../../common/queue.config';

/**
 * FMS Event Listener
 *
 * Automatically creates FMS tasks when sales enquiry is submitted.
 * This decouples Sales from FMS - no direct dependencies.
 */
@Injectable()
export class FmsEventListener {
  private readonly logger = new Logger(FmsEventListener.name);
  private readonly queueAvailable: boolean;

  constructor(
    @Optional() @InjectQueue('fms') private readonly fmsQueue: Queue | null,
    private readonly fmsService: FmsService,
    private readonly dataSource: DataSource,
  ) {
    this.queueAvailable = !!fmsQueue;
    if (!this.queueAvailable) {
      this.logger.warn('FMS Queue not available - background jobs disabled');
    }
  }

  /**
   * When enquiry is submitted, automatically create FMS tasks
   */
  @OnEvent(ERPEventType.ENQUIRY_SUBMITTED)
  async handleEnquirySubmitted(event: ERPEvent): Promise<void> {
    this.logger.log(`Handling enquiry submitted: ${event.data.enquiryId}`);

    const isQueueActive = this.queueAvailable && queuesEnabled();

    if (!isQueueActive) {
      this.logger.log(`Queue not available or disabled, creating FMS tasks synchronously for enquiry: ${event.data.enquiryId}`);
      try {
        const enquiryResult = await this.dataSource.query(
          `SELECT enquiry_order_no FROM sales_enquiry_orders WHERE enquiry_order_id::text = $1`,
          [event.data.enquiryId]
        );

        if (!enquiryResult || enquiryResult.length === 0) {
          this.logger.warn(`Enquiry not found: ${event.data.enquiryId}`);
          return;
        }

        const enquiryNo = enquiryResult[0].enquiry_order_no;

        const items = await this.dataSource.query(
          `SELECT sku, product_name, quantity FROM sales_enquiry_order_items WHERE enquiry_order_id::text = $1`,
          [event.data.enquiryId]
        );

        if (!items || items.length === 0) {
          this.logger.log(`No items found for enquiry: ${event.data.enquiryId}`);
          return;
        }

        const taskItems = items.map((item: any) => ({
          sku: item.sku,
          productName: item.product_name,
          quantity: Number(item.quantity || 0),
        }));

        await this.fmsService.createTasksForEnquiry(
          event.data.enquiryId,
          enquiryNo,
          taskItems,
          event.companyId || 'system',
          event.userId || 'system'
        );

        this.logger.log(`Successfully generated FMS tasks synchronously for enquiry ${enquiryNo}`);
      } catch (err) {
        this.logger.error(`Failed to create FMS tasks synchronously: ${err.message}`, err.stack);
      }
      return;
    }

    try {
      await this.fmsQueue!.add('create-tasks-from-enquiry', {
        enquiryId: event.data.enquiryId,
        companyId: event.companyId,
        userId: event.userId,
        submittedAt: event.timestamp,
      });

      this.logger.log(`FMS task creation queued for enquiry: ${event.data.enquiryId}`);
    } catch (error) {
      this.logger.error(`Failed to queue FMS task creation: ${error.message}`, error.stack);
      // Don't throw - let the main flow continue
    }
  }

  /**
   * When FMS task is delayed, trigger escalation
   */
  @OnEvent(ERPEventType.FMS_TASK_DELAYED)
  async handleTaskDelayed(event: ERPEvent): Promise<void> {
    this.logger.log(`Handling delayed task: ${event.data.taskId}`);

    if (!this.queueAvailable) {
      this.logger.warn('Queue not available, skipping escalation');
      return;
    }

    this.fmsQueue!.add('process-delay-escalation', {
      taskId: event.data.taskId,
      companyId: event.companyId,
      plannedAt: event.data.plannedAt,
    });
  }
}
