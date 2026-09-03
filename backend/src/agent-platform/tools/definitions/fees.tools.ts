import { ToolDefinition } from '../tool.types';

export const feesTools: ToolDefinition[] = [
  {
    key: 'FEES_GET_OUTSTANDING',
    name: 'Get Outstanding Fee Invoices',
    description: 'Queries overdue and outstanding tuition balances for a student.',
    version: '1.0.0',
    status: 'ACTIVE',
    category: 'FINANCE',
    riskLevel: 'LOW',
    allowedAgents: ['FEE_RECOVERY_AGENT', 'ALL'],
    requiredPermissions: ['fees.read'],
    inputSchema: {
      type: 'object',
      properties: {
        studentId: { type: 'string' },
      },
      required: ['studentId'],
    },
    requiresApproval: false,
    supportsDryRun: true,
    timeoutMs: 5000,
    rateLimit: { requests: 60, windowSeconds: 60 },
    idempotent: true,
    handler: async (input, context) => {
      return {
        studentId: input.studentId,
        totalOutstanding: 45000,
        currency: 'INR',
        dueDate: '2026-08-15',
        isOverdue: true,
      };
    },
  },
  {
    key: 'FEES_CREATE_PAYMENT_PLAN',
    name: 'Create Approved Installment Payment Plan',
    description: 'Generates structured EMI installments for a student upon finance authorization.',
    version: '1.0.0',
    status: 'ACTIVE',
    category: 'FINANCE',
    riskLevel: 'HIGH',
    allowedAgents: ['FEE_RECOVERY_AGENT'],
    requiredPermissions: ['fees.write'],
    inputSchema: {
      type: 'object',
      properties: {
        studentId: { type: 'string' },
        totalOutstanding: { type: 'number' },
        downPayment: { type: 'number' },
        installmentsCount: { type: 'number' },
      },
      required: ['studentId', 'totalOutstanding', 'downPayment', 'installmentsCount'],
    },
    requiresApproval: true,
    supportsDryRun: true,
    timeoutMs: 5000,
    rateLimit: { requests: 10, windowSeconds: 60 },
    idempotent: true,
    handler: async (input, context) => {
      return {
        success: true,
        planId: `plan-${Date.now()}`,
        studentId: input.studentId,
        totalOutstanding: input.totalOutstanding,
        downPayment: input.downPayment,
        installmentsCount: input.installmentsCount,
        status: 'PLAN_CREATED',
        createdAt: new Date().toISOString(),
      };
    },
  },
];
