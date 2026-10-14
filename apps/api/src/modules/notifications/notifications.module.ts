import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { Notification } from './entities/notification.entity';
import { NotificationEventListener } from '../events/listeners/notification-event.listener';
import { EventBusModule } from '../events/event-bus.module';
import { EmailProcessor } from './processors/email.processor';
import { WhatsAppProcessor } from './processors/whatsapp.processor';
import { createNoopQueueProviders, queuesEnabled } from '../../common/queue.config';

const isQueueEnabled = queuesEnabled();
const notificationQueueNames = ['email', 'whatsapp'];

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET environment variable is required');
        }
        return {
          secret,
          signOptions: { expiresIn: '15m' },
        };
      },
      inject: [ConfigService],
    }),
    forwardRef(() => EventBusModule),
    ...(isQueueEnabled
      ? [
          BullModule.registerQueue(
            { name: 'email' },
            { name: 'whatsapp' },
          ),
        ]
      : []),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsGateway,
    ...(!isQueueEnabled ? createNoopQueueProviders(notificationQueueNames) : []),
    ...(isQueueEnabled ? [EmailProcessor, WhatsAppProcessor] : []),
  ],
  exports: [
    NotificationsService,
    NotificationsGateway,
    ...(isQueueEnabled ? [BullModule] : []),
  ],
})
export class NotificationsModule {}
