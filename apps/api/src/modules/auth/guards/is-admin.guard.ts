import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * Guard to check if user is admin
 */
@Injectable()
export class IsAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user is super admin
    if (user.isSuperAdmin === true) {
      return true;
    }

    // Check if user has ADMIN role
    if (user.roles && user.roles.includes('ADMIN')) {
      return true;
    }

    throw new ForbiddenException('Admin access required');
  }
}
