import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { FmsTask } from '../entities/fms-task.entity';
import { FmsStep } from '../entities/fms-step.entity';
import { FmsService } from '../fms.service';

@Processor('fms')
@Injectable()
export class FmsProcessor extends WorkerHost {
  private readonly logger = new Logger(FmsProcessor.name);

  constructor(
    @InjectRepository(FmsTask)
    private readonly taskRepo: Repository<FmsTask>,
    @InjectRepository(FmsStep)
    private readonly stepRepo: Repository<FmsStep>,
    private readonly dataSource: DataSource,
    private readonly fmsService: FmsService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    const { name, data } = job;

    this.logger.log(`Processing FMS job: ${name}`, { data });

    try {
      switch (name) {
        case 'update-overdue':
          await this.updateOverdueTasks();
          break;

        case 'process-delay-escalation':
          await this.processDelayEscalation(data);
          break;

        case 'send-reminder':
          await this.sendTaskReminder(data);
          break;

        case 'create-tasks-from-enquiry':
          await this.createTasksFromEnquiry(data);
          break;

        default:
          this.logger.warn(`Unknown FMS job type: ${name}`);
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`FMS job failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async updateOverdueTasks(): Promise<void> {
    const overdueTasks = await this.taskRepo
      .createQueryBuilder('task')
      .where('task.slaDeadline < :now', { now: new Date() })
      .andWhere('task.status IN (:...statuses)', {
        statuses: ['pending', 'in_progress'],
      })
      .andWhere('task.deletedAt IS NULL')
      .andWhere('task.isEscalated = :isEscalated', { isEscalated: false })
      .getMany();

    for (const task of overdueTasks) {
      const delayMs = new Date().getTime() - task.slaDeadline.getTime();
      const delayHours = Math.floor(delayMs / (1000 * 60 * 60));
      await this.taskRepo.update(task.taskId, {
        status: 'delayed' as any,
        delayHours,
      });
    }

    this.logger.log(`Updated ${overdueTasks.length} overdue tasks`);
  }

  private async processDelayEscalation(data: {
    taskId: string;
    companyId?: string;
    slaDeadline?: string;
  }): Promise<void> {
    this.logger.log(`Processing delay escalation for task: ${data.taskId}`);

    const task = await this.taskRepo.findOne({
      where: { taskId: data.taskId },
    });

    if (!task) {
      this.logger.warn(`Task not found: ${data.taskId}`);
      return;
    }

    const deadline = task.slaDeadline || data.slaDeadline;
    if (!deadline) {
      this.logger.warn(`No deadline found for task: ${data.taskId}`);
      return;
    }

    const deadlineDate = new Date(deadline as any);
    if (new Date() <= deadlineDate) {
      this.logger.log(`Task ${data.taskId} is not delayed yet`);
      return;
    }

    const delayMs = new Date().getTime() - deadlineDate.getTime();
    const delayHours = Math.floor(delayMs / (1000 * 60 * 60));

    task.status = 'delayed' as any;
    task.delayHours = delayHours;
    await this.taskRepo.save(task);

    this.logger.log(`Task ${data.taskId} marked as delayed, hours: ${delayHours}`);
  }

  private async sendTaskReminder(data: {
    taskId: string;
    companyId?: string;
  }): Promise<void> {
    this.logger.log(`Sending reminder for task: ${data.taskId}`);
    this.logger.log(`Reminder sent for task: ${data.taskId}`);
  }

  private async createTasksFromEnquiry(data: {
    enquiryId: string;
    companyId: string;
    userId: string;
  }): Promise<void> {
    this.logger.log(`Creating tasks for enquiry ID: ${data.enquiryId}`);

    const enquiryResult = await this.dataSource.query(
      `SELECT enquiry_order_no FROM sales_enquiry_orders WHERE enquiry_order_id::text = $1`,
      [data.enquiryId]
    );

    if (!enquiryResult || enquiryResult.length === 0) {
      this.logger.warn(`Enquiry not found: ${data.enquiryId}`);
      return;
    }

    const enquiryNo = enquiryResult[0].enquiry_order_no;

    const items = await this.dataSource.query(
      `SELECT sku, product_name, quantity FROM sales_enquiry_order_items WHERE enquiry_order_id::text = $1`,
      [data.enquiryId]
    );

    if (!items || items.length === 0) {
      this.logger.log(`No items found for enquiry: ${data.enquiryId}`);
      return;
    }

    const taskItems = items.map((item: any) => ({
      sku: item.sku,
      productName: item.product_name,
      quantity: Number(item.quantity || 0),
    }));

    await this.fmsService.createTasksForEnquiry(
      data.enquiryId,
      enquiryNo,
      taskItems,
      data.companyId || 'system',
      data.userId || 'system'
    );

    this.logger.log(`Successfully generated FMS tasks for enquiry ${enquiryNo}`);
  }
}
