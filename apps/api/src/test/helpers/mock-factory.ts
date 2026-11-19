import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export function createMockUser(overrides: Record<string, any> = {}) {
  return {
    userId: 'user-test-1',
    email: 'test@erp.local',
    password: '$2b$12$hashedpassword',
    name: 'Test User',
    companyId: 'company-1',
    isActive: true,
    isSuperAdmin: false,
    isLocked: false,
    lockedUntil: null,
    failedLoginAttempts: 0,
    lastLoginAt: null,
    lastLoginIp: null,
    warehouseId: null,
    roleId: 'role-1',
    role: { roleCode: 'VIEWER', roleId: 'role-1' },
    deletedAt: null,
    ...overrides,
  };
}

export function createMockAdminUser(overrides: Record<string, any> = {}) {
  return createMockUser({
    userId: 'admin-test-1',
    email: 'admin@erp.local',
    name: 'Admin User',
    isSuperAdmin: false,
    role: { roleCode: 'ADMIN', roleId: 'role-admin' },
    roleId: 'role-admin',
    ...overrides,
  });
}

export function createMockSuperAdmin(overrides: Record<string, any> = {}) {
  return createMockUser({
    userId: 'super-admin-1',
    email: 'superadmin@erp.local',
    name: 'Super Admin',
    isSuperAdmin: true,
    role: { roleCode: 'ADMIN', roleId: 'role-admin' },
    roleId: 'role-admin',
    ...overrides,
  });
}

export function createMockRepository() {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    query: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getOne: jest.fn().mockResolvedValue(null),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    })),
  };
}

export function createMockJwtService(): Partial<JwtService> {
  return {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    verify: jest.fn().mockReturnValue({
      sub: 'user-test-1',
      email: 'test@erp.local',
      type: 'access',
    }),
    signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
    verifyAsync: jest.fn().mockResolvedValue({
      sub: 'user-test-1',
      email: 'test@erp.local',
      type: 'access',
    }),
  };
}

export function createMockConfigService(
  overrides: Record<string, string> = {},
): Partial<ConfigService> {
  const defaults: Record<string, string> = {
    JWT_SECRET: 'test-jwt-secret-key-for-testing',
    JWT_ACCESS_EXPIRY: '15m',
    JWT_REFRESH_EXPIRY: '7d',
    DATABASE_HOST: 'localhost',
    DATABASE_PORT: '5432',
    ...overrides,
  };

  return {
    get: jest.fn((key: string, def?: string) => defaults[key] ?? def),
  } as any;
}

export function createMockDataSource() {
  return {
    query: jest.fn().mockResolvedValue([]),
    createQueryRunner: jest.fn(() => ({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
      },
    })),
  };
}
