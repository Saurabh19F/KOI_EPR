import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const CHECK_OWNERSHIP_KEY = 'checkOwnership';
export const CheckOwnership = () => SetMetadata(CHECK_OWNERSHIP_KEY, true);

export const REQUIRED_FEATURES_KEY = 'requiredFeatures';
export const RequireFeatures = (...features: string[]) => SetMetadata(REQUIRED_FEATURES_KEY, features);

export const TENANT_ONLY_KEY = 'tenantOnly';
export const TenantOnly = () => SetMetadata(TENANT_ONLY_KEY, true);
