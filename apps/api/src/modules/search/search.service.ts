import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Product } from '../masters/entities/product.entity';
import { Customer } from '../masters/entities/customer.entity';
import { ProductCategory } from '../masters/entities/product-category.entity';
import { Brand } from '../masters/entities/brand.entity';
import { SalesEnquiryOrder } from '../sales/entities/sales-enquiry.entity';
import { PurchaseQuote } from '../purchase/entities/purchase-quote.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';

interface SearchResult {
  module: string;
  moduleLabel: string;
  icon?: string;
  id: string;
  title: string;
  subtitle?: string;
  metadata?: Record<string, any>;
  score?: number;
  url?: string;
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  modules: Record<string, number>;
}

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    @InjectRepository(ProductCategory)
    private categoryRepo: Repository<ProductCategory>,
    @InjectRepository(Brand)
    private brandRepo: Repository<Brand>,
    @InjectRepository(SalesEnquiryOrder)
    private enquiryRepo: Repository<SalesEnquiryOrder>,
    @InjectRepository(PurchaseQuote)
    private quoteRepo: Repository<PurchaseQuote>,
    @InjectRepository(AuditLog)
    private auditLogRepo: Repository<AuditLog>,
  ) {}

  async search(params: {
    q: string;
    module?: string;
    page?: number;
    limit?: number;
    companyId?: string;
  }): Promise<SearchResponse> {
    const { q, module, page = 1, limit = 20, companyId } = params;

    if (!q || q.trim().length < 2) {
      return { query: q, results: [], total: 0, page, limit, modules: {} };
    }

    const searchTerm = `%${q.trim()}%`;
    const results: SearchResult[] = [];
    const modules: Record<string, number> = {};

    const baseWhere = companyId ? { companyId } : {};

    // Search Products
    if (!module || module === 'products') {
      const products = await this.productRepo.find({
        where: [
          { productName: ILike(searchTerm), deletedAt: null as any, ...baseWhere },
          { sku: ILike(searchTerm), deletedAt: null as any, ...baseWhere },
        ],
        take: 10,
        select: ['productId', 'productName', 'sku', 'productCode'],
      });

      products.forEach((p) => {
        results.push({
          module: 'products',
          moduleLabel: 'Product',
          icon: 'package',
          id: p.productId,
          title: p.productName,
          subtitle: `SKU: ${p.sku || p.productCode || 'N/A'}`,
          metadata: { sku: p.sku, code: p.productCode },
          url: `/dashboard/masters/products/${p.productId}`,
        });
      });
      modules['products'] = products.length;
    }

    // Search Customers
    if (!module || module === 'customers') {
      const customers = await this.customerRepo.find({
        where: [
          { customerName: ILike(searchTerm), ...baseWhere },
          { buyerCode: ILike(searchTerm), ...baseWhere },
        ],
        take: 10,
        select: ['customerId', 'customerName', 'buyerCode', 'email'],
      });

      customers.forEach((c) => {
        results.push({
          module: 'customers',
          moduleLabel: 'Customer',
          icon: 'users',
          id: c.customerId,
          title: c.customerName,
          subtitle: `Code: ${c.buyerCode || 'N/A'} ${c.email ? `| ${c.email}` : ''}`,
          metadata: { buyerCode: c.buyerCode, email: c.email },
          url: `/dashboard/masters/customers/${c.customerId}`,
        });
      });
      modules['customers'] = customers.length;
    }

    // Search Sales Enquiries
    if (!module || module === 'enquiries') {
      const enquiries = await this.enquiryRepo.find({
        where: [
          { enquiryOrderNo: ILike(searchTerm), ...baseWhere },
          { orderNo: ILike(searchTerm), ...baseWhere },
        ],
        take: 10,
        select: ['enquiryOrderId', 'enquiryOrderNo', 'orderNo', 'status', 'createdAt'],
      });

      enquiries.forEach((e) => {
        results.push({
          module: 'enquiries',
          moduleLabel: 'Sales Enquiry',
          icon: 'file-text',
          id: e.enquiryOrderId,
          title: e.enquiryOrderNo,
          subtitle: `${e.orderNo ? `Order: ${e.orderNo} | ` : ''}Status: ${e.status}`,
          metadata: { enquiryNo: e.enquiryOrderNo, status: e.status },
          url: `/dashboard/sales/enquiries/${e.enquiryOrderId}`,
        });
      });
      modules['enquiries'] = enquiries.length;
    }

    // Search Purchase Quotes
    if (!module || module === 'quotes') {
      const quotes = await this.quoteRepo.find({
        where: [
          { quoteNo: ILike(searchTerm), ...baseWhere },
          { salesEnquiryOrderNo: ILike(searchTerm), ...baseWhere },
        ],
        take: 10,
        select: ['quoteId', 'quoteNo', 'salesEnquiryOrderNo', 'status', 'createdAt'],
      });

      quotes.forEach((q) => {
        results.push({
          module: 'quotes',
          moduleLabel: 'Purchase Quote',
          icon: 'file-check',
          id: q.quoteId,
          title: q.quoteNo,
          subtitle: `${q.salesEnquiryOrderNo ? `Enquiry: ${q.salesEnquiryOrderNo} | ` : ''}Status: ${q.status}`,
          metadata: { quoteNo: q.quoteNo, status: q.status },
          url: `/dashboard/purchase/quotes/${q.quoteId}`,
        });
      });
      modules['quotes'] = quotes.length;
    }

    // Search Categories
    if (!module || module === 'categories') {
      const categories = await this.categoryRepo.find({
        where: { categoryName: ILike(searchTerm), isActive: true },
        take: 10,
        select: ['categoryId', 'categoryName', 'categoryCode'],
      });

      categories.forEach((c) => {
        results.push({
          module: 'categories',
          moduleLabel: 'Category',
          icon: 'folder',
          id: c.categoryId,
          title: c.categoryName,
          subtitle: `Code: ${c.categoryCode || 'N/A'}`,
          metadata: { code: c.categoryCode },
          url: `/dashboard/masters/categories/${c.categoryId}`,
        });
      });
      modules['categories'] = categories.length;
    }

    // Search Brands
    if (!module || module === 'brands') {
      const brands = await this.brandRepo.find({
        where: { brandName: ILike(searchTerm), isActive: true },
        take: 10,
        select: ['brandId', 'brandName', 'brandCode'],
      });

      brands.forEach((b) => {
        results.push({
          module: 'brands',
          moduleLabel: 'Brand',
          icon: 'tag',
          id: b.brandId,
          title: b.brandName,
          subtitle: `Code: ${b.brandCode || 'N/A'}`,
          metadata: { code: b.brandCode },
          url: `/dashboard/masters/brands/${b.brandId}`,
        });
      });
      modules['brands'] = brands.length;
    }

    // Search Audit Logs (admin only, no company filter)
    if (!module || module === 'audit') {
      const logs = await this.auditLogRepo.find({
        where: [
          { moduleName: ILike(searchTerm) },
          { recordId: ILike(searchTerm) },
        ],
        take: 10,
        order: { createdAt: 'DESC' },
        select: ['auditLogId', 'moduleName', 'recordId', 'action', 'changedBy', 'createdAt'],
      });

      logs.forEach((l) => {
        results.push({
          module: 'audit',
          moduleLabel: 'Audit Log',
          icon: 'activity',
          id: l.auditLogId,
          title: `${l.action} - ${l.moduleName}`,
          subtitle: `Record: ${l.recordId} | By: ${l.changedBy || 'System'}`,
          metadata: { action: l.action, moduleName: l.moduleName, recordId: l.recordId },
        });
      });
      modules['audit'] = logs.length;
    }

    // Sort by relevance (exact match first)
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase().startsWith(q.toLowerCase()) ? 0 : 1;
      const bExact = b.title.toLowerCase().startsWith(q.toLowerCase()) ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      return a.title.localeCompare(b.title);
    });

    // Paginate
    const start = (page - 1) * limit;
    const paginatedResults = results.slice(start, start + limit);

    return {
      query: q,
      results: paginatedResults,
      total: results.length,
      page,
      limit,
      modules,
    };
  }

  // Get quick suggestions for autocomplete
  async getSuggestions(q: string, limit: number = 5, companyId?: string): Promise<{ module: string; title: string; id: string; subtitle?: string; url?: string }[]> {
    if (!q || q.trim().length < 1) return [];

    const searchTerm = `%${q.trim()}%`;
    const suggestions: { module: string; title: string; id: string; subtitle?: string; url?: string }[] = [];
    const baseWhere = companyId ? { companyId } : {};

    // Quick product search
    const products = await this.productRepo.find({
      where: { productName: ILike(searchTerm), deletedAt: null as any, ...baseWhere },
      take: limit,
      select: ['productId', 'productName', 'sku'],
    });

    products.forEach((p) => {
      suggestions.push({
        module: 'products',
        title: p.productName,
        subtitle: p.sku,
        id: p.productId,
        url: `/dashboard/masters/products/${p.productId}`,
      });
    });

    // Quick customer search
    const customers = await this.customerRepo.find({
      where: { customerName: ILike(searchTerm), ...baseWhere },
      take: limit,
      select: ['customerId', 'customerName', 'buyerCode'],
    });

    customers.forEach((c) => {
      suggestions.push({
        module: 'customers',
        title: c.customerName,
        subtitle: c.buyerCode,
        id: c.customerId,
        url: `/dashboard/masters/customers/${c.customerId}`,
      });
    });

    // Quick enquiry search
    const enquiries = await this.enquiryRepo.find({
      where: { enquiryOrderNo: ILike(searchTerm), ...baseWhere },
      take: limit,
      select: ['enquiryOrderId', 'enquiryOrderNo', 'status'],
    });

    enquiries.forEach((e) => {
      suggestions.push({
        module: 'enquiries',
        title: e.enquiryOrderNo,
        subtitle: e.status,
        id: e.enquiryOrderId,
        url: `/dashboard/sales/enquiries/${e.enquiryOrderId}`,
      });
    });

    return suggestions.slice(0, limit);
  }
}
