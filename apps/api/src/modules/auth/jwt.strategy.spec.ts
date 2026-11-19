import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy, JwtPayload } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let mockDataSource: any;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      return undefined;
    }),
  };

  beforeEach(() => {
    mockDataSource = { query: jest.fn().mockResolvedValue([]) };
    strategy = new JwtStrategy(mockConfigService as any, mockDataSource);
  });

  it('should throw if JWT_SECRET is not set', () => {
    const noSecretConfig = { get: jest.fn(() => undefined) };
    expect(() => new JwtStrategy(noSecretConfig as any, mockDataSource)).toThrow(
      'JWT_SECRET environment variable is required',
    );
  });

  it('should reject tokens with no sub claim', async () => {
    const req = { headers: { authorization: 'Bearer mock-token' } } as any;
    const payload: JwtPayload = { sub: '', email: 'test@test.com' };

    await expect(strategy.validate(req, payload)).rejects.toThrow(UnauthorizedException);
  });

  it('should reject refresh tokens used as access tokens', async () => {
    const req = { headers: { authorization: 'Bearer mock-token' } } as any;
    const payload: JwtPayload = {
      sub: 'user-1',
      email: 'test@test.com',
      type: 'refresh',
    };

    await expect(strategy.validate(req, payload)).rejects.toThrow(UnauthorizedException);
  });

  it('should reject blacklisted tokens', async () => {
    mockDataSource.query.mockResolvedValue([{ 1: 1 }]);

    const req = { headers: { authorization: 'Bearer blacklisted-token' } } as any;
    const payload: JwtPayload = {
      sub: 'user-1',
      email: 'test@test.com',
      type: 'access',
    };

    await expect(strategy.validate(req, payload)).rejects.toThrow(UnauthorizedException);
  });

  it('should reject request without bearer token', async () => {
    const req = { headers: {} } as any;
    const payload: JwtPayload = {
      sub: 'user-1',
      email: 'test@test.com',
      type: 'access',
    };

    await expect(strategy.validate(req, payload)).rejects.toThrow(UnauthorizedException);
  });

  it('should return authenticated user for valid access token', async () => {
    mockDataSource.query.mockResolvedValue([]);

    const req = { headers: { authorization: 'Bearer valid-token' } } as any;
    const payload: JwtPayload = {
      sub: 'user-1',
      email: 'admin@erp.local',
      companyId: 'company-1',
      isSuperAdmin: false,
      roles: ['ADMIN'],
      permissions: ['DASHBOARD_VIEW', 'MASTERS_VIEW'],
      warehouseId: 'wh-1',
      name: 'Admin',
      type: 'access',
    };

    const result = await strategy.validate(req, payload);

    expect(result.userId).toBe('user-1');
    expect(result.email).toBe('admin@erp.local');
    expect(result.roles).toEqual(['ADMIN']);
    expect(result.permissions).toEqual(['DASHBOARD_VIEW', 'MASTERS_VIEW']);
  });

  it('should default roles and permissions to empty arrays when missing', async () => {
    mockDataSource.query.mockResolvedValue([]);

    const req = { headers: { authorization: 'Bearer valid-token' } } as any;
    const payload: JwtPayload = {
      sub: 'user-1',
      email: 'test@test.com',
      type: 'access',
    };

    const result = await strategy.validate(req, payload);

    expect(result.roles).toEqual([]);
    expect(result.permissions).toEqual([]);
  });
});
