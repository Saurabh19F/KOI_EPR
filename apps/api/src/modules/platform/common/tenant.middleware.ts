import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    // Extract company context from various sources
    const companyId = this.extractCompanyId(req);
    
    if (companyId) {
      (req as any).companyId = companyId;
    }

    // Add tenant utilities to request
    (req as any).tenantUtils = {
      getCompanyId: () => (req as any).companyId,
      getTenant: () => (req as any).tenant,
      isTenantActive: () => {
        const tenant = (req as any).tenant;
        return tenant && tenant.status === 'active';
      },
    };

    next();
  }

  private extractCompanyId(req: Request): string | null {
    // 1. Check header (for API calls)
    const headerCompanyId = req.headers['x-company-id'] as string;
    if (headerCompanyId) return headerCompanyId;

    // 2. Check subdomain
    const host = req.headers.host || '';
    const subdomain = host.split('.')[0];
    if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
      return subdomain;
    }

    // 3. Check JWT token payload (set by auth guard)
    const user = (req as any).user;
    if (user?.companyId) return user.companyId;

    // 4. Check custom domain
    const customDomain = req.headers['x-custom-domain'] as string;
    if (customDomain) {
      return customDomain;
    }

    return null;
  }
}
