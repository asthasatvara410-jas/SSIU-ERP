# ====================================================================
# SSIU ERP Enterprise Multi-Stage Production Dockerfile
# ====================================================================

# Stage 1: Build Dependencies & Compile Assets
FROM node:20-alpine AS builder

WORKDIR /app

# Install system utilities needed for building native modules
RUN apk add --no-cache libc6-compat python3 make g++

# Copy root and backend package definitions
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install root & backend dependencies
RUN npm install
RUN cd backend && npm install

# Copy Prisma schema and generate client
COPY backend/prisma ./backend/prisma
RUN cd backend && npx prisma generate

# Copy application source code
COPY . .

# Compile TypeScript and Vite production assets
RUN npm run build
RUN cd backend && npm run build

# ====================================================================
# Stage 2: Production Runtime
# ====================================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Add non-root system user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Install production dependencies only in backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Copy generated Prisma Client
COPY --from=builder /app/backend/node_modules/.prisma ./backend/node_modules/.prisma
COPY --from=builder /app/backend/node_modules/@prisma ./backend/node_modules/@prisma
COPY --from=builder /app/backend/prisma ./backend/prisma

# Copy compiled backend and frontend dist
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/dist ./dist

# Set permissions to non-root user
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose backend API and frontend static assets port
EXPOSE 3001

# Liveness & Readiness Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start production server
CMD ["node", "backend/dist/main"]
