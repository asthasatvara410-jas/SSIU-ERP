# SSIU ERP — STAGE 6.2: EVENT BUS & TRIGGER SYSTEM

---

## 1. Executive Summary & Purpose

Stage 6.2 establishes the enterprise **Event Bus & Trigger System** inside SSIU ERP. It connects existing ERP domain modules (Academics, DMS, Finance, Examinations, and Schedulers) with the Agent Runtime without bypassing security, RBAC, tenant isolation, or data boundaries.

---

## 2. Event Bus & Trigger Architecture

```
                    ┌─────────────────────────┐
                    │  Domain Modules & Cron  │
                    │ (Academics, DMS, Fees)  │
                    └────────────┬────────────┘
                                 │ publish(event)
                                 ▼
                    ┌─────────────────────────┐
                    │     EventBusService     │
                    │ (Validation & Audit Log)│
                    └────────────┬────────────┘
                                 │
               ┌─────────────────┴─────────────────┐
               ▼                                   ▼
   ┌───────────────────────┐           ┌───────────────────────┐
   │EventIdempotencyService│           │EventDispatcherService │
   │(Deduplication Filter) │           │(Scope & Trigger Match)│
   └───────────────────────┘           └───────────┬───────────┘
                                                   │
                                                   ▼
                                       ┌───────────────────────┐
                                       │TriggerRegistryService │
                                       │(Event ➔ Agent Mapping)│
                                       └───────────┬───────────┘
                                                   │
                                                   ▼
                                       ┌───────────────────────┐
                                       │ Agent Execution Eng.  │
                                       │ (Stage 6.1 Runtime)   │
                                       └───────────────────────┘
```

---

## 3. Core Components

1. **Strongly Typed Event Schema (`ERPEvent`)**:
   - `eventId`, `eventType`, `tenantId`, `institutionId`, `actorId`, `sourceModule`, `entityType`, `entityId`, `payload`, `timestamp`, `correlationId`, `idempotencyKey`.
2. **Event Bus Service (`EventBusService`)**:
   - Manages asynchronous event ingestion, subscription handling, and dispatch pipelines.
3. **Event Idempotency Service (`EventIdempotencyService`)**:
   - Enforces single-execution guarantees across duplicate webhooks, worker restarts, or scheduler firings.
4. **Trigger Registry (`TriggerRegistryService`)**:
   - Maps incoming events to agent keys with tenant scoping and priority queues:
     - `FACULTY_ABSENCE_REPORTED` ➔ `TIMETABLE_SUBSTITUTION_AGENT`
     - `DOCUMENT_UPLOADED` ➔ `DOCUMENT_VERIFICATION_AGENT`
     - `FEE_OVERDUE` ➔ `FEE_RECOVERY_AGENT`
5. **Event Dispatcher (`EventDispatcherService`)**:
   - Resolves matching triggers, validates tenant boundaries, and forwards events to `AgentExecutionService`.
6. **Scheduler Integration**:
   - Scheduled tasks publish typed events directly to `EventBusService`.

---

## 4. Tenant Isolation & Security Guarantees

* **Tenant Boundary Protection:** An event with `tenantId: 'INSTITUTE_A'` is strictly quarantined. The `EventDispatcherService` will never forward an event to an agent scoped to `INSTITUTE_B`.
* **Zero Credential Exposure:** Event payloads and metadata are sanitized before audit logging.
* **Audit Lifecycle Events:** `EVENT_PUBLISHED`, `EVENT_DISPATCHED`, `EVENT_REJECTED`, `EVENT_COMPLETED`.
