# SSIU ERP — Production Deployment & Operations Runbook

This document serves as the official operations guide for deploying, monitoring, backing up, and maintaining the SSIU ERP (Swarrnim Startup & Innovation University Enterprise Resource Planning) system in production environments.

---

## 1. System Requirements

* **Operating System:** Linux (Ubuntu 22.04 LTS or Alpine 3.19 recommended)
* **Runtime:** Node.js 20.x LTS or Docker Engine 24+ & Docker Compose v2+
* **Database:** PostgreSQL 15 or 16
* **Memory:** 4 GB RAM minimum (8 GB RAM recommended for multi-campus concurrency)
* **Storage:** 50 GB SSD minimum

---

## 2. Environment Variables Specification

Ensure the following variables are configured in the server environment (or `.env` file for backend service):

| Variable Name | Description | Example / Format |
|---|---|---|
| `NODE_ENV` | Environment identifier | `production` |
| `PORT` | Backend HTTP listening port | `3001` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/ssiu_erp_prod?schema=public` |
| `JWT_SECRET` | 256-bit cryptographically secure string | `(Set in secure cloud secrets manager)` |
| `JWT_EXPIRES_IN` | Token duration | `7d` |
| `GEMINI_API_KEY` | Google AI Studio API key | `AQ.Ab8RN6JW...` |
| `OPENAI_API_KEY` | (Optional) OpenAI API key | `sk-proj-...` |

> **IMPORTANT:** Never commit production `.env` files to git. Inject secrets via environment variables in your deployment runner or secret manager.

---

## 3. Production Deployment via Docker Compose (Recommended)

To deploy the full multi-tier stack (PostgreSQL + NestJS API + Frontend):

```bash
# 1. Clone the repository
git clone https://github.com/swarrnim-university/ssiu-erp.git
cd ssiu-erp

# 2. Configure environment secrets
cp backend/.env.example .env
nano .env

# 3. Build and launch containers in background
docker compose -f docker-compose.prod.yml up -d --build

# 4. Verify running services and health status
docker compose -f docker-compose.prod.yml ps
```

---

## 4. Production Deployment via PM2 (Process Manager)

For bare-metal / virtual private servers:

```bash
# 1. Install dependencies and compile assets
npm install
cd backend && npm install
npm run prisma:generate
cd .. && npm run build
cd backend && npm run build

# 2. Apply Prisma database migration
npx prisma migrate deploy --schema=prisma/schema.prisma

# 3. Start clustered PM2 instances
pm2 start ecosystem.config.js --env production

# 4. Save PM2 startup list to ensure boot persistence
pm2 save
pm2 startup
```

---

## 5. Database Operations & Backups

### Automated Backups
Run the backup script directly or schedule it via cron (`crontab -e`):

```bash
# Execute manual snapshot
./scripts/backup-db.sh

# Cron configuration for daily backup at 02:00 AM with 14-day retention:
# 0 2 * * * cd /opt/ssiu-erp && ./scripts/backup-db.sh >> /var/log/ssiu-db-backup.log 2>&1
```

### Database Restore
```bash
./scripts/restore-db.sh ./scripts/backup/ssiu_erp_backup_YYYYMMDD_HHMMSS.sql.gz
```

---

## 6. Liveness & Readiness Health Probes

* **Primary Health Probe:** `GET /health` (or `GET /api/v1/health`)
* **Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-08-30T10:00:00.000Z",
  "environment": "production",
  "api": {
    "name": "SSIU ERP Production Backend Services API",
    "status": "UP",
    "uptimeSeconds": 3600,
    "version": "1.0.0"
  },
  "database": {
    "provider": "postgresql",
    "status": "CONNECTED"
  }
}
```

---

## 7. Rollback Strategy

If an issue is detected during a deployment window:

```bash
# 1. Rollback code to previous stable git tag
git checkout tags/v1.0.0-stable

# 2. Recompile and restart with PM2
npm run build && cd backend && npm run build
pm2 reload ssiu-erp-backend --update-env
```
