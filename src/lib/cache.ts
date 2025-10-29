// Cache doesn't need environment variables, so we can remove the import

// Simple in-memory cache implementation
// In production, replace with Redis or similar
const DISABLE_IN_MEMORY_CACHE = process.env.NODE_ENV === 'production';

class Cache {
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

// Create cache instances for different use cases
export const eventCache = new Cache(600000); // 10 minutes
export const userCache = new Cache(300000);  // 5 minutes
export const imageCache = new Cache(1800000); // 30 minutes
export const apiCache = new Cache(60000);    // 1 minute

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
  cache: Cache,
  keyGenerator: (...args: T) => string,
  fn: (...args: T) => Promise<R>,
  ttl?: number
) {
  return async (...args: T): Promise<R> => {
    const key = keyGenerator(...args);
    
    // Try to get from cache first
    const cached = cache.get<R>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn(...args);
    cache.set(key, result, ttl);
    
    return result;
  };
}

// Database query caching
export function cacheQuery<T extends any[], R>(
  cache: Cache,
  keyGenerator: (...args: T) => string,
  queryFn: (...args: T) => Promise<R>,
  ttl?: number
) {
  return withCache(cache, keyGenerator, queryFn, ttl);
}

// API response caching
export function cacheApiResponse<T>(
  cache: Cache,
  key: string,
  responseFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  return withCache(cache, () => key, responseFn, ttl)();
}

// Cache invalidation helpers
export function invalidateEventCache(eventId?: string): void {
  if (eventId) {
    eventCache.delete(cacheKeys.event(eventId));
    eventCache.delete(cacheKeys.events());
    eventCache.delete(cacheKeys.galleries(eventId));
  } else {
    // Clear all event-related cache
    eventCache.clear();
  }
}

export function invalidateUserCache(userId?: string, email?: string): void {
  if (userId) {
    userCache.delete(cacheKeys.user(userId));
  }
  if (email) {
    userCache.delete(cacheKeys.userByEmail(email));
  }
}

export function invalidateGalleryCache(galleryId?: string, eventId?: string): void {
  if (galleryId) {
    imageCache.delete(cacheKeys.gallery(galleryId));
  }
  if (eventId) {
    imageCache.delete(cacheKeys.galleries(eventId));
  }
}

// Periodic cleanup
if (typeof window === 'undefined') { // Server-side only
  setInterval(() => {
    eventCache.cleanup();
    userCache.cleanup();
    imageCache.cleanup();
    apiCache.cleanup();
  }, 300000); // Cleanup every 5 minutes
}
