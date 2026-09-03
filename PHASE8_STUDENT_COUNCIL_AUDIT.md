# SSIU ERP — PHASE 8: STUDENT COUNCIL DESK
## COMPREHENSIVE ARCHITECTURAL AUDIT & IMPLEMENTATION STRATEGY

**Date**: September 2026  
**Status**: AUDIT COMPLETED — ZERO SCHEMA MIGRATIONS REQUIRED  
**Objective**: Build a production-grade, secure, multi-tenant Student Council Desk for Swarrnim Startup & Innovation University (SSIU), supporting Council Directories, Office Bearers, Clubs/Committees, Membership Management, Meeting/MoM Lifecycle, Event Proposals, and Executive Dashboard.

---

## 1. Executive Findings

1. **Existing Database Entity Reuse**:
   - PostgreSQL already contains active, managed Prisma tables:
     - `Committee` (id, code, name, committeeType, chairperson, secretary, status, createdAt)
     - `CommitteeMember` (id, committeeId, userId, memberName, role, joinedAt)
     - `CommitteeMeeting` (id, meetingNo, committeeId, meetingDate, venue, agenda, minutes, status)
     - `CommitteeActionItem` (id, meetingId, itemNumber, description, responsibleDepartment, responsiblePerson, deadline, status, complianceRemarks, completedAt)
     - `StatutoryApproval` (id, requestNo, title, category, applicantEntity, instituteId, departmentId, submittedDate, status, actionedByUserId, actionedByName, actionedAt, remarks)
   - These models have 0 records currently and are completely unencumbered.
   - **Conclusion**: We can map 100% of Phase 8 requirements directly to these existing tables. **Zero schema modifications and zero Prisma migrations are necessary.**

2. **Existing Frontend Modules**:
   - `src/pages/campus/EventsPage.tsx`: Existing events catalog with PDF circular downloads, RSVP toggling, and event cards.
   - `src/constants/navigationConfig.ts`: Sidebar navigation structure with role-based visibility.
   - Reusable UI elements: `ExcelTable`, `Badge`, `Modal`, `StatCard`, search and filter components.

3. **RBAC & Authorization Hierarchy**:
   - `SUPER_ADMIN` / `SYSTEM_ADMIN`: Global cross-campus management.
   - `UNIVERSITY_ADMIN` / `REGISTRAR` / `VICE_PRESIDENT`: Full university student council oversight.
   - `PRINCIPAL` / `HOI`: Restricted to own `instituteId`.
   - `FACULTY_COORDINATOR` / `HOD`: Restricted to assigned council/club and department.
   - `STUDENT`: Permitted to view published councils, active clubs, published MoMs, and submit event proposals or join requests; strictly **forbidden** from administrative council updates, member assignments, or proposal self-approvals (HTTP 403).

---

## 2. Capability Mapping Matrix

| Functional Requirement | Existing Model / Infrastructure | Implementation Strategy |
| :--- | :--- | :--- |
| **A. Council Directory** | `model Committee` (`committeeType: 'STUDENT_COUNCIL'`) | Stores Council code, name, academic year, campus, chairperson (Faculty Coordinator), secretary (General Secretary), and status (`ACTIVE`/`INACTIVE`). |
| **B. Office Bearers** | `model CommitteeMember` | Maps student/faculty members to executive roles (`PRESIDENT`, `VICE_PRESIDENT`, `GENERAL_SECRETARY`, `JOINT_SECRETARY`, `TREASURER`, `FACULTY_COORDINATOR`). Enforces single active holder per executive post. |
| **C. Clubs & Committees** | `model Committee` (`committeeType: 'STUDENT_CLUB'`, `'TECHNICAL_CLUB'`, `'CULTURAL_CLUB'`, etc.) | Categorizes and tracks student organizations, faculty coordinators, and active status. |
| **D. Membership Management** | `model CommitteeMember` (`role: 'MEMBER'`, `'COORDINATOR'`) | Enforces unique active membership per student per club, tracks joining date, and blocks cross-institute tampering. |
| **E. Meetings & MoM** | `model CommitteeMeeting` + `model CommitteeActionItem` | Full meeting lifecycle: `DRAFT` $\to$ `SUBMITTED` $\to$ `UNDER_REVIEW` $\to$ `APPROVED` $\to$ `PUBLISHED`. Tracks action items, deadlines, and responsible assignees. Unpublished records hidden from students. |
| **F. Event Proposals** | `model StatutoryApproval` (`category: 'STUDENT_EVENT_PROPOSAL'`) | Lifecycle: `DRAFT` $\to$ `SUBMITTED` $\to$ `FACULTY_REVIEW` $\to$ `COUNCIL_REVIEW` $\to$ `APPROVED` $\to$ `REJECTED` $\to$ `COMPLETED`. Approved events sync with `EventsPage.tsx`. Self-approval strictly blocked. |
| **G. Council Dashboard** | Server-side aggregations via `StudentCouncilService` | Returns active councils, active clubs, office bearers, total members, upcoming events, pending proposals, pending MoMs, and action items. |

---

## 3. Database Safety Confirmation

- **Modifications to `backend/prisma/schema.prisma`**: **None** (0 lines added/modified).
- **Prisma Migrations**: **0 created, 0 executed**.
- **PostgreSQL Tables**: All required tables already exist in `public` schema.

---

## 4. Execution Plan

1. **Backend Module**:
   - Create `backend/src/student-council/student-council.module.ts`.
   - Create `backend/src/student-council/dto/student-council.dto.ts` (validation DTOs for councils, clubs, members, meetings, proposals, action items).
   - Create `backend/src/student-council/student-council.service.ts` (database aggregations, RBAC scope enforcement, IDOR checks, workflow state machine).
   - Create `backend/src/student-council/student-council.controller.ts` (REST endpoints under `/api/v1/student-council/*`).
   - Register in `backend/src/app.module.ts`.
2. **Frontend Service & Desk**:
   - Create `src/services/studentCouncilService.ts` (typed client API).
   - Create `src/pages/campus/StudentCouncilDeskPage.tsx` (executive tabs: Overview, Office Bearers, Clubs & Committees, Memberships, Meetings/MoM, Event Proposals, Action Items).
   - Link with `src/pages/campus/EventsPage.tsx` so approved event proposals show up in campus events.
   - Register in `src/App.tsx` and `src/constants/navigationConfig.ts`.
3. **Automated Verification**:
   - Create `scripts/test-phase8-student-council.ts` (21+ assertions).
   - Run backend & frontend production builds.
   - Run full regression suites (Phases 2–7).
4. **Final Documentation & Stop**:
   - Authored `PHASE8_STUDENT_COUNCIL_IMPLEMENTATION_REPORT.md` and `FUTURE_STUDENT_COUNCIL_DATABASE_REQUIREMENTS.md`.
