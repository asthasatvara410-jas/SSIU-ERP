# SSIU ERP — PHASE 7 ARCHITECTURAL AUDIT
## MANAGEMENT ANALYTICS & KPI DASHBOARD SYSTEM

**Audit Date:** September 2026  
**System Target:** 5,000+ Students, 1,000+ Faculty/Staff, Multi-Institute Campus  
**Status:** Audit Completed • Ready for Implementation Approval  

---

## 1. Executive Summary & Audit Objective
The objective of this audit is to inspect the current state of analytics, Notesheet movements, financial sanctions, hostel gate pass outings, RBAC scoping, and dashboard visualizations across the SSIU ERP. 

In strict adherence to the **AUDIT $\to$ GAP ANALYSIS $\to$ DESIGN $\to$ IMPLEMENT $\to$ SECURITY VERIFY $\to$ PERFORMANCE VERIFY $\to$ TEST $\to$ REGRESSION TEST $\to$ BUILD $\to$ REPORT $\to$ STOP** protocol, this document establishes whether the existing PostgreSQL schema natively supports all requested management KPIs, details performance and security risks, and presents an architectural design before any code or schema modification.

---

## 2. Existing Analytics Functionality
- **Backend Analytics Module (`backend/src/analytics/`)**:
  - `AnalyticsController` under `/api/v1/analytics` and `/analytics`.
  - Exposes 5 endpoints:
    - `GET /dashboard`: Returns simple student/faculty/department counts and open IT tickets.
    - `GET /overview`: Returns counts of students, faculty, batches, programs.
    - `GET /academic`: Returns basic hardcoded percentage placeholders.
    - `GET /finance`: Aggregates `studentFeeAccount` for student fee billing/collection.
    - `GET /library`: Aggregates books, issues, and library fines.
  - **Gap**: Completely lacks dedicated Management Analytics endpoints for Notesheet approvals, approved expenses/sanctioned amounts, hostel outings, currently outside students, department-wise breakdowns, and date-range filtering.

---

## 3. Existing Notesheet Data & Financial Fields

