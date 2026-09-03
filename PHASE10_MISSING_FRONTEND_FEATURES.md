# SSIU ERP — Phase 10: Missing Frontend Features & Enhancement Catalog

**Project**: Swarrnim Startup & Innovation University (SSIU) ERP  
**Phase**: Phase 10 — Complete System-Wide Coverage Audit  
**Status**: Feature Audit & Enhancement Roadmap  

---

## 1. Prioritization Framework

- **P0 (Security & Critical Integrity)**: Zero gaps found. All authentication, RBAC, IDOR boundaries, error sanitization, and rate limiting mechanisms are active in the UI.
- **P1 (Core ERP Operational Gaps)**: UI extensions for deep-niche administrative sub-workflows that currently exist in backend APIs.
- **P2 (Operational Polish & Extended Analytics)**: Advanced filtering, batch actions, and export buttons.
- **P3 (Cosmetic / Enhancements)**: UI micro-animations and UX refinements.

---

## 2. Identified Frontend Enhancement Areas

| Priority | Module | Feature / Component | Backend API Exists? | Description & Recommended UI Extension |
| :---: | :--- | :--- | :---: | :--- |
| **P1** | **DigiLocker** | Sync Retry Action Button | `POST /api/v1/digilocker/retry` | Add explicit manual retry button in document verification modal when government gateway returns timeout. |
| **P1** | **Hostel Gate Pass** | Batch Checkout Modal | `POST /api/v1/hostel/gate-passes/batch-checkout` | Add warden bulk scanning view to check out entire sports team or bus group simultaneously. |
| **P2** | **Student Council** | Meeting Action Item Reassignment | `PATCH /api/v1/student-council/meetings/:id/actions` | Enable changing action item assignees directly in published MoM view. |
| **P2** | **PTM Logs** | Direct CSV Export Button | `GET /api/v1/communications/export` | Add one-click CSV export button to PTM communication log table. |
| **P2** | **IT Helpdesk** | SLA Escalation Indicator Badge | `GET /api/v1/it/tickets` | Display visual countdown badge when a high-priority ticket is nearing its SLA resolution deadline. |
| **P3** | **Examinations** | Seating Plan Heatmap Preview | `GET /api/v1/exams/centres` | Visual seat layout heatmap showing exam hall occupancy percentage. |
