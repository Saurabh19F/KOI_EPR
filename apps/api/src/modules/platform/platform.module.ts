import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { ProvisioningService } from './provisioning.service';
import { FeatureService } from './feature.service';
import { SubscriptionService } from './subscription.service';
import { UsageService } from './usage.service';
import { Company } from './entities/company.entity';
import { CompanySettings } from './entities/company-settings.entity';
import { CompanyBranding } from './entities/company-branding.entity';
import { CompanyDomain } from './entities/company-domain.entity';
import { CompanyContact } from './entities/company-contact.entity';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { PlanFeature } from './entities/plan-feature.entity';
import { Feature } from './entities/feature.entity';
import { UsageMetric } from './entities/usage-metric.entity';
import { TrialHistory } from './entities/trial-history.entity';
import { OnboardingChecklist } from './entities/onboarding-checklist.entity';
import { ProvisioningJob } from './entities/provisioning-job.entity';
import { ApiKey } from './entities/api-key.entity';
import { Webhook } from './entities/webhook.entity';
import { WebhookLog } from './entities/webhook-log.entity';
import { SupportTicket } from './entities/support-ticket.entity';
import { Announcement } from './entities/announcement.entity';
import { MaintenanceWindow } from './entities/maintenance-window.entity';
import { BackupLog } from './entities/backup-log.entity';
import { RestoreLog } from './entities/restore-log.entity';
import { PlatformAuditLog } from './entities/platform-audit-log.entity';
import { LoginHistory } from './entities/login-history.entity';
import { SecurityEvent } from './entities/security-event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
      CompanySettings,
      CompanyBranding,
      CompanyDomain,
      CompanyContact,
      Subscription,
      SubscriptionPlan,
      PlanFeature,
      Feature,
      UsageMetric,
      TrialHistory,
      OnboardingChecklist,
      ProvisioningJob,
      ApiKey,
      Webhook,
      WebhookLog,
      SupportTicket,
      Announcement,
      MaintenanceWindow,
      BackupLog,
      RestoreLog,
      PlatformAuditLog,
      LoginHistory,
      SecurityEvent,
    ]),
    AuthModule,
  ],
  controllers: [PlatformController],
  providers: [
    PlatformService,
    ProvisioningService,
    FeatureService,
    SubscriptionService,
    UsageService,
  ],
  exports: [
    PlatformService,
    ProvisioningService,
    FeatureService,
    SubscriptionService,
    UsageService,
  ],
})
export class PlatformModule {}
