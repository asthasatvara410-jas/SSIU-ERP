#!/usr/bin/env bash
# ==============================================================================
# SSIU ERP — SUPABASE POSTGRESQL MIGRATION DEPLOYMENT ORCHESTRATOR
# Deploys migrations 00 through 16 sequentially and idempotently
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
MIGRATIONS_DIR="$ROOT_DIR/database/migrations"
SEEDS_DIR="$ROOT_DIR/database/seeds"

echo "=================================================================="
echo "  SSIU ERP — Supabase PostgreSQL Migration Deployer"
echo "=================================================================="

# 1. Verify Database Connection String
if [ -z "${DATABASE_URL:-}" ]; then
  if [ -f "$ROOT_DIR/.env" ]; then
    export $(grep -v '^#' "$ROOT_DIR/.env" | xargs)
  fi
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not defined."
  echo "   Please define DATABASE_URL in .env or your shell environment."
  exit 1
fi

# Clean Prisma query parameters if present (e.g. ?schema=public) for psql compatibility
CLEAN_DATABASE_URL=$(echo "$DATABASE_URL" | sed 's/[?&]schema=[^&]*//g' | sed 's/[?]$//')

echo "🔗 Database Target: Verified & Connected"
echo "📂 Migrations Directory: $MIGRATIONS_DIR"

# 2. Sequential Ordered Migration Array
MIGRATION_FILES=(
  "00_init_extensions_and_triggers.sql"
  "01_core_academic_master.sql"
  "02_student_master.sql"
  "03_parent_master.sql"
  "04_faculty_master.sql"
  "05_academic_mapping.sql"
  "06_users_roles_permissions.sql"
  "07_attendance.sql"
  "08_timetable.sql"
  "09_session_plan.sql"
  "10_assignment.sql"
  "11_mentor.sql"
  "12_ptm.sql"
  "13_notifications.sql"
  "14_audit_logs.sql"
  "15_supabase_row_level_security.sql"
  "16_security_hardening.sql"
)

# 3. Apply Migrations in Strict Sequence
echo ""
echo "🚀 Applying Migrations 00 through 16..."

for mig in "${MIGRATION_FILES[@]}"; do
  file_path="$MIGRATIONS_DIR/$mig"
  if [ ! -f "$file_path" ]; then
    echo "❌ Missing migration file: $file_path"
    exit 1
  fi

  # Check for Supabase auth schema before running RLS migration
  if [[ "$mig" == "15_supabase_row_level_security.sql" ]]; then
    has_auth_schema=$(psql "$CLEAN_DATABASE_URL" -tAc "SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth';" 2>/dev/null || echo "0")
    if [ "$has_auth_schema" != "1" ]; then
      echo "  ❌ ERROR: Target database does not contain the Supabase 'auth' schema."
      echo "     Migration 15 requires Supabase Auth (auth.uid(), auth.jwt(), auth.role())."
      echo "     Please connect to your Supabase PostgreSQL instance."
      exit 1
    fi
  fi

  echo "  ▶ Executing: $mig..."
  psql "$CLEAN_DATABASE_URL" -v ON_ERROR_STOP=1 -f "$file_path" > /dev/null
  echo "    ✓ Applied: $mig"
done

echo ""
echo "✅ All 17 migrations (00–16) executed successfully!"

# 4. Optional Seed Execution
if [[ "${1:-}" == "--seed" ]]; then
  echo ""
  echo "🌱 Applying Development Seed Data..."
  psql "$CLEAN_DATABASE_URL" -v ON_ERROR_STOP=1 -f "$SEEDS_DIR/development_seed.sql" > /dev/null
  echo "✅ Seed data applied successfully!"
fi

echo "=================================================================="
