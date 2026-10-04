import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { WorkflowDefinition } from './entities/workflow-definition.entity';
import { WorkflowInstance } from './entities/workflow-instance.entity';
import { WorkflowStep } from './entities/workflow-step.entity';
import { WorkflowTransition } from './entities/workflow-transition.entity';
import { ApprovalRequest } from './entities/approval.entity';
import { User } from '../users/entities/user.entity';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { WorkflowProcessor } from './processors/workflow.processor';
import { ApprovalController } from './approval.controller';
import { ApprovalService } from './approval.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { createNoopQueueProviders, queuesEnabled } from '../../common/queue.config';

const isQueueEnabled = queuesEnabled();

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkflowDefinition,
      WorkflowInstance,
      WorkflowStep,
      WorkflowTransition,
      ApprovalRequest,
      User,
    ]),
    NotificationsModule,
    ...(isQueueEnabled
      ? [
          BullModule.registerQueue({
            name: 'workflow',
          }),
        ]
      : []),
  ],
  controllers: [WorkflowController, ApprovalController],
  providers: [
    ...(!isQueueEnabled ? createNoopQueueProviders(['workflow']) : []),
    WorkflowService,
    ApprovalService,
    ...(isQueueEnabled ? [WorkflowProcessor] : []),
  ],
  exports: [WorkflowService, ApprovalService],
})
export class WorkflowModule {}
