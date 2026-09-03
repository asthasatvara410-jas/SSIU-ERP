/**
 * SSIU ERP — Database Architecture & Health Monitoring Types
 * File: src/modules/database/types/index.ts
 */

export interface DatabaseHealthStatusDTO {
  engine: 'PostgreSQL 16' | 'IndexedDB State Engine';
  status: 'HEALTHY' | 'DEGRADED' | 'DISCONNECTED';
  activeConnectionsCount: number;
  maxPoolSize: number;
  averageQueryLatencyMs: number;
  totalTablesCount: number;
  totalEstimatedRows: number;
  lastCheckedAt: string;
}

export interface TableRecordMetricDTO {
  tableName: string;
  category: 'CORE_MASTERS' | 'STUDENTS' | 'FACULTY_HR' | 'ACADEMICS' | 'EXAMINATIONS' | 'FINANCE_FEES' | 'CAMPUS_LOGISTICS';
  rowCount: number;
  hasForeignKeys: boolean;
  indexedColumnsCount: number;
  storageUsageEstimateKb: number;
}

export interface PrismaModelSchemaDTO {
  modelName: string;
  description: string;
  fieldCount: number;
  primaryKey: string;
  relationsCount: number;
  isAuditLogged: boolean;
}
