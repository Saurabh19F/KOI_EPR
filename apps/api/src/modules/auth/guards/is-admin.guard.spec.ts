import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { IsAdminGuard } from './is-admin.guard';

describe('IsAdminGuard', () => {
  let guard: IsAdminGuard;

  const createMockContext = (user: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as any;

  beforeEach(() => {
    guard = new IsAdminGuard();
  });

  it('should deny access when no user is present', () => {
    const ctx = createMockContext(null);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should deny access when user is not admin', () => {
    const ctx = createMockContext({
      userId: 'u1',
      isSuperAdmin: false,
      roles: ['VIEWER'],
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should allow super admin', () => {
    const ctx = createMockContext({
      userId: 'u1',
      isSuperAdmin: true,
      roles: [],
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow user with ADMIN role', () => {
    const ctx = createMockContext({
      userId: 'u1',
      isSuperAdmin: false,
      roles: ['ADMIN'],
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should deny user with undefined roles', () => {
    const ctx = createMockContext({
      userId: 'u1',
      isSuperAdmin: false,
      roles: undefined,
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should deny user with empty roles array', () => {
    const ctx = createMockContext({
      userId: 'u1',
      isSuperAdmin: false,
      roles: [],
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
