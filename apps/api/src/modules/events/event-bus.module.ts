import { Module, Global, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventBusService } from './event-bus.service';
import { FmsEventListener } from './listeners/fms-event.listener';
import { NotificationEventListener } from './listeners/notification-event.listener';
import { AuditEventListener } from './listeners/audit-event.listener';
import { ProductReviewListener } from './listeners/product-review.listener';
import { FmsTask } from '../fms/entities/fms-task.entity';
import { User } from '../users/entities/user.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { createNoopQueueProviders, queuesEnabled } from '../../common/queue.config';
import { FmsModule } from '../fms/fms.module';
import { NotificationsModule } from '../notifications/notifications.module';

const eventQueueNames = ['fms', 'notifications', 'workflow'];
const isQueueEnabled = queuesEnabled();

@Global()
@Module({
  imports: [
    FmsModule,
    forwardRef(() => NotificationsModule),
    ...(isQueueEnabled
      ? [
        BullModule.registerQueue(
          { name: 'fms' },
          { name: 'notifications' },
          { name: 'workflow' },
        ),
      ]
      : []),
    TypeOrmModule.forFeature([FmsTask, User, AuditLog]),
  ],
  providers: [
    ...(!isQueueEnabled ? createNoopQueueProviders(eventQueueNames) : []),
    EventBusService,
    FmsEventListener,
    NotificationEventListener,
    AuditEventListener,
    ProductReviewListener,
  ],
  exports: [EventBusService],
})
export class EventBusModule { }
