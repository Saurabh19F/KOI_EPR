import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantInfo } from './tenant.middleware';

export const Tenant = createParamDecorator(
  (data: keyof TenantInfo | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const tenant = request.tenant as TenantInfo | undefined;

    if (!tenant) return null;

    return data ? tenant[data] : tenant;
  }
);

export const RequireTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TenantInfo => {
    const request = ctx.switchToHttp().getRequest();
    const tenant = request.tenant as TenantInfo | undefined;

    if (!tenant) {
      throw new Error('Tenant context is required for this operation');
    }

    return tenant;
  }
);
