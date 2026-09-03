# SSIU ERP — Future Database, Concurrency & Infrastructure Architecture

**Document**: Phase 9 Production Scale & Infrastructure Strategy  
**Project**: Swarrnim Startup & Innovation University (SSIU) ERP  
**Target Deployment Scale**: 6,000+ Accounts, 500+ Concurrent Requests, Multi-Instance Resilience  
**Author**: Antigravity Enterprise Architecture Team  
**Date**: September 2026  

---

## 1. Executive Overview

This specification details database connection pooling strategies, index optimization blueprints, query performance guidelines, and distributed rate-limiting infrastructure required for scaling the SSIU ERP beyond a single-node deployment to a high-availability, horizontally scaled cloud cluster.

---

## 2. PostgreSQL Connection Pool Strategy

### 2.1 Single-Node Production Sizing
In single-instance deployments, the NestJS backend interfaces directly with PostgreSQL via Prisma Client.
- **Default Prisma Sizing**: `num_physical_cpus * 2 + 1`.
- **Recommended Production Tuning**:
  In `backend/.env`, configure `DATABASE_URL` with explicit connection limits and timeouts:
  ```env
  DATABASE_URL="postgresql://user:password@pg-primary.internal:5432/ssiu_erp?schema=public&connection_limit=30&pool_timeout=20&connect_timeout=10"
  ```
  - `connection_limit=30`: Ensures sufficient connections for up to 500 concurrent HTTP requests without exhausting PostgreSQL's `max_connections` (typically set to 100–200).
  - `pool_timeout=20`: Sets a 20-second queue timeout for acquiring a connection from the pool before rejecting requests with error `P2024`.
  - `connect_timeout=10`: Prevents blocking on unresponsive network sockets during database failover.

### 2.2 Multi-Instance / Horizontally Scaled Architecture
When running multiple NestJS app replicas (e.g. 4 Kubernetes pods or 4 PM2 cluster nodes):
- 4 instances $\times$ 30 connections = 120 total direct connections.
- **Architectural Requirement**: Deploy **PgBouncer** or **AWS RDS Proxy** in transaction pooling mode (`pool_mode = transaction`).
- **Benefits**:
  1. Allows 1,000+ client HTTP connections to share 25–50 physical PostgreSQL backend connections.
  2. Protects database CPU and RAM from connection allocation thrashing.
  3. Eliminates `P2024: Timed out fetching a connection from the pool` under burst traffic.

---

## 3. Distributed Rate Limiting (Redis / KeyDB Requirement)

### 3.1 Single-Node vs. Multi-Node Reality
- In Phase 9, SSIU ERP implemented a high-performance, in-memory sliding-window `RateLimiterGuard` (zero external dependencies).
- **Limitation**: In-memory rate limiting tracks counters in local Node.js process memory. If 4 backend instances run behind a round-robin load balancer, an attacker's requests are distributed across 4 nodes, effectively quadrupling their allowed rate limit (e.g., $4 \times 10 = 40$ requests/min).
- **Future Production Requirement**:
  Deploy a managed Redis or KeyDB instance and configure `@nestjs/throttler` with `ThrottlerStorageRedisService`:
  ```typescript
  // Recommended future multi-node configuration
  ThrottlerModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
      throttlers: [{ ttl: 60000, limit: 10 }],
      storage: new ThrottlerStorageRedisService(config.get('REDIS_URL')),
    }),
  })
  ```

---

## 4. Query Execution & Transaction Guidelines

1. **Transaction Duration Limit**: Keep all `prisma.$transaction()` executions under 100 milliseconds. Never perform external network calls, file I/O, or email dispatch inside a database transaction block.
2. **Strict Field Projections**: Always provide explicit `select` blocks on high-volume models (`User`, `Student`, `Employee`, `AttendanceApplication`) rather than querying full entity graphs.
3. **Bounded Query Limits**: Enforce maximum `take: 100` on all paginated search/list endpoints.

---

## 5. Summary of Zero-Migration Guarantee

Phase 9 maintains **0 schema changes** and **0 migrations**, preserving absolute backward compatibility across all 8 previous phases while establishing the performance and infrastructure blueprint for enterprise production deployment.
