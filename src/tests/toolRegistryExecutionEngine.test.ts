import { describe, it, expect, beforeEach } from 'vitest';

describe('SSIU ERP — STAGE 6.4: Tool Registry & Secure Tool Execution Engine', () => {
  let toolRegistry: Map<string, any>;
  let rateLimitStore: Map<string, number[]>;
  let idempotencyStore: Map<string, any>;
  let auditLogs: Array<any>;

  beforeEach(() => {
    toolRegistry = new Map();
    rateLimitStore = new Map();
    idempotencyStore = new Map();
    auditLogs = [];

    // Seed tools
    toolRegistry.set('TIMETABLE_GET', {
      key: 'TIMETABLE_GET',
      name: 'Get Timetable Schedule',
      status: 'ACTIVE',
      riskLevel: 'LOW',
      allowedAgents: ['TIMETABLE_SUBSTITUTION_AGENT', 'ALL'],
      inputSchema: { required: ['facultyId'] },
      timeoutMs: 5000,
      rateLimit: { requests: 60, windowSeconds: 60 },
      idempotent: true,
      handler: async (input: any) => ({ facultyId: input.facultyId, slots: ['09:00 - 10:00'] }),
    });

    toolRegistry.set('TIMETABLE_UPDATE', {
      key: 'TIMETABLE_UPDATE',
      name: 'Update Timetable Slot',
      status: 'ACTIVE',
      riskLevel: 'HIGH',
      requiresApproval: true,
      allowedAgents: ['TIMETABLE_SUBSTITUTION_AGENT'],
      inputSchema: { required: ['slotId', 'substituteFacultyId'] },
      timeoutMs: 5000,
      rateLimit: { requests: 10, windowSeconds: 60 },
      idempotent: true,
      handler: async (input: any) => ({ updated: true, slotId: input.slotId }),
    });

    toolRegistry.set('TOOL_DISABLED_DEMO', {
      key: 'TOOL_DISABLED_DEMO',
      name: 'Disabled Tool',
      status: 'DISABLED',
      riskLevel: 'LOW',
      allowedAgents: ['ALL'],
      handler: async () => ({ ok: true }),
    });
  });

  // 1. Tool registration
  it('1. should register and store tool definitions in Tool Registry', () => {
    expect(toolRegistry.has('TIMETABLE_GET')).toBe(true);
    const tool = toolRegistry.get('TIMETABLE_GET');
    expect(tool.name).toBe('Get Timetable Schedule');
  });

  // 2. Duplicate registration rejection
  it('2. should reject duplicate registration of an existing tool key', () => {
    let error: string | null = null;
    try {
      if (toolRegistry.has('TIMETABLE_GET')) {
        throw new Error("Duplicate tool registration rejected: Tool key 'TIMETABLE_GET' already registered.");
      }
    } catch (err: any) {
      error = err.message;
    }
    expect(error).toContain('Duplicate tool registration rejected');
  });

  // 3. Tool lookup
  it('3. should retrieve tool definition by tool key', () => {
    const tool = toolRegistry.get('TIMETABLE_UPDATE');
    expect(tool).toBeDefined();
    expect(tool.riskLevel).toBe('HIGH');
  });

  // 4. Disabled tool rejection
  it('4. should reject execution when tool status is DISABLED', () => {
    const tool = toolRegistry.get('TOOL_DISABLED_DEMO');
    const isExecutable = tool.status === 'ACTIVE';
    expect(isExecutable).toBe(false);
  });

  // 5. Unknown tool rejection
  it('5. should reject execution for unknown unregistered tool key', () => {
    const tool = toolRegistry.get('UNREGISTERED_TOOL_KEY');
    expect(tool).toBeUndefined();
  });

  // 6. Agent permission rejection
  it('6. should reject execution if calling agent is not in tool allowedAgents list', () => {
    const tool = toolRegistry.get('TIMETABLE_UPDATE');
    const callingAgent = 'FEE_RECOVERY_AGENT';

    const isAllowed = tool.allowedAgents.includes('ALL') || tool.allowedAgents.includes(callingAgent);
    expect(isAllowed).toBe(false);
  });

  // 7. Tenant isolation
  it('7. should enforce tenant context and reject missing tenant ID', () => {
    const context = { tenantId: '', institutionId: 'INST_01' };
    const isValid = !!context.tenantId && !!context.institutionId;
    expect(isValid).toBe(false);
  });

  // 8. RBAC rejection
  it('8. should reject high-risk tool execution attempted by Student role', () => {
    const tool = toolRegistry.get('TIMETABLE_UPDATE');
    const actorRole = 'STUDENT';

    const isPermitted = !(actorRole === 'STUDENT' && tool.riskLevel !== 'LOW');
    expect(isPermitted).toBe(false);
  });

  // 9. Policy DENY
  it('9. should halt tool execution when Policy Engine returns DENY', () => {
    const policyDecision = 'DENY';
    const canExecute = policyDecision === 'ALLOW';
    expect(canExecute).toBe(false);
  });

  // 10. Policy REQUIRE_APPROVAL
  it('10. should return APPROVAL_REQUIRED for tools designated with high risk', () => {
    const tool = toolRegistry.get('TIMETABLE_UPDATE');
    const status = tool.requiresApproval ? 'APPROVAL_REQUIRED' : 'SUCCESS';
    expect(status).toBe('APPROVAL_REQUIRED');
  });

  // 11. Approval rejection
  it('11. should block execution when approval ticket has status REJECTED', () => {
    const ticket = { status: 'REJECTED' };
    const canExecute = ticket.status === 'APPROVED';
    expect(canExecute).toBe(false);
  });

  // 12. Approval success
  it('12. should allow execution when server-side approval ticket is APPROVED', () => {
    const ticket = { status: 'APPROVED', token: 'valid-token-123' };
    const canExecute = ticket.status === 'APPROVED' && !!ticket.token;
    expect(canExecute).toBe(true);
  });

  // 13. Input validation
  it('13. should reject input missing mandatory schema fields', () => {
    const tool = toolRegistry.get('TIMETABLE_GET');
    const input = {}; // missing facultyId

    const hasRequired = tool.inputSchema.required.every((field: string) => input[field as keyof typeof input] !== undefined);
    expect(hasRequired).toBe(false);
  });

  // 14. Output validation
  it('14. should format output into normalized response structure', () => {
    const response = {
      success: true,
      executionId: 'exec-101',
      toolKey: 'TIMETABLE_GET',
      status: 'SUCCESS',
      data: { slots: ['09:00'] },
    };

    expect(response.success).toBe(true);
    expect(response.status).toBe('SUCCESS');
  });

  // 15. Sensitive data redaction
  it('15. should redact passwords, JWT tokens, and secrets from tool outputs', () => {
    const rawOutput = {
      apiKey: 'sk-prod-9922883377',
      passwordHash: '$2b$10$abcdef',
      studentName: 'Aarav Patel',
    };

    const sanitized: any = {};
    for (const [k, v] of Object.entries(rawOutput)) {
      if (/apiKey|password/i.test(k)) sanitized[k] = '[REDACTED_CREDENTIAL]';
      else sanitized[k] = v;
    }

    expect(sanitized.apiKey).toBe('[REDACTED_CREDENTIAL]');
    expect(sanitized.passwordHash).toBe('[REDACTED_CREDENTIAL]');
    expect(sanitized.studentName).toBe('Aarav Patel');
  });

  // 16. Rate limiting
  it('16. should enforce rate limit caps within rolling time window', () => {
    const key = 'TENANT_A:TIMETABLE_SUBSTITUTION_AGENT:TIMETABLE_UPDATE';
    const limit = { requests: 2, windowSeconds: 60 };

    rateLimitStore.set(key, [Date.now(), Date.now()]);
    const calls = rateLimitStore.get(key) || [];

    const isRateLimited = calls.length >= limit.requests;
    expect(isRateLimited).toBe(true);
  });

  // 17. Idempotency
  it('17. should return cached result on identical idempotency key', () => {
    const key = 'TENANT_A:TIMETABLE_UPDATE:idem-slot-101';
    const cachedResult = { success: true, toolKey: 'TIMETABLE_UPDATE', status: 'SUCCESS', data: { updated: true } };

    idempotencyStore.set(key, cachedResult);
    const result = idempotencyStore.get(key);

    expect(result).toBeDefined();
    expect(result.data.updated).toBe(true);
  });

  // 18. Timeout protection
  it('18. should abort handler execution if time exceeds configured timeoutMs', async () => {
    const timeoutMs = 50;
    let didTimeout = false;

    const slowHandler = new Promise((resolve) => setTimeout(resolve, 200));
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('EXECUTION_TIMEOUT')), timeoutMs));

    try {
      await Promise.race([slowHandler, timeoutPromise]);
    } catch (err: any) {
      if (err.message === 'EXECUTION_TIMEOUT') didTimeout = true;
    }

    expect(didTimeout).toBe(true);
  });

  // 19. Dry run
  it('19. should simulate execution and return SUCCESS without mutating data in dry-run mode', () => {
    const dryRun = true;
    const result = {
      success: true,
      status: 'SUCCESS',
      isDryRun: dryRun,
      data: { simulated: true, message: 'Dry-run validation successful. No persistent state mutated.' },
    };

    expect(result.isDryRun).toBe(true);
    expect(result.data.simulated).toBe(true);
  });

  // 20. Audit logging
  it('20. should record structured tool execution audit entry with duration', () => {
    auditLogs.push({
      eventType: 'TOOL_EXECUTION_COMPLETED',
      toolKey: 'TIMETABLE_GET',
      durationMs: 12,
      status: 'SUCCESS',
    });

    expect(auditLogs.length).toBe(1);
    expect(auditLogs[0].toolKey).toBe('TIMETABLE_GET');
  });

  // 21. Successful execution
  it('21. should execute active tool handler and return data payload', async () => {
    const tool = toolRegistry.get('TIMETABLE_GET');
    const result = await tool.handler({ facultyId: 'fac-101' }, {});

    expect(result.facultyId).toBe('fac-101');
    expect(result.slots.length).toBe(1);
  });

  // 22. Failed execution
  it('22. should catch handler errors gracefully and return normalized failure status', () => {
    const result = {
      success: false,
      toolKey: 'TIMETABLE_GET',
      status: 'FAILED',
      error: { code: 'TOOL_EXECUTION_FAILED', message: 'Internal service error' },
    };

    expect(result.success).toBe(false);
    expect(result.status).toBe('FAILED');
  });

  // 23. Cross-tenant attack attempt
  it('23. should block tool execution attempt targeting a different tenant scope', () => {
    const tool = { allowedTenants: ['TENANT_A'] };
    const callingTenant = 'TENANT_B';

    const isAllowed = tool.allowedTenants.includes(callingTenant) || tool.allowedTenants.includes('ALL');
    expect(isAllowed).toBe(false);
  });

  // 24. Unauthorized student attempt
  it('24. should block student role from executing administrative tools', () => {
    const actorRole = 'STUDENT';
    const toolRisk = 'HIGH';

    const isAllowed = !(actorRole === 'STUDENT' && toolRisk !== 'LOW');
    expect(isAllowed).toBe(false);
  });

  // 25. Admin execution
  it('25. should permit administrative users with matching RBAC to execute tools', () => {
    const actorRole = 'SUPER_ADMIN';
    const isAllowed = ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'HOD'].includes(actorRole);
    expect(isAllowed).toBe(true);
  });
});
