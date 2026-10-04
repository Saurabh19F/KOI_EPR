import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsageMetric, MetricType } from '../../modules/platform/entities/usage-metric.entity';

export interface UsageRecord {
  companyId: string;
  metric: MetricType;
  value: number;
  date?: Date;
}

@Injectable()
export class UsageTrackingService {
  private readonly logger = new Logger(UsageTrackingService.name);

  constructor(
    @InjectRepository(UsageMetric)
    private usageRepo: Repository<UsageMetric>,
  ) {}

  /**
   * Track a usage event
   */
  async trackUsage(record: UsageRecord): Promise<void> {
    const today = record.date || new Date();
    const dateStr = today.toISOString().split('T')[0];

    // Check if metric already exists for this date
    let metric = await this.usageRepo.findOne({
      where: {
        companyId: record.companyId,
        metricType: record.metric,
        date: today,
      },
    });

    if (metric) {
      metric.count = Number(metric.count) + record.value;
      metric.updatedAt = new Date();
    } else {
      metric = this.usageRepo.create({
        companyId: record.companyId,
        metricType: record.metric,
        date: today,
        count: record.value,
      });
    }

    await this.usageRepo.save(metric);
    this.logger.debug(`Tracked ${record.metric}: ${record.value} for company ${record.companyId}`);
  }

  /**
   * Track multiple usage events
   */
  async trackBatchUsage(records: UsageRecord[]): Promise<void> {
    for (const record of records) {
      await this.trackUsage(record);
    }
  }

  /**
   * Get usage summary for a company
   */
  async getUsageSummary(companyId: string): Promise<{
    metrics: Array<{
      name: string;
      current: number;
      limit: number | null;
    }>;
    totalApiCalls: number;
    totalEmails: number;
    totalDocuments: number;
  }> {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const metrics = await this.usageRepo
      .createQueryBuilder('metric')
      .where('metric.companyId = :companyId', { companyId })
      .andWhere('metric.date >= :monthStart', { monthStart })
      .getMany();

    const result = {
      metrics: [] as any[],
      totalApiCalls: 0,
      totalEmails: 0,
      totalDocuments: 0,
    };

    for (const metric of metrics) {
      const limit = this.getLimitForMetric(metric.metricType);
      const count = Number(metric.count) || 0;

      result.metrics.push({
        name: metric.metricType,
        current: count,
        limit,
      });

      // Aggregate totals
      switch (metric.metricType) {
        case MetricType.API_CALLS:
          result.totalApiCalls = count;
          break;
        case MetricType.EMAILS_SENT:
          result.totalEmails = count;
          break;
        case MetricType.DOCUMENTS:
          result.totalDocuments = count;
          break;
      }
    }

    return result;
  }

  /**
   * Get usage with limits for display
   */
  async getUsageWithLimits(companyId: string): Promise<{
    users: { current: number; limit: number };
    storage: { currentMb: number; limitMb: number };
    apiCalls: { current: number; limit: number; resetsAt: Date };
    emails: { current: number; limit: number };
  }> {
    const summary = await this.getUsageSummary(companyId);

    const usersMetric = summary.metrics.find(m => m.name === MetricType.USERS);
    const storageMetric = summary.metrics.find(m => m.name === MetricType.STORAGE);
    const apiMetric = summary.metrics.find(m => m.name === MetricType.API_CALLS);
    const emailsMetric = summary.metrics.find(m => m.name === MetricType.EMAILS_SENT);

    return {
      users: {
        current: usersMetric?.current || 0,
        limit: usersMetric?.limit || 10,
      },
      storage: {
        currentMb: storageMetric?.current || 0,
        limitMb: storageMetric?.limit || 1000,
      },
      apiCalls: {
        current: apiMetric?.current || 0,
        limit: apiMetric?.limit || 10000,
        resetsAt: this.getNextMonthStart(),
      },
      emails: {
        current: emailsMetric?.current || 0,
        limit: emailsMetric?.limit || 1000,
      },
    };
  }

  /**
   * Check if company is within limits
   */
  async checkLimits(companyId: string): Promise<{
    withinLimits: boolean;
    violations: Array<{ metric: string; message: string }>;
  }> {
    const usage = await this.getUsageWithLimits(companyId);
    const violations: Array<{ metric: string; message: string }> = [];

    if (usage.users.current >= usage.users.limit) {
      violations.push({
        metric: 'users',
        message: `User limit reached (${usage.users.current}/${usage.users.limit})`,
      });
    }

    if (usage.apiCalls.current >= usage.apiCalls.limit) {
      violations.push({
        metric: 'api_calls',
        message: `API call limit reached (${usage.apiCalls.current}/${usage.apiCalls.limit})`,
      });
    }

    return {
      withinLimits: violations.length === 0,
      violations,
    };
  }

  private getNextMonthStart(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  private getLimitForMetric(metricType: MetricType): number | null {
    const limits: Partial<Record<MetricType, number>> = {
      [MetricType.API_CALLS]: 10000,
      [MetricType.EMAILS_SENT]: 1000,
      [MetricType.DOCUMENTS]: 1000,
      [MetricType.USERS]: 10,
    };
    return limits[metricType] || null;
  }
}
