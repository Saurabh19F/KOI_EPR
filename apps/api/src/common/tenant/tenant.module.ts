import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsageMetric } from '../../modules/platform/entities/usage-metric.entity';
import { Subscription } from '../../modules/platform/entities/subscription.entity';
import { SubscriptionPlan } from '../../modules/platform/entities/subscription-plan.entity';
import { Company } from '../../modules/platform/entities/company.entity';
import { UsageTrackingService } from './usage-tracking.service';
import { SubscriptionManagementService } from './subscription-management.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsageMetric, Subscription, SubscriptionPlan, Company]),
  ],
  providers: [UsageTrackingService, SubscriptionManagementService],
  exports: [UsageTrackingService, SubscriptionManagementService],
})
export class TenantModule {}
