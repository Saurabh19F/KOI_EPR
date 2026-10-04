import { existsSync } from 'fs';
import { join } from 'path';
import { Logger, Provider } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { config as loadEnv } from 'dotenv';
import type { ConfigService } from '@nestjs/config';

for (const envPath of [join(process.cwd(), '.env'), join(process.cwd(), 'apps/api/.env')]) {
  if (existsSync(envPath)) {
    loadEnv({ path: envPath, override: false });
  }
}

const disabledValues = new Set(['false', '0', 'off', 'no']);
const enabledValues = new Set(['true', '1', 'on', 'yes']);

export function queuesEnabled(): boolean {
  const rawValue = process.env.QUEUES_ENABLED ?? process.env.BULLMQ_ENABLED;
  return rawValue ? !disabledValues.has(rawValue.toLowerCase()) : true;
}

export function createRedisConnectionOptions(config: ConfigService): Record<string, unknown> {
  const redisUrl = config.get<string>('REDIS_URL');
  const redisUrlOptions = parseRedisUrl(redisUrl);

  if (redisUrlOptions) {
    return {
      ...redisUrlOptions,
      maxRetriesPerRequest: null,
      lazyConnect: true,
    };
  }

  const upstashRestUrl = config.get<string>('UPSTASH_REDIS_REST_URL');
  const upstashHost = getHostname(upstashRestUrl);
  const redisHost = config.get<string>('REDIS_HOST');
  const password = config.get<string>('REDIS_PASSWORD') || config.get<string>('UPSTASH_REDIS_REST_TOKEN');
  const tlsValue = config.get<string>('REDIS_TLS');

  return {
    host: redisHost || upstashHost || 'localhost',
    port: Number(config.get('REDIS_PORT', 6379)),
    ...(password ? { password } : {}),
    ...(readBoolean(tlsValue, !!upstashHost) ? { tls: {} } : {}),
    maxRetriesPerRequest: null,
    lazyConnect: true,
  };
}

function parseRedisUrl(url?: string): Record<string, unknown> | undefined {
  if (!url) return undefined;

  try {
    const parsedUrl = new URL(url);
    const isTls = parsedUrl.protocol === 'rediss:';

    return {
      host: parsedUrl.hostname,
      port: Number(parsedUrl.port || 6379),
      ...(parsedUrl.username ? { username: decodeURIComponent(parsedUrl.username) } : {}),
      ...(parsedUrl.password ? { password: decodeURIComponent(parsedUrl.password) } : {}),
      ...(isTls ? { tls: {} } : {}),
    };
  } catch {
    return undefined;
  }
}

function getHostname(url?: string): string | undefined {
  if (!url) return undefined;

  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

function readBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue;

  const normalizedValue = value.toLowerCase();
  if (enabledValues.has(normalizedValue)) return true;
  if (disabledValues.has(normalizedValue)) return false;

  return defaultValue;
}

export function createNoopQueueProviders(queueNames: string[]): Provider[] {
  const logger = new Logger('BullMQ');

  return queueNames.map((queueName) => ({
    provide: getQueueToken(queueName),
    useValue: {
      name: queueName,
      add: async (jobName: string) => {
        logger.warn(`Queue "${queueName}" disabled; skipped job "${jobName}"`);
        return null;
      },
      close: async () => undefined,
      disconnect: async () => undefined,
      on: () => undefined,
    },
  }));
}
