# SSIU ERP — Phase 10: Missing Backend Features & Infrastructure Needs

**Project**: Swarrnim Startup & Innovation University (SSIU) ERP  
**Phase**: Phase 10 — Complete System-Wide Coverage Audit  
**Status**: Backend & Infrastructure Gap Catalog  

---

## 1. Backend Architecture Review

The NestJS backend implements **57 functional modules** and **60+ `@Controller` classes** covering all 34 core ERP domains.
No critical business domain is missing a REST API controller.

---

## 2. Infrastructure & Scale Gap Catalog

| Priority | Area | Identified Gap | Architectural Rationale & Recommended Evolution |
| :---: | :--- | :--- | :--- |
| **P1** | **Distributed Rate Limiting** | In-memory sliding-window limiter operates per single process | When deploying across horizontal multi-pod Kubernetes clusters, integrate Redis/KeyDB with `@nestjs/throttler` as documented in `FUTURE_PHASE9_DATABASE_REQUIREMENTS.md`. |
| **P1** | **Connection Pooling** | Direct PostgreSQL connections limited to single-node pool (`limit=30`) | When concurrency exceeds 1,000 active users, introduce PgBouncer or AWS RDS Proxy in transaction pooling mode. |
| **P2** | **Full-Text Search Engine** | SQL `ILIKE` parameterized pattern queries on student/faculty names | For datasets exceeding 50,000 student records, deploy PostgreSQL `tsvector` GIN indexes or Meilisearch/Elasticsearch for sub-5ms fuzzy search. |
| **P2** | **Background Async Job Queues** | Heavy Excel generation / bulk import processing runs in-process | Offload spreadsheet processing and PDF rendering to BullMQ / Redis background workers. |
| **P3** | **Webhook Subscriptions** | External government integrations (DigiLocker, ABC) use pull-based sync | Expose secured inbound webhook receiver endpoints with HMAC signature verification. |
