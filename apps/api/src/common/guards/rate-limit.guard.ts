import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Simple in-memory rate limiter guard.
 * For production, use Redis-based rate limiting with @nestjs/throttler
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  // In-memory store for rate limiting (use Redis in production)
  private requestCounts: Map<string, { count: number; resetAt: number }> = new Map();

  constructor(private configService: ConfigService) {
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Get user identifier (userId for authenticated, IP for anonymous)
    const user = request.user;
    const userId = user?.sub || user?.userId;
    const companyId = user?.companyId;
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';

    // Default limits
    const requestsPerMinutePerUser = this.configService.get<number>('RATE_LIMIT_USER') || 100;
    const requestsPerMinutePerCompany = this.configService.get<number>('RATE_LIMIT_COMPANY') || 1000;

    const now = Date.now();
    const windowMs = 60000; // 1 minute window

    // Check per-user limit if authenticated
    if (userId) {
      const userKey = `user:${userId}`;
      const userRate = this.checkRateLimit(userKey, requestsPerMinutePerUser, windowMs, now);

      if (!userRate.allowed) {
        response.setHeader('X-RateLimit-Limit', requestsPerMinutePerUser);
        response.setHeader('X-RateLimit-Remaining', 0);
        response.setHeader('X-RateLimit-Reset', Math.ceil(userRate.resetAt / 1000));
        response.setHeader('Retry-After', Math.ceil((userRate.resetAt - now) / 1000));

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Try again in ${Math.ceil((userRate.resetAt - now) / 1000)} seconds.`,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      response.setHeader('X-RateLimit-Limit', requestsPerMinutePerUser);
      response.setHeader('X-RateLimit-Remaining', requestsPerMinutePerUser - userRate.count);
    }

    // Check per-company limit
    if (companyId) {
      const companyKey = `company:${companyId}`;
      const companyRate = this.checkRateLimit(companyKey, requestsPerMinutePerCompany, windowMs, now);

      if (!companyRate.allowed) {
        response.setHeader('X-CompanyRateLimit-Limit', requestsPerMinutePerCompany);
        response.setHeader('X-CompanyRateLimit-Remaining', 0);
        response.setHeader('X-CompanyRateLimit-Reset', Math.ceil(companyRate.resetAt / 1000));

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            error: 'Too Many Requests',
            message: 'Company rate limit exceeded. Please try again later.',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // Also rate limit by IP for unauthenticated requests
    if (!userId) {
      const ipKey = `ip:${ip}`;
      const ipRate = this.checkRateLimit(ipKey, 30, windowMs, now); // Stricter limit for anonymous

      if (!ipRate.allowed) {
        response.setHeader('Retry-After', Math.ceil((ipRate.resetAt - now) / 1000));

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            error: 'Too Many Requests',
            message: 'Too many requests from your IP. Please try again later.',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    return true;
  }

  private checkRateLimit(key: string, limit: number, windowMs: number, now: number): { allowed: boolean; count: number; resetAt: number } {
    let record = this.requestCounts.get(key);

    // Create new record or reset if window expired
    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + windowMs };
      this.requestCounts.set(key, record);
    }

    record.count++;

    return {
      allowed: record.count <= limit,
      count: record.count,
      resetAt: record.resetAt,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.requestCounts.entries()) {
      if (now > record.resetAt) {
        this.requestCounts.delete(key);
      }
    }
  }
}
