import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, Like, In, IsNull, Not } from 'typeorm';
import { SalesEnquiryOrder, EnquiryStatus } from '../sales/entities/sales-enquiry.entity';
import { SalesEnquiryOrderItem } from '../sales/entities/sales-enquiry-item.entity';
import { PurchaseQuote, PurchaseStatus } from '../purchase/entities/purchase-quote.entity';
import { PurchaseQuoteItem } from '../purchase/entities/purchase-quote-item.entity';
import { PriceAnalysis, PriceAnalysisStatus } from '../rate/entities/price-analysis.entity';
import { FmsTask, FmsTaskStatus } from '../fms/entities/fms-task.entity';
import { Product } from '../masters/entities/product.entity';
import { Customer } from '../masters/entities/customer.entity';
import { PaginatedResult } from '../../common/types';

export interface SalesReportFilters {
  startDate?: string;
  endDate?: string;
  status?: EnquiryStatus;
  customerId?: string;
  salesPersonId?: string;
  page?: number;
  limit?: number;
}

export interface PurchaseReportFilters {
  startDate?: string;
  endDate?: string;
  status?: PurchaseStatus;
  partyName?: string;
  page?: number;
  limit?: number;
}

export interface DashboardStats {
  // Overview
  totalEnquiries: number;
  totalQuotes: number;
  totalProducts: number;
  totalCustomers: number;

  // Sales metrics
  enquiriesThisMonth: number;
  enquiriesLastMonth: number;
  enquiriesGrowth: number;
  wonEnquiries: number;
  lostEnquiries: number;
  conversionRate: number;

  // Purchase metrics
  quotesThisMonth: number;
  quotesLastMonth: number;
  quotesGrowth: number;
  approvedQuotes: number;
  pendingQuotes: number;

  // FMS metrics
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  delayedTasks: number;
  overdueTasks: number;

  // Rate analysis
  pendingRateAnalysis: number;
  lockedRates: number;

  // Recent activity
  recentEnquiries: any[];
  recentTasks: any[];
  recentQuotes: any[];
}

export interface EnquiryStatusSummary {
  status: string;
  count: number;
  percentage: number;
  value: number;
}

export interface SalesTrend {
  date: string;
  count: number;
  value: number;
  won: number;
  lost: number;
}

