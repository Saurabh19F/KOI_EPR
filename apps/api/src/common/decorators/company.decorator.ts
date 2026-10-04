import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Company } from '../../modules/platform/entities/company.entity';

export const CurrentCompany = createParamDecorator(
  (data: keyof Company | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const company = request.company as Company;

    if (!company) {
      return null;
    }

    return data ? company[data] : company;
  },
);

export const CompanyId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.companyId || request.user?.companyId;
  },
);

export const RequireFeature = (...features: string[]) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    // Store required features for FeatureGuard
    Reflect.defineMetadata('requiredFeatures', features, descriptor.value);
    return descriptor;
  };
};

export const RequirePlan = (...plans: string[]) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('requiredPlans', plans, descriptor.value);
    return descriptor;
  };
};

export const RequireSubscription = (...statuses: string[]) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('requiredSubscriptionStatus', statuses, descriptor.value);
    return descriptor;
  };
};
