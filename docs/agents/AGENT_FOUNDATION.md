# SSIU ERP — Enterprise Agent Foundation & Autonomous Infrastructure (Stage 6.1)

---

## 1. Executive Summary & Purpose

The **SSIU ERP Agent Foundation** provides the unified, multi-tenant, secure autonomous execution layer for institutional automation. It governs all automated processes across Academics, Document Management, Examinations, and Finance.

### Core Invariants:
1. **Zero Raw SQL Access:** AI Agents and Handlers NEVER execute raw SQL queries or bypass the Prisma/service layer.
2. **Explicit Tool & Permission Matrix:** Every automated action must pass through an authorized, typed tool validated against granular permission scopes.
3. **Institutional Boundary Enforcement:** Every operation carries `tenantId` / `institutionId`. Cross-tenant mutations are strictly blocked.
4. **Idempotency Protection:** Every execution enforces deduplication on `idempotencyKey` to guarantee zero duplicate financial or academic mutations.
5. **Zero Credential Leakage:** Sensitive parameters (passwords, JWT secrets, payment tokens) are automatically redacted prior to audit persistence.
6. **Global Kill Switch:** `AGENT_SYSTEM_ENABLED=false` or `AGENTS_ENABLED=false` immediately halts all autonomous processes safely without disrupting standard ERP operations.

---

## 2. Platform Architecture

```
                                  [ ERP Event / Webhook / Cron ]
                                                │
                                                ▼
                                    ┌──────────────────────┐
                                    │   Agent Event Bus    │
                                    │ (Idempotency Filter) │
                                    └──────────┬───────────┘
                                                │
                                                ▼
                                    ┌──────────────────────┐
                                    │  Agent Orchestrator  │
                                    └──────────┬───────────┘
                                                │
               ┌────────────────────────────────┴────────────────────────────────┐
               ▼                                                                 ▼
   ┌───────────────────────┐                                         ┌───────────────────────┐
   │ Agent Registry & Mode │                                         │ Central Policy Engine │
   │ (LIVE / DRY_RUN / OFF)│                                         │ (Rule Checks / Limits)│
   └───────────┬───────────┘                                         └───────────┬───────────┘
               │                                                                 │
               └────────────────────────────────┬────────────────────────────────┘
                                                │
                                                ▼
                                    ┌──────────────────────┐
                                    │ Agent Execution Eng. │
                                    │ (Retry & Sandbox)    │
                                    └──────────┬───────────┘
                                                │
               ┌────────────────────────────────┴────────────────────────────────┐
               ▼                                                                 ▼
   ┌───────────────────────┐                                         ┌───────────────────────┐
   │  Human-in-the-Loop    │                                         │ Domain Service Layer  │
   │  Approval Queue       │                                         │ (Transactional DB)    │
   └───────────────────────┘                                         └───────────┬───────────┘
                                                                                 │
                                                                                 ▼
                                                                     ┌───────────────────────┐
                                                                     │ Multi-Channel Comms & │
                                                                     │ Immutable Audit Log   │
                                                                     └───────────────────────┘
```

---

## 3. Agent Lifecycle & States

Every registered agent has a defined lifecycle state stored in `Agent.status`:

| Status | Execution Behavior | Description |
| :--- | :--- | :--- |
| `DRAFT` | **REFUSED** | Newly created agent configuration under developer construction. |
| `ACTIVE` | **PERMITTED** | Fully tested and operational in either `LIVE` or `DRY_RUN` mode. |
| `PAUSED` | **REFUSED** | Temporarily paused by Administrator; event triggers queued without mutation. |
| `DISABLED` | **REFUSED** | Decommissioned or pending business logic implementation. |
| `ERROR` | **REFUSED** | System quarantined due to consecutive operational or policy violations. |

---

## 4. Planned Initial Agents (Stage 6.1 Status: Foundation Ready)

The following three core agents are registered in the foundation with status `DISABLED` / `NOT_IMPLEMENTED`:

1. **`TIMETABLE_SUBSTITUTION` (Autonomous Timetable & Faculty Substitution Agent)**
   * **Category:** `ACADEMIC`
   * **Purpose:** Detects faculty absence, computes peer faculty workload rankings, and reassigns lecture slots.
   * **Status in 6.1:** Foundation Ready (`DISABLED`).

2. **`DOCUMENT_VERIFIER` (Smart Document Verifier & Processor Agent)**
   * **Category:** `DMS`
   * **Purpose:** OCR entity extraction and cross-matching against student master records (`≥ 95%` auto-verified).
   * **Status in 6.1:** Foundation Ready (`DISABLED`).

3. **`FEE_RECOVERY` (Proactive Fee Recovery & EMI Agent)**
   * **Category:** `FINANCE`
   * **Purpose:** Conversational payment negotiation and strict compliant installment schedules (max 3 installments, ≥ 30% down payment, 0 discounts).
   * **Status in 6.1:** Foundation Ready (`DISABLED`).

---

## 5. How Developers Create a New Agent

To register a new autonomous agent in SSIU ERP, follow this 4-step pattern:

### Step 1: Define the Agent Handler
Implement the `AgentHandler` interface in `backend/src/agent-platform/agents/`:

```typescript
import { Injectable } from '@nestjs/common';
import { AgentHandler, AgentContext, AgentExecutionResult } from '../types/agent.types';

@Injectable()
export class ExamSeatingArrangementAgent implements AgentHandler {
  readonly key = 'EXAM_SEATING_ARRANGEMENT';
  readonly version = '1.0.0';
  readonly name = 'Exam Seating Arrangement Agent';
  readonly description = 'Autonomous conflict-free hall allocation for university examinations.';
  readonly category = 'ACADEMIC';

  async validate(context: AgentContext): Promise<boolean> {
    return Boolean(context.payload.examScheduleId);
  }

  async canExecute(context: AgentContext): Promise<boolean> {
    return context.triggerType === 'EXAM_TIMETABLE_FINALIZED';
  }

  async execute(context: AgentContext): Promise<AgentExecutionResult> {
    // 1. Tool execution through AgentToolRegistryService
    // 2. Policy evaluation through AgentPolicyEngineService
    // 3. Return structured execution result
    return {
      executionId: context.executionId,
      agentKey: this.key,
      institutionId: context.institutionId,
      mode: context.mode,
      status: 'SUCCESS',
      decisionSummary: 'Seating arrangements generated for 480 candidates.',
      actionsExecuted: [],
      durationMs: 45,
    };
  }
}
```

### Step 2: Register in Agent Registry
Inject `AgentRegistryService` and register the handler on module initialization:

```typescript
constructor(
  private readonly registry: AgentRegistryService,
  private readonly seatingAgent: ExamSeatingArrangementAgent,
) {}

onModuleInit() {
  this.registry.register('EXAM_SEATING_ARRANGEMENT', this.seatingAgent);
}
```

### Step 3: Define Permissions & Policies
Add corresponding permission strings to `AgentPermissionEngineService` and constraint rules in `AgentPolicyEngineService`.

### Step 4: Add Automated Verification Test
Add integration tests in `src/tests/` verifying handler execution, policy checks, and dry-run guarantees.

---

## 6. Security, RBAC & Audit Matrix

- **Administrative Endpoints:** Protected by `JwtAuthGuard` and restricted to `SUPER_ADMIN`, `UNIVERSITY_ADMIN`, `REGISTRAR`, and authorized departmental heads.
- **Audit Logs:** Stored in `AgentAuditLog` with actor type, correlation ID, execution duration, and sanitized parameters.