export interface PartyComparison {
  partyName: string;
  quoteCount: number;
  totalValue: number;
  avgLeadTime: number;
  selectedCount: number;
  selectionRate: number;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(SalesEnquiryOrder)
    private enquiryRepo: Repository<SalesEnquiryOrder>,
    @InjectRepository(SalesEnquiryOrderItem)
    private enquiryItemRepo: Repository<SalesEnquiryOrderItem>,
    @InjectRepository(PurchaseQuote)
    private purchaseQuoteRepo: Repository<PurchaseQuote>,
    @InjectRepository(PurchaseQuoteItem)
    private purchaseItemRepo: Repository<PurchaseQuoteItem>,
    @InjectRepository(PriceAnalysis)
    private priceAnalysisRepo: Repository<PriceAnalysis>,
    @InjectRepository(FmsTask)
    private fmsTaskRepo: Repository<FmsTask>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
  ) {}

  // ========== DASHBOARD STATS ==========

  async getDashboardStats(companyId?: string, days?: number): Promise<DashboardStats> {
    const now = new Date();
    let startDateFilter: Date | null = null;
    if (days) {
      startDateFilter = new Date();
      startDateFilter.setDate(startDateFilter.getDate() - days);
    }

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const whereCompany: any = companyId ? { companyId } : {};
    const dateWhere = startDateFilter ? { createdAt: MoreThanOrEqual(startDateFilter) } : {};

    // Overview counts
    const [
      totalEnquiries,
      totalQuotes,
      totalProducts,
      totalCustomers,
    ] = await Promise.all([
      this.enquiryRepo.count({ where: { ...whereCompany, ...dateWhere, deletedAt: IsNull() } }),
      this.purchaseQuoteRepo.count({ where: { ...whereCompany, ...dateWhere, deletedAt: IsNull() } }),
      this.productRepo.count({ where: { ...whereCompany, isActive: true } }),
      this.customerRepo.count({ where: { ...whereCompany, isActive: true } }),
    ]);

    // Sales - This month vs last month
    const [
      enquiriesThisMonth,
      enquiriesLastMonth,
      wonEnquiries,
      lostEnquiries,
    ] = await Promise.all([
      this.enquiryRepo.count({
        where: {
          ...whereCompany,
          deletedAt: IsNull(),
          createdAt: MoreThanOrEqual(startOfMonth),
        },
      }),
      this.enquiryRepo.count({
        where: {
          ...whereCompany,
          deletedAt: IsNull(),
          createdAt: Between(startOfLastMonth, endOfLastMonth),
        },
      }),
      this.enquiryRepo.count({
        where: {
          ...whereCompany,
          deletedAt: IsNull(),
          status: EnquiryStatus.WON,
        },
      }),
      this.enquiryRepo.count({
        where: {
          ...whereCompany,
          deletedAt: IsNull(),
          status: EnquiryStatus.LOST,
        },
      }),
    ]);

    const enquiriesGrowth = enquiriesLastMonth > 0
      ? ((enquiriesThisMonth - enquiriesLastMonth) / enquiriesLastMonth * 100)
      : enquiriesThisMonth > 0 ? 100 : 0;

    const conversionRate = totalEnquiries > 0
      ? (wonEnquiries / totalEnquiries * 100)
      : 0;

    // Purchase metrics
    const [
      quotesThisMonth,
      quotesLastMonth,
      approvedQuotes,
      pendingQuotes,
    ] = await Promise.all([
      this.purchaseQuoteRepo.count({
        where: {
          ...whereCompany,
          deletedAt: IsNull(),
          createdAt: MoreThanOrEqual(startOfMonth),
        },
      }),
      this.purchaseQuoteRepo.count({
        where: {
          ...whereCompany,
          deletedAt: IsNull(),
          createdAt: Between(startOfLastMonth, endOfLastMonth),
        },
      }),
      this.purchaseQuoteRepo.count({
        where: {
          ...whereCompany,
          deletedAt: IsNull(),
          status: PurchaseStatus.APPROVED,
        },
      }),
      this.purchaseQuoteRepo.count({
        where: {
          ...whereCompany,
          deletedAt: IsNull(),
          status: In([PurchaseStatus.DRAFT, PurchaseStatus.SUBMITTED, PurchaseStatus.VENDOR_QUOTE_PENDING]),
        },
      }),
    ]);

    const quotesGrowth = quotesLastMonth > 0
      ? ((quotesThisMonth - quotesLastMonth) / quotesLastMonth * 100)
      : quotesThisMonth > 0 ? 100 : 0;

    // FMS metrics
    const [
      pendingTasks,
      inProgressTasks,
      completedTasks,
      delayedTasks,
    ] = await Promise.all([
      this.fmsTaskRepo.count({
        where: { deletedAt: IsNull(), status: FmsTaskStatus.PENDING },
      }),
      this.fmsTaskRepo.count({
        where: { deletedAt: IsNull(), status: FmsTaskStatus.IN_PROGRESS },
      }),
      this.fmsTaskRepo.count({
        where: { deletedAt: IsNull(), status: FmsTaskStatus.COMPLETED },
      }),
      this.fmsTaskRepo.count({
        where: {
          deletedAt: IsNull(),
          status: FmsTaskStatus.DELAYED,
        },
      }),
    ]);

    const overdueTasks = await this.fmsTaskRepo.count({
      where: {
        deletedAt: IsNull(),
        slaDeadline: LessThanOrEqual(now),
        status: Not(FmsTaskStatus.COMPLETED),
      },
    });

    // Rate analysis
    const [pendingRateAnalysis, lockedRates] = await Promise.all([
      this.priceAnalysisRepo.count({
        where: {
          deletedAt: IsNull(),
          status: In([PriceAnalysisStatus.DRAFT, PriceAnalysisStatus.CALCULATED, PriceAnalysisStatus.SUBMITTED]),
        },
      }),
      this.priceAnalysisRepo.count({
        where: {
          deletedAt: IsNull(),
          status: PriceAnalysisStatus.LOCKED,
        },
      }),
    ]);

    // Recent activity
    const [recentEnquiries, recentTasks, recentQuotes] = await Promise.all([
      this.enquiryRepo.find({
        where: { ...whereCompany, deletedAt: IsNull() },
        order: { createdAt: 'DESC' },
        take: 5,
      }),
      this.fmsTaskRepo.find({
        where: { deletedAt: IsNull() },
        order: { createdAt: 'DESC' },
        take: 5,
      }),
      this.purchaseQuoteRepo.find({
        where: { ...whereCompany, deletedAt: IsNull() },
        order: { createdAt: 'DESC' },
        take: 5,
      }),
    ]);

    return {
      totalEnquiries,
      totalQuotes,
      totalProducts,
      totalCustomers,
      enquiriesThisMonth,
      enquiriesLastMonth,
      enquiriesGrowth: Math.round(enquiriesGrowth * 10) / 10,
      wonEnquiries,
      lostEnquiries,
      conversionRate: Math.round(conversionRate * 10) / 10,
      quotesThisMonth,
      quotesLastMonth,
      quotesGrowth: Math.round(quotesGrowth * 10) / 10,
      approvedQuotes,
      pendingQuotes,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      delayedTasks,
      overdueTasks,
      pendingRateAnalysis,
      lockedRates,
      recentEnquiries: recentEnquiries.map(e => ({
        id: e.enquiryOrderId,
        number: e.enquiryOrderNo,
        customer: (e as any).customer?.customerName || e.buyerName,
        status: e.status,
        date: e.createdAt,
      })),
      recentTasks: recentTasks.map(t => ({
        id: t.taskId,
        name: t.stepName,
        status: t.status,
        deadline: t.slaDeadline,
      })),
      recentQuotes: recentQuotes.map(q => ({
        id: q.quoteId,
        number: q.quoteNo,
        status: q.status,
        date: q.createdAt,
      })),
    };
  }

  // ========== SALES REPORTS ==========

  async getSalesReport(filters: SalesReportFilters): Promise<PaginatedResult<any>> {
    const { startDate, endDate, status, customerId, salesPersonId, page = 1, limit = 20 } = filters;

    const where: any = { deletedAt: IsNull() };

    if (status) {
      where.status = status;
    }
    if (customerId) {
      where.customerId = customerId;
    }
    if (salesPersonId) {
      where.salesPersonId = salesPersonId;
    }
    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.createdAt = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      where.createdAt = LessThanOrEqual(new Date(endDate));
    }

    const [data, total] = await Promise.all([
      this.enquiryRepo.find({
        where,
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.enquiryRepo.count({ where }),
    ]);

    // Calculate item counts for each enquiry
    const enrichedData = await Promise.all(
      data.map(async (enquiry) => {
        const items = await this.enquiryItemRepo.find({
          where: { enquiryOrderId: enquiry.enquiryOrderId, deletedAt: IsNull() },
        });
        return {
          ...enquiry,
          customerName: (enquiry as any).customer?.customerName || enquiry.buyerName,
          itemCount: items.length,
          totalCbm: items.reduce((sum, item) => sum + (Number(item.cbmPerBox) || 0), 0),
          totalValue: items.reduce((sum, item) => {
            const qty = Number(item.quantity) || 0;
            const rate = Number(item.expectedRate) || 0;
            const gst = Number(item.gstPercent) || 0;
            return sum + (qty * rate * (1 + gst / 100));
          }, 0),
        };
      })
    );

    return {
      data: enrichedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSalesEnquirySummary(startDate?: string, endDate?: string): Promise<{
    byStatus: EnquiryStatusSummary[];
    byMonth: SalesTrend[];
    totalValue: number;
    avgValue: number;
    topCustomers: any[];
  }> {
    const where: any = { deletedAt: IsNull() };

    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    }

    // Status distribution
    const statusCounts = await this.enquiryRepo
      .createQueryBuilder('enquiry')
      .select('enquiry.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(enquiry.totalValue), 0)', 'value')
      .where('enquiry.deletedAt IS NULL')
      .groupBy('enquiry.status')
      .getRawMany();

    const totalCount = statusCounts.reduce((sum, s) => sum + parseInt(s.count), 0);
    const totalValue = statusCounts.reduce((sum, s) => sum + parseFloat(s.value), 0);

    const byStatus: EnquiryStatusSummary[] = statusCounts.map(s => ({
      status: s.status,
      count: parseInt(s.count),
      percentage: totalCount > 0 ? Math.round(parseInt(s.count) / totalCount * 1000) / 10 : 0,
      value: parseFloat(s.value),
    }));

    // Monthly trend (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyData = await this.enquiryRepo
      .createQueryBuilder('enquiry')
      .select("TO_CHAR(enquiry.createdAt, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'count')
      .addSelect("TO_CHAR(enquiry.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COALESCE(SUM(enquiry.totalValue), 0)', 'value')
      .addSelect(`SUM(CASE WHEN enquiry.status = 'won' THEN 1 ELSE 0 END)`, 'won')
      .addSelect(`SUM(CASE WHEN enquiry.status = 'lost' THEN 1 ELSE 0 END)`, 'lost')
      .where('enquiry.deletedAt IS NULL')
      .andWhere('enquiry.createdAt >= :date', { date: twelveMonthsAgo })
      .groupBy("TO_CHAR(enquiry.createdAt, 'YYYY-MM')")
      .addGroupBy("TO_CHAR(enquiry.createdAt, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany();

    // Group by month
    const byMonthMap = new Map<string, SalesTrend>();
    monthlyData.forEach(row => {
      const existing = byMonthMap.get(row.month);
      if (existing) {
        existing.count += parseInt(row.count);
        existing.value += parseFloat(row.value);
        existing.won += parseInt(row.won);
        existing.lost += parseInt(row.lost);
      } else {
        byMonthMap.set(row.month, {
          date: row.month,
          count: parseInt(row.count),
          value: parseFloat(row.value),
          won: parseInt(row.won),
          lost: parseInt(row.lost),
        });
      }
    });

    const byMonth = Array.from(byMonthMap.values());

    // Top customers by enquiry count - using buyerName directly since there's no customer relation
    const topCustomersByName = await this.enquiryRepo
      .createQueryBuilder('enquiry')
      .select('enquiry.buyerName', 'customerName')
      .addSelect('COUNT(*)', 'enquiryCount')
      .addSelect('COALESCE(SUM(enquiry.totalValue), 0)', 'totalValue')
      .where('enquiry.deletedAt IS NULL')
      .andWhere('enquiry.buyerName IS NOT NULL')
      .groupBy('enquiry.buyerName')
      .orderBy('enquiryCount', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      byStatus,
      byMonth,
      totalValue,
      avgValue: totalCount > 0 ? totalValue / totalCount : 0,
      topCustomers: topCustomersByName.map(c => ({
        customerName: c.customerName,
        enquiryCount: parseInt(c.enquiryCount),
        totalValue: parseFloat(c.totalValue),
      })),
    };
  }

  // ========== PURCHASE REPORTS ==========

  async getPurchaseReport(filters: PurchaseReportFilters): Promise<PaginatedResult<any>> {
    const { startDate, endDate, status, partyName, page = 1, limit = 20 } = filters;

    const where: any = { deletedAt: IsNull() };

    if (status) {
      where.status = status;
    }
    if (partyName) {
      where.partyName = partyName;
    }
    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    }

    const [data, total] = await Promise.all([
      this.purchaseQuoteRepo.find({
        where,
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.purchaseQuoteRepo.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPartyComparisonReport(): Promise<PartyComparison[]> {
    const partyQuotes = await this.purchaseQuoteRepo
      .createQueryBuilder('quote')
      .select('quote.partyName', 'partyName')
      .addSelect('COUNT(*)', 'quoteCount')
      .addSelect('COALESCE(SUM(quote.grandTotal), 0)', 'totalValue')
      .addSelect("SUM(CASE WHEN quote.status IN ('approved', 'selected') THEN 1 ELSE 0 END)", 'selectedCount')
      .where('quote.deletedAt IS NULL')
      .andWhere('quote.partyName IS NOT NULL')
      .groupBy('quote.partyName')
      .orderBy('totalValue', 'DESC')
      .getRawMany();

    return partyQuotes.map(p => {
      const qCount = parseInt(p.quoteCount) || 0;
      const sCount = parseInt(p.selectedCount) || 0;
      return {
        partyName: p.partyName,
        quoteCount: qCount,
        totalValue: parseFloat(p.totalValue) || 0,
        avgLeadTime: 2,
        selectedCount: sCount,
        selectionRate: qCount > 0 ? Math.round((sCount / qCount) * 100) : 0,
      };
    });
  }

  async getPurchaseSummary(startDate?: string, endDate?: string): Promise<{
    byStatus: any[];
    totalValue: number;
    avgQuoteValue: number;
    topParties: any[];
  }> {
    const where: any = { deletedAt: IsNull() };

    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    }

    // Status distribution
    const statusCounts = await this.purchaseQuoteRepo
      .createQueryBuilder('quote')
      .select('quote.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(quote.grandTotal), 0)', 'value')
      .where('quote.deletedAt IS NULL')
      .groupBy('quote.status')
      .getRawMany();

    const totalValue = statusCounts.reduce((sum, s) => sum + parseFloat(s.value), 0);
    const totalCount = statusCounts.reduce((sum, s) => sum + parseInt(s.count), 0);

    // Top parties
    const topParties = await this.purchaseQuoteRepo
      .createQueryBuilder('quote')
      .select('quote.partyName', 'partyName')
      .addSelect('COUNT(*)', 'quoteCount')
      .addSelect('COALESCE(SUM(quote.grandTotal), 0)', 'totalValue')
      .where('quote.deletedAt IS NULL')
      .andWhere('quote.partyName IS NOT NULL')
      .groupBy('quote.partyName')
      .orderBy('totalValue', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      byStatus: statusCounts.map(s => ({
        status: s.status,
        count: parseInt(s.count),
        value: parseFloat(s.value),
      })),
      totalValue,
      avgQuoteValue: totalCount > 0 ? totalValue / totalCount : 0,
      topParties: topParties.map(p => ({
        partyName: p.partyName,
        quoteCount: parseInt(p.quoteCount),
        totalValue: parseFloat(p.totalValue),
      })),
    };
  }

  // ========== RATE ANALYSIS REPORTS ==========

  async getRateAnalysisReport(filters: {
    startDate?: string;
    endDate?: string;
    status?: PriceAnalysisStatus;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<any>> {
    const { startDate, endDate, status, page = 1, limit = 20 } = filters;

    const where: any = { deletedAt: IsNull() };

    if (status) {
      where.status = status;
    }
    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    }

    const [data, total] = await Promise.all([
      this.priceAnalysisRepo.find({
        where,
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.priceAnalysisRepo.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getRateAnalysisSummary(startDate?: string, endDate?: string): Promise<{
    byStatus: any[];
    totalAnalyses: number;
    lockedRates: number;
    avgMargin: number;
  }> {
    const where: any = { deletedAt: IsNull() };

    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    }

    const statusCounts = await this.priceAnalysisRepo
      .createQueryBuilder('analysis')
      .select('analysis.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('analysis.deletedAt IS NULL')
      .groupBy('analysis.status')
      .getRawMany();

    const [lockedRates, avgMarginResult] = await Promise.all([
      this.priceAnalysisRepo.count({
        where: { deletedAt: IsNull(), status: PriceAnalysisStatus.LOCKED },
      }),
      this.priceAnalysisRepo
        .createQueryBuilder('analysis')
        .select('AVG(analysis.finalMargin)', 'avgMargin')
        .where('analysis.deletedAt IS NULL')
        .andWhere('analysis.finalMargin IS NOT NULL')
        .getRawOne(),
    ]);

    return {
      byStatus: statusCounts.map(s => ({
        status: s.status,
        count: parseInt(s.count),
      })),
      totalAnalyses: statusCounts.reduce((sum, s) => sum + parseInt(s.count), 0),
      lockedRates,
      avgMargin: parseFloat(avgMarginResult?.avgMargin) || 0,
    };
  }

  // ========== FMS REPORTS ==========

  async getFmsReport(filters: {
    status?: FmsTaskStatus;
    assignedTo?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<any>> {
    const { status, assignedTo, startDate, endDate, page = 1, limit = 20 } = filters;

    const where: any = { deletedAt: IsNull() };

    if (status) {
      where.status = status;
    }
    if (assignedTo) {
      where.assignedTo = assignedTo;
    }
    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    }

    const [data, total] = await Promise.all([
      this.fmsTaskRepo.find({
        where,
        order: { slaDeadline: 'ASC', createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.fmsTaskRepo.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFmsSummary(): Promise<{
    byStatus: any[];
    delayedCount: number;
    overdueCount: number;
    avgCompletionTime: number;
    topPerformers: any[];
  }> {
    const now = new Date();

    const [statusCounts, delayedCount, overdueCount] = await Promise.all([
      this.fmsTaskRepo
        .createQueryBuilder('task')
        .select('task.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('task.deletedAt IS NULL')
        .groupBy('task.status')
        .getRawMany(),
      this.fmsTaskRepo.count({
        where: { deletedAt: IsNull(), status: FmsTaskStatus.DELAYED },
      }),
      this.fmsTaskRepo.count({
        where: {
          deletedAt: IsNull(),
          slaDeadline: LessThanOrEqual(now),
          status: Not(FmsTaskStatus.COMPLETED),
        },
      }),
    ]);

    // Average completion time for completed tasks
    const avgCompletion = await this.fmsTaskRepo
      .createQueryBuilder('task')
      .select('AVG(EXTRACT(EPOCH FROM (task.completedAt - task.actualStartDate))) / 3600', 'avgHours')
      .where('task.deletedAt IS NULL')
      .andWhere('task.completedAt IS NOT NULL')
      .andWhere('task.actualStartDate IS NOT NULL')
      .getRawOne();

    return {
      byStatus: statusCounts.map(s => ({
        status: s.status,
        count: parseInt(s.count),
      })),
      delayedCount,
      overdueCount,
      avgCompletionTime: Math.round(parseFloat(avgCompletion?.avgHours) || 0),
      topPerformers: [], // Would need user entity relation
    };
  }

  // ========== PRODUCT REPORTS ==========

  async getProductReport(filters: {
    categoryId?: string;
    brandId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<any>> {
    const { categoryId, brandId, search, page = 1, limit = 20 } = filters;

    const where: any = { isActive: true };

    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (brandId) {
      where.brandId = brandId;
    }
    if (search) {
      where.productName = Like(`%${search}%`);
    }

    const [data, total] = await Promise.all([
      this.productRepo.find({
        where,
        order: { productName: 'ASC' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.productRepo.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getLowStockProducts(): Promise<any[]> {
    return this.productRepo
      .createQueryBuilder('product')
      .where('product.isActive = true')
      .andWhere('product.currentStock <= product.reorderLevel')
      .andWhere('product.reorderLevel IS NOT NULL')
      .orderBy('product.currentStock', 'ASC')
      .limit(50)
      .getMany();
  }

  // ========== EXPORT DATA METHODS ==========

  async getSalesReportData(filters: any): Promise<any[]> {
    const where: any = { deletedAt: IsNull() };
    if (filters.days) {
      const d = new Date();
      d.setDate(d.getDate() - parseInt(filters.days));
      where.createdAt = MoreThanOrEqual(d);
    }
    if (filters.startDate) {
      where.createdAt = MoreThanOrEqual(new Date(filters.startDate));
    }
    if (filters.endDate) {
      where.createdAt = LessThanOrEqual(new Date(filters.endDate));
    }
    if (filters.status && filters.status !== 'all') {
      where.status = filters.status;
    }

    const enquiries = await this.enquiryRepo.find({
      where,
      take: 1000,
      order: { createdAt: 'DESC' },
    });

    return enquiries.map((e) => ({
      'Enquiry No': e.enquiryOrderNo,
      'Date': e.createdAt ? new Date(e.createdAt).toLocaleDateString() : '',
      'Customer': e.buyerName || '',
      'Country': e.country || '',
      'City': e.city || '',
      'Status': e.status,
    }));
  }

  async getPurchaseReportData(filters: any): Promise<any[]> {
    const where: any = { deletedAt: IsNull() };
    if (filters.days) {
      const d = new Date();
      d.setDate(d.getDate() - parseInt(filters.days));
      where.createdAt = MoreThanOrEqual(d);
    }
    if (filters.startDate) {
      where.createdAt = MoreThanOrEqual(new Date(filters.startDate));
    }
    if (filters.endDate) {
      where.createdAt = LessThanOrEqual(new Date(filters.endDate));
    }
    if (filters.status && filters.status !== 'all') {
      where.status = filters.status;
    }

    const quotes = await this.purchaseQuoteRepo.find({
      where,
      take: 1000,
      order: { createdAt: 'DESC' },
    });

    return quotes.map((q) => ({
      'Quote No': q.quoteNo,
      'Enquiry Ref': q.enquiryOrderNo || '',
      'Date': q.createdAt ? new Date(q.createdAt).toLocaleDateString() : '',
      'Party Code': q.partyCode || '',
      'Party Name': q.partyName || '',
      'Status': q.status,
      'Total Amount': q.grandTotal || 0,
    }));
  }

  async getProductsReportData(filters: any): Promise<any[]> {
    const where: any = { isActive: true };
    if (filters.search) {
      where.productName = Like(`%${filters.search}%`);
    }

    const products = await this.productRepo.find({
      where,
      take: 1000,
      order: { createdAt: 'DESC' },
    });

    return products.map((p) => ({
      'SKU': p.sku,
      'Name': p.productName,
      'Category': (p as any).category?.categoryName || '',
      'Stock': p.currentStock || 0,
      'Price': p.mrp || 0,
    }));
  }

  async getRateAnalysisReportData(filters: any): Promise<any[]> {
    const where: any = { deletedAt: IsNull() };
    if (filters.startDate) {
      where.createdAt = MoreThanOrEqual(new Date(filters.startDate));
    }
    if (filters.endDate) {
      where.createdAt = LessThanOrEqual(new Date(filters.endDate));
    }
    if (filters.status) {
      where.status = filters.status;
    }

    const analyses = await this.priceAnalysisRepo.find({
      where,
      take: 1000,
      order: { createdAt: 'DESC' },
    });

    return analyses.map((a) => ({
      'Enquiry No': a.enquiryOrderNo || a.analysisNo,
      'Date': a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '',
      'Customer': a.customerName || '',
      'Status': a.status,
      'Purchase Value': a.totalPurchaseValue || 0,
      'Selling Value': a.totalSellingValue || 0,
      'Margin %': a.totalMargin ? `${Number(a.totalMargin).toFixed(2)}%` : '0%',
    }));
  }

  async getEnquirySummaryReportData(filters: any): Promise<any[]> {
    const summary = await this.getSalesEnquirySummary(filters.startDate, filters.endDate);
    return summary.byStatus.map((s) => ({
      'Status': s.status,
      'Enquiry Count': s.count,
      'Total Value': s.value,
      'Percentage': `${s.percentage}%`,
    }));
  }
}
