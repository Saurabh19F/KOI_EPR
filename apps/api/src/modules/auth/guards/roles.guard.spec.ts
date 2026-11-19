import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { RolesGuard } from './roles.guard';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let jwtService: JwtService;
  let dataSource: any;

  const createMockContext = (user: any): ExecutionContext => ({
    switchToHttp: () => ({
      getRequest: () => ({
        user,
        headers: { authorization: user ? `Bearer mock-token` : undefined },
      }),
      getResponse: () => ({}),
    }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn() as any,
  }) as any;

  beforeEach(() => {
    reflector = new Reflector();
    jwtService = { verify: jest.fn() } as any;
    dataSource = { query: jest.fn().mockResolvedValue([]) };
    guard = new RolesGuard(reflector, jwtService, dataSource);
  });

  it('should allow access when no permissions/roles are required', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = createMockContext({ userId: 'u1', permissions: [], roles: [] });

    expect(await guard.canActivate(ctx)).toBe(true);
  });

  it('should deny unauthenticated access to protected route', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === PERMISSIONS_KEY) return ['ADMIN_SETTINGS'];
      return [];
    });

    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ user: null, headers: {} }),
        getResponse: () => ({}),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn() as any,
    } as any;

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should allow superAdmin to bypass all checks', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === PERMISSIONS_KEY) return ['ADMIN_SETTINGS'];
      return [];
    });

    dataSource.query.mockResolvedValue([]);
    const ctx = createMockContext({
      userId: 'u1',
      isSuperAdmin: true,
      permissions: [],
      roles: [],
    });

    expect(await guard.canActivate(ctx)).toBe(true);
  });

  it('should deny access when user lacks required permission', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === PERMISSIONS_KEY) return ['ADMIN_SETTINGS'];
      return [];
    });

    dataSource.query
      .mockResolvedValueOnce([{ role_code: 'VIEWER' }])
      .mockResolvedValueOnce([{ permission_code: 'DASHBOARD_VIEW' }]);

    const ctx = createMockContext({
      userId: 'u1',
      isSuperAdmin: false,
      permissions: ['DASHBOARD_VIEW'],
      roles: ['VIEWER'],
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('should allow access when user has required permission', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === PERMISSIONS_KEY) return ['MASTERS_VIEW'];
      return [];
    });

    dataSource.query
      .mockResolvedValueOnce([{ role_code: 'ADMIN' }])
      .mockResolvedValueOnce([{ permission_code: 'MASTERS_VIEW' }, { permission_code: 'MASTERS_CREATE' }]);

    const ctx = createMockContext({
      userId: 'u1',
      isSuperAdmin: false,
      permissions: ['MASTERS_VIEW'],
      roles: ['ADMIN'],
    });

    expect(await guard.canActivate(ctx)).toBe(true);
  });
});
