import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionManagementService } from '../../common/tenant/subscription-management.service';
import { UsageTrackingService } from '../../common/tenant/usage-tracking.service';
import { FeatureGuard, UsageLimitGuard } from '../../common/tenant/tenant.guard';

@ApiTags('Tenant Management')
@ApiBearerAuth()
@Controller('tenant')
@UseGuards(JwtAuthGuard)
export class TenantController {
  constructor(
    private readonly subscriptionService: SubscriptionManagementService,
    private readonly usageService: UsageTrackingService,
  ) {}

  // ============ SUBSCRIPTION MANAGEMENT ============

  @Get('plans')
  @ApiOperation({ summary: 'Get all available subscription plans' })
  getPlans() {
    return this.subscriptionService.getPlans();
  }

  @Get('plans/compare/:planCode')
  @ApiOperation({ summary: 'Compare current plan with another plan' })
  comparePlans(
    @Param('planCode') planCode: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId;
    return this.subscriptionService.comparePlans(companyId, planCode);
  }

  @Get('subscription/status')
  @ApiOperation({ summary: 'Get current subscription status' })
  getSubscriptionStatus(@Request() req: any) {
    const companyId = req.user?.companyId;
    return this.subscriptionService.getSubscriptionStatus(companyId);
  }

  @Post('subscription/upgrade/:planCode')
  @ApiOperation({ summary: 'Upgrade to a higher plan' })
  upgradePlan(
    @Param('planCode') planCode: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId;
    return this.subscriptionService.upgradePlan(companyId, planCode);
  }

  @Post('subscription/downgrade/:planCode')
  @ApiOperation({ summary: 'Downgrade to a lower plan' })
  @UseGuards(FeatureGuard)
  downgradePlan(
    @Param('planCode') planCode: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId;
    return this.subscriptionService.downgradePlan(companyId, planCode);
  }

  @Post('subscription/cancel')
  @ApiOperation({ summary: 'Cancel subscription' })
  cancelSubscription(
    @Body('immediate') immediate: boolean,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId;
    return this.subscriptionService.cancelSubscription(companyId, immediate);
  }

  @Post('subscription/reactivate')
  @ApiOperation({ summary: 'Reactivate cancelled subscription' })
  reactivateSubscription(@Request() req: any) {
    const companyId = req.user?.companyId;
    return this.subscriptionService.reactivateSubscription(companyId);
  }

  // ============ USAGE TRACKING ============

  @Get('usage')
  @ApiOperation({ summary: 'Get current usage summary' })
  getUsage(@Request() req: any) {
    const companyId = req.user?.companyId;
    return this.usageService.getUsageSummary(companyId);
  }

  @Get('usage/detailed')
  @ApiOperation({ summary: 'Get detailed usage with limits' })
  getUsageDetailed(@Request() req: any) {
    const companyId = req.user?.companyId;
    return this.usageService.getUsageWithLimits(companyId);
  }

  @Get('usage/check-limits')
  @ApiOperation({ summary: 'Check if usage is within limits' })
  checkLimits(@Request() req: any) {
    const companyId = req.user?.companyId;
    return this.usageService.checkLimits(companyId);
  }

  @Post('usage/track')
  @ApiOperation({ summary: 'Track usage event' })
  @UseGuards(UsageLimitGuard)
  trackUsage(
    @Body() data: { metric: string; value: number },
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId;
    // Import MetricType here for validation
    return this.usageService.trackUsage({
      companyId,
      metric: data.metric as any,
      value: data.value,
    });
  }

  // ============ FEATURE FLAGS ============

  @Get('features')
  @ApiOperation({ summary: 'Get available features for current plan' })
  getFeatures(@Request() req: any) {
    const tenant = req.tenant;
    return {
      salesEnquiryEnabled: tenant?.features?.salesEnquiryEnabled ?? true,
      purchaseQuoteEnabled: tenant?.features?.purchaseQuoteEnabled ?? true,
      priceAnalysisEnabled: tenant?.features?.priceAnalysisEnabled ?? true,
      inventoryEnabled: tenant?.features?.inventoryEnabled ?? true,
      financeEnabled: tenant?.features?.financeEnabled ?? true,
      dashboardEnabled: tenant?.features?.dashboardEnabled ?? true,
      reportsEnabled: tenant?.features?.reportsEnabled ?? true,
    };
  }

  @Get('limits')
  @ApiOperation({ summary: 'Get usage limits for current plan' })
  getLimits(@Request() req: any) {
    const tenant = req.tenant;
    return tenant?.limits || {
      maxUsers: 10,
      maxStorageMb: 1000,
      currentUsers: 0,
      currentStorageMb: 0,
    };
  }
}
