# SSIU ERP — PRODUCTION DATABASE RELEASE & MIGRATION PROTOCOL
**Swarrnim Startup & Innovation University Enterprise Resource Planning System**  
**Version:** 7.12 (Database Release Runbook)  
**Date:** August 31, 2026  
**Auditor:** SSIU ERP Database Architecture & Migration Team  

---

## 1. Database Pre-Migration Invariants

Before executing any production migration:
1. **Never use destructive commands**: `prisma db push` and `prisma migrate reset` are strictly prohibited in the production release pipeline.
2. **Execute Full Automated Backup**: Verify that a pre-migration snapshot has been created and verified before applying DDL updates.
3. **Additive Schema Only**: Confirm that every migration adds models, optional columns, or indexed foreign keys without altering existing production columns.

---

## 2. Pre-Migration Backup Procedure

Execute the pre-migration snapshot command:

```bash
# 1. Take a timestamped PostgreSQL binary dump
pg_dump -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} -F c -b -v -f "/backups/ssiu_erp_pre_stage7_12_$(date +%Y%m%d_%H%M%S).dump"

# 2. Verify backup checksum and size
ls -lh /backups/ssiu_erp_pre_stage7_12_*.dump
```

---

## 3. Production Migration Execution

```bash
# 1. Inspect pending migration status
npx prisma migrate status

# 2. Deploy pending migrations forward non-destructively
npx prisma migrate deploy

# 3. Verify Prisma Client schema synchronization
npx prisma generate
```

---

## 4. Post-Migration Verification Queries

Verify that all Stage 7.1 to 7.10 tables and indexes are present and active:

```sql
-- Check existence of Stage 7 new enterprise tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'AnonymousCaseIdentity', 
    'AntiRaggingCase', 
    'ICCCase', 
    'GrievanceCommittee', 
    'StartupResearchGrant', 
    'AcademicBankOfCredit', 
    'AccreditationSnapshot'
  );

-- Verify index health
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('GrievanceCase', 'StartupResearchGrant', 'AccreditationSnapshot');
```

---

## 5. Rollback & Emergency Recovery Protocol

In the unlikely event of migration failure:
1. The database remains intact because migrations execute inside a transactional DDL block (`BEGIN ... COMMIT`).
2. If manual rollback is necessary:
   ```bash
   pg_restore -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} --clean --if-exists -v "/backups/ssiu_erp_pre_stage7_12_<timestamp>.dump"
   ```
3. Point-in-Time Recovery (PITR) WAL logs allow restoration to any precise second within the last 7 days.
