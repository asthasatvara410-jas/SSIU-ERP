# SSIU ERP — Real CRUD Verification Matrix (Phase 13)

**Project**: Swarrnim Startup & Innovation University (SSIU) ERP  
**Phase**: Phase 13 — Final Production & User Acceptance Audit  
**Status**: Real CRUD Capabilities & PostgreSQL Database Reach  

---

## 1. Real CRUD Capabilities & Database Reach

| Entity / Domain | Create API & Service | Read / Search API | Update / Status API | Soft-Delete / Archive | Database Entity Verified | Real Persistence |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **Students** | `POST /api/v1/students` | `GET /api/v1/students` | `PATCH /api/v1/students/:id` | `PATCH /api/v1/students/:id` (`isArchived`) | `prisma.student` | ✅ REACHES POSTGRESQL |
| **Users & RBAC** | `POST /api/v1/users` | `GET /api/v1/users` | `POST /api/v1/users/:id/override` | `PATCH /api/v1/users/:id` (`accountStatus`) | `prisma.user`, `prisma.userRoleOverride` | ✅ REACHES POSTGRESQL |
| **Departments** | `POST /api/v1/departments` | `GET /api/v1/departments` | `PATCH /api/v1/departments/:id` | `DELETE /api/v1/departments/:id` | `prisma.department` | ✅ REACHES POSTGRESQL |
| **Institutes** | `POST /api/v1/institutes` | `GET /api/v1/institutes` | `PATCH /api/v1/institutes/:id` | `DELETE /api/v1/institutes/:id` | `prisma.institute` | ✅ REACHES POSTGRESQL |
| **Notesheets** | `POST /api/v1/notesheets` | `GET /api/v1/notesheets` | `POST /api/v1/notesheets/:id/forward` | `POST /api/v1/notesheets/:id/cancel` | `prisma.noteSheet`, `prisma.noteSheetHistory` | ✅ REACHES POSTGRESQL |
| **IT Helpdesk** | `POST /api/v1/it/tickets` | `GET /api/v1/it/tickets` | `POST /api/v1/it/tickets/:id/resolve` | `POST /api/v1/it/tickets/:id/close` | `prisma.ticket`, `prisma.ticketComment` | ✅ REACHES POSTGRESQL |
| **Notices** | `POST /api/v1/notices` | `GET /api/v1/notices` | `PATCH /api/v1/notices/:id` | `POST /api/v1/notices/:id/archive` | `prisma.notification`, `prisma.notificationAudit` | ✅ REACHES POSTGRESQL |
| **Student Council** | `POST /api/v1/student-council/councils` | `GET /api/v1/student-council/councils` | `POST /api/v1/student-council/members` | `DELETE /api/v1/student-council/members/:id` | `prisma.committee`, `prisma.committeeMember` | ✅ REACHES POSTGRESQL |
| **Hostel Outpasses**| `POST /api/v1/hostel/outpass` | `GET /api/v1/hostel/outpass` | `Patch /api/v1/hostel/outpass/:id/approve` | `POST /api/v1/hostel/outpass/batch-checkout` | `prisma.outpassRequest` | ✅ REACHES POSTGRESQL |
| **DigiLocker Sync** | `POST /api/v1/digilocker/connect` | `GET /api/v1/digilocker/documents` | `POST /api/v1/digilocker/sync` | `POST /api/v1/digilocker/admin/retry` | `prisma.digiLockerAccount` | ✅ REACHES POSTGRESQL |
| **Bulk Import** | `POST /api/v1/bulk-import/upload` | `GET /api/v1/bulk-import/history` | `POST /api/v1/bulk-import/:id/confirm` | `DELETE /api/v1/bulk-import/:id` | `prisma.bulkImportSession` | ✅ REACHES POSTGRESQL |
