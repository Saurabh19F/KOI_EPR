import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const FEATURE_KEY = 'required_feature';
export const PLAN_KEY = 'required_plan';

export const RequireFeature = (feature: string) => SetMetadata(FEATURE_KEY, feature);
export const RequirePlan = (plan: string) => SetMetadata(PLAN_KEY, plan);

import { SetMetadata } from '@nestjs/common';

/**
 * Guard to enforce tenant isolation at the route level.
 * Use this guard on controllers that need strict tenant isolation.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user, let AuthGuard handle it
    if (!user) {
      return true;
    }

    // Super admins bypass tenant isolation
    if (user.isSuperAdmin) {
      return true;
    }

    // User must have a companyId for multi-tenant isolation
    if (!user.companyId) {
      throw new ForbiddenException(
        'Access denied. Your account is not associated with any company.',
      );
    }

    // Add companyId to request for service-level filtering
    request.tenantId = user.companyId;

    return true;
  }
}

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredFeature = this.reflector.get<string>(FEATURE_KEY, context.getHandler());
    if (!requiredFeature) return true;

    const request = context.switchToHttp().getRequest();
    const tenant = request.tenant;

    if (!tenant) {
      throw new BadRequestException('Tenant context not found');
    }

    const featureEnabled = tenant.features?.[requiredFeature];
    if (!featureEnabled) {
      throw new ForbiddenException(
        `Feature '${requiredFeature}' is not available in your current plan. Please upgrade your subscription.`
      );
    }

    return true;
  }
}

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPlan = this.reflector.get<string>(PLAN_KEY, context.getHandler());
    if (!requiredPlan) return true;

    const request = context.switchToHttp().getRequest();
    const tenant = request.tenant;

    if (!tenant) {
      throw new BadRequestException('Tenant context not found');
    }

    const planOrder = ['starter', 'growth', 'professional', 'enterprise'];
    const tenantPlanIndex = planOrder.indexOf(tenant.planCode?.toLowerCase() || 'starter');
    const requiredPlanIndex = planOrder.indexOf(requiredPlan.toLowerCase());

    if (tenantPlanIndex < requiredPlanIndex) {
      throw new ForbiddenException(
        `This feature requires '${requiredPlan}' plan or higher. Please upgrade your subscription.`
      );
    }

    return true;
  }
}

@Injectable()
export class UsageLimitGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenant = request.tenant;

    if (!tenant) return true;

    const { limits } = tenant;

    // Check user limit
    if (limits.currentUsers >= limits.maxUsers) {
      throw new ForbiddenException(
        `User limit reached (${limits.currentUsers}/${limits.maxUsers}). Please upgrade your plan or remove inactive users.`
      );
    }

    // Check storage limit
    if (limits.currentStorageMb >= limits.maxStorageMb) {
      throw new ForbiddenException(
        `Storage limit reached (${limits.currentStorageMb}/${limits.maxStorageMb} MB). Please upgrade your plan or free up storage.`
      );
    }

    return true;
  }
}
