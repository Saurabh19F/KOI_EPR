import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { createRedisConnectionOptions } from '../queue.config';

@Injectable()
export class RateLimitGuard implements CanActivate, OnModuleInit, OnModuleDestroy {
  private redis: Redis | null = null;
  private fallbackStore: Map<string, { count: number; resetAt: number }> = new Map();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const opts = createRedisConnectionOptions(this.configService);
      this.redis = new Redis({
        ...(opts as any),
        lazyConnect: false,
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => (times > 3 ? null : Math.min(times * 200, 2000)),
      });
      await this.redis.ping();
      this.logger.log('Rate limiter connected to Redis');
    } catch {
      this.logger.warn('Redis unavailable for rate limiting — using in-memory fallback');
      this.redis = null;
      this.cleanupTimer = setInterval(() => this.cleanup(), 60000);
    }
  }

  async onModuleDestroy() {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    await this.redis?.quit();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const user = request.user;
    const userId = user?.userId;
    const companyId = user?.companyId;
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';

    const requestsPerMinutePerUser = this.configService.get<number>('RATE_LIMIT_USER') || 100;
    const requestsPerMinutePerCompany = this.configService.get<number>('RATE_LIMIT_COMPANY') || 1000;
    const windowSec = 60;

    if (userId) {
      const userKey = `ratelimit:user:${userId}`;
      const result = await this.checkRateLimit(userKey, requestsPerMinutePerUser, windowSec);

      response.setHeader('X-RateLimit-Limit', requestsPerMinutePerUser);

      if (!result.allowed) {
        response.setHeader('X-RateLimit-Remaining', 0);
        response.setHeader('Retry-After', result.retryAfter);
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      response.setHeader('X-RateLimit-Remaining', Math.max(0, requestsPerMinutePerUser - result.count));
    }

    if (companyId) {
      const companyKey = `ratelimit:company:${companyId}`;
      const result = await this.checkRateLimit(companyKey, requestsPerMinutePerCompany, windowSec);

      if (!result.allowed) {
        response.setHeader('X-CompanyRateLimit-Limit', requestsPerMinutePerCompany);
        response.setHeader('X-CompanyRateLimit-Remaining', 0);
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

    if (!userId) {
      const ipKey = `ratelimit:ip:${ip}`;
      const result = await this.checkRateLimit(ipKey, 30, windowSec);

      if (!result.allowed) {
        response.setHeader('Retry-After', result.retryAfter);
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

  private async checkRateLimit(key: string, limit: number, windowSec: number): Promise<{ allowed: boolean; count: number; retryAfter: number }> {
    if (this.redis) {
      try {
        return await this.checkRedis(key, limit, windowSec);
      } catch {
        return this.checkMemory(key, limit, windowSec * 1000);
      }
    }
    return this.checkMemory(key, limit, windowSec * 1000);
  }

  private async checkRedis(key: string, limit: number, windowSec: number): Promise<{ allowed: boolean; count: number; retryAfter: number }> {
    const count = await this.redis!.incr(key);
    if (count === 1) {
      await this.redis!.expire(key, windowSec);
    }
    const ttl = await this.redis!.ttl(key);
    return { allowed: count <= limit, count, retryAfter: ttl > 0 ? ttl : windowSec };
  }

  private checkMemory(key: string, limit: number, windowMs: number): { allowed: boolean; count: number; retryAfter: number } {
    const now = Date.now();
    let record = this.fallbackStore.get(key);

    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + windowMs };
      this.fallbackStore.set(key, record);
    }

    record.count++;
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: record.count <= limit, count: record.count, retryAfter };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.fallbackStore.entries()) {
      if (now > record.resetAt) {
        this.fallbackStore.delete(key);
      }
    }
  }
}
