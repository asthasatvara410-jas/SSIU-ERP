# SSIU ERP — PHASE 3 PERFORMANCE & LARGE-DATA INVENTORY

**Document Purpose:** Comprehensive audit and performance classification for all large-data pages, frontend services, backend controllers, and database query interfaces across SSIU Central ERP.

---

## 1. Large-Data Performance Inventory Matrix

| Module | Frontend Page | Frontend Service | Backend Controller | Backend Service | API Endpoint | Current Pagination? | Current Search? | Current Filter? | Current Sort? | Current Dataset Size | Client-Side Filtering? | Server-Side Filtering? | Caching? | Risk Level | Recommended Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Student Directory** | `StudentDirectorySearchPage.tsx` | `studentProfileAccessService.ts` | `CoreMastersController` | `CoreMastersService` | `GET /api/v1/students` | Backend: Yes (`page`, `limit`), Frontend: Client slice | Client in-memory | Client-side (Inst, Dept, Prog, Sem, Status) | Client-side | 5,000+ Students | Yes | Yes (Partial) | None | **P0 (Critical)** | Wire frontend search/filter directly to backend `GET /api/v1/students`; enforce server-side `page`, `limit`, `search`, and multi-field filtering; cap limit <= 100. |
| **Central User Management** | `SystemSettingsPage.tsx`, `AdminPortalPage.tsx` | `userAccountManagementService.ts` | `CoreMastersController` (New User Endpoint) | `CoreMastersService` | `GET /api/v1/users` | Client-side slice | Client-side | Client-side (Role, Inst, Dept, Status) | Client-side | 6,000+ Accounts | Yes | No (Missing backend API) | None | **P0 (Critical)** | Implement server-side `GET /api/v1/users` with RBAC scope enforcement, server-side pagination, search by Enrollment No / Employee Code / Name / Email, role/status filter; wire `userAccountManagementService`. |
| **Academic Master Data** | Global Navigation & 40+ Components | `db.ts` | `CoreMastersController` | `CoreMastersService` | `GET /api/v1/institutes`, `departments`, `programs`, `academic-years`, `subjects` | None (Full list returned) | Client-side | Client-side | None | 500+ Master records | Yes | Partial | None | **P0 (Critical)** | Implement in-memory TTL Master Data Caching (`MasterDataCacheService`, 10 min TTL) with auto-invalidation on create/patch. Eliminate duplicate master queries. |
| **Attendance Management** | `AttendancePage.tsx`, `StudentAttendancePage.tsx` | `attendanceService.ts` | `AttendanceController` | `AttendanceService` | `GET /api/v1/attendance` | Yes (Sessions paginated) | Client-side | Server & Client | Server | 50,000+ Records | Partial | Yes | None | **P0 (Critical)** | Optimize attendance queries, enforce date/subject/division scoping so large bulk queries are never unbounded; protect IDOR. |
| **Support Tickets / IT Helpdesk** | `SupportTicketsPage.tsx` | `db.getSupportTickets()` | `ItHelpdeskController` | `ItHelpdeskService` | `GET /api/v1/it/tickets` | None (Returns all records) | Client-side | Client-side (Status, Priority, Category) | Client-side | 1,000+ Tickets | Yes | Partial | None | **P1 (High)** | Add server-side pagination (`page`, `limit`), search (`ticketNo`, `title`, `description`), and filters to `ItHelpdeskController` & Service; wire frontend. |
| **Faculty Directory** | `StaffGovernanceHubPage.tsx` | `db.getFaculty()` | `CoreMastersController` | `CoreMastersService` | `GET /api/v1/faculty` | Backend: Yes, Frontend: No | Client-side | Client-side | Client-side | 1,000+ Faculty | Yes | Yes (Partial) | None | **P1 (High)** | Reuse existing backend `GET /api/v1/faculty?page=1&limit=20` with search and department filtering. |
| **Staff Directory (Non-Teaching)** | `StaffGovernanceHubPage.tsx` | `staffGovernanceService.ts` | `HrController` | `HrService` | `GET /api/v1/hr/employees` | Backend: Partial | Client-side | Client-side | Client-side | 500+ Staff | Yes | Partial | None | **P1 (High)** | Add explicit pagination & search to HR employee directory API. |
| **NoteSheets** | `NoteSheetPage.tsx` | `notesheetService` | `NoteSheetController` | `NoteSheetService` | `GET /api/v1/notesheets` | Yes (Backend paginated) | Server & Client | Server & Client | Server | 5,000+ Notesheets | Partial | Yes | None | **P1 (High)** | Enforce strict pagination limits and prevent full payload downloads in dashboard counters. |
| **Student Fee Accounts & Receipts** | `StudentAdminWorkspacePage.tsx`, `FeeReceiptModal.tsx` | `receipt.controller.ts` | `ReceiptController` | `ReceiptService` | `GET /api/v1/fees/receipts` | Partial | Client-side | Client-side | None | 10,000+ Records | Yes | Partial | None | **P1 (High)** | Enforce student/enrollment scoping and pagination on receipts list. |
| **Hostel & Gate Pass Records** | `RequestsPage.tsx`, `StudentGatePassModal.tsx` | `studentGatePassService.ts` | `HostelController` | `HostelService` | `GET /api/v1/hostel/gate-passes` | Partial | Client-side | Client-side | None | 2,000+ Records | Yes | Yes | None | **P2 (Medium)** | Ensure gate pass queries require date or student scope; paginate admin list. |
| **Document Vault** | `StudentDirectorySearchPage.tsx` (Doc Vault) | `documentMasterService.ts` | `DocumentsController` | `DocumentsService` | `GET /api/v1/documents` | By Student | None | Category | None | 15,000+ Files | Yes | Yes | None | **P2 (Medium)** | Never load global document list without studentId/category scope. Maintain signed URL security. |
| **Bulk Import Audit History** | `BulkImportPage.tsx` | `unifiedBulkImportEngine.ts` | `BulkImportController` | `BulkImportService` | `GET /api/v1/bulk-import/:id/preview` | Yes (`page`, `limit`) | None | None | None | 5,000+ Staging Rows | No | Yes | None | **P2 (Medium)** | Phase 2 already implemented chunked staging preview; ensure limit is capped <= 100. |

