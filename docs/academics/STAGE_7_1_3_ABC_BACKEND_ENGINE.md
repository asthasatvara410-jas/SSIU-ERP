# SSIU ERP — STAGE 7.1.3: ABC BACKEND APIS & ACADEMIC CREDIT CALCULATION ENGINE

---

## 1. Executive Summary & Purpose

Stage 7.1.3 implements the production backend APIs and academic credit calculation engine for the **Academic Bank of Credits (ABC) & NEP 2020 Compliance Platform** within SSIU ERP.

```
================================================================================
STAGE 7.1.3 STATUS: COMPLETE & PRODUCTION VERIFIED
ABC BACKEND APIS: OPERATIONAL & RBAC PROTECTED
CREDIT CALCULATION ENGINE: IDEMPOTENT & TRANSACTION-SAFE
NATIONAL ADAPTER: AIR-GAPPED SAFE PLACEHOLDER (NOT_CONFIGURED)
================================================================================
```

---

## 2. Architecture & Service Components

```
                             [ Authenticated Request ]
                                         │
                                         ▼
                            [ Controller / RBAC Guard ]
                                         │
                                         ▼
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
         [ Student Endpoint ]                         [ Admin Endpoint ]
         (Scoped to req.user)                     (Scoped to authorized tenant)
                    │                                         │
                    └────────────────────┬────────────────────┘
                                         │
                                         ▼
                              [ AbcValidatorService ]
                           (Normalize 12-digit ABC ID)
                                         │
                                         ▼
                     [ AcademicCreditCalculationService ]
                     (Evaluates pass criteria idempotently)
                                         │
                                         ▼
                              [ AbcSyncService ]
                                         │
                                         ▼
                        [ SafePlaceholderABCAdapter ]
                           (Returns NOT_CONFIGURED)
                                         │
                                         ▼
                         [ Immutable Audit & Sync Log ]
```

---

## 3. Credit Calculation & Idempotency Rules

1. **Course Completion Rule:** A course is marked as `EARNED` if and only if:
   - `isPassed === true` AND
   - `grade` is not `F`, `AB` (Absent), or `NA`.
2. **Idempotency Strategy:**
   - Database composite unique key `@@unique([studentId, courseCode, academicYear])` in `AcademicCreditLedger`.
   - Running `calculateAndSyncLedger` concurrently or sequentially produces identical balances without duplicate entries or multi-awarding.
3. **Transaction Safety:**
   - Full execution wrapped in Prisma `$transaction` ensuring all-or-nothing ledger consistency.

---

## 4. Endpoints Implemented

| Method | Endpoint | RBAC Guard | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/abc/me` | `STUDENT` | Authenticated student's ABC profile and credits. |
| `GET` | `/api/v1/abc/me/credits` | `STUDENT` | Itemized course breakdown and semester summaries. |
| `GET` | `/api/v1/abc/students` | Admin / Mentor | Searchable, paginated student ABC compliance list. |
| `GET` | `/api/v1/abc/students/:studentId` | Admin / Mentor | Single student profile with IDOR peer protection. |
| `POST` | `/api/v1/abc/students/:studentId/link` | Student / Admin | Links and normalizes ABC ID with duplicate rejection. |
| `POST` | `/api/v1/abc/students/:studentId/verify` | Mentor / Admin | Institutional verification and locking of ABC ID. |
| `POST` | `/api/v1/abc/students/:studentId/sync` | Registrar / Admin | Triggers credit sync with DigiLocker gateway. |
| `POST` | `/api/v1/abc/sync/retry` | Registrar / Admin | Retries failed gateway synchronization attempts. |
