import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { UsageMetric, MetricType } from './entities/usage-metric.entity';
import { Company } from './entities/company.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';

@Injectable()
export class UsageService {
  constructor(
    @InjectRepository(UsageMetric)
    private usageRepository: Repository<UsageMetric>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(SubscriptionPlan)
    private planRepository: Repository<SubscriptionPlan>,
  ) {}

  async recordUsage(companyId: string, metricType: MetricType, count: number = 1): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let metric = await this.usageRepository.findOne({
      where: { companyId, metricType, date: today },
    });

    if (metric) {
      metric.count = metric.count + count;
    } else {
      metric = this.usageRepository.create({
        companyId,
        metricType,
        date: today,
        count,
      });
    }

    await this.usageRepository.save(metric);
  }

  async getUsage(companyId: string, metricType?: MetricType, startDate?: Date, endDate?: Date): Promise<UsageMetric[]> {
    const where: any = { companyId };

    if (metricType) {
      where.metricType = metricType;
    }

    if (startDate && endDate) {
      where.date = Between(startDate, endDate);
    }

    return this.usageRepository.find({
      where,
      order: { date: 'DESC' },
    });
  }

  async getCurrentMonthUsage(companyId: string): Promise<Record<string, number>> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const metrics = await this.usageRepository.find({
      where: { companyId, date: Between(startOfMonth, new Date()) },
    });

    const result: Record<string, number> = {};
    for (const metric of metrics) {
      result[metric.metricType] = Number(result[metric.metricType] || 0) + Number(metric.count);
    }

    return result;
  }

  async getUsageSummary(companyId: string): Promise<{
    users: number;
    storage: number;
    apiCalls: number;
    emails: number;
    documents: number;
    enquiries: number;
    quotes: number;
  }> {
    const usage = await this.getCurrentMonthUsage(companyId);

    return {
      users: usage[MetricType.USERS] || 0,
      storage: usage[MetricType.STORAGE] || 0,
      apiCalls: usage[MetricType.API_CALLS] || 0,
      emails: usage[MetricType.EMAILS_SENT] || 0,
      documents: usage[MetricType.DOCUMENTS] || 0,
      enquiries: usage[MetricType.ENQUIRIES] || 0,
      quotes: usage[MetricType.QUOTES] || 0,
    };
  }

  async checkLimits(companyId: string): Promise<{
    withinLimits: boolean;
    warnings: { metric: string; current: number; limit: number; percentUsed: number }[];
    exceeded: { metric: string; current: number; limit: number }[];
  }> {
    const company = await this.companyRepository.findOne({ where: { id: companyId } });
    
    if (!company?.currentPlanId) {
      return { withinLimits: true, warnings: [], exceeded: [] };
    }

    const plan = await this.planRepository.findOne({ where: { id: company.currentPlanId } });
    
    if (!plan) {
      return { withinLimits: true, warnings: [], exceeded: [] };
    }

    const usage = await this.getUsageSummary(companyId);
    const warnings: { metric: string; current: number; limit: number; percentUsed: number }[] = [];
    const exceeded: { metric: string; current: number; limit: number }[] = [];

    // Check users
    if (plan.userLimit && usage.users > 0) {
      const percentUsed = (usage.users / plan.userLimit) * 100;
      if (percentUsed >= 100) {
        exceeded.push({ metric: 'users', current: usage.users, limit: plan.userLimit });
      } else if (percentUsed >= 80) {
        warnings.push({ metric: 'users', current: usage.users, limit: plan.userLimit, percentUsed });
      }
    }

    // Check storage
    if (plan.storageLimitMb && usage.storage > 0) {
      const percentUsed = (usage.storage / plan.storageLimitMb) * 100;
      if (percentUsed >= 100) {
        exceeded.push({ metric: 'storage', current: usage.storage, limit: plan.storageLimitMb });
      } else if (percentUsed >= 80) {
        warnings.push({ metric: 'storage', current: usage.storage, limit: plan.storageLimitMb, percentUsed });
      }
    }

    // Check API calls
    if (plan.apiLimitPerMonth && usage.apiCalls > 0) {
      const percentUsed = (usage.apiCalls / plan.apiLimitPerMonth) * 100;
      if (percentUsed >= 100) {
        exceeded.push({ metric: 'api_calls', current: usage.apiCalls, limit: plan.apiLimitPerMonth });
      } else if (percentUsed >= 80) {
        warnings.push({ metric: 'api_calls', current: usage.apiCalls, limit: plan.apiLimitPerMonth, percentUsed });
      }
    }

    // Check emails
    if (plan.emailLimitPerMonth && usage.emails > 0) {
      const percentUsed = (usage.emails / plan.emailLimitPerMonth) * 100;
      if (percentUsed >= 100) {
        exceeded.push({ metric: 'emails', current: usage.emails, limit: plan.emailLimitPerMonth });
      } else if (percentUsed >= 80) {
        warnings.push({ metric: 'emails', current: usage.emails, limit: plan.emailLimitPerMonth, percentUsed });
      }
    }

    return {
      withinLimits: exceeded.length === 0,
      warnings,
      exceeded,
    };
  }

  async getPlatformUsage(): Promise<{
    totalUsers: number;
    totalStorage: number;
    totalApiCalls: number;
    totalEnquiries: number;
    topCompanies: { companyId: string; metricType: MetricType; count: number }[];
  }> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const metrics = await this.usageRepository.find({
      where: { date: Between(startOfMonth, new Date()) },
    });

    let totalUsers = 0;
    let totalStorage = 0;
    let totalApiCalls = 0;
    let totalEnquiries = 0;

    const companyMetrics: Record<string, Record<string, number>> = {};

    for (const metric of metrics) {
      const count = Number(metric.count);
      
      switch (metric.metricType) {
        case MetricType.USERS:
          totalUsers += count;
          break;
        case MetricType.STORAGE:
          totalStorage += count;
          break;
        case MetricType.API_CALLS:
          totalApiCalls += count;
          break;
        case MetricType.ENQUIRIES:
          totalEnquiries += count;
          break;
      }

      if (!companyMetrics[metric.companyId]) {
        companyMetrics[metric.companyId] = {};
      }
      companyMetrics[metric.companyId][metric.metricType] = count;
    }

    // Get top companies by any metric
    const topCompanies: { companyId: string; metricType: MetricType; count: number }[] = [];
    for (const [companyId, metrics] of Object.entries(companyMetrics)) {
      for (const [metricType, count] of Object.entries(metrics)) {
        topCompanies.push({ companyId, metricType: metricType as MetricType, count });
      }
    }

    topCompanies.sort((a, b) => b.count - a.count);
    topCompanies.splice(10); // Keep top 10

    return {
      totalUsers,
      totalStorage,
      totalApiCalls,
      totalEnquiries,
      topCompanies,
    };
  }

  async incrementUserCount(companyId: string): Promise<void> {
    await this.recordUsage(companyId, MetricType.USERS);
  }

  async incrementApiCalls(companyId: string, count: number = 1): Promise<void> {
    await this.recordUsage(companyId, MetricType.API_CALLS, count);
  }

  async incrementEmails(companyId: string, count: number = 1): Promise<void> {
    await this.recordUsage(companyId, MetricType.EMAILS_SENT, count);
  }

  async incrementDocuments(companyId: string, count: number = 1): Promise<void> {
    await this.recordUsage(companyId, MetricType.DOCUMENTS, count);
  }

  async incrementEnquiries(companyId: string, count: number = 1): Promise<void> {
    await this.recordUsage(companyId, MetricType.ENQUIRIES, count);
  }

  async incrementQuotes(companyId: string, count: number = 1): Promise<void> {
    await this.recordUsage(companyId, MetricType.QUOTES, count);
  }
}
