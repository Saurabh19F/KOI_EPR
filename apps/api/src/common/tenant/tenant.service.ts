import { Injectable, ForbiddenException } from '@nestjs/common';
import { CurrentUserDto } from '../dto/current-user.dto';

/**
 * Tenant context service for multi-tenant data isolation.
 * Provides helper methods to ensure data access is scoped to the user's company.
 */
@Injectable()
export class TenantService {
  /**
   * Get the company ID for the current user.
   * Throws if user is not in a company (non-multi-tenant mode).
   */
  getCompanyId(user: CurrentUserDto): string | null {
    if (!user) {
      return null;
    }

    // Super admins without companyId can access all data
    if (user.isSuperAdmin && !user.companyId) {
      return null; // null means no filtering (full access)
    }

    return user.companyId || null;
  }

  /**
   * Check if the user has access to the specified company.
   */
  hasAccessToCompany(user: CurrentUserDto, targetCompanyId: string): boolean {
    if (!user) {
      return false;
    }

    // Super admin can access any company
    if (user.isSuperAdmin) {
      return true;
    }

    // User can only access their own company
    return user.companyId === targetCompanyId;
  }

  /**
   * Build a where clause for tenant isolation.
   * Returns null if no filtering needed (super admin).
   */
  buildTenantWhere(user: CurrentUserDto, additionalWhere: Record<string, any> = {}): Record<string, any> {
    const companyId = this.getCompanyId(user);

    if (companyId === null) {
      // Super admin - no filtering
      return additionalWhere;
    }

    return {
      ...additionalWhere,
      companyId,
    };
  }

  /**
   * Validate that a record belongs to the user's company.
   * Throws ForbiddenException if access denied.
   */
  validateRecordAccess<T extends { companyId?: string }>(
    user: CurrentUserDto,
    record: T,
    resourceName: string = 'Record',
  ): void {
    if (!record) {
      return; // Record doesn't exist, let the service handle it
    }

    if (!user) {
      throw new ForbiddenException(`Access denied to ${resourceName}`);
    }

    // Super admin can access any record
    if (user.isSuperAdmin) {
      return;
    }

    // Check if record belongs to user's company
    if (record.companyId && record.companyId !== user.companyId) {
      throw new ForbiddenException(`Access denied to ${resourceName}`);
    }
  }

  /**
   * Get all allowed company IDs for a user.
   * Super admins get null (all companies).
   */
  getAllowedCompanyIds(user: CurrentUserDto): string[] | null {
    if (!user) {
      return [];
    }

    if (user.isSuperAdmin) {
      return null; // null means all companies
    }

    return user.companyId ? [user.companyId] : [];
  }
}
