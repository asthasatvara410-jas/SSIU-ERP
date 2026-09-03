# SSIU ERP — Phase 10: Codebase Duplication & Consolidation Audit

**Project**: Swarrnim Startup & Innovation University (SSIU) ERP  
**Phase**: Phase 10 — Complete System-Wide Coverage Audit  
**Status**: Duplication Audit & Canonical Source Mapping  

---

## 1. Executive Summary

During the whole-repository audit, code patterns across `src/services/` and `backend/src/` were evaluated to identify parallel implementations, legacy helpers, or dual data stores.

---

## 2. Identified Duplications & Canonical Sources

| # | Duplicated Area | Legacy / Local Store | Canonical Live Source | Consolidation Action & Strategy |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Master Data Service** | `src/services/db.ts` (in-memory initial state) | `src/services/databaseService.ts` & `backend/src/core-masters/` | `databaseService.ts` queries `/api/v1/institutes` and `/api/v1/departments` with in-memory TTL caching (sub-3ms hits); fallback to seed data occurs only on offline disconnection. |
| **2** | **Student Profile Queries** | `src/services/studentMasterService.ts` | `src/services/studentProfileAccessService.ts` & `backend/src/core-masters/` | `studentProfileAccessService.ts` serves as canonical client wrapper for `/api/v1/students`. |
| **3** | **Helpdesk Ticket APIs** | `src/services/supportTicketService.ts` (deprecated) | `src/services/helpdeskService.ts` & `backend/src/it-helpdesk/` | `helpdeskService.ts` serves as canonical client for `/api/v1/it/tickets` with full multi-category and internal note support. |
| **4** | **Notice Board Service** | `src/services/notificationService.ts` (generic) | `src/services/noticeService.ts` & `backend/src/notices/` | `noticeService.ts` serves as canonical client for `/api/v1/notices` with audience scoping. |
| **5** | **Management Analytics** | `src/services/dashboardKpiService.ts` (local) | `src/services/managementAnalyticsService.ts` & `backend/src/analytics/` | `managementAnalyticsService.ts` serves as canonical client for `/api/v1/analytics/management/*`. |

---

## 3. Consolidation Safety Guidelines

- **No Destructive Removals**: Legacy client-side data structures in `db.ts` are preserved to guarantee that offline preview modes, demo logins, and unit test mocks remain functional without breaking existing components.
- **Progressive Migration**: All primary pages (Admin Portal, Dashboard, Students, Notesheets, Helpdesk, Notices, Council) consume the canonical live REST services.
