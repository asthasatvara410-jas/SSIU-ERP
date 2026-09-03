import { Injectable } from '@nestjs/common';
import { ToolRateLimitConfig } from './tool.types';

@Injectable()
export class ToolRateLimitService {
  private readonly callHistory = new Map<string, number[]>();

  /**
   * Evaluates if a request breaches the tool's rate limit window.
   */
  isRateLimited(
    keyIdentifier: string, // e.g. `${tenantId}:${agentKey}:${toolKey}`
    config: ToolRateLimitConfig,
  ): boolean {
    if (!config || !config.requests || !config.windowSeconds) {
      return false;
    }

    const now = Date.now();
    const windowMs = config.windowSeconds * 1000;
    const history = this.callHistory.get(keyIdentifier) || [];

    // Filter calls within the rolling window
    const recentCalls = history.filter(timestamp => now - timestamp < windowMs);

    if (recentCalls.length >= config.requests) {
      return true;
    }

    recentCalls.push(now);
    this.callHistory.set(keyIdentifier, recentCalls);
    return false;
  }
}
