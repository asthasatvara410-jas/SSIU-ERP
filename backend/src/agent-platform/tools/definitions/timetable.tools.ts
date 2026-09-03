import { ToolDefinition } from '../tool.types';

export const timetableTools: ToolDefinition[] = [
  {
    key: 'TIMETABLE_GET',
    name: 'Get Timetable Schedule',
    description: 'Retrieves active timetable slots for a given faculty member or division.',
    version: '1.0.0',
    status: 'ACTIVE',
    category: 'ACADEMIC',
    riskLevel: 'LOW',
    allowedAgents: ['TIMETABLE_SUBSTITUTION_AGENT', 'ALL'],
    requiredPermissions: ['timetable.read'],
    inputSchema: {
      type: 'object',
      properties: {
        facultyId: { type: 'string' },
        dayOfWeek: { type: 'string' },
      },
      required: ['facultyId'],
    },
    requiresApproval: false,
    supportsDryRun: true,
    timeoutMs: 5000,
    rateLimit: { requests: 60, windowSeconds: 60 },
    idempotent: true,
    handler: async (input, context) => {
      return {
        facultyId: input.facultyId,
        dayOfWeek: input.dayOfWeek || 'MONDAY',
        slots: [
          { startTime: '09:00', endTime: '10:00', subject: 'DBMS', room: 'A-204' },
          { startTime: '11:00', endTime: '12:00', subject: 'DBMS Lab', room: 'Lab-2' },
        ],
      };
    },
  },
  {
    key: 'TIMETABLE_FIND_FREE_FACULTY',
    name: 'Find Available Peer Faculty',
    description: 'Scans department roster to find faculty without lecture clashes and with available workload capacity.',
    version: '1.0.0',
    status: 'ACTIVE',
    category: 'ACADEMIC',
    riskLevel: 'LOW',
    allowedAgents: ['TIMETABLE_SUBSTITUTION_AGENT', 'ALL'],
    requiredPermissions: ['faculty.read', 'timetable.read'],
    inputSchema: {
      type: 'object',
      properties: {
        departmentId: { type: 'string' },
        dayOfWeek: { type: 'string' },
        timeSlot: { type: 'string' },
      },
      required: ['departmentId', 'dayOfWeek', 'timeSlot'],
    },
    requiresApproval: false,
    supportsDryRun: true,
    timeoutMs: 5000,
    rateLimit: { requests: 30, windowSeconds: 60 },
    idempotent: true,
    handler: async (input, context) => {
      return {
        candidates: [
          { facultyId: 'fac-prof-joshi', facultyName: 'Prof. R. M. Joshi', workloadMin: 180, isAvailable: true },
          { facultyId: 'fac-dr-desai', facultyName: 'Dr. Ananya Desai', workloadMin: 240, isAvailable: true },
        ],
      };
    },
  },
  {
    key: 'TIMETABLE_ASSIGN_SUBSTITUTE',
    name: 'Assign Timetable Substitute Faculty',
    description: 'Reassigns an active timetable slot to an approved substitute faculty member.',
    version: '1.0.0',
    status: 'ACTIVE',
    category: 'ACADEMIC',
    riskLevel: 'HIGH',
    allowedAgents: ['TIMETABLE_SUBSTITUTION_AGENT'],
    requiredPermissions: ['timetable.write'],
    inputSchema: {
      type: 'object',
      properties: {
        slotId: { type: 'string' },
        substituteFacultyId: { type: 'string' },
      },
      required: ['slotId', 'substituteFacultyId'],
    },
    requiresApproval: true,
    supportsDryRun: true,
    timeoutMs: 5000,
    rateLimit: { requests: 10, windowSeconds: 60 },
    idempotent: true,
    handler: async (input, context) => {
      return {
        success: true,
        slotId: input.slotId,
        substituteFacultyId: input.substituteFacultyId,
        status: 'SUBSTITUTED',
        assignedAt: new Date().toISOString(),
      };
    },
  },
];
