#!/bin/bash
# ==============================================================================
# SSIU ERP — PostgreSQL Database Migration & Prisma Sync Script
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"

echo "=================================================================="
echo "  SSIU ERP — PostgreSQL Migration & Prisma Type Generation"
echo "=================================================================="

cd "$BACKEND_DIR"

# 1. Check if .env exists
if [ ! -f .env ]; then
  echo "⚠️ Warning: backend/.env not found. Please ensure DATABASE_URL is set."
fi

# 2. Generate Prisma Client Types
echo ""
echo "📦 Step 1: Generating Prisma Client Types..."
npx prisma generate --schema=prisma/schema.prisma

# 3. Execute Migration
echo ""
echo "🗄️ Step 2: Executing Database Migration (erp_schema_update)..."
npx prisma migrate dev --name erp_schema_update --schema=prisma/schema.prisma

echo ""
echo "✅ SUCCESS: Database schema synchronized and Prisma Client updated!"
echo "=================================================================="
