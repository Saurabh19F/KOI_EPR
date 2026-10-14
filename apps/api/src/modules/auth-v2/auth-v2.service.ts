import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, IsNull } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { SignOptions } from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import {
  PasswordResetToken,
  EmailVerificationToken,
  TokenBlacklist,
  TwoFactorConfig,
  LoginActivity,
  Session,
  ApiKey,
  SecurityAuditLog,
} from './entities/auth-entities';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Permission } from '../users/entities/permission.entity';

@Injectable()
export class AuthV2Service {
  private readonly logger = { warn: (msg: string, ...args: any[]) => console.warn(msg, ...args), log: (msg: string, ...args: any[]) => console.log(msg, ...args), error: (msg: string, err?: any) => console.error(msg, err) };

  constructor(
    @InjectRepository(PasswordResetToken)
    private passwordResetRepo: Repository<PasswordResetToken>,
    @InjectRepository(EmailVerificationToken)
    private emailVerifyRepo: Repository<EmailVerificationToken>,
    @InjectRepository(TokenBlacklist)
    private blacklistRepo: Repository<TokenBlacklist>,
    @InjectRepository(TwoFactorConfig)
    private twoFactorRepo: Repository<TwoFactorConfig>,
    @InjectRepository(LoginActivity)
    private loginActivityRepo: Repository<LoginActivity>,
    @InjectRepository(Session)
    private sessionRepo: Repository<Session>,
    @InjectRepository(ApiKey)
    private apiKeyRepo: Repository<ApiKey>,
    @InjectRepository(SecurityAuditLog)
    private auditLogRepo: Repository<SecurityAuditLog>,
    @InjectRepository(Permission)
    private permissionRepo: Repository<Permission>,
    private usersService: UsersService,
    private notificationsService: NotificationsService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) { }

  // ============ Authentication ============

  async login(loginDto: { email: string; password: string }, ipAddress?: string) {
    const { email, password } = loginDto;

    // Load user with role
    const user = await this.usersService.findByEmailWithRole(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.usersService.updateLastLogin(user.userId, ipAddress);

    // Get role code
    const roleCode = user.role?.roleCode || '';
    const roleCodes = roleCode ? [roleCode] : [];

    // Load permissions from DB first
    let permissions = await this.getPermissionsForRole(user.roleId);

    // If no permissions from DB, use role-based defaults
    if (permissions.length === 0) {
      permissions = this.getDefaultPermissionsForRole(roleCode);
    }

    const isSuperAdmin = user.isSuperAdmin === true;

    const basePayload = {
      sub: user.userId,
      email: user.email,
      companyId: user.companyId,
      isSuperAdmin: isSuperAdmin,
      roles: roleCodes,
      permissions: permissions,
    };

    const twoFactorConfig = await this.twoFactorRepo.findOne({ where: { userId: user.userId } });
    if (twoFactorConfig?.enabled) {
      return {
        twoFactorRequired: true,
        userId: user.userId,
        challengeToken: this.jwtService.sign(
          { sub: user.userId, type: '2fa' },
          { expiresIn: '5m' },
        ),
      };
    }

    const accessTokenExpiry = (this.configService.get<string>('JWT_ACCESS_EXPIRY') || '15m') as SignOptions['expiresIn'];
    const refreshTokenExpiry = (this.configService.get<string>('JWT_REFRESH_EXPIRY') || '7d') as SignOptions['expiresIn'];

    const accessToken = this.jwtService.sign({ ...basePayload, type: 'access' as const }, { expiresIn: accessTokenExpiry });
    const refreshToken = this.jwtService.sign({ ...basePayload, type: 'refresh' as const }, { expiresIn: refreshTokenExpiry });

    return {
      accessToken,
      refreshToken,
      user: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        preferences: user.preferences,
        companyId: user.companyId,
        isSuperAdmin,
        roles: roleCodes,
        permissions: permissions,
      },
    };
  }

