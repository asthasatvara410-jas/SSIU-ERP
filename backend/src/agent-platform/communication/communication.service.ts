import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CommunicationChannel } from '../types/agent.types';

export interface SendNotificationDto {
  recipientType: 'STUDENT' | 'FACULTY' | 'PARENT' | 'ADMIN';
  recipientId: string;
  channel: CommunicationChannel;
  templateCode?: string;
  subject?: string;
  messageBody: string;
  tenantId?: string;
}

@Injectable()
export class AgentCommunicationService {
  private readonly logger = new Logger('AgentCommunicationService');

  constructor(private readonly prisma: PrismaService) {}

  async sendNotification(dto: SendNotificationDto) {
    this.logger.log(
      `[COMMUNICATION_DISPATCH] Channel: ${dto.channel} | Recipient: ${dto.recipientType}:${dto.recipientId} | Subject: ${dto.subject || 'Notification'}`,
    );

    // 1. Create communication log
    const log = await this.prisma.communicationLog.create({
      data: {
        recipientType: dto.recipientType,
        recipientId: dto.recipientId,
        channel: dto.channel,
        direction: 'OUTBOUND',
        templateCode: dto.templateCode,
        subject: dto.subject,
        messageBody: dto.messageBody,
        deliveryStatus: 'SENT',
        sentAt: new Date(),
        tenantId: dto.tenantId || 'DEFAULT',
      },
    });

    // 2. Mock external provider dispatch with delivery confirmation
    const externalId = `ext-${dto.channel.toLowerCase()}-${Date.now()}`;
    await this.prisma.notificationDelivery.create({
      data: {
        communicationLogId: log.id,
        channel: dto.channel,
        externalMessageId: externalId,
        status: 'DELIVERED',
        statusTimestamp: new Date(),
        rawResponse: { provider: dto.channel, messageId: externalId, success: true },
      },
    });

    return {
      success: true,
      logId: log.id,
      channel: dto.channel,
      recipientId: dto.recipientId,
      status: 'DELIVERED',
    };
  }
}
