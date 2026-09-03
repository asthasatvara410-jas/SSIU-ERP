# SSIU ERP — STAGE 6.5: AUTONOMOUS ERP AGENTS ARCHITECTURE

---

## 1. Executive Summary & Purpose

Stage 6.5 introduces the first three production autonomous ERP agents operating on top of the Stage 6.1–6.4 foundation:
1. **`TIMETABLE_SUBSTITUTION_AGENT` (Academic Operations)**
2. **`DOCUMENT_VERIFIER_AGENT` (DMS Operations)**
3. **`FEE_RECOVERY_AGENT` (Finance Operations)**

---

## 2. Autonomous Agents Overview

### Agent 1: Timetable Substitution Agent
* **Triggers:** `FACULTY_ABSENCE_REPORTED`, `FACULTY_UNAVAILABLE`, `FACULTY_LEAVE_CREATED`.
* **Workflow:**
  1. Detect affected timetable slots using `TIMETABLE_GET`.
  2. Search available peer faculty using `TIMETABLE_FIND_FREE_FACULTY`.
  3. Deterministically rank candidates based on department match, subject domain match, zero lecture clash, and daily workload limits (<= 360 min).
  4. Evaluate policy (`UPDATE_TIMETABLE`).
  5. If approval required ➔ generate HOD approval ticket.
  6. When authorized ➔ execute `TIMETABLE_ASSIGN_SUBSTITUTE`, notify substitute and students via `NOTIFICATION_SEND`, and audit log.

### Agent 2: Smart Document Verifier Agent
* **Triggers:** `DOCUMENT_UPLOADED`, `DMS_DOCUMENT_UPLOADED`, `DOCUMENT_READY_FOR_VERIFICATION`.
* **Workflow:**
  1. Retrieve uploaded document metadata using `DMS_GET_DOCUMENT` and `DMS_GET_DOCUMENT_METADATA`.
  2. Cross-verify OCR extracted fields against student database records using `STUDENT_GET_PROFILE`.
  3. Compute deterministic verification score:
     - High Confidence ($\ge 95\%$ with exact name & enrollment match) ➔ `AUTO_APPROVE` (if permitted by policy).
     - Review Required ($80\% - 94\%$) ➔ Create review ticket for Student Section.
     - Low Confidence ($< 80\%$ or mismatch) ➔ `REJECT` with specific discrepancy list.
  4. Upon verification ➔ execute `DMS_VERIFY_DOCUMENT`, notify student, and audit log.

### Agent 3: Proactive Fee Recovery Agent
* **Triggers:** `FEE_OVERDUE`, `FEE_DUE_SOON`, `PAYMENT_PLAN_REQUESTED`, `STUDENT_PAYMENT_NEGOTIATION`.
* **Workflow:**
  1. Query outstanding student balance using `FEES_GET_OUTSTANDING`.
  2. Dispatch personalized payment reminder via in-app notification.
  3. Controlled State Machine: `INITIATED` ➔ `REMINDER_SENT` ➔ `STUDENT_RESPONDED` ➔ `PAYMENT_PROPOSED` ➔ `VALIDATING_PLAN` ➔ `APPROVAL_REQUIRED` ➔ `PLAN_CREATED` ➔ `PAYMENT_PENDING` ➔ `PAYMENT_CONFIRMED`.
  4. Enforce strict financial limits: Minimum down payment $\ge 30\%$, maximum installments $\le 3$, zero waivers or unauthorized discounts.
  5. Multi-approval required: Finance Officer + Registrar.
  6. Invariant: Receipts generated only upon verified payment confirmation, never on a promise to pay.

---

## 3. Operational Safety Invariants

1. **Deterministic Application Authority:** The LLM assists with natural-language parsing and explanation, but deterministic code enforces permissions, limits, and mutations.
2. **DRY_RUN Mode:** All agents support `dryRun = true` for safe end-to-end simulation.
3. **Event Loop Protection:** Causation IDs and deduplication keys prevent recursive self-triggering loops.
