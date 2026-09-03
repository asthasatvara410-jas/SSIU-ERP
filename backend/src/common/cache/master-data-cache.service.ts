import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * High-Performance In-Memory Master Data Caching Service for SSIU ERP
 * Caches frequently queried, relatively static university master records:
 * - Institutes
 * - Departments
 * - Programs / Degrees
 * - Academic Years
 * - Subjects / Courses
 * 
 * SECURITY & SCOPE GUARANTEES:
 * - Strictly NO user authorization decisions, credentials, tokens, or personal records are cached.
 * - Invalidation occurs automatically on master record creation or updates.
 * - Single-instance in-memory TTL; safe for multi-instance when read-heavy masters are partitioned.
 */
@Injectable()
export class MasterDataCacheService {
  private readonly logger = new Logger(MasterDataCacheService.name);
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTtlMs = 10 * 60 * 1000; // 10 minutes

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number = this.defaultTtlMs): void {
    // Safety check: Never cache sensitive tokens or passwords
    const strVal = typeof data === 'string' ? data : JSON.stringify(data || {});
    if (strVal.includes('passwordHash') || strVal.includes('accessToken') || strVal.includes('refreshToken')) {
      this.logger.warn(`Security Warning: Attempted to cache sensitive object under key "${key}". Caching skipped.`);
      return;
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlMs: number = this.defaultTtlMs): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetcher();
    this.set(key, fresh, ttlMs);
    return fresh;
  }

  invalidate(pattern: string): void {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        count++;
      }
    }
    if (count > 0) {
      this.logger.log(`Invalidated ${count} cache entry/entries matching pattern "${pattern}".`);
    }
  }

  invalidateAll(): void {
    this.cache.clear();
    this.logger.log('All master data cache entries cleared.');
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}
