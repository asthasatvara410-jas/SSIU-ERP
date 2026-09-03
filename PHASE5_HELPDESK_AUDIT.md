# SSIU ERP — PHASE 5: UNIFIED HELPDESK & TICKETING AUDIT

**Audit Date:** September 2026  
**Scope:** Frontend Support UI, Backend IT Helpdesk Module, Data Models, Multi-Category Workflows, RBAC & Scopes

---

## 1. Executive Summary
Prior to code implementation, a full repository audit was performed across all ticketing, support, and helpdesk features. The ERP currently maintains two separate paradigms:
1. **Frontend (`SupportTicketsPage.tsx`)**: A multi-category interface (`ACADEMIC`, `HOSTEL`, `FEES`, `INFRASTRUCTURE`, `LIBRARY`, etc.) with message threading and attachments, but operating almost entirely on client-side mock storage (`db.ts` / `localStorage`).
2. **Backend (`backend/src/it-helpdesk/`)**: A functional PostgreSQL-backed module using Prisma `ITTicket` with pagination and search, but historically constrained to IT equipment categories (`PRINTER`, `WIFI`, etc.) and lacking threaded conversations, internal notes, and multi-category routing.

Phase 5 unifies these implementations into a **single canonical Helpdesk/Ticketing system** that preserves existing routes, supports all university categories, enforces RBAC and scope isolation, and eliminates mock data dependencies.

---

## 2. Detailed 19-Point Feature Audit & Classification

| # | Feature Area | Current State & Findings | Classification |
| :--- | :--- | :--- | :--- |
| **1** | **Existing Ticket Modules** | `SupportTicketsPage.tsx` in frontend; `it-helpdesk` in NestJS backend. No shared service layer. | `PARTIAL` |
| **2** | **Existing Frontend Pages** | `SupportTicketsPage.tsx` renders tickets table, search, filters, create modal, details modal, reply thread. | `EXISTS AND WORKS` (UI) |
| **3** | **Existing Backend Endpoints** | `POST /api/v1/it/tickets`, `GET /api/v1/it/tickets`, `GET /api/v1/it/tickets/:id`, `PATCH /:id/assign`, `PATCH /:id/resolve`. | `EXISTS AND WORKS` (API) |
| **4** | **Existing Data Model** | `model ITTicket` in `schema.prisma` with `id`, `ticketNo`, `userId`, `category`, `priority`, `title`, `description`, `assignedTo`, `status`, `resolution`. | `EXISTS AND WORKS` |
| **5** | **Ticket Categories** | Frontend has 9 categories (`ACADEMIC`, `HOSTEL`, `FEES`, `INFRASTRUCTURE`, `EXAMINATION`, `LIBRARY`, `TRANSPORT`, `TECHNICAL`, `OTHER`). Backend schema uses `category: String` (unconstrained). | `PARTIAL` |
| **6** | **Ticket Statuses** | Backend: `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`. Frontend: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`. `WAITING` and `REOPENED` missing. | `NEEDS IMPROVEMENT` |
| **7** | **Ticket Priorities** | `URGENT`, `HIGH`, `NORMAL` / `MEDIUM`, `LOW`. Both frontend and backend support these values. | `EXISTS AND WORKS` |
| **8** | **Assignment Logic** | Backend has `PATCH /:id/assign` assigning `assignedTo` userId. Frontend lets creator choose assigned faculty from dropdown. Needs RBAC scope protection. | `PARTIAL` |
| **9** | **Comments / Messages** | Frontend displays threaded messages in modal (`SupportTicketMessage[]`), but stored only in browser mock `db.ts`. Backend has no message/comment endpoint. | `MOCK ONLY` (Frontend) / `MISSING` (Backend) |
| **10** | **Attachments** | Frontend uses `fileStorage.saveFile()` (base64 mock/local). Backend `ITTicket` has no attachment relation. File authorization required. | `MOCK ONLY` |
| **11** | **Notifications** | `securityAuditService` and generic alerts exist, but no targeted notifications for ticket status change or assignment. | `PARTIAL` |
| **12** | **Pagination** | Server-side pagination (`page`, `limit <= 100`) implemented in Phase 3 on `ItHelpdeskService`. Frontend table has pagination controls. | `EXISTS AND WORKS` |
| **13** | **Search** | Parameterized ORM search implemented in Phase 3 on `ticketNo`, `title`, and `description`. | `EXISTS AND WORKS` |
| **14** | **Filters** | Parameterized filtering on `category`, `status`, and `my` (user tickets) implemented in Phase 3. | `EXISTS AND WORKS` |
| **15** | **RBAC Enforcement** | Guarded by `JwtAuthGuard` and `RbacGuard`. Needs granular permission rules for `STUDENT` (own tickets), `FACULTY`/`STAFF` (assigned), and `ADMIN`. | `NEEDS IMPROVEMENT` |
| **16** | **Scope Rules** | Student restricted to `OWN`, HOD to `DEPARTMENT`, HOI to `INSTITUTE`, Admin to `UNIVERSITY`. Needs strict IDOR guard on ticket detail and comment endpoints. | `NEEDS IMPROVEMENT` |
| **17** | **Audit Logging** | Generic `securityAuditService` in frontend. Backend needs audit logging on ticket status changes, assignment, and internal notes. | `PARTIAL` |
| **18** | **Mock / Local-State Usage** | `SupportTicketsPage.tsx` calls `db.getSupportTickets()`, `db.addEntity()`, `db.updateEntity()`. Must be wired to backend REST API. | `MOCK ONLY` |
| **19** | **Existing Tests** | Phase 3 test suite verifies pagination limits on `GET /api/v1/it/tickets`. No dedicated full-lifecycle Helpdesk test suite exists. | `PARTIAL` |

---

## 3. Consolidation & Unification Plan
1. **Single Backend Core**:
   - Extend `ItHelpdeskService` and `ItHelpdeskController` to act as the canonical university Helpdesk engine.
   - Maintain route compatibility on `/api/v1/it/tickets` while supporting all categories: `ACADEMIC`, `HOSTEL`, `FEES`, `INFRASTRUCTURE`, `IT`, `EXAMINATION`, `LIBRARY`, `TRANSPORT`, `OTHER`.
2. **Threaded Conversations & Internal Notes**:
   - Introduce threaded message support in `ItHelpdeskService`.
   - Distinguish message types: `USER_MESSAGE`, `STAFF_RESPONSE`, `INTERNAL_NOTE`.
   - Enforce backend visibility: `INTERNAL_NOTE` is stripped from responses when queried by student/creator accounts.
3. **Lifecycle & Status Transitions**:
   - Support standard lifecycle: `OPEN` $\to$ `ASSIGNED` $\to$ `IN_PROGRESS` $\to$ `WAITING` $\to$ `RESOLVED` $\to$ `CLOSED` $\to$ `REOPENED`.
   - RBAC validation on each transition (e.g. students cannot arbitrarily close or assign tickets).
4. **Scope & IDOR Defense**:
   - Ensure Student A cannot access Student B's tickets via direct ID manipulation (HTTP 403).
   - Ensure HOD/HOI access conforms to departmental/institutional scopes.
5. **Frontend Integration**:
   - Wire `SupportTicketsPage.tsx` to communicate with the canonical backend API, replacing `db.getSupportTickets()` with asynchronous fetch requests while preserving all existing visual components and table layouts.
6. **Database Schema Safety**:
   - Zero schema alterations. Zero Prisma migrations. Store thread state in service layer, and document dedicated relational models in `FUTURE_HELPDESK_DATABASE_REQUIREMENTS.md`.
