import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformService } from './platform.service';
import { FeatureService } from './feature.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private platformService: PlatformService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip for public routes - check if marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (!user.companyId) {
      throw new UnauthorizedException('User not associated with a company');
    }

    // Check if company is active and can access
    const { canAccess, reason } = await this.platformService.canAccessCompany(user.companyId);
    
    if (!canAccess) {
      throw new ForbiddenException({
        message: `Access denied: ${reason}`,
        code: 'COMPANY_ACCESS_DENIED',
        companyId: user.companyId,
      });
    }

    // Attach company info to request
    const company = await this.platformService.findCompanyById(user.companyId);
    request.company = company;

    return true;
  }
}

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private platformService: PlatformService,
    private featureService: FeatureService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.companyId) {
      return true; // Let tenant guard handle this
    }

    // Get required features from decorator
    const requiredFeatures = this.reflector.get<string[]>('requiredFeatures', context.getHandler()) || [];
    
    if (requiredFeatures.length === 0) {
      return true;
    }

    // Get company plan
    const subscription = await this.platformService.getCompanySubscription(user.companyId);
    
    if (!subscription?.planId) {
      throw new ForbiddenException({
        message: 'No active subscription',
        code: 'NO_SUBSCRIPTION',
      });
    }

    // Check each required feature
    for (const featureCode of requiredFeatures) {
      const isEnabled = await this.featureService.isFeatureEnabled(subscription.planId, featureCode);
      
      if (!isEnabled) {
        throw new ForbiddenException({
          message: `Feature '${featureCode}' is not available on your plan`,
          code: 'FEATURE_NOT_ENABLED',
          requiredFeature: featureCode,
        });
      }
    }

    return true;
  }
}
