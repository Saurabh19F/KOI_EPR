import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required roles and permissions from decorators
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) || [];

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) || [];

    // If no roles or permissions required, allow access
    if (requiredRoles.length === 0 && requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    let user = request.user;

    if (!user) {
      // Try to extract and verify JWT token from Authorization header if RolesGuard runs before JwtAuthGuard
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          user = this.jwtService.verify(token);
          request.user = user; // Populate it for subsequent guards/controllers
        } catch (err) {
          // Token is invalid, let JwtAuthGuard handle the unauthorized response if the route is protected.
        }
      }
    }

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Load fresh roles and permissions from database
    const userId = user.sub || user.userId;
    if (userId) {
      try {
        // Query the user's role code
        const userResult = await this.dataSource.query(
          `SELECT r.role_code 
           FROM users u 
           LEFT JOIN roles r ON u.role_id = r.role_id 
           WHERE u.user_id::text = $1`,
          [userId]
        );
        if (userResult && userResult.length > 0 && userResult[0].role_code) {
          user.roles = [userResult[0].role_code];
        }

        // Query the permissions
        const result = await this.dataSource.query(
          `SELECT p.permission_code
           FROM users u
           INNER JOIN role_permissions rp ON rp.role_id::text = u.role_id::text
           INNER JOIN permissions p ON p.permission_id::text = rp.permission_id::text
           WHERE u.user_id::text = $1 AND u.is_active = true`,
          [userId]
        );
        user.permissions = result.map((row: any) => row.permission_code);
      } catch (error) {
        // Fallback to token permissions/roles if query fails
      }
    }

    // Check isSuperAdmin bypass
    if (user.isSuperAdmin === true) {
      return true;
    }

    const userRoles: string[] = (user.roles || []).map(r => r.toUpperCase());
    const userPermissions: string[] = user.permissions || [];

    // Check role requirements
    if (requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some((role) =>
        userRoles.includes(role.toUpperCase())
      );

      if (!hasRequiredRole) {
        throw new ForbiddenException(
          `Access denied. Required role(s): ${requiredRoles.join(', ')}`
        );
      }
    }

    // Check permission requirements
    if (requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every((permission) =>
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        throw new ForbiddenException(
          `Access denied. Required permission(s): ${requiredPermissions.join(', ')}`
        );
      }
    }

    return true;
  }
}
