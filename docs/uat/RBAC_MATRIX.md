# SSIU ERP — ENTERPRISE ROLE-BASED ACCESS CONTROL (RBAC) MATRIX
**Swarrnim Startup & Innovation University Enterprise Resource Planning System**  
**Version:** 7.11 (Security UAT Validated)  
**Date:** August 31, 2026  
**Auditor:** SSIU ERP Security & Governance Board  

---

## 1. Principles of Enterprise RBAC

1. **No Client-Side Authorization Trust**: All access decisions are derived exclusively from cryptographically verified server-side JWT claims and database-backed permission sets.
2. **Principle of Least Privilege**: Users are granted only the minimum permissions required for their institutional roles.
3. **Statutory Segregation of Duties**: ICC inquiries and Anti-Ragging squads operate under separate access gates not readable by standard faculty or staff.
4. **Tenant-Scoped Authorization**: Any authorization check automatically injects and enforces the authenticated user's `tenantId`.

---

## 2. Definitive Role Catalog

| Role Code | Role Name | Institutional Scope | Description |
|---|---|---|---|
| `SUPER_ADMIN` | University Super Administrator | University-wide (All Tenants) | Full administrative access, tenant creation, system configuration, master audits. |
| `ADMIN` | Institutional Admin | Single Tenant | Campus/Institution-level administration, user management, policy configuration. |
| `REGISTRAR` | University Registrar | University-wide | Statutory records, academic governance, final approvals, grievance oversight. |
| `VICE_CHANCELLOR` | Vice Chancellor | University-wide | Executive governance, institutional KPI oversight, statutory policy exemptions. |
| `IQAC` | Internal Quality Assurance Cell | University-wide | NAAC compliance, quality audits, institutional data snapshots, evidence review. |
| `NBA_COORDINATOR` | NBA Accreditation Coordinator | Program / Department | NBA Criteria, CO-PO articulation, direct/indirect attainment reports. |
| `HOD` | Head of Department | Department-wide | Faculty workload, student progression, timetable approval, departmental grievances. |
| `FACULTY` | Academic Faculty / Professor | Assigned Courses & Students | Attendance recording, continuous evaluation marks, CO-PO mapping, research output. |
| `STAFF` | Administrative Staff | Department / Office | Non-academic support, administrative workflows, circulars. |
| `STUDENT` | Enrolled Student | Self Record | 360° profile, timetable, results, fee payment, document requests, AI Helpdesk, grievance. |
| `ACCOUNTANT` | Accounts / Finance Officer | Single Tenant | Fee invoice creation, payment verification, installment approvals, ledger audits. |
| `LIBRARIAN` | Chief Librarian | Central Library | Book cataloging, circulation, reservations, overdue fine management. |
| `HOSTEL_ADMIN` | Chief Warden / Hostel Admin | Campus Hostels | Room allotment, occupancy tracking, hostel maintenance, discipline. |
| `TRANSPORT_ADMIN` | Transport Supervisor | Fleet Operations | Bus routing, driver assignment, student transport passes, vehicle maintenance. |
| `RESEARCH_ADMIN` | Dean / Director of Research | University-wide | SSIP / DST / AICTE grant tracking, publication review, patent filings. |
| `GRIEVANCE_OFFICER` | Grievance Redressal Officer | Institutional Committees | UGC grievance triage, committee coordination, SLA tracking, action reporting. |
| `ANTI_RAGGING_OFFICER`| Anti-Ragging Committee Head | University-wide Squad | Immediate incident response, squad investigation dispatch, police/statutory escalation. |
| `ICC_MEMBER` | Internal Complaints Committee | Confidential Case Gate | POSH Act compliance, confidential inquiry hearings, recommendations, victim protection. |

---

## 3. Comprehensive RBAC Permissions Matrix

**Legend:**  
- **C**: Create | **R**: Read / View | **U**: Update / Edit | **D**: Delete / Purge | **A**: Approve / Reject | **E**: Export (PDF/Excel) | **V**: Verify / Audit | **S**: Escalate

