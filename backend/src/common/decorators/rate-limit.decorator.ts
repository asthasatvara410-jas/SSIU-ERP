import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'RATE_LIMIT_CONFIG';

export interface RateLimitOptions {
  /**
   * Maximum allowed requests within the time window.
   */
  limit: number;
  /**
   * Time window duration in seconds.
   */
  ttlSeconds: number;
  /**
   * Custom namespace/prefix for tracking key (e.g. 'auth:login', 'bulk:upload').
   */
  keyPrefix?: string;
  /**
   * Optional field name in request body to combine with IP for NAT/shared IP protection.
   * e.g. 'loginId' or 'username' ensures different students sharing one campus NAT IP
   * are not blocked by a single user's failed attempts.
   */
  compositeWithBodyField?: string;
}

/**
 * Decorator to apply in-memory sliding window rate limiting to controller endpoints.
 */
export const RateLimit = (options: RateLimitOptions) => SetMetadata(RATE_LIMIT_KEY, options);
