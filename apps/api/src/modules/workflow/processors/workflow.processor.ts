import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowInstance } from '../entities/workflow-instance.entity';
import { WorkflowStep } from '../entities/workflow-step.entity';
import { User } from '../../users/entities/user.entity';
import { NotificationsService } from '../../notifications/notifications.service';
import { Logger } from '@nestjs/common';

@Processor('workflow')
export class WorkflowProcessor extends WorkerHost {
  private readonly logger = new Logger(WorkflowProcessor.name);

  constructor(
    @InjectRepository(WorkflowInstance)
    private readonly instanceRepo: Repository<WorkflowInstance>,
    @InjectRepository(WorkflowStep)
    private readonly stepRepo: Repository<WorkflowStep>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    const { name, data } = job;
    this.logger.log(`Processing workflow job: ${name}`);

    try {
      switch (name) {
        case 'notify-step':
          await this.handleStepNotification(data);
          break;
        case 'notify-completed':
          await this.handleCompletedNotification(data);
          break;
        case 'notify-delegation':
          await this.handleDelegationNotification(data);
          break;
        case 'check-timeout':
          await this.checkWorkflowTimeout(data);
          break;
        default:
          this.logger.warn(`Unknown job type: ${name}`);
      }
    } catch (err) {
      this.logger.error(`Failed to process job ${name}: ${err.message}`, err.stack);
      throw err;
    }
  }

  private async handleStepNotification(data: { instanceId: string; stepId: string; action: string }): Promise<void> {
    const { instanceId, stepId, action } = data;

    const instance = await this.instanceRepo.findOne({
      where: { instanceId },
      relations: ['workflow'],
    });
    if (!instance) {
      this.logger.error(`Workflow instance not found: ${instanceId}`);
      return;
    }

    const step = await this.stepRepo.findOne({ where: { stepId } });
    if (!step) {
      this.logger.error(`Workflow step not found: ${stepId}`);
      return;
    }

    let usersToNotify: User[] = [];
    if (step.approverUserId) {
      const user = await this.userRepo.findOne({ where: { userId: step.approverUserId } });
      if (user) usersToNotify.push(user);
    } else if (step.approverRoleId) {
      usersToNotify = await this.userRepo.find({ where: { roleId: step.approverRoleId, isActive: true } });
    }

    const title = `Workflow Action Required: ${step.stepName}`;
    const message = `Workflow instance for ${instance.entityType} (ID: ${instance.entityId}) has reached step "${step.stepName}" (Level ${step.approvalLevel || 1}). Action: ${action}.`;

    for (const user of usersToNotify) {
      await this.notificationsService.createNotification({
        companyId: instance.workflow?.companyId || user.companyId || 'system',
        userId: user.userId,
        title,
        message,
        moduleName: instance.entityType,
        recordId: instance.entityId,
        notificationType: 'workflow',
      });

      await this.notificationsService.sendEmail({
        to: user.email,
        subject: title,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2>Approval Required: ${step.stepName}</h2>
            <p>Hello ${user.name || 'User'},</p>
            <p>${message}</p>
            <p>Please log in to your KOI-ERP dashboard to review and approve/reject this request.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin-top: 20px;" />
            <p style="font-size: 11px; color: #777;">This is an automated system notification.</p>
          </div>
        `,
        text: `Approval Required: ${step.stepName}\n\n${message}\n\nPlease log in to your KOI-ERP dashboard to review this request.`,
      });
    }
  }

  private async handleCompletedNotification(data: { instanceId: string; status: string }): Promise<void> {
    const { instanceId, status } = data;

    const instance = await this.instanceRepo.findOne({
      where: { instanceId },
      relations: ['workflow'],
    });
    if (!instance) {
      this.logger.error(`Workflow instance not found: ${instanceId}`);
      return;
    }

    if (!instance.initiatedBy) return;

    const initiator = await this.userRepo.findOne({ where: { userId: instance.initiatedBy } });
    if (!initiator) return;

    const title = `Workflow ${status.toUpperCase()}: ${instance.workflow?.name || 'Approval request'}`;
    const message = `Your workflow approval request for ${instance.entityType} (ID: ${instance.entityId}) has been ${status}.`;

    await this.notificationsService.createNotification({
      companyId: instance.workflow?.companyId || initiator.companyId || 'system',
      userId: initiator.userId,
      title,
      message,
      moduleName: instance.entityType,
      recordId: instance.entityId,
      notificationType: 'workflow',
    });

    await this.notificationsService.sendEmail({
      to: initiator.email,
      subject: title,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Workflow Request Resolution</h2>
          <p>Hello ${initiator.name || 'User'},</p>
          <p>${message}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin-top: 20px;" />
          <p style="font-size: 11px; color: #777;">This is an automated system notification.</p>
        </div>
      `,
      text: `Workflow Request Resolution\n\n${message}`,
    });
  }

  private async handleDelegationNotification(data: { instanceId: string; delegatedToUserId?: string; delegatedToRoleId?: string }): Promise<void> {
    const { instanceId, delegatedToUserId, delegatedToRoleId } = data;

    const instance = await this.instanceRepo.findOne({
      where: { instanceId },
      relations: ['workflow'],
    });
    if (!instance) {
      this.logger.error(`Workflow instance not found: ${instanceId}`);
      return;
    }

    let usersToNotify: User[] = [];
    if (delegatedToUserId) {
      const user = await this.userRepo.findOne({ where: { userId: delegatedToUserId } });
      if (user) usersToNotify.push(user);
    } else if (delegatedToRoleId) {
      usersToNotify = await this.userRepo.find({ where: { roleId: delegatedToRoleId, isActive: true } });
    }

    const title = `Workflow Task Delegated to You`;
    const message = `A workflow approval task for ${instance.entityType} (ID: ${instance.entityId}) has been delegated to your attention.`;

    for (const user of usersToNotify) {
      await this.notificationsService.createNotification({
        companyId: instance.workflow?.companyId || user.companyId || 'system',
        userId: user.userId,
        title,
        message,
        moduleName: instance.entityType,
        recordId: instance.entityId,
        notificationType: 'workflow',
      });

      await this.notificationsService.sendEmail({
        to: user.email,
        subject: title,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2>Workflow Task Delegated</h2>
            <p>Hello ${user.name || 'User'},</p>
            <p>${message}</p>
            <p>Please review the delegated task in your KOI-ERP dashboard.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin-top: 20px;" />
            <p style="font-size: 11px; color: #777;">This is an automated system notification.</p>
          </div>
        `,
        text: `Workflow Task Delegated\n\n${message}`,
      });
    }
  }

  private async checkWorkflowTimeout(data: any): Promise<void> {
    this.logger.log(`Checking timeouts for workflow instances: ${JSON.stringify(data)}`);
  }
}
