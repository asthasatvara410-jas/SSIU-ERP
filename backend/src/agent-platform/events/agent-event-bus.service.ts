import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TriggerEventType } from '../types/agent.types';

export interface PublishEventDto {
  eventType: TriggerEventType;
  eventSource: string;
  idempotencyKey: string;
  payload: Record<string, any>;
  tenantId?: string;
}

export interface EventPublishResult {
  eventId: string;
  isDuplicate: boolean;
  status: 'PENDING' | 'PROCESSED' | 'DUPLICATE';
}

@Injectable()
export class AgentEventBusService {
  private readonly logger = new Logger('AgentEventBus');

  constructor(private readonly prisma: PrismaService) {}

  async publish(dto: PublishEventDto): Promise<EventPublishResult> {
    // 1. Idempotency Check
    const existing = await this.prisma.automationEvent.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
    });

    if (existing) {
      this.logger.warn(
        `[IDEMPOTENCY_GUARD] Event with key '${dto.idempotencyKey}' already processed. Suppressing duplicate execution.`,
      );
      return {
        eventId: existing.id,
        isDuplicate: true,
        status: 'DUPLICATE',
      };
    }

    // 2. Persist new event
    const event = await this.prisma.automationEvent.create({
      data: {
        eventType: dto.eventType,
        eventSource: dto.eventSource,
        idempotencyKey: dto.idempotencyKey,
        payload: dto.payload,
        status: 'PENDING',
        tenantId: dto.tenantId || 'DEFAULT',
      },
    });

    this.logger.log(`[EVENT_PUBLISHED] Event '${dto.eventType}' (ID: ${event.id}) queued.`);
    return {
      eventId: event.id,
      isDuplicate: false,
      status: 'PENDING',
    };
  }

  async markEventProcessed(eventId: string, errorDetails?: string) {
    return this.prisma.automationEvent.update({
      where: { id: eventId },
      data: {
        status: errorDetails ? 'FAILED' : 'PROCESSED',
        processedAt: new Date(),
        errorDetails,
      },
    });
  }
}
