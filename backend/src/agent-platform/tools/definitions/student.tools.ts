import { ToolDefinition } from '../tool.types';

export const studentTools: ToolDefinition[] = [
  {
    key: 'STUDENT_GET_PROFILE',
    name: 'Get Student Academic Profile',
    description: 'Retrieves non-sensitive enrollment profile, program, and current semester information.',
    version: '1.0.0',
    status: 'ACTIVE',
    category: 'STUDENT',
    riskLevel: 'LOW',
    allowedAgents: ['ALL'],
    requiredPermissions: ['student.read'],
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
    rateLimit: { requests: 100, windowSeconds: 60 },
    idempotent: true,
    handler: async (input, context) => {
      return {
        studentId: input.studentId,
        fullName: 'Aarav Sharma',
        program: 'B.Tech Computer Science',
        semester: 6,
        division: 'A',
      };
    },
  },
];