| Module / Operation Domain | `SUPER_ADMIN` | `ADMIN` | `REGISTRAR` | `VC` | `IQAC` | `NBA_COORD` | `HOD` | `FACULTY` | `STAFF` | `STUDENT` | `ACCOUNTANT` | `LIBRARIAN` | `HOSTEL_ADMIN` | `TRANSPORT_ADMIN` | `RESEARCH_ADMIN` | `GRIEVANCE_OFFICER` | `ANTI_RAGGING` | `ICC_MEMBER` |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **User & Tenant Mgmt** | CRUD-AEV | CRUD-AEV | R-V | R-V | R | R | R (Dept) | - | - | - | - | - | - | - | - | - | - | - |
| **Student 360° Profile** | CRUD-AEV | CRUD-AEV | R-V | R | R | R | R-E (Dept) | R (Class) | R | R-U (Self) | R | R | R (Hostel) | R (Bus) | - | R (Case) | R (Case) | R (Case) |
| **Faculty & Workload** | CRUD-AEV | CRUD-AEV | R-A-V | R-V | R | R | CRUD-A (Dept) | R-U (Self) | - | - | - | - | - | - | R | - | - | - |
| **Academic Courses & Syllabus** | CRUD-AEV | CRUD-AEV | R-A-V | R | R-V | R-U | CRUD-A (Dept) | R-U (Assigned) | R | R | - | - | - | - | - | - | - | - |
| **Attendance Tracking** | CRUD-AEV | CRUD-AEV | R-V | R | R | R | CRUD-A (Dept) | CRUD (Assigned) | - | R (Self) | - | - | - | - | - | - | - | - |
| **Examinations & Marks** | CRUD-AEV | CRUD-AEV | R-A-V | R-V | R | R-V | CRUD-A (Dept) | CRUD (Assigned) | - | R (Self) | - | - | - | - | - | - | - | - |
| **Finance, Invoices & Fees** | CRUD-AEV | CRUD-AEV | R-V | R-V | - | - | R (Dept) | - | - | R-Pay (Self) | CRUD-A-E-V | - | R (Hostel Fee) | R (Bus Fee) | - | - | - | - |
| **Document Enterprise CMS (DMS)** | CRUD-AEV | CRUD-AEV | CRUD-AEV | R-V | R-V | R-V | CRUD (Dept) | CRUD (Self) | CRUD | CRUD (Self) | CRUD (Finance) | CRUD (Lib) | CRUD (Hostel) | CRUD (Transport) | CRUD (Grants) | CRUD (Grievance) | CRUD (Ragging) | CRUD (ICC) |
| **AI Student Helpdesk** | CRU-V | CRU-V | R-V | R | - | - | - | - | - | C-R (Self) | - | - | - | - | - | - | - | - |
| **Agent Platform & Policy** | CRUD-AEV | CRUD-AEV | R-V | R-V | - | - | R-A (Dept) | - | - | - | R-A (Finance) | - | - | - | - | - | - | - |
| **Govt Integration (ABC/APAAR)** | CRUD-AEV | CRUD-AEV | CRUD-AEV | R-V | R-V | R | R (Dept) | - | - | C-R (Self) | - | - | - | - | - | - | - | - |
| **DigiLocker / NAD Repository** | CRUD-AEV | CRUD-AEV | CRUD-AEV | R-V | R-V | - | R (Dept) | - | - | R-V (Self) | - | - | - | - | - | - | - | - |
| **OBE & CO-PO Articulation** | CRUD-AEV | CRUD-AEV | R-V | R | CRUD-AEV | CRUD-AEV | CRUD-A (Dept) | CRU (Assigned) | - | R (Self) | - | - | - | - | - | - | - | - |
| **NAAC / NBA Accreditation** | CRUD-AEV | CRUD-AEV | CRUD-AEV | R-V | CRUD-AEV | CRUD-AEV | CRU-E (Dept) | R-E (Assigned) | - | - | - | - | - | - | R-E | - | - | - |
| **Startup, SSIP & Grants** | CRUD-AEV | CRUD-AEV | R-A-V | R-V | R | - | R (Dept) | CRU (PI Self) | - | - | R-V (Finance) | - | - | - | CRUD-AEV | - | - | - |
| **General UGC Grievance** | CRUD-AEV | CRUD-AEV | R-A-S-V | R-V | - | - | R-A-S (Dept) | - | - | C-R (Self/Anon) | - | - | - | - | - | CRUD-A-S-V | - | - |
| **Anti-Ragging Complaints** | CRUD-AEV | CRUD-AEV | R-A-S-V | R-V | - | - | R-S (Dept) | - | - | C-R (Self/Anon) | - | - | R-S (Hostel) | R-S (Bus) | - | R-S | CRUD-A-S-V | - |
| **ICC Harassment Inquiries** | - | - | R-V (Final) | R-V | - | - | - | - | - | C-R (Self/Anon) | - | - | - | - | - | - | - | CRUD-A-S-V |
| **Audit Logs & Security Events** | R-E-V | R-E-V | R-V | R-V | R-V | - | - | - | - | - | - | - | - | - | - | - | - | - |

---

## 4. Security Invariants Verified

1. **Zero Anonymous Identity Leaks**: Normal committee viewers and standard faculty cannot query or view `AnonymousCaseIdentity` records.
2. **ICC Data Isolation**: Super Admins and regular Admins are restricted from viewing raw ICC sensitive inquiry testimony unless formally authorized as ICC panel members.
3. **No Frontend Authorization Bypass**: Backend API guards (`JwtAuthGuard`, `RolesGuard`, `TenantGuard`) intercept and validate every mutating and read request.
