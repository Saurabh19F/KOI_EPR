import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../../modules/platform/entities/subscription.entity';
import { SubscriptionPlan, PlanType } from '../../modules/platform/entities/subscription-plan.entity';
import { Company, CompanyStatus, SubscriptionStatus } from '../../modules/platform/entities/company.entity';

export interface PlanComparison {
  currentPlan: SubscriptionPlan;
  newPlan: SubscriptionPlan;
  priceDifference: {
    monthly: number;
    yearly: number;
  };
  newFeatures: string[];
  lostFeatures: string[];
  featureDifferences: Array<{
    feature: string;
    current: boolean;
    new: boolean;
  }>;
}

export interface SubscriptionCheckout {
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  successUrl: string;
  cancelUrl: string;
}

@Injectable()
export class SubscriptionManagementService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepo: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private planRepo: Repository<SubscriptionPlan>,
    @InjectRepository(Company)
    private companyRepo: Repository<Company>,
  ) {}

  /**
   * Get all available plans
   */
  async getPlans(): Promise<SubscriptionPlan[]> {
    return this.planRepo.find({
      where: { isPublic: true, isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  /**
   * Get plan by code
   */
  async getPlanByCode(planCode: string): Promise<SubscriptionPlan | null> {
    return this.planRepo.findOne({
      where: { planCode, isActive: true },
    });
  }

  /**
   * Compare two plans
   */
  async comparePlans(companyId: string, newPlanCode: string): Promise<PlanComparison> {
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (!company) throw new BadRequestException('Company not found');

    const currentPlan = await this.planRepo.findOne({ where: { id: company.currentPlanId } });
    const newPlan = await this.planRepo.findOne({ where: { planCode: newPlanCode } });

    if (!currentPlan || !newPlan) {
      throw new BadRequestException('Plan not found');
    }

    const featureFields = [
      'salesEnquiryEnabled', 'purchaseQuoteEnabled', 'priceAnalysisEnabled',
      'rateFmsEnabled', 'inventoryEnabled', 'productionEnabled',
      'financeEnabled', 'dashboardEnabled', 'reportsEnabled',
      'apiAccessEnabled', 'webhookEnabled', 'customDomainEnabled',
      'whiteLabelEnabled', 'sandboxEnabled', 'multiBranchEnabled',
      'multiCurrencyEnabled', 'advancedAnalyticsEnabled', 'aiAssistantEnabled',
    ];

    const newFeatures: string[] = [];
    const lostFeatures: string[] = [];
    const featureDifferences: PlanComparison['featureDifferences'] = [];

    for (const field of featureFields) {
      const current = (currentPlan as any)[field];
      const next = (newPlan as any)[field];

      if (next && !current) {
        newFeatures.push(field.replace(/Enabled$/, ''));
      } else if (current && !next) {
        lostFeatures.push(field.replace(/Enabled$/, ''));
      }

      if (current !== next) {
        featureDifferences.push({
          feature: field.replace(/Enabled$/, ''),
          current: !!current,
          new: !!next,
        });
      }
    }

    return {
      currentPlan,
      newPlan,
      priceDifference: {
        monthly: Number(newPlan.monthlyPriceInr) - Number(currentPlan.monthlyPriceInr),
        yearly: Number(newPlan.yearlyPriceInr) - Number(currentPlan.yearlyPriceInr),
      },
      newFeatures,
      lostFeatures,
      featureDifferences,
    };
  }

  /**
   * Upgrade subscription
   */
  async upgradePlan(companyId: string, newPlanCode: string): Promise<Company> {
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (!company) throw new BadRequestException('Company not found');

    const newPlan = await this.planRepo.findOne({ where: { planCode: newPlanCode } });
    if (!newPlan) throw new BadRequestException('Plan not found');

    // Update company limits
    company.currentPlanId = newPlan.id;
    company.maxUsers = newPlan.userLimit;
    company.maxStorageMb = newPlan.storageLimitMb;
    company.updatedAt = new Date();

    await this.companyRepo.save(company);

    // Update subscription if exists
    const subscription = await this.subscriptionRepo.findOne({
      where: { companyId },
    });

    if (subscription) {
      subscription.planId = newPlan.id;
      await this.subscriptionRepo.save(subscription);
    }

    return company;
  }

  /**
   * Downgrade subscription
   */
  async downgradePlan(companyId: string, newPlanCode: string): Promise<Company> {
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (!company) throw new BadRequestException('Company not found');

    // Check if current usage exceeds new plan limits
    const usageCheck = await this.checkUsageAgainstPlan(companyId, newPlanCode);
    if (!usageCheck.canDowngrade) {
      throw new BadRequestException(
        `Cannot downgrade: ${usageCheck.reasons.join(', ')}`
      );
    }

    return this.upgradePlan(companyId, newPlanCode);
  }

  /**
   * Check if usage is within plan limits
   */
  async checkUsageAgainstPlan(companyId: string, planCode: string): Promise<{
    canDowngrade: boolean;
    reasons: string[];
  }> {
    const plan = await this.planRepo.findOne({ where: { planCode } });
    if (!plan) return { canDowngrade: true, reasons: [] };

    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (!company) return { canDowngrade: true, reasons: [] };

    const reasons: string[] = [];

    // Check user count (would need user service)
    // For now, just check maxUsers
    if (company.maxUsers > plan.userLimit) {
      reasons.push(`User count (${company.maxUsers}) exceeds new plan limit (${plan.userLimit})`);
    }

    return {
      canDowngrade: reasons.length === 0,
      reasons,
    };
  }

  /**
   * Get subscription status
   */
  async getSubscriptionStatus(companyId: string): Promise<{
    status: string;
    plan: SubscriptionPlan;
    trialDaysRemaining: number | null;
    renewalDate: Date | null;
    isActive: boolean;
    canExtendTrial: boolean;
  }> {
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (!company) throw new BadRequestException('Company not found');

    const plan = await this.planRepo.findOne({ where: { id: company.currentPlanId } });
    if (!plan) throw new BadRequestException('Plan not found');

    const subscription = await this.subscriptionRepo.findOne({
      where: { companyId },
    });

    let trialDaysRemaining: number | null = null;
    let renewalDate: Date | null = null;

    if (subscription?.trialEnd) {
      const daysLeft = Math.ceil(
        (new Date(subscription.trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      trialDaysRemaining = Math.max(0, daysLeft);
    } else if (subscription?.currentPeriodEnd) {
      renewalDate = subscription.currentPeriodEnd;
    }

    const isActive = company.subscriptionStatus === SubscriptionStatus.ACTIVE ||
      company.subscriptionStatus === SubscriptionStatus.TRIALING;

    return {
      status: company.subscriptionStatus,
      plan,
      trialDaysRemaining,
      renewalDate,
      isActive,
      canExtendTrial: trialDaysRemaining !== null && trialDaysRemaining > 0,
    };
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(companyId: string, immediate: boolean = false): Promise<Subscription> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { companyId },
    });

    if (!subscription) throw new BadRequestException('No active subscription found');

    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    subscription.cancelledImmediately = immediate;

    await this.subscriptionRepo.save(subscription);

    // Update company status
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (company) {
      company.subscriptionStatus = SubscriptionStatus.CANCELLED;
      if (immediate) {
        company.status = CompanyStatus.SUSPENDED;
      }
      await this.companyRepo.save(company);
    }

    return subscription;
  }

  /**
   * Reactivate cancelled subscription
   */
  async reactivateSubscription(companyId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { companyId },
    });

    if (!subscription) throw new BadRequestException('No subscription found');

    const plan = await this.planRepo.findOne({
      where: { id: subscription.planId },
    });

    subscription.status = 'active';
    subscription.cancelledAt = null;
    subscription.currentPeriodStart = new Date();
    subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await this.subscriptionRepo.save(subscription);

    // Update company status
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (company) {
      company.subscriptionStatus = SubscriptionStatus.ACTIVE;
      company.status = CompanyStatus.ACTIVE;
      if (plan) {
        company.maxUsers = plan.userLimit;
        company.maxStorageMb = plan.storageLimitMb;
      }
      await this.companyRepo.save(company);
    }

    return subscription;
  }
}
