import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class TenantQueryFilter {
  private companyId: string | null = null;

  constructor(@Inject(REQUEST) private readonly request: Request) {
    this.companyId = this.extractCompanyId();
  }

  private extractCompanyId(): string | null {
    // From user object (set by JWT auth)
    const user = (this.request as any).user;
    if (user?.companyId) return user.companyId;

    // From tenant middleware
    const tenant = (this.request as any).tenant;
    if (tenant?.id) return tenant.id;

    // From header
    const headerCompanyId = this.request.headers['x-company-id'];
    if (typeof headerCompanyId === 'string') return headerCompanyId;

    return null;
  }

  getCompanyId(): string | null {
    return this.companyId;
  }

  /**
   * Filter a query builder to only return results for the current tenant
   * Automatically adds company_id WHERE clause
   */
  filter<T extends { companyId?: string }>(
    queryBuilder: any,
    alias: string = 'entity',
  ): any {
    if (!this.companyId) {
      // No company context - return empty results for safety
      return queryBuilder.where('1 = 0');
    }

    return queryBuilder.andWhere(`${alias}.companyId = :companyId`, {
      companyId: this.companyId,
    });
  }

  /**
   * Check if the current request has a valid company context
   */
  hasContext(): boolean {
    return !!this.companyId;
  }

  /**
   * Assert that company context exists, throw if not
   */
  assertContext(): string {
    if (!this.companyId) {
      throw new Error('Company context is required for this operation');
    }
    return this.companyId;
  }
}
