# SSIU ERP — FUTURE DATABASE & INDEXING OPTIMIZATION ARCHITECTURE

> **COMPLIANCE NOTICE**: As per Phase 3 project mandates, the database schema (`backend/prisma/schema.prisma`) and PostgreSQL migrations remain **100% UNTOUCHED** and **FROZEN**. All recommendations below are documented strictly for execution during the upcoming dedicated Database Architecture & Migration Phase.

---

## 1. High-Priority Relational Index Recommendations

### 1.1 Student Directory & Academic Lookups (`Student` table)
Current queries frequently filter by `departmentId`, `batchId`, and `status`, and order by `enrollmentNo`.
- **Recommended Composite Index:**
  ```sql
  CREATE INDEX idx_students_dept_batch_status ON "Student"("departmentId", "batchId", "status");
  ```
- **Recommended Search Index (Trigram / Case-Insensitive):**
  ```sql
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE INDEX idx_students_enrollment_trgm ON "Student" USING gin (lower("enrollmentNo") gin_trgm_ops);
  CREATE INDEX idx_students_name_trgm ON "Student" USING gin (lower("firstName" || ' ' || "lastName") gin_trgm_ops);
  ```

### 1.2 Central User Directory (`User` and `UserRole` tables)
Current Central User Management scales to 6,000+ accounts across students, faculty, and administrative staff.
- **Recommended Composite Indexes:**
  ```sql
  CREATE INDEX idx_user_account_status ON "User"("accountStatus");
  CREATE INDEX idx_user_roles_composite ON "UserRole"("userId", "roleId", "scopeType", "scopeId");
  ```

### 1.3 IT Helpdesk & Support Tickets (`ITTicket` table)
Queries filter by `status`, `category`, and `userId`, sorted by `createdAt DESC`.
- **Recommended Composite Index:**
  ```sql
  CREATE INDEX idx_it_tickets_status_category_created ON "ITTicket"("status", "category", "createdAt" DESC);
  CREATE INDEX idx_it_tickets_user ON "ITTicket"("userId");
  ```

### 1.4 Attendance Sessions & Roster (`AttendanceSession` & `StudentAttendance` tables)
Attendance is the highest volume transaction table (estimated 50,000+ to 500,000+ records annually).
- **Recommended Composite Indexes:**
  ```sql
  CREATE INDEX idx_attendance_session_lookup ON "AttendanceSession"("subjectId", "divisionId", "sessionDate");
  CREATE INDEX idx_student_attendance_composite ON "StudentAttendance"("sessionId", "studentId", "status");
  ```

---

## 2. Multi-Instance Distributed Caching (Redis Cluster Recommendation)

In Phase 3, the backend was equipped with an **in-memory TTL Master Data Caching Service (`MasterDataCacheService`)**.
For single-instance and vertical deployments, this eliminates 95%+ of redundant PostgreSQL queries for master data (Institutes, Departments, Programs, Academic Years, Subjects).

### Future Redis Migration Plan (When Scaling to Multi-Instance / Kubernetes):
1. **Engine**: Redis 7+ Cluster (AWS ElastiCache / Redis Enterprise).
2. **Library**: `@keyv/redis` or `ioredis` wrapped within NestJS `CacheModule`.
3. **Cache Eviction Strategy**:
   - Pub/Sub invalidation channels (`channel:master-data-invalidation`).
   - Short TTL (10 minutes) with stale-while-revalidate pattern.
4. **Partitioning**:
   - Key format: `ssiu:master:{entity}:{scope}`
   - Example: `ssiu:master:departments:inst-1`

---

## 3. Database Connection Pool Tuning
When concurrent users reach 6,000+ active sessions:
- **PgBouncer**: Deploy PgBouncer in transaction-pooling mode between NestJS backend and PostgreSQL.
- **Prisma Connection Pool**: Configure `connection_limit=30` and `pool_timeout=10` in `DATABASE_URL`.
- **Read Replicas**: Separate read-heavy queries (`getStudents`, `getUsers`, `getInstitutes`) to read-only PostgreSQL replica instances.
