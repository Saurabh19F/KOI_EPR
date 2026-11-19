import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.entity';
import { Permission } from '../users/entities/permission.entity';
import { UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let userRepo: any;

  const mockUserRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    query: jest.fn(),
  };

  const mockRoleRepo = { findOne: jest.fn() };
  const mockPermissionRepo = { find: jest.fn() };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, def?: string) => {
      const map: Record<string, string> = {
        JWT_SECRET: 'test-secret',
        JWT_ACCESS_EXPIRY: '15m',
        JWT_REFRESH_EXPIRY: '7d',
      };
      return map[key] || def;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Role), useValue: mockRoleRepo },
        { provide: getRepositoryToken(Permission), useValue: mockPermissionRepo },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    userRepo = mockUserRepo;
  });

  describe('register', () => {
    it('should reject weak passwords', async () => {
      await expect(
        service.register({ email: 'test@example.com', password: 'short', name: 'Test' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject passwords without uppercase', async () => {
      await expect(
        service.register({ email: 'test@example.com', password: 'lowercase1', name: 'Test' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate email', async () => {
      userRepo.findOne.mockResolvedValue({ userId: 'existing' });

      await expect(
        service.register({ email: 'test@example.com', password: 'StrongPass1', name: 'Test' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should hash password with bcrypt and save user', async () => {
      userRepo.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      userRepo.create.mockReturnValue({ userId: 'new-id', email: 'test@example.com' });
      userRepo.save.mockResolvedValue({ userId: 'new-id' });

      const result = await service.register({
        email: 'test@example.com',
        password: 'StrongPass1',
        name: 'Test User',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('StrongPass1', 12);
      expect(result.userId).toBe('new-id');
    });
  });

  describe('login', () => {
    const mockUser = {
      userId: 'user-1',
      email: 'test@example.com',
      password: 'hashed-pw',
      companyId: 'company-1',
      isActive: true,
      isSuperAdmin: false,
      role: { roleCode: 'ADMIN' },
      roleId: 'role-1',
      name: 'Test User',
      warehouseId: null,
      lastLoginAt: null,
      lastLoginIp: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
    };

    it('should throw UnauthorizedException for non-existent user', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.query.mockResolvedValue([]);

      await expect(
        service.login({ email: 'unknown@test.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      userRepo.query.mockResolvedValue([]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens on valid credentials', async () => {
      userRepo.findOne.mockResolvedValue({ ...mockUser });
      userRepo.query.mockResolvedValue([{ permission_code: 'DASHBOARD_VIEW' }]);
      userRepo.save.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ email: 'test@example.com', password: 'correct' });

      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });
  });
});
