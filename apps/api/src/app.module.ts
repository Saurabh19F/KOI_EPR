import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MastersModule } from './modules/masters/masters.module';
import { SalesModule } from './modules/sales/sales.module';
import { PurchaseModule } from './modules/purchase/purchase.module';
import { RateModule } from './modules/rate/rate.module';
import { FmsModule } from './modules/fms/fms.module';
import { FilesModule } from './modules/files/files.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AdminModule } from './modules/admin/admin.module';
import { PlatformModule } from './modules/platform/platform.module';
import { FinancialModule } from './modules/financial/financial.module';
import { SalesOrderModule } from './modules/sales-order/sales-order.module';
import { PurchaseOrderModule } from './modules/purchase-order/purchase-order.module';
import { CommonModule } from './common/common.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { EventBusModule } from './modules/events/event-bus.module';
import { SearchModule } from './modules/search/search.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { InventoryV2Module } from './modules/inventory-v2/inventory-tracking.module';
import { ReportsV2Module } from './modules/reports-v2/reports.module';
import { AuthV2Module } from './modules/auth-v2/auth-v2.module';
import { createRedisConnectionOptions, queuesEnabled } from './common/queue.config';
import { SnakeNamingStrategy } from './common/typeorm/snake-naming.strategy';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { HealthController } from './health.controller';

const isQueueEnabled = queuesEnabled();

@Module({
  imports: [
    // Event Emitter
    EventEmitterModule.forRoot(),

    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate Limiting - dashboard pages can load several APIs during rapid navigation
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ([{
        ttl: Number(config.get('THROTTLE_TTL_MS', 60000)),
        limit: Number(config.get('THROTTLE_LIMIT', 300)),
      }]),
      inject: [ConfigService],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get('NODE_ENV', 'development');
        const dbSsl = configService.get('DATABASE_SSL', 'false');
        const useSSL = dbSsl === 'true';
        // Production/staging: require valid certs. Dev: allow self-signed.
        const sslConfig = useSSL
          ? (nodeEnv === 'production' || nodeEnv === 'staging'
              ? { rejectUnauthorized: true }
              : { rejectUnauthorized: false })
          : false;

        return {
          type: 'postgres',
          url: configService.get('DATABASE_URL'),
          ssl: sslConfig,
          extra: {
            ssl: useSSL ? sslConfig : undefined,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 30000,
          },
          synchronize: configService.get('DATABASE_SYNC', 'false') === 'true',
          logging: configService.get('NODE_ENV') === 'development',
          autoLoadEntities: true,
          namingStrategy: new SnakeNamingStrategy(),
        };
      },
      inject: [ConfigService],
    }),

    ...(isQueueEnabled
      ? [
          // BullMQ for background jobs (Redis)
          BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (config: ConfigService) => ({
              connection: createRedisConnectionOptions(config),
            }),
            inject: [ConfigService],
          }),
        ]
      : []),

    // Common utilities
    CommonModule,

    // Global JwtModule to resolve JwtService in global guards
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET environment variable is required');
        }
        return {
          global: true,
          secret,
          signOptions: {
            expiresIn: configService.get('JWT_EXPIRES_IN', '15m'),
          },
        };
      },
      inject: [ConfigService],
    }),

    // Event Bus - MUST be early so other modules can emit events
    EventBusModule,

    // Modules - Order matters! Modules with dependencies must be imported after their dependencies
    // AuthModule, // DISABLED - circular dep
    UsersModule,
    MastersModule,
    SalesModule,
    PurchaseModule,
    RateModule,
    FmsModule,
    FilesModule,
    NotificationsModule,
    AuditModule,
    ReportsModule,
    AdminModule,
    PlatformModule,
    SearchModule,
    InventoryModule,
    InventoryV2Module,
    ReportsV2Module,
    AuthV2Module,
    FinancialModule,
    SalesOrderModule,
    PurchaseOrderModule,
    AccountsModule,
    WorkflowModule,
    // PriceAnalysisModule, // TEMPORARILY DISABLED - circular dependency issue

    // Workflow Engine - MUST be after other modules
  ],
  controllers: [HealthController],
  providers: [
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global roles/permissions guard
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
