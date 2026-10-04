import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { Request } from 'express';
import { DataSource } from 'typeorm';

export interface JwtPayload {
  sub: string;
  email: string;
  companyId?: string;
  isSuperAdmin?: boolean;
  roles?: string[];
  permissions?: string[];
  type?: 'access' | 'refresh';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: NestConfigService,
    private readonly dataSource: DataSource,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  private extractBearerToken(req: Request): string | null {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      return null;
    }

    return authorization.slice('Bearer '.length).trim();
  }

  async validate(req: Request, payload: JwtPayload): Promise<JwtPayload> {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }
    if (payload.type && payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type - expected access token');
    }

    const token = this.extractBearerToken(req);
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const blacklistedTokens = await this.dataSource.query(
      'SELECT 1 FROM token_blacklist WHERE token = $1 AND expires_at > NOW() LIMIT 1',
      [token],
    );
    if (blacklistedTokens.length > 0) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // Ensure arrays are defined
    const roles = Array.isArray(payload.roles) ? payload.roles : [];
    const permissions = Array.isArray(payload.permissions) ? payload.permissions : [];

    return {
      sub: payload.sub,
      email: payload.email,
      companyId: payload.companyId,
      isSuperAdmin: payload.isSuperAdmin,
      roles: roles,
      permissions: permissions,
    };
  }
}