### 3.1 Model `NoteSheet` (`backend/prisma/schema.prisma` lines 1497–1596)
| Field | Type | Analytics Role |
| :--- | :--- | :--- |
| `id`, `notesheetNumber` | String | Unique identifier & canonical numbering (e.g. `SIT-NOTESHEET-0826-001`) |
| `status` | String | Current lifecycle state (`DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `PENDING_APPROVAL`, `FORWARDED`, `APPROVED`, `REJECTED`, `CLOSED`) |
| `department` | String | Department identifier / name (e.g. `CSE`, `EXAM`, `HOSTEL`, `ACCOUNTS`) |
| `departmentId` | String? | FK to academic `Department` if mapped |
| `instituteId` | String? | FK to `Institute` |
| `instituteName` | String? | Denormalized institute name |
| `financialRequirement`| Boolean | Flags whether financial sanction is involved |
| `estimatedCost` | Decimal | Initial proposal cost estimate |
| `requestedAmount` | Decimal? | Amount formally requested by creator |
| **`approvedAmount`** | Decimal? | **Authoritative sanctioned amount** approved by sanctioning authority |
| `approvedAt` | DateTime? | Timestamp when financial/administrative approval was sealed |
| `createdAt` | DateTime | Initial creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

### 3.2 Model `NoteSheetHistory` (`backend/prisma/schema.prisma` lines 1634–1650)
- Records every state movement with `action` (`CREATED`, `SUBMITTED`, `REVIEWED`, `FORWARDED`, `RETURNED`, `APPROVED`, `REJECTED`, `CLOSED`), `timestamp`, `fromUserId`, `fromUserRole`, and `toOffice`.
- Supports computing **Average Processing Time** (time from `CREATED`/`SUBMITTED` to `APPROVED`/`REJECTED`).
- Oldest pending notesheets can be queried directly from `NoteSheet` where `status IN ('SUBMITTED', 'UNDER_REVIEW', 'PENDING_APPROVAL', 'FORWARDED')` ordered by `createdAt ASC`.

---

## 4. Existing Gate Pass & Hostel Outing Data

### 4.1 Model `HostelGatePass` (`backend/prisma/schema.prisma` lines 2906–2965)
| Field | Type | Analytics Role |
| :--- | :--- | :--- |
| `id`, `gatePassNo` | String | Unique gate pass code |
| `studentId`, `enrollmentNo` | String | Student identifier |
| `departmentName` | String? | Student's academic department |
| `hostelId`, `hostelName` | String | Hostel residence details |
| `status` | String | `SUBMITTED`, `APPROVED`, `CHECKED_OUT`, `CHECKED_IN`, `REJECTED`, `CANCELLED` |
| `leavingDate` | DateTime @db.Date | Requested date of departure |
| **`actualCheckOutTime`** | DateTime? | **Authoritative departure timestamp** scanned at campus gate |
| **`actualCheckInTime`** | DateTime? | **Authoritative return timestamp** scanned at campus gate |
| `isLateReturn` | Boolean | Flags if student exceeded permitted return deadline |
| `createdAt` | DateTime | Record creation timestamp |

### 4.2 Calculation Semantics
- **Today's Outings**: Records where `actualCheckOutTime` falls between start of today and end of today (`>= startOfDay AND <= endOfDay`). (Fallback to `leavingDate = today` if checkout scanning is pending).
- **Date-Range Outings**: Count of unique outings where `actualCheckOutTime >= fromDate AND actualCheckOutTime <= toDate`.
- **Average Daily Outings**: Total outings in range divided by the number of elapsed days in that date range.
- **Currently Outside Students**: Active outings where `actualCheckOutTime IS NOT NULL AND actualCheckInTime IS NULL AND status = 'CHECKED_OUT'`.
- **Returned Students**: Records where both `actualCheckOutTime IS NOT NULL AND actualCheckInTime IS NOT NULL` in the target range.
- **Hostel / Department-wise Outings**: Grouping by `hostelName` and `departmentName`.

---

## 5. Department & Institute Relationships
- `model Institute`: `id`, `name`, `code`.
- `model Department`: `id`, `name`, `code`, `instituteId`.
- Both `model NoteSheet` and `model Student` reference `instituteId` and `departmentId`.
- `HostelGatePass` captures `departmentName` and `hostelId` / `hostelName`.
- The existing `MasterDataCacheService` already caches institute and department lists in memory, enabling sub-5ms lookup without repeated SQL joins.

---

## 6. RBAC Capabilities & Scope Boundaries
- Existing RBAC infrastructure in `backend/src/rbac/`:
  - `JwtAuthGuard` & `RbacGuard`.
  - Allowed roles for Management Analytics: `SUPER_ADMIN`, `SYSTEM_ADMIN`, `UNIVERSITY_ADMIN`, `VICE_PRESIDENT`, `REGISTRAR`, `PRINCIPAL`, `HOD`, `DEPUTY_REGISTRAR`.
  - Non-management personas (e.g. `STUDENT`, `PARENT`, `ACCOUNTANT`, `SECURITY_GUARD`) must be rejected with `HTTP 403 Forbidden`.
  - Scope boundaries:
    - `SUPER_ADMIN`, `UNIVERSITY_ADMIN`, `VICE_PRESIDENT`, `REGISTRAR`: Can view campus-wide analytics and filter by any `instituteId` or `departmentId`.
    - `PRINCIPAL`: Automatically scoped to their own `instituteId`. Request parameter manipulation to other institutes is blocked.
    - `HOD`: Automatically scoped to their own `departmentId` and `instituteId`. Request parameter manipulation to other departments is blocked.

---

## 7. Existing Frontend Dashboard Components
- `src/pages/dashboard/Dashboard.tsx`: Main dashboard with `StatCard`, role-aware views, and executive tabs (`OVERVIEW`, `GOVERNANCE`, `STUDENTS`, `FINANCE`, `OPERATIONS`, `AUDIT`).
- `src/components/common/Charts.tsx`: Clean, zero-dependency SVG-based donut and pie charts (`PieChart`) with interactive hover states, legends, and percentages.
- `src/components/common/StatCard.tsx`: Reusable metrics card with trend indicators, icons, and badge colors.
- `src/components/common/ExcelTable.tsx`: Styled, robust data tables with clean borders.
- `src/services/dashboardKpiService.ts`: Existing client-side aggregator for attention items and alerts.

---

## 8. Missing Functionality (Gaps to Implement)
1. **Backend Management Analytics Endpoints**:
   - `GET /api/v1/analytics/management/summary`: Summary KPI cards (Students, Faculty, Pending Notesheets, Approved Notesheets, Monthly Approved Expense, Today's Outings, Currently Outside, Open Tickets).
   - `GET /api/v1/analytics/management/notesheets`: Notesheet status distribution, department-wise pending notesheets, department-wise totals, average processing time, and oldest pending notesheets.
   - `GET /api/v1/analytics/management/expenses`: Monthly approved expense trend, total sanctioned amounts, department-wise approved expense, and approved vs. pending value.
   - `GET /api/v1/analytics/management/gate-pass`: Today's outings, date-range total outings, average daily outings, currently outside count, returned count, daily outing trend, department-wise, and hostel-wise distribution.
2. **Frontend Management Analytics View**:
   - Dedicated management dashboard sub-view in `Dashboard.tsx` or `ManagementAnalyticsView` with:
     - Date Range selector (`fromDate`, `toDate`).
     - Institute & Department dropdown filters.
     - Live KPI cards, SVG charts, and Excel-style breakdown tables.
   - `src/services/managementAnalyticsService.ts` for type-safe REST consumption.

---

## 9. Performance & Scalability Considerations (5,000+ Students, 1,000+ Staff)
- **Zero Frontend Data Dumping**: Never fetch thousands of records to the browser. All aggregations (`COUNT`, `SUM`, `AVG`, `GROUP BY`) must occur at the PostgreSQL database level using Prisma aggregations.
- **Parallel Query Execution**: Use `Promise.all()` to fire independent aggregate queries concurrently in the backend.
- **Query Optimization**:
  - Filter clauses always target indexed fields (`status`, `department`, `instituteId`, `createdAt`, `actualCheckOutTime`).
  - Limits enforced on lists (e.g. oldest pending notesheets capped to `take: 10`).
- **Response Caching**: Master data (institutes and departments) served directly from `MasterDataCacheService`.

---

## 10. Security & Threat Modeling
- **Privilege Escalation**: Ordinary students or staff attempting to query `/api/v1/analytics/management/*` receive `HTTP 403 Forbidden`.
- **Scope Tampering**: Backend overrides frontend `instituteId` or `departmentId` if user is a `PRINCIPAL` or `HOD`.
- **Zero Credential Exposure**: Response payloads contain strictly numerical aggregations, timestamps, and public reference codes (`notesheetNumber`, `gatePassNo`). Password hashes and auth tokens are omitted entirely.

---

## 11. Database Safety & Migration Status
- **Existing Schema Audit**:
  - `model NoteSheet` already contains `approvedAmount`, `estimatedCost`, `status`, `department`, `departmentId`, `instituteId`, `createdAt`, and `approvedAt`.
  - `model NoteSheetHistory` already contains movement actions and timestamps.
  - `model HostelGatePass` already contains `actualCheckOutTime`, `actualCheckInTime`, `status`, `departmentName`, `hostelName`, and `leavingDate`.
- **Conclusion**:
  - **0 schema changes required**.
  - **0 migrations required**.
  - **0 existing tables altered or dropped**.
