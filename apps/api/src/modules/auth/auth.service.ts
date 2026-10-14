import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { SignOptions } from 'jsonwebtoken';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.entity';
import { Permission } from '../users/entities/permission.entity';
import { LoginDto } from './dto/login.dto';
import { IsNull } from 'typeorm';

interface TokenPayload {
  sub: string;
  email: string;
  companyId?: string;
  isSuperAdmin?: boolean;
  roles: string[];
  permissions: string[];
  type: 'access' | 'refresh';
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Validate password strength
   */
  private validatePasswordStrength(password: string): void {
    if (!password || password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      throw new BadRequestException('Password must contain at least one number');
    }
  }

  async register(data: {
    email: string;
    password: string;
    name: string;
    companyId?: string;
  }) {
    // Validate password strength
    this.validatePasswordStrength(data.password);

    const existingUser = await this.userRepository.findOne({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    let hashedPassword: string;
    try {
      hashedPassword = await bcrypt.hash(data.password, 12);
    } catch (error) {
      throw new BadRequestException('Failed to process password');
    }

    const user = this.userRepository.create({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      companyId: data.companyId,
      isActive: true,
    });

    await this.userRepository.save(user);

    return {
      message: 'User registered successfully',
      userId: user.userId,
    };
  }

  async seedDemoUsers() {
    const demoPassword = this.configService.get('DEMO_USER_PASSWORD');
    if (!demoPassword) {
      throw new BadRequestException('DEMO_USER_PASSWORD environment variable is not set');
    }

    // Get all existing users and reset their passwords
    const users = await this.userRepository.find();

    let hashedPassword: string;
    try {
      hashedPassword = await bcrypt.hash(demoPassword, 12);
    } catch (error) {
      throw new BadRequestException('Failed to hash demo password');
    }

    const results = [];
    for (const user of users) {
      user.password = hashedPassword;
      await this.userRepository.save(user);
      results.push({ email: user.email, status: 'updated' });
    }

    return {
      message: 'Passwords reset for all users',
      users: results,
    };
  }

  async login(loginDto: LoginDto, ipAddress?: string) {
    const { email, password } = loginDto;
    this.logger.log(`Login attempt for email: ${email}`);

    // Check if user account is locked
    if (await this.isAccountLocked(email)) {
      throw new UnauthorizedException('Account is temporarily locked due to multiple failed login attempts');
    }

    const user = await this.userRepository.findOne({
      where: { email, isActive: true, deletedAt: IsNull() as any },
      relations: ['role'],
    });
    this.logger.log(`User found: ${!!user}, userId: ${user?.userId}`);

    if (!user) {
      await this.recordFailedLogin(email);
      throw new UnauthorizedException('Invalid credentials');
    }

    let isPasswordValid: boolean;
    try {
      this.logger.log(`Comparing password for user ${user.userId}`);
      isPasswordValid = await bcrypt.compare(password, user.password);
      this.logger.log(`Password valid: ${isPasswordValid}`);
    } catch (error) {
      this.logger.error(`Password comparison error: ${error.message}`, error.stack);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!isPasswordValid) {
      await this.recordFailedLogin(email);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed login attempts on successful login
    await this.resetFailedLoginAttempts(user.userId);

    // Update last login tracking
    user.lastLoginAt = new Date();
    user.lastLoginIp = ipAddress || null;
    await this.userRepository.save(user);

    // Extract role info
    const roleCodes = user.role?.roleCode ? [user.role.roleCode] : [];

    // For now, load permissions from role_permissions table using raw SQL to avoid UUID join issues
    const permissions = await this.getPermissionsForRole(user.roleId);

    const isSuperAdmin = user.isSuperAdmin === true;

    const basePayload = {
      sub: user.userId,
      email: user.email,
      companyId: user.companyId,
      isSuperAdmin: isSuperAdmin,
      roles: roleCodes,
      permissions: permissions,
    };

    // Use configurable token expiry from config
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
        companyId: user.companyId,
        isSuperAdmin: isSuperAdmin,
        roles: roleCodes,
        permissions: permissions,
      },
    };
  }

  /**
   * Load permissions for a role using raw query to avoid UUID join issues
   */
  private async getPermissionsForRole(roleId: string): Promise<string[]> {
    if (!roleId) return [];

    try {
      // Use raw SQL query with proper UUID casting
      const result = await this.permissionRepository.query(
        `SELECT p.permission_code
         FROM permissions p
         INNER JOIN role_permissions rp ON rp.permission_id::text = p.permission_id::text
         WHERE rp.role_id::text = $1`,
        [roleId]
      );
      return result.map((row: any) => row.permission_code);
    } catch (error) {
      this.logger.warn('Failed to load permissions:', error.message);
      return [];
    }
  }

  /**
   * Check if account is locked due to failed login attempts
   */
  private async isAccountLocked(email: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { email },
    });
    if (!user) return false;

