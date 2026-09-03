#!/bin/bash
# ====================================================================
# SSIU ERP Automated PostgreSQL Backup Script
# ====================================================================
set -e

BACKUP_DIR="${BACKUP_DIR:-./scripts/backup}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="ssiu_erp_backup_${TIMESTAMP}.sql.gz"
BACKUP_FILEPATH="${BACKUP_DIR}/${BACKUP_FILENAME}"

mkdir -p "${BACKUP_DIR}"

echo "===================================================================="
echo "Starting SSIU ERP PostgreSQL Database Backup: ${TIMESTAMP}"
echo "===================================================================="

# If DATABASE_URL is set, use pg_dump with connection string; otherwise use standard PG environment variables
if [ -n "${DATABASE_URL}" ]; then
  echo "Executing pg_dump using DATABASE_URL..."
  pg_dump "${DATABASE_URL}" | gzip > "${BACKUP_FILEPATH}"
else
  PGHOST="${PGHOST:-localhost}"
  PGPORT="${PGPORT:-5432}"
  PGUSER="${PGUSER:-ssiu_admin}"
  PGDATABASE="${PGDATABASE:-ssiu_erp_prod}"

  echo "Executing pg_dump for database ${PGDATABASE} on ${PGHOST}:${PGPORT}..."
  PGPASSWORD="${PGPASSWORD}" pg_dump -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${PGDATABASE}" | gzip > "${BACKUP_FILEPATH}"
fi

BACKUP_SIZE=$(ls -lh "${BACKUP_FILEPATH}" | awk '{print $5}')
echo "✅ Database backup created successfully: ${BACKUP_FILEPATH} (Size: ${BACKUP_SIZE})"

# Enforce retention policy: remove backups older than RETENTION_DAYS
echo "Applying retention policy (${RETENTION_DAYS} days)..."
find "${BACKUP_DIR}" -name "ssiu_erp_backup_*.sql.gz" -type f -mtime +"${RETENTION_DAYS}" -exec rm -f {} \;
echo "✅ Retention cleanup complete."
