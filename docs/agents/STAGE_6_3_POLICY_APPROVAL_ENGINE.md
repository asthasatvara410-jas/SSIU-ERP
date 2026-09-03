# SSIU ERP — STAGE 6.3: POLICY ENGINE + APPROVAL ENGINE

---

## 1. Executive Summary & Purpose

Stage 6.3 delivers the enterprise **Policy Engine** and **Approval Engine** for SSIU ERP autonomous agents.

### Fundamental Safety Invariant:
* **DEFAULT DENY**: If an action is not explicitly permitted by a valid, active server policy ➔ **DENIED**.
* **LLM IS NOT THE AUTHORIZER**: AI recommendations are treated as untrusted proposals. All authorization decisions are computed deterministically server-side.

---

## 2. Policy Precedence & Evaluation Architecture

```
                       [ Incoming Action Request ]
                                    │
                                    ▼
                     [ 1. Prohibited Critical Action? ] ──── YES ───► [ HARD DENY ]
                                    │ NO
                                    ▼
                     [ 2. Cross-Tenant Mismatch? ] ───────── YES ───► [ HARD DENY ]
                                    │ NO
                                    ▼
                     [ 3. Explicit DENY Rule? ] ──────────── YES ───► [ EXPLICIT DENY ]
                                    │ NO
                                    ▼
                     [ 4. Explicit ALLOW Rule? ]
                            ┌───────┴───────┐
                           YES              NO
                            │               │
                  [ Approval Required? ]    ▼
                     ┌──────┴──────┐   [ DEFAULT DENY ]
                    YES            NO
                     │             │
                     ▼             ▼
             [ REQUIRES_APP ]   [ ALLOW ]
```

---

## 3. Risk Levels & Approval Modes

| Risk Level | Operations | Default Policy Effect | Approval Mode |
| :--- | :--- | :--- | :--- |
| **LOW** | Read-only ERP queries, timetable viewing, report generation | `ALLOW` | `NONE` |
| **MEDIUM** | Draft notifications, timetable suggestions, payment proposals | `ALLOW` | `NONE` (Draft Only) |
| **HIGH** | Timetable mutations, document verification approval, EMI plan creation | `REQUIRES_APPROVAL` | `SINGLE_APPROVAL` / `ROLE_APPROVAL` |
| **CRITICAL** | Permanent student deletions, financial waivers, RBAC changes | `DENY` | Hard Prohibited |

---

## 4. Multi-Approval & Pre-Execution Revalidation

1. **Multi-Approval Support:** For high-value operations (e.g. creating installment payment plans), policy mandates multiple distinct reviewers (`requiredApprovals >= 2`).
2. **Pre-Execution Revalidation:** When an approval is granted, the engine re-checks tenant scope, agent status, underlying policy validity, and expiration time before allowing tool execution.
3. **DRY_RUN Mode Enforcement:** In dry-run mode, mutations are intercepted and rejected from modifying production records.
