#!/bin/bash
# ====================================================================
# SSIU ERP Safe PostgreSQL Database Restore Script
# ====================================================================
set -e

BACKUP_FILE="$1"

if [ -z "${BACKUP_FILE}" ]; then
  echo "Usage: $0 <path_to_backup_file.sql.gz>"
  exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

echo "===================================================================="
echo "WARNING: Restoring database from ${BACKUP_FILE}"
echo "===================================================================="

if [ -n "${DATABASE_URL}" ]; then
  gunzip -c "${BACKUP_FILE}" | psql "${DATABASE_URL}"
else
  PGHOST="${PGHOST:-localhost}"
  PGPORT="${PGPORT:-5432}"
  PGUSER="${PGUSER:-ssiu_admin}"
  PGDATABASE="${PGDATABASE:-ssiu_erp_prod}"

  PGPASSWORD="${PGPASSWORD}" gunzip -c "${BACKUP_FILE}" | psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${PGDATABASE}"
fi

echo "✅ Database restore completed successfully."
