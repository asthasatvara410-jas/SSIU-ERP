import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ERPEvent } from './event.types';

@Injectable()
export class EventIdempotencyService {
  private readonly logger = new Logger('EventIdempotencyService');
  private readonly inMemoryCache = new Set<string>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Checks if an event has already been recorded or processed.
   */
  async isDuplicate(event: ERPEvent): Promise<boolean> {
    const key = event.idempotencyKey || event.eventId;

    // Fast in-memory check
    if (this.inMemoryCache.has(key)) {
      return true;
    }

    try {
      const existing = await this.prisma.automationEvent.findUnique({
        where: { idempotencyKey: key },
      });

      if (existing) {
        this.inMemoryCache.add(key);
        return true;
      }
    } catch (err: any) {
      this.logger.warn(`Idempotency database check fallback: ${err.message}`);
    }

    return false;
  }

  /**
   * Records event in idempotency store.
   */
  async recordEvent(event: ERPEvent): Promise<void> {
    const key = event.idempotencyKey || event.eventId;
    this.inMemoryCache.add(key);

    try {
      await this.prisma.automationEvent.upsert({
        where: { idempotencyKey: key },
        create: {
          eventType: event.eventType,
          eventSource: event.sourceModule,
          idempotencyKey: key,
          payload: event.payload as any,
          status: 'PENDING',
          tenantId: event.tenantId || 'DEFAULT',
        },
        update: {
          status: 'PENDING',
        },
      });
    } catch (err: any) {
      this.logger.warn(`Could not persist automation event record: ${err.message}`);
    }
  }

  /**
   * Marks event status in store.
   */
  async markStatus(key: string, status: 'PROCESSED' | 'FAILED' | 'DUPLICATE', errorDetails?: string): Promise<void> {
    try {
      await this.prisma.automationEvent.update({
        where: { idempotencyKey: key },
        data: {
          status,
          processedAt: new Date(),
          errorDetails,
        },
      });
    } catch {
      // Ignored for non-persisted test mocks
    }
  }
}
