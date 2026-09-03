# SSIU ERP — Final RBAC & IDOR Security Audit Matrix (Phase 13)

**Project**: Swarrnim Startup & Innovation University (SSIU) ERP  
**Phase**: Phase 13 — Final Production & User Acceptance Audit  
**Status**: Multi-Tier Authorization & IDOR Isolation Verified  

---

## 1. Multi-Tier Role Hierarchy & Scope Isolation

| Role | Hierarchy Level | Tenancy / Ownership Scope | Protected Resources | Cross-Tenant Tampering | Result |
| :--- | :---: | :--- | :--- | :--- | :---: |
| **SUPER_ADMIN** | Level 1 | University-Wide (All institutes & depts) | Unrestricted global access | N/A (Master root) | ✅ AUTHORIZED |
| **REGISTRAR** | Level 2 | University Academic & Administrative Records | University-wide student records & notices | Cross-institute access allowed by policy | ✅ AUTHORIZED |
| **PRINCIPAL / DEAN**| Level 3 | Institute-Wide | Scoped to own `instituteId` | Attempting other `instituteId` $\to$ **403 Forbidden** | ✅ ISOLATED |
| **HOD** | Level 4 | Department-Wide | Scoped to own `departmentId` | Attempting other `departmentId` $\to$ **403 Forbidden** | ✅ ISOLATED |
| **FACULTY** | Level 5 | Assigned Courses & Sections | Own classes, attendance & grades | Tampering course ID $\to$ **403 Forbidden** | ✅ ISOLATED |
| **STUDENT** | Level 6 | Own Profile (`OWN` scope) | Own profile, attendance & fees | Tampering `studentId` $\to$ **403 Forbidden** | ✅ ISOLATED |
| **ACCOUNTANT** | Level 5 | Finance & Fee Collections | Fee collections, receipts, challans | Modifying academic masters $\to$ **403 Forbidden** | ✅ ISOLATED |
| **HOSTEL_WARDEN** | Level 5 | Hostel Buildings & Gate Passes | Room allotments, outpasses, visitors | Tampering academic records $\to$ **403 Forbidden** | ✅ ISOLATED |

---

## 2. Parameter Tampering & IDOR Resistance Test Cases

1. **Student querying Analytics**: `GET /api/v1/analytics/management/summary` with student JWT $\to$ **403 Forbidden**.
2. **Student triggering Bulk Import**: `POST /api/v1/bulk-import/upload` with student JWT $\to$ **403 Forbidden**.
3. **Student creating Attendance Session**: `POST /api/v1/attendance/session` with student JWT $\to$ **403 Forbidden**.
4. **Student executing Hostel Batch Checkout**: `POST /api/v1/hostel/outpass/batch-checkout` with student JWT $\to$ **403 Forbidden**.
5. **Student triggering DigiLocker Admin Retry**: `POST /api/v1/digilocker/admin/retry` with student JWT $\to$ **403 Forbidden**.
