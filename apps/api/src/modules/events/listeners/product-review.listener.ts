import { Injectable, Logger, Optional } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import { ERPEventType, ERPEvent } from '../event-bus.service';
import { FmsTask, FmsTaskStatus } from '../../fms/entities/fms-task.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Product Review Event Listener
 *
 * Handles NOT IN MASTER product review workflow:
 * 1. When enquiry is submitted with manual products -> create Product Review task for Purchase
 * 2. Notify Purchase team about pending product reviews
 */
@Injectable()
export class ProductReviewListener {
  private readonly logger = new Logger(ProductReviewListener.name);
  private readonly queueAvailable: boolean;

  constructor(
    @Optional() @InjectQueue('fms') private readonly fmsQueue: Queue | null,
    @Optional() @InjectRepository(FmsTask) private readonly taskRepo: Repository<FmsTask> | null,
    @Optional() @InjectRepository(User) private readonly userRepo: Repository<User> | null,
  ) {
    this.queueAvailable = !!fmsQueue;
    if (!this.queueAvailable) {
      this.logger.warn('Queue not available - product review automation disabled');
    }
  }

  /**
   * Handle NOT IN MASTER products detected on enquiry submission
   * Creates a Product Review task for Purchase Manager
   */
  @OnEvent(ERPEventType.PRODUCT_NOT_IN_MASTER)
  async handleProductNotInMaster(event: ERPEvent): Promise<void> {
    this.logger.log(`Handling NOT IN MASTER products for enquiry: ${event.data.enquiryNo}`);

    const { enquiryId, enquiryNo, products } = event.data;

    if (!products || products.length === 0) {
      this.logger.warn('No manual products found');
      return;
    }

    // Find Purchase Manager to assign the task
    let purchaseManager: User | null = null;
    if (this.userRepo) {
      purchaseManager = await this.userRepo
        .createQueryBuilder('user')
        .innerJoin('user.role', 'role')
        .where('role.role_code = :code', { code: 'PURCHASE_MGR' })
        .andWhere('user.isActive = :active', { active: true })
        .getOne();
    }

    if (!this.taskRepo) {
      this.logger.warn('Task repository not available, skipping product review task creation');
      return;
    }

    // Create Product Review task for Purchase
    try {
      const task = this.taskRepo.create({
        enquiryOrderId: enquiryId,
        enquiryOrderNo: enquiryNo,
        sku: products.map((p: any) => p.sku).join(', '),
        productName: products.map((p: any) => p.productName).join('; '),
        companyId: event.companyId,
        createdBy: event.userId,
        stepCode: 'PRODUCT_REVIEW',
        stepName: 'Product Review - NOT IN MASTER',
        assignedTo: purchaseManager?.userId || event.userId,
        assignedBy: event.userId,
        plannedStartDate: new Date(),
        plannedEndDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours SLA
        slaHours: 24,
        slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: FmsTaskStatus.PENDING,
        uniqueKey: `PRODUCT-REVIEW-${enquiryNo}-${Date.now()}`,
      });

      await this.taskRepo.save(task);
      this.logger.log(`Product Review task created: ${task.taskId} for enquiry: ${enquiryNo}`);

      // Queue notification for Purchase team
      if (this.queueAvailable) {
        await this.fmsQueue!.add('product-review-notification', {
          taskId: task.taskId,
          enquiryId,
          enquiryNo,
          productCount: products.length,
          assigneeId: task.assignedTo,
          companyId: event.companyId,
          type: 'product_review_assigned',
        });
      }
    } catch (error) {
      this.logger.error(`Failed to create Product Review task: ${error.message}`, error.stack);
    }
  }
}
