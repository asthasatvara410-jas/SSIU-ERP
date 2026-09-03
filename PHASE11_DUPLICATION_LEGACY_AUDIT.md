# SSIU ERP — Phase 11: Codebase Duplication & Legacy Store Audit

**Project**: Swarrnim Startup & Innovation University (SSIU) ERP  
**Phase**: Phase 11 — Final Deep System Audit & Production Gap Closure  
**Status**: Codebase Duplication & Canonical Store Classification  

---

## 1. Executive Summary

This document establishes the canonical single source of truth across all ERP domains, cataloging legacy and auxiliary stores to ensure non-destructive maintenance.

---

## 2. Canonical vs. Auxiliary Store Mapping

| Domain | Auxiliary Store | Canonical Live Service | Backend REST Controller | Architectural Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **Core Masters** | `src/services/db.ts` | `src/services/databaseService.ts` | `CoreMastersController` (`/api/v1/institutes`, `/api/v1/departments`) | `databaseService.ts` executes live API queries with in-memory TTL caching. `db.ts` is retained as an offline safety fallback. |
| **Students** | `src/services/studentMasterService.ts` | `src/services/studentProfileAccessService.ts` | `CoreMastersController` (`/api/v1/students`) | `studentProfileAccessService.ts` is the active client used across the student directory. |
| **Helpdesk** | `src/services/supportTicketService.ts` | `src/services/helpdeskService.ts` | `ItHelpdeskController` (`/api/v1/it/tickets`) | `helpdeskService.ts` is the canonical multi-category service. |
| **Notices** | `src/services/notificationService.ts` | `src/services/noticeService.ts` | `NoticesController` (`/api/v1/notices`) | `noticeService.ts` is the canonical audience-scoped service. |
| **Analytics** | `src/services/dashboardKpiService.ts` | `src/services/managementAnalyticsService.ts` | `AnalyticsController` (`/api/v1/analytics/management/*`) | `managementAnalyticsService.ts` is the canonical executive service. |

---

## 3. Codebase Cleanliness Assessment

- **Dead / Unreachable Routes**: 0 dead routes found. Every route defined in `src/App.tsx` corresponds to an active component and navigation config entry.
- **Circular Dependencies**: 0 circular imports detected during Vite production bundling.
- **TypeScript Type Safety**: Clean compilation with 0 compiler errors.
