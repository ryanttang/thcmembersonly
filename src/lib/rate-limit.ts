import { NextRequest } from 'next/server';
import { redis, isRedisEnabled } from '@/lib/redis';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests per window
  keyGenerator?: (req: NextRequest) => string;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// In-memory store fallback (development or when Redis is not configured)
const memoryStore = new Map<string, { count: number; resetTime: number }>();

function memoryRateLimit(options: RateLimitOptions) {
  const { windowMs, max, keyGenerator } = options;

  return async (req: NextRequest): Promise<RateLimitResult> => {
    const key = keyGenerator ? keyGenerator(req) : getDefaultKey(req);
    const now = Date.now();

    const current = memoryStore.get(key);
    if (!current || current.resetTime < now) {
      const resetTime = now + windowMs;
      memoryStore.set(key, { count: 1, resetTime });
      return { success: true, limit: max, remaining: max - 1, reset: resetTime };
    }

    if (current.count >= max) {
      return { success: false, limit: max, remaining: 0, reset: current.resetTime };
    }

    current.count++;
    memoryStore.set(key, current);
    return { success: true, limit: max, remaining: max - current.count, reset: current.resetTime };
  };
}

function redisRateLimit(options: RateLimitOptions) {
  const { windowMs, max, keyGenerator } = options;

  return async (req: NextRequest): Promise<RateLimitResult> => {
    // If Redis is not available, fallback to memory
    if (!isRedisEnabled() || !redis) {
      return memoryRateLimit(options)(req);
    }

    const key = keyGenerator ? keyGenerator(req) : getDefaultKey(req);
    const now = Date.now();

    // Increment and set TTL on first hit
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.pexpire(key, windowMs);
    }

    const ttl = await redis.pttl(key); // milliseconds until reset
    const reset = ttl > 0 ? now + ttl : now + windowMs;

    if (count > max) {
      return { success: false, limit: max, remaining: 0, reset };
    }

    return { success: true, limit: max, remaining: max - count, reset };
  };
}

export function rateLimit(options: RateLimitOptions) {
  // Prefer Redis when available
  return isRedisEnabled() ? redisRateLimit(options) : memoryRateLimit(options);
}

function getDefaultKey(req: NextRequest): string {
  // Use IP address as default key
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown';
  return `rate_limit:${ip}`;
}

// Predefined rate limiters
export const authRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 attempts per window (generous for debugging)
  keyGenerator: (req) => {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown';
    return `auth:${ip}`;
  },
});

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
});

export const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 uploads per 15 minutes (more generous for development)
});

export const contactRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 contact messages per hour
});