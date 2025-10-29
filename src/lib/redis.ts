import { env } from '@/lib/env';

// Prefer Upstash REST (serverless friendly). If not configured, export null.
let redisClient: any = null;

try {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    // Lazy import to avoid bundling when unused
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Redis } = require('@upstash/redis');
    redisClient = new Redis({ url: upstashUrl, token: upstashToken });
  }
} catch (err) {
  // If dependency missing in local dev, keep redisClient null
}

export const redis = redisClient as
  | {
      incr: (key: string) => Promise<number>;
      pexpire: (key: string, ttlMs: number) => Promise<unknown>;
      pttl: (key: string) => Promise<number>;
      del: (key: string) => Promise<unknown>;
    }
  | null;

export function isRedisEnabled(): boolean {
  return Boolean(redis);
}


