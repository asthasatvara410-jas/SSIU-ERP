import { Injectable, Logger } from '@nestjs/common';
import { ToolExecutionResult } from './tool.types';

@Injectable()
export class ToolIdempotencyService {
  private readonly logger = new Logger('ToolIdempotencyService');
  private readonly idempotencyCache = new Map<string, ToolExecutionResult>();

  getCompositeKey(tenantId: string, toolKey: string, idempotencyKey: string): string {
    return `${tenantId}:${toolKey}:${idempotencyKey}`;
  }

  getPreviousExecution(compositeKey: string): ToolExecutionResult | undefined {
    return this.idempotencyCache.get(compositeKey);
  }

  recordExecution(compositeKey: string, result: ToolExecutionResult): void {
    this.idempotencyCache.set(compositeKey, result);
  }
}