---

## 2. Priority Action Plan

### P0 (Critical — Immediate Implementation)
1. **Student Directory (`StudentDirectorySearchPage.tsx` + `CoreMastersController`)**:
   - Eliminate full student list loading in memory.
   - Extend `CoreMastersService.getStudents` to support `programId`, `semesterId`, `batchId`, and sorting (`sortBy`, `sortOrder`).
   - Wire `studentProfileAccessService.searchStudents` to query backend pagination with fallback.
   - Enforce page size limit (`max: 100`, default: `20`).
2. **Central User Management (`SystemSettingsPage.tsx` + Backend User API)**:
   - Implement `GET /api/v1/users` on backend with `page`, `limit`, `search`, `role`, `status`, `instituteId`, `departmentId`.
   - Search by `enrollmentNo` (Students) and `employeeCode` (Faculty/Staff), plus `name` and `email`.
   - Strict RBAC scope: users cannot query accounts outside their permitted institute/department.
   - Wire `userAccountManagementService.getUsers` with server-side pagination support.
3. **Master Data In-Memory Caching (`MasterDataCacheService`)**:
   - Cache `Institutes`, `Departments`, `Programs`, `AcademicYears`, `Semesters`, `Subjects` with 10-minute TTL.
   - Automatic cache eviction on any `POST`/`PATCH` mutation.
   - Strictly ZERO sensitive data, passwords, or user authorization decisions cached.

### P1 (High)
4. **Support Tickets / IT Helpdesk (`SupportTicketsPage.tsx` + `ItHelpdeskController`)**:
   - Add `page`, `limit`, `search`, `priority`, `status`, `category` query support to `ItHelpdeskService.getTickets`.
   - Update `SupportTicketsPage.tsx` to utilize server-side pagination with controlled page size.
5. **Faculty & Staff Directories (`StaffGovernanceHubPage.tsx`)**:
   - Ensure backend pagination is actively used instead of full-table downloads.

### P2 (Medium)
6. **Dashboard Aggregation**:
   - Verify dashboard KPI metrics use `prisma.*.count()` rather than downloading raw records.