    if (user.isLocked && user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      return true;
    }
    return false;
  }

  /**
   * Record failed login attempt for brute force protection
   */
  private async recordFailedLogin(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      // Lock account after 5 failed attempts for 15 minutes
      if (user.failedLoginAttempts >= 5) {
        user.isLocked = true;
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      }

      await this.userRepository.save(user);
    }
  }

  /**
   * Reset failed login attempts on successful login
   */
  private async resetFailedLoginAttempts(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      failedLoginAttempts: 0,
      isLocked: false,
      lockedUntil: null as any,
    });
  }

  async refresh(refreshToken: string) {
    let payload: TokenPayload;

    try {
      payload = this.jwtService.verify(refreshToken);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Validate token type
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type - expected refresh token');
    }

    const user = await this.userRepository.findOne({
      where: { userId: payload.sub, isActive: true, deletedAt: IsNull() as any },
      relations: ['role', 'role.permissions'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid token - user not found or inactive');
    }

    // Re-extract role and permissions from fresh DB lookup
    const roleCodes = user.role?.roleCode ? [user.role.roleCode] : [];

    // FIXED: Load permissions from role.permissions
    const permissions = user.role?.permissions?.map(p => p.permissionCode) || [];

    const isSuperAdmin = user.isSuperAdmin === true;

    const newPayload = {
      sub: user.userId,
      email: user.email,
      companyId: user.companyId,
      isSuperAdmin: isSuperAdmin,
      roles: roleCodes,
      permissions: permissions,
    };

    // Use configurable token expiry
    const accessTokenExpiry = (this.configService.get<string>('JWT_ACCESS_EXPIRY') || '15m') as SignOptions['expiresIn'];
    const refreshTokenExpiry = (this.configService.get<string>('JWT_REFRESH_EXPIRY') || '7d') as SignOptions['expiresIn'];

    const accessToken = this.jwtService.sign({ ...newPayload, type: 'access' as const }, { expiresIn: accessTokenExpiry });
    const newRefreshToken = this.jwtService.sign({ ...newPayload, type: 'refresh' as const }, { expiresIn: refreshTokenExpiry });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: string) {
    // Token blacklisting should be implemented with Redis in production
    // For now, client should discard tokens
    return { message: 'Logged out successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { userId, isActive: true, deletedAt: IsNull() as any },
      relations: ['role', 'role.permissions', 'department'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // FIXED: Use consistent role code extraction
    const roleCodes = user.role?.roleCode ? [user.role.roleCode] : [];

    // FIXED: Load permissions from role.permissions
    const permissions = user.role?.permissions?.map(p => p.permissionCode) || [];

    const isSuperAdmin = roleCodes.includes('ADMIN') || user.isSuperAdmin === true;

    return {
      userId: user.userId,
      email: user.email,
      name: user.name,
      phone: user.phone,
      companyId: user.companyId,
      department: user.department,
      isSuperAdmin: isSuperAdmin,
      lastLoginAt: user.lastLoginAt,
      roles: roleCodes,
      permissions: permissions,
    };
  }
}
