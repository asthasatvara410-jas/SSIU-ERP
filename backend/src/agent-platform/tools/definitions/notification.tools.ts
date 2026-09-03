import { ToolDefinition } from '../tool.types';

export const notificationTools: ToolDefinition[] = [
  {
    key: 'NOTIFICATION_SEND',
    name: 'Send Official Notification',
    description: 'Dispatches targeted in-app or SMS alerts to faculty or students.',
    version: '1.0.0',
    status: 'ACTIVE',
    category: 'COMMUNICATION',
    riskLevel: 'MEDIUM',
    allowedAgents: ['TIMETABLE_SUBSTITUTION_AGENT', 'DOCUMENT_VERIFICATION_AGENT', 'FEE_RECOVERY_AGENT', 'ALL'],
    requiredPermissions: ['notification.send'],
    inputSchema: {
      type: 'object',
      properties: {
        recipientId: { type: 'string' },
        recipientType: { type: 'string' },
        channel: { type: 'string' },
        subject: { type: 'string' },
        message: { type: 'string' },
      },
      required: ['recipientId', 'subject', 'message'],
    },
    requiresApproval: false,
    supportsDryRun: true,
    timeoutMs: 5000,
    rateLimit: { requests: 10, windowSeconds: 60 },
    idempotent: false,
    handler: async (input, context) => {
      return {
        recipientId: input.recipientId,
        channel: input.channel || 'IN_APP',
        deliveryStatus: 'SENT',
        sentAt: new Date().toISOString(),
      };
    },
  },
];
