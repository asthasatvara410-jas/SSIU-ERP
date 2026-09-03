# SSIU ERP — PRODUCTION ENVIRONMENT & SECURITY CONFIGURATION CHECKLIST
**Swarrnim Startup & Innovation University Enterprise Resource Planning System**  
**Version:** 7.11 (Production Deployment Readiness)  
**Date:** August 31, 2026  
**Auditor:** SSIU ERP DevOps, Infosec & Infrastructure Team  

---

## 1. Environment Variable Audit & Secret Shielding

| Item / Configuration Key | Recommended Setting | Production Check | Verification Status | Notes |
|---|---|---|---|---|
| `NODE_ENV` | `production` | Set on host / container | `VERIFIED` | Disables debug stack traces in API errors |
| `DATABASE_URL` | Encrypted connection string with SSL | Private VPC endpoint | `VERIFIED` | Connection with `sslmode=require` |
| `JWT_SECRET` | 256-bit cryptographically random string | Server-side environment only | `VERIFIED` | Must never be bundled in client JavaScript |
| `JWT_REFRESH_SECRET` | Separate 256-bit random string | Server-side environment only | `VERIFIED` | Separate secret for long-lived refresh tokens |
| `GEMINI_API_KEY` | Restricted Google Cloud API key | Backend environment only | `VERIFIED` | Used by `AiHelpdeskService` with quota caps |
| `AWS_S3_BUCKET` / `MINIO_BUCKET` | Dedicated DMS storage bucket | Encrypted at rest (AES-256) | `VERIFIED` | Strict IAM policies for ERP service access |
| `PAYMENT_GATEWAY_KEY` | Live production merchant key | Backend KMS / Vault | `VERIFIED` | Webhook signatures verified cryptographically |
| `REDIS_URL` | Redis cluster with AUTH | Private VPC endpoint | `VERIFIED` | Session cache, rate limiting & job queues |
| `ABC_API_KEY` & `DIGILOCKER_SECRET` | Official Sandbox / Live keys | Backend environment only | `VERIFIED` | Secured under government integration service |

---

## 2. Infrastructure & Network Security Hardening

- [x] **HTTPS / TLS 1.3**: All incoming HTTP traffic automatically redirected to HTTPS with HSTS (`Strict-Transport-Security`).
- [x] **CORS Configuration**: Restrict allowed origins strictly to university domains (e.g. `https://erp.ssiu.ac.in`, `https://portal.ssiu.ac.in`).
- [x] **Secure Cookies**: All session and authentication cookies flagged with `HttpOnly`, `Secure`, and `SameSite=Strict`.
- [x] **Content Security Policy (CSP)**: Disallow inline unsafe eval, limit script and image sources to approved CDNs and self.
- [x] **Rate Limiting (DDoS Defense)**: Configured at reverse proxy (Nginx / Cloudflare) and API gateway (`ThrottlerModule` / 100 requests per minute per IP for standard routes, 5 requests per minute for `/api/auth/login`).
- [x] **Database Firewall**: PostgreSQL port `5432` accessible strictly from backend application cluster subnets.

---

## 3. Automated Backup & Disaster Recovery Runbook

1. **Daily Automated Snapshots**: Full automated database snapshot taken every night at 02:00 IST with 30-day retention.
2. **Point-in-Time Recovery (PITR)**: Write-Ahead Logs (WAL) continuously streamed to S3 bucket with 7-day granularity.
3. **DMS File Replication**: Cross-region replication enabled for student degree certificates and statutory compliance evidence.
4. **Disaster Recovery RTO & RPO**:
   - **RTO (Recovery Time Objective)**: < 60 minutes
   - **RPO (Recovery Point Objective)**: < 15 minutes
