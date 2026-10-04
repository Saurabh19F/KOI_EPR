import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantGuard } from '../tenant.service';
import { PlatformService } from '../platform.service';
import { FeatureService } from '../feature.service';
import { Company } from '../entities/company.entity';
import { CompanyBranding } from '../entities/company-branding.entity';
import { CompanyDomain } from '../entities/company-domain.entity';
import { CompanySettings } from '../entities/company-settings.entity';
import { CompanyContact } from '../entities/company-contact.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { Subscription } from '../entities/subscription.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
      CompanyBranding,
      CompanyDomain,
      CompanySettings,
      CompanyContact,
      SubscriptionPlan,
      Subscription,
    ]),
  ],
  providers: [TenantGuard, PlatformService, FeatureService],
  exports: [TenantGuard, PlatformService, FeatureService, TypeOrmModule],
})
export class PlatformCommonModule {}
