# SSIU ERP — Frontend ↔ Backend Contract Matrix (Phase 13)

**Project**: Swarrnim Startup & Innovation University (SSIU) ERP  
**Phase**: Phase 13 — Final Production & User Acceptance Audit  
**Status**: 100% Contract Alignment Verified  

---

## 1. Tri-Tier Architecture Verification

| Frontend Page / Component | Frontend Service | HTTP Verb & Route | DTO / Request Payload | Backend Controller | Backend Service | Prisma Model / Entity | Contract Alignment |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **Login / Session** | `AuthContext.login` | `POST /api/v1/auth/login` | `{ loginId, password }` | `AuthController` | `AuthService` | `User`, `RefreshToken` | ✅ MATCH |
| **Academic Masters** | `databaseService.getDepartments` | `GET /api/v1/departments` | `?instituteId` | `CoreMastersController` | `CoreMastersService` | `Department` | ✅ MATCH |
| **Institute Masters** | `databaseService.getInstitutes` | `GET /api/v1/institutes` | None | `CoreMastersController` | `CoreMastersService` | `Institute` | ✅ MATCH |
| **Student Directory** | `studentProfileAccessService.list` | `GET /api/v1/students` | `?page&limit&search` | `CoreMastersController` | `CoreMastersService` | `Student` | ✅ MATCH |
| **User Directory** | `userAccountManagementService.list` | `GET /api/v1/users` | `?page&limit&role` | `CoreMastersController` | `CoreMastersService` | `User` | ✅ MATCH |
| **RBAC Roles** | `userAccountManagementService.roles` | `GET /api/v1/roles` | None | `RbacController` | `RbacService` | `RoleGroup` | ✅ MATCH |
| **Bulk Import Template** | `unifiedBulkImportEngine.download` | `GET /api/v1/bulk-import/templates/:type` | Path Param `:type` | `BulkImportController` | `BulkImportService` | N/A | ✅ MATCH |
| **Notesheet Workflow** | `notesheetPdfService.list` | `GET /api/v1/notesheets` | `?page&limit&status` | `NoteSheetController` | `NoteSheetService` | `NoteSheet`, `NoteSheetHistory` | ✅ MATCH |
| **IT Helpdesk** | `helpdeskService.getTickets` | `GET /api/v1/it/tickets` | `?page&limit&category` | `ItHelpdeskController` | `ItHelpdeskService` | `Ticket`, `TicketComment` | ✅ MATCH |
| **Notice Board** | `noticeService.getNotices` | `GET /api/v1/notices` | `?page&limit&scope` | `NoticesController` | `NoticesService` | `Notification`, `NotificationAudit` | ✅ MATCH |
| **Management Analytics** | `managementAnalyticsService.summary`| `GET /api/v1/analytics/management/summary` | `?fromDate&toDate` | `AnalyticsController` | `AnalyticsService` | `Student`, `NoteSheet` | ✅ MATCH |
| **Student Council** | `studentCouncilService.councils` | `GET /api/v1/student-council/councils` | `?page&limit` | `StudentCouncilController` | `StudentCouncilService` | `Committee` | ✅ MATCH |
| **DigiLocker Admin Retry** | `digilockerApiService.retrySync` | `POST /api/v1/digilocker/admin/retry` | `{ syncLogId, documentId }` | `DigiLockerController` | `DigiLockerDocumentService` | `DigiLockerDocument` | ✅ MATCH |
| **Hostel Batch Checkout** | `studentGatePassService.batchCheckout` | `POST /api/v1/hostel/outpass/batch-checkout` | `{ outpassIds: string[] }` | `HostelController` | `HostelService` | `OutpassRequest` | ✅ MATCH |
