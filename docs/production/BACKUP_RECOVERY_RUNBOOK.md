# SSIU ERP — BACKUP & DISASTER RECOVERY RUNBOOK
**Swarrnim Startup & Innovation University Enterprise Resource Planning System**  
**Version:** 7.12 (Disaster Recovery & Business Continuity Plan)  
**Date:** August 31, 2026  
**Auditor:** SSIU ERP Infrastructure & Business Continuity Board  

---

## 1. Objectives & SLA Targets

- **Recovery Point Objective (RPO)**: < 15 minutes (Maximum acceptable data loss window)
- **Recovery Time Objective (RTO)**: < 60 minutes (Maximum acceptable system downtime)
- **Backup Retention Period**:
  - Daily incremental backups: 30 days
  - Weekly full backups: 12 weeks
  - Monthly statutory archives (NAAC / UGC records): 7 years

---

## 2. Backup Architecture & Automation

1. **PostgreSQL Database**:
   - **Continuous WAL Archiving**: Postgres Write-Ahead Logs streamed continuously to encrypted Amazon S3 bucket (`s3://ssiu-db-backups-wal/`).
   - **Nightly Snapshot Cron**: Full physical snapshot executed at 02:00 IST every night.
2. **DMS Document Storage**:
   - Versioning enabled on S3 bucket.
   - Cross-region replication enabled between `ap-south-1` (Mumbai) and `ap-south-2` (Hyderabad).
3. **Application Configuration & Secrets**:
   - Encrypted in HashiCorp Vault / AWS Secrets Manager with versioned history.

---

## 3. Step-by-Step Restoration Runbook

### Scenario A: Accidental Table Corruption / Transaction Rollback (PITR)
```bash
# 1. Stop backend application cluster to halt incoming mutations
pm2 stop all

# 2. Restore PostgreSQL cluster to target timestamp before corruption
pg_restore_pitr --target-time="2026-08-31 09:45:00+05:30" --wal-dir="/backups/wal"

# 3. Verify data integrity & consistency
psql -d ${DB_NAME} -c "SELECT count(*) FROM \"Student\";"

# 4. Restart backend cluster
pm2 start all
```

### Scenario B: Complete Server / Infrastructure Loss (Cold Disaster Recovery)
```bash
# 1. Provision new EC2 / RDS instances in backup availability zone
terraform apply -var="env=production-dr"

# 2. Restore database from latest full dump + WAL replay
pg_restore -h ${DR_DB_HOST} -U ${DB_USER} -d ${DB_NAME} -v /backups/latest_full.dump

# 3. Update DNS CNAME records in Cloudflare to route traffic to DR instance
# 4. Run automated smoke tests
npx vitest run src/tests/fullErpIntegrationSecurityUAT.test.ts
```

---

## 4. Disaster Recovery Testing Schedule

Disaster recovery drills must be simulated quarterly on the isolated staging environment without disrupting live operations.
