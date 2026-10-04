import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface TenantInfo {
  companyId: string;
  companySlug?: string;
  subscriptionStatus: string;
  planCode?: string;
  features: Record<string, boolean>;
  limits: {
    maxUsers: number;
    maxStorageMb: number;
    currentUsers: number;
    currentStorageMb: number;
  };
}

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantInfo;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    // Extract tenant from subdomain, header, or JWT
    const host = req.get('host') || '';
    const subdomain = host.split('.')[0];

    // Check for tenant header (from API key or auth)
    const tenantId = req.headers['x-tenant-id'] as string;

    if (tenantId) {
      // Tenant specified via header (API access)
      req.tenant = await this.getTenantInfo(tenantId);
    } else if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
      // Subdomain-based tenant resolution
      req.tenant = await this.getTenantBySubdomain(subdomain);
    }

    next();
  }

  private async getTenantInfo(companyId: string): Promise<TenantInfo> {
    // In production, this would query the database
    // For now, return a default tenant
    return {
      companyId,
      subscriptionStatus: 'active',
      features: {
        salesEnquiryEnabled: true,
        purchaseQuoteEnabled: true,
        priceAnalysisEnabled: true,
        inventoryEnabled: true,
        financeEnabled: true,
        dashboardEnabled: true,
        reportsEnabled: true,
      },
      limits: {
        maxUsers: 10,
        maxStorageMb: 1000,
        currentUsers: 0,
        currentStorageMb: 0,
      },
    };
  }

  private async getTenantBySubdomain(slug: string): Promise<TenantInfo> {
    // In production, query companies table by slug
    return this.getTenantInfo(slug);
  }
}
