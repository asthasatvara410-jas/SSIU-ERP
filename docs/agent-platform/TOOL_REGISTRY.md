# SSIU ERP — STAGE 6.4: TOOL REGISTRY & SECURE TOOL EXECUTION

---

## 1. Executive Summary & Purpose

Stage 6.4 establishes the enterprise **Tool Registry** and **Secure Tool Execution Engine** for SSIU ERP autonomous agents.

### Core Security Principles:
1. **NO DIRECT DB/SQL ACCESS:** Agents cannot query Prisma or PostgreSQL directly; all domain interactions must go through registered, typed, audited tools.
2. **ZERO CREDENTIAL EXPOSURE:** Secrets, tokens, hashes, and stack traces are redacted before results reach the agent.
3. **MANDATORY CONTEXT & GUARDS:** Every tool execution requires server-verified tenant scope, input schema checks, Policy Engine evaluation, rate limiting, and hard timeout guards.

---

## 2. Secure Tool Execution Pipeline

```
                              [ Agent Invocation ]
                                       │
                                       ▼
                              [ 1. Tool Lookup ]
                                       │
                                       ▼
                       [ 2. Permission & Tenant Check ]
                                       │
                                       ▼
                         [ 3. Policy Engine Check ]
                                       │
                                       ▼
                      [ 4. Approval Engine Validation ]
                                       │
                                       ▼
                         [ 5. Input Schema Check ]
                                       │
                                       ▼
                        [ 6. Rate Limiting Check ]
                                       │
                                       ▼
                         [ 7. Idempotency Check ]
                                       │
                                       ▼
                       [ 8. DRY_RUN Simulation Guard ]
                                       │
                                       ▼
                      [ 9. Handler with Timeout Guard ]
                                       │
                                       ▼
                       [ 10. Output Sanitization ]
                                       │
                                       ▼
                       [ 11. Immutable Audit Logging ]
                                       │
                                       ▼
                         [ Normalized Result Return ]
```

---

## 3. Registered Tool Catalog

| Tool Key | Category | Risk Level | Requires Approval | Timeout | Rate Limit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TIMETABLE_GET` | `ACADEMIC` | `LOW` | `false` | 5000ms | 60 req/min |
| `TIMETABLE_FIND_FREE_FACULTY` | `ACADEMIC` | `LOW` | `false` | 5000ms | 30 req/min |
| `DMS_GET_DOCUMENT` | `DMS` | `LOW` | `false` | 5000ms | 60 req/min |
| `DMS_GET_DOCUMENT_METADATA` | `DMS` | `LOW` | `false` | 5000ms | 60 req/min |
| `FEES_GET_OUTSTANDING` | `FINANCE` | `LOW` | `false` | 5000ms | 60 req/min |
| `NOTIFICATION_SEND` | `COMMUNICATION` | `MEDIUM` | `false` | 5000ms | 10 req/min |
| `STUDENT_GET_PROFILE` | `STUDENT` | `LOW` | `false` | 5000ms | 100 req/min |
