// Cache doesn't need environment variables, so we can remove the import

import { redis, isRedisEnabled } from '@/lib/redis';

// Simple in-memory cache implementation with optional Redis backend
const DISABLE_IN_MEMORY_CACHE = process.env.NODE_ENV === 'production' && isRedisEnabled();

interface CacheLike {
  set(key: string, value: any, ttl?: number): void | Promise<void>;
  get<T>(key: string): T | null | Promise<T | null>;
  delete(key: string): boolean | Promise<boolean>;
  clear(): void | Promise<void>;
  has(key: string): boolean | Promise<boolean>;
  size(): number | Promise<number>;
  cleanup(): void | Promise<void>;
}

class MemoryCache implements CacheLike {
  private store: Map<string, { value: any; expires: number }> = new Map();
  private defaultTTL: number;

  constructor(defaultTTL: number = 300000) { // 5 minutes default
    this.defaultTTL = defaultTTL;
  }

  // Set a value in cache
  set(key: string, value: any, ttl?: number): void {
    if (DISABLE_IN_MEMORY_CACHE) return;
    const expires = Date.now() + (ttl || this.defaultTTL);
    this.store.set(key, { value, expires });
  }

  // Get a value from cache
  get<T>(key: string): T | null {
    if (DISABLE_IN_MEMORY_CACHE) return null;
    const item = this.store.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expires) {
      this.store.delete(key);
      return null;
    }

    return item.value as T;
  }

  // Delete a value from cache
  delete(key: string): boolean {
    if (DISABLE_IN_MEMORY_CACHE) return false;
    return this.store.delete(key);
  }

  // Clear all cache
  clear(): void {
    if (DISABLE_IN_MEMORY_CACHE) return;
    this.store.clear();
  }

  // Check if key exists and is not expired
  has(key: string): boolean {
    if (DISABLE_IN_MEMORY_CACHE) return false;
    const item = this.store.get(key);
    return item ? Date.now() <= item.expires : false;
  }

  // Get cache size
  size(): number {
    if (DISABLE_IN_MEMORY_CACHE) return 0;
    return this.store.size;
  }

  // Clean expired entries
  cleanup(): void {
    if (DISABLE_IN_MEMORY_CACHE) return;
    const now = Date.now();
    const entries = Array.from(this.store.entries());
    for (const [key, item] of entries) {
      if (now > item.expires) {
        this.store.delete(key);
      }
    }
  }
}

class RedisCache implements CacheLike {
  private defaultTTL: number;
  private prefix: string;

  constructor(defaultTTL: number, prefix: string) {
    this.defaultTTL = defaultTTL;
    this.prefix = prefix;
  }

  private k(key: string): string {
    return `${this.prefix}:${key}`;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!redis) return;
    const payload = JSON.stringify(value);
    const ttlMs = ttl || this.defaultTTL;
    await redis.set(this.k(key), payload, { px: ttlMs });
  }

  async get<T>(key: string): Promise<T | null> {
    if (!redis) return null;
    const raw = await redis.get(this.k(key));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!redis) return false;
    const res = await redis.del(this.k(key));
    return res > 0;
  }

  async clear(): Promise<void> {
    if (!redis) return;
    let cursor = 0;
    const pattern = `${this.prefix}:*`;
    const keysToDelete: string[] = [];
    do {
      const reply = await redis.scan(cursor, { match: pattern, count: 100 });
      cursor = reply[0];
      const keys = reply[1] || [];
      keysToDelete.push(...keys);
    } while (cursor !== 0);
    
    if (keysToDelete.length > 0) {
      await redis.del(keysToDelete);
    }
  }

  async has(key: string): Promise<boolean> {
    if (!redis) return false;
    const ttl = await redis.pttl(this.k(key));
    return ttl > 0;
  }

  async size(): Promise<number> {
    if (!redis) return 0;
    let cursor = 0;
    let count = 0;
    const pattern = `${this.prefix}:*`;
    do {
      const reply = await redis.scan(cursor, { match: pattern, count: 100 });
      cursor = reply[0];
      const keys = reply[1] || [];
      count += keys.length;
    } while (cursor !== 0);
    return count;
  }

  async cleanup(): Promise<void> {
    // Redis handles expiry; nothing to do
  }
}

// Create cache instances for different use cases
const useRedis = isRedisEnabled();

export const eventCache: CacheLike = useRedis ? new RedisCache(600000, 'event') : new MemoryCache(600000);
export const userCache: CacheLike = useRedis ? new RedisCache(300000, 'user') : new MemoryCache(300000);
export const imageCache: CacheLike = useRedis ? new RedisCache(1800000, 'image') : new MemoryCache(1800000);
export const apiCache: CacheLike = useRedis ? new RedisCache(60000, 'api') : new MemoryCache(60000);

// Cache key generators
export const cacheKeys = {
  event: (id: string) => `event:${id}`,
  events: (filters?: string) => `events:${filters || 'all'}`,
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  gallery: (id: string) => `gallery:${id}`,
  galleries: (eventId: string) => `galleries:${eventId}`,
  image: (key: string) => `image:${key}`,
  coordination: (id: string) => `coordination:${id}`,
  instagramPosts: (accountId: string) => `instagram:${accountId}`,
};

// Cache wrapper for async functions
export function withCache<T extends any[], R>(
  cache: CacheLike,
  keyGenerator: (...args: T) => string,
  fn: (...args: T) => Promise<R>,
  ttl?: number
) {
  return async (...args: T): Promise<R> => {
    const key = keyGenerator(...args);
    
    // Try to get from cache first
    const cached = await cache.get<R>(key as string);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn(...args);
    await cache.set(key, result, ttl);
    
    return result;
  };
}

// Database query caching
export function cacheQuery<T extends any[], R>(
  cache: CacheLike,
  keyGenerator: (...args: T) => string,
  queryFn: (...args: T) => Promise<R>,
  ttl?: number
) {
  return withCache(cache, keyGenerator, queryFn, ttl);
}

// API response caching
export function cacheApiResponse<T>(
  cache: CacheLike,
  key: string,
  responseFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  return withCache(cache, () => key, responseFn, ttl)();
}

// Cache invalidation helpers
export async function invalidateEventCache(eventId?: string): Promise<void> {
  if (eventId) {
    await eventCache.delete(cacheKeys.event(eventId));
    await eventCache.delete(cacheKeys.events());
    await eventCache.delete(cacheKeys.galleries(eventId));
  } else {
    // Clear all event-related cache
    await eventCache.clear();
  }
}

export async function invalidateUserCache(userId?: string, email?: string): Promise<void> {
  if (userId) {
    await userCache.delete(cacheKeys.user(userId));
  }
  if (email) {
    await userCache.delete(cacheKeys.userByEmail(email));
  }
}

export async function invalidateGalleryCache(galleryId?: string, eventId?: string): Promise<void> {
  if (galleryId) {
    await imageCache.delete(cacheKeys.gallery(galleryId));
  }
  if (eventId) {
    await imageCache.delete(cacheKeys.galleries(eventId));
  }
}

// Periodic cleanup
if (typeof window === 'undefined' && !useRedis) { // Server-side only, memory cleanup
  setInterval(() => {
    (eventCache as MemoryCache).cleanup?.();
    (userCache as MemoryCache).cleanup?.();
    (imageCache as MemoryCache).cleanup?.();
    (apiCache as MemoryCache).cleanup?.();
  }, 300000);
}