  /**
   * Get default permissions based on role code
   */
  private getDefaultPermissionsForRole(roleCode: string): string[] {
    const roleDefaults: Record<string, string[]> = {
      'ADMIN': [
        'DASHBOARD_VIEW', 'MASTERS_VIEW', 'MASTERS_CREATE', 'MASTERS_EDIT', 'MASTERS_DELETE',
        'SALES_VIEW', 'SALES_CREATE', 'SALES_EDIT', 'SALES_DELETE', 'SALES_APPROVE',
        'PURCHASE_VIEW', 'PURCHASE_CREATE', 'PURCHASE_EDIT', 'PURCHASE_DELETE', 'PURCHASE_APPROVE',
        'RATE_VIEW', 'RATE_CREATE', 'RATE_EDIT', 'RATE_APPROVE', 'RATE_LOCK',
        'FMS_VIEW', 'FMS_CREATE', 'FMS_EDIT', 'FMS_ASSIGN',
        'REPORTS_VIEW', 'REPORTS_EXPORT',
        'ADMIN_USERS', 'ADMIN_ROLES', 'ADMIN_SETTINGS'
      ],
      'SALES_MANAGER': [
        'DASHBOARD_VIEW', 'MASTERS_VIEW',
        'SALES_VIEW', 'SALES_CREATE', 'SALES_EDIT', 'SALES_APPROVE',
        'REPORTS_VIEW', 'REPORTS_EXPORT'
      ],
      'SALES_USER': [
        'DASHBOARD_VIEW', 'MASTERS_VIEW',
        'SALES_VIEW', 'SALES_CREATE', 'SALES_EDIT',
        'REPORTS_VIEW'
      ],
      'PURCHASE_MANAGER': [
        'DASHBOARD_VIEW', 'MASTERS_VIEW',
        'PURCHASE_VIEW', 'PURCHASE_CREATE', 'PURCHASE_EDIT', 'PURCHASE_APPROVE',
        'REPORTS_VIEW', 'REPORTS_EXPORT'
      ],
      'PURCHASE_USER': [
        'DASHBOARD_VIEW', 'MASTERS_VIEW',
        'PURCHASE_VIEW', 'PURCHASE_CREATE', 'PURCHASE_EDIT',
        'REPORTS_VIEW'
      ],
      'COSTING_MANAGER': [
        'DASHBOARD_VIEW', 'MASTERS_VIEW',
        'PURCHASE_VIEW',
        'FMS_VIEW', 'FMS_CREATE', 'FMS_EDIT',
        'REPORTS_VIEW', 'REPORTS_EXPORT'
      ],
      'MIS_USER': [
        'DASHBOARD_VIEW', 'MASTERS_VIEW', 'MASTERS_CREATE', 'MASTERS_EDIT',
        'SALES_VIEW', 'SALES_CREATE', 'SALES_EDIT', 'SALES_APPROVE',
        'PURCHASE_VIEW', 'PURCHASE_CREATE', 'PURCHASE_EDIT', 'PURCHASE_APPROVE',
        'FMS_VIEW', 'FMS_CREATE', 'FMS_EDIT', 'FMS_ASSIGN',
        'REPORTS_VIEW', 'REPORTS_EXPORT'
      ],
      'VIEWER': [
        'DASHBOARD_VIEW', 'MASTERS_VIEW',
        'SALES_VIEW', 'PURCHASE_VIEW',
        'FMS_VIEW', 'REPORTS_VIEW'
      ],
    };

    return roleDefaults[roleCode] || ['DASHBOARD_VIEW', 'MASTERS_VIEW'];
  }

  /**
   * Load permissions for a role from DB
   */
  private async getPermissionsForRole(roleId: string): Promise<string[]> {
    if (!roleId) return [];

    try {
      const result = await this.permissionRepo.query(
        `SELECT p.permission_code
         FROM permissions p
         INNER JOIN role_permissions rp ON rp.permission_id = p.permission_id
         WHERE rp.role_id = $1`,
        [roleId]
      );
      return result.map((row: any) => row.permission_code);
    } catch (error) {
      this.logger.warn('Failed to load permissions:', error.message);
      return [];
    }
  }

