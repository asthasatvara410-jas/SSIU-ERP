# SSIU ERP — Phase 11: Final RBAC & Security Audit

**Project**: Swarrnim Startup & Innovation University (SSIU) ERP  
**Phase**: Phase 11 — Final Deep System Audit & Production Gap Closure  
**Status**: Multi-Tier Authorization, Scope Isolation & IDOR Verification  

---

## 1. Security Architecture Summary

Backend authorization is strictly authoritative and does not depend on frontend button visibility. All controllers utilize NestJS guards:
1. `JwtAuthGuard`: Authenticates signed Bearer tokens; extracts `userId`, `roles`, `departmentId`, and `instituteId`.
2. `RbacGuard` / `RolesGuard`: Enforces fine-grained declarative permissions (`@RequirePermission`) and role memberships (`@RequireRole`).
3. `RateLimiterGuard`: Sliding-window throttling with composite NAT keying (`IP + loginId`) to defend against brute force.

---

## 2. Role & Scope Verification Matrix

| Role Tested | Scope Boundary | Access Permitted | Access Forbidden (Blocked by Backend) |
| :--- | :--- | :--- | :--- |
| **STUDENT** | `OWN` Records Only | Own attendance, own tickets, own gate passes, own results, own fees. | Accessing other students' data (HTTP 403 IDOR), creating attendance sessions, creating notices, accessing management analytics. |
| **FACULTY** | `DEPARTMENT` / Assigned Batches | Assigned subject attendance, syllabus plans, student evaluations, department notices. | Accessing other departments, modifying administrative settings, assigning roles, creating university-wide broadcasts. |
| **HOD** | `DEPARTMENT` Authority | Department notesheets, faculty workload, department tickets, department council advisory. | Other departments' confidential notesheets and budgets. |
| **PRINCIPAL / HOI** | `INSTITUTE` Authority | Institute-wide students, faculty leaves, department budgets, academic calendars. | Other institutes' internal administrative pipelines. |
| **UNIVERSITY_ADMIN** | `UNIVERSITY_WIDE` | Campus-wide management analytics, central user management, bulk import, notice broadcasts. | Unauthorized database direct drops. |
| **SUPER_ADMIN** | Global Master Governance | Full access across all 34 modules, RBAC role overrides, system configurations. | Password hash exposure (sanitized in projections). |

---

## 3. IDOR Defense Verification

- **Cross-Student Ticket Inspection**: Blocked with HTTP 403 Forbidden.
- **Cross-Student Attendance Modification**: Blocked with HTTP 403 Forbidden.
- **Cross-Department Notesheet Forwarding**: Enforced with strict jurisdictional routing.
- **Self-Approval Conflict Guard**: Proposers of student council events and budget requests cannot approve their own submissions (HTTP 403 Forbidden).
