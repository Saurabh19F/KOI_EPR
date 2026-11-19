import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { createRedisConnectionOptions } from '../queue.config';

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis | null = null;
  private fallback: Map<string, { value: string; expiresAt: number }> = new Map();
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly defaultTtl: number;

  constructor(private configService: ConfigService) {
    this.defaultTtl = Number(configService.get('CACHE_TTL_SECONDS', 30));
  }

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
      this.logger.log('Cache service connected to Redis');
    } catch {
      this.logger.warn('Redis unavailable for caching — using in-memory fallback');
      this.redis = null;
    }
  }

  async onModuleDestroy() {
    await this.redis?.quit();
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      if (this.redis) {
        const val = await this.redis.get(key);
        return val ? JSON.parse(val) : null;
      }
      const entry = this.fallback.get(key);
      if (!entry || Date.now() > entry.expiresAt) {
        if (entry) this.fallback.delete(key);
        return null;
      }
      return JSON.parse(entry.value);
    } catch {
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds ?? this.defaultTtl;
    const serialized = JSON.stringify(value);
    try {
      if (this.redis) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        this.fallback.set(key, { value: serialized, expiresAt: Date.now() + ttl * 1000 });
      }
    } catch {
      this.fallback.set(key, { value: serialized, expiresAt: Date.now() + ttl * 1000 });
    }
  }

  async del(key: string): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.del(key);
      }
      this.fallback.delete(key);
    } catch {
      this.fallback.delete(key);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      if (this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) await this.redis.del(...keys);
      }
      for (const key of this.fallback.keys()) {
        if (key.match(pattern.replace(/\*/g, '.*'))) {
          this.fallback.delete(key);
        }
      }
    } catch {
      // best-effort
    }
  }
}