  async seedDemoUsers() {
    const demoPassword = this.configService.get('DEMO_USER_PASSWORD');
    if (!demoPassword) {
      throw new BadRequestException('DEMO_USER_PASSWORD environment variable is not set');
    }

    const users = await this.usersService.findAllUsers();
    const hashedPassword = await bcrypt.hash(demoPassword, 12);
    const results = [];

    for (const user of users.data || []) {
      await this.usersService.updatePassword(user.userId, hashedPassword);
      results.push({ email: user.email, status: 'updated' });
    }

    return {
      message: 'Passwords reset for all users',
      users: results,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.usersService.findByIdWithRole(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const roleCode = user.role?.roleCode || '';

      // Load permissions from DB first, fall back to role-based defaults
      let permissions = await this.getPermissionsForRole(user.roleId);
      if (permissions.length === 0) {
        permissions = this.getDefaultPermissionsForRole(roleCode);
      }

      const newPayload = {
        sub: user.userId,
        email: user.email,
        companyId: user.companyId,
        isSuperAdmin: user.isSuperAdmin,
        roles: [roleCode],
        permissions: permissions,
      };

      return {
        accessToken: this.jwtService.sign({ ...newPayload, type: 'access' }),
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findByIdWithRole(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const roleCode = user.role?.roleCode || '';

    // Load permissions from DB first, fall back to role-based defaults
    let permissions = await this.getPermissionsForRole(user.roleId);
    if (permissions.length === 0) {
      permissions = this.getDefaultPermissionsForRole(roleCode);
    }

    return {
      userId: user.userId,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatar: user.avatar,
      preferences: user.preferences,
      companyId: user.companyId,
      isSuperAdmin: user.isSuperAdmin,
      roles: [roleCode],
      permissions: permissions,
    };
  }

  async logout(token: string) {
    const payload = this.jwtService.decode(token) as any;
    const expiresAt = payload?.exp ? new Date(payload.exp * 1000) : new Date(Date.now() + 15 * 60 * 1000);

    await this.blacklistRepo.save({
      token,
      userId: payload?.sub || payload?.userId || 'unknown',
      tokenType: payload?.type || 'access',
      expiresAt,
      reason: 'logout',
    });
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(email: string, ipAddress?: string, userAgent?: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return { message: 'If email exists, reset link has been sent' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    await this.passwordResetRepo.save({
      userId: user.userId,
      token,
      email: user.email,
      expiresAt: new Date(Date.now() + 3600000),
      ipAddress,
      userAgent,
    });

    await this.notificationsService.sendPasswordResetEmail(email, user.name || 'User', token);

    return { message: 'If email exists, reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const resetToken = await this.passwordResetRepo.findOne({
      where: { token, usedAt: IsNull() },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.usersService.updatePassword(resetToken.userId, hashedPassword);

    resetToken.usedAt = new Date();
    await this.passwordResetRepo.save(resetToken);

    return { message: 'Password reset successfully' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.usersService.updatePassword(userId, hashedPassword);

    return { message: 'Password changed successfully' };
  }

  async verifyEmail(token: string) {
    const verifyToken = await this.emailVerifyRepo.findOne({
      where: { token, status: 'pending', expiresAt: MoreThan(new Date()) },
    });

    if (!verifyToken) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    verifyToken.status = 'verified';
    verifyToken.verifiedAt = new Date();
    await this.emailVerifyRepo.save(verifyToken);

    await this.usersService.markEmailVerified(verifyToken.userId);

    return { message: 'Email verified successfully' };
  }

  // ============ Two Factor Authentication ============

  async setupTwoFactor(userId: string, method: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const secret = speakeasy.generateSecret({ name: `KOI-ERP:${user.email}` });

    let config = await this.twoFactorRepo.findOne({ where: { userId } });
    if (!config) {
      config = this.twoFactorRepo.create({
        userId,
        enabled: false,
        method,
      });
    }

    config.secret = secret.base32;
    config.method = method;
    await this.twoFactorRepo.save(config);

    return {
      otpauthUrl: secret.otpauth_url,
      secret: secret.base32,
    };
  }

  async verifyTwoFactorSetup(userId: string, code: string) {
    const config = await this.twoFactorRepo.findOne({ where: { userId } });
    if (!config) {
      throw new NotFoundException('Two-factor setup has not been initiated');
    }

    const verified = speakeasy.totp.verify({
      secret: config.secret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!verified) {
      throw new BadRequestException('Invalid verification code');
    }

    config.enabled = true;
    config.lastVerifiedAt = new Date();

    // Generate backup codes
    const backupCodes = Array.from({ length: 5 }, () => crypto.randomBytes(4).toString('hex'));
    config.backupCodes = backupCodes;
    config.backupCodesRemaining = backupCodes.length;

    await this.twoFactorRepo.save(config);

    return {
      enabled: true,
      backupCodes,
    };
  }

  async verifyTwoFactor(userId: string, code?: string, backupCode?: string, challengeToken?: string) {
    if (!challengeToken) {
      throw new UnauthorizedException('Two-factor challenge is required');
    }

    let challengePayload: any;
    try {
      challengePayload = this.jwtService.verify(challengeToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired two-factor challenge');
    }

    if (challengePayload.type !== '2fa' || challengePayload.sub !== userId) {
      throw new UnauthorizedException('Invalid two-factor challenge');
    }

    const config = await this.twoFactorRepo.findOne({ where: { userId } });
    if (!config || !config.enabled) {
      throw new BadRequestException('Two-factor authentication is not enabled for this user');
    }

    const issueTokens = async () => {
      config.lastVerifiedAt = new Date();
      await this.twoFactorRepo.save(config);

      const user = await this.usersService.findByIdWithRole(userId);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const roleCode = user.role?.roleCode || '';
      let permissions = await this.getPermissionsForRole(user.roleId);
      if (permissions.length === 0) {
        permissions = this.getDefaultPermissionsForRole(roleCode);
      }

      const basePayload = {
        sub: user.userId,
        email: user.email,
        companyId: user.companyId,
        isSuperAdmin: user.isSuperAdmin === true,
        roles: roleCode ? [roleCode] : [],
        permissions,
      };

      const accessTokenExpiry = (this.configService.get<string>('JWT_ACCESS_EXPIRY') || '15m') as SignOptions['expiresIn'];
      const refreshTokenExpiry = (this.configService.get<string>('JWT_REFRESH_EXPIRY') || '7d') as SignOptions['expiresIn'];

      return {
        accessToken: this.jwtService.sign({ ...basePayload, type: 'access' as const }, { expiresIn: accessTokenExpiry }),
        refreshToken: this.jwtService.sign({ ...basePayload, type: 'refresh' as const }, { expiresIn: refreshTokenExpiry }),
        user: {
          userId: user.userId,
          email: user.email,
          name: user.name,
          phone: user.phone,
          avatar: user.avatar,
          preferences: user.preferences,
          companyId: user.companyId,
          isSuperAdmin: user.isSuperAdmin === true,
          roles: roleCode ? [roleCode] : [],
          permissions,
        },
      };
    };

    if (backupCode) {
      const idx = config.backupCodes.indexOf(backupCode);
      if (idx !== -1) {
        config.backupCodes.splice(idx, 1);
        config.backupCodesRemaining = config.backupCodes.length;
        return issueTokens();
      }
      throw new BadRequestException('Invalid backup code');
    }

    if (code) {
      const verified = speakeasy.totp.verify({
        secret: config.secret,
        encoding: 'base32',
        token: code,
        window: 1,
      });

      if (verified) {
        return issueTokens();
      }
      throw new BadRequestException('Invalid verification code');
    }

    throw new BadRequestException('2FA code or backup code is required');
  }

  async disableTwoFactor(userId: string, password?: string, code?: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (password) {
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        throw new BadRequestException('Password is incorrect');
      }
    }

    const config = await this.twoFactorRepo.findOne({ where: { userId } });
    if (config) {
      config.enabled = false;
      config.secret = null;
      config.backupCodes = [];
      config.backupCodesRemaining = 0;
      await this.twoFactorRepo.save(config);
    }

    return { disabled: true };
  }

  async getTwoFactorStatus(userId: string) {
    const config = await this.twoFactorRepo.findOne({ where: { userId } });
    return {
      enabled: config ? config.enabled : false,
      method: config ? config.method : 'totp',
    };
  }

  // ============ Session Management ============

  async getUserSessions(userId: string) {
    return this.sessionRepo.find({
      where: { userId, status: 'active' },
      order: { createdAt: 'DESC' },
    });
  }

  async revokeSession(sessionId: string, userId: string) {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId, userId } });
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    session.status = 'revoked';
    session.revokedAt = new Date();
    session.revokedBy = userId;
    await this.sessionRepo.save(session);

    return { success: true };
  }

  async revokeAllOtherSessions(userId: string, currentSessionId: string) {
    const sessions = await this.sessionRepo.find({
      where: { userId, status: 'active' },
    });

    for (const session of sessions) {
      if (session.id !== currentSessionId) {
        session.status = 'revoked';
        session.revokedAt = new Date();
        session.revokedBy = userId;
        await this.sessionRepo.save(session);
      }
    }

    return { success: true };
  }

  // ============ API Key Management ============

  async createApiKey(userId: string, companyId: string, dto: { name: string; scopes?: string[]; expiresInDays?: number }) {
    const rawKey = 'erp_' + crypto.randomBytes(24).toString('hex');
    const keyPrefix = rawKey.substring(0, 12);
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    let expiresAt: Date | null = null;
    if (dto.expiresInDays) {
      expiresAt = new Date(Date.now() + dto.expiresInDays * 24 * 60 * 60 * 1000);
    }

    const apiKey = this.apiKeyRepo.create({
      userId,
      companyId,
      name: dto.name,
      keyHash,
      keyPrefix,
      scopes: dto.scopes || [],
      expiresAt,
      isActive: true,
    });

    await this.apiKeyRepo.save(apiKey);

    return {
      id: apiKey.id,
      name: apiKey.name,
      apiKey: rawKey,
      keyPrefix,
      scopes: apiKey.scopes,
      expiresAt: apiKey.expiresAt,
      isActive: apiKey.isActive,
    };
  }

  async getApiKeys(userId: string, companyId: string) {
    return this.apiKeyRepo.find({
      where: { userId, companyId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async revokeApiKey(id: string, userId: string) {
    const apiKey = await this.apiKeyRepo.findOne({ where: { id, userId } });
    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    apiKey.isActive = false;
    await this.apiKeyRepo.save(apiKey);

    return { success: true };
  }

  // ============ Audit / Logs ============

  async getLoginActivity(userId: string, query: { page?: number; limit?: number }) {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 20;
    const skip = (page - 1) * limit;

    const [data, total] = await this.loginActivityRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSecurityAuditLog(userId: string, query: { page?: number; limit?: number; eventType?: string }) {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (query.eventType) {
      where.eventType = query.eventType;
    }

    const [data, total] = await this.auditLogRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createEmailVerification(userId: string, email: string) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const verifyToken = this.emailVerifyRepo.create({
      userId,
      token,
      email,
      expiresAt,
      status: 'pending',
    });

    await this.emailVerifyRepo.save(verifyToken);

    this.logger.log(`Verification token created for user ${userId} (${email}): ${token}`);

    return { message: 'Verification email sent' };
  }
}
