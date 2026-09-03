/**
 * SSIU ERP — Unit Tests: Database Health & Architecture Module
 * File: src/modules/database/tests/databaseHealthMonitor.test.ts
 */

import { describe, it, expect } from 'vitest';
import { databaseHealthMonitorService } from '../services/databaseHealthMonitorService';

describe('SSIU ERP — Database Health & Architecture Module Engine', () => {
  it('TEST 1: Retrieves database engine status and active connection metrics', () => {
    const health = databaseHealthMonitorService.getDatabaseHealthStatus();

    expect(health).toBeDefined();
    expect(health.engine).toBe('PostgreSQL 16');
    expect(health.status).toBe('HEALTHY');
    expect(health.averageQueryLatencyMs).toBeGreaterThan(0);
    expect(health.activeConnectionsCount).toBeGreaterThan(0);
  });

  it('TEST 2: Retrieves core table metrics and record counts', () => {
    const tables = databaseHealthMonitorService.getTableMetrics();

    expect(tables.length).toBeGreaterThanOrEqual(5);
    const studentTable = tables.find(t => t.tableName === 'students');
    expect(studentTable).toBeDefined();
    expect(studentTable?.hasForeignKeys).toBe(true);
    expect(studentTable?.rowCount).toBeGreaterThanOrEqual(1);
  });

  it('TEST 3: Retrieves read-only Prisma schema models without altering database state', () => {
    const models = databaseHealthMonitorService.getPrismaSchemaModels();

    expect(models.length).toBeGreaterThanOrEqual(5);
    const uniModel = models.find(m => m.modelName === 'University');
    expect(uniModel).toBeDefined();
    expect(uniModel?.primaryKey).toContain('UUID');
    expect(uniModel?.isAuditLogged).toBe(true);
  });
});
