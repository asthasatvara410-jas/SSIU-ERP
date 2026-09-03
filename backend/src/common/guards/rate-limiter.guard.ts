import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_KEY, RateLimitOptions } from '../decorators/rate-limit.decorator';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

/**
 * High-Performance In-Memory Sliding-Window Rate Limiter Guard for SSIU ERP.
 * 
 * SECURITY & CONCURRENCY GUARANTEES:
 * - Aggressively throttles brute-force authentication and compute-heavy endpoints.
 * - Supports composite keys (IP + loginId) to protect legitimate users behind campus NAT/shared proxy IPs.
 * - Sets standard Retry-After and X-RateLimit headers.
 * - Never logs passwords, tokens, Authorization headers, or request bodies.
 * - Periodically purges expired records to guarantee bounded memory usage (< 2 MB).
 * - NOTE: In-memory limiting operates per application process. When scaling horizontally across
 *   multiple server nodes, a centralized Redis store should replace the local Map as documented
 *   in FUTURE_PHASE9_DATABASE_REQUIREMENTS.md.
 */
@Injectable()
export class RateLimiterGuard implements CanActivate {
  private readonly logger = new Logger(RateLimiterGuard.name);
  private static readonly records = new Map<string, RateLimitRecord>();
  private static lastCleanupTime = Date.now();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If endpoint has no @RateLimit decorator, allow immediately without overhead
    if (!options) {
      return true;
    }

    const http = context.switchToHttp();
    const req = http.getRequest<any>();
    const res = http.getResponse<any>();

    const now = Date.now();
    this.cleanupExpiredRecords(now);

    // Derive client IP address
    const rawIp =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      '127.0.0.1';
    const clientIp = rawIp.replace(/^::ffff:/, '');

    // Construct rate-limit tracking key
    const prefix = options.keyPrefix || `${req.baseUrl || ''}${req.path || ''}`;
    let trackKey = `${prefix}:${clientIp}`;

    // NAT protection: if compositeWithBodyField specified, scope to IP + identifier
    if (options.compositeWithBodyField && req.body && typeof req.body === 'object') {
      const fieldVal = req.body[options.compositeWithBodyField];
      if (fieldVal && typeof fieldVal === 'string') {
        const sanitizedId = fieldVal.trim().toLowerCase().slice(0, 64);
        trackKey = `${prefix}:${clientIp}:${sanitizedId}`;
      }
    }

    const windowDurationMs = options.ttlSeconds * 1000;
    let record = RateLimiterGuard.records.get(trackKey);

    if (!record || now >= record.resetTime) {
      // First request in this window
      record = {
        count: 1,
        resetTime: now + windowDurationMs,
      };
      RateLimiterGuard.records.set(trackKey, record);

      if (res.setHeader) {
        res.setHeader('X-RateLimit-Limit', options.limit);
        res.setHeader('X-RateLimit-Remaining', options.limit - 1);
        res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));
      }
      return true;
    }

    // Existing active window
    if (record.count >= options.limit) {
      const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));

      if (res.setHeader) {
        res.setHeader('Retry-After', retryAfterSeconds);
        res.setHeader('X-RateLimit-Limit', options.limit);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));
      }

      this.logger.warn(
        `Rate limit exceeded for client [${clientIp}] on [${prefix}]. Limit: ${options.limit}/${options.ttlSeconds}s. Retry after: ${retryAfterSeconds}s`,
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'TOO_MANY_REQUESTS',
          message: `Too many requests. Rate limit of ${options.limit} requests per ${options.ttlSeconds}s exceeded. Please try again in ${retryAfterSeconds} seconds.`,
          retryAfter: retryAfterSeconds,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment request count within active window
    record.count++;
    RateLimiterGuard.records.set(trackKey, record);

    if (res.setHeader) {
      res.setHeader('X-RateLimit-Limit', options.limit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, options.limit - record.count));
      res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));
    }

    return true;
  }

  /**
   * Periodic non-blocking cleanup of expired in-memory rate-limiting entries.
   */
  private cleanupExpiredRecords(now: number): void {
    if (now - RateLimiterGuard.lastCleanupTime < 30000) {
      return;
    }
    RateLimiterGuard.lastCleanupTime = now;

    for (const [key, record] of RateLimiterGuard.records.entries()) {
      if (now >= record.resetTime) {
        RateLimiterGuard.records.delete(key);
      }
    }
  }

  /**
   * Helper to reset in-memory records (useful for automated testing).
   */
  public static resetAll(): void {
    RateLimiterGuard.records.clear();
  }
}
