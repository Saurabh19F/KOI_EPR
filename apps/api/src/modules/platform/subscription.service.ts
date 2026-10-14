import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { Company, SubscriptionStatus } from './entities/company.entity';
import { TrialHistory, TrialEvent } from './entities/trial-history.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(TrialHistory)
    private trialHistoryRepository: Repository<TrialHistory>,
    @InjectRepository(SubscriptionPlan)
    private planRepository: Repository<SubscriptionPlan>,
  ) {}

  async getSubscription(companyId: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: { companyId },
      relations: ['plan'],
    });
  }

  async startTrial(companyId: string, planId?: string): Promise<Subscription> {
    let plan = planId 
      ? await this.planRepository.findOne({ where: { id: planId } })
      : await this.planRepository.findOne({ where: { planCode: 'starter' } });

    if (!plan) {
      throw new BadRequestException('Plan not found');
    }

    const trialDays = plan.trialDays;
    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + trialDays);

    const subscription = this.subscriptionRepository.create({
      companyId,
      planId: plan.id,
      status: 'trialing',
      trialStart,
      trialEnd,
      trialConverted: false,
      autoRenew: true,
    });

    const savedSubscription = await this.subscriptionRepository.save(subscription);

    // Update company
    await this.companyRepository.update(companyId, {
      subscriptionStatus: SubscriptionStatus.TRIALING,
      trialStartsAt: trialStart,
      trialEndsAt: trialEnd,
      currentPlanId: plan.id,
    });

    // Log trial start
    await this.trialHistoryRepository.save({
      companyId,
      event: TrialEvent.STARTED,
      newTrialEnd: trialEnd,
    });

    return savedSubscription;
  }

  async extendTrial(companyId: string, days: number, reason?: string, extendedBy?: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { companyId },
    });

    if (!subscription) {
      throw new BadRequestException('Subscription not found');
    }

    if (subscription.status !== 'trialing') {
      throw new BadRequestException('Only trial subscriptions can be extended');
    }

    const previousTrialEnd = subscription.trialEnd;
    const newTrialEnd = new Date(subscription.trialEnd);
    newTrialEnd.setDate(newTrialEnd.getDate() + days);

    subscription.trialEnd = newTrialEnd;
    await this.subscriptionRepository.save(subscription);

    // Update company
    await this.companyRepository.update(companyId, {
      trialEndsAt: newTrialEnd,
    });

    // Log extension
    await this.trialHistoryRepository.save({
      companyId,
      event: TrialEvent.EXTENDED,
      previousTrialEnd,
      newTrialEnd,
      extendedDays: days,
      reason,
      createdBy: extendedBy,
    });

    return subscription;
  }

  async upgradePlan(companyId: string, newPlanId: string): Promise<Subscription> {
    const newPlan = await this.planRepository.findOne({ where: { id: newPlanId } });
    
    if (!newPlan) {
      throw new BadRequestException('Plan not found');
    }

    const subscription = await this.subscriptionRepository.findOne({
      where: { companyId },
    });

    if (!subscription) {
      throw new BadRequestException('Subscription not found');
    }

    // If converting from trial
    if (subscription.status === 'trialing') {
      await this.convertTrialToPaid(companyId);
    }

    subscription.planId = newPlanId;
    await this.subscriptionRepository.save(subscription);

    // Update company
    await this.companyRepository.update(companyId, {
      currentPlanId: newPlanId,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
    });

    // Log upgrade
    await this.trialHistoryRepository.save({
      companyId,
      event: TrialEvent.CONVERTED,
    });

    return subscription;
  }

  async convertTrialToPaid(companyId: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { companyId },
    });

    if (!subscription || subscription.status !== 'trialing') {
      return;
    }

    const now = new Date();
    subscription.status = 'active';
    subscription.trialConverted = true;
    subscription.currentPeriodStart = now;
    subscription.currentPeriodEnd = new Date(now.setMonth(now.getMonth() + 1));

    await this.subscriptionRepository.save(subscription);

    // Update company
    await this.companyRepository.update(companyId, {
      subscriptionStatus: SubscriptionStatus.ACTIVE,
    });

    // Log conversion
    await this.trialHistoryRepository.save({
      companyId,
      event: TrialEvent.CONVERTED,
    });
  }

  async cancelSubscription(companyId: string, immediate: boolean = false, reason?: string, cancelledBy?: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { companyId },
    });

    if (!subscription) {
      throw new BadRequestException('Subscription not found');
    }

    subscription.cancelledAt = new Date();
    subscription.cancelledBy = cancelledBy;
    subscription.cancelReason = reason;
    subscription.cancelledImmediately = immediate;
    subscription.autoRenew = false;

    await this.subscriptionRepository.save(subscription);

    // Update company
    await this.companyRepository.update(companyId, {
      subscriptionStatus: immediate ? SubscriptionStatus.CANCELLED : SubscriptionStatus.EXPIRED,
    });
  }

  async checkTrialExpiration(): Promise<string[]> {
    const now = new Date();
    const expiredCompanies: string[] = [];

    const expiringTrials = await this.subscriptionRepository.find({
      where: { status: 'trialing' },
    });

    for (const subscription of expiringTrials) {
      if (subscription.trialEnd && subscription.trialEnd < now) {
        subscription.status = 'expired';
        await this.subscriptionRepository.save(subscription);

        await this.companyRepository.update(subscription.companyId, {
          subscriptionStatus: SubscriptionStatus.EXPIRED,
        });

        // Log expiration
        await this.trialHistoryRepository.save({
          companyId: subscription.companyId,
          event: TrialEvent.EXPIRED,
        });

        expiredCompanies.push(subscription.companyId);
      }
    }

    return expiredCompanies;
  }

  async getTrialHistory(companyId: string): Promise<TrialHistory[]> {
    return this.trialHistoryRepository.find({
      where: { companyId },
      order: { createdAt: 'DESC' },
    });
  }

  async getSubscriptionStats(): Promise<{
    trialing: number;
    active: number;
    pastDue: number;
    suspended: number;
    expired: number;
    cancelled: number;
  }> {
    const stats = await this.subscriptionRepository
      .createQueryBuilder('sub')
      .select('sub.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('sub.status')
      .getRawMany();

    const result = {
      trialing: 0,
      active: 0,
      pastDue: 0,
      suspended: 0,
      expired: 0,
      cancelled: 0,
    };

    for (const stat of stats) {
      const status = stat.status as keyof typeof result;
      if (status in result) {
        result[status] = parseInt(stat.count, 10);
      }
    }

    return result;
  }
}
