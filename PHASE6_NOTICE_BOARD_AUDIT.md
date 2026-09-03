# SSIU ERP — PHASE 6: NOTICE BOARD & TARGETED ANNOUNCEMENT AUDIT

**Audit Date:** September 2026  
**Scope:** Notice Board UI (`NoticesPage.tsx`), Communication & Document Modules, Prisma Models, Audience Targeting, RBAC Scopes, and Expiry Lifecycle

---

## 1. Executive Summary
Prior to code implementation, a thorough audit of all notice board, circular, broadcast, and announcement components across both frontend and backend was conducted. Currently:
1. **Frontend (`NoticesPage.tsx`)**: A polished Excel-style notice board interface exists with category badges, pinned notice highlighting, view modals, creation modals, and client-side PDF generation via `noticePdfService.ts`. However, it relies on static hardcoded mock data (`initialNotices`) and lacks server-side search, category filtering, audience selection, scheduling, and pagination controls.
2. **Backend**: No dedicated Notice Board controller exists in `backend/src/`. The existing `CommunicationController` serves official inward/outward postal correspondence and explicitly denies student access (`checkNonStudent`).
3. **Database Architecture**: `backend/prisma/schema.prisma` already contains `model Notification` (lines 7026–7056) and `model NotificationRecipient` (lines 7058–7070) with native fields for `module = 'NOTICE'`, `scopeType` (`UNIVERSITY_WIDE`, `INSTITUTE_WIDE`, `DEPARTMENT_WIDE`, `TARGETED`), `targetRole`, `targetInstituteId`, `targetDepartmentId`, `priority`, `actionUrl` (attachment), `actionLabel` (issuing authority), and `linkTab` (metadata store for lifecycle timestamps).
4. **Database Safety Finding**: **0 schema changes and 0 migrations are required.** The existing PostgreSQL schema can completely support multi-tier targeted notices.

---

## 2. Detailed 8-Point Feature Audit

### 2.1 What Already Exists and Can Be Reused
- **Frontend UI Table & Styles**: `src/pages/campus/NoticesPage.tsx` provides an Excel-style table (`ExcelTableContainer`, `ExcelTable`, `ExcelTh`, `ExcelTd`), status badges, and responsive layouts.
- **Client-Side PDF Generator**: `src/services/noticePdfService.ts` generates official A4 university circular PDFs with the Swarrnim seal and official headers.
- **Backend Master Data & RBAC Infrastructure**: `JwtAuthGuard`, `RbacGuard`, `@RequirePermission`, `MasterDataCacheService`, and user identity models (`User`, `Student`, `Faculty`).
- **Prisma Notification Models**: `model Notification` and `model NotificationRecipient` in PostgreSQL.

### 2.2 What Is Currently Mock / Local Frontend Data
- In `src/pages/campus/NoticesPage.tsx`, notices are stored in a static array `initialNotices` with 4 sample items.
- `handlePostNotice` appends directly to React component state `setNotices([newNot, ...notices])` and is lost upon page refresh.
- No network requests are made to fetch, filter, or paginate notices.

### 2.3 Existing Database Structures
- `model Notification` (`backend/prisma/schema.prisma`, line 7026):
  - `id`: UUID primary key
  - `type`: Lifecycle status (`PUBLISHED`, `DRAFT`, `SCHEDULED`, `EXPIRED`, `ARCHIVED`)
  - `title`: Notice title string
  - `message`: Notice text body / content
  - `module`: `'NOTICE'`
  - `referenceId`: Unique notice sequence number (e.g. `NOT-2026-000001`)
  - `referenceType`: Category (`ACADEMIC`, `EXAM`, `HOLIDAY`, `FEES`, `EVENT`, `ADMINISTRATIVE`, `GENERAL`)
  - `priority`: `URGENT`, `HIGH`, `NORMAL`, `LOW`
  - `scopeType`: `UNIVERSITY_WIDE`, `INSTITUTE_WIDE`, `DEPARTMENT_WIDE`, `TARGETED`
  - `targetRole`: `ALL`, `STUDENT`, `FACULTY`, `STAFF`, `HOD`, `PRINCIPAL`
  - `targetInstituteId`: Foreign reference to `Institute`
  - `targetDepartmentId`: Foreign reference to `Department`
  - `actionUrl`: PDF attachment / document URL
  - `actionLabel`: Issuing authority name (e.g. `'Registrar Office'`, `'Dean Academic'`)
  - `linkTab`: JSON metadata store (`publishAt`, `expiresAt`, `isPinned`)
  - `createdBy`: User ID of issuing officer
  - `createdAt`, `updatedAt`: Auto-managed timestamps
  - `recipients`: Relational link to `NotificationRecipient`

### 2.4 Existing APIs
- `GET /api/v1/documents/*`: Academic document repository.
- `POST /api/v1/communications/*`: Inward/outward administrative correspondence (staff only).
- `GET /api/v1/institutes`, `GET /api/v1/departments`: Master data cached endpoints.
- *Notice Board Specific Endpoints*: **None exist currently.** Need to implement `NoticeBoardController` and `NoticeBoardService` under `backend/src/communication/` or a dedicated `backend/src/notices/` module.

### 2.5 Missing Capabilities
- **Targeted Audience Filtering**: No backend mechanism to verify whether a student in Department A / Institute B is permitted to view a given notice.
- **Lifecycle Management**: Missing automated transitions between `DRAFT`, `SCHEDULED`, `PUBLISHED`, `EXPIRED`, and `ARCHIVED`.
- **Search & Filter Controls**: Missing server-side query parameters for category, priority, audience, and active/expired state.
- **Server-Side Pagination**: Missing pagination limit and offset handling for 5,000+ students and 1,000+ staff.
- **Audit Logging**: Mutations (create, edit, publish, archive) are not logged.

### 2.6 Security Gaps
- **Lack of Backend Scope Authorization**: In the current frontend, any user could view all notices if frontend filtering is bypassed. Backend visibility filtering is essential.
- **Unauthorized Notice Publishing**: No RBAC guard exists to prevent ordinary students from calling notice creation endpoints.
- **Audience Tampering / Privilege Escalation**: Creators must not be able to broadcast outside their administrative scope (e.g. a Department HOD should not be able to publish university-wide notices without university admin authority).

### 2.7 Performance Considerations
- With 5,000+ students and 1,000+ staff querying notices on dashboard login, unbounded `findMany()` queries would cause database strain.
- Server-side pagination (`limit <= 100`) and indexed queries on `[module, scopeType, createdAt]` must be enforced.

### 2.8 Database Changes Assessment
- **Assessment**: The existing `Notification` model contains every necessary column to represent targeted notices with zero migration required.
- **Conclusion**: **0 schema alterations, 0 migrations.**
